console.log("📌 Ejecutando server desde:", __dirname);

// ============================================================
//  IMPORTACIONES
// ============================================================
const express = require("express");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");


// ============================================================
//  CONFIGURACIÓN DEL SERVIDOR
// ============================================================
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));


const admin = require("firebase-admin");

// ============================================================
//  CONFIGURACIÓN FIREBASE (BASE DE DATOS)
// ============================================================
let serviceAccount;

console.log("🔌 Iniciando configuración de Firebase...");

try {
    if (process.env.FIREBASE_CREDENTIALS) {
        console.log("☁ Detectada variable de entorno FIREBASE_CREDENTIALS. (Longitud: " + process.env.FIREBASE_CREDENTIALS.length + " caracteres)");

        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
            console.log("✅ JSON de credenciales parseado correctamente. Project ID:", serviceAccount.project_id);
        } catch (jsonError) {
            console.error("❌ ERROR: El contenido de FIREBASE_CREDENTIALS no es un JSON válido.");
            console.error("Detalle:", jsonError.message);
            throw new Error("Credenciales inválidas");
        }

    } else {
        console.log("🏠 No hay variable de entorno. Buscando archivo local 'serviceAccountKey.json'...");
        if (fs.existsSync(path.join(__dirname, "serviceAccountKey.json"))) {
            serviceAccount = require("./serviceAccountKey.json");
        } else {
            console.warn("⚠ ADVERTENCIA: No se encontró archivo local ni variable de entorno.");
        }
    }

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("✔ Firebase Conectado Exitosamente!");
    } else {
        console.error("❌ No se pudieron cargar las credenciales. La base de datos no funcionará.");
    }

} catch (error) {
    console.error("❌ ERROR CRÍTICO AL CONECTAR FIREBASE:", error.message);
}

const db = admin.apps.length ? admin.firestore() : null;


// ============================================================
//  API: LEER MENU
// ============================================================
app.get("/api/menu", (req, res) => {
    const rutaMenu = path.join(__dirname, "Menu.txt");

    fs.readFile(rutaMenu, "utf8", (err, data) => {
        if (err) return res.json([]);

        const lineas = data
            .split("\n")
            .map(l => l.trim())
            .filter(l => l);

        const menu = [];

        lineas.forEach(linea => {
            const [cabecera, ...resto] = linea.split(",");
            const partes = cabecera.split(".");
            let numero = partes[0];
            let subnumero = null;
            let titulo = "";

            if (partes.length > 2) {
                subnumero = partes[0] + "." + partes[1];
                titulo = partes.slice(2).join(".").trim();
            } else {
                titulo = cabecera.substring(cabecera.indexOf(".") + 1).trim();
            }

            const item = {
                numero,
                subnumero,
                titulo,
                link: null,
                carpeta: null,
                file: null
            };

            resto.forEach(seg => {
                seg = seg.trim();
                if (seg.startsWith("Link:")) item.link = seg.replace("Link:", "").trim();
                if (seg.startsWith("Carpeta:")) item.carpeta = seg.replace("Carpeta:", "").trim();
                if (seg.startsWith("File:") || seg.startsWith("file:")) item.file = seg.replace(/File:|file:/, "").trim();
            });

            menu.push(item);
        });

        res.json(menu);
    });
});


// ============================================================
//  FICHAS EPIDEMIOLOGICAS Y ALERTAS (Mejorado)
// ============================================================
function encontrarCarpetaReal(nombreBuscado) {
    const root = __dirname;
    const archivos = fs.readdirSync(root);
    // Busca una carpeta que coincida ignorando mayúsculas
    const nombreReal = archivos.find(a => a.toLowerCase() === nombreBuscado.toLowerCase());
    return nombreReal ? path.join(root, nombreReal) : null;
}

function listarPDFs(res, nombreCarpeta) {
    const rutaReal = encontrarCarpetaReal(nombreCarpeta);

    if (!rutaReal) {
        console.error(`❌ Carpeta no encontrada: ${nombreCarpeta}`);
        return res.json([]);
    }

    fs.readdir(rutaReal, (err, archivos) => {
        if (err) {
            console.error(`❌ Error leyendo carpeta ${rutaReal}:`, err);
            return res.json([]);
        }
        const pdfs = archivos.filter(a => a.toLowerCase().endsWith(".pdf"));
        res.json(pdfs);
    });
}

app.get("/api/fichas", (req, res) => listarPDFs(res, "Fichas"));
app.get("/api/alertas", (req, res) => listarPDFs(res, "Alertas"));

// ============================================================
//  MIDDLEWARE PARA ARCHIVOS INSENSIBLES A MAYÚSCULAS
// ============================================================
function serveStaticCaseInsensitive(folderName) {
    return (req, res, next) => {
        const filePath = path.join(__dirname, folderName, req.path);

        // 1. Intenta servirlo tal cual
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }

        // 2. Si no existe, busca ignorando mayúsculas/minúsculas
        const dir = path.dirname(filePath);
        const baseName = path.basename(filePath).toLowerCase();

        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            const found = files.find(f => f.toLowerCase() === baseName);
            if (found) {
                return res.sendFile(path.join(dir, found));
            }
        }

        // 3. Si no encuentra nada, pasa al siguiente (404)
        next();
    };
}

app.use("/fichas", serveStaticCaseInsensitive("Fichas"));
app.use("/alertas", serveStaticCaseInsensitive("Alertas"));
app.use("/Boletines", serveStaticCaseInsensitive("Boletines"));
app.use("/Logos", serveStaticCaseInsensitive("Logos"));


// ============================================================
//  EQUIPO
// ============================================================
app.get("/api/equipo", (req, res) => {
    const ruta = path.join(__dirname, "Equipo.txt");

    fs.readFile(ruta, "utf8", (err, data) => {
        if (err) return res.json({ error: true, data: [] });

        const lineas = data
            .split("\n")
            .map(l => l.trim())
            .filter(l => l);

        res.json({ error: false, data: lineas });
    });
});


// ============================================================
//  FORMULARIO → GUARDAR EN FIREBASE
// ============================================================
app.post("/api/peticion", async (req, res) => {
    const { dni, nombre, telefono, asunto } = req.body;

    if (!dni || !nombre || !telefono || !asunto)
        return res.json({ ok: false, msg: "Datos incompletos" });

    try {
        if (db) {
            // Guardar en Firestore -> colección "peticiones"
            await db.collection("peticiones").add({
                dni,
                nombre,
                telefono,
                asunto,
                fecha: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log("✔ Petición guardada en Firebase");
            return res.json({ ok: true });
        } else {
            console.error("❌ Firebase no está conectado.");
            return res.json({ ok: false, msg: "Base de datos no disponible. Verifica credenciales." });
        }
    } catch (err) {
        console.error("❌ ERROR:", err);
        return res.json({ ok: false, msg: "Error interno" });
    }
});

// ============================================================
//  CEX – ANALISIS AMBULATORIO
// ============================================================
const RUTA_CEX = path.join(__dirname, "Data", "Perfiles", "CEX");

// --- LISTAR PERIODOS ---
app.get("/api/cex/periodos", (req, res) => {
    fs.readdir(RUTA_CEX, (err, files) => {
        if (err) {
            console.error("❌ Error leyendo carpeta CEX", err);
            return res.json([]);
        }

        const periodos = files
            .filter(f => f.toLowerCase().endsWith(".txt"))
            .map(f => {
                // 205_20230101_20230131_AtenMedxServ.txt
                const base = f.replace(".txt", "");
                const partes = base.split("_");

                return {
                    file: f,
                    desde: partes[1],
                    hasta: partes[2]
                };
            })
            .sort((a, b) => a.desde.localeCompare(b.desde));

        res.json(periodos);
    });
});

// --- LEER DATA DEL PERIODO ---
app.get("/api/cex/data", (req, res) => {
    const archivo = req.query.file;
    if (!archivo) return res.json([]);

    const rutaArchivo = path.join(RUTA_CEX, archivo);
    if (!fs.existsSync(rutaArchivo)) return res.json([]);

    const contenido = fs.readFileSync(rutaArchivo, "utf8");
    const lineas = contenido
        .split("\n")
        .map(l => l.trim())
        .filter(l => l);

    if (lineas.length < 2) return res.json([]);

    const headers = lineas[0].split("|").map(h => h.trim());

    const data = lineas.slice(1).map(linea => {
        const cols = linea.split("|");
        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = (cols[i] || "").trim();
        });
        return obj;
    });

    res.json(data);
});

// ============================================================
//  INICIAR SERVIDOR
// ============================================================
app.listen(PORT, () => {
    console.log("Servidor ejecutándose en http://localhost:" + PORT);
});
