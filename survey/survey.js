/* ItsDrDan end-of-semester survey engine.
   Each course page sets window.SURVEY = {...} and loads this file.
   Answers save as the student types (localStorage on their own device) and are sent ONCE to the
   Google Apps Script web app in ENDPOINT (see survey-apps-script.gs). No names, emails, or IDs are collected. */
(function () {
  'use strict';
  var ENDPOINT = ''; /* paste the Apps Script web app URL (ends in /exec) here after deploying survey-apps-script.gs */
  var S = window.SURVEY;
  var LIVE = /\.github\.io$/.test(location.hostname) && ENDPOINT.indexOf('https://') === 0;
  var KEY = 'ddSurvey:' + S.id, DONE = KEY + ':sent';
  var root = document.getElementById('survey');
  document.documentElement.style.setProperty('--c', S.color);
  document.documentElement.style.setProperty('--cb', S.colorBg);

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40); }

  var LABELS = {}; /* id -> question text, in page order, for the sheet's header row */
  var ORDER = [];
  function note(id, label) { if (!LABELS[id]) { LABELS[id] = label; ORDER.push(id); } }

  /* ---------- build ---------- */
  var html = '';
  S.sections.forEach(function (sec, si) {
    html += '<section class="card"><h2><span class="n">' + (si + 1) + '</span>' + esc(sec.title) + '</h2>';
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
          cols.forEach(function (c, ci) { html += '<td data-l="' + esc(c) + '"><input type="radio" name="' + rn + '" value="' + (ci + 1) + '" aria-label="' + esc(r + ': ' + c) + '"></td>'; });
          if (na) html += '<td data-l="N/A"><input type="radio" name="' + rn + '" value="N/A" aria-label="' + esc(r + ': not applicable') + '"></td>';
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
    '<button class="btn" id="go" type="button">Send my anonymous survey →</button>' +
    '<p class="err" id="err" hidden></p><p class="saved" id="saved"></p></section>' +
    '<section class="card done" id="done" hidden><div class="big">💜</div><h2 style="justify-content:center">Thank you!</h2>' + S.thanks +
    '<p class="saved" id="previewnote" hidden>Preview copy: answers are only sent from the live page.</p></section>';
  root.innerHTML = html;

  var form = root;
  var fields = function () { return form.querySelectorAll('input,textarea'); };

  /* ---------- progress + autosave ---------- */
  var qEls = form.querySelectorAll('.q');
  function answered(qe) {
    return [].some.call(qe.querySelectorAll('input,textarea'), function (f) {
      return (f.type === 'radio' || f.type === 'checkbox') ? f.checked : f.value.trim() !== '';
    });
  }
  function collect() {
    var a = {};
    fields().forEach(function (f) {
      if (f.type === 'radio') { if (f.checked) a[f.name] = f.value; }
      else if (f.type === 'checkbox') { if (f.checked) (a[f.name] = a[f.name] || []).push(f.value); }
      else if (f.value.trim()) a[f.name] = f.value.trim();
    });
    return a;
  }
  function update() {
    var n = [].filter.call(qEls, answered).length;
    document.getElementById('pct').style.width = Math.round(100 * n / qEls.length) + '%';
    document.getElementById('count').textContent = n + ' of ' + qEls.length;
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
      showDone();
    }
    if (!LIVE) { console.log('[survey preview] not sent:', payload); return setTimeout(finish, 400); }
    fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
      .then(finish)
      .catch(function () {
        go.disabled = false; go.textContent = 'Send my anonymous survey →';
        err.textContent = 'That didn’t send. Your answers are still saved here. Check your internet and tap Send again.'; err.hidden = false;
      });
  });

  restore(); update();
  try { if (localStorage.getItem(DONE)) showDone(); } catch (e) {}
})();
