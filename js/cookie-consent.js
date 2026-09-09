// Gestione del consenso cookie per Google Analytics (GA4).
// Nessuno script di tracciamento viene caricato finché l'utente non clicca "Accetta":
// se l'utente rifiuta (o non ha ancora deciso) Google Analytics non viene mai richiesto al browser.

// Measurement ID di Google Analytics 4. Sostituire con quello reale creato su analytics.google.com
// (formato G-XXXXXXXXXX). Finché resta questo placeholder, Analytics non si attiva nemmeno se
// l'utente accetta, per evitare di inviare dati a un ID inesistente.
const GA_MEASUREMENT_ID = 'G-EVDVDPMRR3';

const CHIAVE_CONSENSO_COOKIE = 'consenso_cookie_analytics';

function caricaGoogleAnalytics() {
    if (window.gaCaricato || GA_MEASUREMENT_ID.includes('XXXX')) return;
    window.gaCaricato = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
}

function mostraBannerCookie() {
    if (document.getElementById('cookieBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'cookieBanner';
    banner.className = 'cookie-banner';
    banner.innerHTML = `
        <p>
            Questo sito utilizza cookie statistici (Google Analytics) solo previo consenso, per capire
            come viene usato il sito e migliorarlo. Leggi l'<a href="/privacy/">informativa privacy</a>.
        </p>
        <div class="cookie-banner-azioni">
            <button type="button" id="cookieRifiutaBtn" class="btn-cookie btn-cookie-secondario">Rifiuta</button>
            <button type="button" id="cookieAccettaBtn" class="btn-cookie btn-cookie-primario">Accetta</button>
        </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('cookieAccettaBtn').addEventListener('click', () => {
        try { localStorage.setItem(CHIAVE_CONSENSO_COOKIE, 'accettato'); } catch (e) { /* ignorato */ }
        banner.remove();
        caricaGoogleAnalytics();
    });

    document.getElementById('cookieRifiutaBtn').addEventListener('click', () => {
        try { localStorage.setItem(CHIAVE_CONSENSO_COOKIE, 'rifiutato'); } catch (e) { /* ignorato */ }
        banner.remove();
    });
}

// Richiamata dal link "Preferenze Cookie" nel footer per permettere di cambiare idea in seguito.
function apriPreferenzeCookie() {
    mostraBannerCookie();
}

document.addEventListener('DOMContentLoaded', function () {
    let consenso = null;
    try { consenso = localStorage.getItem(CHIAVE_CONSENSO_COOKIE); } catch (e) { /* ignorato */ }

    if (consenso === 'accettato') {
        caricaGoogleAnalytics();
    } else if (consenso !== 'rifiutato') {
        mostraBannerCookie();
    }
});
