/* ================================================================
   AG MOTORS MIAMI - nav.js
   Glass pill navigation: a soft highlight glides between links on
   hover, and rests on the current page / section.
   ================================================================ */
(function () {
  'use strict';

  const nav = document.querySelector('.header__nav');
  if (!nav) return;
  const links = [...nav.querySelectorAll('.nav-link')];
  if (!links.length) return;

  const indicator = document.createElement('span');
  indicator.className = 'nav-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  nav.prepend(indicator);

  let active = null;    // link the highlight rests on
  let hovered = null;
  let placed = false;   // first placement shouldn't animate

  function move(link) {
    if (!link) { indicator.classList.remove('is-visible'); return; }
    indicator.style.width = link.offsetWidth + 'px';
    indicator.style.transform = 'translate3d(' + link.offsetLeft + 'px,0,0)';
    if (!placed) {
      indicator.style.transition = 'none';
      indicator.getBoundingClientRect();
      indicator.style.transition = '';
      placed = true;
    }
    indicator.classList.add('is-visible');
  }

  function rest() { move(hovered || active); }

  function setActive(link) {
    if (active === link) return;
    active = link;
    links.forEach(l => {
      l.classList.toggle('is-active', l === link);
      if (l === link) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
    });
    rest();
  }

  links.forEach(link => {
    link.addEventListener('mouseenter', () => { hovered = link; rest(); });
    link.addEventListener('focus', () => { hovered = link; rest(); });
    link.addEventListener('blur', () => { hovered = null; rest(); });
  });
  nav.addEventListener('mouseleave', () => { hovered = null; rest(); });
  window.addEventListener('resize', rest);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { placed = false; rest(); });

  /* Mobile burger menu */
  const header = document.getElementById('header');
  const toggle = document.querySelector('.nav-toggle');
  if (header && toggle) {
    const setOpen = open => {
      header.classList.toggle('is-menu-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    };
    toggle.addEventListener('click', e => { e.stopPropagation(); setOpen(!header.classList.contains('is-menu-open')); });
    nav.addEventListener('click', e => { if (e.target.closest('.nav-link')) setOpen(false); });
    document.addEventListener('click', e => { if (!header.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 768) setOpen(false); });
  }

  const byKey = key => links.find(l => l.dataset.nav === key) || null;
  const path = location.pathname;

  /* Sub-pages: fixed active link */
  if (/\/cars\//.test(path)) { setActive(byKey('fleet')); return; }
  if (/\/chauffeur(\.html)?\/?$/.test(path)) { setActive(byKey('chauffeur')); return; }
  if (/\/about\/?$/.test(path)) { setActive(byKey('about')); return; }
  if (!document.getElementById('fleet')) { return; }   // e.g. privacy policy: nothing highlighted

  /* Home page: scroll-spy */
  const sections = [
    { key: 'home',  el: document.getElementById('hero') },
    { key: 'fleet', el: document.getElementById('fleet') },
    { key: 'reviews', el: document.getElementById('reviews') },
    { key: 'faq',   el: document.getElementById('faq') },
  ].filter(s => s.el && byKey(s.key));

  let lockUntil = 0;
  links.forEach(link => link.addEventListener('click', () => {
    setActive(link);
    lockUntil = performance.now() + 400;    // let the jump settle before the spy takes over
  }));

  function spy() {
    if (performance.now() < lockUntil) return;
    const line = window.innerHeight * 0.4;
    let cur = sections[0];
    sections.forEach(s => { if (s.el.getBoundingClientRect().top <= line) cur = s; });
    setActive(byKey(cur.key));
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; spy(); });
  }, { passive: true });
  spy();
})();

/* ================================================================
   Shared on every page: header scroll state, mobile action bar and
   click tracking for the phone / Book Now buttons.
   ================================================================ */
(function () {
  'use strict';

  /* Analytics: names start with booking_ so the site's GTM tag (rental_*,
     booking_*, chauffeur_*) forwards them to GA4. Keys are reset on every
     push so values from an earlier event never leak into this one. */
  const KEYS = ['form_type', 'car_name', 'daily_rate', 'rental_days', 'rental_start', 'rental_end',
    'discount_pct', 'value', 'currency', 'form_location', 'form_action', 'error_type', 'error_fields', 'reason', 'lead_source'];
  function track(event, params) {
    try {
      const payload = { event };
      KEYS.forEach(k => { payload[k] = undefined; });
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign(payload, params));
    } catch (err) { /* analytics must never break the page */ }
  }
  const hero = document.querySelector('.car-hero[data-car-name]');
  const pageCar = hero ? hero.dataset.carName : undefined;

  /* Header: dark translucent bar with blur once the page is scrolled */
  const header = document.getElementById('header');
  if (header) {
    let ticking = false;
    const update = () => { ticking = false; header.classList.toggle('is-scrolled', window.scrollY > 40); };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* Mobile action bar (CSS shows it below 769px only) */
  const onHome = !!document.getElementById('fleet');
  const bar = document.createElement('div');
  bar.className = 'mbar';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Quick actions');
  bar.innerHTML =
    '<a class="mbar__btn mbar__btn--book" data-cta-location="sticky_bar"></a>' +
    '<a class="mbar__btn mbar__btn--call" href="tel:+19543108470" data-phone-location="sticky_bar" aria-label="Call AG Motors Miami">' +
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.25c1.1.37 2.3.57 3.6.57a1 1 0 011 1V20a1 1 0 01-1 1C10.6 21 3 13.4 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.5.57 3.6a1 1 0 01-.25 1z"/></svg><span>Call</span></a>';
  const book = bar.querySelector('.mbar__btn--book');
  book.textContent = 'Book Now';
  book.href = hero ? '#car-hero' : onHome ? '#fleet' : 'https://agmotorsmiami.com/#fleet';
  if (pageCar) book.dataset.carName = pageCar;
  book.addEventListener('click', e => {
    // On a car page: open this car's booking (or bring its calendar up)
    if (hero && typeof window.AGOpenBooking === 'function') { e.preventDefault(); window.AGOpenBooking('sticky_bar'); }
  });
  document.body.appendChild(bar);
  document.body.classList.add('has-mbar');

  /* Click tracking (capture phase: runs even if the link navigates away) */
  document.addEventListener('click', e => {
    const tel = e.target.closest('a[href^="tel:"]');
    if (tel) {
      const sec = tel.closest('section, header, footer');
      track('booking_phone_click', {
        car_name: pageCar,
        form_location: tel.dataset.phoneLocation || (sec ? (sec.id || sec.className.split(' ')[0]) : 'page'),
      });
      return;
    }
    const cta = e.target.closest('[data-cta-location]');
    if (cta) track('booking_cta_click', { car_name: cta.dataset.carName || pageCar, form_location: cta.dataset.ctaLocation });
  }, true);
})();
