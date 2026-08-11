// Optional Meta advertising measurement. The Pixel ID is public; the
// Conversions API access token remains server-only in the app.
const META_PIXEL_ID = '1029711589414216';
const META_CONSENT_COOKIE = 'ss_meta_consent';
const META_COOKIE_MAX_AGE = 180 * 24 * 60 * 60;

function readBrowserCookie(name) {
  const prefix = name + '=';
  const item = document.cookie.split(';').map(part => part.trim()).find(part => part.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
}

function setSharedMetaCookie(name, value) {
  const sharedDomain = location.hostname === 'sync-socials.com' || location.hostname.endsWith('.sync-socials.com');
  document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; max-age=' + META_COOKIE_MAX_AGE +
    '; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '') +
    (sharedDomain ? '; domain=sync-socials.com' : '');
}

function syncMetaAttributionCookies() {
  const fbp = readBrowserCookie('_fbp');
  const fbc = readBrowserCookie('_fbc');
  if (fbp) setSharedMetaCookie('ss_fbp', fbp);
  if (fbc) setSharedMetaCookie('ss_fbc', fbc);

  const fbclid = new URLSearchParams(location.search).get('fbclid');
  if (fbclid && !fbc) setSharedMetaCookie('ss_fbc', 'fb.1.' + Date.now() + '.' + fbclid.slice(0, 300));
}

function loadMetaPixel() {
  if (window.fbq) return;
  (function(f,b,e,v,n,t,s) {
    if (f.fbq) return;
    n = f.fbq = function() { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = true; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
  syncMetaAttributionCookies();
  window.setTimeout(syncMetaAttributionCookies, 1200);
}

function initMetaMeasurement() {
  const consent = readBrowserCookie(META_CONSENT_COOKIE);
  if (consent === 'granted') {
    loadMetaPixel();
    return;
  }
  if (consent === 'denied') return;

  const banner = document.createElement('aside');
  banner.className = 'meta-consent';
  banner.setAttribute('aria-label', 'Analytics cookie choice');
  banner.innerHTML = '<p>Sync Socials uses optional advertising cookies to measure signups and improve its ads. <a href="https://app.sync-socials.com/privacy">Learn more</a></p>' +
    '<div><button type="button" data-meta-consent="denied">Decline</button><button type="button" class="meta-consent__accept" data-meta-consent="granted">Allow</button></div>';
  document.body.appendChild(banner);
  banner.querySelectorAll('[data-meta-consent]').forEach(button => button.addEventListener('click', () => {
    const choice = button.getAttribute('data-meta-consent');
    setSharedMetaCookie(META_CONSENT_COOKIE, choice);
    banner.remove();
    if (choice === 'granted') loadMetaPixel();
  }));
}

initMetaMeasurement();
