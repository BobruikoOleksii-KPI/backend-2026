const burger = document.getElementById('burger');
const navMenu = document.querySelector('.nav-menu');

burger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    burger.classList.toggle('active');
});

document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', function(e) {
        if (this.getAttribute('href') === '#') {
            e.preventDefault();
            alert('Розділ у розробці, буде доступний у наступних лабораторних роботах.');
        }
    });
});