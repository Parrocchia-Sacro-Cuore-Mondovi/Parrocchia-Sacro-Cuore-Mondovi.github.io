// --- Locandine della Home ---
// Gestisce solo lo zoom (lightbox) e la paginazione delle locandine
// inserite a mano in index.html. Non legge nessun file/db esterno:
// per aggiungere o togliere una locandina si modifica direttamente
// l'HTML (vedi i commenti sopra #locandineGridHome in index.html).
// Racchiuso in una IIFE per non entrare in conflitto con le variabili
// (grid, btnPrev, btnNext, ecc.) già usate da /js/main.js per le news.

(function () {
    const grid = document.getElementById("locandineGridHome");
    if (!grid) return;

    const emptyMsg = document.getElementById("locandineEmptyHome");
    const paginationControls = document.getElementById("paginationLocandineHome");
    const btnPrev = document.getElementById("prevLocandineHome");
    const btnNext = document.getElementById("nextLocandineHome");

    const itemsPerPage = 4;
    let currentPage = 1;

    function getItems() {
        return grid.querySelectorAll(".locandina-item");
    }

    function updatePagination() {
        const items = getItems();

        // Nessuna locandina: mostra il messaggio, nascondi la navigazione
        if (items.length === 0) {
            if (emptyMsg) emptyMsg.style.display = "block";
            if (paginationControls) paginationControls.style.display = "none";
            return;
        }
        if (emptyMsg) emptyMsg.style.display = "none";

        // 4 locandine o meno: le mostra tutte, senza navigazione
        if (items.length <= itemsPerPage) {
            if (paginationControls) paginationControls.style.display = "none";
            items.forEach(item => {
                item.style.display = "block";
                item.classList.add("fade-in");
            });
            return;
        }

        // Più di 4: attiva la paginazione
        if (paginationControls) paginationControls.style.display = "flex";
        const totalPages = Math.ceil(items.length / itemsPerPage);

        items.forEach((item, index) => {
            item.style.display = "none";
            item.classList.remove("fade-in");

            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;

            if (index >= start && index < end) {
                item.style.display = "block";
                item.classList.add("fade-in");
            }
        });

        if (btnPrev) btnPrev.disabled = (currentPage === 1);
        if (btnNext) btnNext.disabled = (currentPage === totalPages);
    }

    if (btnPrev) {
        btnPrev.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                updatePagination();
            }
        });
    }

    if (btnNext) {
        btnNext.addEventListener("click", () => {
            const totalPages = Math.ceil(getItems().length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                updatePagination();
            }
        });
    }

    // --- Zoom locandina (lightbox condivisa) ---
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("enlargedImg");

    if (modal && modalImg) {
        const closeModalBtn = modal.querySelector(".close-modal");

        getItems().forEach(item => {
            const img = item.querySelector("img");
            if (!img) return;
            img.addEventListener("click", function () {
                modal.style.display = "flex";
                modalImg.src = this.src;
                modalImg.alt = this.alt;
            });
        });

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

    updatePagination();
})();
