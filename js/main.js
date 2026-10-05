/* ================================================================
   AG MOTORS MIAMI - main.js  (performance-optimised)
   ================================================================ */

'use strict';

if (typeof Lenis === 'undefined' || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
  document.documentElement.classList.add('no-anim');   // CDN blocked/offline: show content without animation
  throw new Error('Animation libraries failed to load');
}

/* ── 1. Lenis + GSAP - single ticker, no duplicate RAF loop ─────── */
const lenis = new Lenis({
  duration: 1.8,
  wheelMultiplier: 0.85,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
});

// ONE source of truth: GSAP ticker drives Lenis.
// Do NOT also run a manual requestAnimationFrame(lenisRaf) loop -
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

/* ── 3. Hero entrance: pure CSS now (css/main.css), see 'Hero entrance' ── */

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

/* ── 8b. Smooth-scroll same-page anchor links ─────────────────────
   Same-page "#..." links animate through Lenis so the scroll eases in/out rather
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
        duration: 2.0,
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
        // GSAP leaves inline transform/scale behind, which blocks the CSS hover zoom
        clearProps: 'all',
      });
    },
  });
})();

/* ── 10. Why Us bg-text parallax ─────────────────────────────────── */
(function initParallax() {
  const bgText = document.querySelector('.why-us__bg-text');
  if (!bgText) return;

  // scrub: 1 (smoothed) instead of scrub: true (immediate) - reduces jitter
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
