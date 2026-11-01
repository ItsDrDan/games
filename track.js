/* ItsDrDan study games: anonymous practice stats.
   Each game calls ddTrack({game, course, mode, topic, correct}) once per question.
   Sends no names, emails, student IDs, or typed answers, only which topic was practiced
   and whether the first try was right, so Dr. Dan can see which topics students find hardest.
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
        correct: ev.correct, tries: ev.tries || '', session: sid, source: source});
      clearTimeout(timer);
      timer = setTimeout(flush, queue.length >= 10 ? 0 : 5000);
    } catch (e) {}
  };
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });
})();
