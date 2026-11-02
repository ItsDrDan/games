/* ItsDrDan Canvas embed helper — removes the inner scrollbar when a game is iframed into Canvas.
   <script src="https://itsdrdan.github.io/games/brand/embed.js" defer></script>
   Opened directly (not in an iframe) it does nothing. In an iframe it measures the page height and
   posts an `lti.frameResize` message; Canvas listens for that from any iframe on a page and sets the
   iframe's height to match, so the game scrolls with the Canvas page instead of inside its own box.
   Idea and reference implementation: Rob Gilley (FCC-Chem/tools, gilley/stoich-game). */
(function () {
  if (window.parent === window) return;                 // standalone page: nothing to do
  var root = document.documentElement, lastSent = 0, pending = false, honored = false, lastY = 0, pointerSeen = false;
  root.classList.add('dd-embedded');

  function pageHeight() {
    // Measure the body box, not scrollHeight: scrollHeight is never smaller than the frame, so it would ratchet up forever.
    var b = document.body; if (!b) return 0;
    var cs = getComputedStyle(b);
    return Math.ceil(b.getBoundingClientRect().height + parseFloat(cs.marginTop || 0) + parseFloat(cs.marginBottom || 0));
  }
  function sync() {
    pending = false;
    var h = pageHeight(); if (!h) return;
    if (Math.abs(h - lastSent) < 2) return;
    lastSent = h;
    try { window.parent.postMessage({ subject: 'lti.frameResize', height: h }, '*'); } catch (e) {}
    // If the host grows the frame to (about) what we asked for, it honors resize: switch on the embedded tweaks.
    setTimeout(function () { if (!honored && Math.abs(window.innerHeight - lastSent) < 40) enable(); }, 400);
  }
  function schedule() { if (pending) return; pending = true; requestAnimationFrame(sync); }

  /* Once the frame equals the content, "fixed" and "vh" mean the whole game, not what the student can see.
     Park toasts, modals and the confetti canvas near where the student last clicked instead. */
  function enable() {
    honored = true; root.classList.add('dd-autosize');
    var css = document.createElement('style');
    css.textContent =
      'html.dd-autosize{overflow:hidden}' +
      'html.dd-autosize .toasts{position:absolute;bottom:auto;right:16px}' +
      'html.dd-autosize dialog[open]{position:absolute;margin:0 auto;max-height:640px}' +
      'html.dd-autosize dialog .modal-body{max-height:calc(640px - 64px)}' +
      'html.dd-autosize #celebrationCanvas{position:absolute;height:640px;width:100%}';
    document.head.appendChild(css);
    placeToasts(); schedule();
  }
  function anchorY(box) {            // top edge for a floating box, near the last tap, kept inside the page
    var y = pointerSeen ? lastY : 0, h = Math.max(pageHeight(), 1);
    return Math.max(0, Math.min(y - (box || 0) / 2, h - (box || 0)));
  }
  function placeToasts() {
    var t = document.querySelector('.toasts'); if (t) t.style.top = anchorY(120) + 'px';
  }
  function placeDialog(d) {
    if (!d.open) return;
    d.style.top = anchorY(Math.min(640, pageHeight())) + 'px';
    try { d.scrollIntoView({ block: 'nearest' }); } catch (e) {}
  }
  function placeCanvas() {
    var c = document.getElementById('celebrationCanvas'); if (c && !c.hidden) c.style.top = anchorY(640) + 'px';
  }
  document.addEventListener('pointerdown', function (e) { lastY = e.pageY; pointerSeen = true; }, true);
  document.addEventListener('focusin', function (e) {
    var t = e.target; if (!t || !t.getBoundingClientRect || (t.closest && t.closest('dialog,.toasts'))) return;   // focus moving into a modal is not a new place on the page
    { lastY = t.getBoundingClientRect().top + window.scrollY; pointerSeen = true; }
  }, true);

  function start() {
    sync();
    if (window.ResizeObserver) { var ro = new ResizeObserver(schedule); ro.observe(root); if (document.body) ro.observe(document.body); }
    new MutationObserver(function (muts) {
      schedule();
      if (!honored) return;
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i], t = m.target;
        if (m.type === 'attributes' && t.tagName === 'DIALOG' && m.attributeName === 'open') placeDialog(t);
        if (m.type === 'attributes' && t.id === 'celebrationCanvas' && m.attributeName === 'hidden') placeCanvas();
        if (m.type === 'childList' && t.classList && t.classList.contains('toasts')) placeToasts();
      }
    }).observe(root, { childList: true, subtree: true, attributes: true, characterData: true });
    window.addEventListener('resize', schedule);
    setTimeout(sync, 500); setTimeout(sync, 1500); setTimeout(sync, 3000);   // fonts/images landing late
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
