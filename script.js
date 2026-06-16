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
const themeBtn = document.getElementById('themeToggle');
const stored = localStorage.getItem('ss-theme');
if (stored) root.setAttribute('data-theme', stored);
const syncIcon = () => themeBtn.textContent = root.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
syncIcon();
themeBtn.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('ss-theme', next);
  syncIcon();
});

// ---- Reveal on scroll ----
const revealEls = document.querySelectorAll('.section, .hero-shot, .price-card');
revealEls.forEach(el => el.classList.add('reveal'));
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

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
