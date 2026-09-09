document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.faq-domanda').forEach(function (domanda) {
        domanda.addEventListener('click', function () {
            const aperta = domanda.closest('.faq-item').classList.toggle('aperta');
            // Segnala a chi usa uno screen reader se la risposta è visibile o no
            domanda.setAttribute('aria-expanded', aperta ? 'true' : 'false');
        });
    });
});
