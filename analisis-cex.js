
// ===============================
// DASHBOARD CEX - JS
// Alternativa simple y estable:
// Mostrar médicos al pasar el mouse (tooltip)
// ===============================

let rawData = [];
let chartServicios = null;
let chartEdad = null;
let servicioDxActual = '';
let servicioEdadActual = '';

// ---------- CARGA ----------

async function cargarPeriodos() {
  const r = await fetch('/api/cex/periodos');
  const d = await r.json();
  const s = document.getElementById('periodo');
  s.innerHTML = '';
// Mover filtro de periodo 3 cm a la izquierda
s.style.position = 'relative';
s.style.left = '-3cm';

  d.forEach(p => {
    const o = document.createElement('option');
    o.value = p.file;
    o.textContent = `${p.desde} - ${p.hasta}`;
    s.appendChild(o);
  });
  if (d.length) cargarData(d[0].file);
  s.onchange = () => cargarData(s.value);
}

async function cargarData(f) {
  const r = await fetch('/api/cex/data?file=' + f);
  rawData = await r.json();
  initFiltros();
  render();
}

// ---------- FILTROS ----------

function initFiltros() {
  const selDx = document.getElementById('filtroServicioDx');
  const selEdad = document.getElementById('filtroServicioEdad');
  const servicios = [...new Set(rawData.map(r => r.SERVICIO))].sort();

  selDx.innerHTML = '<option value="">Todos los servicios</option>';
  selEdad.innerHTML = '<option value="">Todos los servicios</option>';

  servicios.forEach(s => {
    selDx.add(new Option(s, s));
    selEdad.add(new Option(s, s));
  });

  selDx.onchange = () => {
    servicioDxActual = selDx.value;
    renderTablaDx();
  };

  selEdad.onchange = () => {
    servicioEdadActual = selEdad.value;
    renderGraficoEdad();
  };
}

// ---------- RENDER GENERAL ----------

function render() {
  document.getElementById('kpiTotal').innerText = rawData.length;
  document.getElementById('kpiServicios').innerText =
    new Set(rawData.map(r => r.SERVICIO)).size;
  document.getElementById('kpiMedicos').innerText =
    new Set(rawData.map(r => (r.APENOMB_MEDICO || '').trim()).filter(Boolean)).size;
// Estilo KPI: fondo azul oscuro, texto blanco en negrita
['kpiTotal', 'kpiServicios', 'kpiMedicos'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;

  el.style.background = '#0d2b45';   // azul oscuro
  el.style.color = '#ffffff';        // texto blanco
  el.style.fontWeight = 'bold';       // negrita
  el.style.padding = '12px';
  el.style.borderRadius = '8px';
  el.style.textAlign = 'center';
});
// Estilo títulos de KPI: letra más grande y en negrita
['kpiTotal', 'kpiServicios', 'kpiMedicos'].forEach(id => {
  const valor = document.getElementById(id);
  if (!valor || !valor.previousElementSibling) return;

  const titulo = valor.previousElementSibling;
  titulo.style.fontSize = '16px';
  titulo.style.fontWeight = 'bold';
});


  renderTablaDx();
  renderGraficoServicios();
  renderGraficoEdad();
  renderMedicosServicio();
}

// ---------- TABLA DX ----------

function renderTablaDx() {
  const data = servicioDxActual
    ? rawData.filter(r => r.SERVICIO === servicioDxActual)
    : rawData;

  const totalAtenciones = data.length;

  const map = {};
  data.forEach(r => {
    const key = (r.DIAGNOSTICO || '—') + '||' + (r.DES_DIAGNOSTICO || '');
    map[key] = (map[key] || 0) + 1;
  });

  const ordenados = Object.entries(map)
    .map(([k, v]) => {
      const [c, d] = k.split('||');
      return { key: k, c, d, v };
    })
    .sort((a, b) => b.v - a.v);

  const top15 = ordenados.slice(0, 15);
  const topKeys = new Set(top15.map(x => x.key));

  const subtotalNoVisibles = data.filter(r => {
    const key = (r.DIAGNOSTICO || '—') + '||' + (r.DES_DIAGNOSTICO || '');
    return !topKeys.has(key);
  }).length;

  const tb = document.getElementById('tablaDx');
  const tf = document.getElementById('tablaDxFoot');
  tb.innerHTML = '';
  tf.innerHTML = '';

  top15.forEach(i => {
    tb.innerHTML += `
      <tr>
        <td>${i.c}</td>
        <td>${i.d}</td>
        <td>${i.v}</td>
        <td>${((i.v / totalAtenciones) * 100).toFixed(1)}%</td>
      </tr>`;
  });

  tf.innerHTML = `
    <tr>
      <td colspan="2"><strong>Subtotal (atenciones de diagnósticos no visibles)</strong></td>
      <td><strong>${subtotalNoVisibles}</strong></td>
      <td><strong>${((subtotalNoVisibles / totalAtenciones) * 100).toFixed(1)}%</strong></td>
    </tr>
    <tr>
      <td colspan="2"><strong>Total</strong></td>
      <td><strong>${totalAtenciones}</strong></td>
      <td><strong>100%</strong></td>
    </tr>`;
}

// ---------- GRÁFICOS ----------

function drawPercentajes(chart) {
  const ctx = chart.ctx;
  const dataset = chart.data.datasets[0].data;
  const total = dataset.reduce((a, b) => a + b, 0);

  ctx.save();
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#555';
  ctx.textAlign = 'center';

  chart.getDatasetMeta(0).data.forEach((bar, i) => {
    const val = dataset[i];
    const pct = total ? ((val / total) * 100).toFixed(1) + '%' : '0%';
    ctx.fillText(pct, bar.x, bar.y + 12);
  });

  ctx.restore();
}

function renderGraficoServicios() {
  const map = {};
  rawData.forEach(r => map[r.SERVICIO] = (map[r.SERVICIO] || 0) + 1);

  const top10 = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (chartServicios) chartServicios.destroy();

  chartServicios = new Chart(document.getElementById('chartServicios'), {
    type: 'bar',
    data: {
      labels: top10.map(x => x[0]),
      datasets: [{ data: top10.map(x => x[1]) }]
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      animation: {
        onComplete: function () {
          drawPercentajes(this);
        }
      },
      responsive: true
    }
  });
}

function obtenerEdad(r) {
  let v = r.ANNOS;
  if (v == null) return null;
  if (typeof v === 'string') v = v.replace(',', '.');
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function renderGraficoEdad() {
  const data = servicioEdadActual
    ? rawData.filter(r => r.SERVICIO === servicioEdadActual)
    : rawData;

  const g = { '<1': 0, '1-4': 0, '5-14': 0, '15-44': 0, '45-64': 0, '65+': 0 };

  data.forEach(r => {
    const e = obtenerEdad(r);
    if (e == null) return;
    if (e < 1) g['<1']++;
    else if (e <= 4) g['1-4']++;
    else if (e <= 14) g['5-14']++;
    else if (e <= 44) g['15-44']++;
    else if (e <= 64) g['45-64']++;
    else g['65+']++;
  });

  if (chartEdad) chartEdad.destroy();

  chartEdad = new Chart(document.getElementById('chartEdad'), {
    type: 'bar',
    data: {
      labels: Object.keys(g),
      datasets: [{ data: Object.values(g) }]
    },
    options: {
      plugins: { legend: { display: false } },
      animation: {
        onComplete: function () {
          drawPercentajes(this);
        }
      },
      responsive: true
    }
  });
}

// ---------- MÉDICOS POR SERVICIO (TOOLTIP) ----------

function renderMedicosServicio() {
  const map = {};

  rawData.forEach(r => {
    const m = (r.APENOMB_MEDICO || '').trim();
    if (!m) return;
    if (!map[r.SERVICIO]) map[r.SERVICIO] = new Set();
    map[r.SERVICIO].add(m);
  });

  const tb = document.getElementById('tablaMedicosServicio');
  tb.innerHTML = '';

  Object.entries(map)
    .map(([s, set]) => ({ s, total: set.size, medicos: [...set].sort() }))
    .sort((a, b) => b.total - a.total)
    .forEach(i => {
      const tooltip = i.medicos.join('\n');
      tb.innerHTML += `
        <tr>
          <td>${i.s}</td>
          <td>
            <span title="${tooltip.replace(/"/g, '&quot;')}"
                  style="cursor:help; text-decoration:underline dotted">
              ${i.total}
            </span>
          </td>
        </tr>`;
    });
}

// ---------- INICIO ----------

cargarPeriodos();
