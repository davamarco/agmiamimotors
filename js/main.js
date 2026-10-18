/* ================================================================
   AG MOTORS MIAMI - main.js  (performance-optimised)
   ================================================================ */

'use strict';

if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
  document.documentElement.classList.add('no-anim');   // CDN blocked/offline: show content without animation
  throw new Error('Animation libraries failed to load');
}

/* ── 1-2. Native scrolling (no smooth-scroll library). ScrollTrigger
   listens to the browser's own scroll; the header state lives in nav.js. ── */

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

/* ── 8b. Same-page "#..." links: plain browser jumps; sections carry
   scroll-margin-top (css/main.css) so the fixed header never covers them. ── */

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
