/* Daily 5 — five questions a day from the shared question bank, for whichever class you're in.
   Picks chapters you've missed lately, haven't seen, or are in this week; keeps one day streak that the
   study games share (localStorage key "itsdrdan-daily-streak", same origin for every game).
   Uses: h(), courseById, COURSE_ORDER, remember/recall, sylCourse/sylWeekNow/matchChapter, HUB_NOW from index.html;
   QB from questionbank/qb.js; ddTrack from track.js. Nothing here sends names or typed answers anywhere. */
(function () {
  const STREAK_KEY = 'itsdrdan-daily-streak', STATE_KEY = 'hub-daily', CH_KEY = 'hub-daily-chapters', SEEN_KEY = 'hub-daily-seen';
  const TYPES = ['mc', 'number', 'text'];
  const dayKey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const today = () => dayKey(new Date()), yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };
  const load = (k, fb) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? fb; } catch { return fb; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const loadSeen = () => { const s = load(SEEN_KEY, []); return Array.isArray(s) ? s : []; };   // a non-array (corrupted) value would break .concat
  /* styles for the Canvas card (embed mode) and stacked fractions in bank items; and, when iframed, brand/embed.js so Canvas sizes the frame */
  try {
    const css = document.createElement('style');
    css.textContent = '.daily-kicker{display:none;font-size:.78rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#b0466e}body.embed .daily-kicker{display:block}' +
      '.daily-weeknote{margin:2px 0 0;color:var(--muted);font-size:.92rem}.daily-growth{color:#7a4f9e;font-weight:700;font-style:italic}body.embed .daily-title h1{font-size:1.3rem}.daily-allgames{align-self:center}' +
      '.daily .fraction{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 .2em;line-height:1.25}.daily .fraction .num{border-bottom:2px solid currentColor;padding:0 .3em .1em}.daily .fraction .den{padding:.1em .3em 0}' +
      '.daily-level{font-size:.78rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;padding:3px 10px;border-radius:999px;border:1.5px solid}.daily-level.easy{background:#e6f7ee;color:#1f7a50;border-color:#9fdcbd}.daily-level.medium{background:#fff8e6;color:#94650b;border-color:#ffd59a}.daily-level.hard{background:#fde4ec;color:#a3365f;border-color:#f2a2bd}' +
      'body.embed .daily{background:linear-gradient(135deg,#fde4ec,#e3f4ee);border:2px solid #24473f;border-radius:20px;padding:4px 14px 14px;margin:2px auto 4px;box-sizing:border-box}';
    document.head.append(css);
    if (window.parent !== window && !document.querySelector('script[src*="brand/embed.js"]')) { const sc = document.createElement('script'); sc.src = 'brand/embed.js'; sc.defer = true; document.head.append(sc); }
  } catch {}
  /* embedded (?embed=1, e.g. the Daily 5 on 3b.html or a Canvas card): hub links open the full hub in a new tab so the
     page the student started on stays put; the back button returns to that page (passed in as &back=URL&backname=…) */
  const EMBED = new URLSearchParams(location.search).get('embed') === '1';
  const hubLink = (hash, cid) => EMBED ? {href: './?course=' + cid + hash, target: '_blank', rel: 'noopener'} : {href: hash};
  function safeBack(u) { try { const x = new URL(u, location.href); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch { return ''; } }
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));


  /* ---- stacked scripts: mass number over atomic number (²³⁴₉₂U, <span class="ss pre">…), and a charge over a subscript (PO³⁻₄) ---- */
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻', SUB = '₀₁₂₃₄₅₆₇₈₉₊₋', PLAIN = '0123456789+−';
  const plain = (t, set) => [...t].map(c => { const i = set.indexOf(c); return i < 0 ? c : PLAIN[i]; }).join('');
  const PRE_U = /(^|[\s(\[>"'→⟶+,;:=\/])([⁰¹²³⁴⁵⁶⁷⁸⁹]+m?)([₊₋]?[₀₁₂₃₄₅₆₇₈₉]+)(?=[A-Za-zαβγ])/g;
  const POST_U = /([A-Za-z)\]])([⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻])([₀₁₂₃₄₅₆₇₈₉]+)/g;
  const PRE_H = /(^|[\s(\[>"'→⟶+,;:=\/])<sup>(\d+m?)<\/sup>\s*<sub>([+−-]?\d+)<\/sub>(?=[A-Za-zαβγ])/g;
  function stack(html) {
    if (html == null) return html;
    return String(html).split(/(<[^>]*>)/).map(part => part.startsWith('<') ? part : part
      .replace(PRE_U, (m, b, a, z) => b + '<span class="ss pre"><sup>' + plain(a, SUP) + '</sup><sub>' + plain(z, SUB) + '</sub></span>')
      .replace(POST_U, (m, b, c, n) => b + '<span class="ss"><sup>' + plain(c, SUP) + '</sup><sub>' + plain(n, SUB) + '</sub></span>')
    ).join('').replace(PRE_H, (m, b, a, z) => b + '<span class="ss pre"><sup>' + a + '</sup><sub>' + z + '</sub></span>');
  }
  window.ddStack = stack;

  /* ---- shared day streak (any ItsDrDan game may call these) ---- */
  function streak() { const s = load(STREAK_KEY, {}); if (s.last && s.last !== today() && s.last !== yesterday()) return {...s, streak: 0}; return {streak: 0, best: 0, ...s}; }
  function streakDone() { const s = streak(); if (s.last === today()) return s; s.streak = s.last === yesterday() ? (s.streak || 0) + 1 : 1; s.last = today(); s.best = Math.max(s.best || 0, s.streak); s.days = Object.assign({}, s.days, {[today()]: 1}); const keep = Object.keys(s.days).sort().slice(-60); s.days = Object.fromEntries(keep.map(k => [k, 1])); save(STREAK_KEY, s); return s; }
  window.ddDaily = {streak, done: streakDone, today};

  /* ---- which chapter is the class on right now (same reading as the "This week" card) ---- */
  function currentChapter(cid) {
    try {
      const c = courseById[cid], now = (window.HUB_NOW || {})[cid], sc = sylCourse(cid);
      const fresh = now && (Date.now() - new Date(now.updated + 'T12:00:00').getTime()) < 21 * 864e5;
      if (fresh && now.lecture?.ch) return c.chapters.find(x => x.id === now.lecture.ch) || null;
      const wn = sylWeekNow(sc); if (!wn || wn.before || wn.after) return null;
      const wk = sc?.weeks?.find(w => w.week === wn.n); const t = wk?.lecture?.replace(/\s*\|\s*/g, ' ');
      return t ? matchChapter(cid, t) : null;
    } catch { return null; }
  }

  /* a question that points at a table or figure it doesn't carry can't be shown here */
  const NEEDS_VISUAL = /((in|from|use|using) the (table|graph|figure|diagram|image)\b|schematic graph|the (table|graph|figure|diagram|image) (shows|below|above)|shown (above|below))/i;
  function usable(q) { const p = String(q.prompt || ''); if (!p.trim()) return false; if (NEEDS_VISUAL.test(p) && !/<(table|svg|img)/i.test(p)) return false; if (q.type === 'mc' && (!q.choices || q.choices.length < 2)) return false; return true; }

  /* ---- planned mix for the Canvas card (data/now.js daily.mix): a few questions from each listed topic ---- */
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const fmtF = s => String(s).replace(/([A-Za-z)\]])(\d+)/g, '$1<sub>$2</sub>');      // O2 → O<sub>2</sub>
  const SIMPLE_CATS = ['Combination', 'Decomposition', 'Single displacement', 'Double displacement', 'Combustion'];
  /* Reaction Rumble items (type "reaction") become multiple choice: name the reaction type, or pick the balanced equation */
  function reactionToMC(q, mode) {
    const d = q.data || {}; if (!d.r || !d.p || !d.coef) return null;
    const sp = d.r.concat(d.p), st = d.states || {};
    const eq = (co, states) => { const side = (list, off) => list.map((f, i) => (co[off + i] > 1 ? co[off + i] + ' ' : '') + fmtF(f) + (states && st[f] ? '(' + st[f] + ')' : '')).join(' + '); return side(d.r, 0) + ' → ' + side(d.p, d.r.length); };
    const right = eq(d.coef, true);
    if (SIMPLE_CATS.includes(d.cat) && (mode === 'type' || (mode !== 'balance' && Math.random() < 0.5))) {
      const burn = d.cat === 'Combination' && d.r.includes('O2');   // element + O2 is also a combustion: never offer Combustion as a 'wrong' choice
      const choices = [d.cat].concat(shuffle(SIMPLE_CATS.filter(x => x !== d.cat && !(burn && x === 'Combustion'))).slice(0, 3));
      return {...q, type: 'mc', prompt: 'What type of reaction is this?<br><b>' + right + '</b>', choices, answer: d.cat, explain: q.hint || ''};
    }
    if (mode === 'type') return null;   // asked for name-the-type only, and this one isn't a simple type
    const wrong = new Set(), key = co => co.join(',');
    const ones = sp.map(() => 1); if (key(ones) !== key(d.coef)) wrong.add(key(ones));
    for (let t = 0; t < 40 && wrong.size < 3; t++) { const co = d.coef.slice(), i = Math.floor(Math.random() * co.length); co[i] = Math.max(1, co[i] + (Math.random() < .5 ? 1 : -1)); if (key(co) !== key(d.coef)) wrong.add(key(co)); }
    if (wrong.size < 3) return null;
    const choices = [right].concat([...wrong].slice(0, 3).map(k => eq(k.split(',').map(Number), true)));
    return {...q, type: 'mc', prompt: 'Predict the products. Which equation is correct <b>and</b> balanced?<br>' + d.r.map(fmtF).join(' + ') + ' → ?', choices, answer: right, explain: q.hint || ''};
  }
  /* simple molarity (M = mol ÷ L), made fresh each time */
  const SOLUTES = [['NaCl', 58.44], ['NaOH', 40.00], ['KCl', 74.55], ['C6H12O6', 180.16], ['CaCl2', 110.98], ['KNO3', 101.10], ['MgCl2', 95.21]];
  const r3 = x => Number(x.toPrecision(3));
  function genMolarity() {
    const [f, mm] = pick(SOLUTES), F = fmtF(f), id = 'gen-molarity-' + Math.random().toString(36).slice(2, 8), chart = `<br><small>Molar mass of ${F} = ${mm} g mol⁻¹</small>`;
    const kind = Math.floor(Math.random() * 3);
    if (kind === 0) { const mol = r3(0.05 + Math.random() * 0.9), L = r3(0.1 + Math.random() * 1.9);
      return {id, type: 'number', unit: 'M', prompt: `${mol} mol of ${F} is dissolved in enough water to make ${L} L of solution. What is the molarity?`, answer: mol / L, tolerance: .015, hint: 'Molarity = moles of solute ÷ liters of solution.', explain: `M = ${mol} mol ÷ ${L} L`}; }
    if (kind === 1) { const g = r3(1 + Math.random() * 40), mL = Math.round(100 + Math.random() * 400) / 1;
      return {id, type: 'number', unit: 'M', prompt: `${g} g of ${F} is dissolved in enough water to make ${mL}. mL of solution. What is the molarity?${chart}`, answer: (g / mm) / (mL / 1000), tolerance: .015, hint: 'Grams → moles (÷ molar mass), mL → L (÷ 1000), then moles ÷ liters.', explain: `(${g} g ÷ ${mm} g mol⁻¹) ÷ ${mL / 1000} L`}; }
    const M = r3(0.05 + Math.random() * 1.45), mL = Math.round(50 + Math.random() * 450);
    return {id, type: 'number', unit: 'g', prompt: `How many grams of ${F} are needed to make ${mL}. mL of a ${M} M ${F} solution?${chart}`, answer: M * (mL / 1000) * mm, tolerance: .015, hint: 'Moles = M × L, then grams = moles × molar mass.', explain: `${M} mol/L × ${mL / 1000} L × ${mm} g mol⁻¹`};
  }
  /* name-that-noble-gas (PV = nRT, then g ÷ mol), made fresh each time; numbers chosen so the gas is clear */
  const NOBLE = [['He', 4.003, 'helium'], ['Ne', 20.18, 'neon'], ['Ar', 39.95, 'argon'], ['Kr', 83.80, 'krypton'], ['Xe', 131.29, 'xenon']];
  function genNobleGas() {
    const [sym, mm, name] = pick(NOBLE), id = 'gen-noblegas-' + Math.random().toString(36).slice(2, 8);
    const P = r3(0.5 + Math.random() * 2.5), V = r3(1 + Math.random() * 4), tC = Math.round(10 + Math.random() * 30), T = tC + 273.15;
    const n = P * V / (0.08206 * T), g = r3(n * mm);
    const choices = NOBLE.map(x => x[2][0].toUpperCase() + x[2].slice(1) + ' (' + x[0] + ')');
    return {id, type: 'mc', prompt: `A ${V} L sealed container holds ${g} g of a noble gas at ${tC} °C and ${P} atm. Which noble gas is it?<br><small>R = 0.08206 L·atm·mol⁻¹·K⁻¹ · K = °C + 273.15</small>`,
      choices, answer: choices[NOBLE.findIndex(x => x[0] === sym)], hint: 'Find moles with n = PV ÷ RT (temperature in K), then molar mass = grams ÷ moles. Match it on the periodic table.',
      explain: `n = (${P} atm)(${V} L) ÷ [(0.08206)(${T.toFixed(2)} K)] = ${n.toPrecision(3)} mol; ${g} g ÷ ${n.toPrecision(3)} mol = ${(g / n).toPrecision(3)} g mol⁻¹ → ${name}`};
  }
  const GENS = {molarity: genMolarity, noblegas: genNobleGas};
  /* a mix group is {ch, n, skills?, gen?, diff?, calc?, level?} or {n, level?, pool:[{ch, skills?, gen?, diff?, calc?}, …]}.
     pool: one option is picked at random each day (next one tried if it has nothing usable).
     diff: only bank items with these difficulty tags (1 easy, 2 medium, 3 hard; Final Boss items carry them).
     calc:false: only items marked as not needing a calculator.  rx:'type'|'balance': how Reaction Rumble items are asked.
     match: a pattern the prompt text must contain (e.g. 'molar mass'), to pick one kind of item out of a skill.  level: 'easy' | 'medium' | 'hard', shown on the card.
     Groups are served in the order listed, so a 2 easy → 2 medium → 1 hard plan stays in that order. */
  const LEVELS = {easy: 'Warm-up', medium: 'Medium', hard: 'Challenge'};
  function normMix(c, mix) {
    const has = id => c.chapters.some(x => x.id === id);
    return (mix || []).map(g => {
      const n = Math.max(1, Math.min(5, g.n || 1));
      if (Array.isArray(g.pool)) { const pool = g.pool.map(a => ({...a, ch: String(a.ch)})).filter(a => has(a.ch)); return pool.length ? {...g, n, pool} : null; }
      return has(String(g.ch)) ? {...g, ch: String(g.ch), n} : null;
    }).filter(Boolean);
  }
  const mixChapters = mix => [...new Set(mix.flatMap(g => g.pool ? g.pool.map(a => a.ch) : [g.ch]))];
  async function fetchGroup(cid, c, g, n, seen) {
    const ch = c.chapters.find(x => x.id === g.ch); if (!ch) return [];
    const tag = q => ({...q, ch: ch.id, chLabel: ch.label, chTitle: ch.title});
    if (g.gen && GENS[g.gen]) { const out = []; for (let i = 0; i < n; i++) out.push(tag(GENS[g.gen]())); return out; }
    const filtered = !!(g.diff || g.calc === false || g.match), rx = g.match ? new RegExp(g.match, 'i') : null;
    const opts = {course: cid, chapters: [cid + '-' + g.ch], types: TYPES.concat('reaction'), n: filtered ? 400 : 40}; if (g.skills) opts.skills = g.skills;
    const keep = q => q && usable(q) && (!g.diff || g.diff.includes(q.difficulty)) && (g.calc !== false || q.calc !== true) && (!rx || rx.test(String(q.prompt).replace(/<[^>]+>/g, '')));
    const prep = list => list.map(q => q.type === 'reaction' ? reactionToMC(q, g.rx) : q).filter(keep);
    let qs = prep(await QB.get({...opts, exclude: seen})); if (qs.length < n) qs = prep(await QB.get(opts));
    return shuffle(qs).slice(0, n).map(tag);
  }
  async function pickMix(cid, mix) {
    const c = courseById[cid], seen = loadSeen(), out = [];
    for (const g of mix) {
      const options = g.pool ? shuffle(g.pool) : [g];
      let got = [];
      for (const a of options) { got = await fetchGroup(cid, c, a, g.n, seen.concat(out.map(q => q.id))); if (got.length >= g.n) break; }
      got.forEach(q => out.push(g.level ? {...q, level: g.level} : q));
    }
    return out.length ? out.slice(0, 5) : null;
  }

  /* ---- choose five chapters, then one fresh question from each ---- */
  async function pickQuestions(cid, only, focus, mix) {
    if (mix && mix.length) { const m = await pickMix(cid, mix); if (m) return m; }
    const c = courseById[cid], index = await QB.index(); if (!index) return null;
    only = only || [];
    const covered = ch => Object.values(index.chapters[cid + '-' + ch.id] || {}).reduce((a, b) => a + b, 0) > 0;
    let chs = c.chapters.filter(covered).filter(ch => !only.length || only.includes(ch.id)); if (!chs.length) return null;
    /* focus: a fixed number of questions from one chapter (optionally only some skills), the rest from the other chapters */
    const lead = [];
    if (focus) {
      const fch = c.chapters.find(x => x.id === focus.ch), seen0 = loadSeen();
      const opts = {course: cid, chapters: [cid + '-' + focus.ch], types: TYPES, n: 30}; if (focus.skills) opts.skills = focus.skills;
      let qs = (await QB.get({...opts, exclude: seen0})).filter(usable); if (qs.length < focus.n) qs = (await QB.get(opts)).filter(usable);
      for (const q of shuffle(qs).slice(0, focus.n)) lead.push({...q, ch: fch.id, chLabel: fch.label, chTitle: fch.title});
      const rest = chs.filter(ch => ch.id !== focus.ch); if (rest.length) chs = rest;
      if (lead.length >= 5) return lead;
    }
    const want = 5 - lead.length;
    const cur = currentChapter(cid), curIdx = cur ? chs.indexOf(cur) : -1, hist = load(CH_KEY, {}), now = Date.now(), day = 864e5;
    const scored = chs.map((ch, i) => {
      const k = cid + '-' + ch.id, p = hist[k] || {}; let s = 1;
      const future = curIdx >= 0 && i > curIdx && ch.id !== 'review' && ch.id !== 'ready';
      if (curIdx >= 0 && i === curIdx) s += 5;
      if (p.miss && (now - p.miss) / day < 7) s += 4;
      if (!p.seen) s += 2; else if ((now - p.seen) / day > 7) s += 2; else if ((now - p.seen) / day < 0.5) s -= 0.5;
      if (ch.id === 'ready') s += 2;
      if (future) s = p.miss && (now - p.miss) / day < 7 ? 1 : 0.01; // not taught yet: almost never, unless it was missed before
      return [ch, Math.max(0.01, s)];
    });
    const picked = [];
    while (picked.length < want && scored.length) { const total = scored.reduce((n, [, s]) => n + s, 0); let r = Math.random() * total, i = 0; for (; i < scored.length; i++) { r -= scored[i][1]; if (r <= 0) break; } i = Math.min(i, scored.length - 1); picked.push(scored[i][0]); scored.splice(i, 1); }
    const seen = loadSeen().concat(lead.map(q => q.id)), out = lead.slice();
    for (const ch of picked) {
      let qs = (await QB.get({course: cid, chapters: [cid + '-' + ch.id], types: TYPES, exclude: seen, n: 12})).filter(usable);
      if (!qs.length) qs = (await QB.get({course: cid, chapters: [cid + '-' + ch.id], types: TYPES, n: 12})).filter(usable);
      if (qs.length) out.push({...qs[0], ch: ch.id, chLabel: ch.label, chTitle: ch.title});
    }
    // top up from any chapter if a chapter had nothing shareable
    if (out.length < 5) { const more = (await QB.get({course: cid, chapters: only.length ? chs.map(ch => cid + '-' + ch.id) : undefined, types: TYPES, exclude: seen.concat(out.map(q => q.id)), n: 40})).filter(usable).slice(0, 5 - out.length); for (const q of more) { const ch = chs.find(x => (q.chapters || []).includes(cid + '-' + x.id)) || chs[0]; out.push({...q, ch: ch.id, chLabel: ch.label, chTitle: ch.title}); } }
    return out.length ? out : null;
  }

  /* ---- grading, with the mistake catchers from Bridge to 1B ---- */
  function parseNum(s) { s = String(s).replace(/[−]/g, '-').replace(/[,\s]/g, '').replace(/[×x*]10\^?([+-]?\d+)$/i, 'e$1'); return /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(s) ? Number(s) : NaN; }
  function slipFor(q, raw) {
    if (q.type !== 'number') return '';
    const x = parseNum(raw), a = Number(q.answer); if (!isFinite(x) || !isFinite(a) || a === 0) return '';
    const near = (p, v, tol = .006) => Math.abs(p - v) <= Math.max(Math.abs(v) * tol, 1e-12), r = x / a, u = String(q.unit || '');
    if (near(x, a, .05)) return 'close';
    if (near(r, -1)) return 'sign';
    if (near(r, 1000) || near(r, .001)) return /J/.test(u) ? 'kJ-J' : /mol|L/.test(u) ? 'mL-L' : 'x1000';
    if (/K|°C/.test(u) && (near(x, a + 273.15, .002) || near(x, a - 273.15, .002))) return '273';
    if (!near(a, 1) && near(x * a, 1)) return 'inverted';
    for (const n of [1, 2, 4, 5, 6]) if (near(r, 10 ** n) || near(r, 10 ** -n)) return 'power10';
    for (const k of [2, .5, 3, 1 / 3, 4, .25]) if (near(r, k)) return 'ratio';
    return '';
  }
  function fmtSig(a, n) { const t = a.toPrecision(n); return /e/.test(t) ? t.replace(/e([+-]?)(\d+)/, (m, sg, d) => ' × 10^' + (sg === '-' ? '-' : '') + Number(d)) : t; }
  const SLIP_TEXT = {sigfigs: 'Right value, wrong number of significant figures.', close: 'Very close: rounding drifted. Keep extra digits until the last step.', sign: 'Right size, wrong sign. Check the direction.', 'kJ-J': 'Off by a factor of 1000: J vs kJ.', 'mL-L': 'Off by a factor of 1000: mL ↔ L (or mmol ↔ mol).', x1000: 'Off by a factor of 1000 (10³). Check the exponent; use the EE key.', 273: 'Off by 273: convert between °C and K.', inverted: 'Looks inverted (1 ÷ the right answer). Check what is on top and bottom.', power10: 'Off by a power of ten. Check the exponent.', ratio: 'Off by a simple factor: a coefficient or mole ratio was probably skipped or flipped.'};

  /* ---- growth & learning messages: every Daily 5 (all courses) shows one of these, a new one each day.
     Everyone sees the same message on the same day. Quotes are kept to well-documented ones; add or remove freely. ---- */
  const GROWTH = [
    'Practicing is the fastest way to growth.',
    '“Chance favors only the prepared mind.” — Louis Pasteur',
    'Five minutes a day beats five hours the night before.',
    'Confused is just the step before understanding.',
    '“Nothing in life is to be feared, it is only to be understood.” — Marie Curie',
    'Every mistake you fix today is one you won’t make on the exam.',
    '“There’s no shortcuts. You gotta do the work.” — José Hernández, astronaut who grew up picking crops in the San Joaquin Valley',
    'Progress, not perfection.',
    '“If I have seen further, it is by standing on the shoulders of giants.” — Isaac Newton',
    'Getting it wrong is how your brain learns to get it right.',
    'Small steps every day add up to big results.',
    '“I learned very early the difference between knowing the name of something and knowing something.” — Richard Feynman',
    'Mistakes are data. Scientists love data.',
    '“¡Sí, se puede!” (Yes, it can be done!) — Dolores Huerta',
    'You don’t have to be fast. You just have to keep going.',
    '“The best way to have a good idea is to have lots of ideas.” — Linus Pauling',
    'Today’s practice is tomorrow’s confidence.',
    'Being stuck is part of learning. That’s what the hint is for.',
    '“Never be limited by other people’s limited imaginations.” — Mae Jemison',
    'Every expert was once a beginner.',
    'Don’t just get the answer. Understand the why.',
    '“Anything that’s worth doing takes hard work.” — Ellen Ochoa, first Latina astronaut',
    '“Do the best you can until you know better. Then when you know better, do better.” — Maya Angelou',
    'Consistency beats cramming.',
    'A streak starts with one day. Today counts.',
    'Curiosity is the first step in every discovery.',
    'Hard problems build strong brains.',
    '“Persevere. Never give up!” — José Hernández, rejected by NASA 11 times before he was selected',
    'Your future self will thank you for today’s practice.',
    'Units are your friends. Follow them and they’ll lead you to the answer.',
    'You can do hard things.',
    'Keep going. You’re closer than you think.'
  ];
  function growthMessage(d = new Date()) { const n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); return GROWTH[n % GROWTH.length]; }

  /* ---- the page ---- */
  const cal = '<svg viewBox="0 0 48 48" aria-hidden="true" width="34" height="34"><rect x="7" y="10" width="34" height="32" rx="6" fill="#fff" stroke="#24473f" stroke-width="2.4"/><path d="M7 19h34" stroke="#24473f" stroke-width="2"/><rect x="8.2" y="11.2" width="31.6" height="7" rx="4" fill="#f2a2bd"/><path d="M15 6v8M33 6v8" stroke="#24473f" stroke-width="2.6" stroke-linecap="round"/><text x="24" y="37" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="15" fill="#24473f">5</text></svg>';
  function streakLine(s) { return s.streak ? `🔥 ${s.streak}-day streak` + (s.best > s.streak ? ` · best ${s.best}` : '') : 'Start a streak today'; }

  function courseChips(cid) { return h('div', {class: 'daily-courses'}, COURSE_ORDER.map(id => h('a', {class: 'chip' + (id === cid ? ' on' : ''), 'data-course': id, href: '#/daily/' + id, 'aria-current': id === cid ? 'true' : null}, 'CHEM ' + id))); }

  /* this week's focus for a class, from HUB_NOW (kept current in data/now.js); null when it's stale (3+ weeks old) */
  function thisWeek(cid) {
    const now = (window.HUB_NOW || {})[cid], c = courseById[cid]; if (!now || !c) return null;
    if ((Date.now() - new Date(now.updated + 'T12:00:00').getTime()) > 21 * 864e5) return null;
    const has = id => c.chapters.some(x => x.id === id), d = now.daily;
    if (d && Array.isArray(d.mix)) {
      /* a planned topic mix, e.g. mix:[{ch:'11', n:2, skills:[…]}, {ch:'9', n:1, gen:'molarity'}] */
      const mix = normMix(c, d.mix);
      if (mix.length) return {chs: mixChapters(mix), mix, title: d.title || now.lecture?.text || '', note: d.note || '', names: []};
    }
    if (d && (d.focus || d.review)) {
      /* a planned mix, e.g. {focus:{ch:'11', n:2, skills:[...]}, review:['1',…,'10'], title, note} */
      const focus = d.focus && has(String(d.focus.ch)) ? {ch: String(d.focus.ch), n: Math.min(5, d.focus.n || 2), skills: d.focus.skills || null} : null;
      const review = (d.review || []).map(String).filter(has);
      const ids = [...new Set([].concat(focus ? [focus.ch] : [], review))]; if (!ids.length) return null;
      return {chs: ids, focus, title: d.title || now.lecture?.text || '', note: d.note || '', names: []};
    }
    const ids = [...new Set([].concat(now.lecture?.ch || [], now.check?.ch || []).map(String))].filter(has);
    if (!ids.length) return null;
    const names = ids.map(id => { const ch = c.chapters.find(x => x.id === id); return ch.label + ' ' + ch.title; });
    return {chs: ids, names, title: [now.lecture?.text, now.check?.n ? 'Skill Check #' + now.check.n + ' prep' : ''].filter(Boolean).join(' · ')};
  }

  function viewDaily(cid, params) {
    cid = (cid || recall('course') || '').toUpperCase();
    if (!courseById[cid]) { setTitle('Daily 5'); app.replaceChildren(h('section', {class: 'wrap daily', style: 'padding-top:26px'}, h('div', {class: 'eyebrow'}, 'Daily 5'), h('h1', {}, 'Five questions a day. Which class?'), h('p', {class: 'lead'}, 'Pick your class and you’ll get five quick questions: what you missed lately, what you haven’t seen in a while, and what your class is on this week.'), courseChips(''))); return; }
    /* optional subset: #/daily/3B?ch=1,2,3&label=Organic keeps its own day state, so two subsets can run side by side */
    let only = ((params && params.get('ch')) || '').split(',').map(x => x.trim()).filter(Boolean), label = (params && params.get('label')) || '';
    /* ch=now: this week's chapters from data/now.js (what's being taught + what the next skill check covers) */
    let week = null;
    /* plan=<id>: a skill check study page's own mix from data/checks.js (check.html), with its own day state */
    const planId = (params && params.get('plan')) || '', plan = planId && (window.HUB_CHECKS || {})[planId];
    if (plan && plan.course === cid && plan.daily && Array.isArray(plan.daily.mix)) {
      const mix = normMix(courseById[cid], plan.daily.mix);
      if (mix.length) { week = {chs: mixChapters(mix), mix, title: plan.daily.title || ('Skill Check #' + plan.n + ' prep'), note: plan.daily.note || '', names: [], plan: planId, heading: 'Skill Check #' + plan.n + ': ' + plan.title}; only = week.chs; if (!label) label = 'Skill Check #' + plan.n; }
    }
    else if (only.length === 1 && only[0] === 'now') {
      week = thisWeek(cid); only = week ? week.chs : []; if (!label) label = 'This week';
    }
    const key = STATE_KEY + (week && week.plan ? ':plan:' + week.plan : only.length ? ':' + cid + ':' + only.join(',') : '');
    remember('course', cid); setTitle('Daily 5 · CHEM ' + cid + (label ? ' · ' + label : ''));
    let st = load(key, null);
    const fresh = st && st.date === today() && st.course === cid && Array.isArray(st.qs) && st.qs.length;
    const extra = params && params.get('more') === '1';
    if (!fresh || (extra && st.done >= st.qs.length)) st = {date: today(), course: cid, qs: [], done: 0, results: [], round: fresh && extra ? (st.round || 1) + 1 : 1};
    st.key = key; st.only = only; st.label = label; st.week = week;
    st.back = safeBack((params && params.get('back')) || ''); st.backname = ((params && params.get('backname')) || '').slice(0, 60);
    const root = h('section', {class: 'wrap daily', 'data-course': cid});
    app.replaceChildren(root);
    render(root, cid, st);
  }

  function header(cid, st) {
    const s = streak(), c = courseById[cid];
    return h('div', {class: 'daily-head'},
      h('div', {class: 'daily-title'}, h('span', {class: 'daily-ico', html: cal}), h('div', {}, h('div', {class: 'eyebrow'}, 'Daily 5 · ' + c.name + (st.label ? ' · ' + st.label : '')),
        st.week ? h('div', {class: 'daily-kicker'}, 'Today’s Daily 5 · CHEM ' + cid + (st.week.plan ? ' · ' + st.week.title : '')) : null,
        h('h1', {}, st.round > 1 ? 'Bonus round' : st.week ? (st.week.heading || 'This week: ' + st.week.title) : (st.label ? st.label + ': today’s five' : 'Today’s five')),
        /* every Daily 5 (all courses, hub and Canvas) shows the day's growth message; a planned week/skill-check note shows above it */
        st.week && st.week.note && st.week.note !== 'rotate' ? h('p', {class: 'daily-weeknote'}, st.week.note) : null,
        h('p', {class: 'daily-weeknote daily-growth'}, growthMessage()),
        h('p', {class: 'daily-streak'}, streakLine(s)))),
      st.week ? h('a', {class: 'btn daily-allgames', href: './?course=' + cid + '#/course/' + cid, target: '_blank', rel: 'noopener'}, '🕹️ All study games →') : null,
      courseChips(cid));
  }

  async function render(root, cid, st) {
    root.replaceChildren(header(cid, st));
    if (!st.qs.length) {
      const wait = h('div', {class: 'panel daily-wait'}, h('p', {}, 'Picking today’s five…'));
      root.append(wait);
      let qs = null; try { qs = await pickQuestions(cid, st.only, st.week && st.week.focus, st.week && st.week.mix); } catch (e) { qs = null; }
      if (!qs) { wait.replaceChildren(h('p', {}, 'The question bank can’t be reached right now. Try again in a minute, or open a game below.'), h('a', {class: 'btn secondary', ...hubLink('#/games?course=' + cid, cid)}, 'All CHEM ' + cid + ' games →')); return; }
      st.qs = qs.map(q => { if (!q.choices) return {...q, choices: undefined}; const idx = shuffle(q.choices.map((c, i) => i)); return {...q, choices: idx.map(i => q.choices[i]), why: Array.isArray(q.why) ? idx.map(i => q.why[i]) : undefined}; });  // keep each choice's 'why' with it
      st.done = 0; st.results = []; save(st.key || STATE_KEY, st);
      const seen = loadSeen(); save(SEEN_KEY, seen.concat(qs.map(q => q.id)).slice(-80));
      return render(root, cid, st);
    }
    if (st.done >= st.qs.length) { if (st.round === 1) streakDone(); root.replaceChildren(header(cid, st)); return root.append(summary(cid, st)); }
    root.append(questionCard(root, cid, st));
  }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function dailyStyles() { if (document.getElementById('daily-extra-css')) return; const el = document.createElement('style'); el.id = 'daily-extra-css';
    el.textContent = '.daily-prompt,.daily-fb,.daily-choice,.daily-hint,.daily-why{overflow-wrap:anywhere;max-width:100%}.daily-prompt{overflow-x:auto}.daily-prompt svg,.daily-prompt img,.daily-fb svg,.daily-fb img,.daily-choice svg,.daily-choice img{max-width:100%!important;height:auto!important}.daily-prompt [style*="nowrap"]{white-space:normal!important}.daily-fb.close{display:block;background:#fff3b0;border:2px solid #f0b400;color:#5c4300;box-shadow:0 0 0 3px #ffe17a55}.daily-close-title{font-weight:800;margin-bottom:4px}input.sf-close{border-color:#f0b400!important;background:#fff8d6!important}.daily-why{margin-top:10px;font-size:.95em}.daily-why summary{cursor:pointer;font-weight:700}.daily-why ul{margin:6px 0 0;padding-left:20px}.daily-why li{margin:4px 0}.daily-why li.mine{background:#fff0ee;border-radius:6px;padding:2px 6px}';
    document.head.appendChild(el); }
  function questionCard(root, cid, st) {
    const q = st.qs[st.done], n = st.done + 1, c = courseById[cid];
    let answered = false, tries = 0, usedHint = false, firstSlip = '', sfClose = null, firstPick = null;
    dailyStyles();
    const prompt = h('div', {class: 'daily-prompt', html: stack(q.prompt)});
    const fb = h('div', {class: 'daily-fb', role: 'status'});
    const hintBox = h('div', {class: 'daily-hint', hidden: true});
    let getAnswer, input;
    const answerArea = h('div', {class: 'daily-answer'});
    const btns = [];
    if (q.type === 'mc') {
      q.choices.forEach(ch => btns.push(h('button', {type: 'button', class: 'daily-choice', html: stack(ch), 'data-right': ch === q.answer ? '1' : null, onclick: e => { if (answered) return; btns.forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); grade(ch); }})));
      answerArea.append(h('div', {class: 'daily-choices'}, btns)); getAnswer = () => null;
    } else {
      input = h('input', {type: 'text', inputmode: q.type === 'number' ? 'decimal' : 'text', autocomplete: 'off', spellcheck: 'false', placeholder: q.type === 'number' ? (q.sigfigs ? q.sigfigs + ' sig figs, e.g. 2.5E-3' : 'e.g. 2.5E-3') : 'Type your answer', 'aria-label': 'Your answer'});
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); grade(input.value); } });
      answerArea.append(h('div', {class: 'daily-inrow'}, input, q.unit ? h('span', {class: 'daily-unit', html: stack(q.unit)}) : null, h('button', {type: 'button', class: 'btn', onclick: () => grade(input.value)}, 'Check')));
      if (q.type === 'number' && q.sigfigs) answerArea.append(h('p', {class: 'daily-note'}, `Answer to ${q.sigfigs} significant figures.`));
      getAnswer = () => input.value;
    }
    const nextBtn = h('button', {type: 'button', class: 'btn daily-next', hidden: true, onclick: () => { st.done++; save(st.key || STATE_KEY, st); render(root, cid, st); }}, n < st.qs.length ? 'Next question →' : 'See today’s results →');
    const showBtn = h('button', {type: 'button', class: 'btn secondary small', onclick: () => { if (answered) return; finish(false, true); }}, 'Show answer');
    const hintBtn = h('button', {type: 'button', class: 'btn secondary small', hidden: !q.hint, onclick: () => { usedHint = true; hintBox.hidden = false; hintBox.innerHTML = '💡 ' + stack(q.hint); }}, '💡 Hint');
    function grade(resp) {
      if (answered) return;
      // "2,5" is a decimal comma, not 25 ("1,200" still means 1200): ask for a period instead of grading it
      if (q.type === 'number' && /^[+\-−]?(?:\d+,\d{1,2}|0,\d+)(?![\d,])/.test(String(resp).trim())) { fb.className = 'daily-fb bad'; fb.innerHTML = 'Use a period for decimals (2.5), not a comma.'; return; }
      tries++;
      if (q.type === 'mc' && tries === 1) firstPick = resp;
      const ok = QB.check(q, resp);
      if (ok) return finish(true, false);
      if (QB.sfOnly && QB.sfOnly(q, resp)) { sfClose = String(resp); if (tries === 1) firstSlip = 'sigfigs'; return finish(true, false); }
      let slip = slipFor(q, resp), msg = slip && SLIP_TEXT[slip] ? SLIP_TEXT[slip] : q.type === 'number' ? 'Check units, the mole ratio, and your calculator entry.' : 'Try again.';
      if (q.type === 'number' && q.sigfigs) { const x = parseNum(resp), a = Number(q.answer); if (isFinite(x) && isFinite(a) && Math.abs(x - a) <= Math.abs(a) * (q.tolerance || .01)) { slip = 'close'; msg = 'Very close, but your last digits don’t match. Recheck your arithmetic and rounding, and keep extra digits until the final step.'; } }
      if (q.type === 'mc' && QB.why) { const w = QB.why(q, resp); if (w) { msg = w; slip = slip || 'choice'; } }
      if (tries === 1) firstSlip = slip;
      fb.className = 'daily-fb bad'; fb.innerHTML = '<b>Not yet.</b> ' + msg + (tries >= 2 ? ' Tap <b>Show answer</b> if you’re stuck.' : '');
      ddTrackSafe(cid, q, false, firstSlip);
    }
    function finish(ok, revealed) {
      answered = true; nextBtn.hidden = false; showBtn.hidden = true; hintBtn.hidden = true; if (input) input.disabled = true;
      btns.forEach(b => { b.disabled = true; if (b.dataset.right) b.classList.add('right'); });
      const firstTry = ok && tries === 1 && !usedHint;
      fb.className = 'daily-fb ' + (ok ? 'good' : 'shown');
      fb.innerHTML = (ok ? '<b>✓ Correct!</b> ' : '<b>Answer:</b> ' + answerText(q) + '. ') + (q.explain ? '<span class="daily-explain">' + stack(q.explain) + '</span>' : '');
      if (ok && sfClose != null) { const got = QB.sigFigs(sfClose); fb.className = 'daily-fb close'; if (input) input.classList.add('sf-close');
        fb.innerHTML = '<div class="daily-close-title">⚠️ Close! Fix your sig figs</div><b>Your math is right, but your significant figures are not.</b> ' + (got ? 'You entered <b>' + got + '</b> sig fig' + (got === 1 ? '' : 's') + '. ' : '') + 'This answer needs <b>' + q.sigfigs + '</b>: <b>' + fmtSig(Number(q.answer), q.sigfigs) + (q.unit ? ' ' + stack(q.unit) : '') + '</b>. On a Skill Check or exam this would lose points, so fix it next time!' + (q.explain ? ' <span class="daily-explain">' + stack(q.explain) + '</span>' : ''); }
      if (q.type === 'mc' && q.why && q.why.some(Boolean)) { const mine = firstPick;
        fb.insertAdjacentHTML('beforeend', '<details class="daily-why"' + (ok && !(mine && mine !== q.answer) ? '' : ' open') + '><summary>Why the other choices are wrong</summary><ul>' + q.choices.map((c, i) => c === q.answer || !q.why[i] ? '' : '<li' + (c === mine ? ' class="mine"' : '') + '><b>' + stack(c) + ':</b> ' + stack(q.why[i]) + (c === mine ? ' <i>(your first pick)</i>' : '') + '</li>').join('') + '</ul></details>'); }
      const hist = load(CH_KEY, {}), k = cid + '-' + q.ch, p = hist[k] || {}; p.seen = Date.now(); if (!firstTry) p.miss = Date.now(); hist[k] = p; save(CH_KEY, hist);
      st.results[st.done] = {id: q.id, ch: q.ch, chLabel: q.chLabel, chTitle: q.chTitle, firstTry, ok, revealed, slip: firstSlip}; save(st.key || STATE_KEY, st);
      if (tries === 0) ddTrackSafe(cid, q, false, 'revealed'); else if (ok && tries === 1) ddTrackSafe(cid, q, true, sfClose != null ? 'sigfigs' : '');
      nextBtn.focus({preventScroll: true});
    }
    return h('div', {class: 'panel daily-card'},
      h('div', {class: 'daily-meta'}, h('span', {class: 'daily-n'}, `Question ${n} of ${st.qs.length}`), q.level && LEVELS[q.level] ? h('span', {class: 'daily-level ' + q.level}, LEVELS[q.level]) : null, h('a', {class: 'chip', ...hubLink(`#/course/${cid}/${q.ch}`, cid)}, `${q.chLabel} · ${q.chTitle}`), h('span', {class: 'daily-bar'}, h('i', {style: `width:${(st.done / st.qs.length) * 100}%`}))),
      prompt, answerArea, hintBox, fb,
      h('div', {class: 'daily-btns'}, hintBtn, showBtn, nextBtn));
  }
  function answerText(q) { if (q.type === 'number') { const a = Number(q.answer); return '<b>' + (Number.isFinite(a) ? (Math.abs(a) >= 1e4 || (Math.abs(a) < 1e-3 && a !== 0) ? a.toPrecision(3).replace(/e([+-]\d+)/, ' × 10^$1') : Number(a.toPrecision(3))) : esc(q.answer)) + (q.unit ? ' ' + q.unit : '') + '</b>'; } return '<b>' + stack(q.answer) + '</b>'; }
  let logged = {};
  function ddTrackSafe(cid, q, correct, slip) { try { if (!window.ddTrack || logged[q.id]) return; logged[q.id] = 1; ddTrack({game: 'hub', course: cid, mode: 'Daily 5', topic: q.chLabel + ' ' + q.chTitle, correct, tries: slip ? 'slip:' + slip : '', slip}); } catch {} }

  const sub = st => (st.week && st.week.plan ? '&plan=' + encodeURIComponent(st.week.plan) : st.week ? '&ch=now' : st.only && st.only.length ? '&ch=' + st.only.join(',') : '') + (st.label ? '&label=' + encodeURIComponent(st.label) : '') + (st.back ? '&back=' + encodeURIComponent(st.back) + (st.backname ? '&backname=' + encodeURIComponent(st.backname) : '') : '');
  function summary(cid, st) {
    const c = courseById[cid], right = st.results.filter(r => r && r.firstTry).length;
    const s = st.round > 1 ? streak() : streakDone();
    const missed = [...new Set(st.results.filter(r => r && !r.firstTry).map(r => r.ch))].map(id => c.chapters.find(x => x.id === id)).filter(Boolean);
    const game = id => { const ch = c.chapters.find(x => x.id === id); const g = ch && ch.games.map(x => games.get(x)).find(Boolean); return g ? h('a', {class: 'btn secondary small', ...hubLink(`#/play/${g.id}?from=${cid}`, cid)}, '🎮 ' + g.title) : null; };
    return h('div', {class: 'panel daily-card daily-done'},
      h('div', {class: 'daily-done-head'}, h('div', {}, h('div', {class: 'eyebrow'}, st.round > 1 ? 'Bonus round done' : 'Daily 5 complete'), h('h2', {}, `${right} of ${st.results.length} on the first try`), h('p', {class: 'daily-streak big'}, streakLine(s) + (st.round === 1 ? ' · see you tomorrow' : ''))),
        h('div', {class: 'daily-dots', 'aria-hidden': 'true'}, st.results.map(r => h('span', {class: r && r.firstTry ? 'ok' : 'no'})))),
      h('ol', {class: 'daily-results'}, st.results.map(r => h('li', {class: r.firstTry ? 'ok' : 'no'}, h('span', {}, r.firstTry ? '✓' : r.ok ? '↺' : '✕'), h('a', hubLink(`#/course/${cid}/${r.ch}`, cid), `${r.chLabel} · ${r.chTitle}`), r.slip && SLIP_TEXT[r.slip] ? h('small', {}, SLIP_TEXT[r.slip]) : r.revealed ? h('small', {}, 'Answer shown') : r.ok && !r.firstTry ? h('small', {}, 'Got it on a retry') : null))),
      missed.length ? h('div', {class: 'daily-fix'}, h('b', {}, 'Practice what you missed:'), h('div', {class: 'daily-fixrow'}, missed.flatMap(ch => [h('a', {class: 'btn secondary small', ...hubLink(`#/course/${cid}/${ch.id}`, cid)}, `📖 ${ch.label}: ${ch.title}`), game(ch.id)]))) : h('p', {class: 'daily-note'}, 'Clean sweep. Tomorrow’s five will dig a little deeper.'),
      h('div', {class: 'daily-btns'}, h('a', {class: 'btn', href: '#/daily/' + cid + '?more=1' + sub(st), onclick: e => { e.preventDefault(); location.hash = '#/daily/' + cid + '?more=1' + sub(st) + '&r=' + Date.now(); }}, 'Five more →'), st.back ? h('a', {class: 'btn secondary', href: st.back, target: '_top'}, '↩ Back to ' + (st.backname || 'where you started')) : h('a', {class: 'btn secondary', ...hubLink('#/course/' + cid, cid)}, 'Back to ' + c.name)));
  }

  /* small card other views can drop in (home page and course overview) */
  function dailyCard(cid) {
    const s = streak(), st = load(STATE_KEY, null), doneToday = st && st.date === today() && st.done >= (st.qs || []).length && (st.qs || []).length;
    const href = '#/daily' + (cid ? '/' + cid : '');
    return h('a', {class: 'dailycard', 'data-course': cid || null, href},
      h('span', {class: 'daily-ico', html: cal}),
      h('span', {class: 'dc-txt'}, h('b', {}, 'Daily 5' + (cid ? ' · CHEM ' + cid : '')), h('small', {}, doneToday ? '✓ Done for today · ' + streakLine(s) : 'Five quick questions a day: what you missed, what you haven’t seen, what’s on this week. ' + streakLine(s) + '.')),
      h('span', {class: 'btn small'}, doneToday ? 'Five more' : 'Start →'));
  }
  window.viewDaily = viewDaily; window.dailyCard = dailyCard;
})();
