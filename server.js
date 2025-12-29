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


const mongoose = require("mongoose");
require("dotenv").config();

// ============================================================
//  CONFIGURACIÓN MONGODB
// ============================================================
// Esquema de la base de datos
const PeticionSchema = new mongoose.Schema({
    dni: String,
    nombre: String,
    telefono: String,
    asunto: String,
    fecha: { type: Date, default: Date.now }
});

const Peticion = mongoose.model("Peticion", PeticionSchema);

// Conexión a la base de datos
const connectionString = process.env.MONGO_URI;
if (connectionString) {
    mongoose.connect(connectionString)
        .then(() => console.log("✔ Conectado a MongoDB"))
        .catch(err => console.error("❌ Error conectando a MongoDB:", err));
} else {
    console.log("⚠ No se detectó MONGO_URI. Las peticiones no se guardarán en BD.");
}


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
//  FICHAS EPIDEMIOLOGICAS
// ============================================================
function listarPDFs(res, carpeta) {
    fs.readdir(carpeta, (err, archivos) => {
        if (err) return res.json([]);
        const pdfs = archivos.filter(a => a.toLowerCase().endsWith(".pdf"));
        res.json(pdfs);
    });
}

app.get("/api/fichas", (req, res) =>
    listarPDFs(res, path.join(__dirname, "Fichas"))
);

app.use("/fichas", express.static(path.join(__dirname, "Fichas")));


// ============================================================
//  ALERTAS
// ============================================================
app.get("/api/alertas", (req, res) =>
    listarPDFs(res, path.join(__dirname, "Alertas"))
);

app.use("/alertas", express.static(path.join(__dirname, "Alertas")));


// ============================================================
//  BOLETINES
// ============================================================
app.use("/Boletines", express.static(path.join(__dirname, "Boletines")));


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
//  FORMULARIO → GUARDAR EN MONGODB
// ============================================================
app.post("/api/peticion", async (req, res) => {
    const { dni, nombre, telefono, asunto } = req.body;

    if (!dni || !nombre || !telefono || !asunto)
        return res.json({ ok: false, msg: "Datos incompletos" });

    try {
        if (mongoose.connection.readyState === 1) {
            // Guardar en MongoDB
            const nuevaPeticion = new Peticion({ dni, nombre, telefono, asunto });
            await nuevaPeticion.save();
            console.log("✔ Petición guardada en MongoDB");
            return res.json({ ok: true });
        } else {
            console.error("❌ MongoDB no está conectado.");
            return res.json({ ok: false, msg: "Base de datos no disponible" });
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
