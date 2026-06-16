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
// Reads ?ref=CODE (also accepts ?via / ?ref_code) from the URL, remembers it for
// 90 days, and threads it into every CTA so the backend can attribute commission:
//   • Stripe checkout links  -> ?client_reference_id=CODE  (lands in checkout.session.completed)
//   • app.sync-socials.com   -> ?ref=CODE                  (for in-app signup attribution)
const REF_KEY = 'ss_ref';
const REF_TS_KEY = 'ss_ref_ts';
const REF_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days
(function captureRef() {
  const p = new URLSearchParams(location.search);
  const incoming = (p.get('ref') || p.get('via') || p.get('ref_code') || '').trim();
  if (incoming) {
    localStorage.setItem(REF_KEY, incoming);
    localStorage.setItem(REF_TS_KEY, String(Date.now()));
  }
})();
function getRef() {
  const code = localStorage.getItem(REF_KEY);
  const ts = Number(localStorage.getItem(REF_TS_KEY) || 0);
  if (!code || !ts || Date.now() - ts > REF_TTL) return null;
  return code;
}
function withParam(url, key, value) {
  if (!value) return url;
  return url + (url.indexOf('?') > -1 ? '&' : '?') + key + '=' + encodeURIComponent(value);
}
// Append the referral code using the right param for the destination:
//   Stripe checkout -> client_reference_id ; app links -> ref
function withRef(url) {
  const ref = getRef();
  if (!ref) return url;
  if (/buy\.stripe\.com/.test(url)) return withParam(url, 'client_reference_id', ref);
  if (/app\.sync-socials\.com/.test(url)) return withParam(url, 'ref', ref);
  return url;
}
function applyReferralToLinks() {
  const ref = getRef();
  if (!ref) return;
  document.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (/buy\.stripe\.com/.test(href) && href.indexOf('client_reference_id=') === -1) {
      a.setAttribute('href', withParam(href, 'client_reference_id', ref));
    } else if (/app\.sync-socials\.com/.test(href) && href.indexOf('ref=') === -1) {
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
