/* ================================================================
   AG MOTORS MIAMI — car-booking.js
   Hero date-range calendar + multi-day discount calculator,
   plus the shared reservation modal (Web3Forms + WhatsApp).
   Depends on Lenis/GSAP already initialised by car.js.
   ================================================================ */

'use strict';

(function () {
  const heroSection = document.querySelector('.car-hero[data-car-rate]');
  if (!heroSection) return;

  const CAR_NAME    = heroSection.dataset.carName;
  const DAILY_RATE  = parseFloat(heroSection.dataset.carRate);

  const monthEl      = heroSection.querySelector('[data-cal-month]');
  const daysEl        = heroSection.querySelector('[data-cal-days]');
  const prevBtn       = heroSection.querySelector('[data-cal-prev]');
  const nextBtn       = heroSection.querySelector('[data-cal-next]');
  const discountEls   = heroSection.querySelectorAll('[data-discount-days]');
  const summaryEl     = heroSection.querySelector('[data-cal-summary]');
  const rangeEl       = heroSection.querySelector('[data-cal-range]');
  const originalEl    = heroSection.querySelector('[data-cal-original]');
  const totalEl       = heroSection.querySelector('[data-cal-total]');
  const savingsEl     = heroSection.querySelector('[data-cal-savings]');
  const bookBtn       = heroSection.querySelector('[data-cal-book]');
  const clearBtn      = heroSection.querySelector('[data-cal-clear]');

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let viewYear   = today.getFullYear();
  let viewMonth  = today.getMonth();
  let rangeStart = null;
  let rangeEnd   = null;

  function fmtMoney(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function fmtShort(d) { return MONTH_NAMES[d.getMonth()].slice(0, 3) + ' ' + d.getDate(); }
  function sameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

  function tierFor(days) {
    if (days >= 7) return { pct: 0.20, threshold: 7 };
    if (days >= 5) return { pct: 0.15, threshold: 5 };
    if (days >= 3) return { pct: 0.10, threshold: 3 };
    return { pct: 0, threshold: 0 };
  }

  function renderCalendar() {
    monthEl.textContent = MONTH_NAMES[viewMonth] + ' ' + viewYear;
    daysEl.innerHTML = '';

    const firstDay     = new Date(viewYear, viewMonth, 1);
    const startOffset  = firstDay.getDay();
    const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();

    for (let i = 0; i < startOffset; i++) {
      const filler = document.createElement('span');
      filler.className = 'car-cal__day car-cal__day--empty';
      daysEl.appendChild(filler);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const btn  = document.createElement('button');
      btn.type = 'button';
      btn.className = 'car-cal__day';
      btn.textContent = String(d);

      if (date < today) {
        btn.disabled = true;
        btn.classList.add('car-cal__day--past');
      } else {
        btn.addEventListener('click', () => onDayClick(date));
      }

      if (rangeStart && sameDay(date, rangeStart)) btn.classList.add('is-edge');
      if (rangeEnd && sameDay(date, rangeEnd)) btn.classList.add('is-edge');
      if (rangeStart && rangeEnd && date > rangeStart && date < rangeEnd) btn.classList.add('is-in-range');

      daysEl.appendChild(btn);
    }
  }

  function onDayClick(date) {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      rangeStart = date; rangeEnd = null;
    } else if (sameDay(date, rangeStart)) {
      rangeStart = null; rangeEnd = null;
    } else if (date < rangeStart) {
      rangeStart = date; rangeEnd = null;
    } else {
      rangeEnd = date;
    }
    renderCalendar();
    updateSummary();
  }

  function updateSummary() {
    discountEls.forEach(el => el.classList.remove('is-active'));

    if (!rangeStart || !rangeEnd) {
      summaryEl.hidden = true;
      bookBtn.disabled = true;
      clearBtn.hidden = !rangeStart;
      heroSection._bookingState = null;
      return;
    }

    const days     = Math.max(1, daysBetween(rangeStart, rangeEnd));
    const tier     = tierFor(days);
    const original = DAILY_RATE * days;
    const total    = original * (1 - tier.pct);
    const savings  = original - total;

    rangeEl.textContent = `${fmtShort(rangeStart)} → ${fmtShort(rangeEnd)} · ${days} day${days === 1 ? '' : 's'}`;

    if (tier.pct > 0) {
      originalEl.hidden = false;
      originalEl.textContent = fmtMoney(original);
      savingsEl.hidden = false;
      savingsEl.textContent = `You save ${fmtMoney(savings)} with the ${Math.round(tier.pct * 100)}% ${tier.threshold}-day rate.`;
      const activeCard = heroSection.querySelector(`[data-discount-days="${tier.threshold}"]`);
      if (activeCard) activeCard.classList.add('is-active');
    } else {
      originalEl.hidden = true;
      savingsEl.hidden = true;
    }

    totalEl.textContent = fmtMoney(total);

    summaryEl.hidden = false;
    bookBtn.disabled = false;
    clearBtn.hidden = false;

    heroSection._bookingState = { carName: CAR_NAME, rangeStart, rangeEnd, days, total: Math.round(total) };
  }

  prevBtn.addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
  });
  nextBtn.addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
  });
  clearBtn.addEventListener('click', () => {
    rangeStart = null; rangeEnd = null;
    renderCalendar();
    updateSummary();
  });

  renderCalendar();
  updateSummary();

  /* ── Book Now (hero) opens the modal ────────────────────────────── */
  bookBtn.addEventListener('click', () => {
    if (bookBtn.disabled) return;
    openBookingModal(heroSection._bookingState);
  });

  /* ── Other CTAs on the page (Reserve Now / Book This Car) ───────── */
  document.querySelectorAll('.js-book-cta').forEach(btn => {
    btn.addEventListener('click', () => {
      if (heroSection._bookingState) {
        openBookingModal(heroSection._bookingState);
      } else if (typeof lenis !== 'undefined' && lenis.scrollTo) {
        lenis.scrollTo(heroSection, { duration: 1.2 });
      } else {
        heroSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  /* ================== Booking Modal ================== */
  const modal       = document.getElementById('booking-modal');
  if (!modal) return;

  const modalCar      = modal.querySelector('[data-modal-car]');
  const modalSummary  = modal.querySelector('[data-modal-summary]');
  const formScreen    = modal.querySelector('[data-screen="form"]');
  const thanksScreen  = modal.querySelector('[data-screen="thanks"]');
  const form          = document.getElementById('booking-modal-form');
  const dobInput      = document.getElementById('bm-dob');
  const whatsappBtn   = modal.querySelector('[data-modal-whatsapp]');

  let currentBooking = null;

  function openBookingModal(state) {
    if (!state) return;
    currentBooking = state;
    modalCar.textContent = state.carName;
    modalSummary.textContent = `${fmtShort(state.rangeStart)} → ${fmtShort(state.rangeEnd)} · ${state.days} day${state.days === 1 ? '' : 's'} · ${fmtMoney(state.total)} est.`;

    if (dobInput && !dobInput.value) {
      dobInput.value = new Date().toISOString().split('T')[0];
    }

    formScreen.hidden = false;
    thanksScreen.hidden = true;
    modal.classList.add('is-visible');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeBookingModal() {
    modal.classList.remove('is-visible');
    modal.setAttribute('aria-hidden', 'true');
  }

  modal.addEventListener('click', e => {
    if (e.target.closest('[data-modal-close]')) closeBookingModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-visible')) closeBookingModal();
  });

  function val(id) { return (document.getElementById(id)?.value || '').trim(); }

  const REQUIRED_IDS = ['bm-first-name', 'bm-last-name', 'bm-phone', 'bm-email', 'bm-license'];
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function clearFieldError(input) { input.closest('.bm-field')?.classList.remove('bm-field--invalid'); }

  function validateModalForm() {
    let firstInvalid = null;
    REQUIRED_IDS.forEach(id => {
      const input = document.getElementById(id);
      if (!input) return;
      const invalid = id === 'bm-email' ? !EMAIL_RE.test(input.value.trim()) : !input.value.trim();
      const wrap = input.closest('.bm-field');
      wrap?.classList.toggle('bm-field--invalid', invalid);
      if (invalid && !firstInvalid) firstInvalid = input;
    });
    return firstInvalid;
  }

  REQUIRED_IDS.forEach(id => {
    const input = document.getElementById(id);
    input?.addEventListener('input', () => clearFieldError(input));
  });

  function buildMessageLines() {
    const privateDriver = document.getElementById('bm-private-driver')?.checked;
    return [
      `NEW BOOKING REQUEST`,
      `Car: ${currentBooking.carName}`,
      `Dates: ${fmtShort(currentBooking.rangeStart)} → ${fmtShort(currentBooking.rangeEnd)} (${currentBooking.days} days)`,
      `Estimated Total: ${fmtMoney(currentBooking.total)}`,
      privateDriver ? `Private Driver: Yes ★` : null,
      `Name: ${val('bm-first-name')} ${val('bm-last-name')}`,
      `Phone: ${val('bm-phone')}`,
      `Email: ${val('bm-email')}`,
      `Driver's License: ${val('bm-license')}`,
      `Date of Birth: ${val('bm-dob')}`,
      `From: AGMotorsMiami Website`,
    ].filter(Boolean).join('\n');
  }

  const WEB3FORMS_ACCESS_KEY = '8aeb3671-54be-4636-bfac-c7ed5ee15fe0';
  const WEB3FORMS_ENDPOINT   = 'https://api.web3forms.com/submit';

  function showThanks() {
    formScreen.hidden = true;
    thanksScreen.hidden = false;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!currentBooking) return;

    const firstInvalid = validateModalForm();
    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: true });
      return;
    }

    const lines   = buildMessageLines();
    const subject = `Booking Request — ${currentBooking.carName}`;

    const formData = new FormData();
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', subject);
    formData.append('from_name', 'AG Motors Miami Website');
    formData.append('name', `${val('bm-first-name')} ${val('bm-last-name')}`.trim());
    formData.append('email', val('bm-email'));
    formData.append('message', lines);
    formData.append('botcheck', '');

    const submitBtn = form.querySelector('.bm-book-btn');
    if (submitBtn) submitBtn.disabled = true;

    fetch(WEB3FORMS_ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' }, body: formData })
      .catch(() => {})
      .finally(() => { if (submitBtn) submitBtn.disabled = false; });

    window.dataLayer = window.dataLayer || [];
    dataLayer.push({ event: 'manual_event_SUBMIT_LEAD_FORM' });

    showThanks();
  });

  whatsappBtn.addEventListener('click', () => {
    if (!currentBooking) return;

    const firstInvalid = validateModalForm();
    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: true });
      return;
    }

    const privateDriver = document.getElementById('bm-private-driver')?.checked;
    const text = [
      `Hi! I'd like to reserve the ${currentBooking.carName}.`,
      `Dates: ${fmtShort(currentBooking.rangeStart)} → ${fmtShort(currentBooking.rangeEnd)} (${currentBooking.days} days)`,
      `Estimated Total: ${fmtMoney(currentBooking.total)}`,
      privateDriver ? `★ Private Driver requested` : null,
      `Name: ${val('bm-first-name')} ${val('bm-last-name')}`,
      `Phone: ${val('bm-phone')}`,
      `Email: ${val('bm-email')}`,
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/19543108470?text=${encodeURIComponent(text)}`, '_blank', 'noopener');

    window.dataLayer = window.dataLayer || [];
    dataLayer.push({ event: 'manual_event_SUBMIT_LEAD_FORM' });

    showThanks();
  });
})();
