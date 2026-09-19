// --- Ultimo Foglietto Settimanale (Home) ---
// Mostra automaticamente il foglietto più recente in ordine cronologico,
// leggendo fogliettiDb da /amico/js/data.js (lo stesso database usato dalla
// pagina Amico, generato/aggiornato da aggiornaSito.py). Nessuna modifica
// manuale necessaria: per pubblicare un nuovo foglietto basta l'automazione
// che aggiorna la pagina /amico/.
// Racchiuso in una IIFE per non entrare in conflitto con le variabili
// già usate da /js/main.js e /js/locandine-home.js.

(function () {
    const container = document.getElementById("fogliettoContainerHome");
    if (!container) return;

    const emptyMsg = document.getElementById("fogliettoEmptyHome");

    if (typeof fogliettiDb === "undefined" || fogliettiDb.length === 0) {
        if (emptyMsg) emptyMsg.style.display = "block";
        return;
    }

    // Stesso criterio di ordinamento usato in /amico/js/main.js:
    // i nomi file sono "AAAA_MM_GG.png", quindi ordinandoli al contrario
    // per stringa otteniamo il più recente per primo.
    const ultimoFoglietto = [...fogliettiDb].sort((a, b) => b.localeCompare(a))[0];
    const srcUltimo = `/amico/img/foglietti/${ultimoFoglietto}`;

    const html = `
        <a href="${srcUltimo}" class="foglietto-item">
            <img src="${srcUltimo}" alt="Ultimo foglietto settimanale">
        </a>
    `;
    container.insertAdjacentHTML("beforeend", html);

    // --- Zoom (lightbox condivisa con le altre immagini della home) ---
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("enlargedImg");
    const link = container.querySelector(".foglietto-item");

    if (modal && modalImg && link) {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            modal.style.display = "flex";
            modalImg.src = this.href;
            modalImg.alt = "Ultimo foglietto settimanale";
        });

        const closeModalBtn = modal.querySelector(".close-modal");
        if (closeModalBtn) {
            closeModalBtn.addEventListener("click", () => {
                modal.style.display = "none";
            });
        }

        window.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });

        window.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && modal.style.display === "flex") {
                modal.style.display = "none";
            }
        });
    }
})();
