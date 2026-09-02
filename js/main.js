/* ================================================================
   AG MOTORS MIAMI — main.js  (performance-optimised)
   ================================================================ */

'use strict';

/* ── 1. Lenis + GSAP — single ticker, no duplicate RAF loop ─────── */
const lenis = new Lenis({
  duration: 1.3,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
});

// ONE source of truth: GSAP ticker drives Lenis.
// Do NOT also run a manual requestAnimationFrame(lenisRaf) loop —
// that would call lenis.raf() twice per frame causing double updates.
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
lenis.on('scroll', ScrollTrigger.update);

/* ── 2. Header scroll state ─────────────────────────────────────── */
(function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  ScrollTrigger.create({
    start: '80px top',
    onEnter:     () => header.classList.add('is-scrolled'),
    onLeaveBack: () => header.classList.remove('is-scrolled'),
  });
})();

/* ── 3. Hero entrance animation ─────────────────────────────────── */
(function initHero() {
  const lines   = document.querySelectorAll('.hero__line');
  const eyebrow = document.querySelector('.hero__eyebrow');
  const sub     = document.querySelector('.hero__sub');
  const badge   = document.querySelector('.google-badge');
  const actions = document.querySelector('.hero__actions');
  const chauffeurBtn = document.querySelector('.hero__chauffeur-btn');

  if (!lines.length) return;

  gsap.set([eyebrow, sub, badge, actions, chauffeurBtn], { y: 18 });

  gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.2 } })
    .to(lines,   { y: '0%', stagger: 0.1, delay: 0.25 })
    .to(eyebrow, { opacity: 1, y: 0, duration: 0.8 }, '-=0.7')
    .to(sub,     { opacity: 1, y: 0, duration: 0.8 }, '-=0.55')
    .to(badge,   { opacity: 1, y: 0, duration: 0.8 }, '-=0.55')
    .to(actions, { opacity: 1, y: 0, duration: 0.8 }, '-=0.55')
    .to(chauffeurBtn, { opacity: 1, y: 0, duration: 0.8 }, '-=0.55')
    // Drop the inline transform GSAP leaves behind — otherwise it outranks
    // the CSS :hover transform on .google-badge and the hover effect never shows.
    .set(badge, { clearProps: 'transform' });
})();

/* ── 4. Hero photo parallax ─────────────────────────────────────── */
(function initHeroParallax() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const photo = document.querySelector('.hero__photo');
  if (!photo) return;

  gsap.to(photo, {
    yPercent: 12,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
})();

/* ── 5. Fleet cards 3D tilt ─────────────────────────────────────── */
(function initTilt() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cards = document.querySelectorAll('[data-tilt]');
  if (!cards.length) return;

  // Single shared bounds map — avoids 10 separate resize listeners
  const boundsMap = new Map();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cards.forEach(c => boundsMap.set(c, c.getBoundingClientRect()));
    }, 150);
  }, { passive: true });

  cards.forEach(card => {
    // Cache bounds on enter (element is in viewport, rect is fresh)
    card.addEventListener('mouseenter', () => {
      boundsMap.set(card, card.getBoundingClientRect());
    }, { passive: true });

    card.addEventListener('mousemove', e => {
      const b = boundsMap.get(card);
      if (!b) return;
      const x = (e.clientX - b.left) / b.width  - 0.5;
      const y = (e.clientY - b.top)  / b.height - 0.5;
      gsap.to(card, {
        rotateY: x * 8,
        rotateX: -y * 6,
        transformPerspective: 900,
        ease: 'power2.out',
        duration: 0.45,
        overwrite: 'auto',
      });
    }, { passive: true });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateY: 0, rotateX: 0,
        ease: 'expo.out', duration: 1,
        overwrite: 'auto',
      });
    }, { passive: true });
  });
})();

/* ── 6. Magnetic buttons ─────────────────────────────────────────── */
(function initMagnetic() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  document.querySelectorAll('.magnetic').forEach(el => {
    const STRENGTH = 0.35;
    let bounds = null;

    // Cache on enter — NOT on every mousemove (avoids forced reflow)
    el.addEventListener('mouseenter', () => {
      bounds = el.getBoundingClientRect();
    }, { passive: true });

    el.addEventListener('mousemove', e => {
      if (!bounds) return;
      const dx = (e.clientX - bounds.left - bounds.width  / 2) * STRENGTH;
      const dy = (e.clientY - bounds.top  - bounds.height / 2) * STRENGTH;
      gsap.to(el, { x: dx, y: dy, ease: 'power3.out', duration: 0.4, overwrite: 'auto' });
    }, { passive: true });

    el.addEventListener('mouseleave', () => {
      bounds = null;
      gsap.to(el, { x: 0, y: 0, ease: 'elastic.out(1, 0.4)', duration: 0.9, overwrite: 'auto' });
    }, { passive: true });
  });
})();

/* ── 7. Why Us scroll reveal ─────────────────────────────────────── */
(function initWhyUs() {
  const items = document.querySelectorAll('[data-why]');
  if (!items.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => entry.target.classList.add('is-visible'), i * 120);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  items.forEach(item => observer.observe(item));
})();

/* ── 7a. Private Driver scroll reveal ─────────────────────────────── */
(function initChauffeur() {
  const items = document.querySelectorAll('[data-chauffeur]');
  if (!items.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => entry.target.classList.add('is-visible'), i * 120);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  items.forEach(item => observer.observe(item));
})();

/* ── 7b. FAQ accordion + scroll reveal ────────────────────────────── */
(function initFAQ() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => entry.target.classList.add('is-visible'), i * 90);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2 });
  items.forEach(item => observer.observe(item));

  items.forEach(item => {
    const btn = item.querySelector('.faq-item__q');
    btn.addEventListener('click', () => {
      const wasOpen = item.classList.contains('is-open');
      items.forEach(i => {
        i.classList.remove('is-open');
        i.querySelector('.faq-item__q').setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();

/* ── 8. Page transition ──────────────────────────────────────────── */
(function initPageTransition() {
  const curtain = document.getElementById('page-curtain');
  if (!curtain) return;

  gsap.fromTo(curtain,
    { y: '0%' },
    { y: '-100%', duration: 1, ease: 'expo.inOut', delay: 0.05 }
  );

  document.querySelectorAll('.page-link, a[href]').forEach(link => {
    if (link.hostname !== window.location.hostname) return;
    if (link.getAttribute('href')?.startsWith('#')) return;

    link.addEventListener('click', e => {
      e.preventDefault();
      const href = link.getAttribute('href');
      gsap.fromTo(curtain,
        { y: '100%' },
        { y: '0%', duration: 0.65, ease: 'expo.in', onComplete: () => { window.location.href = href; } }
      );
    });
  });

  // Bfcache restore (browser Back/Forward) freezes the DOM mid-transition —
  // without this the curtain can stay stuck covering the screen (black screen on back).
  window.addEventListener('pageshow', event => {
    if (event.persisted) gsap.set(curtain, { y: '-100%' });
  });
})();

/* ── 8b. Smooth-scroll same-page anchor links ─────────────────────
   .page-link click handling above deliberately skips "#..." hrefs
   (no curtain transition for an in-page jump) — handle those here
   instead, animating through Lenis so the scroll eases in/out rather
   than snapping instantly. ─────────────────────────────────────── */
(function initAnchorScroll() {
  const HEADER_OFFSET = 80; // matches --header-h
  const easeOutExpo = t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, {
        offset: -HEADER_OFFSET,
        duration: 1.4,
        easing: easeOutExpo,
      });
    });
  });
})();

/* ── 9. Fleet cards entrance ─────────────────────────────────────── */
(function initFleetEntrance() {
  const cards = document.querySelectorAll('.car-card');
  if (!cards.length) return;

  gsap.set(cards, { opacity: 0, y: 40 });

  ScrollTrigger.create({
    trigger: '.fleet__grid',
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.to(cards, {
        opacity: 1, y: 0,
        stagger: 0.06,
        duration: 0.9,
        ease: 'expo.out',
      });
    },
  });
})();

/* ── 10. Why Us bg-text parallax ─────────────────────────────────── */
(function initParallax() {
  const bgText = document.querySelector('.why-us__bg-text');
  if (!bgText) return;

  // scrub: 1 (smoothed) instead of scrub: true (immediate) — reduces jitter
  gsap.to(bgText, {
    y: '-20%',
    ease: 'none',
    scrollTrigger: {
      trigger: '.why-us',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
    },
  });
})();

/* ── 11. Private Driver quick-request → Web3Forms (auto-email) ──── */
(function initPrivateDriverCta() {
  const buttons = document.querySelectorAll('[data-cta="private-driver"]');
  if (!buttons.length) return;

  const WEB3FORMS_ACCESS_KEY = '8aeb3671-54be-4636-bfac-c7ed5ee15fe0';
  const WEB3FORMS_ENDPOINT   = 'https://api.web3forms.com/submit';

  function showToast(text) {
    const toast = document.createElement('div');
    toast.textContent = text;
    Object.assign(toast.style, {
      position: 'fixed', left: '50%', bottom: '32px', transform: 'translateX(-50%)',
      background: '#212121', color: '#fff', padding: '14px 24px', borderRadius: '100px',
      fontFamily: 'var(--f-body)', fontSize: '13px', fontWeight: '600', zIndex: '9999',
      boxShadow: '0 0 0 2px #FF5500', opacity: '0', transition: 'opacity 0.4s ease',
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = '1'; });
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.disabled = true;

      fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: 'Private Driver Request — AG Motors Miami Website',
          from_name: 'AG Motors Miami Website',
          message: "Hi, I'm interested in adding a private driver to my rental.",
          botcheck: false,
        }),
      })
        .then(res => res.json())
        .then(data => showToast(data.success
          ? "Thanks! We'll be in touch shortly."
          : 'Something went wrong — please call us at +1 (954) 310-8470.'))
        .catch(() => showToast('Something went wrong — please call us at +1 (954) 310-8470.'))
        .finally(() => { btn.disabled = false; });
    });
  });
})();
