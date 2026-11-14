/* =========================================================
   Sync Socials — content machine (homepage)
   The Content Studio section has two panels. This file runs the switch
   between them, and the "Templates" panel: a live preview of the app's
   video templates, drawn by the app's own engine
   (content-machine-engine.js, built by tools/build-content-machine.mjs).

   A visitor picks a template, types their business name and chooses a
   colour, and the video rebrands as they go. The engine and its fonts
   are only fetched once the section is near the screen.
   ========================================================= */
(function () {
  'use strict';

  var machine = document.querySelector('[data-content-machine]');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.studio-mode'));
  if (!machine || !tabs.length) return;

  var ENGINE_SRC = 'content-machine-engine.js?v=1';
  var FONT_DIR = 'assets/fonts/content-machine/';
  var FONTS = [
    ['Sync Template Sans', 'inter', [300, 500, 700, 900]],
    ['Sync Template Mono', 'jetbrains-mono', [500, 700]]
  ];
  var FPS = 30;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var canvas = machine.querySelector('[data-cm="canvas"]');
  var ctx = canvas && canvas.getContext && canvas.getContext('2d');
  var playButton = machine.querySelector('[data-cm="play"]');
  var segmentsHost = machine.querySelector('[data-cm="segments"]');
  var fitLabel = machine.querySelector('[data-cm="fit"]');
  var nameInput = machine.querySelector('.cm-brand__input');
  var templateButtons = Array.prototype.slice.call(machine.querySelectorAll('.cm-tpl'));
  var swatches = Array.prototype.slice.call(machine.querySelectorAll('.cm-swatch'));

  var engine = null;
  var state = { index: 0, name: '', accent: '', playing: !reduceMotion.matches, time: 0, visible: false };
  var spec = null, timeline = null, segments = [], fills = [];
  var raf = 0, last = 0, drawnFrame = -1;

  /* ---------- The two panels ---------- */
  function selectMode(tab, focus) {
    tabs.forEach(function (other) {
      var on = other === tab;
      var panel = document.getElementById(other.getAttribute('aria-controls'));
      other.classList.toggle('is-active', on);
      other.setAttribute('aria-selected', String(on));
      other.tabIndex = on ? 0 : -1;
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
    /* coming back to the templates, the canvas has a size again */
    if (!machine.hidden) { paint(true); run(); }
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { selectMode(tab, false); });
    tab.addEventListener('keydown', function (event) {
      var step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      selectMode(tabs[(index + step + tabs.length) % tabs.length], true);
    });
  });

  if (!ctx) return;

  /* ---------- The spec: a template's sample, rebranded ---------- */
  /* The same clean-up the app applies: no emoji (the video fonts have none),
     no asterisks (they mark emphasis in captions), single spaces. */
  function cleanName(value) {
    var text = String(value).replace(/\*/g, ' ');
    try { text = text.replace(new RegExp('[\\p{Extended_Pictographic}\\uFE0F\\u200D]', 'gu'), ''); } catch (error) { /* older browsers keep the text as typed */ }
    return text.replace(/\s+/g, ' ').trim().slice(0, 28);
  }

  /* The samples mention their business by name inside captions and labels,
     not only in the brand field, so swap it everywhere it appears. */
  function swapName(value, from, to) {
    if (typeof value === 'string') {
      return value.split(from).join(to).split(from.toUpperCase()).join(to.toUpperCase());
    }
    if (Array.isArray(value)) return value.map(function (item) { return swapName(item, from, to); });
    if (value && typeof value === 'object') {
      var out = {};
      Object.keys(value).forEach(function (key) { out[key] = swapName(value[key], from, to); });
      return out;
    }
    return value;
  }

  function buildSpec() {
    var template = engine.templates[state.index];
    var next = JSON.parse(JSON.stringify(template.sample));
    if (state.name) {
      next = swapName(next, template.sample.brand.name, state.name);
      next.brand.name = state.name;
      var handle = state.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (handle) next.brand.handle = '@' + handle; else delete next.brand.handle;
    }
    if (state.accent) next.brand.accent = state.accent;
    spec = next;
    timeline = engine.timeline(spec);
    segments = timeline.beats.map(function (beat) { return { start: beat.start, end: beat.end }; });
    segments.push({ start: timeline.outroStart, end: timeline.duration });
  }

  function buildSegments() {
    segmentsHost.textContent = '';
    fills = segments.map(function (segment) {
      var button = document.createElement('button');
      var fill = document.createElement('span');
      button.type = 'button';
      button.className = 'cm-segment';
      button.tabIndex = -1;
      button.style.flexGrow = String(segment.end - segment.start);
      button.appendChild(fill);
      button.addEventListener('click', function () {
        state.time = segment.start + 0.02;
        paint(true);
      });
      segmentsHost.appendChild(button);
      return fill;
    });
  }

  /* ---------- Drawing ---------- */
  function paint(force) {
    if (!engine || !spec) return;
    var width = Math.round(canvas.clientWidth * Math.min(2, window.devicePixelRatio || 1));
    if (!width) return;
    var frame = Math.floor(state.time * FPS);
    if (!force && frame === drawnFrame && width === canvas.width) return;
    if (width !== canvas.width) {
      canvas.width = width;
      canvas.height = Math.round(width * 16 / 9);
    }
    drawnFrame = frame;
    engine.draw(ctx, spec, state.time, canvas.width / engine.width, timeline);
    segments.forEach(function (segment, index) {
      var done = Math.max(0, Math.min(1, (state.time - segment.start) / (segment.end - segment.start)));
      fills[index].style.transform = 'scaleX(' + done.toFixed(4) + ')';
    });
    templateButtons[state.index].style.setProperty('--cm-progress', (state.time / timeline.duration).toFixed(4));
  }

  function tick(now) {
    raf = 0;
    var elapsed = (now - last) / 1000;
    last = now;
    if (!playable()) return;
    /* real time on a normal display; a throttled tab steps forward gently instead of leaping */
    state.time = (state.time + Math.min(Math.max(elapsed, 0), 0.25)) % timeline.duration;
    paint(false);
    raf = requestAnimationFrame(tick);
  }

  function playable() {
    return !!engine && state.playing && state.visible && !machine.hidden && !document.hidden;
  }

  function run() {
    if (raf || !playable()) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  /* ---------- Controls ---------- */
  function showTemplate(index, focus) {
    var template = engine.templates[index];
    state.index = index;
    templateButtons.forEach(function (button, i) {
      var on = i === index;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-checked', String(on));
      button.tabIndex = on ? 0 : -1;
      if (!on) button.style.removeProperty('--cm-progress');
    });
    if (focus) templateButtons[index].focus();
    machine.style.setProperty('--cm-template-accent', template.accent);
    machine.style.setProperty('--cm-accent', state.accent || template.accent);
    canvas.setAttribute('aria-label', 'Preview of the ' + template.name + ' video template');
    if (fitLabel) fitLabel.textContent = template.bestFor.join(' · ');
    buildSpec();
    buildSegments();
    /* with motion reduced, rest on a frame from the hook instead of a blank first frame */
    state.time = state.playing ? 0 : (timeline.beats[0] ? timeline.beats[0].end * 0.8 : 1);
    paint(true);
    run();
  }

  function setPlaying(playing) {
    state.playing = playing;
    playButton.classList.toggle('is-paused', !playing);
    playButton.setAttribute('aria-label', playing ? 'Pause preview' : 'Play preview');
    run();
  }

  function bind() {
    templateButtons.forEach(function (button, index) {
      button.addEventListener('click', function () { showTemplate(index, false); });
      button.addEventListener('keydown', function (event) {
        var step = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        event.preventDefault();
        showTemplate((index + step + templateButtons.length) % templateButtons.length, true);
      });
    });

    swatches.forEach(function (swatch, index) {
      function choose(focus) {
        state.accent = swatch.getAttribute('data-accent') || '';
        swatches.forEach(function (other) {
          var on = other === swatch;
          other.classList.toggle('is-active', on);
          other.setAttribute('aria-checked', String(on));
          other.tabIndex = on ? 0 : -1;
        });
        if (focus) swatch.focus();
        machine.style.setProperty('--cm-accent', state.accent || engine.templates[state.index].accent);
        buildSpec();
        paint(true);
      }
      swatch.addEventListener('click', function () { choose(false); });
      swatch.addEventListener('keydown', function (event) {
        var step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        event.preventDefault();
        swatches[(index + step + swatches.length) % swatches.length].click();
        swatches[(index + step + swatches.length) % swatches.length].focus();
      });
    });

    var typing = 0;
    nameInput.addEventListener('input', function () {
      clearTimeout(typing);
      typing = setTimeout(function () {
        var name = cleanName(nameInput.value);
        if (name === state.name) return;
        state.name = name;
        buildSpec();
        buildSegments();
        /* jump to the end card, where the name is biggest, so the change is seen at once */
        if (name) state.time = Math.min(timeline.outroStart + 1.1, timeline.duration - 0.1);
        else state.time = Math.min(state.time, timeline.duration - 0.1);
        paint(true);
      }, 260);
    });

    playButton.addEventListener('click', function () { setPlaying(!state.playing); });
    setPlaying(state.playing);

    var onMotionChange = function () { if (reduceMotion.matches) setPlaying(false); };
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onMotionChange);
    else if (reduceMotion.addListener) reduceMotion.addListener(onMotionChange);

    document.addEventListener('visibilitychange', run);
    window.addEventListener('resize', function () { paint(true); }, { passive: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        state.visible = entries[entries.length - 1].isIntersecting;
        run();
      }).observe(canvas);
    } else {
      state.visible = true;
    }
  }

  /* ---------- Loading ---------- */
  function loadFonts() {
    if (!('FontFace' in window) || !document.fonts) return Promise.resolve();
    var pending = [];
    FONTS.forEach(function (font) {
      font[2].forEach(function (weight) {
        var face = new FontFace(font[0], 'url(' + FONT_DIR + font[1] + '-latin-' + weight + '-normal.woff2)', { weight: String(weight), style: 'normal' });
        document.fonts.add(face);
        /* canvas text does not trigger a lazy font load the way page text does, so load up front */
        pending.push(face.load());
      });
    });
    return Promise.all(pending);
  }

  function start() {
    engine = window.SyncContentMachine;
    if (!engine || !engine.templates || !engine.templates.length) return;
    templateButtons.forEach(function (button, index) {
      var template = engine.templates[index];
      var label = button.querySelector('[data-cm="time"]');
      if (!template || !label) return;
      var seconds = Math.round(engine.timeline(template.sample).duration);
      label.textContent = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
    });
    bind();
    showTemplate(0, false);
    /* draw now with fallback fonts rather than show nothing, then again once the real ones arrive */
    loadFonts().then(function () { paint(true); }, function () { /* the fallback fonts stay */ });
  }

  var requested = false;
  function loadEngine() {
    if (requested) return;
    requested = true;
    var script = document.createElement('script');
    script.src = ENGINE_SRC;
    script.onload = start;
    document.head.appendChild(script);
  }

  if ('IntersectionObserver' in window) {
    var approach = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      approach.disconnect();
      loadEngine();
    }, { rootMargin: '700px 0px' });
    approach.observe(machine);
  } else {
    loadEngine();
  }
})();
