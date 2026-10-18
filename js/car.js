/* ================================================================
   AG MOTORS MIAMI - car.js  (performance-optimised)
   ================================================================ */

'use strict';

/* ── Hero entrance: pure CSS (css/car.css), so it starts on first paint
   and never waits for the animation libraries to download. ───────── */

/* ── Photo gallery: big main photo + thumbnails ──────────────────────
   Thumbnails (data-base = photo path without the size suffix) swap the
   main photo with a short fade. Arrows, swipe on touch screens and the
   keyboard's left/right keys step through the photos. ───────────────── */
(function initGallery() {
  const root = document.querySelector('[data-gallery]');
  if (!root) return;
  const img    = root.querySelector('.car-media__img');
  const frame  = root.querySelector('.car-hero__frame');
  const count  = root.querySelector('.car-media__count');
  const thumbs = [...root.querySelectorAll('.car-thumb')];
  if (!img || thumbs.length < 2) return;

  const SIZES = '(max-width: 900px) 100vw, 860px';
  const srcset = b => `${b}-640.webp 640w, ${b}-800.webp 800w, ${b}-1100.webp 1100w, ${b}-1600.webp 1600w`;
  let current = 0, token = 0;

  function preload(i) {
    const t = thumbs[(i + thumbs.length) % thumbs.length];
    const pre = new Image();
    pre.sizes = SIZES; pre.srcset = srcset(t.dataset.base); pre.src = t.dataset.base + '-1100.webp';
  }

  function show(i) {
    i = (i + thumbs.length) % thumbs.length;
    if (i === current) return;
    current = i;
    const t = thumbs[i];
    thumbs.forEach((el, k) => {
      el.classList.toggle('is-active', k === i);
      if (k === i) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current');
    });
    // keep the active thumbnail visible in a scrolling strip
    const strip = t.parentElement;
    const l = t.offsetLeft - strip.offsetLeft, r = l + t.offsetWidth;
    if (l < strip.scrollLeft || r > strip.scrollLeft + strip.clientWidth) strip.scrollTo({ left: l - 8 });
    if (count) count.textContent = `${i + 1} / ${thumbs.length}`;

    const my = ++token;
    img.classList.add('is-fading');
    const next = new Image();
    next.sizes = SIZES; next.srcset = srcset(t.dataset.base); next.src = t.dataset.base + '-1100.webp';
    const swap = () => {
      if (my !== token) return;                 // a newer click won
      img.removeAttribute('fetchpriority');
      img.sizes = SIZES; img.srcset = next.srcset; img.src = next.src;
      img.alt = t.dataset.alt || img.alt;
      requestAnimationFrame(() => img.classList.remove('is-fading'));
      preload(i + 1);
    };
    (next.decode ? next.decode() : Promise.resolve()).then(swap, swap);
  }

  thumbs.forEach((t, k) => t.addEventListener('click', () => show(k)));
  root.querySelector('.car-media__arrow--prev')?.addEventListener('click', () => show(current - 1));
  root.querySelector('.car-media__arrow--next')?.addEventListener('click', () => show(current + 1));

  // keyboard: left/right, unless the visitor is typing or a dialog is open
  document.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (document.documentElement.classList.contains('is-booking-open') || document.querySelector('.car-cal__pop')) return;
    show(current + (e.key === 'ArrowRight' ? 1 : -1));
  });

  // swipe on touch screens (vertical scrolling stays native)
  let x0 = null, y0 = 0;
  frame.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  frame.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) show(current + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // warm the cache for the next photo once the page has loaded
  if (document.readyState === 'complete') preload(1);
  else window.addEventListener('load', () => preload(1));
})();

/* ── Animated counters - rewritten from scratch, no GSAP ─────────────
   Plain requestAnimationFrame, linear interpolation, replays every time
   the row re-enters view. No tweening library involved, so there's
   nothing left to mistrust about how the number gets from 0 to target. */
(function initCounters() {
  const items = document.querySelectorAll('.spec-item__val[data-count]');
  if (!items.length) return;

  const DURATION = 2800; // ms - how long the count-up visibly runs
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
        // Only reset once it has actually counted up before - otherwise the
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
  // bottom edge) - a low threshold fired the
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
