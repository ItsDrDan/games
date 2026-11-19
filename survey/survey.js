/* ItsDrDan end-of-semester survey engine.
   Each course page sets window.SURVEY = {...} and loads this file.
   Answers save as the student types (localStorage on their own device) and are sent ONCE to the
   Google Apps Script web app in ENDPOINT (see survey-apps-script.gs). No names, emails, or IDs are collected. */
(function () {
  'use strict';
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbxGpdivSTtTMbiXEzbsEacbzMjhLFknI-gTVyZd1lMzH5a5gXmn8wITKkT8-QuUMLX9zA/exec'; /* Semester Surveys Receiver (itsdrdantv) */
  var S = window.SURVEY;
  var LIVE = /\.github\.io$/.test(location.hostname) && ENDPOINT.indexOf('https://') === 0;
  var KEY = 'ddSurvey:' + S.id, DONE = KEY + ':sent';
  var root = document.getElementById('survey');
  document.documentElement.style.setProperty('--c', S.color);
  document.documentElement.style.setProperty('--cb', S.colorBg);

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40); }

  function pick(name, val, label, row) {
    var face = FACES[label];
    return '<label class="pick"><input type="radio" name="' + name + '" value="' + val + '" aria-label="' + esc(row + ': ' + label) + '">' +
      (face ? '<b aria-hidden="true">' + face + '</b>' : '<b class="num" aria-hidden="true">' + esc(label) + '</b>') + '</label>';
  }
  var LABELS = {}; /* id -> question text, in page order, for the sheet's header row */
  var ORDER = [];
  function note(id, label) { if (!LABELS[id]) { LABELS[id] = label; ORDER.push(id); } }

  /* ---------- build ---------- */
  var EMO = [[/about you/i,'👋'],[/xiong|saturday/i,'🥽'],[/hardest/i,'🤯'],[/skill check/i,'🎯'],[/flipped/i,'🔄'],[/adventure/i,'🗺️'],
    [/mini lab|worksheet/i,'🔥'],[/resources/i,'🧰'],[/study games/i,'🎮'],[/^etc/i,'🤝'],[/fcc/i,'📋'],[/looking ahead/i,'🚀'],[/overall/i,'⭐'],[/own words/i,'💬']];
  function emo(t) { for (var i = 0; i < EMO.length; i++) if (EMO[i][0].test(t)) return EMO[i][1]; return '🧪'; }
  var FACES = { 'Strongly disagree': '😖', 'Disagree': '😕', 'Neutral': '😐', 'Agree': '🙂', 'Strongly agree': '🤩', 'N/A': '🤷' };
  var html = '', num = 0;
  S.sections.forEach(function (sec) {
    if (!sec.showIf) num++;
    var show = sec.showIf ? ' data-show-q="' + sec.showIf.q + '" data-show-v="' + esc(sec.showIf.v) + '" hidden' : '';
    html += '<section class="card"' + show + '><h2><span class="n">' + (sec.badge || num) + '</span>' + esc(sec.title) + '<span class="emo" aria-hidden="true">' + emo(sec.title) + '</span></h2>';
    if (sec.intro) html += '<p class="intro">' + sec.intro + '</p>';
    sec.items.forEach(function (q) {
      if (q.type === 'info') { html += '<div class="info">' + q.html + '</div>'; return; }
      var name = q.id;
      html += '<div class="q" data-q="' + name + '"><div class="qt">' + esc(q.q) + (q.hint ? '<small>' + esc(q.hint) + '</small>' : '') + '</div>';
      if (q.type === 'single' || q.type === 'multi') {
        note(name, q.q);
        var t = q.type === 'single' ? 'radio' : 'checkbox';
        html += '<div class="opts' + (q.options.length > 6 ? ' cols' : '') + '">';
        q.options.forEach(function (o) {
          html += '<label class="opt"><input type="' + t + '" name="' + name + '" value="' + esc(o) + '"><span>' + esc(o) + '</span></label>';
        });
        html += '</div>';
        if (q.other) { note(name + '_other', q.q + ' (other)'); html += '<input type="text" name="' + name + '_other" maxlength="300" placeholder="' + esc(q.other) + '">'; }
      } else if (q.type === 'text') {
        note(name, q.q);
        html += '<textarea name="' + name + '" maxlength="4000" placeholder="' + esc(q.placeholder || 'Type as much or as little as you like') + '"></textarea>';
      } else if (q.type === 'short') {
        note(name, q.q);
        html += '<input type="text" name="' + name + '" maxlength="200" placeholder="' + esc(q.placeholder || '') + '">';
      } else if (q.type === 'scale') {
        var cols = q.labels || ['1', '2', '3', '4', '5'];
        var na = q.na !== false;
        html += '<table class="scale"><thead><tr><th></th>';
        cols.forEach(function (c) { html += '<th>' + esc(c) + '</th>'; });
        if (na) html += '<th>N/A</th>';
        html += '</tr></thead><tbody>';
        q.rows.forEach(function (r, ri) {
          var rn = name + '_' + (ri + 1);
          note(rn, (q.prefix ? q.prefix + ' ' : '') + r);
          html += '<tr><td>' + esc(r) + '</td>';
          cols.forEach(function (c, ci) { html += '<td data-l="' + esc(c) + '">' + pick(rn, ci + 1, c, r) + '</td>'; });
          if (na) html += '<td data-l="N/A">' + pick(rn, 'N/A', 'N/A', r) + '</td>';
          html += '</tr>';
        });
        html += '</tbody></table>';
        if (q.legend) html += '<p class="legend">' + esc(q.legend) + '</p>';
      }
      html += '</div>';
    });
    html += '</section>';
  });
  html += '<section class="card send" id="sendcard"><h2><span class="n">✓</span>Send it in</h2>' +
    '<p class="intro">Skip anything you don’t want to answer. Your answers save on this device as you go, so you can come back later and finish.</p>' +
    '<p class="cheer" id="cheer"></p><button class="btn" id="go" type="button">Send my anonymous survey 🚀</button>' +
    '<p class="err" id="err" hidden></p><p class="saved" id="saved"></p></section>' +
    '<section class="card done" id="done" hidden><div class="big">🎉</div><h2 style="justify-content:center">Thank you!</h2>' + S.thanks +
    '<p class="saved" id="previewnote" hidden>Preview copy: answers are only sent from the live page.</p>' +
    '<p id="againwrap" hidden style="margin-top:18px"><small>Using a shared or lab computer and haven’t taken it yet?</small><br>' +
    '<button class="btn" id="again" type="button" style="margin-top:8px;font-size:1rem;padding:10px 20px">Start a new survey</button></p></section>';
  root.innerHTML = html;

  var form = root;
  var fields = function () { return form.querySelectorAll('input,textarea'); };

  /* ---------- progress + autosave ---------- */
  function visible(el) { var sec = el.closest('section'); return !sec || !sec.hidden; }
  function conds() {
    [].forEach.call(form.querySelectorAll('section[data-show-q]'), function (sec) {
      var f = form.querySelector('input[name="' + sec.dataset.showQ + '"]:checked');
      var show = !!(f && f.value === sec.dataset.showV);
      if (show && sec.hidden) { sec.classList.remove('pop'); void sec.offsetWidth; sec.classList.add('pop'); }
      sec.hidden = !show;
    });
  }
  var qEls = form.querySelectorAll('.q');
  function answered(qe) {
    return [].some.call(qe.querySelectorAll('input,textarea'), function (f) {
      return (f.type === 'radio' || f.type === 'checkbox') ? f.checked : f.value.trim() !== '';
    });
  }
  function collect() {
    var a = {};
    fields().forEach(function (f) {
      if (!visible(f)) return;
      if (f.type === 'radio') { if (f.checked) a[f.name] = f.value; }
      else if (f.type === 'checkbox') { if (f.checked) (a[f.name] = a[f.name] || []).push(f.value); }
      else if (f.value.trim()) a[f.name] = f.value.trim();
    });
    return a;
  }
  function update() {
    conds();
    var vis = [].filter.call(qEls, visible);
    var n = vis.filter(answered).length;
    document.getElementById('pct').style.width = Math.round(100 * n / vis.length) + '%';
    document.getElementById('count').textContent = n + ' of ' + vis.length;
    var f = n / vis.length, cheer = document.getElementById('cheer');
    if (cheer) cheer.textContent = f >= 1 ? 'You answered everything! You’re a legend 🏆' : f >= .75 ? 'Almost there, you’ve got this! 💪' : f >= .5 ? 'Halfway done, nice work! 🌟' : f >= .25 ? 'Great start! Keep going 😄' : '';
  }
  var t;
  function save() {
    clearTimeout(t);
    t = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(collect())); document.getElementById('saved').textContent = 'Saved on this device ✓'; } catch (e) {}
    }, 400);
  }
  function restore() {
    var a; try { a = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (!a) return;
    fields().forEach(function (f) {
      var v = a[f.name]; if (v == null) return;
      if (f.type === 'radio') f.checked = v === f.value;
      else if (f.type === 'checkbox') f.checked = [].concat(v).indexOf(f.value) !== -1;
      else f.value = v;
    });
  }
  form.addEventListener('input', function () { update(); save(); });
  form.addEventListener('change', function () { update(); save(); });

  /* ---------- send ---------- */
  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var bits = ['🎉', '✨', '🧪', '⚛️', '💜', '🎊', '⭐', '🔬'];
    for (var i = 0; i < 40; i++) {
      var e = document.createElement('span'); e.className = 'confetti'; e.textContent = bits[i % bits.length];
      e.style.left = Math.random() * 100 + 'vw'; e.style.animationDuration = (2.2 + Math.random() * 2) + 's'; e.style.animationDelay = Math.random() * .6 + 's';
      document.body.appendChild(e); setTimeout(function (x) { x.remove(); }.bind(null, e), 5000);
    }
  }
  (function floaties() {
    var head = document.querySelector('.head'); if (!head) return;
    var box = document.createElement('div'); box.className = 'floaties'; box.setAttribute('aria-hidden', 'true');
    var bits = ['🧪', '⚛️', '🔬', '💡', '🧬', '✨', '⚗️', '📚'];
    var spots = [[4, 18], [14, 70], [86, 16], [93, 62], [72, 80], [60, 8], [30, 88], [78, 42]];
    spots.forEach(function (s, i) { var e = document.createElement('span'); e.textContent = bits[i]; e.style.left = s[0] + '%'; e.style.top = s[1] + '%'; e.style.animationDelay = (i * .7) + 's'; box.appendChild(e); });
    head.insertBefore(box, head.firstChild);
  })();
  function showDone() {
    [].forEach.call(form.querySelectorAll('section'), function (s) { s.hidden = s.id !== 'done'; });
    document.getElementById('done').hidden = false;
    document.getElementById('previewnote').hidden = LIVE;
    document.querySelector('.prog').hidden = true;
    scrollTo({ top: 0, behavior: 'smooth' });
  }
  document.getElementById('go').addEventListener('click', function () {
    var err = document.getElementById('err'); err.hidden = true;
    var a = collect();
    if (!Object.keys(a).length) { err.textContent = 'Answer at least one question before sending.'; err.hidden = false; return; }
    var payload = { type: 'survey', survey: S.id, course: S.course, term: S.term, order: ORDER, labels: LABELS, answers: a };
    var go = this; go.disabled = true; go.textContent = 'Sending…';
    function finish() {
      try { localStorage.removeItem(KEY); if (LIVE) localStorage.setItem(DONE, '1'); } catch (e) {}
      showDone(); confetti();
    }
    if (!LIVE) { console.log('[survey preview] not sent:', payload); return setTimeout(finish, 400); }
    fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
      .then(finish)
      .catch(function () {
        go.disabled = false; go.textContent = 'Send my anonymous survey 🚀';
        err.textContent = 'That didn’t send. Your answers are still saved here. Check your internet and tap Send again.'; err.hidden = false;
      });
  });

  /* Shared computers: a later visitor sees the thank-you screen, so let them start fresh. */
  document.getElementById('again').addEventListener('click', function () {
    try { localStorage.removeItem(DONE); localStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  });

  restore(); update();
  try { if (localStorage.getItem(DONE)) { showDone(); document.getElementById('againwrap').hidden = false; } } catch (e) {}
})();
