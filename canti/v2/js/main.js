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

        // Download PDF del canto
        const pdfBtn = e.target.closest('.pdf-download-btn');
        if (pdfBtn) {
            e.stopPropagation();
            const card = pdfBtn.closest('.song-card');
            scaricaPdfCanto(card, pdfBtn.dataset.titolo);
        }

        // Accordion Filtri Sidebar
        const filterHeader = e.target.closest('.filter-header');
        if (filterHeader) {
            filterHeader.closest('.filter-group').classList.toggle('collapsed');
        }
    });

    const resetBtn = document.getElementById('reset-filters');
    if(resetBtn) resetBtn.addEventListener('click', () => impostaFiltro(null, null));

    const pdfMessaBtn = document.getElementById('pdf-download-messa-btn');
    if (pdfMessaBtn) pdfMessaBtn.addEventListener('click', () => scaricaPdfMessa(pdfMessaBtn.dataset.nomeMessa));
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

    const pdfMessaBtn = document.getElementById('pdf-download-messa-btn');
    if (pdfMessaBtn) {
        pdfMessaBtn.style.display = (tipo === 'messa') ? 'flex' : 'none';
        pdfMessaBtn.dataset.nomeMessa = nomeTesto;
    }

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
            const numA = a.ordineMesse ? a.ordineMesse[filtroAttuale.id] : undefined;
            const numB = b.ordineMesse ? b.ordineMesse[filtroAttuale.id] : undefined;
            const haNumA = numA !== undefined && numA !== null;
            const haNumB = numB !== undefined && numB !== null;

            // I canti con un numero custom per questa messa vengono prima, ordinati per numero crescente
            if (haNumA && haNumB) return numA - numB;
            if (haNumA && !haNumB) return -1;
            if (!haNumA && haNumB) return 1;

            // Nessuno dei due ha un numero custom: fallback all'ordinamento attuale (ordine del momento, poi alfabetico)
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
                        <button class="btn-chord chords-hidden pdf-download-btn" title="Scarica PDF" data-titolo="${canto.titolo.replace(/"/g, '&quot;')}"><i class="fa-solid fa-download"></i></button>
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

// --- DOWNLOAD PDF DEI CANTI ---

// Aspetta che il browser abbia completato almeno un ciclo di layout+paint
// prima di catturare il contenuto (utile soprattutto su dispositivi mobili più lenti).
function attendiRenderPronto() {
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function nomeFilePdf(testo) {
    return testo
        .normalize('NFD').replace(/[̀-ͯ]/g, '') // via accenti per un nome file più sicuro
        .replace(/[\\/:*?"<>|]/g, '')
        .trim();
}

function scaricaBytesPdf(bytes, nomeFile) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeFile;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

// Altezza utile di una pagina A4 (con i margini usati sotto), misurata empiricamente
// in pixel CSS: sono indipendenti dal pixel-ratio del dispositivo, a differenza della
// paginazione automatica interna di html2pdf. Quella si è dimostrata inaffidabile tra
// dispositivi diversi (su alcuni telefoni produce pagine vuote o tagli a metà riga),
// quindi qui decidiamo noi dove tagliare, e ogni pagina generata con html2pdf è sempre
// già "giusta" (nessuna divisione interna da fargli gestire).
const ALTEZZA_PAGINA_PX = 1000;

// Genera il PDF (una singola pagina, sempre) di un elemento .pdf-export-sheet già
// pronto, e restituisce i byte grezzi. Usiamo html2canvas + jsPDF direttamente
// (non il livello "alto" di html2pdf.js): quest'ultimo ha una sua euristica di
// impaginazione automatica che, anche disattivata esplicitamente, in certi casi
// aggiunge comunque una pagina vuota di troppo. Piazzando noi stessi l'immagine
// su un'unica pagina jsPDF non c'è alcun modo che ne venga creata una in più.
async function generaPdfSemplice(sheet) {
    document.body.appendChild(sheet);
    await attendiRenderPronto();

    const canvas = await html2canvas(sheet, { scale: 2, useCORS: true });
    sheet.remove();

    const margine = 15; // mm
    const larghezzaPaginaMm = 210; // A4
    const larghezzaUtileMm = larghezzaPaginaMm - margine * 2;
    const altezzaImgMm = (canvas.height * larghezzaUtileMm) / canvas.width;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margine, margine, larghezzaUtileMm, altezzaImgMm);

    return doc.output('arraybuffer');
}

// Genera il PDF di UN canto, anche su più pagine se necessario. Misuriamo l'altezza
// di ogni verso/ritornello (in pixel CSS) e decidiamo noi i punti di interruzione;
// ogni pagina viene poi generata singolarmente e le uniamo con pdf-lib.
async function generaPdfCanto(titolo, lyricsHtml) {
    const sheetMisura = document.createElement('div');
    sheetMisura.className = 'pdf-export-sheet';
    document.body.appendChild(sheetMisura);

    sheetMisura.innerHTML = `<div class="pdf-export-title">${titolo}</div>`;
    const altezzaTitolo = sheetMisura.firstElementChild.offsetHeight;

    const lyricsMisura = document.createElement('div');
    lyricsMisura.className = 'lyrics';
    sheetMisura.innerHTML = '';
    sheetMisura.appendChild(lyricsMisura);
    lyricsMisura.innerHTML = lyricsHtml;
    const elementiHtml = Array.from(lyricsMisura.children).map(el => el.outerHTML);
    const altezze = elementiHtml.map(html => {
        lyricsMisura.innerHTML = html;
        return lyricsMisura.firstElementChild.offsetHeight;
    });
    sheetMisura.remove();

    const pagine = [];
    let paginaCorrente = [];
    let spazioRimanente = ALTEZZA_PAGINA_PX - altezzaTitolo;
    elementiHtml.forEach((html, i) => {
        const altezza = altezze[i];
        if (paginaCorrente.length && altezza > spazioRimanente) {
            pagine.push(paginaCorrente);
            paginaCorrente = [];
            spazioRimanente = ALTEZZA_PAGINA_PX;
        }
        paginaCorrente.push(html);
        spazioRimanente -= altezza;
    });
    pagine.push(paginaCorrente);

    const { PDFDocument } = PDFLib;
    const pdfCanto = await PDFDocument.create();
    for (let i = 0; i < pagine.length; i++) {
        const sheet = document.createElement('div');
        sheet.className = 'pdf-export-sheet';
        sheet.innerHTML = (i === 0 ? `<div class="pdf-export-title">${titolo}</div>` : '')
            + `<div class="lyrics">${pagine[i].join('')}</div>`;
        const bytes = await generaPdfSemplice(sheet);
        const pdfParziale = await PDFDocument.load(bytes);
        const copiate = await pdfCanto.copyPages(pdfParziale, pdfParziale.getPageIndices());
        copiate.forEach(p => pdfCanto.addPage(p));
    }
    return pdfCanto.save();
}

async function scaricaPdfCanto(card, titolo) {
    const lyricsHtml = card.querySelector('.lyrics').innerHTML;
    const bytes = await generaPdfCanto(titolo, lyricsHtml);
    scaricaBytesPdf(bytes, nomeFilePdf(titolo) + '.pdf');
}

// --- DOWNLOAD PDF DI TUTTI I CANTI DI UNA MESSA (in ordine) ---

function creaBloccoCanto(titolo, lyricsHtml) {
    const blocco = document.createElement('div');
    blocco.className = 'pdf-export-song-block';
    blocco.innerHTML = `
        <div class="pdf-export-title">${titolo}</div>
        <div class="lyrics">${lyricsHtml}</div>
    `;
    return blocco;
}

async function scaricaPdfMessa(nomeMessa) {
    const cards = document.querySelectorAll('#song-list-container .song-card');
    if (cards.length === 0) return;

    const canti = Array.from(cards).map(card => ({
        titolo: card.querySelector('.song-title').textContent.trim(),
        lyricsHtml: card.querySelector('.lyrics').innerHTML
    }));

    // Misuriamo l'altezza di ogni canto per decidere quali impacchettare insieme.
    const sheetMisura = document.createElement('div');
    sheetMisura.className = 'pdf-export-sheet';
    document.body.appendChild(sheetMisura);
    const altezze = canti.map(({ titolo, lyricsHtml }) => {
        sheetMisura.innerHTML = '';
        sheetMisura.appendChild(creaBloccoCanto(titolo, lyricsHtml));
        return sheetMisura.firstElementChild.offsetHeight + 25; // + margin-bottom del blocco
    });
    sheetMisura.remove();

    // Raggruppiamo i canti brevi consecutivi che stanno insieme in una pagina.
    // Ogni canto più lungo di una pagina va per conto proprio nel suo gruppo
    // (lo gestisce generaPdfCanto, che si occupa da sé delle sue pagine interne).
    const gruppi = [];
    let gruppoCorrente = [];
    let spazioRimanente = 0;
    canti.forEach((canto, i) => {
        const altezza = altezze[i];
        const staInUnaPagina = altezza <= ALTEZZA_PAGINA_PX;
        if (staInUnaPagina && altezza <= spazioRimanente) {
            gruppoCorrente.push(canto);
            spazioRimanente -= altezza;
        } else {
            if (gruppoCorrente.length) gruppi.push(gruppoCorrente);
            gruppoCorrente = [canto];
            spazioRimanente = staInUnaPagina ? (ALTEZZA_PAGINA_PX - altezza) : 0;
        }
    });
    if (gruppoCorrente.length) gruppi.push(gruppoCorrente);

    const { PDFDocument } = PDFLib;
    const pdfFinale = await PDFDocument.create();

    for (const gruppo of gruppi) {
        let bytesGruppo;
        if (gruppo.length === 1) {
            // Canto da solo nel suo gruppo (troppo lungo per stare con altri, o
            // semplicemente l'ultimo rimasto): generaPdfCanto gestisce bene entrambi i casi.
            bytesGruppo = await generaPdfCanto(gruppo[0].titolo, gruppo[0].lyricsHtml);
        } else {
            // Più canti brevi impacchettati: stanno insieme in una sola pagina,
            // nessuna interruzione interna da gestire.
            const sheet = document.createElement('div');
            sheet.className = 'pdf-export-sheet';
            gruppo.forEach(({ titolo, lyricsHtml }) => sheet.appendChild(creaBloccoCanto(titolo, lyricsHtml)));
            bytesGruppo = await generaPdfSemplice(sheet);
        }
        const pdfParziale = await PDFDocument.load(bytesGruppo);
        const pagine = await pdfFinale.copyPages(pdfParziale, pdfParziale.getPageIndices());
        pagine.forEach(p => pdfFinale.addPage(p));
    }

    const bytesFinali = await pdfFinale.save();
    scaricaBytesPdf(bytesFinali, nomeFilePdf(nomeMessa) + ' - Scaletta.pdf');
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