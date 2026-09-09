document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.faq-domanda').forEach(function (domanda) {
        domanda.addEventListener('click', function () {
            domanda.closest('.faq-item').classList.toggle('aperta');
        });
    });
});
