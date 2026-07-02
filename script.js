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
