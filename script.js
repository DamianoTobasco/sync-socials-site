// ---- Optional Meta advertising measurement ----
// The Pixel ID is public. The Conversions API access token remains server-only
// in the app and is never present on this marketing site.
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

// ---- Year ----
document.getElementById('year').textContent = new Date().getFullYear();

// ---- Sticky header shadow ----
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// ---- Mobile menu ----
const toggle = document.querySelector('.nav-toggle');
const menu = document.querySelector('.mobile-menu');
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  menu.hidden = open;
});
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  toggle.setAttribute('aria-expanded', 'false');
  menu.hidden = true;
}));

// ---- Marquee: fill the track so the -50% loop never shows a seam ----
// The track holds two identical halves; doubling keeps them identical, and the
// animation duration scales with width so the speed stays constant.
const marqueeTrack = document.querySelector('.marquee-track');
if (marqueeTrack) {
  const fillMarquee = () => {
    const target = Math.max(window.innerWidth, (window.screen && screen.width) || 0) + 120;
    let guard = 0;
    while (marqueeTrack.scrollWidth / 2 < target && guard < 5) {
      marqueeTrack.innerHTML += marqueeTrack.innerHTML;
      guard++;
    }
    marqueeTrack.style.animationDuration = Math.round(marqueeTrack.scrollWidth / 2 / 40) + 's';
  };
  fillMarquee();
  window.addEventListener('resize', fillMarquee);
}

// ---- Referral capture ----
// Reads ?ref=CODE (also accepts ?via / ?ref_code), remembers it, and threads it
// into every CTA so the app can attribute commission whenever the visitor joins.
const REF_KEY = 'ss_ref';
(function captureRef() {
  const p = new URLSearchParams(location.search);
  const incoming = (p.get('ref') || p.get('via') || p.get('ref_code') || '').trim();
  if (incoming) {
    localStorage.setItem(REF_KEY, incoming);
  }
})();
function getRef() {
  const code = localStorage.getItem(REF_KEY);
  return code || null;
}
function withParam(url, key, value) {
  if (!value) return url;
  try {
    const parsed = new URL(url, window.location.href);
    parsed.searchParams.set(key, value);
    return parsed.toString();
  } catch (err) {
    return url + (url.indexOf('?') > -1 ? '&' : '?') + key + '=' + encodeURIComponent(value);
  }
}
function withRef(url) {
  const ref = getRef();
  if (!ref) return url;
  if (/app\.sync-socials\.com/.test(url)) return withParam(url, 'ref', ref);
  return url;
}
function applyReferralToLinks() {
  const ref = getRef();
  if (!ref) return;
  document.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (/app\.sync-socials\.com/.test(href) && href.indexOf('ref=') === -1) {
      a.setAttribute('href', withParam(href, 'ref', ref));
    }
  });
}

// ---- Pricing billing toggle (also swaps the Stripe checkout link) ----
const opts = document.querySelectorAll('.bt-opt');
const amount = document.querySelector('.pc-amount');
const sub = document.querySelector('.pc-sub');
const pricingCta = document.getElementById('pricingCta');
function setPlan(plan) { // monthly | yearly
  amount.textContent = amount.dataset[plan];
  sub.textContent = sub.dataset[plan];
  if (pricingCta && pricingCta.dataset[plan]) {
    pricingCta.setAttribute('href', withRef(pricingCta.dataset[plan]));
  }
}
opts.forEach(opt => opt.addEventListener('click', () => {
  opts.forEach(o => o.classList.remove('active'));
  opt.classList.add('active');
  setPlan(opt.dataset.plan);
}));
setPlan('monthly');
applyReferralToLinks();

// ---- FAQ: keep one open at a time ----
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => item.addEventListener('toggle', () => {
  if (item.open) faqItems.forEach(o => { if (o !== item) o.open = false; });
}));

// ---- Theme toggle (persisted) ----
const root = document.documentElement;
const themeButtons = document.querySelectorAll('[data-theme-toggle]');
const stored = localStorage.getItem('ss-theme');
if (stored) root.setAttribute('data-theme', stored);
const syncIcon = () => {
  const dark = root.getAttribute('data-theme') === 'dark';
  themeButtons.forEach((button) => {
    button.textContent = dark ? '☀️' : '🌙';
    button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  });
};
syncIcon();
themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('ss-theme', next);
    syncIcon();
  });
});

// ---- Reveal on scroll ----
const revealEls = document.querySelectorAll('.section, .hero-shot, .price-card');
revealEls.forEach(el => el.classList.add('reveal'));
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

// ---- Staggered child reveals ----
// Class is added by JS so content stays visible if JS never runs.
const staggerEls = document.querySelectorAll('[data-stagger]');
staggerEls.forEach(el => el.classList.add('stagger'));
const sio = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); sio.unobserve(e.target); } });
}, { threshold: 0.15 });
staggerEls.forEach(el => sio.observe(el));

// ---- Product calendar demo ----
// Keep the real app recording lightweight and respectful of motion preferences.
const calendarDemoVideo = document.querySelector('.calendar-demo-video');
if (calendarDemoVideo && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  calendarDemoVideo.pause();
  calendarDemoVideo.removeAttribute('autoplay');
}

// ---- Content Studio: Viral Studio swipe-card demo ----
(function viralDemo() {
  const card = document.getElementById('vdCard');
  if (!card) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const concepts = [
    { chip: '3 things', hook: "1. You're posting inconsistently", caption: "Are you struggling with your social media? Here are 3 signs it's time for an upgrade. Hint: Sync Socials can help!", meta: 'Facebook · YouTube', scene: 1 },
    { chip: 'POV', hook: 'POV: your week is already scheduled', caption: 'Batch once, then relax - your content publishes itself while you build the business.', meta: 'Instagram · Facebook', scene: 2 },
    { chip: 'Hook', hook: 'Stop running your socials in 8 tabs', caption: 'One dashboard, every platform. Schedule once and publish everywhere with Sync Socials.', meta: 'Instagram · YouTube', scene: 3 }
  ];
  const el = (name) => card.querySelector('[data-vd="' + name + '"]');
  const dots = document.querySelectorAll('.vd-dot');
  let i = 0, timer = null;

  const advance = () => {
    card.classList.add('out');
    setTimeout(() => {
      i = (i + 1) % concepts.length;
      const c = concepts[i];
      el('chip').textContent = c.chip;
      el('hook').textContent = c.hook;
      el('caption').textContent = c.caption;
      el('meta').textContent = c.meta;
      el('video').className = 'vd-video vd-scene-' + c.scene;
      dots.forEach((d, di) => d.classList.toggle('active', di === i));
      card.classList.remove('out');
      card.classList.add('in');
      setTimeout(() => card.classList.remove('in'), 520);
    }, 560);
  };

  // Only cycle while the demo is on screen.
  const vio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && !timer) timer = setInterval(advance, 5200);
      else if (!e.isIntersecting && timer) { clearInterval(timer); timer = null; }
    });
  }, { threshold: 0.25 });
  vio.observe(card);
})();

// ---- Content Studio: cycling prompt typing ----
(function promptTyping() {
  const el = document.querySelector('.sp-typed');
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let phrases = [];
  try { phrases = JSON.parse(el.dataset.phrases || '[]'); } catch (err) { return; }
  if (!phrases.length) return;

  let phrase = 0, char = phrases[0].length, deleting = false;
  const tick = () => {
    const current = phrases[phrase];
    if (deleting) {
      char--;
      el.textContent = current.slice(0, char);
      if (char === 0) {
        deleting = false;
        phrase = (phrase + 1) % phrases.length;
        setTimeout(tick, 400);
      } else {
        setTimeout(tick, 26);
      }
    } else {
      char++;
      el.textContent = current.slice(0, char);
      if (char >= current.length) {
        deleting = true;
        setTimeout(tick, 2400);
      } else {
        setTimeout(tick, 55 + Math.random() * 45);
      }
    }
  };
  setTimeout(() => { deleting = true; tick(); }, 2600);
})();

// ---- MCP section: copy install command ----
document.querySelectorAll('.ss-mcp .ss-copy').forEach(function (btn) {
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    var text = btn.getAttribute('data-copy') || '';
    var label = btn.querySelector('.ss-copy__label');
    var done = function () {
      btn.classList.add('is-copied');
      if (label) label.textContent = 'Copied';
      setTimeout(function () {
        btn.classList.remove('is-copied');
        if (label) label.textContent = 'Copy';
      }, 1600);
    };
    var fallback = function () {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (err) {}
      document.body.removeChild(ta); done();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else { fallback(); }
  });
});
