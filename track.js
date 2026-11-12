/* ItsDrDan study games: anonymous practice stats.
   Each game calls ddTrack({game, course, mode, topic, correct, slip}) once per question.
   slip (optional) names the kind of first mistake a mistake-catcher recognized (x1000, sign, 273, inverted, log-ln…).
   Multiple-choice games may also send item (the question's ID), pick (which answer choice was chosen,
   0-3 in the bank's stored order), key (which choice was correct) and ver (a short fingerprint of the
   question's wording). That lets Dr. Dan find individual questions that may be mis-keyed or confusing,
   for example when most students pick the same wrong answer.
   Sends no names, emails, student IDs, or typed answers, only which question or topic was practiced
   and which choice was picked, so Dr. Dan can see which topics and questions students find hardest.
   Honors "Do Not Track" / Global Privacy Control, and is off when a game is opened locally. */
(function () {
  if (window.ddTrack) return;
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbylSKoW9GE6AkN4HiC1uts3Y5Z4oUPHY7OQ88vXrjpcanooloYRTIGW9cS5n0dulp4vQg/exec';
  var off = false;
  try {
    off = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true ||
      !/\.github\.io$/.test(location.hostname) || ENDPOINT.indexOf('https://') !== 0;
  } catch (e) { off = true; }

  var sid = '';
  try { sid = sessionStorage.getItem('ddSid') || ''; } catch (e) {}
  if (!sid) { sid = Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem('ddSid', sid); } catch (e) {} }

  var source = 'direct';
  try {
    var ref = document.referrer || '';
    if (/instructure\.com|canvas/i.test(ref)) source = 'canvas';
    else if (/itsdrdan\.github\.io\/games/i.test(ref)) source = 'hub';
    else if (window.top !== window.self) source = 'embed';
  } catch (e) { source = 'embed'; }

  var queue = [], timer = null;
  function flush() {
    if (!queue.length) return;
    var body = JSON.stringify(queue.splice(0, 50));
    try { if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, body)) return; } catch (e) {}
    try { fetch(ENDPOINT, {method: 'POST', body: body, mode: 'no-cors', keepalive: true}); } catch (e) {}
  }
  window.ddTrack = function (ev) {
    if (off || !ev || !ev.game) return;
    try {
      queue.push({game: ev.game, course: ev.course || '', mode: ev.mode || '', topic: ev.topic || '',
        correct: ev.correct, tries: ev.tries || '', slip: ev.slip || '', session: sid, source: source,
        item: String(ev.item == null ? '' : ev.item).slice(0, 40),
        pick: (ev.pick === 0 || ev.pick > 0) ? Number(ev.pick) : '',
        key: (ev.key === 0 || ev.key > 0) ? Number(ev.key) : '',
        ver: String(ev.ver == null ? '' : ev.ver).slice(0, 12)});
      clearTimeout(timer);
      timer = setTimeout(flush, queue.length >= 10 ? 0 : 5000);
    } catch (e) {}
  };
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });
})();
