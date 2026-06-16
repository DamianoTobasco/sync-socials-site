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

// ---- Pricing billing toggle ----
const opts = document.querySelectorAll('.bt-opt');
const amount = document.querySelector('.pc-amount');
const sub = document.querySelector('.pc-sub');
opts.forEach(opt => opt.addEventListener('click', () => {
  opts.forEach(o => o.classList.remove('active'));
  opt.classList.add('active');
  const plan = opt.dataset.plan; // monthly | yearly
  amount.textContent = amount.dataset[plan];
  sub.textContent = sub.dataset[plan];
}));

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
