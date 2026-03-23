let datiParrocchiali = datiParrocchialiSalvati; 
let filtroAttuale = { tipo: null, id: null };
let searchQuery = '';

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
    document.getElementById('titolo-sezione').textContent = tipo ? `Filtro: ${nomeTesto}` : "Esplora i Canti";
    document.getElementById('reset-filters').style.display = tipo ? 'block' : 'none';
    aggiornaListaCanti();
}

function aggiornaListaCanti() {
    const container = document.getElementById('song-list-container');
    if(!container) return;
    container.innerHTML = ''; 

    const mappaMomenti = {};
    datiParrocchiali.momenti.forEach(m => { mappaMomenti[m.id] = { nome: m.nome, ordine: m.ordine }; });

    let cantiFiltrati = [...datiParrocchiali.canti];

    if (filtroAttuale.tipo === 'momento') cantiFiltrati = cantiFiltrati.filter(c => c.momento === filtroAttuale.id);
    else if (filtroAttuale.tipo === 'messa') cantiFiltrati = cantiFiltrati.filter(c => c.messe.includes(filtroAttuale.id));

    if (searchQuery) {
        cantiFiltrati = cantiFiltrati.filter(c => 
            c.titolo.toLowerCase().includes(searchQuery) || 
            c.testo_md.toLowerCase().includes(searchQuery)
        );
    }

    cantiFiltrati.sort((a, b) => a.titolo.localeCompare(b.titolo));

    cantiFiltrati.forEach(canto => {
        const nomeMomento = mappaMomenti[canto.momento]?.nome || "Vario";
        
        // TRASFORMAZIONE PULITA: [Do]A diventa <span class="c" data-v="Do">A</span>
        const testoConAccordi = canto.testo_md.replace(/\[([^\]]+)\](.)?/g, (match, accordo, lettera) => {
            const char = lettera ? lettera : '&nbsp;';
            return `<span class="c-wrap"><span class="c-note">${accordo}</span>${char}</span>`;
        });
        
        const testoHtml = marked.parse(testoConAccordi, { breaks: true });

        const cardHTML = `
            <div class="song-card">
                <div class="song-header">
                    <div class="song-info"><div class="song-title">${canto.titolo}</div></div>
                    <div class="song-category">${nomeMomento}</div>
                    <div class="song-actions">
                        <button class="btn-chord chords-hidden chords-toggle-btn"><i class="fa-solid fa-music"></i></button>
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
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
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