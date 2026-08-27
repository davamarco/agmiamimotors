/* ================================================================
   AG MOTORS MIAMI — privacy.js
   ================================================================ */

'use strict';

/* ── Lenis + GSAP — single ticker ──────────────────────────────── */
const lenis = new Lenis({
  duration: 1.3,
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
      e.preventDefault();
      const href = link.getAttribute('href');
      gsap.fromTo(curtain, { y: '100%' }, {
        y: '0%', duration: 0.65, ease: 'expo.in',
        onComplete: () => { window.location.href = href; },
      });
    });
  });

  // Bfcache restore (browser Back/Forward) freezes the DOM mid-transition —
  // without this the curtain can stay stuck covering the screen (black screen on back).
  window.addEventListener('pageshow', event => {
    if (event.persisted) gsap.set(curtain, { y: '-100%' });
  });
})();

/* ── Magnetic buttons ───────────────────────────────────────────── */
if (!window.matchMedia('(pointer: coarse)').matches) {
  document.querySelectorAll('.magnetic').forEach(el => {
    let bounds = null;
    el.addEventListener('mouseenter', () => { bounds = el.getBoundingClientRect(); }, { passive: true });
    el.addEventListener('mousemove', e => {
      if (!bounds) return;
      gsap.to(el, { x: (e.clientX - bounds.left - bounds.width/2) * 0.35, y: (e.clientY - bounds.top - bounds.height/2) * 0.35, ease: 'power3.out', duration: 0.4, overwrite: 'auto' });
    }, { passive: true });
    el.addEventListener('mouseleave', () => {
      bounds = null;
      gsap.to(el, { x: 0, y: 0, ease: 'elastic.out(1,0.4)', duration: 0.9, overwrite: 'auto' });
    }, { passive: true });
  });
}
