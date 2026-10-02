/* ================================================================
   AG MOTORS MIAMI - privacy.js
   ================================================================ */

'use strict';

/* ── Lenis + GSAP - single ticker ──────────────────────────────── */
const lenis = new Lenis({
  duration: 1.8,
  wheelMultiplier: 0.85,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});

gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
lenis.on('scroll', ScrollTrigger.update);

/* ── Header scroll ──────────────────────────────────────────────── */
const header = document.getElementById('header');
if (header) {
  ScrollTrigger.create({
    start: '80px top',
    onEnter:     () => header.classList.add('is-scrolled'),
    onLeaveBack: () => header.classList.remove('is-scrolled'),
  });
}

/* ── Page transition ────────────────────────────────────────────── */
(function() {
  const curtain = document.getElementById('page-curtain');
  if (!curtain) return;
  gsap.fromTo(curtain, { y: '0%' }, { y: '-100%', duration: 1, ease: 'expo.inOut', delay: 0.05 });

  document.querySelectorAll('.page-link, a[href]').forEach(link => {
    if (link.hostname !== window.location.hostname) return;
    if (link.getAttribute('href')?.startsWith('#')) return;
    link.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.target === '_blank') return;
      e.preventDefault();
      const href = link.getAttribute('href');
      gsap.fromTo(curtain, { y: '100%' }, {
        y: '0%', duration: 0.65, ease: 'expo.in',
        onComplete: () => { window.location.href = href; },
      });
    });
  });

  // Bfcache restore (browser Back/Forward) freezes the DOM mid-transition -
  // without this the curtain can stay stuck covering the screen (black screen on back).
  window.addEventListener('pageshow', event => {
    if (event.persisted) gsap.set(curtain, { y: '-100%' });
  });
})();

/* ── Smooth-scroll same-page anchor links (e.g. Request a Chauffeur -> form) ── */
document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, {
      offset: -80,
      duration: 2.0,
      easing: t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    });
  });
});
