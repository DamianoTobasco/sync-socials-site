/* Optional first-party measurement and the site's single optional-cookie prompt; identical copy in the static marketing site. */
(() => {
  'use strict';
  if (window.syncSocialsGrowth) return;
  const endpoint = document.currentScript?.dataset.endpoint || '/api/growth';
  // Pages that load the Meta Pixel declare it on this script tag, so the
  // advertising choice is asked in the same panel instead of a second pop-up.
  const adsDeclared = Boolean(document.querySelector('script[src*="growth.js"][data-ads="meta"]'));
  const consentKey = 'ss_growth_consent', acquisitionKey = 'ss_growth_acquisition', visitKey = 'ss_growth_day', adsKey = 'ss_meta_consent';
  const shared = location.hostname === 'sync-socials.com' || location.hostname.endsWith('.sync-socials.com');
  const suffix = '; Path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '') + (shared ? '; Domain=sync-socials.com' : '');
  function read(name) { try { const raw = document.cookie.split(';').map(v => v.trim()).find(v => v.startsWith(name + '=')); return raw ? decodeURIComponent(raw.slice(name.length + 1)) : null; } catch { return null; } }
  function write(name, value, seconds) { document.cookie = name + '=' + encodeURIComponent(value) + '; Max-Age=' + seconds + suffix; }
  function clear() { [acquisitionKey, visitKey].forEach(k => { write(k, '', 0); document.cookie = k + '=; Max-Age=0; Path=/; SameSite=Lax'; }); }
  function label(v) { return typeof v === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_. -]{0,79}$/.test(v.trim()) ? v.trim() : null; }
  function entrance() {
    const p = new URLSearchParams(location.search); let source = label(p.get('utm_source'));
    if (!source) { try { const host = new URL(document.referrer).hostname; source = host === 'sync-socials.com' || host.endsWith('.sync-socials.com') ? null : label(host); } catch { /* no referrer */ } }
    return { source: source || 'direct', medium: label(p.get('utm_medium')), campaign: label(p.get('utm_campaign')), content: label(p.get('utm_content')), referral: label(p.get('ref') || p.get('via') || p.get('ref_code')), capturedAt: new Date().toISOString() };
  }
  const protectedPath = () => /^\/(app|api|oauth|auth)(\/|$)/.test(location.pathname);
  const privacySignal = () => Boolean(navigator.globalPrivacyControl || navigator.doNotTrack === '1');
  let analyticsEnabled = false;
  async function record() {
    if (read(consentKey) !== 'granted' || privacySignal()) { clear(); return; }
    if (protectedPath()) return;
    const acquisition = entrance(); let first;
    try { first = JSON.parse(read(acquisitionKey)); } catch { /* bad cookie */ }
    const age = first ? Date.now() - Date.parse(first.capturedAt) : NaN;
    if (!Number.isFinite(age) || age < 0 || age > 30 * 86400000) write(acquisitionKey, JSON.stringify(acquisition), 30 * 86400);
    const day = new Date().toISOString().slice(0, 10); let visitor = read(visitKey);
    if (!visitor || !visitor.startsWith(day + '.')) { visitor = day + '.' + crypto.randomUUID(); write(visitKey, visitor, Math.max(1, Math.ceil((Date.parse(day) + 86400000 - Date.now()) / 1000))); }
    try { await fetch(endpoint + '/visit', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...acquisition, visitorId: visitor.slice(11) }), keepalive: true }); } catch { /* fail open */ }
  }
  // Each purpose keeps its own cookie and its own Decline/Allow pair; they only
  // share one compact panel so visitors never face two stacked pop-ups.
  const choices = {
    analytics: {
      text: 'Analytics: count visits and remember campaign tags for 30 days. No fingerprinting.',
      noun: 'analytics',
      current: () => read(consentKey),
      decide(value) { write(consentKey, value, 180 * 86400); if (value === 'denied') clear(); else void record(); },
    },
    ads: {
      text: 'Advertising: Meta cookies that measure signups from our ads.',
      noun: 'advertising cookies',
      current: () => read(adsKey),
      decide(value) { write(adsKey, value, 180 * 86400); window.dispatchEvent(new CustomEvent('syncsocials:ads-consent', { detail: value })); },
    },
  };
  let panel, restorePadding = null;
  function close() {
    if (!panel) return;
    panel.remove(); panel = null;
    if (restorePadding !== null) { document.body.style.paddingBottom = restorePadding; restorePadding = null; }
  }
  function open(rows, dismissible = false) {
    if (panel || rows.length === 0) return;
    panel = document.createElement('aside'); panel.setAttribute('aria-label', 'Site analytics privacy');
    panel.style.cssText = 'position:fixed;z-index:10000;left:12px;bottom:12px;width:min(420px,calc(100vw - 24px));padding:12px 14px;box-sizing:border-box;border:1px solid #5c8767;border-radius:14px;background:#14221a;color:#f4f3ed;font:13px/1.45 system-ui;box-shadow:0 8px 30px #0004';
    const head = document.createElement('div'); head.style.cssText = 'display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:6px';
    const title = document.createElement('strong'); title.textContent = 'Optional cookies';
    const link = document.createElement('a'); link.href = 'https://app.sync-socials.com/privacy'; link.textContent = 'Privacy details'; link.style.cssText = 'color:#a5e4b4;font-size:12px';
    head.append(title, link);
    if (dismissible) {
      const done = document.createElement('button'); done.type = 'button'; done.textContent = 'Close'; done.setAttribute('aria-label', 'Close privacy choices');
      done.style.cssText = 'padding:2px 8px;border:0;background:transparent;color:#a5e4b4;font:600 12px system-ui;cursor:pointer';
      done.addEventListener('click', close); head.append(done);
    }
    panel.append(head);
    const remaining = new Set(rows);
    rows.forEach(key => {
      const choice = choices[key];
      const row = document.createElement('div'); row.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 12px;padding:6px 0;border-top:1px solid #2c4434';
      const text = document.createElement('p'); text.textContent = choice.text; text.style.cssText = 'margin:0;flex:1 1 200px';
      const buttons = document.createElement('div'); buttons.style.cssText = 'display:flex;gap:6px;flex:0 0 auto;margin-left:auto';
      [['denied', 'Decline'], ['granted', 'Allow']].forEach(([value, caption]) => {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = caption;
        button.setAttribute('aria-label', caption + ' ' + choice.noun);
        const selected = choice.current() === value; button.setAttribute('aria-pressed', String(selected));
        button.style.cssText = 'padding:6px 14px;border:1px solid #74967e;border-radius:999px;color:inherit;background:' + (selected ? '#2f6b45' : 'transparent') + ';font:600 12px system-ui;cursor:pointer';
        button.addEventListener('click', () => {
          choice.decide(value); row.remove(); remaining.delete(key);
          if (remaining.size === 0) close();
        });
        buttons.append(button);
      });
      row.append(text, buttons); panel.append(row);
    });
    document.body.append(panel);
    // Let the page scroll its last controls (such as a signup button) above the panel.
    restorePadding = document.body.style.paddingBottom;
    document.body.style.paddingBottom = (panel.offsetHeight + 24) + 'px';
  }
  function settings() {
    const rows = [];
    if (analyticsEnabled) rows.push('analytics');
    if (adsDeclared) rows.push('ads');
    open(rows, true);
  }
  window.syncSocialsGrowth = { settings };
  async function init() {
    if (privacySignal()) clear();
    else {
      try { const r = await fetch(endpoint + '/config', { credentials: 'omit', cache: 'no-store' }); analyticsEnabled = r.ok && (await r.json()).enabled === true; } catch { analyticsEnabled = false; }
    }
    if (analyticsEnabled) {
      // A page can offer its own link (for example in a footer) instead of the floating button.
      const pageLink = document.querySelector('[data-analytics-privacy-link]');
      if (pageLink) { pageLink.hidden = false; pageLink.addEventListener('click', settings); }
      else { const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Analytics privacy'; button.setAttribute('aria-label', 'Change site analytics consent'); button.style.cssText = 'position:fixed;z-index:9998;left:16px;bottom:16px;padding:7px 12px;border:1px solid #74967e;border-radius:18px;background:#14221a;color:#f4f3ed;font:12px system-ui;cursor:pointer'; button.addEventListener('click', settings); document.body.append(button); }
      const analyticsChoice = read(consentKey);
      if (analyticsChoice === 'granted') void record(); else if (analyticsChoice || protectedPath()) clear();
    }
    const pending = [];
    if (analyticsEnabled && !read(consentKey) && !protectedPath()) pending.push('analytics');
    if (adsDeclared && !read(adsKey)) pending.push('ads');
    open(pending);
  }
  void init();
})();
