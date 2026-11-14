#!/usr/bin/env node
/* Checks the Study Hub's hand-edited data for mistakes before you push.

     node tools/check_hub.js            quick offline check (a second or two)
     node tools/check_hub.js --online   also opens every game, video, textbook and playlist link (a minute or two)

   Exit code 1 if there is an ERROR. WARN lines are things worth a look but not broken.
   No installs needed: plain Node 18+. */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const ONLINE = process.argv.includes('--online');
const errors = [], warns = [];
const err = m => errors.push(m), warn = m => warns.push(m);

global.window = {};
for (const f of ['hub', 'guides', 'exams', 'now', 'checks']) {
  try { eval(fs.readFileSync(path.join(ROOT, 'data', f + '.js'), 'utf8')); }
  catch (e) { err(`data/${f}.js does not load: ${e.message}`); }
}
const D = window.HUB_DATA || {games: [], videos: [], courses: [], playlists: {}};
const GUIDES = window.HUB_GUIDES || {}, EXAMS = window.HUB_EXAMS || {}, NOW = window.HUB_NOW || {}, CHECKS = window.HUB_CHECKS || {};
const dups = a => [...new Set(a.filter((x, i) => a.indexOf(x) !== i))];
const COURSES = ['3A', '1A', '1B', '3B'];

/* ---- games ---- */
const gameIds = new Set(D.games.map(g => g.id));
for (const d of dups(D.games.map(g => g.id))) err(`game "${d}" is listed twice`);
for (const d of dups(D.games.map(g => g.title))) warn(`two games share the title "${d}"`);
for (const g of D.games) {
  for (const k of ['id', 'title', 'blurb', 'url']) if (!g[k]) err(`game "${g.id || g.title}" has no ${k}`);
  if (!Array.isArray(g.courses) || !g.courses.length) err(`game "${g.id}" has no courses`);
  else for (const c of g.courses) if (!COURSES.includes(c)) err(`game "${g.id}" lists unknown course "${c}"`);
  if (g.url && !/^https:\/\/itsdrdan\.github\.io\/[\w-]+\/$/.test(g.url)) warn(`game "${g.id}" url looks unusual: ${g.url}`);
  if (!g.logo) warn(`game "${g.id}" has no logo (it will show a drawn icon)`);
  else if (!/^https?:/.test(g.logo) && !fs.existsSync(path.join(ROOT, g.logo))) err(`game "${g.id}" logo file is missing: ${g.logo}`);
  if (!Array.isArray(g.topics) || g.topics.length < 3) warn(`game "${g.id}" has fewer than 3 "topics" (search uses them to send students to the right game)`);
  if (g.blurb && g.blurb.length > 190) warn(`game "${g.id}" blurb is long (${g.blurb.length} characters)`);
  if (g.blurb && g.title && g.blurb.trim().toLowerCase() === g.title.trim().toLowerCase()) warn(`game "${g.id}" blurb only repeats the title`);
}

/* ---- videos ---- */
const videoIds = new Set(D.videos.map(v => v.id));
for (const d of dups(D.videos.map(v => v.id))) err(`video "${d}" is listed twice`);
for (const v of D.videos) {
  if (!/^[\w-]{11}$/.test(v.id)) err(`video id "${v.id}" is not an 11-character YouTube id`);
  if (!v.title) err(`video "${v.id}" has no title`);
  if (v.playlist && !(v.playlist in D.playlists)) warn(`video "${v.id}" names playlist "${v.playlist}" that is not in "playlists"`);
  let last = -1;
  for (const m of v.moments || []) {
    if (!Array.isArray(m) || typeof m[0] !== 'number' || !m[1]) { err(`video "${v.id}" has a malformed moment: ${JSON.stringify(m)}`); continue; }
    if (m[0] < last) warn(`video "${v.id}" moments are out of order at ${m[0]}s`);
    if (v.duration && m[0] > v.duration) err(`video "${v.id}" has a moment at ${m[0]}s, past its ${v.duration}s length`);
    last = m[0];
  }
}

/* ---- courses and chapters ---- */
const usedGames = new Set(), usedVideos = new Set();
for (const c of D.courses) {
  if (!COURSES.includes(c.id)) err(`unknown course id "${c.id}"`);
  const ids = c.chapters.map(ch => ch.id);
  for (const d of dups(ids)) err(`${c.id}: chapter id "${d}" is used twice`);
  for (const ch of c.chapters) {
    const at = `${c.id} ${ch.label || ch.id}`;
    for (const k of ['id', 'label', 'title']) if (!ch[k]) err(`${at}: missing ${k}`);
    for (const k of ['concepts', 'games', 'videos', 'playlists']) if (!Array.isArray(ch[k])) err(`${at}: "${k}" must be a list`);
    if (!(ch.concepts || []).length) warn(`${at}: no concepts listed`);
    for (const d of dups(ch.concepts || [])) warn(`${at}: concept "${d}" is listed twice`);
    for (const g of ch.games || []) { usedGames.add(g); if (!gameIds.has(g)) err(`${at}: lists game "${g}" that is not in "games"`); else if (!D.games.find(x => x.id === g).courses.includes(c.id)) warn(`${at}: lists game "${g}", but that game's "courses" does not include ${c.id}`); }
    for (const d of dups(ch.games || [])) err(`${at}: game "${d}" is listed twice`);
    for (const v of ch.videos || []) { usedVideos.add(v); if (!videoIds.has(v)) err(`${at}: lists video "${v}" that is not in "videos"`); }
    for (const d of dups(ch.videos || [])) err(`${at}: video "${d}" is listed twice`);
    for (const p of ch.playlists || []) if (!(p in D.playlists)) warn(`${at}: playlist "${p}" has no name in "playlists"`);
    for (const n of ch.needs || []) { if (!ids.includes(n)) err(`${at}: "needs" names chapter "${n}" that is not in ${c.id}`); else if (n === ch.id) err(`${at}: "needs" lists itself`); }
    if (ch.read) {
      if (!/^https:\/\//.test(ch.read.url || '')) err(`${at}: reading url is missing or not https`);
      if (!(ch.read.sections || []).length) warn(`${at}: has a reading link but no section list`);
      for (const s of ch.read.sections || []) if (!Array.isArray(s) || s.length < 3 || !/^https:\/\//.test(s[2])) err(`${at}: malformed reading section ${JSON.stringify(s).slice(0, 80)}`);
    } else if (c.book && c.book.url) warn(`${at}: no reading linked`);
    if (!GUIDES[c.id + ':' + ch.id]) warn(`${at}: no study guide in data/guides.js`);
    if (!(ch.games || []).length && !(ch.videos || []).length && !(ch.playlists || []).length) warn(`${at}: no game and no video`);
    else if (!(ch.games || []).length) warn(`${at}: no practice game yet`);
  }
  // "needs" must not loop
  const needs = Object.fromEntries(c.chapters.map(ch => [ch.id, ch.needs || []]));
  const loops = (id, seen) => seen.includes(id) || (needs[id] || []).some(n => loops(n, [...seen, id]));
  for (const id of ids) if ((needs[id] || []).some(n => loops(n, [id]))) err(`${c.id} chapter ${id}: "needs" makes a loop`);
}
for (const g of D.games) if (!usedGames.has(g.id)) warn(`game "${g.id}" is not attached to any chapter (it only shows on All games)`);
const loose = D.videos.filter(v => !usedVideos.has(v.id)); if (loose.length) warn(`${loose.length} video(s) are not attached to any chapter: ${loose.slice(0, 5).map(v => v.id).join(', ')}${loose.length > 5 ? '…' : ''}`);

/* ---- guides, exams, this-week, skill checks ---- */
const chOf = (cid, id) => (D.courses.find(c => c.id === cid) || {chapters: []}).chapters.find(ch => ch.id === id);
for (const k of Object.keys(GUIDES)) { const [cid, id] = k.split(':'); if (!chOf(cid, id)) err(`data/guides.js: "${k}" matches no chapter`); }
for (const [cid, E] of Object.entries(EXAMS)) for (const ex of E.exams || []) {
  for (const id of ex.ch || []) if (!chOf(cid, id)) err(`data/exams.js: ${cid} exam ${ex.id} lists chapter "${id}" that does not exist`);
  for (const t of ex.can || []) if (Array.isArray(t) && !(ex.ch || []).includes(t[0])) err(`data/exams.js: ${cid} exam ${ex.id} has a skill under chapter "${t[0]}", which is not one of its chapters`);
  for (const d of ex.plan || []) for (const id of d.ch || []) if (!chOf(cid, id)) err(`data/exams.js: ${cid} exam ${ex.id} plan lists chapter "${id}" that does not exist`);
}
for (const [cid, n] of Object.entries(NOW)) {
  if (!COURSES.includes(cid)) { err(`data/now.js: unknown course "${cid}"`); continue; }
  const age = (Date.now() - new Date(n.updated + 'T12:00:00').getTime()) / 864e5;
  if (!(age >= 0)) err(`data/now.js: ${cid} "updated" is not a past date: ${n.updated}`);
  else if (age > 21) warn(`data/now.js: ${cid} was last updated ${Math.floor(age)} days ago, so the hub has stopped showing it (it expires after 21 days)`);
  else if (age > 14) warn(`data/now.js: ${cid} "this week" expires in ${21 - Math.floor(age)} day(s)`);
  if (n.lecture && n.lecture.ch && !chOf(cid, n.lecture.ch)) err(`data/now.js: ${cid} lecture chapter "${n.lecture.ch}" does not exist`);
  for (const id of (n.check && n.check.ch) || []) if (!chOf(cid, id)) err(`data/now.js: ${cid} skill check chapter "${id}" does not exist`);
  if (n.next && !((EXAMS[cid] || {}).exams || []).some(e => e.id === String(n.next))) warn(`data/now.js: ${cid} next exam "${n.next}" has no guide in data/exams.js`);
}
for (const [id, c] of Object.entries(CHECKS)) {
  if (!COURSES.includes(c.course)) err(`data/checks.js: "${id}" has unknown course "${c.course}"`);
  for (const g of c.games || []) if (!gameIds.has(g.id)) err(`data/checks.js: "${id}" lists game "${g.id}" that is not in the hub`);
  for (const d of c.plan || []) if (d.game && !gameIds.has(d.game)) err(`data/checks.js: "${id}" plan lists game "${d.game}" that is not in the hub`);
}
try {
  const syl = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'syllabus.json'), 'utf8'));
  for (const [cid, sc] of Object.entries(syl.courses || {})) if (sc.end) { const [m, d, y] = sc.end.split('/').map(Number); if (new Date(y, m - 1, d + 7) < new Date()) warn(`data/syllabus.json: ${cid} semester ended ${sc.end}; refresh it with tools/update_syllabus.py`); }
} catch (e) { err('data/syllabus.json does not parse: ' + e.message); }

/* ---- files the pages point to ---- */
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const m of html.matchAll(/(?:src|href)="((?:assets|brand|data)\/[^"?#]+|[\w-]+\.(?:html|js))(?:[?#][^"]*)?"/g)) if (!fs.existsSync(path.join(ROOT, m[1]))) err(`index.html points to a missing file: ${m[1]}`);
const sprite = fs.existsSync(path.join(ROOT, 'assets/icons.svg')) ? fs.readFileSync(path.join(ROOT, 'assets/icons.svg'), 'utf8') : '';
const known = new Set([...sprite.matchAll(/id="i-([\w-]+)"/g)].map(m => m[1]));
if (known.size) for (const c of D.courses) for (const ch of c.chapters) if (ch.icon && /^[a-z]+$/.test(ch.icon) && !known.has(ch.icon)) warn(`${c.id} ${ch.label}: icon "${ch.icon}" is not in assets/icons.svg`);

/* ---- optional: do the links still open? ---- */
async function online() {
  const jobs = [];
  for (const g of D.games) { jobs.push(['game ' + g.id, g.url]); jobs.push(['meta.json for ' + g.id, g.url + 'meta.json', true]); }
  for (const v of D.videos) jobs.push(['video ' + v.id + ' (' + v.title.slice(0, 40) + ')', `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`]);
  for (const p of Object.keys(D.playlists)) jobs.push(['playlist ' + p, 'https://www.youtube.com/playlist?list=' + p]);
  for (const c of D.courses) { if (c.book && c.book.url) jobs.push([c.id + ' textbook', c.book.url]); for (const ch of c.chapters) if (ch.read) { jobs.push([`${c.id} ${ch.label} reading`, ch.read.url]); for (const s of ch.read.sections || []) jobs.push([`${c.id} section ${s[0]}`, s[2]]); } }
  const seen = new Set(), list = jobs.filter(j => !seen.has(j[1]) && seen.add(j[1]));
  process.stderr.write(`Opening ${list.length} links…\n`);
  let i = 0, done = 0;
  const one = async () => { while (i < list.length) { const [what, url, soft] = list[i++]; let code = 0, tries = 0;
      while (tries++ < 2 && !(code >= 200 && code < 400)) { try { const r = await fetch(url, {method: 'GET', redirect: 'follow', headers: {'User-Agent': 'Mozilla/5.0 (hub link check)'}, signal: AbortSignal.timeout(30000)}); code = r.status; try { await r.body?.cancel(); } catch {} } catch (e) { code = 0; } }
      if (!(code >= 200 && code < 400)) (soft || code === 403 || code === 429 ? warn : err)(`${what}: ${code || 'no answer'} ${url}`);
      if (++done % 100 === 0) process.stderr.write(`  ${done}/${list.length}\n`); } };
  await Promise.all(Array.from({length: 8}, one));
}

(async () => {
  if (ONLINE) await online();
  for (const w of warns) console.log('WARN  ' + w);
  for (const e of errors) console.log('ERROR ' + e);
  console.log(`\n${D.courses.reduce((n, c) => n + c.chapters.length, 0)} chapters, ${D.games.length} games, ${D.videos.length} videos checked${ONLINE ? ' (links opened)' : ''}: ${errors.length} error(s), ${warns.length} warning(s).`);
  process.exit(errors.length ? 1 : 0);
})();
