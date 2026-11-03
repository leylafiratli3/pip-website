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

// If Pip has reCAPTCHA switched on in Mailchimp, the background (JSONP) signup
// is refused with msg "captcha". Fall back to a normal POST to Mailchimp's
// hosted page, which shows the captcha and then confirms the signup.
function mailchimpHostedSubmit(fields) {
  const fallback = document.createElement('form');
  fallback.method = 'post';
  fallback.action = 'https://' + MAILCHIMP.server +
    '.list-manage.com/subscribe/post?u=' + MAILCHIMP.u + '&id=' + MAILCHIMP.id;
  Object.entries(fields).forEach(([name, value]) => {
    const field = document.createElement('input');
    field.type = 'hidden';
    field.name = name;
    field.value = value;
    fallback.appendChild(field);
  });
  document.body.appendChild(fallback);
  fallback.submit();
}

document.querySelectorAll('.mailing-form').forEach((form) => {
  const nameInput = form.querySelector('input[name="FNAME"]');
  const input = form.querySelector('input[type="email"]');
  const button = form.querySelector('button');
  const statusEl = form.querySelector('.mailing-status');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const firstName = (nameInput ? nameInput.value : '').trim();
    if (nameInput && !firstName) {
      setMailingStatus(statusEl, 'Please enter your first name.', 'error');
      nameInput.focus();
      return;
    }

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
    const params = new URLSearchParams({
      u: MAILCHIMP.u, id: MAILCHIMP.id, EMAIL: email, FNAME: firstName,
    });
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
          'Thank you, ' + firstName + '! Keep an eye on your inbox ✨', 'success');
        return;
      }

      if (/captcha/i.test(data.msg || '')) {
        setMailingStatus(statusEl,
          'Taking you to a quick “I’m not a robot” check…', null);
        mailchimpHostedSubmit({ EMAIL: email, FNAME: firstName });
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

// ========== CONTACT FORM (Formspree) ==========
// AJAX submit so visitors stay on the page and see an inline confirmation
// instead of a redirect. Reuses setMailingStatus() for consistent styling.
document.querySelectorAll('.ct-form').forEach((form) => {
  const button = form.querySelector('button[type="submit"]');
  const statusEl = form.querySelector('.mailing-status');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Let the browser flag missing/invalid required fields first.
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    button.disabled = true;
    setMailingStatus(statusEl, 'Sending…', null);

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        button.disabled = false;

        if (ok) {
          form.reset();
          setMailingStatus(statusEl,
            'Thank you — your note is on its way. I’ll be in touch soon. ✨', 'success');
          return;
        }

        // Formspree returns { errors: [{ message }] } on failure.
        const msg = data && data.errors && data.errors.length
          ? data.errors.map((err) => err.message).join(' ')
          : 'Something went wrong — please try again in a moment.';
        setMailingStatus(statusEl, msg, 'error');
      })
      .catch(() => {
        button.disabled = false;
        setMailingStatus(statusEl,
          'Something went wrong — please try again in a moment.', 'error');
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
