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

// hover effects handled in CSS now

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

// Apply reveal to sections (home page)
document.querySelectorAll(
  '.why-left, .why-right, .pull-quote blockquote, .cta-inner, ' +
  '.offerings h2, .marquee, .about-me-images, .about-me-text'
).forEach(el => {
  el.classList.add('reveal');
  revealObserver.observe(el);
});

// Observe any element that already has .reveal in HTML (e.g. about page)
document.querySelectorAll('.reveal').forEach(el => {
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

// ========== MAILING LIST (Mailchimp) ==========
// Signups post straight into Pip's Mailchimp audience — no backend, no API key.
// Fill in the three values below from Pip's Mailchimp embedded-form URL, which
// looks like:
//   https://pipraine.us21.list-manage.com/subscribe/post?u=abc123...&id=def456...
//                        ^^^^ server           ^^^^^^^^ u        ^^^^^^^^ id
// (Audience > Signup forms > Embedded forms — copy the value from the <form action="...">.)
const MAILCHIMP = {
  server: 'us16',                        // datacenter prefix
  u:      '6768e6d12a87a1a76c4885f96',   // the u= value from the form URL
  id:     '763a28479c',                  // the id= value from the form URL
};

const mailchimpConfigured =
  !/REPLACE_WITH/.test(MAILCHIMP.server + MAILCHIMP.u + MAILCHIMP.id);

// Mailchimp's embedded form supports a JSONP endpoint so we can submit without
// leaving the page. Load its response via a <script> tag and a one-shot callback.
function mailchimpJsonp(url, callback) {
  const cbName = 'mc_cb_' + Date.now();
  const script = document.createElement('script');
  const cleanup = () => {
    delete window[cbName];
    script.remove();
  };
  window[cbName] = (data) => { cleanup(); callback(null, data); };
  script.onerror = () => { cleanup(); callback(new Error('network')); };
  script.src = url + (url.indexOf('?') === -1 ? '?' : '&') + 'c=' + cbName;
  document.body.appendChild(script);
}

function setMailingStatus(statusEl, message, kind) {
  if (!statusEl) return;
  statusEl.textContent = message;              // textContent = no HTML injection
  statusEl.classList.remove('is-success', 'is-error');
  if (kind) statusEl.classList.add('is-' + kind);
  statusEl.hidden = false;
}

document.querySelectorAll('.mailing-form').forEach((form) => {
  const input = form.querySelector('input[type="email"]');
  const button = form.querySelector('button');
  const statusEl = form.querySelector('.mailing-status');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = (input.value || '').trim();
    if (!email || !input.checkValidity()) {
      setMailingStatus(statusEl, 'Please enter a valid email address.', 'error');
      input.focus();
      return;
    }

    if (!mailchimpConfigured) {
      setMailingStatus(statusEl,
        'Signup isn’t connected yet — please check back soon.', 'error');
      return;
    }

    button.disabled = true;
    setMailingStatus(statusEl, 'Subscribing…', null);

    // Build the request. `b_<u>_<id>` is Mailchimp's honeypot: bots fill it,
    // humans leave it blank, so we always send it empty.
    const params = new URLSearchParams({ u: MAILCHIMP.u, id: MAILCHIMP.id, EMAIL: email });
    params.append('b_' + MAILCHIMP.u + '_' + MAILCHIMP.id, '');
    const url = 'https://' + MAILCHIMP.server +
      '.list-manage.com/subscribe/post-json?' + params.toString();

    mailchimpJsonp(url, (err, data) => {
      button.disabled = false;

      if (err || !data) {
        setMailingStatus(statusEl,
          'Something went wrong — please try again in a moment.', 'error');
        return;
      }

      if (data.result === 'success') {
        form.reset();
        setMailingStatus(statusEl,
          'You’re on the list — thank you! ✨', 'success');
        return;
      }

      // Error path: Mailchimp returns an HTML-ish message. Strip tags and show
      // a friendlier line for the common "already subscribed" case.
      const raw = (data.msg || '').replace(/<[^>]*>/g, '');
      const msg = /already subscribed/i.test(raw)
        ? 'You’re already on the list — thank you!'
        : (raw || 'Sorry, we couldn’t subscribe that address.');
      setMailingStatus(statusEl, msg, 'error');
    });
  });
});

// ========== LAZY VIDEOS ==========
// Videos carry no src until they scroll near the viewport, so the page paints
// its poster frame instantly and only fetches the (heavier) video bytes when
// they're actually about to be seen. Autoplay is muted + inline; reduced-motion
// users get a paused video with controls instead.
const lazyVideos = document.querySelectorAll('video.lazy-video');
if (lazyVideos.length) {
  const loadVideo = (video) => {
    if (video.dataset.loaded) return;
    video.dataset.loaded = 'true';
    video.querySelectorAll('source[data-src]').forEach(source => {
      source.src = source.dataset.src;
    });
    video.load();

    if (prefersReducedMotion) {
      video.controls = true;           // let them choose to play
    } else if (video.hasAttribute('data-autoplay')) {
      video.play().catch(() => {        // autoplay blocked → offer controls
        video.controls = true;
      });
    }
  };

  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadVideo(entry.target);
        videoObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '300px 0px' });

  lazyVideos.forEach(v => videoObserver.observe(v));
}
