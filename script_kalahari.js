// Scroll-triggered fade-in animations
document.addEventListener('DOMContentLoaded', () => {
  // Intersection Observer for fade-in elements
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.fade-in, .timeline-item').forEach(el => observer.observe(el));

  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  // Typewriter effect for elements with .typewriter class
  document.querySelectorAll('.typewriter').forEach(el => {
    const text = el.textContent;
    el.textContent = '';
    let i = 0;
    const type = () => {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(type, 40 + Math.random() * 30);
      }
    };
    const twObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { type(); twObserver.disconnect(); }
    }, { threshold: 0.5 });
    twObserver.observe(el);
  });

  // Parallax on hero backgrounds
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      heroBg.style.transform = `translateY(${scrolled * 0.3}px) scale(1.1)`;
    }, { passive: true });
  }

  // Redacted text reveal on hover
  document.querySelectorAll('.redacted').forEach(el => {
    el.title = 'REDACTED';
    el.addEventListener('mouseenter', () => {
      el.style.background = 'transparent';
      el.style.color = 'var(--red-classified)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.background = 'var(--text-primary)';
      el.style.color = 'var(--text-primary)';
    });
  });

  // Active nav link highlighting
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage) a.classList.add('active');
  });
});
