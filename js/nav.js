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
  if (/\/reviews(\.html)?\/?$/.test(path)) { setActive(byKey('reviews')); return; }
  if (/\/chauffeur(\.html)?\/?$/.test(path)) { setActive(byKey('chauffeur')); return; }
  if (!document.getElementById('fleet')) { return; }   // e.g. privacy policy: nothing highlighted

  /* Home page: scroll-spy */
  const sections = [
    { key: 'home',  el: document.getElementById('hero') },
    { key: 'fleet', el: document.getElementById('fleet') },
    { key: 'faq',   el: document.getElementById('faq') },
    { key: 'about', el: document.getElementById('contact') },
  ].filter(s => s.el && byKey(s.key));

  let lockUntil = 0;
  links.forEach(link => link.addEventListener('click', () => {
    setActive(link);
    lockUntil = performance.now() + 1700;   // let the smooth scroll finish before the spy takes over
  }));

  function spy() {
    if (performance.now() < lockUntil) return;
    const line = window.innerHeight * 0.4;
    let cur = sections[0];
    sections.forEach(s => { if (s.el.getBoundingClientRect().top <= line) cur = s; });
    // footer counts as "About" once it is in view at the bottom
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) cur = sections[sections.length - 1];
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
