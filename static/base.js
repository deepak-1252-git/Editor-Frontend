const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1 // Thoda sa hissa dikhte hi shuru ho jaye
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const cards = entry.target.querySelectorAll('.mini-card');

        if (entry.isIntersecting) {
            // Jab section dikhe -> Class add karo
            cards.forEach(card => card.classList.add('animate-now'));
        } else {
            // Jab section screen se bahar jaye -> Class hata do 
            // (Taaki agli baar scroll pe phir se pop ho)
            cards.forEach(card => card.classList.remove('animate-now'));
        }
    });
}, observerOptions);

observer.observe(document.querySelector('#trigger-section'));