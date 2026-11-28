/* ItsDrDan first-time tour: a short walk-through that points at each part of a game, one step at a time.
   Same look as the Virtual Labs station tours. Never edited once live: a change is a new file (tour.v2.js).

   <script src="https://itsdrdan.github.io/games/brand/tour.v1.js"></script>
   ddTour.init({
     id: 'gaslaws',                       // remembers "seen" per game on this device (localStorage ddTour.gaslaws)
     steps: [['#modes', 'These are the modes...'], ...],   // [CSS selector, HTML text]; hidden or missing ones are skipped
     button: '#tourSlot',                 // where the 🧭 Tour button goes (appended inside); omit for no button
     isNew: () => !progressSaved,         // optional: false = a returning student, so no automatic tour
     auto: () => true,                    // optional: false = do not start on its own this visit (deep links, etc.)
     delay: 700                           // optional: ms after init before the automatic tour
   });
   ddTour.start() / ddTour.end() / ddTour.active()

   The automatic tour runs once per device, only for a new student, never over an open dialog, and never in a
   small frame (the textbook's Explore It boxes). The 🧭 Tour button replays it any time.
   Scrolling uses window.scrollTo on this page only, so a game in a frame never moves the page around it. */
(function () {
  if (window.ddTour) return;
  var CSS = '.ddtour-pop{position:absolute;z-index:9995;width:min(340px,92vw);box-sizing:border-box;background:#1e1b4b;color:#fff;border-radius:16px;padding:12px 14px;box-shadow:0 12px 40px rgba(0,0,0,.3);font:15px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:left}' +
    '.ddtour-pop .ddtour-n{font-size:12.5px;opacity:.8}' +
    '.ddtour-pop .ddtour-row{display:flex;gap:8px;margin-top:10px;justify-content:space-between}' +
    '.ddtour-pop button{min-height:44px;padding:6px 14px;border-radius:12px;border:0;font:800 15px system-ui,-apple-system,sans-serif;background:#ffffff26;color:#fff;cursor:pointer;touch-action:manipulation}' +
    '.ddtour-pop button.ddtour-go{background:#f59e0b;color:#1e1b4b}' +
    '.ddtour-pop button:focus-visible{outline:3px solid #fde68a;outline-offset:2px}' +
    '.ddtour-hi{outline:4px solid #f59e0b!important;outline-offset:3px;border-radius:inherit}' +
    '.ddtour-btn{border:2px solid #cdbbec;background:#f6f1ff;color:#4c1d95;border-radius:999px;padding:6px 14px;font-weight:800;font-size:14px;min-height:44px;cursor:pointer;touch-action:manipulation;font-family:inherit}' +
    '.ddtour-btn:focus-visible{outline:3px solid #7c3aed;outline-offset:2px}' +
    '@media print{.ddtour-pop,.ddtour-btn{display:none!important}.ddtour-hi{outline:0!important}}';
  var cfg = null, list = [], i = -1, pop = null, back = null;
  function $(s) { try { return document.querySelector(s); } catch (e) { return null; } }
  function key() { return 'ddTour.' + cfg.id; }
  function seen() { try { return localStorage.getItem(key()) === '1'; } catch (e) { return false; } }
  function mark() { try { localStorage.setItem(key(), '1'); } catch (e) {} }
  function visible(el) { if (!el) return false; var r = el.getBoundingClientRect(); return (r.width > 0 || r.height > 0) && getComputedStyle(el).visibility !== 'hidden'; }
  function reduce() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  /* height of a pinned (fixed or sticky) bar across the top, so the card never hides under it */
  function bar() {
    if (pop) pop.style.display = 'none';
    var e = document.elementFromPoint(innerWidth / 2, 2);
    if (pop) pop.style.display = '';
    while (e && e !== document.body && e !== document.documentElement) {
      var p = getComputedStyle(e).position;
      if (p === 'fixed' || p === 'sticky') { var b = e.getBoundingClientRect().bottom; return b > 0 && b < innerHeight / 3 ? { el: e, h: b } : null; }
      e = e.parentElement;
    }
    return null;
  }
  function clearHi() { var h = document.querySelectorAll('.ddtour-hi'); for (var k = 0; k < h.length; k++) h[k].classList.remove('ddtour-hi'); }

  function addButton() {
    if (!cfg || !cfg.button) return;
    var slot = $(cfg.button); if (!slot || slot.querySelector('.ddtour-btn')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'ddtour-btn'; b.textContent = '🧭 Tour';
    b.title = 'A short tour of this game'; b.setAttribute('aria-label', 'Tour: a short walk-through of this game');
    b.onclick = function () { start(b); };
    slot.appendChild(b);
  }

  function place(scroll) {
    var step = list[i], el = step && $(step[0]);
    if (!el || !visible(el)) { if (++i < list.length) return place(scroll); return end(); }
    clearHi(); el.classList.add('ddtour-hi');
    if (!pop) {
      pop = document.createElement('div'); pop.className = 'ddtour-pop';
      pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Tour'); pop.setAttribute('aria-describedby', 'ddtourText');
      document.body.appendChild(pop);
    }
    var last = i === list.length - 1;
    pop.innerHTML = '<div class="ddtour-n">' + (i + 1) + ' of ' + list.length + '</div><div id="ddtourText">' + step[1] + '</div>' +
      '<div class="ddtour-row"><button type="button" class="ddtour-skip">' + (last ? 'Close' : 'Skip tour') + '</button>' +
      (last ? '' : '<button type="button" class="ddtour-go">Next →</button>') + '</div>';
    var r = el.getBoundingClientRect(), w = Math.min(340, innerWidth * 0.92), tall = r.height > innerHeight * 0.55;
    var b = bar(), hb = b ? b.h : 0, inBar = !!(b && b.el.contains(el)), ph = pop.offsetHeight;
    /* card under the element (inside it near the top for a tall one); above it only at the very end of the page */
    var top = scrollY + (tall ? r.top + 12 : r.bottom + 10);
    if (!tall && !inBar && top + ph + 8 > document.documentElement.scrollHeight) top = scrollY + r.top - 10 - ph;
    pop.style.top = top + 'px';
    pop.style.left = Math.max(8, Math.min(scrollX + r.left + (tall ? 12 : 0), scrollX + innerWidth - w - 8)) + 'px';
    pop.querySelector('.ddtour-skip').onclick = end;
    var go = pop.querySelector('.ddtour-go');
    if (go) go.onclick = function () { i++; place(true); };
    (go || pop.querySelector('.ddtour-skip')).focus({ preventScroll: true });
    if (scroll && !inBar) {   /* a step inside the pinned bar is always on screen */
      var pr = pop.getBoundingClientRect(), topEdge = Math.min(r.top, pr.top), botEdge = Math.max(tall ? r.top + 80 : r.bottom, pr.bottom), pad = hb + 16;
      if (topEdge < pad || botEdge > innerHeight) {
        var y = scrollY + topEdge - pad; if (botEdge - (topEdge - pad) > innerHeight) y = scrollY + botEdge - innerHeight + 20;
        try { window.scrollTo({ top: Math.max(0, y), behavior: reduce() ? 'auto' : 'smooth' }); } catch (e) { window.scrollTo(0, Math.max(0, y)); }
      }
    }
  }

  function start(from) {
    if (!cfg) return;
    list = (typeof cfg.steps === 'function' ? cfg.steps() : cfg.steps).slice();
    if (cfg.button) list.push([cfg.button + ' .ddtour-btn', 'Tap <b>🧭 Tour</b> any time to see this again.']);
    back = from || document.activeElement; i = 0; place(true);
  }
  function end() {
    if (i < 0) return;
    i = -1; clearHi(); if (pop) { pop.remove(); pop = null; } mark();
    if (back && back.focus && document.contains(back)) try { back.focus({ preventScroll: true }); } catch (e) {}
    back = null;
  }
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && i >= 0) end(); });
  addEventListener('resize', function () { if (i >= 0) place(false); });

  function smallFrame() { return window.parent !== window && (innerHeight < 500 || innerWidth < 360); }
  function init(c) {
    cfg = c; if (!cfg || !cfg.id || !cfg.steps) return;
    if (!document.getElementById('ddtourCss')) { var s = document.createElement('style'); s.id = 'ddtourCss'; s.textContent = CSS; document.head.appendChild(s); }
    var go = function () {
      addButton();
      if (seen() || smallFrame()) return;
      if (cfg.isNew && !cfg.isNew()) { mark(); return; }   // returning student: never auto-show later either
      if (cfg.auto && !cfg.auto()) return;
      setTimeout(function () {
        if (i >= 0 || seen() || document.querySelector('dialog[open]')) return;
        start(null);
      }, cfg.delay == null ? 700 : cfg.delay);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  }
  window.ddTour = { init: init, start: function () { start(null); }, end: end, active: function () { return i >= 0; }, addButton: addButton };
})();
