/* ItsDrDan game feedback button: "Rate this game".
   Loaded on every game by brand/embed.js, so no game file needs its own script line.
   Students pick their professor, give THIS game 1–5 stars and an optional comment (and their name,
   only if their professor gives credit for feedback). Rows go to the same Google Apps Script as
   track.js and feedback.html, tagged type:"feedback", so they land in the feedback tabs of the
   "ItsDrDan Game Stats" sheet next to the CHEM 3B feedback page's rows.

   TO ADD A PROFESSOR: add a line to PROFESSORS below and push the games repo. Every game updates.
   Professors also get added automatically: a game link with ?prof=Name (e.g. ?prof=uvarov, from the
   Station Rotation setup page) puts "Professor Uvarov" in the list and picks it, and a game can set
   window.ddProfessor to the student's professor (Station Rotation does this from its lab picker).
   To hide the button on one page: <meta name="dd-feedback" content="off"> */
(function () {
  if (window.ddFeedbackLoaded) return;
  window.ddFeedbackLoaded = true;

  var PROFESSORS = [
    'Dr. Dan',
    'Professor Alex',
    'Professor Gilley',
    'Dr. Dan / Professor Xiong'
  ];
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbylSKoW9GE6AkN4HiC1uts3Y5Z4oUPHY7OQ88vXrjpcanooloYRTIGW9cS5n0dulp4vQg/exec';
  /* Pages that are not games (chemistry hub, link forwarder, question bank). MCAT and TEAS pages DO get it. */
  var SKIP = ['', 'games', 'golinks', 'questionbank', 'itsdrdan.github.io'];

  var LIVE = /\.github\.io$/.test(location.hostname);
  var seg = (location.pathname.split('/').filter(Boolean)[0] || '').toLowerCase();
  var meta = document.querySelector('meta[name="dd-feedback"]');
  if (meta && /off|no|false/i.test(meta.getAttribute('content') || '')) return;
  if (LIVE && SKIP.indexOf(seg) !== -1) return;

  var sub = (location.pathname.split('/').filter(Boolean)[1] || '').replace(/\.html?$/i, '').toLowerCase();
  if (sub === 'index') sub = '';
  var GAME = LIVE ? seg + (sub ? '/' + sub : '') : (document.title.split(/\s[•·|—–-]\s|!|:/)[0] || 'local').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  function gameTitle() { return (document.title.split(/\s[•·|—–]\s/)[0] || GAME).trim(); }
  var FRAMED = (function () { try { return window.top !== window.self; } catch (e) { return true; } })();

  /* The professor this link or game is set up for (see the note at the top). */
  function tidyProf(v) {
    v = String(v || '').replace(/[<>"]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!v) return '';
    if (/^(dan|dr\.? ?dan|kwasniewski)$/i.test(v)) return 'Dr. Dan';
    var bare = v.toLowerCase().replace(/^(professor|prof\.?|dr\.?)\s+/, '');
    for (var i = 0; i < PROFESSORS.length; i++) if (PROFESSORS[i].toLowerCase() === v.toLowerCase() || PROFESSORS[i].toLowerCase() === 'professor ' + bare) return PROFESSORS[i];
    return /\s/.test(v) || /[A-Z]/.test(v) ? v : 'Professor ' + v.charAt(0).toUpperCase() + v.slice(1);
  }
  function linkedProf() {
    if (window.ddProfessor) return tidyProf(window.ddProfessor);
    try { var q = new URLSearchParams(location.search); return tidyProf(q.get('prof') || q.get('professor')); } catch (e) { return ''; }
  }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); } catch (e) { return ''; } }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function course() {
    try { var c = new URLSearchParams(location.search).get('course'); if (c) return c.toUpperCase().slice(0, 4); } catch (e) {}
    return '';
  }

  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>';
  var CHAT = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5h16v10H9l-5 4z"/><path d="M8.5 9.5h7M8.5 12.5h4"/></svg>';
  var LABELS = ['', 'Not helpful', 'A little helpful', 'Helpful', 'Very helpful', 'Loved it!'];

  var css = document.createElement('style');
  css.textContent = [
    '.ddfb{--fb-ink:#2b2340;--fb-muted:#6b6385;--fb-edge:#2b2340;--fb-brand:#8b6fd6;--fb-bg:#fff;--fb-soft:#f4efff;--fb-star:#f5b301;',
    'font-family:Nunito,"Segoe UI",system-ui,sans-serif;color:var(--fb-ink);box-sizing:border-box;line-height:1.35}',
    '.ddfb *{box-sizing:border-box}',
    '.ddfb [hidden]{display:none!important}',
    '.ddfb-zone{max-width:640px;margin:28px auto 12px;padding:0 16px;text-align:center}',
    '.ddfb-open{display:inline-flex;align-items:center;gap:10px;min-height:52px;padding:10px 24px;border-radius:999px;border:2px solid var(--fb-edge);',
    'box-shadow:0 4px 0 var(--fb-edge);background:var(--fb-soft);color:var(--fb-ink);font:inherit;font-weight:850;font-size:1.05rem;cursor:pointer;transition:transform .14s,box-shadow .14s}',
    '.ddfb-open:hover{transform:translateY(-2px);box-shadow:0 6px 0 var(--fb-edge)}',
    '.ddfb-open:active{transform:translateY(3px);box-shadow:0 1px 0 var(--fb-edge)}',
    '.ddfb-open svg{width:24px;height:24px;color:var(--fb-star)}',
    '.ddfb-sub{margin:8px 0 0;color:var(--fb-muted);font-size:.9rem;font-weight:600}',
    '.ddfb-card{margin:16px auto 0;text-align:left;background:var(--fb-bg);border:2px solid var(--fb-edge);border-radius:22px;box-shadow:0 5px 0 var(--fb-edge);padding:20px 20px 22px;display:grid;gap:16px}',
    '.ddfb-card[hidden]{display:none}',
    '.ddfb-card h3{margin:0;font-size:1.25rem;font-weight:900;font-family:Fredoka,Nunito,sans-serif}',
    '.ddfb-f{display:grid;gap:6px;font-weight:800;font-size:1rem}',
    '.ddfb-f small{font-weight:600;color:var(--fb-muted)}',
    '.ddfb select,.ddfb input,.ddfb textarea{font:inherit;font-weight:600;font-size:1rem;color:var(--fb-ink);width:100%;min-height:48px;padding:10px 14px;border-radius:14px;border:2px solid #cfc6e6;background:#fff}',
    '.ddfb textarea{min-height:92px;resize:vertical}',
    '.ddfb select:focus,.ddfb input:focus,.ddfb textarea:focus{outline:3px solid #c9b8ff;border-color:var(--fb-brand)}',
    '.ddfb-stars{display:flex;align-items:center;flex-wrap:wrap;gap:4px}',
    '.ddfb-star{width:48px;height:48px;padding:4px;border:0;background:none;color:#d9d3ea;cursor:pointer;border-radius:12px;transition:transform .12s,color .12s}',
    '.ddfb-star:hover{transform:scale(1.12)}',
    '.ddfb-star.on{color:var(--fb-star)}',
    '.ddfb-star:focus-visible{outline:3px solid #c9b8ff}',
    '.ddfb-star svg{width:100%;height:100%}',
    '.ddfb-rl{margin-left:6px;font-weight:800;color:var(--fb-muted);min-height:1.2em}',
    '.ddfb-row{display:flex;flex-wrap:wrap;align-items:center;gap:12px}',
    '.ddfb-send{display:inline-flex;align-items:center;justify-content:center;min-height:52px;padding:10px 26px;border-radius:999px;border:2px solid var(--fb-edge);box-shadow:0 4px 0 var(--fb-edge);',
    'background:var(--fb-brand);color:#fff;font:inherit;font-weight:850;font-size:1.05rem;cursor:pointer}',
    '.ddfb-send[disabled]{opacity:.6;cursor:wait}',
    '.ddfb-x{border:0;background:none;font:inherit;font-weight:800;color:var(--fb-muted);cursor:pointer;text-decoration:underline;min-height:44px}',
    '.ddfb-err{margin:0;color:#b42318;font-weight:800}',
    '.ddfb-priv{margin:0;color:var(--fb-muted);font-size:.85rem;font-weight:600}',
    '.ddfb-done{text-align:center}',
    '.ddfb-code{display:inline-block;margin:4px auto;padding:6px 14px;border-radius:12px;background:var(--fb-soft);border:2px dashed var(--fb-brand);font-weight:900;letter-spacing:.08em;font-size:1.15rem}',
    '.ddfb-float{position:fixed;right:16px;bottom:16px;z-index:9990;display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:8px 18px;border-radius:999px;',
    'border:2px solid var(--fb-edge);box-shadow:0 3px 0 var(--fb-edge);background:#fff;color:var(--fb-ink);font:inherit;font-weight:850;font-size:.98rem;cursor:pointer;transition:opacity .2s,transform .2s}',
    '.ddfb-float svg{width:22px;height:22px;color:var(--fb-brand)}',
    '.ddfb-float.gone{opacity:0;pointer-events:none;transform:translateY(12px)}',
    '@media (max-width:560px){.ddfb-float{padding:0;width:52px;height:52px;justify-content:center}.ddfb-float span{display:none}.ddfb-star{width:44px;height:44px}}',
    '@media print{.ddfb,.ddfb-float{display:none!important}}'
  ].join('');
  (document.head || document.documentElement).appendChild(css);

  function build() {
    var W = /hub/i.test(gameTitle()) ? 'page' : 'game';
    var zone = document.createElement('section');
    zone.className = 'ddfb ddfb-zone';
    zone.id = 'dd-feedback';
    zone.setAttribute('aria-label', 'Rate this game');
    var opts = PROFESSORS.map(function (p) { return '<option>' + esc(p) + '</option>'; }).join('');
    var stars = '';
    for (var i = 1; i <= 5; i++) stars += '<button type="button" class="ddfb-star" data-n="' + i + '" aria-pressed="false" aria-label="' + i + ' star' + (i > 1 ? 's' : '') + '">' + STAR + '</button>';
    zone.innerHTML =
      '<button type="button" class="ddfb-open" aria-expanded="false" aria-controls="ddfb-card">' + STAR + 'Rate this ' + W + '</button>' +
      '<p class="ddfb-sub">Takes 30 seconds. Tell us what helped and what didn’t.</p>' +
      '<form class="ddfb-card" id="ddfb-card" hidden novalidate>' +
        '<h3>How was ' + esc(gameTitle()) + '?</h3>' +
        '<label class="ddfb-f">1. Your professor' +
          '<select name="prof" required><option value="">Pick your professor…</option>' + opts + '</select></label>' +
        '<div class="ddfb-f"><span id="ddfb-sl">2. How helpful was this ' + W + '?</span>' +
          '<div class="ddfb-stars" role="group" aria-labelledby="ddfb-sl">' + stars + '<span class="ddfb-rl" aria-live="polite"></span></div></div>' +
        '<label class="ddfb-f">3. Comments <small>(optional) What was confusing, broken, or great?</small>' +
          '<textarea name="comment" maxlength="800"></textarea></label>' +
        '<label class="ddfb-f">Your name <small>(optional, only if your professor gives credit for feedback)</small>' +
          '<input name="name" type="text" maxlength="80" autocomplete="name"></label>' +
        '<p class="ddfb-err" role="alert" hidden></p>' +
        '<div class="ddfb-row"><button type="submit" class="ddfb-send">Send feedback</button><button type="button" class="ddfb-x">Cancel</button></div>' +
        '<p class="ddfb-priv">Goes to Dr. Dan and your professor, only to improve the games.</p>' +
      '</form>' +
      '<div class="ddfb-card ddfb-done" hidden aria-live="polite"></div>';
    return zone;
  }

  function findSpot() {
    /* Put the button just above the game's footer credit ("Game design and chemistry by ItsDrDan…"). */
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) {
      if (/Game design and chemistry by ItsDrDan/.test(n.nodeValue)) {
        var el = n.parentElement;
        var foot = el.closest('footer') || el;
        while (foot.parentElement && foot.parentElement !== document.body && foot.parentElement.children.length === 1) foot = foot.parentElement;
        return foot;
      }
    }
    var foots = document.querySelectorAll('body > footer, body > .footer');
    return foots.length ? foots[foots.length - 1] : null;
  }

  function init() {
    if (!document.body || document.getElementById('dd-feedback')) return;
    var zone = build(), spot = findSpot();
    if (spot && spot.parentNode) spot.parentNode.insertBefore(zone, spot); else document.body.appendChild(zone);

    var open = zone.querySelector('.ddfb-open'), form = zone.querySelector('form'), done = zone.querySelector('.ddfb-done'),
        err = zone.querySelector('.ddfb-err'), send = zone.querySelector('.ddfb-send'), rl = zone.querySelector('.ddfb-rl'),
        prof = form.elements.prof, nameEl = form.elements.name, stars = 0, flt = null;

    var savedProf = store('ddFbProf'); if (PROFESSORS.indexOf(savedProf) !== -1) prof.value = savedProf;
    var autoProf = null;
    function syncProf() {   /* add the linked professor (if new) and pick it */
      var lp = linkedProf(); if (!lp) return;
      if (![].some.call(prof.options, function (o) { return o.value === lp; })) { var o = document.createElement('option'); o.textContent = lp; prof.appendChild(o); }
      if (autoProf === null || prof.value === autoProf || !prof.value) prof.value = lp;   /* a student's own later pick wins */
      autoProf = lp;
    }
    syncProf();
    nameEl.value = store('ddFbName');

    function paint() {
      zone.querySelectorAll('.ddfb-star').forEach(function (s) { var on = +s.dataset.n <= stars; s.classList.toggle('on', on); s.setAttribute('aria-pressed', +s.dataset.n === stars); });
      rl.textContent = LABELS[stars] || '';
    }
    function show(on) {
      if (on) syncProf();
      form.hidden = !on; done.hidden = true; open.setAttribute('aria-expanded', on);
      open.hidden = on; zone.querySelector('.ddfb-sub').hidden = on;
      if (on) { form.scrollIntoView({block: 'center', behavior: 'smooth'}); setTimeout(function () { (prof.value ? zone.querySelector('.ddfb-star') : prof).focus({preventScroll: true}); }, 350); }
      if (flt) flt.classList.toggle('gone', on);
    }
    open.addEventListener('click', function () { show(true); });
    zone.querySelector('.ddfb-x').addEventListener('click', function () { show(false); });
    zone.addEventListener('click', function (e) { var s = e.target.closest('.ddfb-star'); if (s) { stars = +s.dataset.n; paint(); err.hidden = true; } });

    function fail(msg, el) { err.textContent = msg; err.hidden = false; if (el) el.focus(); }
    function makeCode() {
      var a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', s = '';
      for (var i = 0; i < 6; i++) s += a[Math.floor(Math.random() * a.length)];
      return 'FB-' + s.slice(0, 3) + '-' + s.slice(3);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault(); err.hidden = true;
      if (!prof.value) return fail('Pick your professor first.', prof);
      if (!stars) return fail('Tap 1 to 5 stars.', zone.querySelector('.ddfb-star'));
      var name = nameEl.value.trim().replace(/\s+/g, ' '), comment = form.elements.comment.value.trim(), code = makeCode();
      store('ddFbProf', prof.value); if (name) store('ddFbName', name);
      var payload = {
        type: 'feedback', page: GAME,   /* sheet's Page column keeps 20 characters, so no prefix */ code: code, name: name, klass: prof.value, professor: prof.value,
        course: course(), framed: FRAMED, best: '', comments: '',
        ratings: [{game: GAME, title: gameTitle(), stars: stars, comment: comment}]
      };
      send.disabled = true; send.textContent = 'Sending…';
      function finish() {
        form.hidden = true; done.hidden = false;
        var when = new Date().toLocaleString([], {dateStyle: 'medium', timeStyle: 'short'});
        done.innerHTML = '<h3>Thank you!</h3>' +
          '<p style="margin:0">You gave <b>' + esc(gameTitle()) + '</b> ' + stars + ' star' + (stars > 1 ? 's' : '') + '. Your feedback was sent to Dr. Dan.</p>' +
          (name ? '<p style="margin:0">Getting credit? <b>Screenshot this.</b></p><div><span class="ddfb-code">' + code + '</span></div><p class="ddfb-priv" style="margin:0">' + esc(name) + ' · ' + esc(prof.value) + ' · ' + esc(when) + '</p>' : '') +
          (LIVE ? '' : '<p class="ddfb-err" style="margin:0">Preview copy: feedback is only sent from the live game.</p>') +
          '<div><button type="button" class="ddfb-x ddfb-again">Send more feedback</button></div>';
        done.querySelector('.ddfb-again').addEventListener('click', function () { form.elements.comment.value = ''; stars = 0; paint(); show(true); });
        send.disabled = false; send.textContent = 'Send feedback';
        open.innerHTML = STAR + 'Thanks! Rate again';
        done.scrollIntoView({block: 'center', behavior: 'smooth'});
      }
      if (!LIVE) { try { console.log('[feedback preview] not sent:', payload); } catch (x) {} return setTimeout(finish, 300); }
      fetch(ENDPOINT, {method: 'POST', mode: 'no-cors', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(payload)})
        .then(finish)
        .catch(function () { send.disabled = false; send.textContent = 'Send feedback'; fail('That didn’t send. Check your internet and tap Send again.'); });
    });

    /* Opened on its own (not inside Canvas): a small floating "Feedback" pill that jumps to the form.
       Inside a Canvas iframe the frame is as tall as the game, so a fixed pill would sit at the very bottom; skip it there. */
    if (!FRAMED) {
      flt = document.createElement('button');
      flt.type = 'button'; flt.className = 'ddfb ddfb-float'; flt.setAttribute('aria-label', 'Give feedback on this game');
      flt.innerHTML = CHAT + '<span>Feedback</span>';
      flt.addEventListener('click', function () { show(true); });
      document.body.appendChild(flt);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { flt.classList.toggle('gone', es[0].isIntersecting || !form.hidden); }).observe(zone);
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
