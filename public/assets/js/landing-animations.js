(function () {
  document.addEventListener('DOMContentLoaded', function () {
    
    // Activar animaciones progresivas
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationDelay = '0s';
          entry.target.style.opacity = '1';
        }
      });
    }, observerOptions);
    
    // Observar elementos con animación
    document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => {
      el.style.opacity = '0';
      observer.observe(el);
    });
    
    // Animación escalonada para feature items
    document.querySelectorAll('.feature-item').forEach((item, index) => {
      item.style.animationDelay = `${index * 0.1}s`;
    });
  });
})();
