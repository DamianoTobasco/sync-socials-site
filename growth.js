/* Optional first-party measurement; identical copy in the static marketing site. */
(() => {
  'use strict';
  if (window.syncSocialsGrowth) return;
  const endpoint = document.currentScript?.dataset.endpoint || '/api/growth';
  const consentKey = 'ss_growth_consent', acquisitionKey = 'ss_growth_acquisition', visitKey = 'ss_growth_day';
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
  async function record() {
    if (read(consentKey) !== 'granted' || navigator.globalPrivacyControl || navigator.doNotTrack === '1') { clear(); return; }
    if (protectedPath()) return;
    const acquisition = entrance(); let first;
    try { first = JSON.parse(read(acquisitionKey)); } catch { /* bad cookie */ }
    const age = first ? Date.now() - Date.parse(first.capturedAt) : NaN;
    if (!Number.isFinite(age) || age < 0 || age > 30 * 86400000) write(acquisitionKey, JSON.stringify(acquisition), 30 * 86400);
    const day = new Date().toISOString().slice(0, 10); let visitor = read(visitKey);
    if (!visitor || !visitor.startsWith(day + '.')) { visitor = day + '.' + crypto.randomUUID(); write(visitKey, visitor, Math.max(1, Math.ceil((Date.parse(day) + 86400000 - Date.now()) / 1000))); }
    try { await fetch(endpoint + '/visit', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...acquisition, visitorId: visitor.slice(11) }), keepalive: true }); } catch { /* fail open */ }
  }
  let panel;
  function settings() {
    if (panel) return;
    panel = document.createElement('aside'); panel.setAttribute('aria-label', 'Site analytics privacy');
    panel.style.cssText = 'position:fixed;z-index:10000;left:16px;bottom:58px;width:min(360px,calc(100vw - 32px));padding:18px;box-sizing:border-box;border:1px solid #5c8767;border-radius:14px;background:#14221a;color:#f4f3ed;font:14px/1.5 system-ui;box-shadow:0 8px 30px #0004';
    const text = document.createElement('p'); text.textContent = 'Allow optional site analytics? We count daily browser visits and remember campaign tags for 30 days to understand signups. No fingerprinting or full URLs. Separate from advertising cookies.';
    const link = document.createElement('a'); link.href = 'https://app.sync-socials.com/privacy'; link.textContent = 'Privacy details'; link.style.cssText = 'display:block;color:#a5e4b4;margin-bottom:12px'; panel.append(text, link);
    [['denied', 'Decline analytics'], ['granted', 'Allow analytics']].forEach(([value, caption]) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = caption; button.style.cssText = 'padding:10px;margin-right:8px;border:1px solid #74967e;border-radius:8px;color:inherit;background:transparent;cursor:pointer';
      button.addEventListener('click', () => { write(consentKey, value, 180 * 86400); panel.remove(); panel = null; if (value === 'denied') clear(); else void record(); }); panel.append(button);
    }); document.body.append(panel);
  }
  window.syncSocialsGrowth = { settings };
  async function init() {
    if (navigator.globalPrivacyControl || navigator.doNotTrack === '1') { clear(); return; }
    let enabled = false;
    try { const r = await fetch(endpoint + '/config', { credentials: 'omit', cache: 'no-store' }); enabled = r.ok && (await r.json()).enabled === true; } catch { return; }
    if (!enabled) return;
    const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Analytics privacy'; button.setAttribute('aria-label', 'Change site analytics consent'); button.style.cssText = 'position:fixed;z-index:9998;left:16px;bottom:16px;padding:7px 12px;border:1px solid #74967e;border-radius:18px;background:#14221a;color:#f4f3ed;font:12px system-ui;cursor:pointer'; button.addEventListener('click', settings); document.body.append(button);
    if (!read(consentKey) && !protectedPath()) settings(); else if (read(consentKey) === 'granted') void record(); else clear();
  }
  void init();
})();
