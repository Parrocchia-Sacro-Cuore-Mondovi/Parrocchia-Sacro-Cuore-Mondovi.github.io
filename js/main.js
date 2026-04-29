// --- Aggiunta notizie ---

const newsContainer = document.getElementById('newsGrid');
newsContainer.innerHTML = '';
for (let _news of notizieDb) {
    const newsHTML = `
        <div class="news-item">
            <h3>${_news.titolo}</h3>
            <span class="news-date">${_news.data}</span>
        </div>
    `;
    newsContainer.insertAdjacentHTML('beforeend', newsHTML);
}


// --- Gestione Paginazione Notizie ---
const itemsPerPage = 5;
let currentPage = 1;

const grid = document.getElementById("newsGrid");
const items = grid.querySelectorAll(".news-item");
const btnPrev = document.getElementById("prevLocandine");
const btnNext = document.getElementById("nextLocandine");
const pageInfo = document.getElementById("pageInfo");
const paginationControls = document.getElementById("paginationControls"); // <-- Nuovo elemento

function updatePagination() {
    // 1. Controllo: se ci sono 4 locandine o meno, nascondi la navigazione e mostra tutto
    if (items.length <= itemsPerPage) {
        paginationControls.style.display = "none";
        items.forEach(item => {
            item.style.display = "block";
            item.classList.add("fade-in");
        });
        return; // Interrompe qui la funzione, non c'è bisogno di calcolare le pagine
    }

    // Se ci sono più di 4 locandine, assicurati che la navigazione sia visibile
    paginationControls.style.display = "flex";

    const totalPages = Math.ceil(items.length / itemsPerPage);
    
    // 2. Mostra/Nascondi gli elementi per la pagina corrente
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

    // 3. Aggiorna il testo e lo stato dei bottoni
    // Solo se c'è il testo numero di pagine
    // pageInfo.innerText = `Pagina ${currentPage} di ${totalPages}`; 
    btnPrev.disabled = (currentPage === 1);
    btnNext.disabled = (currentPage === totalPages);
}

btnPrev.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        updatePagination();
    }
});

btnNext.addEventListener("click", () => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        updatePagination();
    }
});

// Inizializza la pagina al caricamento
updatePagination();