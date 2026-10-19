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
  if (readBrowserCookie(META_CONSENT_COOKIE) === 'granted') {
    loadMetaPixel();
    return;
  }
  // growth.js asks for this choice in its single optional-cookie panel and
  // announces the decision, so this page never shows a second pop-up.
  window.addEventListener('syncsocials:ads-consent', event => {
    if (event.detail === 'granted') loadMetaPixel();
  });
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
// Every amount, note and checkout link that carries both cadences follows the toggle.
const planSwappers = document.querySelectorAll('[data-monthly][data-yearly]');
function setPlan(plan) { // monthly | yearly
  planSwappers.forEach((el) => {
    const value = el.dataset[plan];
    if (!value) return;
    if (el.tagName === 'A') el.setAttribute('href', withRef(value));
    else el.textContent = value;
  });
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
// Only small pieces (the hero shot and price cards) fade in. Whole sections
// stay visible so a fast scroll never lands on a blank page.
const canObserve = 'IntersectionObserver' in window;
const revealEls = document.querySelectorAll('.hero-shot, .price-card');
revealEls.forEach(el => el.classList.add('reveal'));
if (canObserve) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('in'));
}

// ---- Staggered child reveals ----
// Class is added by JS so content stays visible if JS never runs. The grid
// starts animating as soon as its first pixels enter the viewport.
const staggerEls = document.querySelectorAll('[data-stagger]');
staggerEls.forEach(el => el.classList.add('stagger'));
if (canObserve) {
  const sio = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); sio.unobserve(e.target); } });
  }, { threshold: 0.02, rootMargin: '0px 0px 40px 0px' });
  staggerEls.forEach(el => sio.observe(el));
} else {
  staggerEls.forEach(el => el.classList.add('in'));
}

// ---- Product calendar demo ----
// Keep the real app recording lightweight and respectful of motion preferences.
const calendarDemoVideo = document.querySelector('.calendar-demo-video');
if (calendarDemoVideo && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  calendarDemoVideo.pause();
  calendarDemoVideo.removeAttribute('autoplay');
}

// ---- Content Studio: swipe deck of example video ideas ----
// Drag a card (or use the buttons / arrow keys) to approve or skip; Edit
// retypes the hook and "re-renders" the clip. When nobody is touching it,
// the deck demos itself while on screen.
(function studioDeck() {
  const demo = document.querySelector('.viral-demo');
  const deck = document.getElementById('vdDeck');
  const template = deck && deck.querySelector('.vd-card');
  if (!demo || !template) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ideas = [
    { clip: 'saas', brand: 'Sync Socials', initial: 'S', color: '#2f9d63', platforms: 'Instagram · TikTok · YouTube', chip: 'POV',
      hook: 'POV: next week’s posts are already scheduled', alt: 'POV: you batched a week of posts before lunch',
      caption: 'Batch your content once, then get back to running the business.', sound: 'Easy Sunday · chill house',
      why: ['Sells the outcome (free time), not the feature.', 'A calm, aspirational POV is easy to save and share.', 'The hook lands in the first second, before the scroll.'] },
    { clip: 'coffee', brand: 'Ember & Oat Café', initial: 'E', color: '#b8743f', platforms: 'Instagram · TikTok', chip: 'Relatable',
      hook: 'me after the first sip of our maple oat latte', alt: 'the 7am regulars when the maple latte is back',
      caption: 'Some mornings need a little extra. The maple oat latte is back for fall ☕', sound: 'Slow morning · lo-fi',
      why: ['Morning-ritual moments are instantly relatable.', 'Names the drink in the hook, so it sticks.', 'A seasonal return gives regulars a reason to stop by.'] },
    { clip: 'burger', brand: 'Smash Alley Burgers', initial: 'S', color: '#d0482f', platforms: 'TikTok · Instagram', chip: 'Taste test',
      hook: 'the burger people drive 40 minutes for', alt: 'rating our double smash as a first-timer',
      caption: 'Double smash, house pickles, toasted brioche. Worth the drive? Tell us below 👇', sound: 'Saturday night · funk',
      why: ['Social proof in the hook: people drive for it.', 'The first bite is the payoff, so viewers stay for it.', 'Ends on a question to pull in comments.'] },
    { clip: 'salon', brand: 'Lume Hair Studio', initial: 'L', color: '#8f63c9', platforms: 'Instagram · Facebook', chip: 'Reaction',
      hook: 'when your stylist says “trust me” and it actually works', alt: 'seeing my fall color in daylight for the first time',
      caption: 'Fall refresh season is here. Book a free color consult, link in bio.', sound: 'Big reveal · pop',
      why: ['A real reaction stops the scroll.', '“Trust me” is a moment every salon client knows.', 'One clear next step: a free consult.'] },
    { clip: 'run', brand: 'Tempo Run Club', initial: 'T', color: '#2f7de1', platforms: 'TikTok · YouTube Shorts', chip: 'Humor',
      hook: 'me after “just one more lap”', alt: 'week one of couch to 5K be like',
      caption: 'Everyone starts somewhere. Eight weeks, three runs a week, zero judgment.', sound: 'Out of breath · drill',
      why: ['Self-aware humor makes fitness feel approachable.', 'Speaks to beginners, the people most likely to join.', 'Short and loopable, so it gets rewatched.'] },
    { clip: 'kitchen', brand: 'Weeknight Kitchen', initial: 'W', color: '#d99a16', platforms: 'Instagram · Facebook · TikTok', chip: 'How-to',
      hook: 'a 15-minute dinner that tastes like takeout', alt: 'one pan, three steps, zero takeout guilt',
      caption: 'Tonight’s box: garlic butter pasta. One pan, three steps, done before delivery would arrive.', sound: 'Kitchen groove · jazz',
      why: ['The hook promises a clear payoff.', 'Recipes are the posts people save for later.', 'Shows the product in use, not a pack shot.'] }
  ];
  const slots = ['Tue 9:00 AM', 'Tue 6:30 PM', 'Wed 12:15 PM', 'Thu 8:00 AM', 'Fri 5:45 PM', 'Sat 10:30 AM'];
  const asset = (clip, ext) => 'assets/studio/studio-' + clip + '.' + ext;
  const part = (root, name) => root.querySelector('[data-vd="' + name + '"]');

  const cards = ideas.map((idea, i) => {
    const card = template.cloneNode(true);
    const video = part(card, 'video');
    video.muted = true;
    // Only the first poster loads with the page; the rest wait until the deck is near.
    if (i) video.removeAttribute('poster');
    video.dataset.poster = asset(idea.clip, 'jpg');
    video.dataset.src = asset(idea.clip, 'mp4');
    const avatar = part(card, 'avatar');
    avatar.textContent = idea.initial;
    avatar.style.setProperty('--av', idea.color);
    ['brand', 'platforms', 'chip', 'hook', 'caption', 'sound'].forEach((k) => { part(card, k).textContent = idea[k]; });
    part(card, 'why').replaceChildren(...idea.why.map((w) => {
      const li = document.createElement('li');
      li.textContent = w;
      return li;
    }));
    return card;
  });
  deck.replaceChildren(...cards);
  demo.classList.add('is-live');

  const btn = (act) => demo.querySelector('[data-act="' + act + '"]');
  const tray = demo.querySelector('.vd-tray');
  const thumbs = demo.querySelector('.vd-thumbs');
  const announce = (text) => { part(demo, 'announce').textContent = text; };
  let top = 0, approved = 0, editing = false, inView = false, raf = 0, auto = 0, lastUser = -Infinity, autoStep = 0;
  let drag = null;

  const layout = () => {
    cards.forEach((card, i) => {
      const d = (i - top + cards.length) % cards.length;
      card.style.setProperty('--d', d);
      card.classList.toggle('is-top', d === 0);
      card.classList.toggle('is-far', d > 2);
      card.inert = d !== 0;
    });
  };

  const videoOf = (card) => part(card, 'video');
  const load = (card) => {
    const v = videoOf(card);
    if (!v.getAttribute('src')) { v.preload = 'auto'; v.src = v.dataset.src; }
  };
  const playTop = (restart) => {
    cards.forEach((card, i) => {
      const v = videoOf(card);
      if (i === top && inView && !reduce) {
        load(card);
        if (restart) { try { v.currentTime = 0; } catch (err) { /* not loaded yet */ } }
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      } else if (!v.paused) {
        v.pause();
      }
    });
    if (inView && !reduce) load(cards[(top + 1) % cards.length]);
  };
  const progress = () => {
    const card = cards[top];
    const v = videoOf(card);
    if (v.duration) part(card, 'progress').style.transform = 'scaleX(' + (v.currentTime / v.duration) + ')';
    raf = inView ? requestAnimationFrame(progress) : 0;
  };

  const closeWhy = (card) => {
    card.classList.remove('show-why');
    card.querySelector('.vd-why-btn').setAttribute('aria-expanded', 'false');
  };
  const press = (act) => {
    const b = btn(act);
    b.classList.add('is-pressed');
    setTimeout(() => b.classList.remove('is-pressed'), 260);
  };

  const schedule = (idea) => {
    const slot = slots[approved % slots.length];
    approved++;
    const thumb = document.createElement('span');
    thumb.className = 'vd-thumb';
    const img = document.createElement('img');
    img.src = asset(idea.clip, 'jpg');
    img.alt = '';
    thumb.appendChild(img);
    thumbs.prepend(thumb);
    while (thumbs.children.length > 4) thumbs.lastElementChild.remove();
    part(tray, 'trayTitle').textContent = approved + (approved === 1 ? ' video scheduled' : ' videos scheduled');
    part(tray, 'traySub').textContent = slot + ' · ' + idea.brand;
    tray.classList.remove('is-bump');
    void tray.offsetWidth;
    tray.classList.add('is-bump');
    return slot;
  };

  const swipe = (dir, dy) => {
    if (editing) return;
    const card = cards[top];
    const idea = ideas[top];
    const sign = dir === 'approve' ? 1 : -1;
    closeWhy(card);
    card.classList.remove('is-nudging');
    card.style.setProperty('--yes', sign > 0 ? 1 : 0);
    card.style.setProperty('--no', sign < 0 ? 1 : 0);
    card.classList.add('is-leaving');
    card.style.transform = 'translate(' + (sign * deck.offsetWidth * 1.4) + 'px,' + ((dy || 0) * 0.3 + 40) + 'px) rotate(' + (sign * 24) + 'deg)';
    deck.classList.remove('is-dragging');
    deck.style.setProperty('--lift', 0);
    if (dir === 'approve') announce('Approved. ' + idea.brand + ' video scheduled for ' + schedule(idea) + '.');
    else announce('Skipped the ' + idea.brand + ' idea.');

    top = (top + 1) % cards.length;
    layout();
    playTop(true);

    setTimeout(() => {
      card.classList.add('no-anim');
      card.classList.remove('is-leaving', 'is-editing', 'is-rendering', 'is-updated');
      card.style.transform = '';
      card.style.removeProperty('--yes');
      card.style.removeProperty('--no');
      part(card, 'hook').textContent = idea.hook;
      delete card.dataset.alt;
      part(card, 'progress').style.transform = '';
      void card.offsetWidth;
      card.classList.remove('no-anim');
    }, reduce ? 0 : 520);
  };

  const edit = () => {
    if (editing) return;
    editing = true;
    const card = cards[top];
    const idea = ideas[top];
    const hook = part(card, 'hook');
    const next = card.dataset.alt ? idea.hook : idea.alt;
    closeWhy(card);
    if (card.dataset.alt) delete card.dataset.alt; else card.dataset.alt = '1';
    card.classList.add('is-editing');

    const finish = () => {
      card.classList.remove('is-editing');
      card.classList.add('is-rendering');
      const v = videoOf(card);
      try { v.currentTime = 0; } catch (err) { /* not loaded yet */ }
      setTimeout(() => {
        card.classList.remove('is-rendering');
        card.classList.add('is-updated');
        announce('Hook updated: ' + next);
        editing = false;
        setTimeout(() => card.classList.remove('is-updated'), 1500);
      }, reduce ? 0 : 900);
    };
    if (reduce) { hook.textContent = next; finish(); return; }

    let text = hook.textContent;
    const erase = () => {
      text = text.slice(0, -2);
      hook.textContent = text;
      if (text) setTimeout(erase, 16);
      else setTimeout(type, 180);
    };
    let n = 0;
    const type = () => {
      n++;
      hook.textContent = next.slice(0, n);
      if (n < next.length) setTimeout(type, 28 + Math.random() * 28);
      else setTimeout(finish, 320);
    };
    setTimeout(erase, 250);
  };

  const act = (name) => {
    if (name === 'edit') edit();
    else swipe(name);
  };

  // ---- Pointer drag on the top card ----
  deck.addEventListener('pointerdown', (e) => {
    const card = cards[top];
    if (editing || e.button > 0 || !card.contains(e.target) || e.target.closest('button')) return;
    drag = { x: e.clientX, y: e.clientY, dx: 0, dy: 0, t: performance.now(), id: e.pointerId };
    card.classList.remove('is-nudging');
    try { card.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
    deck.classList.add('is-dragging');
    lastUser = performance.now();
  });
  deck.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const card = cards[top];
    drag.dx = e.clientX - drag.x;
    drag.dy = e.clientY - drag.y;
    card.style.transform = 'translate(' + drag.dx + 'px,' + (drag.dy * 0.25) + 'px) rotate(' + (drag.dx * 0.06) + 'deg)';
    card.style.setProperty('--yes', Math.max(0, Math.min(1, drag.dx / 90)));
    card.style.setProperty('--no', Math.max(0, Math.min(1, -drag.dx / 90)));
    deck.style.setProperty('--lift', Math.min(1, Math.abs(drag.dx) / 160));
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { dx, dy, t } = drag;
    const speed = Math.abs(dx) / Math.max(1, performance.now() - t);
    drag = null;
    lastUser = performance.now();
    if (Math.abs(dx) > 100 || (Math.abs(dx) > 40 && speed > 0.6)) {
      press(dx > 0 ? 'approve' : 'skip');
      swipe(dx > 0 ? 'approve' : 'skip', dy);
      return;
    }
    const card = cards[top];
    deck.classList.remove('is-dragging');
    deck.style.setProperty('--lift', 0);
    card.style.transform = '';
    card.style.removeProperty('--yes');
    card.style.removeProperty('--no');
  };
  deck.addEventListener('pointerup', endDrag);
  deck.addEventListener('pointercancel', endDrag);

  // ---- Buttons, keys and the "why" panel ----
  demo.querySelectorAll('[data-act]').forEach((b) => {
    b.addEventListener('click', () => {
      lastUser = performance.now();
      act(b.dataset.act);
    });
  });
  deck.addEventListener('keydown', (e) => {
    const keys = { ArrowRight: 'approve', ArrowLeft: 'skip', e: 'edit', E: 'edit' };
    if (!keys[e.key] || e.target !== deck) return;
    e.preventDefault();
    lastUser = performance.now();
    press(keys[e.key]);
    act(keys[e.key]);
  });
  deck.addEventListener('click', (e) => {
    const toggle = e.target.closest('.vd-why-btn, .vd-why-close');
    if (!toggle) return;
    lastUser = performance.now();
    const card = cards[top];
    const open = !card.classList.contains('show-why');
    card.classList.toggle('show-why', open);
    card.querySelector('.vd-why-btn').setAttribute('aria-expanded', String(open));
  });

  // ---- Self-running demo while idle and on screen ----
  const script = ['approve', 'approve', 'skip', 'edit', 'approve', 'skip'];
  const runAuto = (delay) => {
    clearTimeout(auto);
    auto = setTimeout(() => {
      if (!inView) return;
      const card = cards[top];
      if (editing || drag || card.classList.contains('show-why') || performance.now() - lastUser < 9000) {
        runAuto(1500);
        return;
      }
      const step = script[autoStep++ % script.length];
      press(step);
      if (step === 'edit') {
        edit();
        runAuto(5200);
        return;
      }
      const sign = step === 'approve' ? 1 : -1;
      card.classList.add('is-nudging');
      card.style.transform = 'translateX(' + (sign * 26) + 'px) rotate(' + (sign * 4) + 'deg)';
      card.style.setProperty(sign > 0 ? '--yes' : '--no', 0.7);
      setTimeout(() => swipe(step), 280);
      runAuto(4200);
    }, delay);
  };

  layout();
  const warm = () => cards.forEach((card) => { const v = videoOf(card); if (!v.poster) v.poster = v.dataset.poster; });
  if ('IntersectionObserver' in window) {
    const near = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { warm(); near.disconnect(); }
    }, { rootMargin: '800px 0px' });
    near.observe(deck);
    new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        inView = e.isIntersecting;
        playTop(false);
        if (inView && !reduce) {
          if (!raf) raf = requestAnimationFrame(progress);
          runAuto(3200);
        } else {
          clearTimeout(auto);
        }
      });
    }, { threshold: 0.35 }).observe(deck);
  } else {
    warm();
  }
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
