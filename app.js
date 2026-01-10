/* ============================================================
   UTILIDADES GENERALES
============================================================ */
function ocultarTarjetas() {
    const content = document.getElementById("contentBox");
    const visor = document.getElementById("visorFlipFull");
    const frame = document.getElementById("flipFrame");
    const equipo = document.getElementById("equipoBox");

    if (content) content.style.display = "none";
    if (visor) visor.style.display = "none";
    if (frame) frame.src = "";
    if (equipo) equipo.style.display = "none";
}

/* ============================================================
   QUIÉNES SOMOS (ORIGINAL FUNCIONAL)
============================================================ */
function mostrarEquipo() {

    ocultarTarjetas();

    fetch("/api/equipo")
        .then(r => r.json())
        .then(obj => {
            document.getElementById("equipoTexto").innerHTML =
                obj.data.map(l => `<div>${l}</div>`).join("");
        });

    const box = document.getElementById("equipoBox");
    box.style.display = "block";
    box.style.animationName = "slideFadeIn";
}

document.addEventListener("click", (e) => {
    const box = document.getElementById("equipoBox");
    if (!box || box.style.display !== "block") return;
    if (box.contains(e.target) || e.target.id === "btnEquipo") return;
    box.style.animationName = "slideFadeOut";
    setTimeout(() => box.style.display = "none", 600);
});

/* ============================================================
   BOTONES SUPERIORES
============================================================ */
document.addEventListener("DOMContentLoaded", () => {

    const btnMenu = document.getElementById("btnMenu");
    const btnFull = document.getElementById("btnFull");

    if (btnMenu) {
        btnMenu.onclick = () =>
            document.getElementById("menuFrame").classList.toggle("open");
    }

    if (btnFull) {
        btnFull.onclick = () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        };
    }
});

/* ============================================================
   ESCRÍBENOS — FORMULARIO ELEGANTE
============================================================ */

function abrirFormulario() {

    ocultarTarjetas();

    const box = document.getElementById("contentBox");
    box.style.display = "block";

    box.innerHTML = `
        <div class="tarjeta tarjeta-form-elegante">
            <button class="cerrar-form" onclick="cerrarTarjeta()">✕</button>

            <div class="form-header">
<img src="logos/BuhoLazarte.png"
     alt="Logo"
     style="
        position:absolute;
        top:0px;
        left:0px;
        width:5cm;
        z-index:10;
     ">


                <div class="form-icon">✉️</div>
                <h2>Contacto Epidemiología</h2>
                <p>Completa el formulario y nos comunicaremos contigo</p>
            </div>

            <div class="form-grid">
                <div class="field">
                    <label>DNI</label>
                    <input id="dni" type="text" placeholder="Ingrese DNI">
                </div>

                <div class="field">
                    <label>Nombre completo</label>
                    <input id="nombre" type="text" placeholder="Nombres y apellidos">
                </div>

                <div class="field">
                    <label>Teléfono</label>
                    <input id="telefono" type="text" placeholder="Número de contacto">
                </div>

                <div class="field field-full">
                    <label>Asunto</label>
                    <textarea id="asunto" placeholder="Describa su solicitud"></textarea>
                </div>
            </div>

            <div class="form-actions">
                <button class="btn-enviar-elegante" onclick="enviarPeticion()">
                    Enviar mensaje
                </button>
            </div>
        </div>
    `;
}


/* ============================================================
   ENVIAR FORMULARIO
============================================================ */
function enviarPeticion() {

    const data = {
        dni: document.getElementById("dni").value,
        nombre: document.getElementById("nombre").value,
        telefono: document.getElementById("telefono").value,
        asunto: document.getElementById("asunto").value
    };

    fetch("/api/peticion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
        .then(r => r.json())
        .then(resp => {
            if (resp.ok) {
                alert("✔ Mensaje enviado correctamente");
                cerrarTarjeta();
            } else {
                alert("❌ Error: " + resp.msg);
            }
        });
}

/* ============================================================
   MENÚ
============================================================ */
function cargarContenidoDesdeMenu(item) {

    ocultarTarjetas();

    if (item.carpeta === "Fichas") {
        cargarContenido("fichas");
        return;
    }

    if (item.carpeta === "Alertas") {
        cargarContenido("alertas");
        return;
    }

    if (item.link) {
        abrirFullscreen(item.link);
        return;
    }

    if (item.carpeta && item.file && item.file.toLowerCase().endsWith(".pdf")) {
        abrirPDFenPanel(`/${item.carpeta}/${item.file}`);
        return;
    }

    alert("Opción sin acción");
}

/* ============================================================
   PDF EN PANEL
============================================================ */
function abrirPDFenPanel(url) {
    // Detectar móvil
    if (window.innerWidth < 768) {
        window.open(url, "_blank");
        return;
    }

    const box = document.getElementById("contentBox");
    box.style.display = "block";

    box.innerHTML = `
        <div class="tarjeta tarjeta-pdf" style="position:relative">
            <button onclick="cerrarTarjeta()"
                style="position:absolute;top:10px;right:4cm;
                       background:#d62828;color:#fff;border:none;
                       padding:6px 12px;border-radius:6px">
                Cerrar
            </button>
            <iframe src="${url}" style="width:100%;height:80vh;border:none"></iframe>
        </div>
    `;
}

/* ============================================================
   FULLSCREEN
============================================================ */
function abrirFullscreen(url) {

    // Detectar móvil
    if (window.innerWidth < 768) {
        window.open(url, "_blank");
        return;
    }

    ocultarTarjetas();

    const visor = document.getElementById("visorFlipFull");
    visor.style.display = "block";

    visor.innerHTML = `
        <div id="cerrarFlip" onclick="cerrarFlip()">✖</div>
        <div id="loadingMsg"
             style="position:absolute;inset:0;
                    display:flex;align-items:center;
                    justify-content:center;
                    background:#000;color:#fff;
                    font-size:18px;font-weight:bold">
            Esperando cargar archivo...
        </div>
        <iframe id="flipFrame" style="width:100%;height:100%;border:none"></iframe>
    `;

    const iframe = document.getElementById("flipFrame");
    iframe.onload = () => {
        const msg = document.getElementById("loadingMsg");
        if (msg) msg.remove();
    };
    iframe.src = url;
}

function cerrarFlip() {
    ocultarTarjetas();
}

/* ============================================================
   FICHAS / ALERTAS (ELEGANTE)
============================================================ */
function cargarContenido(vista) {

    const box = document.getElementById("contentBox");
    box.style.display = "block";

    const titulo = vista === "fichas"
        ? "FICHAS EPIDEMIOLÓGICAS"
        : "ALERTAS EPIDEMIOLÓGICAS";

    const endpoint = vista === "fichas" ? "/api/fichas" : "/api/alertas";
    const carpeta = vista === "fichas" ? "fichas" : "alertas";

    box.innerHTML = `
        <div class="tarjeta tarjeta-listado" style="position:relative">

            <button onclick="cerrarTarjeta()"
                style="position:absolute;top:10px;right:3cm;
                       background:#d62828;color:#fff;border:none;
                       padding:4px 12px;border-radius:6px;font-size:13px">
                Cerrar
            </button>

            <div style="
                background:#f1f3f6;
                color:#0b4f9c;
                font-weight:700;
                font-size:18px;
                padding:10px 14px;
                border-radius:8px;
                margin-bottom:12px">
                ${titulo}
            </div>

            <input id="buscador"
                   placeholder="Buscar archivo..."
                   style="
                       width:100%;
                       padding:9px;
                       border-radius:6px;
                       border:1px solid #d0d7de;
                       margin-bottom:12px">

            <div id="listaContenido"
                 style="
                    display:grid;
                    grid-template-columns:repeat(2,1fr);
                    gap:12px">
            </div>
        </div>
    `;

    fetch(endpoint)
        .then(r => r.json())
        .then(items => {
            const cont = document.getElementById("listaContenido");

            items.forEach(name => {
                const card = document.createElement("div");
                card.style.background = "#fafbfc";
                card.style.border = "1px solid #e1e5ea";
                card.style.borderRadius = "10px";
                card.style.padding = "10px 12px";
                card.style.fontSize = "13px";

                card.innerHTML = `
                    <a href="javascript:abrirFullscreen('/${carpeta}/${name}')"
                       style="color:#2c3e50;
                               text-decoration:none;
                               font-weight:500">
                        ${name}
                    </a>
                `;

                cont.appendChild(card);
            });
        });
}

/* ============================================================
   CIERRE GENERAL
============================================================ */
function cerrarTarjeta() {
    ocultarTarjetas();

    // Si la pantalla es ancha (>768), abrimos el menú al cerrar tarjetas
    // Para que no quede vacío
    if (window.innerWidth >= 768) {
        const menu = document.getElementById("menuFrame");
        if (menu) menu.classList.add("open");
    }
}


/* ============================================================
   PANEL ADMINISTRADOR (Subida, Edición y Eliminación)
 ============================================================ */
function abrirModalUpload() {
    ocultarTarjetas();

    const box = document.getElementById("contentBox");
    box.style.display = "block";

    box.innerHTML = `
        <div class="tarjeta tarjeta-form-elegante" style="max-width: 600px;">
            <button class="cerrar-form" onclick="cerrarTarjeta()">✕</button>

            <div class="form-header">
                <div class="form-icon">🔐</div>
                <h2>Panel de Administración</h2>
                <p>Ingresa la clave maestra para gestionar el sistema.</p>
            </div>

            <!-- PASO 1: AUTENTICACIÓN -->
            <div id="pasoAuth">
                 <div class="field">
                    <label>Contraseña de Acceso</label>
                    <input id="adminPass" type="password" placeholder="••••••••">
                </div>
                <div class="form-actions" style="justify-content:center; margin-top:20px;">
                    <button class="btn-enviar-elegante" onclick="verificarClaveAdmin()">
                        Verificar Acceso
                    </button>
                </div>
            </div>

            <!-- PASO 2: SELECCIÓN DE ACCIÓN -->
            <div id="pasoDashboard" style="display:none; animation: fadeUp 0.5s ease; text-align:center;">
                <p style="margin-bottom:20px; font-weight:600; color:#333;">¿Qué deseas hacer?</p>
                
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px;">
                    <button onclick="mostrarSubidaArchivos()" style="
                        padding: 15px; border-radius:12px; border:1px solid #ccd3dc; 
                        background:#fff; cursor:pointer; transition:all 0.3s;">
                        <div style="font-size:24px; margin-bottom:5px;">☁️</div>
                        <div style="font-weight:bold; color:#0b4f9c;">Subir</div>
                        <div style="font-size:10px; color:#666;">Fichas/Alertas</div>
                    </button>

                    <button onclick="mostrarEditorMenu()" style="
                        padding: 15px; border-radius:12px; border:1px solid #ccd3dc; 
                        background:#fff; cursor:pointer; transition:all 0.3s;">
                        <div style="font-size:24px; margin-bottom:5px;">📝</div>
                        <div style="font-weight:bold; color:#0b4f9c;">Editar Menú</div>
                        <div style="font-size:10px; color:#666;">Linkear PDFs</div>
                    </button>

                    <button onclick="mostrarEliminarArchivos()" style="
                        padding: 15px; border-radius:12px; border:1px solid #ccd3dc; 
                        background:#fff; cursor:pointer; transition:all 0.3s;">
                        <div style="font-size:24px; margin-bottom:5px;">🗑️</div>
                        <div style="font-weight:bold; color:#d62828;">Eliminar</div>
                        <div style="font-size:10px; color:#666;">Borrar PDFs</div>
                    </button>
                </div>
            </div>

            <!-- PASO 3A: SUBIR ARCHIVOS -->
            <div id="pasoUpload" style="display:none; animation: fadeUp 0.5s ease;">
                 <h3 style="color:#0b4f9c; border-bottom:1px solid #eee; padding-bottom:8px; margin-bottom:15px;">☁ Subir Archivo</h3>
                 
                <div class="field">
                    <label>Seleccionar Destino</label>
                    <select id="uploadDestino" style="width:100%; padding:10px; border-radius:10px; border:1px solid #ccd3dc; margin-bottom:12px;">
                        <option value="Alertas">Alertas Epidemiológicas</option>
                        <option value="Fichas">Fichas Epidemiológicas</option>
                        <option value="Boletines">Boletines</option>
                    </select>
                </div>

                <div class="field">
                    <label>Archivo PDF</label>
                    <input id="uploadFile" type="file" accept=".pdf" style="background:#f4f6f8;">
                </div>

                <div class="form-actions" style="justify-content:space-between">
                    <button onclick="verificarClaveAdmin()" style="border:none; background:none; color:#666; cursor:pointer;">
                        ← Volver
                    </button>
                    <button class="btn-enviar-elegante" onclick="subirArchivoReal()">
                        Subir Archivo
                    </button>
                </div>
            </div>

            <!-- PASO 3B: EDITAR MENU -->
            <div id="pasoEditorMenu" style="display:none; animation: fadeUp 0.5s ease;">
                 <h3 style="color:#0b4f9c; border-bottom:1px solid #eee; padding-bottom:8px; margin-bottom:15px;">📝 Editor de Menú</h3>
                 
                 <div class="field field-full">
                    <label>Contenido del Menú (Menu.txt)</label>
                    <textarea id="menuContentEditor" style="height:200px; font-family:monospace; font-size:12px; line-height:1.4; white-space:pre;"></textarea>
                </div>

                <div class="form-actions" style="justify-content:space-between">
                    <button onclick="verificarClaveAdmin()" style="border:none; background:none; color:#666; cursor:pointer;">
                        ← Volver
                    </button>
                    <button class="btn-enviar-elegante" onclick="guardarMenuReal()">
                        Guardar Cambios
                    </button>
                </div>
            </div>

            <!-- PASO 3C: ELIMINAR ARCHIVOS -->
            <div id="pasoDelete" style="display:none; animation: fadeUp 0.5s ease;">
                 <h3 style="color:#d62828; border-bottom:1px solid #eee; padding-bottom:8px; margin-bottom:15px;">🗑️ Eliminar Archivo</h3>

                 <div class="field">
                    <label>1. Seleccionar Carpeta</label>
                    <select id="deleteFolder" onchange="cargarArchivosDelete()" style="width:100%; padding:10px; border-radius:10px; border:1px solid #ccd3dc; margin-bottom:12px;">
                        <option value="">-- Seleccionar --</option>
                        <option value="Alertas">Alertas Epidemiológicas</option>
                        <option value="Fichas">Fichas Epidemiológicas</option>
                        <option value="Boletines">Boletines</option>
                    </select>
                </div>

                <div class="field">
                    <label>2. Seleccionar Archivo a Eliminar</label>
                    <select id="deleteFile" style="width:100%; padding:10px; border-radius:10px; border:1px solid #ccd3dc; margin-bottom:12px; background:#fff0f0;">
                        <option value="">(Primero selecciona carpeta)</option>
                    </select>
                </div>

                <div class="form-actions" style="justify-content:space-between">
                    <button onclick="verificarClaveAdmin()" style="border:none; background:none; color:#666; cursor:pointer;">
                        ← Volver
                    </button>
                    <button class="btn-enviar-elegante" style="background:#d62828;" onclick="eliminarArchivoReal()">
                        ELIMINAR DEFINITIVAMENTE
                    </button>
                </div>
            </div>

        </div>
    `;
}

// 1. Verificar Clave
function verificarClaveAdmin() {
    const passInput = document.getElementById("adminPass");
    const pass = passInput ? passInput.value : document.getElementById("hiddenAuthPass").value;

    if (pass === "admin123") {
        if (!document.getElementById("hiddenAuthPass")) {
            const hidden = document.createElement("input");
            hidden.type = "hidden";
            hidden.id = "hiddenAuthPass";
            hidden.value = pass;
            document.body.appendChild(hidden);
        }

        document.getElementById("pasoAuth").style.display = "none";
        document.getElementById("pasoUpload").style.display = "none";
        document.getElementById("pasoEditorMenu").style.display = "none";
        document.getElementById("pasoDelete").style.display = "none";
        document.getElementById("pasoDashboard").style.display = "block";
    } else {
        alert("⛔ Clave incorrecta");
    }
}

// 2. Mostrar Paneles
function mostrarSubidaArchivos() {
    document.getElementById("pasoDashboard").style.display = "none";
    document.getElementById("pasoUpload").style.display = "block";
}

function mostrarEditorMenu() {
    fetch("/Menu.txt")
        .then(r => r.text())
        .then(text => {
            document.getElementById("menuContentEditor").value = text;
            document.getElementById("pasoDashboard").style.display = "none";
            document.getElementById("pasoEditorMenu").style.display = "block";
        })
        .catch(err => alert("Error leyendo menú: " + err));
}

function mostrarEliminarArchivos() {
    document.getElementById("pasoDashboard").style.display = "none";
    document.getElementById("pasoDelete").style.display = "block";
}

function cargarArchivosDelete() {
    const folder = document.getElementById("deleteFolder").value;
    const select = document.getElementById("deleteFile");

    select.innerHTML = "<option>Cargando...</option>";

    if (!folder) {
        select.innerHTML = "<option>(Selecciona carpeta)</option>";
        return;
    }

    fetch("/api/list?folder=" + folder)
        .then(r => r.json())
        .then(files => {
            if (files.length === 0) {
                select.innerHTML = "<option value=''>vacio</option>";
            } else {
                select.innerHTML = files.map(f => `<option value="${f}">${f}</option>`).join("");
            }
        });
}

// 3. Acciones Reales
function subirArchivoReal() {
    const fileInput = document.getElementById("uploadFile");
    const carpeta = document.getElementById("uploadDestino").value;
    const pass = document.getElementById("hiddenAuthPass").value;

    if (!fileInput.files.length) {
        alert("Selecciona un archivo");
        return;
    }

    const formData = new FormData();
    formData.append("archivo", fileInput.files[0]);
    formData.append("carpeta", carpeta);
    formData.append("password", pass);

    fetch("/api/upload", {
        method: "POST",
        body: formData
    })
        .then(r => r.json())
        .then(res => {
            if (res.ok) {
                alert("✅ " + res.msg);
                verificarClaveAdmin();
            } else {
                alert("❌ Error: " + res.msg);
            }
        })
        .catch(err => alert("Error de conexión"));
}

function guardarMenuReal() {
    const content = document.getElementById("menuContentEditor").value;
    const pass = document.getElementById("hiddenAuthPass").value;

    fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass, content: content })
    })
        .then(r => r.json())
        .then(res => {
            if (res.ok) {
                alert("✅ " + res.msg);
                const menuFrame = document.getElementById("menuFrame");
                if (menuFrame) menuFrame.contentWindow.location.reload();
                verificarClaveAdmin();
            } else {
                alert("❌ Error: " + res.msg);
            }
        })
        .catch(err => alert("Error de conexión"));
}

function eliminarArchivoReal() {
    const folder = document.getElementById("deleteFolder").value;
    const file = document.getElementById("deleteFile").value;
    const pass = document.getElementById("hiddenAuthPass").value;

    if (!folder || !file) {
        alert("Selecciona carpeta y archivo");
        return;
    }

    if (!confirm(`¿Estás SEGURO de eliminar ${file}?\nEsta acción no se puede deshacer.`)) {
        return;
    }

    fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass, folder: folder, file: file })
    })
        .then(r => r.json())
        .then(res => {
            if (res.ok) {
                alert("🗑️ Archivo eliminado");
                cargarArchivosDelete(); // Refrescar lista
            } else {
                alert("❌ Error: " + res.msg);
            }
        })
        .catch(err => alert("Error de conexión"));
}
