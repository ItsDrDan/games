/* ChemParse v2 — shared number reading for ItsDrDan chemistry games (2026-11-14).
   v2 changes ONLY fmt (Dr. Dan, 2026-11-14): a regular number whenever it can carry the right sig figs
   (1230 to 3 sf is "1230", 380 is "380."); scientific notation only when a regular number cannot show the
   sig figs (6000 to 2 sf is 6.0 × 10³) or the number is very large (100,000 and up) or very small (below 0.001).
   ONE RULE: a published version is never edited. A change means a new file (chemparse.v2.js),
   tested with tools/check-chemparse.js and each game's own checker before any game switches to it.
   Load it WITHOUT defer, before the game's own script:
     <script src="https://itsdrdan.github.io/games/brand/chemparse.v2.js"></script>
   API (window.ChemParse):
     normalize(raw)       unicode minus/superscripts → ASCII, spaces removed, "×10^n" forms → "en"
     decimalComma(raw)    true for "2,5" (a decimal comma); false for thousands separators like "1,200"
     parseValue(raw)      Number, or NaN when it is not one plain number (decimal commas are NaN)
     sfCount(raw)         significant figures in what the student typed (0 if it is not a number)
     sfCloseMsg(raw, need, ans)  the house message for "math right, sig figs wrong" (HTML)
     notNumberMsg(raw, example)  the house message for input that is not a number (HTML)
     fmt(x, s)            a number shown to s sig figs: regular when it can be ("0.0472", "380.", "1230"), else "6.0 × 10³" */
(function (root) {
  'use strict';
  var SUPS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
  var TIMES = '[×xX*·⋅]';
  function base(raw) { return String(raw == null ? '' : raw).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g, function (c) { return SUPS[c]; }).replace(/[−–—‐]/g, '-').replace(/\s+/g, ''); }
  function decimalComma(raw) { var t = String(raw == null ? '' : raw).replace(/\s+/g, ''); return t.indexOf(',') >= 0 && !/^[+\-−–]?[1-9]\d{0,2}(,\d{3})+(\.\d*)?([eE×xX*·⋅].*)?$/.test(t); }   /* "1,200" is a thousands separator; "2,5" and "0,493" are decimal commas */
  function normalize(raw) { return base(raw).replace(/,/g, '').replace(new RegExp(TIMES + '10\\^?([+-]?\\d+)$'), 'e$1'); }
  function parseValue(raw) {
    if (decimalComma(raw)) return NaN;
    var t = normalize(raw);
    return /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(t) ? Number(t) : NaN;
  }
  function sfCount(raw) {
    if (decimalComma(raw)) return 0;
    var t = base(raw).replace(/,/g, '').replace(new RegExp('(?:' + TIMES + '10\\^?|[eE])[+-]?\\d+$'), '').replace(/^[+-]/, '');
    if (!/^(?:\d+\.?\d*|\.\d+)$/.test(t)) return 0;
    t = t.replace(/^0+(?=\d)/, '');
    if (/^0*\.?0*$/.test(t)) return Math.max(1, (t.split('.')[1] || '').length);   /* "0", "0.00" */
    if (t.indexOf('.') >= 0) return t.replace('.', '').replace(/^0+/, '').length;   /* leading zeros never count; trailing ones after a point do */
    return t.replace(/0+$/, '').length;                                             /* "1200" → 2: trailing zeros without a point do not count */
  }
  function sfCloseMsg(raw, need, ans) {
    var got = sfCount(raw);
    return '<b>Your math is right, but your significant figures are not.</b> ' + (got ? 'You entered <b>' + got + '</b> sig fig' + (got === 1 ? '' : 's') + '. ' : '') +
      'This answer needs <b>' + need + '</b>: <b>' + ans + '</b>. On a Skill Check or exam this would lose points, so fix it next time!';
  }
  function notNumberMsg(raw, example) {
    if (decimalComma(raw)) return 'Use a period for decimals: type <b>2.5</b>, not <b>2,5</b>.';
    return 'Enter one number' + (example ? ', such as ' + example : '') + ' (you may type 4.72E-2 for 4.72 × 10⁻²).';
  }
  function sup(n) { return String(n).replace(/[0-9-]/g, function (c) { return c === '-' ? '⁻' : '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]; }); }
  var BIG = 5, SMALL = -4;   /* 10^5 and up, or below 10^-3: always scientific notation */
  function sci(r, s) { var p = r.toExponential(s - 1).split('e'); return p[0] + ' × 10' + sup(Number(p[1])); }
  function fmt(x, s) {
    s = s || 3;
    if (!isFinite(x)) return '—';
    if (x === 0) return '0';
    var r = Number(x.toPrecision(s)), e = Math.floor(Math.log10(Math.abs(r)));
    if (e >= BIG || e <= SMALL) return sci(r, s);
    var fx = r.toFixed(Math.max(0, s - 1 - e));
    if (fx.indexOf('.') < 0 && sfCount(fx) !== s) {
      if (e + 1 === s) return fx + '.';      /* 380 to 3 sig figs is "380." */
      return sci(r, s);                       /* 6000 to 2 sig figs can only be 6.0 × 10³ */
    }
    return fx;
  }
  var api = { version: 2, normalize: normalize, decimalComma: decimalComma, parseValue: parseValue, sfCount: sfCount, sfCloseMsg: sfCloseMsg, notNumberMsg: notNumberMsg, fmt: fmt };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ChemParse = api;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
