// ╔══════════════════════════════════════════════════════════════════╗
// ║      UNIVERSAL STEALTH ARCHITECT v3.2 — ULTIMATE EDITION         ║
// ║      content.js | High-Performance Stealth & Non-Blocking UI      ║
// ╚══════════════════════════════════════════════════════════════════╝

(function() {
  let IS_ARMED = false;

  // 1. SURGICAL EVENT GAG (Capture Phase)
  // These events are blocked to prevent the site from detecting tab-switches or restrictions.
  // We EXCLUDE click/mousedown to ensure the UI stays responsive.
  const GAG_EVENTS = ['blur', 'visibilitychange', 'focusout', 'contextmenu', 'selectstart', 'dragstart', 'copy', 'cut', 'paste'];

  GAG_EVENTS.forEach(type => {
    window.addEventListener(type, (e) => {
      if (IS_ARMED) {
        // Stop the site's own listeners from ever seeing these events
        e.stopImmediatePropagation();

        // For some events, we only prevent default if we want to bypass site restrictions
        // (e.g., allowing right-click or copy-paste on a restricted site)
        if (['contextmenu', 'selectstart', 'dragstart', 'copy', 'cut', 'paste'].includes(type)) {
          // We DON'T prevent default here because we want the browser's NATIVE behavior to work.
          // By stopping propagation, we kill the site's script that says "return false" or "e.preventDefault()".
        } else {
          // For blur/visibilitychange, we just stop the event from reaching the site's scripts.
        }

        console.log(`%c [ARCHITECT] Gagged: ${type} `, "color:#00ff88;font-weight:bold;");
      }
    }, true); // CRITICAL: Capture Phase
  });

  // 2. ACTIVATION & STATE
  chrome.storage.local.get(['stealthActive'], (res) => {
    if (res.stealthActive) {
      IS_ARMED = true;
      console.log("%c █ UNIVERSAL STEALTH ARCHITECT ARMED █ ", "background:#00ff88;color:#000;font-weight:bold;padding:5px;");
      armModules();
    } else {
      console.log("%c [ARCHITECT] Stealth Mode: INACTIVE. ", "color:#666;");
    }
  });

  function armModules() {
    // 3. PROPERTY SPOOFING (Locking values)
    const spoof = (obj, prop, value) => {
      try {
        Object.defineProperty(obj, prop, {
          get: typeof value === 'function' ? value : () => value,
          set: () => {},
          configurable: false,
          enumerable: true
        });
      } catch (e) { /* Silent fail for protected properties */ }
    };

    // Spoof visibility and focus
    spoof(document, 'visibilityState', 'visible');
    spoof(document, 'hidden', false);
    spoof(document, 'hasFocus', () => true);

    // Spoof resolution (Hide window resizing/DevTools)
    const W = window.innerWidth || 1920;
    const H = window.innerHeight || 1080;
    spoof(window, 'innerWidth', W);
    spoof(window, 'innerHeight', H);
    spoof(window, 'outerWidth', W);
    spoof(window, 'outerHeight', H);
    spoof(screen, 'width', W);
    spoof(screen, 'height', H);

    // 4. CSS UNLOCKING (Non-Blocking)
    const injectStyles = () => {
      if (!document.getElementById('__architect_stealth__')) {
        const el = document.createElement('style');
        el.id = '__architect_stealth__';
        el.textContent = `
          *, *::before, *::after {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
            pointer-events: auto !important;
          }
        `;
        (document.head || document.documentElement).appendChild(el);
      }
    };

    // Use a lighter observer to avoid freezing the UI
    const observer = new MutationObserver((mutations) => {
      // Only re-inject if our style element is missing
      if (!document.getElementById('__architect_stealth__')) {
        injectStyles();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    injectStyles();

    // 5. NETWORK BLACKHOLE
    const BLACKLIST = ['clarity', 'bing', 'telemetry', 'log', 'violation', 'proctor', 'heartbeat', 'monitor', 'track', 'dynatrace', 'sentry'];
    const isSnitch = (url) => BLACKLIST.some(p => String(url).toLowerCase().includes(p));

    // Proxy Fetch
    const _fetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0] instanceof Request ? args[0].url : String(args[0]);
      if (isSnitch(url)) {
        console.log(`%c [BLACKHOLE] fetch blocked: ${url} `, "color:#ff4444;");
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      return _fetch.apply(this, args);
    };

    // Proxy XHR
    const _open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      this._url = url;
      this._block = isSnitch(url);
      return _open.apply(this, arguments);
    };
    const _send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function() {
      if (this._block) {
        console.log(`%c [BLACKHOLE] XHR blocked: ${this._url} `, "color:#ff4444;");
        return; 
      }
      return _send.apply(this, arguments);
    };

    // Proxy Beacon
    const _beacon = navigator.sendBeacon;
    navigator.sendBeacon = function(url, data) {
      if (isSnitch(url)) {
        console.log(`%c [BLACKHOLE] Beacon blocked: ${url} `, "color:#ff4444;");
        return true;
      }
      return _beacon.apply(navigator, arguments);
    };

    console.log("%c [ARCHITECT] All stealth modules active. UI unlocked. ", "color:#00ff88;");
  }
})();
