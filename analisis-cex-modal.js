
// =====================================================
// CEX MODAL MAXIMIZAR – FIX TAMAÑO GRAFICO
// Hace que el canvas ocupe TODO el modal
// =====================================================
document.addEventListener("DOMContentLoaded", () => {

  const overlay = document.createElement("div");
  overlay.className = "cex-modal-overlay";
  overlay.innerHTML = `
    <div class="cex-modal-box">
      <button class="cex-modal-close" type="button">✕ Cerrar</button>
      <div id="cexModalContent" class="cex-modal-content"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const modalContent = overlay.querySelector("#cexModalContent");
  const closeBtn = overlay.querySelector(".cex-modal-close");
closeBtn.style.position = "relative";
closeBtn.style.top = "1cm";


  function closeModal() {
    overlay.classList.remove("show");
    modalContent.innerHTML = "";
  }

  closeBtn.onclick = closeModal;
  overlay.onclick = e => { if (e.target === overlay) closeModal(); };
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && overlay.classList.contains("show")) closeModal();
  });

  document.querySelectorAll(".card").forEach(card => {

    if (getComputedStyle(card).position === "static") {
      card.style.position = "relative";
    }

    const btn = document.createElement("button");
    btn.className = "cex-max-btn";
    btn.type = "button";
    btn.textContent = "⤢";
    btn.title = "Maximizar";
    card.appendChild(btn);

    btn.onclick = e => {
      e.stopPropagation();
      modalContent.innerHTML = "";

      const canvas = card.querySelector("canvas");

      if (canvas && window.Chart && Chart.getChart) {
        const originalChart = Chart.getChart(canvas);

        if (originalChart) {
          const wrapper = document.createElement("div");
          wrapper.style.width = "100%";
          wrapper.style.height = "100%";
          wrapper.style.position = "relative";

          const newCanvas = document.createElement("canvas");
          newCanvas.style.width = "100%";
          newCanvas.style.height = "100%";

          wrapper.appendChild(newCanvas);
          modalContent.appendChild(wrapper);
          overlay.classList.add("show");

          setTimeout(() => {
            new Chart(newCanvas.getContext("2d"), {
              type: originalChart.config.type,
              data: JSON.parse(JSON.stringify(originalChart.config.data)),
              options: {
                ...JSON.parse(JSON.stringify(originalChart.config.options)),
                responsive: true,
                maintainAspectRatio: false
              }
            });
          }, 30);

          return;
        }
      }

      const clone = card.cloneNode(true);
      clone.querySelectorAll(".cex-max-btn").forEach(b => b.remove());
      modalContent.appendChild(clone);
      overlay.classList.add("show");
    };
  });

});
