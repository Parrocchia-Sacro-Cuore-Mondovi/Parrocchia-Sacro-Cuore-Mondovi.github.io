function toggleNav() {
    const nav = document.getElementById('mainNav');
    const overlay = document.getElementById('navOverlay');
    const hamburgerBtn = document.querySelector('.hamburger-btn');

    // Controlla se gli elementi esistono sulla pagina per evitare errori
    if(nav && overlay) {
        const aperto = nav.classList.toggle('open');
        overlay.classList.toggle('active');
        // Segnala a chi usa uno screen reader se il menu è aperto o chiuso
        if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', aperto ? 'true' : 'false');
    }
}

document.addEventListener("DOMContentLoaded", function() {

    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

    dropdownToggles.forEach(toggle => {
        if (toggle.parentElement.querySelector('.dropdown-menu')) {
            toggle.setAttribute('aria-expanded', 'false');
        }

        toggle.addEventListener('click', function(e) {

            // Verifica se siamo su smartphone
            if (window.innerWidth <= 768) {

                const parentLi = this.parentElement;
                const subMenu = parentLi.querySelector('.dropdown-menu');

                if (subMenu) {
                    e.preventDefault(); // Blocca il link alla pagina
                    const aperto = parentLi.classList.toggle('active'); // Mette/toglie la classe
                    this.setAttribute('aria-expanded', aperto ? 'true' : 'false');
                }
            }
        });
    });

    // Chiude il menu mobile con il tasto Esc, utile per chi naviga da tastiera
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const nav = document.getElementById('mainNav');
            if (nav && nav.classList.contains('open')) {
                toggleNav();
            }
        }
    });

});
