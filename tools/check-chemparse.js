#!/usr/bin/env node
/* Tests brand/chemparse.v1.js. Run: node tools/check-chemparse.js
   Also compares it with the old copies it replaces (gaslaws, stoichiometry, moles) on thousands of
   generated inputs, so any change in what students' answers mean is listed, not hidden. */
const path = require('path'), fs = require('fs'), vm = require('vm');
const CP = require(path.join(__dirname, '..', 'brand', 'chemparse.v1.js'));
let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('FAIL', m); } };
const same = (a, b) => a === b || (Number.isNaN(a) && Number.isNaN(b)) || Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(b));

/* parseValue */
const P = {
  '2.5': 2.5, ' 2.5 ': 2.5, '-2.5': -2.5, '−2.5': -2.5, '–2.5': -2.5, '+3': 3, '.5': 0.5, '5.': 5, '0': 0,
  '4.10E2': 410, '4.10e-2': 0.041, '5.0E-3': 0.005, '4.10*10^2': 410, '4.10 x 10^2': 410, '4.10 X 10^-2': 0.041, '4.10×10⁻²': 0.041,
  '4.10 × 10⁻²': 0.041, '4.10·10^3': 4100, '4.10x10-3': 0.0041, '6.022×10²³': 6.022e23, '1,200': 1200, '12,500.5': 12500.5, '1,000,000': 1e6,
  '2,5': NaN, '0,25': NaN, '0,493': NaN, '0,250': NaN, '-0,500': NaN, '00,123': NaN, '-3,1': NaN, '1,00': NaN, '1,2345': NaN, '': NaN, 'abc': NaN, '2.5 g': NaN, '1/2': NaN, '2..5': NaN, '10^3': NaN, 'e5': NaN, '--2': NaN,
};
for (const [k, v] of Object.entries(P)) ok(same(CP.parseValue(k), v), `parseValue(${JSON.stringify(k)}) = ${CP.parseValue(k)}, want ${v}`);

/* sfCount */
const F = {
  '2.5': 2, '0.0025': 2, '0.00250': 3, '1200': 2, '1200.': 4, '1.200e3': 4, '1.200 × 10³': 4, '1.20×10^-3': 3, '100': 1, '100.0': 4, '0': 1, '0.0': 1, '0.00': 2,
  '-0.050': 2, '+7': 1, '1,200': 2, '6.022E23': 4, '.5': 1, '5.': 1, '2,5': 0, 'abc': 0, '': 0, '4.10x10-3': 3,
};
for (const [k, v] of Object.entries(F)) ok(CP.sfCount(k) === v, `sfCount(${JSON.stringify(k)}) = ${CP.sfCount(k)}, want ${v}`);

/* decimalComma */
for (const [k, v] of Object.entries({ '2,5': true, '0,25': true, '0,493': true, '001,000': true, '1,200': false, '12,500.5': false, '1,000,000': false, '2.5': false, '1,00': true, '-3,1': true, '1,200e3': false }))
  ok(CP.decimalComma(k) === v, `decimalComma(${k})`);

/* fmt: house style, and every shown answer reads back to itself with the right sig figs */
const FM = [[380, 3, '380.'], [1200, 3, '1.20 × 10³'], [1200, 2, '1.2 × 10³'], [760, 3, '760.'], [0.0472, 3, '0.0472'], [0.00012, 2, '1.2 × 10⁻⁴'], [123456, 3, '1.23 × 10⁵'],
  [99999, 3, '1.00 × 10⁵'], [2.5, 2, '2.5'], [0, 3, '0'], [-0.5, 3, '-0.500'], [1, 3, '1.00'], [100, 1, '1 × 10²'], [100, 3, '100.'], [6.022e23, 4, '6.022 × 10²³']];
for (const [x, s, want] of FM) ok(CP.fmt(x, s) === want, `fmt(${x}, ${s}) = ${CP.fmt(x, s)}, want ${want}`);
for (let i = 0; i < 20000; i++) {
  const s = 1 + (i % 5), x = (Math.random() < .5 ? -1 : 1) * Math.pow(10, Math.random() * 14 - 7) * (1 + Math.random() * 9), shown = CP.fmt(x, s);
  ok(CP.sfCount(shown) === s || Number(shown) === 0, `fmt(${x}, ${s}) = ${shown} has ${CP.sfCount(shown)} sig figs`);
  ok(Math.abs(CP.parseValue(shown) - Number(x.toPrecision(s))) <= 1e-9 * Math.abs(x), `fmt(${x}, ${s}) = ${shown} does not read back`);
}
ok(/period for decimals/.test(CP.notNumberMsg('2,5')) && /0\.0472/.test(CP.notNumberMsg('x', '0.0472')), 'notNumberMsg');
ok(/needs <b>3<\/b>/.test(CP.sfCloseMsg('2.5', 3, '2.50')) && /entered <b>2<\/b> sig figs/.test(CP.sfCloseMsg('2.5', 3, '2.50')), 'sfCloseMsg');

/* compare with the old copies, if the game repos sit next to this one */
const GH = path.join(__dirname, '..', '..'), OLD = process.argv[2]; /* optional: a folder of the old parser copies (one .js per game) to compare against */
function oldCopy(repo, names, pre) {
  const f = path.join(GH, repo, 'index.html'); if (!fs.existsSync(f)) return null;
  const s = fs.readFileSync(path.join(OLD, repo + '.js'), 'utf8');
  const ctx = {}; vm.createContext(ctx); vm.runInContext(s + '\nthis.f={' + names.join(',') + '};', ctx); return ctx.f;
}
const inputs = new Set(Object.keys(P).concat(Object.keys(F)));
const pieces = ['', '0', '00', '1', '2', '5', '9', '.', ',', '-', '−', 'e', 'E', 'e-', ' ', '×10^', '×10⁻', 'x10^-', '*10^', '·10^', '³', '²³'];
for (let i = 0; i < 40000; i++) { let t = ''; const n = 1 + Math.floor(Math.random() * 7); for (let k = 0; k < n; k++) t += pieces[Math.floor(Math.random() * pieces.length)]; inputs.add(t); }
const diffs = {};
for (const [repo, pv, sf] of [['gaslaws', 'parseValue', 'sfRange'], ['stoichiometry', 'parseValue', 'sfCount'], ['moles', 'parseValue', 'sfCount']]) {
  if (!OLD || !fs.existsSync(path.join(OLD, repo + '.js'))) continue;
  const o = oldCopy(repo, [pv, sf]); if (!o) continue; const d = diffs[repo] = { parse: [], sf: [] };
  for (const t of inputs) {
    const a = o[pv](t), b = CP.parseValue(t); if (!same(a, b)) d.parse.push([t, a, b]);
    let c = o[sf](t); if (Array.isArray(c)) c = c[0]; if (c !== CP.sfCount(t) && !Number.isNaN(b)) d.sf.push([t, c, CP.sfCount(t)]);
  }
}
for (const [repo, d] of Object.entries(diffs)) {
  const kinds = {}; for (const [t, a, b] of d.parse) { const k = /,/.test(t) ? 'decimal comma now rejected' : /[·X⋅]/.test(t) ? '· or X as times now accepted' : 'other'; (kinds[k] = kinds[k] || []).push(JSON.stringify(t) + ' ' + a + '→' + b); }
  console.log(`${repo}: ${d.parse.length} inputs read differently, ${d.sf.length} sig-fig counts differ (of ${inputs.size})`);
  for (const [k, v] of Object.entries(kinds)) console.log('   ' + k + ': ' + v.length + (k === 'other' ? '  e.g. ' + v.slice(0, 6).join(' | ') : ''));
  if (d.sf.length) console.log('   sig figs e.g. ' + d.sf.slice(0, 6).map(x => JSON.stringify(x[0]) + ' ' + x[1] + '→' + x[2]).join(' | '));
  ok(!kinds.other, repo + ': unexplained parse differences');
}
console.log(`${checks} checks: ${fails ? fails + ' FAILED' : 'all passed'}`); process.exit(fails ? 1 : 0);
