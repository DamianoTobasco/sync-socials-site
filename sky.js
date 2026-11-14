/* =========================================================
   Sync Socials — sky
   One sky runs behind the whole site, drawn as a handful of scenes
   that share this engine:

     hero     .hero--sky            open sky: three depths of cloud, an
                                    airliner with a contrail, two flocks
     ambient  (added to <body>)     the same sky, far off and fixed to the
                                    window, behind every other section
     night    [data-sky="night"]    a dark box as a night flight
     stars    [data-sky="stars"]    a dark box with only the stars

   Colour is CSS (sky.css); this file draws what moves. Scenes only run
   while they are on screen, and with reduced motion each paints one
   still frame and stops.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  if (!window.requestAnimationFrame || !document.createElement('canvas').getContext) return;

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = motionQuery.matches;
  var TAU = Math.PI * 2, RAD = Math.PI / 180;
  var HEADER_H = 69;

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, f) { return a + (b - a) * f; }
  function mod(a, n) { return ((a % n) + n) % n; }
  function between(range) { return range[0] + Math.random() * (range[1] - range[0]); }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  /* Seeded generator: cloud shapes and their starting layout are the same
     on every load and every resize. */
  function seeded(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---------- Palettes ----------
     light and dark follow the page theme. ink is night inside the brand's
     dark green boxes, whatever the theme. */
  var PALETTES = {
    light: {
      night: false,
      cloud: { core: [255, 255, 255], shade: [128, 162, 204], shadeTop: 0.1, crease: 0.12, shadeA: 0.62 },
      layerAlpha: [0.8, 0.92, 0.98], frontAlpha: 0.97,
      bird: [34, 46, 62], birdA: 0.68,
      trail: [255, 255, 255], trailA: 0.96,
      plane: {
        top: '#ffffff', belly: '#bfcddd', line: 'rgba(44, 64, 90, .45)',
        wing: '#aebdd0', wingFar: '#c9d5e3', engine: '#8c9fb6', fin: '#2f9d63',
        glass: 'rgba(34, 52, 74, .7)', lights: false
      }
    },
    dark: {
      night: true, star: '#e4ecff', moon: '#e9effc', moonGlow: [150, 178, 255],
      cloud: { core: [98, 116, 156], shade: [5, 9, 20], shadeTop: 0.3, crease: 0.2, shadeA: 0.88 },
      layerAlpha: [0.34, 0.5, 0.64], frontAlpha: 0.72,
      bird: [178, 194, 224], birdA: 0.4,
      trail: [176, 194, 230], trailA: 0.4,
      plane: {
        top: '#d6dfef', belly: '#525f79', line: 'rgba(6, 10, 22, .55)',
        wing: '#6c7994', wingFar: '#4c5872', engine: '#434f66', fin: '#4fbe7a',
        glass: 'rgba(255, 226, 160, .95)', lights: true
      }
    },
    ink: {
      night: true, star: '#e9f5ee', moon: '#eef6f0', moonGlow: [150, 230, 190],
      cloud: { core: [72, 104, 92], shade: [3, 9, 6], shadeTop: 0.3, crease: 0.2, shadeA: 0.9 },
      layerAlpha: [0.36, 0.5, 0.6], frontAlpha: 0.7,
      bird: [178, 214, 196], birdA: 0.4,
      trail: [196, 232, 214], trailA: 0.42,
      plane: {
        top: '#dbe8e1', belly: '#52685d', line: 'rgba(3, 9, 6, .55)',
        wing: '#6d8479', wingFar: '#4b6157', engine: '#40544a', fin: '#4fbe7a',
        glass: 'rgba(255, 226, 160, .95)', lights: true
      }
    }
  };
  function themeName() { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }

  /* ---------- Scene kinds ----------
     Per layer: how many clouds (narrow, wide screens), their width in px,
     where they sit as a fraction of the height (attached scenes), drift in
     px/s, how far the layer shifts with the pointer (par, px), and how far
     the pointer can nudge a cloud aside (push, px).

     lag is the scroll parallax. In a scene that scrolls with the page it is
     how much the layer lags behind the page (far things lag most). In the
     fixed ambient scene it is the fraction of page scroll the layer moves
     by (far things move least). */
  var KINDS = {
    hero: {
      seed: 0, pixels: 5.5e6, alpha: 1,
      layers: [
        { n: [4, 6], w: [150, 250], y: [0.07, 0.6],  v: [3, 6],   par: 8,  lag: 0.26, push: 8 },
        { n: [3, 5], w: [290, 430], y: [0.03, 0.52], v: [7, 11],  par: 18, lag: 0.16, push: 22 },
        { n: [2, 3], w: [540, 780], y: [0.12, 0.66], v: [13, 19], par: 34, lag: 0.07, push: 46 }
      ],
      plane: { size: [0.044, 38, 66], first: 0.8, gap: [3, 8], speed: 1, par: 12, lag: 0.2, alpha: 1 },
      starSpan: 0.72, starArea: 8500, meteorGap: [8, 18], orb: true
    },
    ambient: {
      seed: 11, pixels: 3.2e6, alpha: 0.8, fixed: true,
      layers: [
        { n: [2, 4], w: [200, 320], v: [3, 5],   par: 5,  lag: 0.1,  push: 6 },
        { n: [2, 3], w: [380, 560], v: [6, 9],   par: 12, lag: 0.22, push: 18 },
        { n: [1, 2], w: [640, 860], v: [10, 14], par: 22, lag: 0.38, push: 34 }
      ],
      plane: { size: [0.03, 26, 40], first: 9, gap: [26, 44], speed: 0.72, par: 8, lag: 0.16, alpha: 0.85 },
      flockGap: [10, 20], birdScale: 0.85, birdAlpha: 0.8,
      starSpan: 1, starArea: 17000, starAlpha: 0.7, meteorGap: [14, 28]
    },
    night: {
      seed: 23, pixels: 3e6, alpha: 1, palette: 'ink',
      layers: [
        { n: [2, 3], w: [180, 270], y: [0.42, 0.74], v: [3, 5], par: 5,  lag: 0.03, push: 6 },
        { n: [2, 2], w: [330, 470], y: [0.5, 0.82],  v: [6, 9], par: 10, lag: 0.06, push: 14 }
      ],
      plane: { size: [0.05, 34, 56], first: 1.2, gap: [4, 9], speed: 0.9, par: 7, lag: 0.04, alpha: 1 },
      starSpan: 1, starArea: 5200, meteorGap: [6, 14], orb: true
    },
    stars: {
      seed: 37, pixels: 2.4e6, alpha: 1, palette: 'ink',
      layers: [], plane: null,
      starSpan: 1, starArea: 6200, meteorGap: [10, 22]
    }
  };

  /* ---------- Cloud sprites ----------
     Each cloud is a heap of soft billows lit from the upper right, with a
     flattened, shaded underside. They are drawn once per palette into small
     offscreen canvases and from then on only blitted. */
  var SPRITE_W = 600, SPRITE_H = 260, SPRITE_COUNT = 6, SPRITE_SCALE = 1.25;
  var spriteCache = {};

  function buildCloud(seed, c) {
    var rng = seeded(seed);
    var el = document.createElement('canvas');
    el.width = Math.round(SPRITE_W * SPRITE_SCALE);
    el.height = Math.round(SPRITE_H * SPRITE_SCALE);
    var g = el.getContext('2d');
    g.scale(SPRITE_SCALE, SPRITE_SCALE);
    var w = SPRITE_W, h = SPRITE_H, base = h * 0.78;
    var billows = [], i;

    /* body: an uneven row of overlapping billows, tall in the middle and
       tapering to wisps at both ends */
    var n = 9 + Math.floor(rng() * 3);
    for (i = 0; i < n; i++) {
      var f = (i + (rng() - 0.5) * 0.5) / (n - 1);
      var env = Math.pow(Math.max(0, Math.sin(Math.PI * (0.06 + 0.88 * f))), 0.9);
      var r = h * (0.07 + 0.27 * env * (0.62 + 0.38 * rng()));
      billows.push({ x: w * (0.13 + 0.74 * f), y: base - r * (0.34 + 0.3 * rng()), r: r });
    }
    /* close any gap in the row, working out from the middle, so the ends
       taper instead of breaking off as loose balls */
    var mid = Math.floor(n / 2), reach;
    for (i = mid + 1; i < n; i++) {
      reach = (billows[i - 1].r + billows[i].r) * 0.6;
      if (billows[i].x - billows[i - 1].x > reach) billows[i].x = billows[i - 1].x + reach;
    }
    for (i = mid - 1; i >= 0; i--) {
      reach = (billows[i + 1].r + billows[i].r) * 0.6;
      if (billows[i + 1].x - billows[i].x > reach) billows[i].x = billows[i + 1].x - reach;
    }
    /* crown: a few more heaped on top, off-centre */
    var peak = 0.36 + 0.28 * rng();
    var crown = 3 + Math.floor(rng() * 3);
    for (i = 0; i < crown; i++) {
      billows.push({ x: w * (peak + (rng() - 0.5) * 0.26), y: base - h * (0.3 + 0.2 * rng()), r: h * (0.15 + 0.13 * rng()) });
    }
    /* knuckles: small ones budding off the upper surface of the big ones,
       so the outline is never a row of equal scallops */
    var hosts = billows.filter(function (p) { return p.r > h * 0.13; });
    var knuckles = 7 + Math.floor(rng() * 5);
    for (i = 0; i < knuckles; i++) {
      var host = hosts[Math.floor(rng() * hosts.length)];
      var ang = -Math.PI * (0.12 + 0.76 * rng());
      billows.push({
        x: host.x + Math.cos(ang) * host.r * 0.82,
        y: host.y + Math.sin(ang) * host.r * 0.82,
        r: Math.max(h * 0.045, host.r * (0.3 + 0.22 * rng()))
      });
    }
    billows.forEach(function (p) {
      p.x = clamp(p.x, p.r + 2, w - p.r - 2);
      p.y = Math.max(p.y, p.r + 2);
    });
    billows.sort(function (a, b) { return a.y - b.y; });

    function disc(x, y, r, inner, stops) {
      var gr = g.createRadialGradient(x, y, inner, x, y, r);
      for (var s = 0; s < stops.length; s++) gr.addColorStop(stops[s][0], stops[s][1]);
      g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }

    /* 1. silhouette: solid cores, feathered edges */
    billows.forEach(function (p) {
      disc(p.x, p.y, p.r, p.r * 0.72, [[0, rgba(c.core, 1)], [1, rgba(c.core, 0)]]);
    });

    /* 2. flatten and soften the underside */
    g.globalCompositeOperation = 'destination-out';
    var cut = g.createLinearGradient(0, base - h * 0.05, 0, base + h * 0.13);
    cut.addColorStop(0, 'rgba(0,0,0,0)');
    cut.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = cut;
    g.fillRect(0, base - h * 0.05, w, h);

    /* 3. volume, painted inside the silhouette only: shade the whole cloud
       toward its base, then give each billow, back to front, a lit cap on
       its upper right. The shade survives underneath and in the creases
       between caps, which is what makes it read as heaped rather than flat. */
    g.globalCompositeOperation = 'source-atop';
    var sh = g.createLinearGradient(0, h * 0.16, 0, base + h * 0.05);
    sh.addColorStop(0, rgba(c.shade, c.shadeTop));
    sh.addColorStop(1, rgba(c.shade, c.shadeA));
    g.fillStyle = sh;
    g.fillRect(0, 0, w, h);
    billows.forEach(function (p) {
      disc(p.x - p.r * 0.2, p.y + p.r * 0.55, p.r * 0.9, 0, [[0, rgba(c.shade, c.crease)], [1, rgba(c.shade, 0)]]);
      disc(p.x + p.r * 0.14, p.y - p.r * 0.24, p.r * 0.92, 0, [[0, rgba(c.core, 1)], [0.55, rgba(c.core, 0.9)], [1, rgba(c.core, 0)]]);
    });
    return el;
  }

  function spritesFor(name) {
    if (!spriteCache[name]) {
      var list = [];
      for (var i = 0; i < SPRITE_COUNT; i++) list.push(buildCloud(131 + i * 37, PALETTES[name].cloud));
      spriteCache[name] = list;
    }
    return spriteCache[name];
  }

  /* ---------- Shared input ---------- */
  var mouse = { x: 0, y: 0, active: false };
  var scenes = [], heroScene = null, ambientScene = null;

  /* =========================================================
     Scene
     ========================================================= */
  function Scene(kind, host, canvas, frontHost) {
    this.kind = kind;
    this.cfg = KINDS[kind];
    this.host = host;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.frontHost = frontHost || null;
    this.W = 0; this.H = 0; this.VH = 0; this.dpr = 1; this.k = 1; this.layoutW = 0;
    this.time = 0; this.scroll = 0; this.inView = true;
    /* Whether this scene may send out its own plane and birds. Always true
       except for the far sky; see passTheLead. */
    this.primary = true;
    this.ptr = { x: 0, y: 0, nx: 0, ny: 0, sx: 0, sy: 0, active: false };
    /* On phones the hero copy fills the width, so anything flying behind it
       just reads as specks in the text. There the plane and birds keep to the
       strips of open sky instead: above the copy, and above the product
       shot. Each is [top, bottom] in scene pixels, or null if too thin. */
    this.compact = false; this.skyBand = null; this.lowBand = null;
    this.inner = kind === 'hero' ? host.querySelector('.hero-inner') : null;
    this.note = kind === 'hero' ? host.querySelector('.hero-note') : null;
    this.shot = kind === 'hero' ? host.querySelector('.hero-shot') : null;
    this.clouds = []; this.stars = []; this.flocks = []; this.front = [];
    this.plane = {
      on: false, pass: 0, next: 0, dir: 1, age: 0, dur: 0, speed: 0, ref: 0,
      x: 0, y: 0, x0: 0, y0: 0, x1: 0, y1: 0, ux: 1, uy: 0,
      len: 50, pitch: 0, dist: 0, lastDist: 0, life: 7.5, trail: []
    };
    this.meteor = { on: false, next: 0, x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 0.85 };
    this.wrapRng = seeded(977 + this.cfg.seed);
    this.palName = ''; this.pal = null;
    this.usePalette();
  }
  var S = Scene.prototype;

  S.usePalette = function () {
    var next = this.cfg.palette || themeName();
    if (next === this.palName) return false;
    this.palName = next; this.pal = PALETTES[next];
    return true;
  };

  S.parX = function (par) { return -this.ptr.sx * par; };
  /* Vertical shift of something at a given depth: a little with the pointer,
     and with scroll as described at KINDS. ref is the scroll position when a
     passing thing (plane, flock) set off, for the fixed scene. */
  S.shiftY = function (par, lag, ref) {
    var y = -this.ptr.sy * par * 0.45;
    return this.cfg.fixed ? y - (this.scroll - (ref || 0)) * lag : y + this.scroll * lag;
  };

  /* ---------- Layout ---------- */
  /* offsetTop rather than getBoundingClientRect: the copy animates in with a
     transform, which must not move the bands. */
  S.measure = function () {
    this.compact = this.W <= 640;
    this.skyBand = null; this.lowBand = null;
    if (!this.inner) return;
    var innerTop = this.inner.offsetTop, first = this.inner.firstElementChild;
    var copyTop = first ? innerTop + first.offsetTop : 0;
    if (copyTop - HEADER_H >= 56) this.skyBand = [HEADER_H + 4, copyTop - 6];
    if (this.note && this.shot) {
      var a = innerTop + this.note.offsetTop + this.note.offsetHeight + 8, b = innerTop + this.shot.offsetTop - 8;
      if (b - a >= 20) this.lowBand = [a, b];
    }
  };

  S.flockAltitude = function (far, first) {
    var VH = this.VH;
    if (this.cfg.fixed) return VH * (0.14 + Math.random() * 0.4);
    if (this.compact && this.skyBand) {
      if (far) return this.lowBand ? (this.lowBand[0] + this.lowBand[1]) / 2 : null;
      return lerp(this.skyBand[0], this.skyBand[1], first ? 0.34 : 0.28 + Math.random() * 0.14);
    }
    if (first) return VH * (far ? 0.4 : 0.17);
    return VH * (far ? 0.3 + Math.random() * 0.2 : 0.1 + Math.random() * 0.26);
  };

  S.layout = function () {
    var s = this, c = s.cfg, W = s.W, H = s.H, rng = seeded(4242 + c.seed);
    var wide = W >= 900, hero = s.kind === 'hero';
    s.layoutW = W;
    /* a short hero (no product shot) gets fewer, smaller clouds */
    var room = hero ? clamp(H / 1000, 0.5, 1) : 1;
    s.k = clamp(W / 1280, 0.5, 1.3) * (hero ? clamp(H / 900, 0.7, 1) : 1);

    s.clouds = c.layers.map(function (L) {
      var list = [], n = Math.max(1, Math.round((wide ? L.n[1] : L.n[0]) * room));
      for (var i = 0; i < n; i++) {
        var w = lerp(L.w[0], L.w[1], rng()) * s.k;
        list.push({
          sp: Math.floor(rng() * SPRITE_COUNT),
          w: w, h: w * SPRITE_H / SPRITE_W,
          x: ((i + 0.15 + rng() * 0.7) / n) * (W + w) - w,
          yf: c.fixed ? rng() : lerp(L.y[0], L.y[1], rng()),
          v: lerp(L.v[0], L.v[1], rng()),
          bob: rng() * TAU, ox: 0, oy: 0
        });
      }
      return list;
    });

    s.stars = [];
    var span = H * c.starSpan;
    var count = Math.round(clamp(W * span / c.starArea, 24, 190));
    for (var i = 0; i < count; i++) {
      /* attached scenes thin the stars out toward the bottom */
      var y = (c.fixed ? rng() : Math.pow(rng(), 1.4)) * span;
      s.stars.push({
        x: rng() * W, y: y,
        r: 0.45 + rng() * rng() * 1.25,
        a: (0.3 + rng() * 0.7) * (c.starAlpha || 1) * (c.fixed ? 1 : 1 - 0.8 * Math.pow(y / span, 2)),
        tw: 0.5 + rng() * 1.9, ph: rng() * TAU
      });
    }

    s.flocks = [];
    if (hero) {
      s.flocks.push(s.makeFlock(false, W * 0.9, s.flockAltitude(false, true), -1));
      var farY = s.flockAltitude(true, true);
      if (farY !== null) s.flocks.push(s.makeFlock(true, W * 0.16, farY, 1));
    } else if (c.flockGap && wide) {
      var f = s.makeFlock(false, -80, 0, -1);
      f.wait = s.time + 5;
      s.flocks.push(f);
    }

    var p = s.plane;
    p.on = false; p.trail = []; p.pass = 0;
    /* Behind a page of copy, a plane or a flock needs margins to fly in. On
       narrow screens the far sky is clouds only. */
    p.next = c.plane && (wide || !c.fixed) ? s.time + c.plane.first : Infinity;
    s.meteor.on = false; s.meteor.next = s.time + between(c.meteorGap) * 0.5;
    s.buildFront();
  };

  /* ---------- Clouds ---------- */
  /* Where a cloud's top edge is, before the pointer has any say. In the
     fixed scene the clouds live on a strip one and a half windows tall that
     scrolls past at the layer's own rate and wraps, so they come round again
     out of sight below. */
  S.cloudY = function (c, L) {
    if (this.cfg.fixed) {
      var field = this.H * 1.5 + c.h;
      return mod(c.yf * field - this.scroll * L.lag, field) - c.h;
    }
    return c.yf * this.H + this.scroll * L.lag;
  };

  S.stepClouds = function (dt) {
    var s = this, ptr = s.ptr, ease = Math.min(1, dt * 3);
    for (var li = 0; li < s.clouds.length; li++) {
      var L = s.cfg.layers[li], list = s.clouds[li];
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        c.x += c.v * s.k * dt;
        if (c.x > s.W + 30) {
          c.x = -c.w - s.wrapRng() * s.W * 0.2;
          c.yf = s.cfg.fixed ? s.wrapRng() : lerp(L.y[0], L.y[1], s.wrapRng());
          c.sp = Math.floor(s.wrapRng() * SPRITE_COUNT);
        }
        var tx = 0, ty = 0;
        if (ptr.active) {
          var dx = c.x + c.w / 2 - ptr.x, dy = s.cloudY(c, L) + c.h / 2 - ptr.y;
          var d = Math.sqrt(dx * dx + dy * dy) || 1, R = 120 + c.w * 0.45;
          if (d < R) {
            var f = 1 - d / R; f *= f;
            tx = dx / d * L.push * f; ty = dy / d * L.push * 0.6 * f;
          }
        }
        c.ox += (tx - c.ox) * ease; c.oy += (ty - c.oy) * ease;
      }
    }
  };

  S.drawClouds = function (li) {
    var s = this, ctx = s.ctx, L = s.cfg.layers[li], list = s.clouds[li], sp = spritesFor(s.palName);
    var ox = s.parX(L.par), oy = -s.ptr.sy * L.par * 0.45;
    ctx.globalAlpha = s.pal.layerAlpha[li] * s.cfg.alpha;
    for (var i = 0; i < list.length; i++) {
      var c = list[i], y = s.cloudY(c, L) + Math.sin(s.time * 0.2 + c.bob) * 3 + c.oy + oy;
      if (y > s.H || y < -c.h) continue;
      ctx.drawImage(sp[c.sp], c.x + c.ox + ox, y, c.w, c.h);
    }
    ctx.globalAlpha = 1;
  };

  /* Two clouds parked at the bottom corners of the hero, in front of the
     product shot. They sway in place rather than drift so they never cover
     the UI. */
  S.buildFront = function () {
    var s = this;
    if (!s.frontHost) return;
    s.frontHost.textContent = '';
    s.front = [];
    var sp = spritesFor(s.palName), W = s.W;
    [
      { sprite: 1, w: clamp(W * 0.42, 280, 640), ax: s.compact ? -0.4 : -0.17, drop: 0.76, sway: s.compact ? 12 : 24, ph: 0.4 },
      { sprite: 4, w: clamp(W * 0.48, 300, 720), ax: s.compact ? 0.72 : 0.745, drop: 0.82, sway: s.compact ? 14 : 30, ph: 2.6 }
    ].forEach(function (d) {
      var el = document.createElement('canvas');
      el.width = sp[d.sprite].width; el.height = sp[d.sprite].height;
      el.getContext('2d').drawImage(sp[d.sprite], 0, 0);
      var h = d.w * SPRITE_H / SPRITE_W;
      el.style.width = d.w + 'px';
      el.style.height = h + 'px';
      el.style.opacity = s.pal.frontAlpha;
      s.frontHost.appendChild(el);
      s.front.push({ el: el, x: W * d.ax, h: h, drop: d.drop, sway: d.sway, ph: d.ph });
    });
  };

  S.placeFront = function () {
    var s = this;
    for (var i = 0; i < s.front.length; i++) {
      var c = s.front[i];
      var x = c.x + Math.sin(s.time * 0.11 + c.ph) * c.sway - s.ptr.sx * 42;
      var y = s.H - c.h * c.drop + Math.sin(s.time * 0.17 + c.ph * 2) * 5 - s.ptr.sy * 14 - s.scroll * 0.14;
      c.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    }
  };

  /* ---------- Night sky ---------- */
  S.drawStars = function () {
    var s = this, ctx = s.ctx, ox = s.parX(3), oy = -s.ptr.sy * 1.4;
    var drift = s.cfg.fixed ? -s.scroll * 0.04 : s.scroll * 0.3;
    ctx.fillStyle = s.pal.star;
    for (var i = 0; i < s.stars.length; i++) {
      var st = s.stars[i], y = s.cfg.fixed ? mod(st.y + drift, s.H) : st.y + drift;
      ctx.globalAlpha = st.a * (0.62 + 0.38 * Math.sin(s.time * st.tw + st.ph));
      ctx.beginPath(); ctx.arc(st.x + ox, y + oy, st.r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  S.stepMeteor = function (dt) {
    var s = this, m = s.meteor;
    if (!s.pal.night) return;
    if (!m.on) {
      if (s.time < m.next) return;
      var dir = Math.random() < 0.5 ? -1 : 1, top = Math.min(s.VH, s.H);
      m.x = s.W * (0.2 + 0.6 * Math.random());
      m.y = top * (0.05 + 0.2 * Math.random());
      m.vx = dir * (420 + Math.random() * 200);
      m.vy = 150 + Math.random() * 90;
      m.age = 0; m.on = true;
      return;
    }
    m.age += dt;
    m.x += m.vx * dt; m.y += m.vy * dt;
    if (m.age > m.life) { m.on = false; m.next = s.time + between(s.cfg.meteorGap); }
  };

  S.drawMeteor = function () {
    var s = this, m = s.meteor, ctx = s.ctx;
    if (!m.on) return;
    var a = Math.sin(Math.PI * m.age / m.life);
    var tx = m.x - m.vx * 0.17, ty = m.y - m.vy * 0.17;
    var g = ctx.createLinearGradient(m.x, m.y, tx, ty);
    g.addColorStop(0, 'rgba(236,242,255,' + (0.9 * a) + ')');
    g.addColorStop(1, 'rgba(236,242,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
  };

  S.glow = function (x, y, r, color, a) {
    var ctx = this.ctx, g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a));
    g.addColorStop(0.25, rgba(color, a * 0.5));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  };

  /* Sun by day, crescent moon by night. Wide layouts only: on a phone the
     copy owns that space. */
  S.drawOrb = function () {
    var s = this, ctx = s.ctx, hero = s.kind === 'hero';
    if (s.W < (hero ? 900 : 720)) return;
    var size = hero ? 1 : 0.74;
    var x = s.W * (hero ? 0.868 : 0.905) + s.parX(4);
    var y = (hero ? 108 : 60) + s.shiftY(4, hero ? 0.3 : 0.02);
    if (s.pal.night) {
      s.glow(x, y, 130 * size, s.pal.moonGlow, 0.2);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 40, y - 40, 80, 80);
      ctx.arc(x - 7.5 * size, y - 4.5 * size, 15 * size, 0, TAU, true);
      ctx.clip('evenodd');
      ctx.fillStyle = s.pal.moon;
      ctx.beginPath(); ctx.arc(x, y, 17 * size, 0, TAU); ctx.fill();
      ctx.restore();
    } else {
      s.glow(x, y, 200, [255, 244, 206], 0.8);
      ctx.fillStyle = '#fffdf1';
      ctx.beginPath(); ctx.arc(x, y, 23, 0, TAU); ctx.fill();
    }
  };

  /* ---------- Airliner ---------- */
  S.launchPlane = function () {
    var s = this, p = s.plane, pc = s.cfg.plane, W = s.W, VH = s.VH;
    p.len = clamp(W * pc.size[0], pc.size[1], pc.size[2]);
    p.dir = p.pass % 2 === 0 ? 1 : -1;
    var first = p.pass === 0;
    p.pass++;
    var margin = p.len * 1.3, span = W + margin * 2, climb, y0;
    if (s.kind === 'night') {
      /* the strip of sky above the box's copy, under the moon */
      y0 = 46 + Math.random() * 18;
      climb = Math.min(y0 - 20, Math.tan(4 * RAD) * span);
    } else if (s.cfg.fixed) {
      climb = Math.min(VH * 0.1, Math.tan(5 * RAD) * span);
      y0 = VH * (0.2 + Math.random() * 0.2);
    } else {
      climb = Math.min(VH * 0.16, Math.tan(8 * RAD) * span);
      y0 = VH * (first ? 0.33 : 0.24 + Math.random() * 0.16);
      if (s.compact && s.skyBand) {
        y0 = s.skyBand[1] - p.len * 0.36;
        climb = Math.max(0, Math.min(climb, y0 - s.skyBand[0] - p.len * 0.9));
      }
    }
    p.x0 = p.dir > 0 ? -margin : W + margin;
    p.x1 = p.dir > 0 ? W + margin : -margin;
    p.y0 = y0; p.y1 = y0 - climb;
    var dist = Math.sqrt(span * span + climb * climb);
    p.ux = (p.x1 - p.x0) / dist; p.uy = (p.y1 - p.y0) / dist;
    p.pitch = Math.atan2(climb, span);
    p.speed = clamp(W / 13, 62, 125) * pc.speed;
    p.dur = dist / p.speed;
    p.age = 0; p.dist = 0; p.lastDist = -99; p.ref = s.scroll;
    p.trail = []; p.on = true;
  };

  S.stepPlane = function (dt) {
    var s = this, p = s.plane;
    while (p.trail.length && s.time - p.trail[0].born > p.life) p.trail.shift();
    if (!p.on) {
      if (s.time >= p.next && !p.trail.length && s.primary) s.launchPlane();
      return;
    }
    p.age += dt;
    var f = p.age / p.dur;
    p.x = lerp(p.x0, p.x1, f);
    p.y = lerp(p.y0, p.y1, f) + Math.sin(p.age * 0.7) * (s.compact ? 1.2 : 2.5);
    p.dist = p.age * p.speed;
    if (p.dist - p.lastDist >= 6) {
      p.lastDist = p.dist;
      p.trail.push({
        x: p.x - p.ux * p.len * 0.54,
        y: p.y - p.uy * p.len * 0.54 + p.len * 0.03,
        born: s.time,
        /* slow, smooth dispersal so the old end of the trail goes wavy */
        vy: 1.3 * Math.sin(p.dist * 0.021) + 0.8 * Math.sin(p.dist * 0.053 + 1.7)
      });
    }
    if (f >= 1) { p.on = false; p.next = s.time + between(s.cfg.plane.gap); }
  };

  S.trailAlpha = function (age) {
    var p = this.plane;
    return this.pal.trailA * clamp(age / 0.3, 0, 1) * Math.pow(clamp(1 - age / p.life, 0, 1), 1.35);
  };

  S.trailRibbon = function (ox, oy, spread) {
    var s = this, ctx = s.ctx, p = s.plane, pts = p.trail;
    var nx = -p.uy, ny = p.ux, i, pt, age, hw;
    ctx.beginPath();
    for (i = pts.length - 1; i >= 0; i--) {
      pt = pts[i]; age = s.time - pt.born;
      hw = p.len * (0.016 + 0.07 * Math.pow(age / p.life, 0.8)) * spread;
      ctx.lineTo(pt.x + ox + nx * hw, pt.y + pt.vy * age + oy + ny * hw);
    }
    for (i = 0; i < pts.length; i++) {
      pt = pts[i]; age = s.time - pt.born;
      hw = p.len * (0.016 + 0.07 * Math.pow(age / p.life, 0.8)) * spread;
      ctx.lineTo(pt.x + ox - nx * hw, pt.y + pt.vy * age + oy - ny * hw);
    }
    ctx.closePath();
  };

  S.drawTrail = function () {
    var s = this, ctx = s.ctx, p = s.plane, pc = s.cfg.plane, pts = p.trail, n = pts.length;
    if (n < 2) return;
    var ox = s.parX(pc.par), oy = s.shiftY(pc.par, pc.lag, p.ref);
    var head = pts[n - 1], tail = pts[0];
    var a0 = s.time - head.born, a1 = s.time - tail.born;
    var g = ctx.createLinearGradient(head.x + ox, head.y + oy, tail.x + ox, tail.y + oy);
    for (var i = 0; i <= 8; i++) g.addColorStop(i / 8, rgba(s.pal.trail, s.trailAlpha(lerp(a0, a1, i / 8)).toFixed(3)));
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.3 * pc.alpha; s.trailRibbon(ox, oy, 2.6); ctx.fill();
    ctx.globalAlpha = pc.alpha; s.trailRibbon(ox, oy, 1); ctx.fill();
    ctx.globalAlpha = 1;
  };

  S.poly = function (points) {
    var ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (var i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
  };

  /* Side view, nose to +x, drawn in a 100-unit-long box and scaled. */
  S.drawPlane = function () {
    var s = this, ctx = s.ctx, p = s.plane, pc = s.cfg.plane;
    if (!p.on) return;
    var c = s.pal.plane, sc = p.len / 100;
    ctx.save();
    ctx.globalAlpha = pc.alpha;
    ctx.translate(p.x + s.parX(pc.par), p.y + s.shiftY(pc.par, pc.lag, p.ref));
    if (p.dir < 0) ctx.scale(-1, 1);
    ctx.rotate(-p.pitch);
    ctx.scale(sc, sc);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 0.9 / sc;
    ctx.strokeStyle = c.line;

    /* far wing, peeking over the fuselage */
    ctx.fillStyle = c.wingFar;
    s.poly([[7, -4], [-9, -13], [-16, -13], [-8, -4]]); ctx.fill(); ctx.stroke();

    /* tail fin, in brand green */
    ctx.fillStyle = c.fin;
    s.poly([[-28, -5.5], [-41.5, -22], [-49.5, -22], [-45.5, -4]]); ctx.fill(); ctx.stroke();

    /* fuselage */
    var body = ctx.createLinearGradient(0, -6, 0, 6);
    body.addColorStop(0, c.top); body.addColorStop(0.45, c.top); body.addColorStop(1, c.belly);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(50, 1);
    ctx.quadraticCurveTo(46, -5.6, 34, -6);
    ctx.lineTo(-30, -6);
    ctx.quadraticCurveTo(-44, -5.2, -51, -2.8);
    ctx.lineTo(-51, -0.6);
    ctx.quadraticCurveTo(-40, 4.6, -24, 5.6);
    ctx.lineTo(36, 5.6);
    ctx.quadraticCurveTo(47.5, 5, 50, 1);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    /* cabin windows and cockpit */
    ctx.save();
    ctx.strokeStyle = c.glass; ctx.lineWidth = 1.3; ctx.setLineDash([1.5, 2.3]);
    ctx.beginPath(); ctx.moveTo(-25, -2.1); ctx.lineTo(33, -2.1); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = c.glass;
    s.poly([[38.5, -4.7], [44.6, -2.6], [40.4, -2.1], [36.6, -3]]); ctx.fill();

    /* tailplane */
    ctx.fillStyle = c.wing;
    s.poly([[-36, -2.2], [-51, -5.6], [-55, -5.6], [-46, -1]]); ctx.fill(); ctx.stroke();

    /* engine, then the near wing over it */
    ctx.fillStyle = c.engine;
    ctx.beginPath();
    ctx.moveTo(6, 6.6); ctx.lineTo(-4, 6.4);
    ctx.quadraticCurveTo(-7, 8.8, -4, 11.2);
    ctx.lineTo(6, 11); ctx.quadraticCurveTo(8, 8.8, 6, 6.6);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = c.wing;
    s.poly([[11, 1.6], [-13, 15.5], [-21, 15.5], [-7, 2.4]]); ctx.fill(); ctx.stroke();

    if (c.lights) {
      ctx.globalCompositeOperation = 'lighter';
      /* we see the starboard side heading right (green), port heading left (red) */
      s.glow(-17, 15.5, 9, p.dir > 0 ? [70, 255, 140] : [255, 70, 70], 0.95);
      var strobe = s.time % 1.4;
      if (strobe < 0.07 || (strobe > 0.17 && strobe < 0.24)) s.glow(-51, -3, 17, [255, 255, 255], 1);
      if ((s.time + 0.55) % 1.1 < 0.13) s.glow(2, 6.5, 12, [255, 60, 60], 0.95);
    }
    ctx.restore();
  };

  /* ---------- Birds ----------
     Each flock flies a loose V. Every bird is on a damped spring around
     its slot in the formation, so the pointer can scatter them and they
     drift back into line. */
  S.makeFlock = function (far, x, y, dir) {
    var s = this, W = s.W, fixed = !!s.cfg.fixed;
    var count = far ? 3 : (W >= 900 ? 7 : 5);
    var scale = clamp(W / 1280, 0.82, 1.12) * (s.cfg.birdScale || 1);
    var f = {
      far: far, dir: dir, x: x, baseY: y, y: y, ref: s.scroll,
      speed: (far ? 15 : 27) * clamp(W / 1280, 0.7, 1.1),
      size: (far ? 4.6 : 7.6) * scale,
      par: far ? 6 : 15, lag: fixed ? 0.3 : (far ? 0.24 : 0.18),
      /* vertical spread of the V, and how far the whole flock rises and falls */
      vee: s.compact ? 0.4 : 0.66, sway: s.compact ? 3 : s.VH * 0.018,
      ph: Math.random() * TAU, wait: 0, birds: []
    };
    for (var i = 0; i < count; i++) {
      f.birds.push({
        rank: Math.ceil(i / 2), side: i === 0 ? 0 : (i % 2 ? 1 : -1),
        jx: (Math.random() - 0.5) * 0.5, jy: (Math.random() - 0.5) * 0.5,
        flap: Math.random() * TAU, rate: 9 + Math.random() * 2.5,
        ox: 0, oy: 0, vx: 0, vy: 0, hurry: 0, x: x, y: y, wing: 0
      });
    }
    return f;
  };

  S.stepFlock = function (f, dt) {
    var s = this, ptr = s.ptr, W = s.W;
    if (f.wait) {
      if (s.time < f.wait || !s.primary) return;
      f.wait = 0;
      f.dir = -f.dir;
      f.x = f.dir > 0 ? -30 : W + 30;
      f.ref = s.scroll;
      var alt = s.flockAltitude(f.far, false);
      f.baseY = alt === null ? f.baseY : alt;
    }
    f.x += f.dir * f.speed * dt;
    f.y = f.baseY + Math.sin(s.time * 0.22 + f.ph) * f.sway;
    var gap = f.size * 3.1, allOut = true;
    var px = s.parX(f.par), py = s.shiftY(f.par, f.lag, f.ref);
    for (var i = 0; i < f.birds.length; i++) {
      var b = f.birds[i];
      var tx = f.x - f.dir * (b.rank + b.jx) * gap * 1.2;
      var ty = f.y + (b.side * b.rank + b.jy) * gap * f.vee + Math.sin(s.time * 0.8 + b.flap) * f.size * 0.25;
      var fx = 0, fy = 0;
      if (ptr.active) {
        var dx = tx + b.ox + px - ptr.x, dy = ty + b.oy + py - ptr.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d < 120) { var push = (1 - d / 120) * 1500; fx = dx / d * push; fy = dy / d * push; }
      }
      b.vx += (fx - b.ox * 9 - b.vx * 4.2) * dt;
      b.vy += (fy - b.oy * 9 - b.vy * 4.2) * dt;
      b.ox += b.vx * dt; b.oy += b.vy * dt;
      var agitation = Math.min(1, (Math.abs(b.vx) + Math.abs(b.vy)) / 60);
      b.hurry += (agitation - b.hurry) * Math.min(1, dt * 5);
      b.flap += dt * b.rate * (1 + b.hurry * 1.6);
      /* calm birds drop into a glide now and then; startled ones flap hard */
      var glide = clamp(0.62 + 0.5 * Math.sin(s.time * 0.31 + b.rate * 3), 0.12, 1);
      b.wing = Math.sin(b.flap) * lerp(glide, 1, b.hurry) + 0.12;
      b.x = tx + b.ox; b.y = ty + b.oy;
      if (f.dir > 0 ? b.x < W + 40 : b.x > -40) allOut = false;
    }
    if (allOut) f.wait = s.time + (s.cfg.flockGap ? between(s.cfg.flockGap) : 4 + Math.random() * 6);
  };

  S.drawFlock = function (f) {
    if (f.wait) return;
    var s = this, ctx = s.ctx, sz = f.size;
    var ox = s.parX(f.par), oy = s.shiftY(f.par, f.lag, f.ref);
    var lean = -f.dir * sz * 0.14;
    ctx.strokeStyle = rgba(s.pal.bird, s.pal.birdA * (f.far ? 0.62 : 1) * (s.cfg.birdAlpha || 1));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1, sz * 0.2);
    ctx.beginPath();
    for (var i = 0; i < f.birds.length; i++) {
      var b = f.birds[i], x = b.x + ox, y = b.y + oy;
      var tipY = y - sz * 0.62 * b.wing, ctrlY = y - sz * (0.3 + 0.34 * b.wing);
      ctx.moveTo(x - sz + lean, tipY);
      ctx.quadraticCurveTo(x - sz * 0.48, ctrlY, x, y);
      ctx.quadraticCurveTo(x + sz * 0.48, ctrlY, x + sz + lean, tipY);
    }
    ctx.stroke();
  };

  /* ---------- Frame ---------- */
  /* Where the scene is on screen right now: its scroll measure, and the
     pointer in its own coordinates. */
  S.track = function () {
    var s = this, r = s.canvas.getBoundingClientRect(), vh = window.innerHeight || s.H, p = s.ptr;
    if (reduce) s.scroll = 0;
    else if (s.cfg.fixed) s.scroll = window.pageYOffset || 0;
    else if (s.kind === 'hero') s.scroll = clamp(-r.top, 0, s.H);
    else s.scroll = clamp(vh / 2 - (r.top + s.H / 2), -vh, vh);
    var x = mouse.x - r.left, y = mouse.y - r.top;
    p.active = !reduce && mouse.active && x >= 0 && x <= s.W && y >= 0 && y <= s.H;
    if (p.active) {
      p.x = x; p.y = y;
      p.nx = clamp(x / s.W * 2 - 1, -1, 1);
      p.ny = clamp(mouse.y / vh * 2 - 1, -1, 1);
    }
  };

  S.step = function (dt) {
    var s = this, p = s.ptr, ease = Math.min(1, dt * 4);
    s.time += dt;
    p.sx += ((p.active ? p.nx : 0) - p.sx) * ease;
    p.sy += ((p.active ? p.ny : 0) - p.sy) * ease;
    s.stepClouds(dt);
    if (s.cfg.plane) s.stepPlane(dt);
    s.stepMeteor(dt);
    for (var i = 0; i < s.flocks.length; i++) s.stepFlock(s.flocks[i], dt);
  };

  S.draw = function () {
    var s = this, n = s.clouds.length;
    s.ctx.clearRect(0, 0, s.W, s.H);
    if (s.pal.night) { s.drawStars(); s.drawMeteor(); }
    if (s.cfg.orb) s.drawOrb();
    if (n) s.drawClouds(0);
    if (s.flocks[1]) s.drawFlock(s.flocks[1]);
    if (s.cfg.plane) { s.drawTrail(); s.drawPlane(); }
    if (s.flocks[0]) s.drawFlock(s.flocks[0]);
    for (var i = 1; i < n; i++) s.drawClouds(i);
    s.placeFront();
  };

  /* Reduced motion: run the scene forward off-screen to a moment with the
     plane mid-sky, paint that once, and stop. The ambient sky is painted as
     it starts, with nothing passing. */
  S.still = function () {
    var s = this;
    s.track();
    s.layout();
    if (!s.cfg.fixed && s.cfg.plane) for (var i = 0; i < 200; i++) s.step(1 / 30);
    s.draw();
  };

  S.resize = function () {
    var s = this;
    var w = Math.round(s.canvas.clientWidth), h = Math.round(s.canvas.clientHeight);
    if (!w || !h) return;
    var widthChanged = Math.abs(w - s.W) > 2;
    s.W = w; s.H = h;
    s.VH = Math.min(h, window.innerHeight || h);
    s.measure();
    /* keep the backing store inside the scene's pixel budget however large it is */
    s.dpr = clamp(Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(s.cfg.pixels / (w * h))), 1, 2);
    s.canvas.width = Math.round(w * s.dpr);
    s.canvas.height = Math.round(h * s.dpr);
    s.ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    if (reduce) { s.still(); return; }
    s.track();
    /* A scrollbar appearing or a few pixels of drag should not restart the
       flight; only a real change of width re-seeds the scene. */
    if (!s.layoutW || Math.abs(w - s.layoutW) > Math.max(60, s.layoutW * 0.08)) s.layout();
    else if (widthChanged) s.buildFront();
    s.draw();
  };

  /* =========================================================
     Page
     ========================================================= */
  var raf = 0, last = 0;

  /* The far sky only flies its own plane and birds while no nearer scene
     (the hero, a night box) is showing its own, so there is never two of
     anything. On a page with no sky hero (guides, help, legal) things only
     pass while the reader is still at the title; further down it is a page
     for reading, and the sky keeps to clouds. */
  function passTheLead() {
    var amb = ambientScene, vh = window.innerHeight || 0, i, s;
    if (!amb) return;
    var lead = !!heroScene || (window.pageYOffset || 0) < vh * 0.5;
    for (i = 0; i < scenes.length; i++) {
      s = scenes[i];
      if (s === amb || !s.cfg.plane || !s.W) continue;
      if (s === heroScene ? s.canvas.getBoundingClientRect().bottom >= vh * 0.4 : s.inView) lead = false;
    }
    if (lead && !amb.primary) {
      /* give it a beat before anything sets off */
      amb.plane.next = Math.max(amb.plane.next, amb.time + 3);
      for (i = 0; i < amb.flocks.length; i++) {
        if (amb.flocks[i].wait) amb.flocks[i].wait = Math.max(amb.flocks[i].wait, amb.time + 1.2);
      }
    }
    amb.primary = lead;
  }

  function frame(now) {
    raf = 0;
    var dt = clamp((now - last) / 1000, 0, 0.05), any = false, i, s;
    last = now;
    passTheLead();
    for (i = 0; i < scenes.length; i++) {
      s = scenes[i];
      if (!s.inView || !s.W) continue;
      s.track(); s.step(dt); s.draw();
      any = true;
    }
    if (any) wake();
  }

  function wake() {
    if (raf || reduce) return;
    if (!last) last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function sleep() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0; last = 0;
  }

  /* Time of day follows the page: morning blue at the top, clear midday
     through the middle, golden hour by the foot. The blue is faded out
     before the gold comes in, because the two mixed make grey. sky.css
     applies --sky-air and --sky-dusk to the two washes. */
  var duskQueued = false, airNow = -1, duskNow = -1;
  function ramp(p, from, to) {
    var t = clamp((p - from) / (to - from), 0, 1);
    return t * t * (3 - 2 * t);
  }
  function paintDusk() {
    duskQueued = false;
    if (!ambientScene) return;
    var range = Math.max(1, root.scrollHeight - (window.innerHeight || 0));
    var p = (window.pageYOffset || 0) / range;
    var air = 1 - 0.85 * ramp(p, 0.36, 0.66), dusk = ramp(p, 0.7, 0.96);
    if (Math.abs(air - airNow) < 0.004 && Math.abs(dusk - duskNow) < 0.004) return;
    airNow = air; duskNow = dusk;
    ambientScene.host.style.setProperty('--sky-air', air.toFixed(3));
    ambientScene.host.style.setProperty('--sky-dusk', dusk.toFixed(3));
  }
  function queueDusk() {
    if (duskQueued) return;
    duskQueued = true;
    requestAnimationFrame(paintDusk);
  }

  function make(tag, className) {
    var el = document.createElement(tag);
    el.className = className;
    el.setAttribute('aria-hidden', 'true');
    return el;
  }

  function mount() {
    var hero = document.querySelector('.hero--sky'), canvas, i;
    if (hero) {
      canvas = make('canvas', 'sky-canvas');
      hero.insertBefore(canvas, hero.firstChild);
      var frontHost = null;
      if (hero.querySelector('.hero-shot')) {
        frontHost = make('div', 'hero-sky__front');
        hero.appendChild(frontHost);
      }
      heroScene = new Scene('hero', hero, canvas, frontHost);
      scenes.push(heroScene);
    }

    var marked = document.querySelectorAll('[data-sky]');
    for (i = 0; i < marked.length; i++) {
      var kind = marked[i].getAttribute('data-sky');
      if (kind !== 'night' && kind !== 'stars') continue;
      canvas = make('canvas', 'sky-canvas sky-canvas--' + kind);
      marked[i].insertBefore(canvas, marked[i].firstChild);
      scenes.push(new Scene(kind, marked[i], canvas));
    }

    if (root.getAttribute('data-sky-ambient') !== 'off' && document.body) {
      var host = make('div', 'sky-ambient');
      canvas = make('canvas', 'sky-canvas');
      host.appendChild(canvas);
      document.body.insertBefore(host, document.body.firstChild);
      ambientScene = new Scene('ambient', host, canvas);
      ambientScene.primary = !heroScene;
      scenes.push(ambientScene);
    }
    /* sky.css keys the see-through section backgrounds off this */
    if (scenes.length) root.classList.add('sky-on');
  }

  function start() {
    mount();
    if (!scenes.length) return;

    var hasRO = 'ResizeObserver' in window;
    var ro = hasRO ? new ResizeObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        for (var j = 0; j < scenes.length; j++) if (scenes[j].canvas === entries[i].target) scenes[j].resize();
      }
    }) : null;
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        for (var j = 0; j < scenes.length; j++) if (scenes[j].canvas === entries[i].target) scenes[j].inView = entries[i].isIntersecting;
      }
      wake();
    }, { rootMargin: '80px 0px' }) : null;

    scenes.forEach(function (s) {
      s.resize();
      if (ro) ro.observe(s.canvas);
      if (io && !s.cfg.fixed) io.observe(s.canvas);
    });
    window.addEventListener('resize', function () {
      scenes.forEach(function (s) { s.resize(); });
      queueDusk();
    }, { passive: true });

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    }, { passive: true });
    var pointerGone = function () { mouse.active = false; };
    root.addEventListener('pointerleave', pointerGone);
    window.addEventListener('blur', pointerGone);

    window.addEventListener('scroll', queueDusk, { passive: true });
    queueDusk();

    new MutationObserver(function () {
      scenes.forEach(function (s) {
        if (!s.usePalette() || !s.W) return;
        s.buildFront();
        if (reduce) s.still(); else s.draw();
      });
    }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    var onMotionChange = function () {
      reduce = motionQuery.matches;
      sleep();
      scenes.forEach(function (s) { if (reduce) s.still(); else s.layout(); });
      wake();
    };
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);
    else if (motionQuery.addListener) motionQuery.addListener(onMotionChange);

    wake();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
