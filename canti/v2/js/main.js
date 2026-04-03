let datiParrocchiali = datiParrocchialiSalvati; 
let filtroAttuale = { tipo: null, id: null };
let searchQuery = '';

let btnFiltriSpostato = false;

document.addEventListener('DOMContentLoaded', function() {
    // Ora i dati sono già dentro datiParrocchiali perché caricati da data.js
    inizializzaSidebar();
    aggiornaListaCanti();

    // Ricerca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchQuery = e.target.value.toLowerCase();
            aggiornaListaCanti();
        });
    }

    // Click Dinamici
    document.addEventListener('click', function(e) {
        // Toggle Apertura Canto
        const toggleBtn = e.target.closest('.toggle-btn');
        if (toggleBtn) {
            const card = toggleBtn.closest('.song-card');
            card.querySelector('.song-text-wrapper').classList.toggle('aperto');
            toggleBtn.classList.toggle('ruotato');
        }

        // Toggle Accordi (Metodo RUBY)
        const chordsToggleBtn = e.target.closest('.chords-toggle-btn');
        if (chordsToggleBtn) {
            e.stopPropagation();
            const card = chordsToggleBtn.closest('.song-card');
            const lyricsDiv = card.querySelector('.lyrics');
            lyricsDiv.classList.toggle('hide-chords');
            chordsToggleBtn.classList.toggle('chords-visible');
            chordsToggleBtn.classList.toggle('chords-hidden');
        }

        // Accordion Filtri Sidebar
        const filterHeader = e.target.closest('.filter-header');
        if (filterHeader) {
            filterHeader.closest('.filter-group').classList.toggle('collapsed');
        }
    });

    const resetBtn = document.getElementById('reset-filters');
    if(resetBtn) resetBtn.addEventListener('click', () => impostaFiltro(null, null));
});

// --- FUNZIONI DI INTERFACCIA ---

function inizializzaSidebar() {
    const listaMomenti = document.getElementById('lista-momenti');
    const listaMesse = document.getElementById('lista-messe');
    if(!listaMomenti || !listaMesse) return;

    listaMomenti.innerHTML = '';
    listaMesse.innerHTML = '';

    datiParrocchiali.momenti.forEach(momento => {

        if (momento.nascosto) return;

        const li = document.createElement('li');
        li.textContent = momento.nome;
        li.addEventListener('click', () => impostaFiltro('momento', momento.id, momento.nome));
        listaMomenti.appendChild(li);
    });

    datiParrocchiali.messe.forEach(messa => {
        const li = document.createElement('li');
        li.textContent = messa.nome;
        li.addEventListener('click', () => impostaFiltro('messa', messa.id, messa.nome));
        listaMesse.appendChild(li);
    });
}

function impostaFiltro(tipo, id, nomeTesto = "Esplora i Canti") {
    filtroAttuale = { tipo, id };

    if (tipo === 'messa' && !btnFiltriSpostato)
    {
        SpostaBtnFiltri(true);
    }
    else
    {
        SpostaBtnFiltri(false);
    }

    document.getElementById('titolo-sezione').textContent = tipo ? `Filtro: ${nomeTesto}` : "Esplora i Canti";
    document.getElementById('reset-filters').style.display = tipo ? 'block' : 'none';
    aggiornaListaCanti();
    
    const sidebar = document.getElementById('filterSidebar');
    if (window.innerWidth <= 768 && sidebar.classList.contains('show-mobile')) {
        toggleSidebar();
    }
}

function aggiornaListaCanti() {
    const container = document.getElementById('song-list-container');
    if(!container) return;
    container.innerHTML = ''; 

    const mappaMomenti = {};
    datiParrocchiali.momenti.forEach(m => { mappaMomenti[m.id] = { nome: m.nome, ordine: m.ordine }; });

    let cantiFiltrati = [...datiParrocchiali.canti];

    // 1. Filtri
    if (filtroAttuale.tipo === 'momento') {
        cantiFiltrati = cantiFiltrati.filter(c => c.momento === filtroAttuale.id);
    } 
    else if (filtroAttuale.tipo === 'messa') 
    {
        cantiFiltrati = cantiFiltrati.filter(c => c.messe.includes(filtroAttuale.id));
    }

    if (searchQuery) {
        const queryPulita = pulisciTesto(searchQuery);
        
        cantiFiltrati = cantiFiltrati.filter(c => {
            const matchTitolo = pulisciTesto(c.titolo).includes(queryPulita);
            
            const matchTesto = ricercaNelTestoAttiva
                ? pulisciTesto(c.testo_md).includes(queryPulita)
                : false;
                
            const nomeDelMomento = mappaMomenti[c.momento]?.nome || "";
            const matchMomento = pulisciTesto(nomeDelMomento) === queryPulita;
            
            return matchTitolo || matchTesto || matchMomento;
        });
    }

    // 2. Ordinamento
    cantiFiltrati.sort((a, b) => {
        // CASO 1: L'utente sta visualizzando il filtro "messa"
        if (filtroAttuale.tipo === 'messa') {
            const ordineA = mappaMomenti[a.momento] ? mappaMomenti[a.momento].ordine : 999;
            const ordineB = mappaMomenti[b.momento] ? mappaMomenti[b.momento].ordine : 999;
            if (ordineA !== ordineB) return ordineA - ordineB;
            return a.titolo.localeCompare(b.titolo);
        }

        // CASO 2: L'utente ha usato la barra di ricerca
        if (searchQuery) {
            const queryPulita = pulisciTesto(searchQuery);
            
            const nomeMomentoA = mappaMomenti[a.momento]?.nome || "";
            const nomeMomentoB = mappaMomenti[b.momento]?.nome || "";
            
            const aIsMomento = pulisciTesto(nomeMomentoA) === queryPulita;
            const bIsMomento = pulisciTesto(nomeMomentoB) === queryPulita;

            // Priorità: chi corrisponde al Momento cercato sale in cima
            if (aIsMomento && !bIsMomento) return -1;
            if (!aIsMomento && bIsMomento) return 1;

            // Se entrambi corrispondono al momento (es. sono due canti di Comunione), 
            // li ordiniamo tra loro in base all'ordine numerico del rito
            if (aIsMomento && bIsMomento) {
                const ordineA = mappaMomenti[a.momento] ? mappaMomenti[a.momento].ordine : 999;
                const ordineB = mappaMomenti[b.momento] ? mappaMomenti[b.momento].ordine : 999;
                if (ordineA !== ordineB) return ordineA - ordineB;
            }
        }

        return a.titolo.localeCompare(b.titolo);
    });

    // 3. Renderizzazione con GRUPPI per lo Sticky Header
    let letteraAttuale = '';
    let currentGroup = null; // Memorizza il contenitore del gruppo attuale

    cantiFiltrati.forEach(canto => {
        const nomeMomento = mappaMomenti[canto.momento]?.nome || "Vario";
        let creaNuovoGruppo = false;
        let testoSeparatore = '';
        let classeSeparatore = '';

        if (!searchQuery && !(filtroAttuale.tipo === 'messa')) { 
            let primaLettera = canto.titolo.trim().charAt(0).toLowerCase();

            switch (primaLettera) {
                case 'è':
                    primaLettera = 'e';
                    break;
                case 'é':
                    primaLettera = 'e';
                    break;
                default:
                    break;
            }
            primaLettera = primaLettera.toUpperCase();

            if (primaLettera !== letteraAttuale) {
                letteraAttuale = primaLettera;
                creaNuovoGruppo = true;
                testoSeparatore = letteraAttuale;
                classeSeparatore = 'letter-separator';
            }
        }
        
        // Se c'è un cambio lettera/momento, creiamo il "recinto" (div) per quel gruppo
        if (creaNuovoGruppo) {
            currentGroup = document.createElement('div');
            currentGroup.className = 'song-group';
            currentGroup.innerHTML = `<div class="list-separator ${classeSeparatore}">${testoSeparatore}</div>`;
            container.appendChild(currentGroup);
        }

        // Se stiamo cercando, currentGroup è vuoto, quindi attacchiamo direttamente al container principale
        const targetContainer = currentGroup ? currentGroup : container;

        const haAccordi = canto.testo_md.includes('[');

        let testoConAccordi = canto.testo_md.replace(/(\S*\[[^\]]+\]\S*)/g, '<span class="keep-together">$1</span>');
        testoConAccordi = testoConAccordi.replace(/\[([^\]]+)\]/g, (match, accordo) => {
            return `<span class="c" data-v="${accordo}"></span>`;
        });
        
        const testoHtml = marked.parse(testoConAccordi, { breaks: true });

        const cardHTML = `
            <div class="song-card">
                <div class="song-header">
                    <div class="song-info"><div class="song-title"><strong>${canto.titolo}</strong></div></div>
                    <div class="song-category">${nomeMomento}</div>
                    <div class="song-actions">
                        ${haAccordi ? `<button class="btn-chord chords-hidden chords-toggle-btn"><i class="fa-solid fa-music"></i></button>` : ''}
                        <button class="btn-go btn-green toggle-btn"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                </div>
                <div class="song-text-wrapper">
                    <div class="song-text-inner">
                        <hr class="divider">
                        <div class="lyrics hide-chords">${testoHtml}</div>
                    </div>
                </div>
            </div>`;
        targetContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

function pulisciTesto(testo) {
    if (!testo) return ""; // Evita errori se il testo è vuoto o undefined
    
    return testo
        .toLowerCase()                                   // 1. Tutto minuscolo
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // 2. Rimuove gli accenti
        .replace(/\s+/g, "");                            // 3. Rimuove tutti gli spazi
}

// Ricerca mirata
let ricercaNelTestoAttiva = false;

// Funzione richiamata quando si clicca il bottone del foglio
function toggleRicercaTesto() {
    ricercaNelTestoAttiva = !ricercaNelTestoAttiva; 
    
    const btn = document.getElementById('toggleTextSearchBtn');
    if (ricercaNelTestoAttiva) {
        btn.classList.add('active');
        btn.title = "Ricerca nel testo ATTIVA";
    } else {
        btn.classList.remove('active');
        btn.title = "Cerca anche all'interno del testo";
    }

    if (searchQuery.trim() !== '') {
        aggiornaListaCanti();
    }
}

// Menu Mobile
function toggleSidebar() {
    const sidebar = document.getElementById('filterSidebar');
    sidebar.classList.toggle('show-mobile');
}

function toggleNav() {
    const nav = document.getElementById('mainNav');
    const overlay = document.getElementById('navOverlay');
    nav.classList.toggle('nav-open');
    overlay.classList.toggle('active');
}


// Fix tasto btn

const campoInput = document.getElementById('searchInput');

function SpostaBtnFiltri(condizione) {
    const btnInput = document.getElementById('mobile-filtri-btn');
    btnInput.classList.toggle('ricerca-titolo', condizione);
    btnFiltriSpostato = condizione;
}

campoInput.addEventListener('input', function() {
    const condizione = campoInput.value.trim() !== "";
    if (!btnFiltriSpostato) SpostaBtnFiltri(condizione);
});