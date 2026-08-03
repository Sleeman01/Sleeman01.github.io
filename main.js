(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll-triggered reveal
  const revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion) {
    revealEls.forEach(el => el.classList.add('reveal-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  // Staggered hero entrance
  const heroEls = document.querySelectorAll('[data-hero-in]');
  if (!reduceMotion) {
    heroEls.forEach((el, i) => {
      el.style.transitionDelay = (i * 90) + 'ms';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.classList.add('hero-in-visible');
      }));
    });
  } else {
    heroEls.forEach(el => el.classList.add('hero-in-visible'));
  }

  // Magnetic buttons
  if (!reduceMotion && matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0,0)';
      });
    });
  }
})();
