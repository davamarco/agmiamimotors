/* ================================================================
   AG MOTORS MIAMI — car.js  (performance-optimised)
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

/* ── Hero entrance ──────────────────────────────────────────────── */
gsap.from('.car-hero__eyebrow',   { opacity: 0, y: 20, duration: 1,   ease: 'expo.out', delay: 0.3  });
gsap.from('.car-hero__title',     { opacity: 0, y: 40, duration: 1.2, ease: 'expo.out', delay: 0.45 });
gsap.from('.car-hero__subtitle',  { opacity: 0, y: 16, duration: 1,   ease: 'expo.out', delay: 0.5  });
gsap.from('.car-hero__tagline',   { opacity: 0, y: 20, duration: 1,   ease: 'expo.out', delay: 0.65 });
gsap.from('.car-hero__trustline', { opacity: 0, y: 16, duration: 1,   ease: 'expo.out', delay: 0.8  });
gsap.from('.car-hero__card',      { opacity: 0, x: 30, duration: 1,   ease: 'expo.out', delay: 0.6  });
gsap.from('.car-hero__checklist li', { opacity: 0, x: 12, duration: 0.7, ease: 'expo.out', stagger: 0.08, delay: 1.05 });

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
(function() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  document.querySelectorAll('.magnetic').forEach(el => {
    const STRENGTH = 0.35;
    let bounds = null;

    el.addEventListener('mouseenter', () => { bounds = el.getBoundingClientRect(); }, { passive: true });

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

/* ── Swiper Gallery ─────────────────────────────────────────────── */
(function initSwiper() {
  if (!document.querySelector('.swiper')) return;

  const link = document.createElement('link');
  link.rel  = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css';
  document.head.appendChild(link);

  const script  = document.createElement('script');
  script.src    = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';
  script.onload = () => {
    const swiper = new Swiper('.swiper', {
      slidesPerView: 'auto',
      spaceBetween: 16,
      grabCursor: true,
      touchRatio: 1,
      speed: 900,
      freeMode: { enabled: true, momentum: true, momentumRatio: 0.8 },
      pagination: { el: '.swiper-pagination', clickable: true },
    });

    const fraction = document.querySelector('.swiper-fraction');
    const btnPrev  = document.querySelector('.swiper-btn--prev');
    const btnNext  = document.querySelector('.swiper-btn--next');

    function updateFraction() {
      if (fraction) fraction.textContent =
        `${String(swiper.realIndex + 1).padStart(2,'0')} / ${String(swiper.slides.length).padStart(2,'0')}`;
    }
    updateFraction();
    swiper.on('slideChange', updateFraction);

    btnPrev?.addEventListener('click', () => swiper.slidePrev());
    btnNext?.addEventListener('click', () => swiper.slideNext());
  };
  document.body.appendChild(script);
})();

/* ── Animated counters — rewritten from scratch, no GSAP ─────────────
   Plain requestAnimationFrame, linear interpolation, replays every time
   the row re-enters view. No tweening library involved, so there's
   nothing left to mistrust about how the number gets from 0 to target. */
(function initCounters() {
  const items = document.querySelectorAll('.spec-item__val[data-count]');
  if (!items.length) return;

  const DURATION = 2800; // ms — how long the count-up visibly runs
  const frames = new WeakMap();

  function countUp(el, target, suffix, dec, unitHTML) {
    cancelAnimationFrame(frames.get(el));
    const startTime = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - startTime) / DURATION);
      const v = target * t; // linear: value is exactly proportional to elapsed time
      el.innerHTML = (dec > 0 ? v.toFixed(dec) : Math.round(v)) + suffix + unitHTML;
      if (t < 1) frames.set(el, requestAnimationFrame(tick));
    }
    frames.set(el, requestAnimationFrame(tick));
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const el       = entry.target;
      const target   = parseFloat(el.dataset.count);
      const suffix   = el.dataset.suffix || '';
      const dec      = el.dataset.dec ? parseInt(el.dataset.dec, 10) : 0;
      const unit     = el.querySelector('.spec-item__unit');
      const unitHTML = unit ? unit.outerHTML : '';

      if (!entry.isIntersecting) {
        // Only reset once it has actually counted up before — otherwise the
        // very first (off-screen) callback IntersectionObserver fires on
        // page load would wipe the static number before the user scrolls.
        if (el.dataset.counted === '1') {
          cancelAnimationFrame(frames.get(el));
          el.innerHTML = '0' + suffix + unitHTML;
        }
        return;
      }
      el.dataset.counted = '1';
      countUp(el, target, suffix, dec, unitHTML);
    });
  // Trigger once the row is well inside the viewport (not just peeking at the
  // bottom edge) — with Lenis's inertial scroll, a low threshold fired the
  // count-up while the numbers were still off-screen, so it looked instant
  // by the time the user's eyes actually reached them.
  }, { threshold: 0.4, rootMargin: '0px 0px -15% 0px' });

  items.forEach(item => observer.observe(item));
})();

/* ── Why Book grid reveal ───────────────────────────────────────── */
(function initWhyReveal() {
  const items = document.querySelectorAll('.car-why__item');
  if (!items.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      setTimeout(() => entry.target.classList.add('is-visible'), i * 90);
    });
  }, { threshold: 0.2 });

  items.forEach(item => observer.observe(item));
})();
