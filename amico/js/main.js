document.addEventListener("DOMContentLoaded", function() {

    // --- 2. CONFIGURAZIONE ---
    const MAX_LOCANDINE = 4;
    const MAX_BOLLETTINI = 4;
    
    let pagLocandine = 1;
    let pagBollettini = 1;

    // --- 3. LA FUNZIONE MAGICA PER LE LOCANDINE ---
    function aggiornaLocandine() {
        const griglia = document.getElementById('griglia-locandine');
        griglia.innerHTML = ''; // Svuota la griglia
        
        // Calcola da dove a dove "tagliare" la lista
        const inizio = (pagLocandine - 1) * MAX_LOCANDINE;
        const fine = inizio + MAX_LOCANDINE;
        const elementiDaMostrare = fogliettiDb.slice(inizio, fine);

        // Genera l'HTML
        for (let img of elementiDaMostrare) {
            // Creiamo SOLO l'immagine, aggiungendo una classe e il cursore
            const htmlLocandina = `
                <img src="img/foglietti/${img}" alt="Locandina" class="img-cliccabile" style="cursor: pointer;">
            `;
            griglia.insertAdjacentHTML('afterbegin', htmlLocandina);
        }

        // Gestisce i bottoni (li spegne se sei all'inizio o alla fine)
        document.getElementById('num-pag-locandine').innerText = `Pagina ${pagLocandine}`;
        document.getElementById('btn-prev-locandine').disabled = (pagLocandine === 1);
        document.getElementById('btn-next-locandine').disabled = (fine >= fogliettiDb.length);
    }

    // --- 4. LA FUNZIONE MAGICA PER I BOLLETTINI (PDF) ---
    function aggiornaBollettini() {
        const griglia = document.getElementById('griglia-bollettini');
        griglia.innerHTML = '';
        
        const inizio = (pagBollettini - 1) * MAX_BOLLETTINI;
        const fine = inizio + MAX_BOLLETTINI;
        const elementiDaMostrare = bollettiniDb.slice(inizio, fine);

        for (let pdf of elementiDaMostrare) {
            // href="pdf/${pdf.file}"
            const htmlCard = `
                <a href="pdf/${pdf.file}" class="card horizontal-card card-blue" target="_blank" rel="noopener noreferrer">
                    <div class="card-icon-container">
                        <i class="fa-solid fa-file-pdf"></i>
                    </div>
                    <div class="card-text-content">
                        <h2>${pdf.titolo}</h2>
                    </div>
                </a>
            `;
            griglia.insertAdjacentHTML('afterbegin', htmlCard);
        }

        document.getElementById('num-pag-bollettini').innerText = `Pagina ${pagBollettini}`;
        document.getElementById('btn-prev-bollettini').disabled = (pagBollettini === 1);
        document.getElementById('btn-next-bollettini').disabled = (fine >= bollettiniDb.length);
    }

    // --- 5. EVENTI CLICK DEI PULSANTI ---
    document.getElementById('btn-prev-locandine').addEventListener('click', () => { pagLocandine--; aggiornaLocandine(); });
    document.getElementById('btn-next-locandine').addEventListener('click', () => { pagLocandine++; aggiornaLocandine(); });

    document.getElementById('btn-prev-bollettini').addEventListener('click', () => { pagBollettini--; aggiornaBollettini(); });
    document.getElementById('btn-next-bollettini').addEventListener('click', () => { pagBollettini++; aggiornaBollettini(); });

    // --- 6. AVVIO INIZIALE ---
    aggiornaLocandine();
    aggiornaBollettini();

    // --- GESTIONE MODALE IMMAGINI ---
    const modaleImg = document.getElementById("modal-immagine");
    const imgNelModale = document.getElementById("img-modale-src");
    const grigliaLocandine = document.getElementById("griglia-locandine");
    const btnChiudiImg = document.querySelector(".chiudi-modal-img");

    // 1. Usiamo la "Delega": ascoltiamo i click su tutta la griglia
    if (grigliaLocandine) {
        grigliaLocandine.addEventListener("click", function(e) {
            
            // Controlliamo se abbiamo cliccato direttamente sull'immagine
            const imgCliccata = e.target.closest(".img-cliccabile");
            
            if (imgCliccata) {
                // Prende l'indirizzo originale (src) dell'immagine cliccata
                imgNelModale.src = imgCliccata.src; 
                
                // Mostra il modale
                modaleImg.style.display = "block"; 
            }
        });
    }

    // 2. Chiudi con la X
    if (btnChiudiImg) {
        btnChiudiImg.addEventListener("click", function() {
            modaleImg.style.display = "none";
            imgNelModale.src = ""; // Pulisce l'immagine per sicurezza
        });
    }

    // 3. Chiudi cliccando sullo sfondo nero fuori dalla foto
    if (modaleImg) {
        window.addEventListener("click", function(e) {
            if (e.target === modaleImg) {
                modaleImg.style.display = "none";
                imgNelModale.src = "";
            }
        });
    }
});