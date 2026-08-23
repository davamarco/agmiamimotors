/* ================================================================
   AG MIAMI MOTORS — booking.js
   Form handling · WhatsApp submit · URL param pre-fill
   ================================================================ */

'use strict';

/* ── Lenis ──────────────────────────────────────────────────────── */
const lenis = new Lenis({ duration: 1.3, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
lenis.on('scroll', ScrollTrigger.update);

/* ── Header scroll ──────────────────────────────────────────────── */
const header = document.getElementById('header');
if (header) {
  const ST = typeof ScrollTrigger !== 'undefined' ? ScrollTrigger : null;
  if (ST) {
    ST.create({ start: '80px top', onEnter: () => header.classList.add('is-scrolled'), onLeaveBack: () => header.classList.remove('is-scrolled') });
  } else {
    window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 60));
  }
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
      gsap.fromTo(curtain, { y: '100%' }, { y: '0%', duration: 0.65, ease: 'expo.in', onComplete: () => window.location.href = href });
    });
  });
})();

/* ── Magnetic ───────────────────────────────────────────────────── */
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

/* ── Pre-fill car from URL param ────────────────────────────────── */
(function() {
  const params   = new URLSearchParams(window.location.search);
  const carParam = params.get('car');
  if (!carParam) return;

  const fieldCar    = document.getElementById('field-car');
  const carNameInput= document.getElementById('car-name');
  const carSelect   = document.getElementById('car-select');
  const fieldSelect = document.getElementById('field-car-select');

  if (fieldCar && carNameInput) {
    fieldCar.style.display = 'block';
    carNameInput.value = decodeURIComponent(carParam);
  }
  if (carSelect && fieldSelect) {
    // Try to match the car name in the select
    const decoded = decodeURIComponent(carParam);
    for (let opt of carSelect.options) {
      if (opt.value.toLowerCase().includes(decoded.toLowerCase().split(' ')[0])) {
        carSelect.value = opt.value;
        break;
      }
    }
    fieldSelect.style.display = 'none';
  }
})();

/* ── Set min dates ──────────────────────────────────────────────── */
(function() {
  const today  = new Date().toISOString().split('T')[0];
  const from   = document.getElementById('date-from');
  const to     = document.getElementById('date-to');
  if (!from || !to) return;
  from.min = today;
  to.min   = today;
  from.addEventListener('change', () => { if (to.value < from.value) to.value = from.value; to.min = from.value; });
})();

/* ── Live price calculator ──────────────────────────────────────── */
const CAR_PRICES = {
  'Chevrolet Corvette':             359,
  'Cadillac Escalade':              349,
  'Mercedes-Benz S580 Maybach':     699,
  'Mercedes-Benz GLS600 Maybach':   759,
  'Mercedes-Benz G63 AMG':          649,
  'Lamborghini Urus S':             999,
  'Lamborghini Urus Performante':   999,
  'Lamborghini Huracán':            1099,
  'Rolls-Royce Cullinan':           1099,
  'Porsche 911 Turbo S':            999,
  'Porsche Cayenne':                299,
  'Ferrari F8 Tributo Spider':      1299,
};

(function() {
  const box      = document.getElementById('booking-price');
  const carInput = document.getElementById('car-name');
  const carSelect= document.getElementById('car-select');
  const dateFrom = document.getElementById('date-from');
  const dateTo   = document.getElementById('date-to');
  if (!box || !dateFrom || !dateTo) return;

  const elCarName = document.getElementById('price-car-name');
  const elRate    = document.getElementById('price-rate');
  const elDays    = document.getElementById('price-days');
  const elTotal   = document.getElementById('price-total');

  const fmt = n => '$' + n.toLocaleString('en-US');

  function currentCar() {
    return (carInput && carInput.value) || (carSelect && carSelect.value) || '';
  }

  function update() {
    const car  = currentCar();
    const rate = CAR_PRICES[car];
    const from = dateFrom.value ? new Date(dateFrom.value) : null;
    const to   = dateTo.value   ? new Date(dateTo.value)   : null;

    if (!rate || !from || !to || to < from) {
      box.hidden = true;
      return;
    }

    const nights = Math.max(1, Math.round((to - from) / 86400000));

    elCarName.textContent = car;
    elRate.textContent    = fmt(rate) + ' / day';
    elDays.textContent    = nights + (nights === 1 ? ' Night' : ' Nights');
    elTotal.textContent   = fmt(rate * nights);
    box.hidden = false;
  }

  dateFrom.addEventListener('change', update);
  dateTo.addEventListener('change', update);
  carSelect?.addEventListener('change', update);

  update();
})();

/* ── Form submit → WhatsApp ─────────────────────────────────────── */
const WA_NUMBER = '19543108470';

const REQUIRED_FIELD_IDS = ['date-from', 'date-to', 'name', 'whatsapp'];

function clearFieldError(input) {
  input.closest('.field')?.classList.remove('field--invalid');
}

function validateBookingForm(f) {
  let firstInvalid = null;

  REQUIRED_FIELD_IDS.forEach(id => {
    const input = f.querySelector(`#${id}`);
    if (!input) return;
    const fieldEl = input.closest('.field');
    if (!input.value.trim()) {
      fieldEl?.classList.add('field--invalid');
      if (!firstInvalid) firstInvalid = input;
    } else {
      fieldEl?.classList.remove('field--invalid');
    }
  });

  return firstInvalid;
}

(function() {
  const form = document.getElementById('booking-form');
  if (!form) return;

  // Clear the red error state as soon as the visitor fixes a field
  REQUIRED_FIELD_IDS.forEach(id => {
    const input = form.querySelector(`#${id}`);
    input?.addEventListener('input', () => clearFieldError(input));
    input?.addEventListener('change', () => clearFieldError(input));
  });

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    const f = this;
    function val(id) { return (f.querySelector(`#${id}`)?.value || '').trim(); }

    const firstInvalid = validateBookingForm(f);
    if (firstInvalid) {
      firstInvalid.closest('.field')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid.focus({ preventScroll: true });
      return;
    }

    const car      = val('car-name') || val('car-select') || 'Not specified';
    const dateFrom = val('date-from');
    const dateTo   = val('date-to');
    const time     = val('time');
    const location = val('location');
    const name     = val('name');
    const email    = val('email');
    const whatsapp = val('whatsapp');
    const comment  = val('comment');

    const lines = [
      `🚗 NEW BOOKING REQUEST`,
      `Car: ${car}`,
      `📅 Pick-up: ${dateFrom}`,
      `📅 Return: ${dateTo}`,
      time     ? `⏰ Time: ${time}` : null,
      location ? `📍 Location: ${location}` : null,
      `👤 Name: ${name}`,
      `📞 Phone/WhatsApp: ${whatsapp}`,
      email    ? `📧 Email: ${email}` : null,
      comment  ? `💬 Notes: ${comment}` : null,
      `From: AGMiamiMotors Website`,
    ].filter(Boolean).join('\n');

    const encoded = encodeURIComponent(lines);
    const url     = `https://wa.me/${WA_NUMBER}?text=${encoded}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  });
})();

/* ── Hero entrance ──────────────────────────────────────────────── */
gsap.from('.booking-hero__title', { opacity: 0, y: 40, duration: 1.2, ease: 'expo.out', delay: 0.3 });
gsap.from('.booking-hero__sub',   { opacity: 0, y: 20, duration: 1,   ease: 'expo.out', delay: 0.55 });
gsap.from('.booking-form__info',  { opacity: 0, x:-30, duration: 1.2, ease: 'expo.out', delay: 0.4, scrollTrigger: { trigger: '.booking-section', start: 'top 80%' } });
gsap.from('.booking-form',        { opacity: 0, y: 30, duration: 1.2, ease: 'expo.out', delay: 0.2, scrollTrigger: { trigger: '.booking-section', start: 'top 80%' } });
