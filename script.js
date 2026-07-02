// ========== BREATH ORB ==========
const orb = document.querySelector('.orb');
const orbLabel = document.querySelector('.orb-label');
const orbCount = document.querySelector('.orb-count');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const phases = [
  { name: 'inhale',  duration: 4 },
  { name: 'hold',    duration: 4 },
  { name: 'exhale',  duration: 6 },
  { name: 'rest',    duration: 2 },
];

let phaseIndex = 0;
let countdown = 0;
let countdownTimer = null;

function startPhase() {
  if (!orb || prefersReducedMotion) return;

  const phase = phases[phaseIndex];
  orb.setAttribute('data-phase', phase.name);
  orbLabel.textContent = phase.name;
  countdown = phase.duration;
  orbCount.textContent = countdown;

  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(countdownTimer);
      phaseIndex = (phaseIndex + 1) % phases.length;
      startPhase();
      return;
    }
    orbCount.textContent = countdown;
  }, 1000);
}

if (orb && !prefersReducedMotion) {
  startPhase();
}

// ========== HERO HOVER — subtle reactions ==========
document.querySelectorAll('.collage-yinyang, .collage-moon, .collage-star, .hero-anchor').forEach(el => {
  el.addEventListener('mouseenter', () => {
    el.style.transition = 'transform 0.4s ease';
    el.style.transform = 'scale(1.12) rotate(6deg)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.transition = 'transform 0.5s ease';
    el.style.transform = '';
  });
});

// Selfie slight lift
const selfie = document.querySelector('.collage-main');
if (selfie) {
  selfie.addEventListener('mouseenter', () => {
    selfie.style.transition = 'transform 0.4s ease';
    selfie.style.transform = 'translate(-50%, -50%) rotate(0deg) scale(1.03)';
  });
  selfie.addEventListener('mouseleave', () => {
    selfie.style.transition = 'transform 0.5s ease';
    selfie.style.transform = '';
  });
}

// ========== MOBILE MENU ==========
const menuToggle = document.querySelector('.menu-toggle');
const navOverlay = document.querySelector('.nav-overlay');

if (menuToggle && navOverlay) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.classList.toggle('active');
    navOverlay.classList.toggle('open');
    navOverlay.setAttribute('aria-hidden', !isOpen);
    menuToggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  navOverlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navOverlay.classList.remove('open');
      navOverlay.setAttribute('aria-hidden', 'true');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

// ========== HEADER SCROLL ==========
const header = document.querySelector('.site-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

// ========== SCROLL REVEAL ==========
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

// Apply reveal to sections
document.querySelectorAll(
  '.why-left, .why-right, .pull-quote blockquote, .cta-inner, ' +
  '.offerings h2, .marquee, .about-me-images, .about-me-text'
).forEach(el => {
  el.classList.add('reveal');
  revealObserver.observe(el);
});

// Left/right reveals
document.querySelectorAll('.why-left, .about-me-images').forEach(el => {
  el.classList.add('reveal-left');
});

document.querySelectorAll('.why-right, .about-me-text').forEach(el => {
  el.classList.add('reveal-right');
});

// Scale reveals
document.querySelectorAll('.pull-quote blockquote').forEach(el => {
  el.classList.add('reveal-scale');
});

// Offering cards
document.querySelectorAll('.offer-card').forEach(el => {
  revealObserver.observe(el);
});
