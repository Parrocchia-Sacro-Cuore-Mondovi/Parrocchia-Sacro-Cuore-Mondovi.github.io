function toggleNav() {
    const nav = document.getElementById('mainNav');
    const overlay = document.getElementById('navOverlay');
    
    // Controlla se gli elementi esistono sulla pagina per evitare errori
    if(nav && overlay) {
        nav.classList.toggle('open');
        overlay.classList.toggle('active');
    }
}

document.addEventListener("DOMContentLoaded", function() {
    
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            
            // Verifica se siamo su smartphone
            if (window.innerWidth <= 768) {
                
                const parentLi = this.parentElement;
                const subMenu = parentLi.querySelector('.dropdown-menu');
                
                if (subMenu) {
                    e.preventDefault(); // Blocca il link alla pagina
                    parentLi.classList.toggle('active'); // Mette/toglie la classe
                }
            }
        });
    });

});
