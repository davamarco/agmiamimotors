/* ================================================================
   AG MOTORS MIAMI - about.js
   Founder page: photos ease out of a slight zoom with a gentle
   parallax, text rises in line by line. Lenis/curtain come from
   privacy.js. Without GSAP everything simply stays visible.
   ================================================================ */
(function () {
  'use strict';
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const desktop = window.matchMedia('(min-width: 901px)').matches;

  document.querySelectorAll('.about-block').forEach((block, i) => {
    const img = block.querySelector('.about-block__media img');
    const items = block.querySelectorAll('[data-reveal]');

    /* Photo: fade + settle from a slight zoom */
    gsap.fromTo(img, { opacity: 0, scale: 1.12 }, {
      opacity: 1, scale: 1, duration: 1.8, ease: 'expo.out',
      delay: i === 0 ? 0.35 : 0,
      scrollTrigger: i === 0 ? undefined : { trigger: block, start: 'top 75%', once: true },
    });

    /* Parallax on desktop only (keeps phones smooth) */
    if (desktop) {
      gsap.fromTo(img, { yPercent: -4 }, {
        yPercent: 4, ease: 'none',
        scrollTrigger: { trigger: block, start: 'top bottom', end: 'bottom top', scrub: 1 },
      });
    }

    /* Text: line by line */
    gsap.set(items, { opacity: 0, y: 28 });
    gsap.to(items, {
      opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12,
      delay: i === 0 ? 0.6 : 0,
      scrollTrigger: i === 0 ? undefined : { trigger: block.querySelector('.about-block__text'), start: 'top 82%', once: true },
      clearProps: 'transform',
    });
  });
})();
