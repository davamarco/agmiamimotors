/* ================================================================
   AG MOTORS MIAMI - chauffeur-form.js
   Private driver request form (Web3Forms, same account as bookings)
   ================================================================ */
(function () {
  'use strict';
  const form = document.getElementById('chauffeur-form');
  if (!form) return;

  const ACCESS_KEY = '8aeb3671-54be-4636-bfac-c7ed5ee15fe0';
  const ENDPOINT = 'https://api.web3forms.com/submit';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const errorEl = document.getElementById('cform-error');
  const thanks = document.getElementById('cform-thanks');
  const submit = form.querySelector('.cform__submit');

  /* Analytics (GTM dataLayer -> GA4): field names and failure reasons only,
     never what the visitor typed. Every key is sent on every event so a
     value from an earlier event never lingers in GTM. */
  const EVENT_KEYS = ['form_type', 'form_location', 'vehicle', 'error_type', 'error_fields', 'reason', 'lead_source'];
  function track(event, params) {
    try {
      const payload = { event };
      EVENT_KEYS.forEach(k => { payload[k] = undefined; });
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign(payload, { form_type: 'chauffeur', form_location: 'chauffeur_page' }, params));
    } catch (err) { /* never let analytics affect the form */ }
  }
  function leadSource() {
    try { return window.AGAttribution ? window.AGAttribution.get().channel : undefined; } catch (err) { return undefined; }
  }
  function leadSourceLines() {
    try { return window.AGAttribution ? window.AGAttribution.emailLines() : []; } catch (err) { return []; }
  }
  function invalidFieldNames() {
    return [...form.querySelectorAll('.is-invalid')].map(el => el.name).join(',');
  }

  let started = false;
  function onFirstInteraction() {
    if (started) return;
    started = true;
    track('chauffeur_form_start');
  }
  form.addEventListener('input', onFirstInteraction);
  form.addEventListener('change', onFirstInteraction);

  /* Dates use the US format: MM/DD/YYYY */
  function maskDate(el) {
    el.addEventListener('input', () => {
      const d = el.value.replace(/\D/g, '').slice(0, 8);
      let out = d.slice(0, 2);
      if (d.length > 2) out += '/' + d.slice(2, 4);
      if (d.length > 4) out += '/' + d.slice(4, 8);
      el.value = out;
    });
  }
  maskDate(form.elements.date_from);
  maskDate(form.elements.date_to);

  function parseDate(str) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str);
    if (!m) return null;
    const mo = +m[1], da = +m[2], yr = +m[3];
    const d = new Date(yr, mo - 1, da);
    return d.getFullYear() === yr && d.getMonth() === mo - 1 && d.getDate() === da ? d : null;
  }

  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorEl.hidden = true;
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    const name = form.elements.name.value.trim();
    const phone = form.phone.value.trim();
    const email = form.email.value.trim();
    let bad = false;
    if (!name) { form.elements.name.classList.add('is-invalid'); bad = true; }
    if (!phone) { form.phone.classList.add('is-invalid'); bad = true; }
    if (email && !EMAIL_RE.test(email)) { form.email.classList.add('is-invalid'); bad = true; }
    const from = form.elements.date_from.value.trim();
    const to = form.elements.date_to.value.trim();
    const fromD = from ? parseDate(from) : null;
    const toD = to ? parseDate(to) : null;
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    let dateMsg = '';
    if ((from && !fromD) || (to && !toD)) dateMsg = 'Please enter dates as MM/DD/YYYY.';
    else if (fromD && fromD < startOfToday) dateMsg = 'The start date cannot be in the past.';
    else if (fromD && toD && toD < fromD) dateMsg = 'The end date must be after the start date.';
    if (dateMsg) {
      if ((from && !fromD) || (fromD && fromD < startOfToday) || (fromD && toD && toD < fromD)) form.elements.date_from.classList.add('is-invalid');
      if (to && !toD) form.elements.date_to.classList.add('is-invalid');
      track('chauffeur_form_error', { error_type: 'validation', error_fields: invalidFieldNames() });
      showError(dateMsg); return;
    }
    if (bad) {
      track('chauffeur_form_error', { error_type: 'validation', error_fields: invalidFieldNames() });
      showError('Please fill in your name and phone (and a valid email if provided).'); return;
    }
    if (form.botcheck.value) return;

    const lines = [
      'Private Driver request',
      'Name: ' + name,
      'Phone: ' + phone,
      'Email: ' + (email || 'not provided'),
      'Vehicle: ' + (form.vehicle.value || 'not sure yet'),
      'From: ' + (from || 'not specified'),
      'To: ' + (to || 'not specified'),
      'Details: ' + (form.details.value.trim() || '-'),
      ...leadSourceLines(),
    ].join('\n');

    const data = new FormData();
    data.append('access_key', ACCESS_KEY);
    data.append('subject', 'Private Driver Request - ' + name);
    data.append('from_name', 'AG Motors Miami Website');
    data.append('name', name);
    if (email) data.append('email', email);
    data.append('message', lines);
    data.append('botcheck', '');

    const eventParams = { vehicle: form.vehicle.value || 'not sure yet', lead_source: leadSource() };
    track('chauffeur_submit_attempt', eventParams);

    submit.disabled = true;
    const label = submit.textContent;
    submit.textContent = 'Sending...';
    let ok = false;
    let reason = 'rejected';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);   // a stalled mobile connection must not hang the button
    try {
      const res = await fetch(ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' }, body: data, signal: controller.signal });
      if (!res.ok) reason = 'http';
      const json = await res.json();
      ok = res.ok && json && json.success === true;
    } catch (err) { ok = false; reason = controller.signal.aborted ? 'timeout' : 'network'; }
    clearTimeout(timer);

    if (ok) {
      track('ag_chauffeur_success', eventParams);
    } else {
      track('chauffeur_form_error', Object.assign({ error_type: 'submit', reason }, eventParams));
      track('ag_chauffeur_error', Object.assign({ reason }, eventParams));  // kept for existing GTM setups
    }

    if (ok) {
      form.hidden = true;
      thanks.hidden = false;
    } else {
      submit.disabled = false;
      submit.textContent = label;
      showError('Something went wrong. Please try again or message us on WhatsApp.');
    }
  });
})();
