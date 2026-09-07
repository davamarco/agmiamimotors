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

  // Every time the selected rental period changes (any calendar day click that
  // completes/replaces a date range) this increments, so the resulting booking
  // state gets a fresh id. That id — not "the form" — is what submit-state
  // tracking below keys off, so a new date range is always a genuinely new
  // request even if the visitor picks the exact same dates again later.
  let bookingCounter = 0;

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

    heroSection._bookingState = { id: ++bookingCounter, carName: CAR_NAME, rangeStart, rangeEnd, days, total: Math.round(total) };
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

  // Per-booking-id submission state: 'submitting' | 'succeeded'. No entry = idle.
  // Keyed by the booking id (see bookingCounter above), never by anything
  // persisted to storage — this is purely an in-memory guard against duplicate
  // submits/events for one specific date-range selection, not a site-wide lock.
  const bookingStatus = new Map();

  function openBookingModal(state) {
    if (!state) return;
    currentBooking = state;
    modalCar.textContent = state.carName;
    modalSummary.textContent = `${fmtShort(state.rangeStart)} → ${fmtShort(state.rangeEnd)} · ${state.days} day${state.days === 1 ? '' : 's'} · ${fmtMoney(state.total)} est.`;

    if (dobInput && !dobInput.value) {
      dobInput.value = new Date().toISOString().split('T')[0];
    }

    hideFormError();

    // Re-opening a booking that already succeeded (or is mid-flight) must not
    // hand the visitor a fresh, resubmittable form — reflect its real status.
    const status = bookingStatus.get(state.id);
    if (status === 'succeeded') {
      formScreen.hidden = true;
      thanksScreen.hidden = false;
    } else {
      formScreen.hidden = false;
      thanksScreen.hidden = true;
      setSubmitBusy(status === 'submitting');
    }

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

  const REQUIRED_IDS = ['bm-first-name', 'bm-last-name', 'bm-phone', 'bm-email'];
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

  function buildMessageLines(booking, contact) {
    return [
      `NEW BOOKING REQUEST`,
      `Car: ${booking.carName}`,
      `Dates: ${fmtShort(booking.rangeStart)} → ${fmtShort(booking.rangeEnd)} (${booking.days} days)`,
      `Estimated Total: ${fmtMoney(booking.total)}`,
      contact.privateDriver ? `Private Driver: Yes ★` : null,
      `Name: ${contact.firstName} ${contact.lastName}`,
      `Phone: ${contact.phone}`,
      `Email: ${contact.email}`,
      `Date of Birth: ${contact.dob}`,
      `From: AGMotorsMiami Website`,
    ].filter(Boolean).join('\n');
  }

  const WEB3FORMS_ACCESS_KEY = '8aeb3671-54be-4636-bfac-c7ed5ee15fe0';
  const WEB3FORMS_ENDPOINT   = 'https://api.web3forms.com/submit';

  function showThanks() {
    formScreen.hidden = true;
    thanksScreen.hidden = false;
  }

  /* ── Submit-in-progress UI (button state) ───────────────────────── */
  const submitBtn = form.querySelector('.bm-book-btn');
  const submitBtnDefaultText = submitBtn ? submitBtn.textContent : 'Book Now';

  function setSubmitBusy(isBusy) {
    if (!submitBtn) return;
    submitBtn.disabled = isBusy;
    submitBtn.textContent = isBusy ? 'Sending…' : submitBtnDefaultText;
  }

  /* ── Inline error banner (created once, no HTML edits needed across
     the 12 car pages) ─────────────────────────────────────────────── */
  const formError = document.createElement('p');
  formError.className = 'bm-form-error';
  formError.setAttribute('role', 'alert');
  formError.setAttribute('aria-live', 'assertive');
  formError.hidden = true;
  if (submitBtn) submitBtn.insertAdjacentElement('beforebegin', formError);

  function showFormError(message) {
    formError.textContent = message;
    formError.hidden = false;
  }
  function hideFormError() {
    formError.hidden = true;
    formError.textContent = '';
  }

  /* ── Web3Forms call → strict success check ───────────────────────
     Success requires response.ok === true AND a parsed JSON body with
     success === true. Any HTTP error, network failure, non-JSON body,
     null body, or {success:false} is treated as a failure — never
     assumed to have gone through. ─────────────────────────────────── */
  async function submitBookingEmail(formData) {
    let response;
    try {
      response = await fetch(WEB3FORMS_ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' }, body: formData });
    } catch (networkErr) {
      return false;
    }
    if (!response || response.ok !== true) return false;

    let result;
    try {
      result = await response.json();
    } catch (parseErr) {
      return false;
    }
    return !!(result && result.success === true);
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!currentBooking) return;

    // Snapshot which booking this specific submit belongs to. Everything after
    // this point uses `bookingId` (not `currentBooking`, which can be reassigned
    // by a later openBookingModal() call while this request is still in flight)
    // to decide whether it's still safe to touch the visible UI.
    const bookingId = currentBooking.id;
    const status = bookingStatus.get(bookingId);
    if (status === 'submitting' || status === 'succeeded') return; // duplicate submit / resubmit-after-success

    const firstInvalid = validateModalForm();
    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: true });
      return;
    }

    // Capture the exact data this request represents *before* the await —
    // later interface changes (closing the modal, picking new dates, editing
    // fields for a different attempt) must not alter what was already sent.
    const bookingSnapshot = { ...currentBooking };
    const contactSnapshot = {
      firstName: val('bm-first-name'),
      lastName: val('bm-last-name'),
      phone: val('bm-phone'),
      email: val('bm-email'),
      dob: val('bm-dob'),
      privateDriver: !!document.getElementById('bm-private-driver')?.checked,
    };

    const lines   = buildMessageLines(bookingSnapshot, contactSnapshot);
    const subject = `Booking Request — ${bookingSnapshot.carName}`;

    const formData = new FormData();
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', subject);
    formData.append('from_name', 'AG Motors Miami Website');
    formData.append('name', `${contactSnapshot.firstName} ${contactSnapshot.lastName}`.trim());
    formData.append('email', contactSnapshot.email);
    formData.append('message', lines);
    formData.append('botcheck', '');

    bookingStatus.set(bookingId, 'submitting');
    hideFormError();
    setSubmitBusy(true);

    const succeeded = await submitBookingEmail(formData);
    const isStillCurrent = currentBooking && currentBooking.id === bookingId;

    if (succeeded) {
      // The lead really was captured server-side — record that and fire the
      // conversion event once, regardless of what's on screen right now.
      if (bookingStatus.get(bookingId) !== 'succeeded') {
        bookingStatus.set(bookingId, 'succeeded');
        window.dataLayer = window.dataLayer || [];
        dataLayer.push({ event: 'ag_booking_success' });
      }
      // Only touch the visible UI if the visitor hasn't since moved on to a
      // different booking (new dates, new id) — a stale success must not
      // flip a different in-progress request over to "thanks".
      if (isStillCurrent) {
        setSubmitBusy(false);
        showThanks();
      }
    } else {
      bookingStatus.set(bookingId, 'idle'); // explicit: retry is allowed
      if (isStillCurrent) {
        setSubmitBusy(false);
        showFormError("We couldn't confirm your request. Please try again or contact us on WhatsApp.");
      }
    }
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

    // Opening WhatsApp only hands the visitor a pre-filled chat — it does not
    // confirm the message was actually sent, so no success screen and no
    // conversion event here (that event means "we captured a lead").
    window.open(`https://wa.me/19543108470?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });
})();
