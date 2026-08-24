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

    const pdfMessaBtn = document.getElementById('pdf-download-messa-btn');
    if (pdfMessaBtn) pdfMessaBtn.addEventListener('click', () => scaricaPdfMessa(pdfMessaBtn.dataset.nomeMessa));

    // Finestra di selezione canti
    const apriSelezioneBtn = document.getElementById('apri-selezione-btn');
    if (apriSelezioneBtn) apriSelezioneBtn.addEventListener('click', apriSelezione);

    const chiudiSelezioneBtn = document.getElementById('selezione-chiudi-btn');
    if (chiudiSelezioneBtn) chiudiSelezioneBtn.addEventListener('click', chiudiSelezione);

    const selezioneOverlay = document.getElementById('selezione-overlay');
    if (selezioneOverlay) {
        selezioneOverlay.addEventListener('click', (e) => {
            if (e.target === selezioneOverlay) chiudiSelezione();
        });
    }

    const selezioneSearch = document.getElementById('selezione-search');
    if (selezioneSearch) {
        selezioneSearch.addEventListener('input', (e) => popolaListaSelezione(e.target.value));
    }

    const selezioneTuttiBtn = document.getElementById('selezione-tutti-btn');
    if (selezioneTuttiBtn) {
        selezioneTuttiBtn.addEventListener('click', () => {
            document.querySelectorAll('#selezione-lista input[type="checkbox"]').forEach(cb => {
                if (!cb.checked) { cb.checked = true; cb.dispatchEvent(new Event('change')); }
            });
        });
    }

    const selezioneNessunoBtn = document.getElementById('selezione-nessuno-btn');
    if (selezioneNessunoBtn) {
        selezioneNessunoBtn.addEventListener('click', () => {
            document.querySelectorAll('#selezione-lista input[type="checkbox"]').forEach(cb => {
                if (cb.checked) { cb.checked = false; cb.dispatchEvent(new Event('change')); }
            });
        });
    }

    const scaricaZipBtn = document.getElementById('selezione-scarica-zip-btn');
    if (scaricaZipBtn) {
        scaricaZipBtn.addEventListener('click', () => {
            const canti = ottieniCantiSelezionati();
            if (canti.length === 0) return;
            eseguiConCaricamento(scaricaZipBtn, () => generaEScaricaZip(canti, 'Canti.zip'));
        });
    }

    const scaricaUnicoBtn = document.getElementById('selezione-scarica-unico-btn');
    if (scaricaUnicoBtn) {
        scaricaUnicoBtn.addEventListener('click', () => {
            const canti = ottieniCantiSelezionati();
            if (canti.length === 0) return;
            eseguiConCaricamento(scaricaUnicoBtn, () => generaEScaricaPdfUnico(canti, 'Canti selezionati.pdf'));
        });
    }
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

    const apriSelezioneBtn = document.getElementById('apri-selezione-btn');
    if (apriSelezioneBtn) {
        apriSelezioneBtn.style.display = (tipo === 'messa') ? 'none' : 'flex';
    }

    aggiornaListaCanti();
    
    const sidebar = document.getElementById('filterSidebar');
    if (window.innerWidth <= 768 && sidebar.classList.contains('show-mobile')) {
        toggleSidebar();
    }
}

// Converte il testo_md di un canto nell'HTML renderizzato (markdown + accordi),
// esattamente come mostrato sul sito. Riusata sia per la lista dei canti sia per
// la generazione dei PDF nella finestra di selezione.
function renderizzaLyrics(testoMd) {
    let testoConAccordi = testoMd.replace(/(\S*\[[^\]]+\]\S*)/g, '<span class="keep-together">$1</span>');
    testoConAccordi = testoConAccordi.replace(/\[([^\]]+)\]/g, (match, accordo) => {
        return `<span class="c" data-v="${accordo}"></span>`;
    });
    return marked.parse(testoConAccordi, { breaks: true });
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
        const testoHtml = renderizzaLyrics(canto.testo_md);

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

// Larghezza di una colonna in modalità a due colonne: foglio 720px, padding 20px
// per lato (40px totali), 28px di spazio tra le due colonne: (720-40-28)/2 = 326px.
const LARGHEZZA_COLONNA_PX = 326;

// Costruisce il PDF (una singola pagina, sempre) a partire da un canvas già
// renderizzato: lo scala per riempire la larghezza utile e, se non ci sta in
// altezza, lo restringe (mantenendo le proporzioni, quindi rimpicciolendo anche il
// testo) e lo centra orizzontalmente. Usiamo html2canvas + jsPDF direttamente (non
// il livello "alto" di html2pdf.js): quest'ultimo ha una sua euristica di
// impaginazione automatica che, anche disattivata esplicitamente, in certi casi
// aggiunge comunque una pagina vuota di troppo. Piazzando noi stessi l'immagine su
// un'unica pagina jsPDF non c'è alcun modo che ne venga creata una in più.
function costruisciPdfDaPaginaSingola(canvas) {
    const margine = 15; // mm
    const larghezzaUtileMm = 210 - margine * 2; // A4
    const altezzaUtileMm = 297 - margine * 2;

    let imgWMm = larghezzaUtileMm;
    let imgHMm = (canvas.height * larghezzaUtileMm) / canvas.width;

    if (imgHMm > altezzaUtileMm) {
        const fattore = altezzaUtileMm / imgHMm;
        imgHMm = altezzaUtileMm;
        imgWMm = larghezzaUtileMm * fattore;
    }

    const xOffset = margine + (larghezzaUtileMm - imgWMm) / 2;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', xOffset, margine, imgWMm, imgHMm);

    return doc.output('arraybuffer');
}

// Genera il PDF (una singola pagina, sempre) di un elemento .pdf-export-sheet già
// pronto, e restituisce i byte grezzi.
async function generaPdfSemplice(sheet) {
    document.body.appendChild(sheet);
    await attendiRenderPronto();

    const canvas = await html2canvas(sheet, { scale: 2, useCORS: true });
    sheet.remove();

    return costruisciPdfDaPaginaSingola(canvas);
}

// Non comprimiamo il testo di un canto oltre il 72% delle dimensioni normali: oltre
// quella soglia diventerebbe troppo piccolo per essere leggibile, meglio provare
// prima le due colonne, e solo come ultima spiaggia più pagine.
const FATTORE_MINIMO_COMPRESSIONE = 0.72;

// Renderizza l'HTML indicato (a colonna singola o doppia) e restituisce il canvas
// insieme al fattore di compressione che servirebbe per farlo stare in una pagina
// (1 = ci sta già senza rimpicciolire nulla).
async function provaUnaPagina(html, dueColonne) {
    const sheet = document.createElement('div');
    sheet.className = dueColonne ? 'pdf-export-sheet due-colonne' : 'pdf-export-sheet';
    sheet.innerHTML = html;
    document.body.appendChild(sheet);
    await attendiRenderPronto();

    const canvas = await html2canvas(sheet, { scale: 2, useCORS: true });
    sheet.remove();

    const larghezzaUtileMm = 180; // 210mm A4 - 15mm di margine per lato
    const altezzaUtileMm = 267; // 297mm A4 - 15mm di margine per lato
    const altezzaNaturaleMm = (canvas.height * larghezzaUtileMm) / canvas.width;
    const fattore = Math.min(1, altezzaUtileMm / altezzaNaturaleMm);

    return { canvas, fattore };
}

// Genera il PDF di UN canto. Prova, in ordine: una pagina a colonna singola
// (comprimendo leggermente il testo se serve), poi una pagina a due colonne (che
// raddoppia lo spazio utile), e solo se il canto è comunque troppo lungo lo divide
// su più pagine.
async function generaPdfCanto(titolo, lyricsHtml) {
    const html = `<div class="pdf-export-title">${titolo}</div><div class="lyrics">${lyricsHtml}</div>`;

    let tentativo = await provaUnaPagina(html, false);
    if (tentativo.fattore >= FATTORE_MINIMO_COMPRESSIONE) {
        return costruisciPdfDaPaginaSingola(tentativo.canvas);
    }

    tentativo = await provaUnaPagina(html, true);
    if (tentativo.fattore >= FATTORE_MINIMO_COMPRESSIONE) {
        return costruisciPdfDaPaginaSingola(tentativo.canvas);
    }

    return generaPdfCantoMultiPagina(titolo, lyricsHtml);
}

// Genera il PDF di UN canto su più pagine. Misuriamo l'altezza di ogni verso/
// ritornello (in pixel CSS) e decidiamo noi i punti di interruzione; ogni pagina
// viene poi generata singolarmente e le uniamo con pdf-lib.
async function generaPdfCantoMultiPagina(titolo, lyricsHtml) {
    const sheetMisura = document.createElement('div');
    sheetMisura.className = 'pdf-export-sheet';
    document.body.appendChild(sheetMisura);

    sheetMisura.innerHTML = `<div class="pdf-export-title">${titolo}</div>`;
    const altezzaTitolo = sheetMisura.firstElementChild.offsetHeight;

    const lyricsMisura = document.createElement('div');
    lyricsMisura.className = 'lyrics';
    sheetMisura.innerHTML = '';
    sheetMisura.appendChild(lyricsMisura);
    
    // Usiamo la stessa funzione robusta usata in generaEScaricaPdfUnico
    const elementiHtml = estraiElementiLyrics(lyricsHtml);
    
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

// --- DOWNLOAD PDF DI PIÙ CANTI (scaletta di una messa, o selezione multipla) ---



// Estrae in modo robusto i blocchi logici (paragrafi/strofe) dall'HTML di un canto.
// Questo previene il bug dei "testi vuoti" e permette di spezzare fluidamente i canti.
function estraiElementiLyrics(lyricsHtml) {
    const div = document.createElement('div');
    div.innerHTML = lyricsHtml.trim();
    
    const elements = [];
    let currentP = null;

    Array.from(div.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent.trim().length > 0) {
                if (!currentP) currentP = document.createElement('p');
                currentP.appendChild(node.cloneNode(true));
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (['P', 'BLOCKQUOTE', 'DIV'].includes(node.tagName)) {
                if (currentP) {
                    if (currentP.textContent.trim().length > 0) elements.push(currentP.outerHTML);
                    currentP = null;
                }
                if (node.textContent.trim().length > 0) elements.push(node.outerHTML);
            } else if (node.tagName === 'BR') {
                if (currentP) {
                    currentP.appendChild(node.cloneNode(true));
                }
            } else {
                if (!currentP) currentP = document.createElement('p');
                currentP.appendChild(node.cloneNode(true));
            }
        }
    });

    if (currentP && currentP.textContent.trim().length > 0) {
        elements.push(currentP.outerHTML);
    }

    return elements;
}

// Costruisce i blocchi del canto per la stampa. Dividendo in strofe massimizziamo
// la compattezza, perché il testo "scorre" a riempire i buchi a fine colonna.
// Aggiungiamo nextBlock per poter prevenire che il titolo rimanga solo (orfano).
function costruisciBlocchiCanto(titolo, lyricsHtml) {
    const elementi = estraiElementiLyrics(lyricsHtml);
    if (elementi.length === 0) return [];

    const blocchi = [];
    blocchi.push({
        tipo: 'intro',
        titolo: titolo,
        lyricsHtml: lyricsHtml,
        html: `<div class="pdf-export-song-block"><div class="pdf-export-title">${titolo}</div><div class="lyrics">${elementi[0]}</div></div>`
    });

    for (let i = 1; i < elementi.length; i++) {
        blocchi.push({
            tipo: 'testo',
            titolo: titolo,
            html: elementi[i]
        });
    }
    
    for (let i = 0; i < blocchi.length - 1; i++) {
        blocchi[i].nextBlock = blocchi[i+1];
    }
    
    return blocchi;
}

// Riunisce l'elenco di blocchi di UNA pagina nell'HTML del foglio: i blocchi
// "testo" consecutivi (continuazione dello stesso canto) condividono un unico
// contenitore .lyrics, i blocchi "intro" (titolo + primo verso) restano a sé.
function assemblaHtmlPagina(blocchiPagina) {
    let html = '';
    let bufferTesto = [];
    const svuotaBuffer = () => {
        if (bufferTesto.length) {
            html += `<div class="lyrics">${bufferTesto.join('')}</div>`;
            bufferTesto = [];
        }
    };
    blocchiPagina.forEach(b => {
        if (b.tipo === 'intro') {
            svuotaBuffer();
            html += b.html;
        } else {
            bufferTesto.push(b.html);
        }
    });
    svuotaBuffer();
    return html;
}

// Genera un unico PDF a partire da un elenco di canti {titolo, lyricsHtml} e lo
// scarica con il nome indicato. Costruiamo e misuriamo PRIMA i blocchi di TUTTI i
// canti, poi decidiamo l'impaginazione impacchettandoli in un flusso continuo
// (un canto breve prosegue subito dopo il precedente sulla stessa pagina, invece
// di sprecare spazio bianco iniziando sempre una pagina nuova per ognuno).
async function generaEScaricaPdfUnico(canti, nomeFile, titoloDocumento = null) {
    if (canti.length === 0) return;

    if (canti.length === 1 && !titoloDocumento) {
        // Un solo canto (e nessun titolo documento): usiamo generaPdfCanto direttamente
        const bytes = await generaPdfCanto(canti[0].titolo, canti[0].lyricsHtml);
        scaricaBytesPdf(bytes, nomeFile);
        return;
    }
    const tuttiIBlocchi = [];
    canti.forEach(({ titolo, lyricsHtml }) => {
        tuttiIBlocchi.push(...costruisciBlocchiCanto(titolo, lyricsHtml));
    });

    // 2. Misuriamo l'altezza di ciascun blocco così come verrà effettivamente
    // renderizzato: dentro una colonna stretta (non a piena larghezza del foglio),
    // perché il testo va a capo diversamente ed è più alto rispetto a una sola
    // colonna larga. Nessun padding qui: nel foglio vero il padding è sul
    // contenitore esterno, non ripetuto per ogni colonna.
    const sheetMisura = document.createElement('div');
    sheetMisura.className = 'pdf-export-sheet';
    sheetMisura.style.width = LARGHEZZA_COLONNA_PX + 'px';
    sheetMisura.style.padding = '0';
    // Mettiamo position absolute per evitare che il body (se flex) lo schiacci
    sheetMisura.style.position = 'absolute';
    sheetMisura.style.visibility = 'hidden';
    document.body.appendChild(sheetMisura);
    tuttiIBlocchi.forEach(blocco => {
        if (blocco.tipo === 'intro') {
            sheetMisura.innerHTML = `<div class="pdf-export-colonna">${blocco.html}</div>`;
            blocco.altezza = sheetMisura.firstElementChild.firstElementChild.offsetHeight + 25; // + margin-bottom
        } else {
            sheetMisura.innerHTML = `<div class="pdf-export-colonna"><div class="lyrics">${blocco.html}</div></div>`;
            blocco.altezza = sheetMisura.firstElementChild.firstElementChild.offsetHeight;
        }
    });
    sheetMisura.remove();

    // Calcoliamo l'altezza totale di ogni canto per decidere se isolarlo
    const altezzeTotaliCanti = {};
    tuttiIBlocchi.forEach(b => {
        if (!altezzeTotaliCanti[b.titolo]) altezzeTotaliCanti[b.titolo] = 0;
        altezzeTotaliCanti[b.titolo] += b.altezza;
    });

    const pagine = [];
    let paginaCorrente;
    let colonnaCorrente;
    let numeroColonna;
    let spazioColonna;
    
    function iniziaNuovaPagina() {
        paginaCorrente = { tipo: 'manuale', colonna1: [], colonna2: [] };
        
        if (pagine.length === 0 && titoloDocumento) {
            paginaCorrente.titoloDocumento = titoloDocumento;
            const sheetMisura = document.createElement('div');
            sheetMisura.className = 'pdf-export-sheet due-colonne-manuale';
            sheetMisura.style.position = 'absolute';
            sheetMisura.style.visibility = 'hidden';
            sheetMisura.innerHTML = `<div class="pdf-export-document-title">${titoloDocumento}</div>`;
            document.body.appendChild(sheetMisura);
            paginaCorrente.altezzaTitoloDoc = sheetMisura.firstElementChild.offsetHeight;
            sheetMisura.remove();
        } else {
            paginaCorrente.altezzaTitoloDoc = 0;
        }
        
        pagine.push(paginaCorrente);
        numeroColonna = 0;
        colonnaCorrente = paginaCorrente.colonna1;
        spazioColonna = ALTEZZA_PAGINA_PX - paginaCorrente.altezzaTitoloDoc;
    }
    
    function passaAllaColonnaSuccessiva() {
        if (numeroColonna === 0) {
            numeroColonna = 1;
            colonnaCorrente = paginaCorrente.colonna2;
            spazioColonna = ALTEZZA_PAGINA_PX - paginaCorrente.altezzaTitoloDoc;
        } else {
            iniziaNuovaPagina();
        }
    }

    tuttiIBlocchi.forEach(blocco => {
        if (!paginaCorrente) iniziaNuovaPagina();

        // PREVENZIONE ORFANI: se è un titolo, verifichiamo che ci sia spazio 
        // per il titolo AND almeno il primo blocco di testo, altrimenti passiamo colonna.
        let altezzaRichiesta = blocco.altezza;
        if (blocco.tipo === 'intro' && blocco.nextBlock) {
            altezzaRichiesta += blocco.nextBlock.altezza;
        }

        if (colonnaCorrente.length > 0 && altezzaRichiesta > spazioColonna) {
            passaAllaColonnaSuccessiva();
        }

        colonnaCorrente.push(blocco);
        spazioColonna -= blocco.altezza;
    });

    // 4. Ogni pagina è già "giusta" per costruzione: renderizziamo le due colonne
    // come due contenitori distinti affiancati (non colonne CSS) e le uniamo.
    const { PDFDocument } = PDFLib;
    const pdfFinale = await PDFDocument.create();
    for (const pagina of pagine) {
        const { colonna1, colonna2 } = pagina;
        const sheet = document.createElement('div');
        sheet.className = 'pdf-export-sheet due-colonne-manuale';
        sheet.style.height = ALTEZZA_PAGINA_PX + 'px';
        sheet.style.overflow = 'hidden';
        sheet.style.flexWrap = 'wrap';

        let html = '';
        if (pagina.titoloDocumento) {
            html += `<div class="pdf-export-document-title">${pagina.titoloDocumento}</div>`;
        }

        let h1 = colonna1.reduce((sum, b) => sum + b.altezza, 0);
        let h2 = colonna2.reduce((sum, b) => sum + b.altezza, 0);
        let maxH = ALTEZZA_PAGINA_PX - pagina.altezzaTitoloDoc;
        
        let style1 = h1 > maxH ? ` style="transform: scale(${maxH / h1}); transform-origin: top left;"` : '';
        let style2 = h2 > maxH ? ` style="transform: scale(${maxH / h2}); transform-origin: top left;"` : '';

        html += `<div class="pdf-export-colonna"${style1}>${assemblaHtmlPagina(colonna1)}</div>`;
        if (colonna2.length) {
            html += `<div class="pdf-export-colonna"${style2}>${assemblaHtmlPagina(colonna2)}</div>`;
        }
        sheet.innerHTML = html;
        const bytes = await generaPdfSemplice(sheet);
        const pdfParziale = await PDFDocument.load(bytes);
        const pagineCopiate = await pdfFinale.copyPages(pdfParziale, pdfParziale.getPageIndices());
        pagineCopiate.forEach(p => pdfFinale.addPage(p));
    }

    const bytesFinali = await pdfFinale.save();
    scaricaBytesPdf(bytesFinali, nomeFile);
}

// Genera un file .zip con un PDF separato per ogni canto dell'elenco {titolo, lyricsHtml}.
async function generaEScaricaZip(canti, nomeFileZip) {
    if (canti.length === 0) return;

    const zip = new JSZip();
    const nomiUsati = new Set();
    for (const { titolo, lyricsHtml } of canti) {
        const bytes = await generaPdfCanto(titolo, lyricsHtml);
        let nomeFile = nomeFilePdf(titolo) + '.pdf';
        let contatore = 2;
        while (nomiUsati.has(nomeFile)) {
            nomeFile = `${nomeFilePdf(titolo)} (${contatore}).pdf`;
            contatore++;
        }
        nomiUsati.add(nomeFile);
        zip.file(nomeFile, bytes);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeFileZip;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

async function scaricaPdfMessa(nomeMessa) {
    const cards = document.querySelectorAll('#song-list-container .song-card');
    if (cards.length === 0) return;

    const canti = Array.from(cards).map(card => ({
        titolo: card.querySelector('.song-title').textContent.trim(),
        lyricsHtml: card.querySelector('.lyrics').innerHTML
    }));

    await generaEScaricaPdfUnico(canti, nomeFilePdf(nomeMessa) + ' - Scaletta.pdf', nomeMessa);
}

// --- FINESTRA DI SELEZIONE: scegli uno o più canti da scaricare (ZIP o PDF unico) ---

let cantiSelezionati = new Set(); // titoli dei canti selezionati nella finestra

function apriSelezione() {
    document.getElementById('selezione-overlay').style.display = 'flex';
    const searchInput = document.getElementById('selezione-search');
    searchInput.value = '';
    popolaListaSelezione('');
    aggiornaContatoreSelezione();
}

function chiudiSelezione() {
    document.getElementById('selezione-overlay').style.display = 'none';
}

function popolaListaSelezione(query) {
    const lista = document.getElementById('selezione-lista');
    lista.innerHTML = '';
    const queryPulita = pulisciTesto(query);

    [...datiParrocchiali.canti]
        .sort((a, b) => a.titolo.localeCompare(b.titolo))
        .filter(c => !queryPulita || pulisciTesto(c.titolo).includes(queryPulita))
        .forEach(canto => {
            const id = 'sel-' + canto.titolo.replace(/[^a-zA-Z0-9]/g, '_');
            const riga = document.createElement('div');
            riga.className = 'selezione-riga';
            riga.innerHTML = `
                <input type="checkbox" id="${id}" ${cantiSelezionati.has(canto.titolo) ? 'checked' : ''}>
                <label for="${id}">${canto.titolo}</label>
            `;
            riga.querySelector('input').addEventListener('change', (e) => {
                if (e.target.checked) cantiSelezionati.add(canto.titolo);
                else cantiSelezionati.delete(canto.titolo);
                aggiornaContatoreSelezione();
            });
            lista.appendChild(riga);
        });
}

function aggiornaContatoreSelezione() {
    const n = cantiSelezionati.size;
    document.getElementById('selezione-contatore').textContent =
        n === 0 ? 'Nessun canto selezionato' : (n === 1 ? '1 canto selezionato' : `${n} canti selezionati`);
    document.getElementById('selezione-scarica-zip-btn').disabled = n === 0;
    document.getElementById('selezione-scarica-unico-btn').disabled = n === 0;
}

function ottieniCantiSelezionati() {
    return datiParrocchiali.canti
        .filter(c => cantiSelezionati.has(c.titolo))
        .sort((a, b) => a.titolo.localeCompare(b.titolo))
        .map(c => ({ titolo: c.titolo, lyricsHtml: renderizzaLyrics(c.testo_md) }));
}

// Disabilita il bottone e mostra un'icona di caricamento mentre "azione" è in corso
// (la generazione di più PDF può richiedere qualche secondo).
async function eseguiConCaricamento(bottone, azione) {
    const htmlOriginale = bottone.innerHTML;
    bottone.disabled = true;
    bottone.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generazione...';
    try {
        await azione();
    } finally {
        bottone.innerHTML = htmlOriginale;
        bottone.disabled = cantiSelezionati.size === 0;
    }
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