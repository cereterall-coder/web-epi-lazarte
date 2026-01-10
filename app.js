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
   SUBIDA SEGURA DE ARCHIVOS
 ============================================================ */
function abrirModalUpload() {
    ocultarTarjetas();

    const box = document.getElementById("contentBox");
    box.style.display = "block";

    box.innerHTML = `
        <div class="tarjeta tarjeta-form-elegante" style="max-width: 400px;">
            <button class="cerrar-form" onclick="cerrarTarjeta()">✕</button>

            <div class="form-header">
                <div class="form-icon">🔐</div>
                <h2>Zona Segura</h2>
                <p>Ingresa la clave maestra para subir archivos.</p>
            </div>

            <div id="pasoAuth">
                 <div class="field">
                    <label>Contraseña de Acceso</label>
                    <input id="uploadPass" type="password" placeholder="••••••••">
                </div>
                <div class="form-actions" style="justify-content:center; margin-top:20px;">
                    <button class="btn-enviar-elegante" onclick="verificarClaveUpload()">
                        Verificar Acceso
                    </button>
                </div>
            </div>

            <div id="pasoUpload" style="display:none; animation: fadeUp 0.5s ease;">
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

                <div class="form-actions">
                    <button class="btn-enviar-elegante" onclick="subirArchivoReal()">
                        subir ☁
                    </button>
                </div>
            </div>

        </div>
    `;
}

function verificarClaveUpload() {
    const pass = document.getElementById("uploadPass").value;
    // Validación preliminar en cliente para UI rápida
    // La validación real ocurre en el servidor
    if (pass === "admin123") {
        document.getElementById("pasoAuth").style.display = "none";
        document.getElementById("pasoUpload").style.display = "block";
    } else {
        alert("⛔ Clave incorrecta");
    }
}

function subirArchivoReal() {
    const fileInput = document.getElementById("uploadFile");
    const carpeta = document.getElementById("uploadDestino").value;
    const pass = document.getElementById("uploadPass").value;

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
                cerrarTarjeta();
            } else {
                alert("❌ Error: " + res.msg);
            }
        })
        .catch(err => {
            alert("Error de conexión");
            console.error(err);
        });
}

/* ============================================================ 
   EDITAR MENU (SISTEMA)
 ============================================================ */
function abrirModalMenu() {
    ocultarTarjetas();

    const box = document.getElementById("contentBox");
    box.style.display = "block";

    box.innerHTML = `
        <div class="tarjeta tarjeta-form-elegante" style="max-width: 600px;">
            <button class="cerrar-form" onclick="cerrarTarjeta()">✕</button>

            <div class="form-header">
                <div class="form-icon">📝</div>
                <h2>Editor de Menú</h2>
                <p>Modifica el archivo Menu.txt directamente.</p>
            </div>

            <div id="pasoAuthMenu">
                 <div class="field">
                    <label>Contraseña de Administrador</label>
                    <input id="menuPass" type="password" placeholder="••••••••">
                </div>
                <div class="form-actions" style="justify-content:center; margin-top:20px;">
                    <button class="btn-enviar-elegante" onclick="verificarClaveMenu()">
                        Acceder al Editor
                    </button>
                </div>
            </div>

            <div id="pasoEditor" style="display:none; animation: fadeUp 0.5s ease;">
                <div class="field field-full">
                    <label>Contenido del Menú (Formato Texto)</label>
                    <textarea id="menuContent" style="height:300px; font-family:monospace; font-size:13px; line-height:1.4; white-space:pre;"></textarea>
                </div>

                <div class="form-actions">
                    <button class="btn-enviar-elegante" onclick="guardarMenu()">
                        Guardar Cambios 💾
                    </button>
                </div>
            </div>

        </div>
    `;
}

function verificarClaveMenu() {
    const pass = document.getElementById("menuPass").value;

    // Verificación preliminar (la real es en servidor)
    if (pass === "admin123") {
        // Cargar contenido actual
        fetch("/Menu.txt")
            .then(res => res.text())
            .then(text => {
                document.getElementById("pasoAuthMenu").style.display = "none";
                document.getElementById("pasoEditor").style.display = "block";
                document.getElementById("menuContent").value = text;
            })
            .catch(err => alert("Error cargando menú: " + err));
    } else {
        alert("⛔ Clave incorrecta");
    }
}

function guardarMenu() {
    const content = document.getElementById("menuContent").value;
    const pass = document.getElementById("menuPass").value;

    fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass, content: content })
    })
        .then(r => r.json())
        .then(res => {
            if (res.ok) {
                alert("✅ " + res.msg);
                cerrarTarjeta();
                // Recargar el iframe del menú para ver cambios
                const menuFrame = document.getElementById("menuFrame");
                if (menuFrame) menuFrame.contentWindow.location.reload();
            } else {
                alert("❌ Error: " + res.msg);
            }
        })
        .catch(err => {
            alert("Error de conexión");
            console.error(err);
        });
}
