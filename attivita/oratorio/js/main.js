// --- Aggiunta locandine ---

const gridLocandine = document.getElementById('locandineGrid');

gridLocandine.innerHTML = '';

for (let _loc of locandineDb) {
    const locHTML = `
        <div class="locandina-item">
            <img src="/attivita/oratorio/img/locandine/${_loc.nome}" alt="Locandina ${_loc.data}">
        </div>
    `;
    // gridLocandine.insertAdjacentHTML('beforeend', locHTML);
    gridLocandine.insertAdjacentHTML('afterbegin', locHTML);
}

// --- Aggiunta eventi
const eventList = document.getElementById('event-list');
eventList.innerHTML = '';

for (let event of eventiDb) {
    const eventHTML = `
        <div class="event-item">
            <div class="event-date"><strong>${event.data}</strong><span>ore ${event.ore}</span></div>
            <div class="event-desc"><strong>${event.titolo}</strong><span>${event.desc}</span></div>
        </div>
    `;
    eventList.insertAdjacentHTML('beforeend', eventHTML);
}

// --- Aggiunta Iscrizioni ---
const iscrizioniList = document.getElementById('iscrizioni-list');
const arrowExpansion = document.getElementById('iscrizioni-expand');
iscrizioniList.innerHTML = '';

for (let form of iscrizioniDb) {
    // let link = 
    const formHTML = `
        <li>
            <div class="iscrizione-info">
                <h4>${form.titolo}</h4>
                <span><i class="fa-regular fa-calendar"></i> ${form.desc}</span>
            </div>
            <a href="${(form.link === '') ? '#' : form.link}" class="btn-iscriviti">Iscriviti</a>
        </li>
    `;
    iscrizioniList.insertAdjacentHTML('beforeend', formHTML) 
}



//- Zoom locandina
// Selezioniamo gli elementi necessari
const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("enlargedImg");
const chiudiModal = document.querySelector(".close-modal");
const locandine = document.querySelectorAll(".locandina-item img");

// Aggiungiamo l'evento click a ogni locandina piccola
locandine.forEach(img => {
    img.addEventListener("click", function() {
        modal.style.display = "flex"; // Mostriamo la modale
        modalImg.src = this.src;      // Copiamo il link dell'immagine cliccata
    });
});

// Chiudi la modale cliccando sulla "X" in alto a destra
chiudiModal.addEventListener("click", function() {
    modal.style.display = "none";
});

// Chiudi la modale anche cliccando ovunque sullo sfondo scuro
window.addEventListener("click", function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

// --- Gestione Menu Iscrizioni Attive ---
const toggleIscrizioni = document.getElementById("toggle-iscrizioni");
const menuIscrizioni = document.getElementById("menu-iscrizioni");
const arrowIcon = document.getElementById("arrow-icon");

toggleIscrizioni.addEventListener("click", function() {
    // Controlla se il menù è aperto (se ha un'altezza massima assegnata)
    if (menuIscrizioni.style.maxHeight) {
        // Se è aperto, lo chiude
        menuIscrizioni.style.maxHeight = null;
        arrowIcon.classList.remove("ruotata"); // Rimette la freccia in giù
    } else {
        // Se è chiuso, lo apre assegnandogli l'altezza del suo contenuto interno
        menuIscrizioni.style.maxHeight = menuIscrizioni.scrollHeight + "px";
        arrowIcon.classList.add("ruotata"); // Gira la freccia in sù
    }
});

// --- Gestione Paginazione Locandine ---
const itemsPerPage = 4;
let currentPage = 1;

const grid = document.getElementById("locandineGrid");
const items = grid.querySelectorAll(".locandina-item");
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