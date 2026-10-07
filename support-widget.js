/* Sync Socials support embed. Keep the copy in sync-socials-site/ identical. */
(function () {
  'use strict';
  if (window.parent !== window || location.pathname.startsWith('/support/widget') || document.getElementById('sync-support-frame')) return;
  var script = document.currentScript;
  var local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  var appOrigin = 'https://app.sync-socials.com';
  if (location.hostname === 'app.sync-socials.com') appOrigin = location.origin;
  if (local) {
    try {
      var requested = new URL(script && script.dataset.appOrigin || location.origin);
      if (['localhost', '127.0.0.1', '[::1]'].includes(requested.hostname) && ['http:', 'https:'].includes(requested.protocol)) appOrigin = requested.origin;
    } catch (_) { /* Keep the production origin for an invalid override. */ }
  }

  function mount() {
    if (document.getElementById('sync-support-frame')) return;
    var frame = document.createElement('iframe');
    frame.id = 'sync-support-frame';
    frame.title = 'Ask Sync — AI support';
    frame.src = appOrigin + '/support/widget?parentOrigin=' + encodeURIComponent(location.origin);
    frame.referrerPolicy = 'no-referrer';
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms');
    frame.style.cssText = 'position:fixed;z-index:9997;right:16px;bottom:16px;width:184px;height:112px;border:0;background:transparent;color-scheme:light;display:block;max-width:calc(100vw - 16px);';
    var open = false;
    var scheduled = false;
    function position() {
      scheduled = false;
      var viewport = window.visualViewport;
      var availableHeight = viewport ? viewport.height : window.innerHeight;
      var keyboardOffset = viewport ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
      var margin = window.innerWidth < 500 ? 7 : 16;
      var width = open ? Math.min(420, window.innerWidth - margin * 2) : 184;
      var bottom = margin + keyboardOffset;
      var privacy = document.querySelector('[aria-label="Site analytics privacy"]');
      // On a phone, stacking the closed bubble above the privacy panel pushes
      // it over the page's own form, so hide it until a choice closes the panel.
      if (privacy && !open && window.innerWidth < 500) {
        frame.style.display = 'none';
        return;
      }
      frame.style.display = 'block';
      if (privacy) {
        var rect = privacy.getBoundingClientRect();
        if (rect.width && rect.right > window.innerWidth - width - margin && rect.top < window.innerHeight - bottom) {
          bottom = Math.max(bottom, window.innerHeight - rect.top + 7);
        }
      }
      var height = open ? Math.min(680, availableHeight - (bottom - keyboardOffset) - margin) : 112;
      frame.style.width = width + 'px';
      frame.style.height = Math.max(112, height) + 'px';
      frame.style.bottom = bottom + 'px';
      frame.style.right = margin + 'px';
    }
    function schedulePosition() {
      if (!scheduled) { scheduled = true; window.requestAnimationFrame(position); }
    }
    function context() {
      // Never forward search parameters, hashes, referral data, or credentials.
      if (frame.contentWindow) frame.contentWindow.postMessage({ type: 'sync-support:context', sourcePath: location.pathname }, appOrigin);
    }
    window.addEventListener('message', function (event) {
      if (event.origin !== appOrigin || event.source !== frame.contentWindow || !event.data) return;
      if (event.data.type === 'sync-support:ready') { context(); position(); }
      if (event.data.type === 'sync-support:resize' && typeof event.data.open === 'boolean') {
        open = event.data.open;
        frame.title = open ? 'Ask Sync — AI support conversation' : 'Ask Sync — open AI support';
        position();
      }
    });
    frame.addEventListener('load', context);
    window.addEventListener('resize', schedulePosition, { passive: true });
    window.addEventListener('popstate', context);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', schedulePosition, { passive: true });
    new MutationObserver(schedulePosition).observe(document.body, { childList: true });
    document.body.appendChild(frame);
    position();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
