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
