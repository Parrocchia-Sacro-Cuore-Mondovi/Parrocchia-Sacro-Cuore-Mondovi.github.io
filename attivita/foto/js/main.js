// --- Etichette leggibili per le classi (categorie) note ---
const ETICHETTE_CLASSE = {
    "oratorio": "Oratorio",
    "estateRagazzi": "Estate Ragazzi"
};

// Se in futuro viene aggiunta una nuova classe non ancora mappata sopra,
// genera comunque un'etichetta leggibile a partire dal nome della classe.
function etichettaClasse(classe) {
    if (ETICHETTE_CLASSE[classe]) return ETICHETTE_CLASSE[classe];
    const conSpazi = classe.replace(/([a-z])([A-Z])/g, '$1 $2');
    return conSpazi.charAt(0).toUpperCase() + conSpazi.slice(1);
}

function classeBadge(classe) {
    return ETICHETTE_CLASSE[classe] ? `badge-${classe}` : 'badge-default';
}

const fotoList = document.getElementById('fotoList');
const fotoEmpty = document.getElementById('fotoEmpty');
const fotoFilters = document.getElementById('fotoFilters');

let filtroAttivo = 'tutti';

function disegnaLista() {
    fotoList.innerHTML = '';
    const elementi = (filtroAttivo === 'tutti') ? fotoDb : fotoDb.filter(f => f.classe === filtroAttivo);

    if (elementi.length === 0) {
        fotoEmpty.hidden = false;
        return;
    }
    fotoEmpty.hidden = true;

    for (let foto of elementi) {
        const fotoHTML = `
            <li class="foto-item">
                <div class="foto-item-left">
                    <i class="fa-solid fa-images foto-item-icon"></i>
                    <div class="foto-info">
                        <span class="foto-badge ${classeBadge(foto.classe)}">${etichettaClasse(foto.classe)}</span>
                        <h4>${foto.titolo}</h4>
                    </div>
                </div>
                <a href="${foto.link}" target="_blank" rel="noopener" class="btn-apri">Apri <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
            </li>
        `;
        fotoList.insertAdjacentHTML('beforeend', fotoHTML);
    }
}

// Genera i pulsanti filtro in base alle classi realmente presenti nel database,
// così una nuova classe aggiunta in futuro compare automaticamente.
function creaFiltri() {
    fotoFilters.innerHTML = '';
    const classiPresenti = [...new Set(fotoDb.map(f => f.classe))];

    const btnTutti = document.createElement('button');
    btnTutti.type = 'button';
    btnTutti.className = 'filter-btn active';
    btnTutti.textContent = 'Tutti';
    btnTutti.dataset.classe = 'tutti';
    fotoFilters.appendChild(btnTutti);

    for (let classe of classiPresenti) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'filter-btn';
        btn.textContent = etichettaClasse(classe);
        btn.dataset.classe = classe;
        fotoFilters.appendChild(btn);
    }

    fotoFilters.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filtroAttivo = btn.dataset.classe;
            fotoFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            disegnaLista();
        });
    });
}

if (typeof fotoDb === 'undefined' || fotoDb.length === 0) {
    fotoFilters.hidden = true;
    fotoEmpty.hidden = false;
} else {
    creaFiltri();
    disegnaLista();
}
