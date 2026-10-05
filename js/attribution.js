/* ================================================================
   AG MOTORS MIAMI - attribution.js
   Remembers where a visitor came from (UTM tags and Google / Meta
   click ids) so every booking request can say which ad brought it,
   even if the visitor browses several pages before submitting.
   Loaded on every page. Exposes window.AGAttribution.
   ================================================================ */
(function () {
  'use strict';

  const PARAMS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
    'gclid', 'gbraid', 'wbraid',  // Google Ads
    'fbclid',                     // Meta (Facebook / Instagram)
  ];
  const FIRST_KEY = 'ag_attr_first';  // first visit: landing page + referrer
  const LAST_KEY  = 'ag_attr_last';   // most recent visit that came with ad tags
  const MAX_AGE_MS = 90 * 86400000;

  function read(key) {
    try {
      const obj = JSON.parse(localStorage.getItem(key) || 'null');
      return obj && Date.now() - obj.ts < MAX_AGE_MS ? obj : null;
    } catch (err) { return null; }
  }
  function write(key, obj) {
    try { localStorage.setItem(key, JSON.stringify(obj)); } catch (err) { /* private mode etc. */ }
  }

  function externalReferrer() {
    try {
      const ref = document.referrer;
      return ref && new URL(ref).hostname !== location.hostname ? ref : '';
    } catch (err) { return ''; }
  }

  const search = new URLSearchParams(location.search);
  const params = {};
  PARAMS.forEach(p => { const v = search.get(p); if (v) params[p] = v.slice(0, 200); });
  const hasParams = Object.keys(params).length > 0;
  const visit = { ts: Date.now(), params, landing: location.pathname, referrer: externalReferrer() };

  // Kept in memory too, so the current visit is still attributed when
  // storage is blocked.
  let first = read(FIRST_KEY);
  let last  = read(LAST_KEY);
  if (!first) { first = visit; write(FIRST_KEY, visit); }
  if (hasParams) { last = visit; write(LAST_KEY, visit); }

  function channelOf(p, referrer) {
    const src = (p.utm_source || '').toLowerCase();
    if (p.gclid || p.gbraid || p.wbraid) return 'Google Ads';
    if (p.fbclid || /^(facebook|fb|instagram|ig|meta)$/.test(src)) return 'Meta';
    if (src === 'google') return 'Google';
    if (p.utm_source) return p.utm_source;
    if (referrer) {
      try { return 'Referral: ' + new URL(referrer).hostname; } catch (err) { /* fall through */ }
    }
    return 'Direct / unknown';
  }

  function get() {
    const touch = last || first || visit;
    return {
      channel: channelOf(touch.params, touch.referrer),
      params: touch.params,
      landing: touch.landing,
      referrer: touch.referrer,
      firstLanding: first ? first.landing : visit.landing,
      firstReferrer: first ? first.referrer : visit.referrer,
    };
  }

  // Plain-text block for the booking request email.
  function emailLines() {
    const a = get();
    const lines = ['', '--- Lead source ---', 'Channel: ' + a.channel];
    PARAMS.forEach(p => { if (a.params[p]) lines.push(p + ': ' + a.params[p]); });
    lines.push('Landing page: ' + (a.landing || '-'));
    if (a.referrer) lines.push('Referrer: ' + a.referrer);
    if (a.firstLanding !== a.landing || a.firstReferrer !== a.referrer) {
      lines.push('First visit: ' + (a.firstLanding || '-') + (a.firstReferrer ? ' (from ' + a.firstReferrer + ')' : ''));
    }
    return lines;
  }

  window.AGAttribution = { get, emailLines };
})();
