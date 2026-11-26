/* ROMANIA: UNLOCKED — host engine */
(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LET = 'ABCDEFGH';
const pad2 = (n) => String(n).padStart(2, '0');
const r10 = (n) => Math.round(n / 10) * 10;

/* ================= STATE ================= */
const KEY = 'ru-host-v1';
function fresh() {
  return {
    teams: DEFAULT_TEAMS.map((t) => ({ ...t, xp: 0 })),
    history: [], completed: [], unlocked: 1, activeTeam: 't1',
    room: makeRoomCode(), muted: false, hud: true,
    players: {}, votes: {}, awarded: {}, visited: [], boss: 100,
    pos: { screen: 'intro', level: 0, step: 0, phase: 0 }
  };
}
let S;
try { S = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { S = fresh(); }
S = Object.assign(fresh(), S);
let saveT = 0;
function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }, 150); }

/* ================= SOUND ================= */
const Sound = {
  ctx: null,
  ensure() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(f, d, type = 'square', vol = 0.07, when = 0, slide = 0) {
    if (S.muted) return;
    this.ensure();
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.03);
  },
  seq(notes, step = 0.09, type = 'square', vol = 0.07) { notes.forEach((f, i) => f && this.tone(f, step * 1.6, type, vol, i * step)); },
  play(n) {
    switch (n) {
      case 'click': this.tone(880, 0.04, 'square', 0.04); break;
      case 'next': this.tone(520, 0.08, 'triangle', 0.08, 0, 780); break;
      case 'reveal': this.tone(180, 0.25, 'sawtooth', 0.05, 0, 900); this.tone(1200, 0.12, 'square', 0.05, 0.2); break;
      case 'correct': this.seq([523, 659, 784, 1047], 0.08); break;
      case 'wrong': this.tone(220, 0.4, 'sawtooth', 0.07, 0, 90); break;
      case 'tick': this.tone(1400, 0.03, 'square', 0.04); break;
      case 'buzz': this.tone(140, 0.6, 'sawtooth', 0.09, 0, 70); break;
      case 'xp': this.seq([988, 1319], 0.06, 'square', 0.05); break;
      case 'unlock': this.seq([392, 523, 659, 784, 1047, 1319], 0.07, 'square', 0.06); break;
      case 'achievement': this.seq([523, 0, 659, 784, 0, 1047, 1047], 0.1, 'triangle', 0.09); break;
      case 'victory': this.seq([523, 523, 523, 698, 0, 880, 784, 880, 1047], 0.13, 'square', 0.07); break;
      case 'start': this.tone(110, 0.9, 'sawtooth', 0.06, 0, 880); this.seq([0, 0, 0, 0, 0, 0, 0, 784, 1047, 1568], 0.1, 'square', 0.06); break;
    }
  }
};

/* ================= NETWORK / PLAYERS ================= */
const live = new Map(); // tid -> { pid, last }
let net = null, netStatus = 'starting';
function startNet() {
  if (net) net.destroy();
  net = new HostNet(S.room, {
    onMessage: onNetMessage,
    onStatus: (s) => { netStatus = s; renderHud(); refreshJoinBits(); },
    onLeave: (tid) => { live.delete(tid); renderHud(); refreshJoinBits(); }
  });
  net.start();
}
function onlinePids() {
  const now = Date.now(), set = new Set();
  for (const v of live.values()) if (now - v.last < 30000) set.add(v.pid);
  return set;
}
function teamOf(pid) { return S.players[pid] && S.players[pid].team; }
function pickTeam() {
  const counts = {}; S.teams.forEach((t) => (counts[t.id] = 0));
  Object.values(S.players).forEach((p) => { if (counts[p.team] != null) counts[p.team]++; });
  return S.teams.slice().sort((a, b) => counts[a.id] - counts[b.id])[0].id;
}
function onNetMessage(tid, msg) {
  if (!msg || typeof msg !== 'object') return;
  const pid = typeof msg.pid === 'string' ? msg.pid.slice(0, 40) : null;
  if (!pid) return;
  const now = Date.now();
  if (msg.t === 'hello') {
    const name = String(msg.name || 'Player').replace(/\s+/g, ' ').trim().slice(0, 18) || 'Player';
    let team = S.teams.find((t) => t.id === msg.team) ? msg.team : (S.players[pid] && S.teams.find((t) => t.id === S.players[pid].team) ? S.players[pid].team : pickTeam());
    S.players[pid] = { name, team };
    live.set(tid, { pid, last: now });
    save();
    net.send(tid, { t: 'welcome', you: { pid, name, team } });
    net.send(tid, stateMsg(pid));
    renderHud(); refreshJoinBits();
    return;
  }
  const lv = live.get(tid);
  if (lv) lv.last = now; else if (S.players[pid]) live.set(tid, { pid, last: now });
  if (!S.players[pid]) { net.send(tid, { t: 'who' }); return; }
  if (msg.t === 'answer') {
    if (poll && poll.open && msg.pollId === poll.id && Number.isInteger(msg.choice) && msg.choice >= 0 && msg.choice < poll.options.length) {
      S.votes[poll.id] = S.votes[poll.id] || {};
      S.votes[poll.id][pid] = msg.choice;
      save();
      net.send(tid, { t: 'ack', pollId: poll.id, choice: msg.choice });
      updatePollUI();
    }
  } else if (msg.t === 'team') {
    if (S.teams.find((t) => t.id === msg.team)) { S.players[pid].team = msg.team; save(); net.send(tid, { t: 'welcome', you: { pid, ...S.players[pid] } }); refreshJoinBits(); }
  } else if (msg.t === 'sync') {
    net.send(tid, stateMsg(pid));
  }
}
function stateMsg(pid) {
  const p = poll ? {
    id: poll.id, q: poll.q, kind: poll.kind, options: poll.options, open: poll.open, revealed: !!poll.revealed,
    correct: poll.revealed ? poll.correct : null,
    counts: (poll.revealed || poll.kind !== 'mc') ? tally(poll.id).counts : null,
    timer: Timer.total ? { left: Math.ceil(Timer.left), running: Timer.running, total: Timer.total } : null,
    mine: pid && S.votes[poll.id] ? S.votes[poll.id][pid] : undefined
  } : null;
  return { t: 'state', label: curLabel(), teams: S.teams.map((t) => ({ id: t.id, name: t.name, color: t.color, xp: t.xp })), poll: p };
}
let bT = 0;
function broadcast() {
  clearTimeout(bT);
  bT = setTimeout(() => {
    if (!net) return;
    // per-player "mine" goes via individual sends for live conns; broadcast the shared state
    const base = stateMsg(null);
    net.broadcast(base);
  }, 60);
}
setInterval(() => { renderHudCount(); }, 5000);

/* ================= POLLS ================= */
let poll = null;
function openPoll(def) {
  if (poll && poll.id === def.id && poll.open) return;
  poll = { ...def, open: true, revealed: false };
  S.votes[def.id] = S.votes[def.id] || {};
  broadcast(); updatePollUI();
}
function lockPoll() { if (poll && poll.open) { poll.open = false; broadcast(); updatePollUI(); } }
function clearPoll() { if (poll) { poll = null; broadcast(); } }
function tally(id) {
  const votes = S.votes[id] || {};
  const n = (poll && poll.id === id) ? poll.options.length : 8;
  const counts = new Array(n).fill(0);
  Object.values(votes).forEach((c) => { if (counts[c] != null) counts[c]++; });
  return { counts, total: Object.keys(votes).length };
}
function revealPoll() {
  if (!poll) return null;
  poll.open = false; poll.revealed = true;
  let deltas = null;
  if (poll.correct != null && !S.awarded[poll.id]) {
    deltas = autoAward(poll);
    S.awarded[poll.id] = deltas || {};
  } else if (S.awarded[poll.id]) deltas = S.awarded[poll.id];
  broadcast(); updatePollUI(); save();
  return deltas;
}
function teamShares(p) {
  const votes = S.votes[p.id] || {};
  const online = onlinePids();
  const out = {};
  S.teams.forEach((t) => {
    const members = new Set();
    Object.keys(S.players).forEach((pid) => { if (teamOf(pid) === t.id && (online.has(pid) || votes[pid] != null)) members.add(pid); });
    let ok = 0;
    members.forEach((pid) => { if (votes[pid] === p.correct) ok++; });
    out[t.id] = { members: members.size, ok, share: members.size ? ok / members.size : 0 };
  });
  return out;
}
function autoAward(p) {
  const votes = S.votes[p.id] || {};
  if (!Object.keys(votes).length) return null;
  const sh = teamShares(p);
  const deltas = {};
  S.teams.forEach((t) => { const x = r10((p.base || XP.correct) * sh[t.id].share); if (x > 0) deltas[t.id] = x; });
  if (!Object.keys(deltas).length) return null;
  addXP(deltas, 'Correct answers', { pollId: p.id, tag: curLevelCode() });
  return deltas;
}

/* ================= XP ================= */
function addXP(deltas, label, meta = {}) {
  const entry = { deltas, label, t: Date.now(), ...meta };
  S.history.push(entry);
  Object.entries(deltas).forEach(([id, d]) => { const t = S.teams.find((x) => x.id === id); if (t) t.xp = Math.max(0, t.xp + d); });
  save(); renderHud(); broadcast(); renderDrawerTeams();
  let i = 0;
  Object.entries(deltas).forEach(([id, d]) => { const t = S.teams.find((x) => x.id === id); if (t) setTimeout(() => xpPop(t, d), i++ * 260); });
  if (Object.values(deltas).some((d) => d > 0)) Sound.play('xp');
}
function undo() {
  const e = S.history.pop();
  if (!e) { toast('Nothing to undo'); return; }
  Object.entries(e.deltas).forEach(([id, d]) => { const t = S.teams.find((x) => x.id === id); if (t) t.xp = Math.max(0, t.xp - d); });
  if (e.pollId) delete S.awarded[e.pollId];
  if (e.levelClear) S.levelClearDone = (S.levelClearDone || []).filter((c) => c !== e.levelClear);
  save(); renderHud(); broadcast(); renderDrawerTeams();
  toast('Undone: ' + e.label);
}
function giveActive(n, label) {
  const t = S.teams.find((x) => x.id === S.activeTeam) || S.teams[0];
  addXP({ [t.id]: n }, label || (n >= 0 ? 'Bonus' : 'Penalty'), { tag: curLevelCode() });
}
function xpPop(team, d) {
  const el = document.createElement('div');
  el.className = 'xp-pop';
  el.style.setProperty('--tc', team.color);
  el.innerHTML = `<b>${d > 0 ? '+' : ''}${d} XP</b><span>${esc(team.name)}</span>`;
  $('#fx').appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

/* ================= TIMER ================= */
const Timer = {
  total: 0, left: 0, running: false, last: 0, lastSec: -1,
  set(sec) { this.total = sec || 0; this.left = this.total; this.running = false; this.draw(); },
  start() { if (!this.total) return; if (this.left <= 0) this.left = this.total; this.running = true; this.last = performance.now(); this.draw(); broadcast(); },
  pause() { this.running = false; this.draw(); broadcast(); },
  toggle() { this.running ? this.pause() : this.start(); },
  reset() { this.left = this.total; this.running = false; this.draw(); broadcast(); },
  add(s) { if (!this.total) return; this.left = Math.min(this.total + 60, this.left + s); this.total = Math.max(this.total, this.left); this.draw(); broadcast(); },
  tick() {
    if (!this.running) return;
    const now = performance.now();
    this.left -= (now - this.last) / 1000; this.last = now;
    const sec = Math.ceil(this.left);
    if (sec !== this.lastSec) { this.lastSec = sec; if (sec <= 5 && sec > 0) Sound.play('tick'); }
    if (this.left <= 0) { this.left = 0; this.running = false; Sound.play('buzz'); lockPoll(); flash('TIME\'S UP'); broadcast(); }
    this.draw();
  },
  draw() {
    $$('.timer').forEach((el) => {
      const f = this.total ? this.left / this.total : 0;
      el.style.setProperty('--f', f);
      el.classList.toggle('run', this.running);
      el.classList.toggle('low', this.running && this.left <= 5);
      el.classList.toggle('none', !this.total);
      const n = el.querySelector('.t-n'); if (n) n.textContent = Math.ceil(this.left);
    });
    const dt = $('#d-timer'); if (dt) dt.textContent = this.total ? `${Math.ceil(this.left)}s ${this.running ? '▶' : '❚❚'}` : 'no timer';
  }
};
setInterval(() => Timer.tick(), 100);
const timerHTML = (big) => `<div class="timer ${big ? 'big' : ''}"><svg viewBox="0 0 100 100"><circle class="t-bg" cx="50" cy="50" r="44"/><circle class="t-fg" cx="50" cy="50" r="44" pathLength="100"/></svg><span class="t-n"></span><span class="t-k">${'T = start / pause'}</span></div>`;

/* ================= UI HELPERS ================= */
const joinURL = () => { const u = new URL('play.html', location.href); u.hash = S.room; return u.href; };
function qrSVG(text, cell = 8) {
  try { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: cell, margin: 2, scalable: true }); } catch (e) { return ''; }
}
function voteHint(extra = '') {
  return `<div class="votehint"><div class="vh-qr">${qrSVG(joinURL(), 4)}</div><div class="vh-t"><b>VOTE ON YOUR PHONE</b><span>Room <i>${esc(S.room)}</i>${extra}</span></div><div class="answered" data-answered></div></div>`;
}
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 1800); }
function flash(text, cls = '') {
  const el = document.createElement('div');
  el.className = 'flash ' + cls; el.innerHTML = `<span>${esc(text)}</span>`;
  $('#fx').appendChild(el); setTimeout(() => el.remove(), 1500);
}
function img(key, cls = '', label = '') {
  const u = imgURL(key);
  const fb = `<div class="fb"><i></i><b>${esc(label || '')}</b></div>`;
  if (!u) return `<div class="ph ${cls} nofile">${fb}</div>`;
  return `<div class="ph ${cls}">${fb}<img src="${u}" alt="" onerror="this.remove()" onload="this.classList.add('ok')"></div>`;
}
const preloaded = new Set();
function preload(keys) { keys.forEach((k) => { if (!k || preloaded.has(k) || !IMG_FILES[k]) return; preloaded.add(k); const i = new Image(); i.src = imgURL(k); }); }
function flagSVG(id) {
  const f = {
    RO: '<rect width="30" height="60" fill="#002B7F"/><rect x="30" width="30" height="60" fill="#FCD116"/><rect x="60" width="30" height="60" fill="#CE1126"/>',
    RS: '<rect width="90" height="20" fill="#C6363C"/><rect y="20" width="90" height="20" fill="#0C4076"/><rect y="40" width="90" height="20" fill="#fff"/>',
    BG: '<rect width="90" height="20" fill="#fff"/><rect y="20" width="90" height="20" fill="#00966E"/><rect y="40" width="90" height="20" fill="#D62612"/>',
    TR: '<rect width="90" height="60" fill="#E30A17"/><circle cx="33" cy="30" r="15" fill="#fff"/><circle cx="37" cy="30" r="12" fill="#E30A17"/><polygon fill="#fff" points="52,30 61.5,26.9 55.6,35 55.6,25 61.5,33.1"/>',
    CZ: '<rect width="90" height="30" fill="#fff"/><rect y="30" width="90" height="30" fill="#D7141A"/><polygon points="0,0 45,30 0,60" fill="#11457E"/>',
    IT: '<rect width="30" height="60" fill="#009246"/><rect x="30" width="30" height="60" fill="#fff"/><rect x="60" width="30" height="60" fill="#CE2B37"/>'
  }[id] || '';
  return `<svg class="flag" viewBox="0 0 90 60" preserveAspectRatio="none">${f}</svg>`;
}
function optionsHTML(opts, { cls = '', correct = null, revealed = false, letters = true } = {}) {
  return `<div class="opts ${cls} n${opts.length}">${opts.map((o, i) => `
    <div class="opt o${i} ${revealed ? (i === correct ? 'ok' : (correct != null ? 'no' : '')) : ''}" data-opt="${i}">
      ${letters ? `<em>${LET[i]}</em>` : ''}<span>${esc(o)}</span>
      <i class="bar" data-bar="${i}"></i><b class="pct" data-pct="${i}"></b>
    </div>`).join('')}</div>`;
}
function updatePollUI() {
  const el = $('#screen');
  const a = $('[data-answered]', el);
  if (!poll) { if (a) a.textContent = ''; return; }
  const { counts, total } = tally(poll.id);
  const online = onlinePids().size;
  if (a) a.textContent = total ? `${total}${online ? ' / ' + Math.max(online, total) : ''} answered${poll.open ? '' : ' · locked'}` : (poll.open ? 'Waiting for votes…' : 'Voting closed');
  const showBars = poll.revealed || poll.kind !== 'mc';
  $$('[data-bar]', el).forEach((b) => {
    const i = +b.dataset.bar, f = total ? counts[i] / total : 0;
    b.style.width = showBars ? (f * 100).toFixed(1) + '%' : '0%';
  });
  $$('[data-pct]', el).forEach((b) => { const i = +b.dataset.pct; b.textContent = showBars && total ? Math.round(counts[i] / total * 100) + '%' : ''; });
  $$('[data-count]', el).forEach((b) => { const i = +b.dataset.count; b.textContent = showBars ? counts[i] : ''; });
  if (poll.kind !== 'mc' && total) {
    const max = Math.max(...counts);
    $$('[data-opt]', el).forEach((o) => o.classList.toggle('lead', counts[+o.dataset.opt] === max && max > 0));
  }
}

/* ================= LEVEL STEP BUILDERS ================= */
const steps = {};
function introStep(lv) { return { kind: 'intro', notes: lv.brief, render: () => levelIntroHTML(lv) }; }
function completeStep(lv) { return { kind: 'complete', onEnter: () => completeLevel(lv), render: () => completeHTML(lv) }; }
function buildLevel(lv) {
  const L = [introStep(lv)];
  if (lv.id === 1) {
    L1.forEach((it, i) => L.push({ kind: 'tf', item: it, i, phases: 2, timer: 30, img: it.img, notes: it.notes,
      poll: { id: 'L1-' + i, q: it.s, kind: 'mc', options: ['TRUE', 'FALSE'], correct: it.a ? 0 : 1, base: XP.correct },
      render: (ph, A) => tfHTML(it, i, ph, A) }));
  }
  if (lv.id === 2) {
    L.push({ kind: 'mapov', notes: 'Click any destination, or press SPACE for the next unvisited one.', render: (ph, A) => mapOverviewHTML(A),
      next: () => { const idx = L2.findIndex((d) => !S.visited.includes(d.id)); return idx >= 0 ? 2 + idx : 2 + L2.length; } });
    L2.forEach((d, i) => L.push({ kind: 'loc', item: d, i, phases: 3, pollFrom: 1, timer: 25, img: d.img, notes: d.notes,
      poll: { id: 'L2-' + d.id, q: d.q, kind: 'mc', options: d.opts, correct: d.c, base: XP.correct },
      onEnter: () => { if (!S.visited.includes(d.id)) { S.visited.push(d.id); save(); } },
      render: (ph, A) => locHTML(d, i, ph, A),
      next: () => (L2.every((x) => S.visited.includes(x.id)) ? 2 + L2.length : 1) }));
    L.push({ kind: 'travel', phases: 2, notes: 'Opinion vote — no right answer. Ask 2–3 people why they chose it.',
      poll: { id: 'L2-travel', q: 'Where would you travel first?', kind: 'opinion', options: L2.map((d) => d.name), correct: null },
      render: (ph, A) => travelHTML(ph, A) });
  }
  if (lv.id === 3) {
    L3.forEach((f, i) => L.push({ kind: 'food', item: f, i, phases: 3, timer: 30, img: f.img, notes: f.notes,
      poll: { id: 'L3-' + i, q: 'What is this dish?', kind: 'mc', options: f.opts, correct: f.c, base: XP.correct },
      render: (ph, A) => foodHTML(f, i, ph, A), after: (el, ph) => pixelate(el, f, ph) }));
    L.push({ kind: 'foodvote', phases: 2, notes: 'Opinion vote. Bonus idea: the team whose favourite wins gets +50 (use the host panel).',
      poll: { id: 'L3-try', q: 'Which one would you try first?', kind: 'opinion', options: L3.map((f) => f.name), correct: null },
      render: (ph, A) => foodVoteHTML(ph, A) });
  }
  if (lv.id === 4) {
    L.push({ kind: 'letters', notes: 'Read each sound aloud and have the room repeat. 30 seconds max.', render: (ph, A) => lettersHTML(A) });
    L4_ROUNDS.forEach((r, ri) => r.words.forEach((w, wi) => L.push({ kind: 'word', item: w, round: r, ri, wi, phases: 2, timer: 20, notes: w.note,
      poll: { id: `L4-${ri}-${wi}`, q: 'What does "' + w.w + '" mean?', kind: 'mc', options: w.opts, correct: w.c, base: XP.correct },
      render: (ph, A) => wordHTML(w, r, ri, wi, ph, A) })));
    L4_TWISTERS.forEach((tw, i) => L.push({ kind: 'twister', item: tw, i, phases: 2, timer: 30, notes: tw.note + ' Pick a volunteer (from any team), select their team in the on-screen chips, then award +100 for trying, +150 if they nail it.',
      poll: { id: 'L4-tw-' + i, q: 'Rate the volunteer!', kind: 'rate', options: ['NAILED IT', 'SO CLOSE', 'BRAVE TRY'], correct: null },
      render: (ph, A) => twisterHTML(tw, i, ph, A) }));
  }
  if (lv.id === 5) {
    L5.forEach((it, i) => L.push({ kind: 'oldnew', item: it, i, phases: 2, timer: 20, img: it.img, notes: it.notes,
      poll: { id: 'L5-' + i, q: it.title + ' — old, new or both?', kind: 'mc', options: ['OLD', 'BOTH', 'NEW'], correct: ['OLD', 'BOTH', 'NEW'].indexOf(it.a), base: XP.correct },
      render: (ph, A) => oldNewHTML(it, i, ph, A) }));
  }
  if (lv.id === 6) {
    L6.forEach((sc, i) => L.push({ kind: 'surv', item: sc, i, phases: 2, timer: 25, notes: sc.culture,
      poll: { id: 'L6-' + i, q: sc.title, kind: 'mc', options: sc.opts.map((o) => o[0]), correct: sc.best, base: XP.correct },
      render: (ph, A) => survHTML(sc, i, ph, A) }));
  }
  if (lv.id === 7) {
    L7.forEach((it, i) => L.push({ kind: 'show', item: it, i, phases: 2, timer: it.kind === 'opinion' ? 0 : 25, notes: it.notes,
      poll: { id: 'L7-' + i, q: it.q, kind: it.kind === 'opinion' ? 'opinion' : 'mc', options: it.opts, correct: it.kind === 'opinion' ? null : it.c, base: XP.correct },
      render: (ph, A) => showHTML(it, i, ph, A) }));
  }
  if (lv.id === 8) {
    L8.forEach((q, i) => L.push({ kind: 'boss', item: q, i, phases: 2, timer: 20, autoTimer: true, notes: 'Answer: ' + q.opts[q.c] + (q.mult ? ` · BONUS ×${q.mult}` : ''),
      poll: { id: 'L8-' + i, q: q.q, kind: 'mc', options: q.opts, correct: q.c, base: XP.correct * (q.mult || 1) },
      onReveal: () => bossHit(q), render: (ph, A) => bossHTML(q, i, ph, A) }));
    L.push({ kind: 'board', notes: 'Final standings. Use the host panel for any last bonus points before the podium.', render: (ph, A) => boardHTML(A, true) });
    L.push({ kind: 'podium', onEnter: () => { Sound.play('victory'); setTimeout(confetti, 1600); }, render: (ph, A) => podiumHTML(A) });
    L.push({ kind: 'unlocked', onEnter: () => { completeLevel(lv, true); Sound.play('achievement'); confetti(); }, render: () => unlockedHTML() });
    return L;
  }
  L.push(completeStep(lv));
  return L;
}
LEVELS.forEach((lv) => (steps[lv.id] = buildLevel(lv)));
const curLevel = () => LEVELS[S.pos.level];
const curSteps = () => steps[curLevel().id];
const curStep = () => curSteps()[S.pos.step];
const curLevelCode = () => (S.pos.screen === 'level' ? curLevel().code : '');
function curLabel() {
  if (S.pos.screen !== 'level') return { intro: 'ROMANIA: UNLOCKED', lobby: 'JOIN THE GAME', map: 'MISSION PATH' }[S.pos.screen] || 'ROMANIA: UNLOCKED';
  return 'LEVEL ' + pad2(curLevel().id) + ' · ' + curLevel().title;
}

/* ================= NAVIGATION ================= */
let firstRender = true;
function go(screen, opts = {}) {
  S.pos.screen = screen;
  if (opts.level != null) { S.pos.level = opts.level; S.pos.step = opts.step || 0; S.pos.phase = 0; }
  save(); clearPoll(); Timer.set(0);
  firstRender = true;
  if (screen === 'level') enterStep(); else render();
  renderDrawerNow();
}
function enterLevel(idx) {
  const lv = LEVELS[idx];
  go('level', { level: idx, step: 0 });
  preload(curSteps().map((s) => s.img).filter(Boolean));
  Sound.play('unlock');
  if (lv.id === 8) flash('FINAL BOSS', 'boss');
}
function enterStep() {
  const st = curStep();
  firstRender = true;
  Timer.set(st.timer || 0);
  syncPoll();
  if (st.onEnter) st.onEnter();
  render();
  if (st.autoTimer && S.pos.phase === 0) Timer.start();
  const nx = curSteps()[S.pos.step + 1]; if (nx && nx.img) preload([nx.img]);
}
function syncPoll() {
  const st = curStep();
  if (!st.poll) { clearPoll(); return; }
  const revealPh = (st.phases || 1) - 1;
  const from = st.pollFrom || 0;
  if (S.pos.phase >= from && S.pos.phase < revealPh) openPoll(st.poll);
  else if (S.pos.phase === revealPh) { if (!poll || poll.id !== st.poll.id) { poll = { ...st.poll, open: false }; } }
  else clearPoll();
}
function setPhase(p) {
  const st = curStep();
  const revealPh = (st.phases || 1) - 1;
  S.pos.phase = p; save();
  syncPoll();
  let deltas = null;
  if (p === revealPh && st.poll) {
    Timer.pause();
    deltas = revealPoll();
    if (st.onReveal) st.onReveal(deltas);
    if (st.poll.correct != null) Sound.play('reveal');
    else Sound.play('achievement');
  } else Sound.play('next');
  firstRender = false;
  render();
  if (st.poll && p === (st.pollFrom || 0) && st.timer && st.pollFrom) Timer.reset();
}
function advance() {
  if (S.pos.screen === 'intro') return startSequence();
  if (S.pos.screen === 'lobby') return go('map');
  if (S.pos.screen === 'map') { const i = nextLevelIdx(); return enterLevel(i); }
  const st = curStep();
  if (st.phases && S.pos.phase < st.phases - 1) return setPhase(S.pos.phase + 1);
  next();
}
function next() {
  const st = curStep();
  if (st.next) { const t = st.next(); return jumpStep(t); }
  if (S.pos.step < curSteps().length - 1) jumpStep(S.pos.step + 1);
  else go('map');
}
function jumpStep(i) {
  if (i >= curSteps().length) return go('map');
  S.pos.step = Math.max(0, i); S.pos.phase = 0; save();
  Sound.play('next'); enterStep(); renderDrawerNow();
}
function prev() {
  if (S.pos.screen !== 'level') { if (S.pos.screen === 'map') go('lobby'); return; }
  if (S.pos.phase > 0) { S.pos.phase = 0; save(); syncPoll(); firstRender = false; render(); return; }
  if (S.pos.step > 0) { S.pos.step--; S.pos.phase = 0; save(); enterStep(); renderDrawerNow(); }
  else go('map');
}
function reveal() {
  if (S.pos.screen !== 'level') return;
  const st = curStep();
  if (st.phases && S.pos.phase < st.phases - 1) setPhase(st.phases - 1);
}
function nextLevelIdx() {
  for (let i = 0; i < LEVELS.length; i++) if (!S.completed.includes(LEVELS[i].id)) return Math.min(i, S.unlocked - 1);
  return LEVELS.length - 1;
}
function completeLevel(lv, quiet) {
  if (!S.completed.includes(lv.id)) S.completed.push(lv.id);
  S.unlocked = Math.max(S.unlocked, Math.min(LEVELS.length, lv.id + 1));
  S.justUnlocked = lv.id + 1;
  S.levelClearDone = S.levelClearDone || [];
  if (!S.levelClearDone.includes(lv.code)) {
    const gains = levelGains(lv.code);
    const best = S.teams.slice().sort((a, b) => (gains[b.id] || 0) - (gains[a.id] || 0))[0];
    if (best && (gains[best.id] || 0) > 0 && !quiet) {
      S.levelClearDone.push(lv.code);
      setTimeout(() => addXP({ [best.id]: XP.level }, 'Level clear · MVP', { tag: lv.code, levelClear: lv.code }), 1400);
      S.lastMVP = { level: lv.code, team: best.id };
    }
  }
  save();
  if (!quiet) { Sound.play('achievement'); setTimeout(confetti, 600); }
}
function levelGains(code) {
  const g = {};
  S.history.forEach((h) => { if (h.tag === code && !h.levelClear) Object.entries(h.deltas).forEach(([id, d]) => (g[id] = (g[id] || 0) + d)); });
  return g;
}

/* ================= RENDER ================= */
function render() {
  const el = $('#screen');
  const scr = S.pos.screen;
  const A = firstRender ? 'anim' : '';
  let html = '', cls = 'scr-' + scr;
  if (scr === 'intro') html = introHTML();
  else if (scr === 'lobby') html = lobbyHTML();
  else if (scr === 'map') html = mapHTML();
  else if (scr === 'level') {
    const st = curStep(), lv = curLevel();
    cls += ` th-${lv.theme} k-${st.kind} ph${S.pos.phase}`;
    html = st.render(S.pos.phase, A);
  }
  el.className = cls;
  el.innerHTML = html;
  if (scr === 'level') { const st = curStep(); if (st.after) st.after(el, S.pos.phase); }
  bindScreen(el);
  updatePollUI(); Timer.draw(); renderHud();
  firstRender = false;
  const n = $('#d-notes'); if (n) n.textContent = notesText();
}
function notesText() {
  if (S.pos.screen !== 'level') return 'SPACE = next · H = host panel · J = join screen';
  const st = curStep();
  const ans = st.poll && st.poll.correct != null ? `ANSWER: ${st.poll.options[st.poll.correct]}\n\n` : '';
  return ans + (st.notes || '—');
}
function bindScreen(el) {
  $$('[data-go]', el).forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); Sound.play('click'); const g = b.dataset.go; if (g === 'start') startSequence(); else if (g === 'map') go('map'); else if (g === 'next') advance(); else if (g === 'lobby') go('lobby'); }));
  $$('[data-level]', el).forEach((b) => b.addEventListener('click', () => {
    const i = +b.dataset.level;
    if (i < S.unlocked || drawerOpen) enterLevel(i); else { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); Sound.play('wrong'); }
  }));
  $$('[data-loc]', el).forEach((b) => b.addEventListener('click', () => jumpStep(2 + +b.dataset.loc)));
  $$('[data-vol]', el).forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); const n = +b.dataset.vol; giveActive(n, n === XP.success ? 'Pronunciation nailed' : 'Pronunciation attempt'); }));
  $$('[data-pick]', el).forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); S.activeTeam = b.dataset.pick; save(); render(); renderDrawerTeams(); }));
}

/* ---------- INTRO / LOBBY / MAP ---------- */
function introHTML() {
  return `
  <div class="bg">${img('intro', 'cover duo')}</div>
  <div class="intro-band l"></div><div class="intro-band r"></div>
  <div class="intro-main">
    <div class="eyebrow-row"><span class="chip">ERASMUS+ YOUTH EXCHANGE</span><span class="flags">${COUNTRIES.map((c) => flagSVG(c.id)).join('')}</span></div>
    <h1 class="glitch" data-text="ROMANIA">ROMANIA</h1>
    <h1 class="glitch y" data-text="UNLOCKED">UNLOCKED</h1>
    <p class="sub">A COUNTRY YOU THOUGHT YOU KNEW.</p>
    <button class="start-btn" data-go="start"><span>PRESS START</span></button>
    <div class="intro-tools">
      <button class="tool" id="i-sound">${S.muted ? 'SOUND: OFF' : 'SOUND: ON'}</button>
      <button class="tool" id="i-fs">FULLSCREEN</button>
      <button class="tool" id="i-host">HOST PANEL (H)</button>
    </div>
  </div>
  <div class="boot" id="boot"><div class="boot-in">
    <div class="boot-pct"><span id="boot-n">0</span>%</div>
    <div class="boot-bar"><i id="boot-bar"></i></div>
    <div class="boot-line" id="boot-line">LOADING ROMANIA</div>
  </div></div>`;
}
let booting = false;
function startSequence() {
  if (booting) return; booting = true;
  Sound.ensure(); Sound.play('start');
  const b = $('#boot'); if (!b) { booting = false; return go('lobby'); }
  b.classList.add('on');
  const lines = ['SCANNING THE CARPATHIANS', 'COUNTING BEARS', 'GRILLING MICI', 'CALIBRATING "DOR"', 'UNLOCKING 8 LEVELS', '6 COUNTRIES CONNECTED'];
  const t0 = performance.now(), D = 2600;
  const step = () => {
    const f = Math.min(1, (performance.now() - t0) / D);
    $('#boot-n').textContent = Math.round(f * 100);
    $('#boot-bar').style.width = f * 100 + '%';
    $('#boot-line').textContent = lines[Math.min(lines.length - 1, Math.floor(f * lines.length))];
    if (f < 1) requestAnimationFrame(step);
    else setTimeout(() => { booting = false; go('lobby'); }, 350);
  };
  requestAnimationFrame(step);
}
function lobbyHTML() {
  const file = location.protocol === 'file:';
  return `
  <div class="lobby">
    <div class="lb-left">
      <div class="kicker">STEP 1 · GRAB YOUR PHONE</div>
      <h2>JOIN<br>THE GAME</h2>
      <div class="lb-code"><span>ROOM CODE</span><b>${esc(S.room)}</b></div>
      <div class="lb-url">${esc(joinURL().replace(/^https?:\/\//, ''))}</div>
      ${file ? '<div class="lb-warn">This page is opened as a local file — phones can\'t reach it. Put the folder online (see README) to let players join.</div>' : ''}
      <div class="lb-net" data-netstatus></div>
    </div>
    <div class="lb-qr">${qrSVG(joinURL(), 10)}<div class="lb-scan">SCAN ME</div></div>
    <div class="lb-teams" id="lb-teams">${lobbyTeams()}</div>
    <button class="cta" data-go="map">CONTINUE <span>SPACE</span></button>
  </div>`;
}
function lobbyTeams() {
  const online = onlinePids();
  return S.teams.map((t) => {
    const ps = Object.entries(S.players).filter(([, p]) => p.team === t.id);
    return `<div class="lbt" style="--tc:${t.color}"><h3>${esc(t.name)}<small>${ps.filter(([id]) => online.has(id)).length} online</small></h3>
      <div class="lbt-names">${ps.map(([id, p]) => `<span class="${online.has(id) ? 'on' : ''}">${esc(p.name)}</span>`).join('') || '<em>waiting for players…</em>'}</div></div>`;
  }).join('');
}
function refreshJoinBits() {
  const lt = $('#lb-teams'); if (lt) lt.innerHTML = lobbyTeams();
  const ov = $('#ov-teams'); if (ov) ov.innerHTML = lobbyTeams();
  $$('[data-netstatus]').forEach((e) => (e.textContent = netLabel()));
  renderDrawerPlayers();
}
function netLabel() {
  return { online: '● LIVE — phones can join', connecting: '○ Connecting…', claiming: '○ Re-opening room…', reconnecting: '○ Reconnecting…', offline: '✕ No connection — play by show of hands; use host panel for XP', local: '● Local test mode', starting: '○ Starting…' }[netStatus] || netStatus;
}
function mapHTML() {
  const W = 1920, nodes = LEVELS.map((lv, i) => {
    const x = 170 + i * 225, y = (i === 7 ? 600 : 560 + Math.sin(i * 1.15 + 0.4) * 190);
    return { lv, i, x, y };
  });
  let d = `M ${nodes[0].x} ${nodes[0].y}`;
  for (let i = 1; i < nodes.length; i++) { const a = nodes[i - 1], b = nodes[i]; const mx = (a.x + b.x) / 2; d += ` C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`; }
  const done = S.completed.length;
  const total = LEVELS.length;
  const cur = nextLevelIdx();
  const ju = S.justUnlocked; S.justUnlocked = null; save();
  return `
  <div class="map-head">
    <div><div class="kicker">MISSION PATH</div><h2>8 LEVELS · 1 BOSS</h2></div>
    <div class="prog"><span>OVERALL PROGRESS</span><div class="prog-bar"><i style="width:${(done / total) * 100}%"></i></div><b>${done}/${total}</b></div>
  </div>
  <svg class="thread" viewBox="0 0 ${W} 1080"><path d="${d}" class="th-bg"/><path d="${d}" class="th-done" style="--p:${Math.max(0, Math.min(1, (cur) / (total - 1)))}" pathLength="1"/></svg>
  ${nodes.map(({ lv, i, x, y }) => {
    const st = S.completed.includes(lv.id) ? 'done' : (i < S.unlocked ? (i === cur ? 'cur' : 'open') : 'locked');
    return `<button class="node ${st} ${lv.id === 8 ? 'boss' : ''} ${ju === lv.id ? 'just' : ''}" data-level="${i}" style="left:${x}px;top:${y}px">
      <span class="gem"><i></i><b>${lv.id === 8 ? 'BOSS' : pad2(lv.id)}</b></span>
      <span class="nl ${y < 560 || lv.id === 8 ? 'up' : ''}"><strong>${esc(lv.title)}</strong><small>${st === 'locked' ? 'LOCKED' : st === 'done' ? 'CLEAR ✓' : st === 'cur' ? 'PLAY NOW' : 'OPEN'} · ${lv.xp} XP</small></span>
    </button>`;
  }).join('')}
  <div class="map-foot">${scoreStrip()}</div>`;
}
function scoreStrip() {
  const max = Math.max(1, ...S.teams.map((t) => t.xp));
  return S.teams.slice().sort((a, b) => b.xp - a.xp).map((t, i) => `<div class="ss" style="--tc:${t.color}"><em>${i + 1}</em><span>${esc(t.name)}</span><i style="width:${(t.xp / max) * 100}%"></i><b>${t.xp}</b></div>`).join('');
}

/* ---------- LEVEL INTRO / COMPLETE ---------- */
function levelIntroHTML(lv) {
  const how = {
    1: 'Read the statement · vote TRUE or FALSE · host reveals the truth',
    2: 'Pick a destination · learn 3 facts · answer the challenge',
    3: 'The picture sharpens · guess the dish before it is revealed',
    4: 'Guess the meaning · then repeat after me · volunteers win bonus XP',
    5: 'Look at the image · vote OLD, NEW or BOTH',
    6: 'Read the situation · choose your move · survive',
    7: 'Vote · then turn to your neighbour from another country',
    8: '20 seconds per question · bonus rounds · highest XP wins'
  }[lv.id];
  return `<div class="lvi ${'lvi-' + lv.theme}">
    <div class="lvi-num ${'anim'}">${lv.id === 8 ? 'BOSS' : pad2(lv.id)}</div>
    <div class="lvi-txt">
      <div class="kicker">LEVEL ${pad2(lv.id)} · ${esc(lv.short.toUpperCase())}</div>
      <h2>${esc(lv.title)}</h2>
      <p>${esc(lv.brief)}</p>
      <div class="lvi-how">${esc(how)}</div>
      <div class="lvi-xp">UP TO ${lv.xp} XP ON THE LINE</div>
    </div>
    <div class="lvi-press">PRESS SPACE</div>
  </div>`;
}
function completeHTML(lv) {
  const g = levelGains(lv.code);
  const mvp = S.lastMVP && S.lastMVP.level === lv.code ? S.teams.find((t) => t.id === S.lastMVP.team) : null;
  const nxt = LEVELS[lv.id];
  return `<div class="clear">
    <div class="badge"><span class="b-gem"></span><b>${pad2(lv.id)}</b></div>
    <div class="kicker">ACHIEVEMENT UNLOCKED</div>
    <h2>LEVEL ${pad2(lv.id)} CLEAR</h2>
    <div class="clear-sub">${esc(lv.title)}</div>
    <div class="clear-gains">${S.teams.map((t) => `<div style="--tc:${t.color}"><span>${esc(t.name)}</span><b>+${g[t.id] || 0}</b></div>`).join('')}</div>
    ${mvp ? `<div class="mvp">LEVEL MVP · <b style="color:${mvp.color}">${esc(mvp.name)}</b> · +${XP.level} XP</div>` : ''}
    ${nxt ? `<div class="clear-next">NEXT UNLOCKED → LEVEL ${pad2(nxt.id)} · ${esc(nxt.title)}</div>` : ''}
    <button class="cta" data-go="map">BACK TO THE MAP <span>SPACE</span></button>
  </div>`;
}

/* ---------- L1: MYTH OR REALITY (case file) ---------- */
function tfHTML(it, i, ph, A) {
  const rv = ph === 1;
  return `<div class="case ${rv ? 'rv' : ''}">
    <div class="case-side"><span>CASE FILE</span><b>${pad2(i + 1)}<small>/${L1.length}</small></b></div>
    <div class="case-top ${A}"><span class="rec">● EVIDENCE UNDER REVIEW</span>${rv ? `<span class="tag t-${it.tag}">${it.tag}</span>` : '<span class="tag unk">CLASSIFIED</span>'}</div>
    <div class="case-statement ${A}">“${esc(it.s)}”</div>
    ${rv ? `<div class="stamp ${it.a ? 'is-true' : 'is-false'}">${it.a ? 'TRUE' : 'FALSE'}</div>
      <div class="case-ex"><p>${esc(it.ex)}</p><div class="intel"><b>INTEL</b>${esc(it.take)}</div></div>` : ''}
    ${it.img ? `<div class="evidence ${rv ? 'open' : ''}">${img(it.img, 'cover')}<span>EXHIBIT ${String.fromCharCode(65 + i)}</span></div>` : ''}
    <div class="tf-zones">
      <div class="tfz tz-t ${rv ? (it.a ? 'ok' : 'no') : ''}" data-opt="0"><em>A</em><span>TRUE</span><i class="bar" data-bar="0"></i><b class="pct" data-pct="0"></b></div>
      <div class="tfz tz-f ${rv ? (!it.a ? 'ok' : 'no') : ''}" data-opt="1"><em>B</em><span>FALSE</span><i class="bar" data-bar="1"></i><b class="pct" data-pct="1"></b></div>
    </div>
    <div class="corner">${timerHTML()}${voteHint()}</div>
  </div>`;
}

/* ---------- L2: MAP ---------- */
const BORDER = [[20.26,46.11],[20.76,46.25],[21.18,46.3],[21.6,46.85],[21.93,47.36],[22.32,47.73],[22.9,47.98],[23.5,48.0],[24.0,47.95],[24.6,47.95],[25.2,47.89],[25.9,47.97],[26.3,48.2],[26.62,48.26],[27.0,48.1],[27.4,47.7],[27.8,47.3],[28.1,46.9],[28.24,46.4],[28.1,45.95],[28.2,45.48],[28.7,45.25],[29.2,45.42],[29.67,45.2],[29.6,44.85],[28.98,44.7],[28.8,44.35],[28.65,44.17],[28.58,43.74],[28.0,43.75],[27.4,44.0],[27.25,44.12],[26.6,44.05],[26.1,43.95],[25.97,43.88],[25.4,43.65],[24.87,43.7],[24.5,43.76],[23.7,43.8],[22.94,43.99],[22.68,44.25],[22.45,44.55],[22.4,44.72],[22.05,44.6],[21.65,44.75],[21.4,44.8],[21.36,45.0],[21.48,45.2],[21.0,45.4],[20.7,45.75]];
const DANUBE = [[21.4,44.8],[22.05,44.62],[22.4,44.7],[22.6,44.45],[22.75,44.15],[22.94,43.99],[23.7,43.82],[24.5,43.74],[25.4,43.64],[26.1,43.92],[26.8,44.05],[27.3,44.12],[27.9,44.3],[28.0,44.6],[27.95,45.0],[27.98,45.27],[28.1,45.45],[28.8,45.2],[29.2,45.15],[29.65,45.2]];
const CARP = [[24.4,47.7],[24.9,47.45],[25.4,47.2],[25.75,46.8],[26.0,46.4],[26.2,46.0],[26.2,45.7],[25.85,45.5],[25.35,45.45],[24.85,45.55],[24.35,45.55],[23.85,45.45],[23.35,45.35],[22.85,45.3],[22.45,45.15],[22.2,45.45],[22.6,46.45],[22.9,46.65],[23.05,46.35]];
const SEA = [[29.67,45.2],[29.6,44.85],[28.98,44.7],[28.8,44.35],[28.65,44.17],[28.58,43.74],[28.55,43.3],[30.6,43.3],[30.6,45.8],[29.75,45.75]];
const proj = ([lon, lat]) => [(lon - 20) * 0.695 * 136 + 30, (48.4 - lat) * 136 + 20];
function mapSVG({ active = null, mini = false } = {}) {
  const pts = (a) => a.map((p) => proj(p).map((v) => v.toFixed(1)).join(',')).join(' ');
  const peaks = CARP.map((p) => { const [x, y] = proj(p); return `<path d="M${x - 15},${y + 11} L${x},${y - 15} L${x + 15},${y + 11} Z" class="peak"/>`; }).join('');
  const labels = mini ? '' : [['UKRAINE', 25.4, 48.32], ['MOLDOVA', 28.85, 47.1], ['BULGARIA', 25.6, 43.5], ['SERBIA', 20.7, 44.5], ['HUNGARY', 20.5, 47.4], ['BLACK SEA', 29.85, 43.72]].map(([t, lo, la]) => { const [x, y] = proj([lo, la]); return `<text x="${x}" y="${y}" class="nb ${t === 'BLACK SEA' ? 'sea' : ''}">${t}</text>`; }).join('');
  const spots = L2.map((d, i) => {
    const [x, y] = proj([d.lon, d.lat]);
    const v = S.visited.includes(d.id);
    return `<g class="spot ${v ? 'v' : ''} ${active === i ? 'act' : ''}" ${mini ? '' : `data-loc="${i}"`} transform="translate(${x},${y})">
      <circle r="34" class="ring"/><circle r="16" class="dot"/>${mini ? '' : `<text y="${d.id === 'coast' || d.id === 'delta' ? 62 : -46}" class="sl">${esc(d.name.replace('The ', '').toUpperCase())}</text>`}</g>`;
  }).join('');
  return `<svg class="rmap ${mini ? 'mini' : ''}" viewBox="0 0 1000 720">
    <defs><pattern id="stitch" width="12" height="12" patternUnits="userSpaceOnUse"><rect x="3" y="3" width="6" height="6" fill="rgba(255,214,10,.10)"/></pattern></defs>
    <polygon points="${pts(SEA)}" class="sea"/>
    <polygon points="${pts(BORDER)}" class="land"/>
    <polygon points="${pts(BORDER)}" class="land-st"/>
    <polyline points="${pts(DANUBE)}" class="river"/>
    ${peaks}${labels}${spots}
  </svg>`;
}
function mapOverviewHTML(A) {
  const n = S.visited.length;
  return `<div class="mapov">
    <div class="mo-head ${A}"><div class="kicker">LEVEL 02 · ${n}/${L2.length} DISCOVERED</div><h2>WHERE TO,<br>EXPLORER?</h2><p>Tap a glowing point — or press SPACE.</p>
    <div class="legend"><span><i class="lg-r"></i>Danube</span><span><i class="lg-m"></i>Carpathians</span></div></div>
    <div class="mo-map">${mapSVG()}</div>
  </div>`;
}
function locHTML(d, i, ph, A) {
  return `<div class="loc">
    <div class="loc-photo">${img(d.img, 'cover', d.name)}</div>
    <div class="loc-panel">
      <div class="kicker ${A}">DESTINATION ${i + 1}/${L2.length}</div>
      <h2 class="${A}">${esc(d.name)}</h2>
      <p class="loc-desc">${esc(d.desc)}</p>
      <ul class="facts">${d.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      <div class="loc-mini">${mapSVG({ active: i, mini: true })}</div>
    </div>
    ${ph >= 1 ? `<div class="challenge ${ph === 2 ? 'rv' : ''}">
      <div class="ch-h"><span class="chip y">CHALLENGE · +${XP.correct} XP</span><h3>${esc(d.q)}</h3></div>
      ${optionsHTML(d.opts, { correct: d.c, revealed: ph === 2 })}
      <div class="corner">${timerHTML()}${voteHint()}</div>
    </div>` : `<div class="loc-next">SPACE → CHALLENGE</div>`}
  </div>`;
}
function travelHTML(ph, A) {
  return `<div class="travel">
    <div class="tr-head ${A}"><div class="kicker">FINAL VOTE</div><h2>WHERE WOULD YOU<br>TRAVEL FIRST?</h2></div>
    <div class="tr-map">${mapSVG({ mini: false })}</div>
    <div class="tr-list">${L2.map((d, i) => `<div class="tr-row" data-opt="${i}"><em>${LET[i]}</em><span>${esc(d.name)}</span><i class="bar" data-bar="${i}"></i><b class="pct" data-pct="${i}"></b></div>`).join('')}</div>
    <div class="corner">${voteHint()}</div>
  </div>`;
}

/* ---------- L3: FOOD ---------- */
function foodHTML(f, i, ph, A) {
  const rv = ph === 2;
  return `<div class="food ${rv ? 'rv' : ''}">
    <canvas class="pix"></canvas>
    <div class="food-shade"></div>
    <div class="food-top"><span class="kicker">DISH ${i + 1}/${L3.length}</span><span class="zoom">${rv ? 'FULL RESOLUTION' : ph === 1 ? 'ENHANCE ×2 — STILL GUESSING' : 'SIGNAL WEAK — GUESS NOW'}</span></div>
    ${rv ? `<div class="food-name">${esc(f.name)}</div>
      <div class="food-info"><div><b>WHAT'S INSIDE</b><p>${esc(f.inside)}</p></div><div><b>WHEN</b><p>${esc(f.when)}</p></div><div class="y"><b>DID YOU KNOW</b><p>${esc(f.fact)}</p></div></div>` :
      `<div class="food-q ${A}">WHAT'S ON<br>THE PLATE?</div>`}
    <div class="food-opts">${optionsHTML(f.opts, { correct: f.c, revealed: rv })}</div>
    <div class="corner">${timerHTML()}${voteHint()}</div>
  </div>`;
}
function pixelate(el, f, ph) {
  const cv = $('canvas.pix', el); if (!cv) return;
  const W = 1920, H = 1080; cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const drawFallback = () => {
    ctx.fillStyle = '#17181d'; ctx.fillRect(0, 0, W, H);
    const s = ph === 2 ? 0 : ph === 1 ? 28 : 60;
    for (let y = 0; y < H; y += 60) for (let x = 0; x < W; x += 60) { ctx.fillStyle = ((x + y) / 60) % 2 ? '#202127' : '#1b1c21'; ctx.fillRect(x, y, 60, 60); }
    ctx.fillStyle = '#ffd60a'; ctx.font = '700 300px "Chakra Petch", sans-serif'; ctx.textAlign = 'center'; ctx.globalAlpha = 0.18; ctx.fillText(ph === 2 ? f.name.toUpperCase() : '?', W / 2, H / 2 + 100); ctx.globalAlpha = 1;
  };
  const im = new Image();
  im.onload = () => {
    const blocks = ph === 0 ? 34 : ph === 1 ? 90 : 0;
    const sc = Math.max(W / im.width, H / im.height), dw = im.width * sc, dh = im.height * sc, dx = (W - dw) / 2, dy = (H - dh) / 2;
    if (!blocks) { ctx.imageSmoothingEnabled = true; ctx.drawImage(im, dx, dy, dw, dh); cv.classList.add('sharp'); return; }
    const bw = blocks, bh = Math.round(blocks * H / W);
    const off = document.createElement('canvas'); off.width = bw; off.height = bh;
    const oc = off.getContext('2d'); oc.drawImage(im, dx * bw / W, dy * bh / H, dw * bw / W, dh * bh / H);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(off, 0, 0, bw, bh, 0, 0, W, H);
  };
  im.onerror = drawFallback;
  drawFallback();
  im.src = imgURL(f.img);
}
function foodVoteHTML(ph, A) {
  return `<div class="foodvote">
    <div class="fv-grid">${L3.map((f, i) => `<div class="fv" data-opt="${i}">${img(f.img, 'cover', f.name)}<div class="fv-l"><em>${LET[i]}</em><span>${esc(f.name)}</span><b class="pct" data-pct="${i}"></b></div><i class="bar" data-bar="${i}"></i></div>`).join('')}</div>
    <div class="fv-title ${A}"><span>WHICH ONE WOULD</span><b>YOU TRY FIRST?</b></div>
    <div class="corner">${voteHint()}</div>
  </div>`;
}

/* ---------- L4: LANGUAGE ---------- */
function lettersHTML(A) {
  return `<div class="letters">
    <div class="kicker ${A}">BEFORE WE START · THE SECRET SOUNDS</div>
    <h2 class="${A}">6 LETTERS.<br>THAT'S ALL YOU NEED.</h2>
    <div class="lt-row">${L4_LETTERS.map(([g, s, h]) => `<div class="lt"><b>${esc(g)}</b><span>${esc(s)}</span><small>${esc(h)}</small></div>`).join('')}</div>
    <div class="lt-tip">Rule of thumb: Romanian is read the way it is written.</div>
  </div>`;
}
function sylHTML(say) {
  return say.split(' ').map((w) => `<span class="w">${w.split('-').map((s) => `<i class="${/^[A-ZĂÂÎȘȚ]{2,}/.test(s) || (s === s.toUpperCase() && /[A-Z]/.test(s)) ? 'st' : ''}">${esc(s)}</i>`).join('')}</span>`).join('');
}
function wordHTML(w, r, ri, wi, ph, A) {
  const rv = ph === 1;
  return `<div class="word ${rv ? 'rv' : ''} r${ri}">
    <div class="wd-top"><span class="kicker">${esc(r.round)}</span><span class="wd-n">${wi + 1}/3</span></div>
    <div class="wd-big ${A}" style="font-size:${Math.round(Math.min(330, 1700 / (w.w.length * 0.6)) * (rv ? 0.6 : 1))}px">${esc(w.w)}</div>
    ${rv ? `<div class="wd-say">${sylHTML(w.say)}</div><div class="wd-mean">= ${esc(w.mean)}</div><div class="wd-note">${esc(w.note)}</div>
      <div class="wd-repeat">ALL TOGETHER NOW — REPEAT AFTER ME</div>` : `<div class="wd-q">WHAT DOES IT MEAN?</div>`}
    <div class="wd-opts">${optionsHTML(w.opts, { correct: w.c, revealed: rv })}</div>
    <div class="corner">${timerHTML()}${voteHint()}</div>
  </div>`;
}
function twisterHTML(tw, i, ph, A) {
  const rv = ph === 1;
  return `<div class="twister">
    <div class="kicker">VOLUNTEER CHALLENGE ${i + 1}/${L4_TWISTERS.length} · TONGUE TWISTER</div>
    <div class="tw-big ${A}">${esc(tw.w)}</div>
    <div class="tw-mean">${esc(tw.mean)}</div>
    ${rv ? `<div class="tw-say">${sylHTML(tw.say)}</div>` : '<div class="tw-say hint">ENTER = show pronunciation</div>'}
    <div class="wave">${Array.from({ length: 48 }, (_, k) => `<i style="--d:${(k % 7) * 0.09}s;--h:${20 + ((k * 37) % 70)}%"></i>`).join('')}</div>
    <div class="tw-ctrl">
      <div class="tw-teams">${S.teams.map((t) => `<button class="pick ${t.id === S.activeTeam ? 'on' : ''}" data-pick="${t.id}" style="--tc:${t.color}">${esc(t.name)}</button>`).join('')}</div>
      <div class="tw-xp"><button data-vol="${XP.attempt}">BRAVE ATTEMPT <b>+${XP.attempt}</b></button><button class="y" data-vol="${XP.success}">NAILED IT <b>+${XP.success}</b></button></div>
    </div>
    <div class="tw-rate">${optionsHTML(['NAILED IT', 'SO CLOSE', 'BRAVE TRY'], { cls: 'rate', letters: true })}</div>
    <div class="corner">${timerHTML()}${voteHint(' · rate them!')}</div>
  </div>`;
}

/* ---------- L5: OLD vs NEW ---------- */
function oldNewHTML(it, i, ph, A) {
  const rv = ph === 1;
  return `<div class="onw ${rv ? 'rv v-' + it.a : ''}">
    <div class="on-old"><b>OLD</b></div><div class="on-both"><b>BOTH</b></div><div class="on-new"><b>NEW</b></div>
    <div class="on-head"><span class="kicker">IMAGE ${i + 1}/${L5.length}</span><h2 class="${A}">${esc(it.title)}</h2></div>
    <div class="on-frame ${A}">${img(it.img, 'cover', it.label || it.title)}</div>
    ${rv ? `<div class="on-verdict">${it.a}</div><div class="on-ex">${esc(it.ex)}</div>` : ''}
    <div class="on-opts">${optionsHTML(['OLD', 'BOTH', 'NEW'], { correct: ['OLD', 'BOTH', 'NEW'].indexOf(it.a), revealed: rv })}</div>
    <div class="corner">${timerHTML()}${voteHint()}</div>
  </div>`;
}

/* ---------- L6: SURVIVAL ---------- */
function survHTML(sc, i, ph, A) {
  const rv = ph === 1;
  const hearts = L6.length - i;
  return `<div class="surv ${rv ? 'rv' : ''}">
    <div class="sv-sky"></div><div class="sv-hills"></div>
    <div class="sv-hud"><span>SCENARIO ${i + 1}/${L6.length}</span><span class="hearts">${'♥'.repeat(hearts)}<i>${'♥'.repeat(L6.length - hearts)}</i></span></div>
    <div class="sv-title ${A}">${esc(sc.title)}</div>
    <div class="sv-box">
      <p class="sv-text ${A ? 'type' : ''}">${esc(sc.s)}</p>
      <div class="sv-choices">${sc.opts.map((o, k) => `<div class="sv-c ${rv ? (k === sc.best ? 'ok' : 'no') : ''}" data-opt="${k}">
        <em>${LET[k]}</em><div><span>${esc(o[0])}</span>${rv ? `<small>${k === sc.best ? 'SURVIVED · ' : 'OOPS · '}${esc(o[1])}</small>` : ''}</div>
        <i class="bar" data-bar="${k}"></i><b class="pct" data-pct="${k}"></b></div>`).join('')}</div>
      ${rv ? `<div class="sv-culture"><span class="tag t-${sc.label}">${sc.label}</span>${esc(sc.culture)}</div>` : ''}
    </div>
    <div class="corner">${timerHTML()}${voteHint()}</div>
  </div>`;
}

/* ---------- L7: SHOWDOWN ---------- */
function showHTML(it, i, ph, A) {
  const rv = ph === 1;
  const rmap = Object.fromEntries((it.reveal || []).map(([c, t]) => [c, t]));
  return `<div class="show ${rv ? 'rv' : ''}">
    <div class="sh-flags">${COUNTRIES.map((c) => `<div class="shf ${rv && rmap[c.id] ? 'lit' : ''} ${rv && it.reveal && !rmap[c.id] ? 'dim' : ''}">${flagSVG(c.id)}<b>${esc(c.name.toUpperCase())}</b>${rv && rmap[c.id] ? `<span>${esc(rmap[c.id])}</span>` : ''}</div>`).join('')}</div>
    <div class="sh-round ${A}"><span>ROUND ${i + 1}/${L7.length}</span><b>${esc(it.title)}</b></div>
    <h2 class="sh-q ${A}">${esc(it.q)}</h2>
    ${optionsHTML(it.opts, { correct: it.kind === 'opinion' ? null : it.c, revealed: rv, cls: it.opts.length > 4 ? 'six' : '' })}
    ${rv ? `<div class="sh-share"><b>TALK</b>${esc(it.share)}</div>` : ''}
    <div class="corner">${it.kind === 'opinion' ? '' : timerHTML()}${voteHint()}</div>
  </div>`;
}

/* ---------- L8: BOSS ---------- */
function bossHit(q) {
  const qi = L8.indexOf(q);
  S.bossHits = S.bossHits || [];
  if (S.bossHits.includes(qi)) return;
  S.bossHits.push(qi);
  const totalW = L8.reduce((s, x) => s + (x.mult || 1), 0);
  const p = poll; let avg = 1;
  if (p && Object.keys(S.votes[p.id] || {}).length) {
    const sh = teamShares(p); const arr = Object.values(sh).filter((v) => v.members);
    avg = arr.length ? arr.reduce((s, v) => s + v.share, 0) / arr.length : 1;
  }
  S.boss = Math.max(0, S.boss - Math.max(2, (q.mult || 1) / totalW * 100 * (0.4 + 0.6 * avg)));
  if (L8.indexOf(q) === L8.length - 1) S.boss = 0;
  save();
}
function bossHTML(q, i, ph, A) {
  const rv = ph === 1;
  const sh = rv && poll ? teamShares(poll) : null;
  return `<div class="bossq ${rv ? 'rv' : ''} ${q.mult ? 'bonus' : ''}">
    <div class="bs-hp"><span>BOSS · THE ROMANIA QUIZ</span><div class="hp"><i style="width:${S.boss}%"></i></div><b>${Math.round(S.boss)}% HP</b></div>
    ${q.mult ? `<div class="bs-bonus">BONUS ROUND ×${q.mult}</div>` : ''}
    <div class="bs-main">
      <div class="bs-timer">${timerHTML(true)}</div>
      <div class="bs-q"><span class="kicker">QUESTION ${i + 1}/${L8.length}</span><h2 class="${A}">${esc(q.q)}</h2></div>
    </div>
    ${optionsHTML(q.opts, { correct: q.c, revealed: rv, cls: 'grid4' })}
    <div class="bs-teams">${S.teams.map((t) => `<div style="--tc:${t.color}"><span>${esc(t.name)}</span><b>${t.xp}</b>${sh && sh[t.id].members ? `<small>${Math.round(sh[t.id].share * 100)}% correct</small>` : ''}</div>`).join('')}</div>
    <div class="corner">${voteHint()}</div>
  </div>`;
}
function boardHTML(A, final) {
  const ts = S.teams.slice().sort((a, b) => b.xp - a.xp), max = Math.max(1, ts[0] ? ts[0].xp : 1);
  return `<div class="board">
    <div class="kicker ${A}">${final ? 'FINAL STANDINGS' : 'LEADERBOARD'}</div>
    <h2 class="${A}">HIGH SCORES</h2>
    <div class="bd-rows">${ts.map((t, k) => `<div class="bd ${k === 0 ? 'first' : ''}" style="--tc:${t.color};--d:${k * 0.12}s"><em>${k + 1}</em><span>${esc(t.name)}</span><i style="width:${(t.xp / max) * 100}%"></i><b>${t.xp}<small>XP</small></b></div>`).join('')}</div>
  </div>`;
}
function podiumHTML() {
  const ts = S.teams.slice().sort((a, b) => b.xp - a.xp);
  const order = [ts[1], ts[0], ts[2]].filter(Boolean);
  const hs = { 0: 520, 1: 380, 2: 280 };
  return `<div class="podium">
    <div class="kicker">AND THE WINNER IS…</div>
    <div class="pd-row">${order.map((t) => { const rank = ts.indexOf(t); return `<div class="pd r${rank}" style="--tc:${t.color};--h:${hs[rank]}px;--d:${[1.2, 0.2, 0.7][rank] || 0}s">
      <div class="pd-name">${rank === 0 ? '<i class="crown"></i>' : ''}${esc(t.name)}<b>${t.xp} XP</b></div><div class="pd-col"><em>${rank + 1}</em></div></div>`; }).join('')}</div>
  </div>`;
}
function unlockedHTML() {
  const w = S.teams.slice().sort((a, b) => b.xp - a.xp)[0];
  return `<div class="unl">
    <div class="unl-band"></div>
    <h1 class="glitch" data-text="ROMANIA">ROMANIA</h1>
    <h1 class="glitch y" data-text="UNLOCKED!">UNLOCKED!</h1>
    ${w ? `<div class="unl-win">CHAMPIONS · <b style="color:${w.color}">${esc(w.name)}</b></div>` : ''}
    <div class="unl-thx">Mulțumesc! · Hvala! · Blagodarya! · Teşekkürler! · Děkuji! · Grazie!</div>
  </div>`;
}

/* ================= OVERLAYS ================= */
let overlay = null;
function showOverlay(kind) {
  const el = $('#overlay');
  if (overlay === kind || !kind) { overlay = null; el.className = ''; el.innerHTML = ''; return; }
  overlay = kind; el.className = 'on ov-' + kind;
  if (kind === 'score') el.innerHTML = boardHTML('', false) + '<div class="ov-close">S / ESC to close</div>';
  if (kind === 'join') el.innerHTML = `<div class="ov-join"><div class="lb-qr">${qrSVG(joinURL(), 10)}</div><div><div class="kicker">JOIN NOW</div><h2>ROOM ${esc(S.room)}</h2><div class="lb-url">${esc(joinURL().replace(/^https?:\/\//, ''))}</div><div class="lb-net" data-netstatus>${netLabel()}</div><div class="lb-teams" id="ov-teams">${lobbyTeams()}</div></div></div><div class="ov-close">J / ESC to close</div>`;
  if (kind === 'credits') el.innerHTML = `<div class="ov-credits"><div class="kicker">PHOTO CREDITS</div><h2>Images: Wikimedia Commons</h2><p>Each photo is used under its Creative Commons / public-domain licence. Author and licence details are on each file page:</p><ol>${PHOTO_CREDITS.map((c) => `<li>${esc(c.file.replace(/_/g, ' '))}</li>`).join('')}</ol></div><div class="ov-close">ESC to close</div>`;
}

/* ================= HUD ================= */
function renderHud() {
  const h = $('#hud');
  const vis = S.hud && S.pos.screen !== 'intro';
  h.classList.toggle('hide', !vis);
  if (!vis) return;
  const max = Math.max(1, ...S.teams.map((t) => t.xp));
  h.innerHTML = `<div class="hud-l">${esc(curLabel())}</div>
    <div class="hud-teams">${S.teams.map((t) => `<div class="ht ${t.id === S.activeTeam ? 'act' : ''}" style="--tc:${t.color}"><span>${esc(t.name)}</span><i style="width:${(t.xp / max) * 100}%"></i><b>${t.xp}</b></div>`).join('')}</div>
    <div class="hud-r"><span class="net n-${netStatus}"></span><b data-pcount>${onlinePids().size}</b> online · <i>${esc(S.room)}</i></div>`;
}
function renderHudCount() { const b = $('[data-pcount]'); if (b) b.textContent = onlinePids().size; renderDrawerPlayers(); if (S.pos.screen === 'lobby' || overlay === 'join') refreshJoinBits(); }

/* ================= HOST DRAWER ================= */
let drawerOpen = false;
function toggleDrawer(v) { drawerOpen = v == null ? !drawerOpen : v; $('#drawer').classList.toggle('open', drawerOpen); if (drawerOpen) renderDrawerNow(); }
function renderDrawerNow() {
  if (!drawerOpen) return;
  const lvl = S.pos.screen === 'level';
  $('#d-pos').textContent = lvl ? `${curLabel()} — step ${S.pos.step + 1}/${curSteps().length}` : curLabel();
  $('#d-levels').innerHTML = LEVELS.map((lv, i) => `<button data-jl="${i}" class="${S.completed.includes(lv.id) ? 'done' : ''} ${i >= S.unlocked ? 'locked' : ''}">${pad2(lv.id)} ${esc(lv.title)}</button>`).join('');
  $$('#d-levels [data-jl]').forEach((b) => b.onclick = () => enterLevel(+b.dataset.jl));
  $('#d-notes').textContent = notesText();
  $('#d-mute').textContent = S.muted ? 'Sound: OFF (M)' : 'Sound: ON (M)';
  $('#d-hud').textContent = S.hud ? 'Top bar: ON' : 'Top bar: OFF';
  renderDrawerTeams(); renderDrawerPlayers(); Timer.draw();
}
function renderDrawerTeams() {
  const box = $('#d-teams'); if (!box || !drawerOpen) return;
  if (box.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') {
    // don't rebuild while typing a name; just update numbers
    S.teams.forEach((t) => { const x = $(`[data-xpv="${t.id}"]`, box); if (x) x.textContent = t.xp; });
    return;
  }
  box.innerHTML = S.teams.map((t) => `<div class="dt ${t.id === S.activeTeam ? 'act' : ''}" style="--tc:${t.color}">
    <button class="dt-sel" data-sel="${t.id}" title="Select team"></button>
    <input value="${esc(t.name)}" data-name="${t.id}" maxlength="22" aria-label="Team name">
    <b data-xpv="${t.id}">${t.xp}</b>
    <div class="dt-btns">${[-50, 50, 100, 150, 200].map((n) => `<button data-add="${t.id}:${n}">${n > 0 ? '+' : ''}${n}</button>`).join('')}</div></div>`).join('');
  $$('[data-sel]', box).forEach((b) => b.onclick = () => { S.activeTeam = b.dataset.sel; save(); renderDrawerTeams(); renderHud(); if (S.pos.screen === 'level' && curStep().kind === 'twister') render(); });
  $$('[data-add]', box).forEach((b) => b.onclick = () => { const [id, n] = b.dataset.add.split(':'); addXP({ [id]: +n }, +n > 0 ? 'Bonus (host)' : 'Penalty (host)', { tag: curLevelCode() }); });
  $$('[data-name]', box).forEach((inp) => {
    inp.onchange = () => { const t = S.teams.find((x) => x.id === inp.dataset.name); const v = inp.value.trim().toUpperCase().slice(0, 22); if (t && v) { t.name = v; save(); renderHud(); broadcast(); if (S.pos.screen !== 'level') render(); } };
    inp.onkeydown = (e) => { if (e.key === 'Enter') inp.blur(); };
  });
}
function renderDrawerPlayers() {
  const box = $('#d-players'); if (!box || !drawerOpen) return;
  const on = onlinePids();
  box.textContent = `${on.size} online · ${Object.keys(S.players).length} joined · room ${S.room} · ${netLabel()}`;
}
let resetArm = 0;
function bindDrawer() {
  const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', (e) => { e.preventDefault(); fn(e); }); };
  on('#d-close', () => toggleDrawer(false));
  on('#d-prev', prev); on('#d-next', advance); on('#d-reveal', reveal); on('#d-skip', next);
  on('#d-restart', () => { if (S.pos.screen === 'level') jumpStep(0); });
  on('#d-map', () => go('map'));
  on('#d-tstart', () => Timer.toggle()); on('#d-treset', () => Timer.reset()); on('#d-tadd', () => Timer.add(10));
  on('#d-undo', undo);
  on('#d-custom', () => { const n = parseInt($('#d-amt').value, 10); if (n) giveActive(n, 'Custom bonus'); });
  on('#d-lvlclear', () => giveActive(XP.level, 'Level clear'));
  on('#d-part', () => { const d = {}; S.teams.forEach((t) => (d[t.id] = XP.participation)); addXP(d, 'Team participation', { tag: curLevelCode() }); });
  on('#d-addteam', () => { if (S.teams.length >= 6) return toast('Max 6 teams'); const n = S.teams.length; S.teams.push({ id: 't' + Date.now().toString(36), name: 'TEAM ' + (n + 1), color: EXTRA_TEAM_COLORS[n - 3] || '#ffffff', xp: 0 }); save(); renderDrawerTeams(); renderHud(); broadcast(); });
  on('#d-delteam', () => { if (S.teams.length <= 2) return toast('Keep at least 2 teams'); const t = S.teams.pop(); Object.values(S.players).forEach((p) => { if (p.team === t.id) p.team = S.teams[0].id; }); save(); renderDrawerTeams(); renderHud(); broadcast(); });
  on('#d-score', () => showOverlay('score')); on('#d-join', () => showOverlay('join')); on('#d-credits', () => showOverlay('credits'));
  on('#d-hud', () => { S.hud = !S.hud; save(); renderHud(); renderDrawerNow(); });
  on('#d-mute', toggleMute); on('#d-fs', toggleFS);
  on('#d-unlockall', () => { S.unlocked = LEVELS.length; save(); if (S.pos.screen === 'map') render(); renderDrawerNow(); toast('All levels unlocked'); });
  on('#d-newroom', () => { S.room = makeRoomCode(); S.players = {}; live.clear(); save(); startNet(); render(); toast('New room: ' + S.room); });
  on('#d-reset', (e) => {
    const b = e.currentTarget;
    if (Date.now() - resetArm > 3000) { resetArm = Date.now(); b.textContent = 'Click again to confirm reset'; setTimeout(() => (b.textContent = 'Reset entire game'), 3000); return; }
    const room = S.room, muted = S.muted; S = fresh(); S.room = room; S.muted = muted; S.players = {}; save(); go('intro'); toast('Game reset');
  });
}

/* ================= GLOBAL CONTROLS ================= */
function toggleMute() { S.muted = !S.muted; save(); toast(S.muted ? 'Sound off' : 'Sound on'); renderDrawerNow(); const b = $('#i-sound'); if (b) b.textContent = S.muted ? 'SOUND: OFF' : 'SOUND: ON'; }
function toggleFS() {
  try { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); } catch (e) { toast('Fullscreen not available'); }
}
document.addEventListener('keydown', (e) => {
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) { if (e.key === 'Escape') t.blur(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (k === ' ' || k === 'PageDown') { e.preventDefault(); advance(); }
  else if (k === 'ArrowRight') { e.preventDefault(); if (S.pos.screen === 'level') next(); else advance(); }
  else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); prev(); }
  else if (k === 'Enter') { e.preventDefault(); reveal(); }
  else if (k === 'f' || k === 'F') toggleFS();
  else if (k === 'm' || k === 'M') toggleMute();
  else if (k === 'h' || k === 'H') toggleDrawer();
  else if (k === 's' || k === 'S') showOverlay('score');
  else if (k === 'j' || k === 'J') showOverlay('join');
  else if (k === 't' || k === 'T') Timer.toggle();
  else if (k === 'r' || k === 'R') Timer.reset();
  else if (k === 'u' || k === 'U') undo();
  else if (k === 'Escape') { if (overlay) showOverlay(null); else if (drawerOpen) toggleDrawer(false); }
  else if (/^[1-6]$/.test(k)) { const tm = S.teams[+k - 1]; if (tm) { S.activeTeam = tm.id; save(); renderHud(); renderDrawerTeams(); toast(tm.name + ' selected'); } }
  else if (k === '+' || k === '=') giveActive(XP.correct, 'Bonus (key)');
  else if (k === '-') giveActive(-50, 'Penalty (key)');
});
$('#screen').addEventListener('click', (e) => {
  const t = e.target;
  if (t.closest('#i-sound')) return toggleMute();
  if (t.closest('#i-fs')) return toggleFS();
  if (t.closest('#i-host')) return toggleDrawer(true);
});
$('#overlay').addEventListener('click', () => showOverlay(null));
// After a mouse click on a button, drop its focus so Space/Enter keep driving the game.
document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('button')) setTimeout(() => { const a = document.activeElement; if (a && a.tagName === 'BUTTON') a.blur(); }, 0); });

/* ================= STAGE SCALING ================= */
function fit() {
  const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  const st = $('#stage');
  st.style.transform = `translate(-50%,-50%) scale(${s})`;
}
window.addEventListener('resize', fit);

/* ================= CONFETTI (pixel stitches) ================= */
function confetti() {
  const cv = document.createElement('canvas'); cv.className = 'confetti'; cv.width = 1920; cv.height = 1080;
  $('#fx').appendChild(cv);
  const ctx = cv.getContext('2d');
  const cols = ['#ffd60a', '#ff2e3b', '#2f6bff', '#f6f5f0'];
  const P = Array.from({ length: 180 }, () => ({ x: Math.random() * 1920, y: -Math.random() * 600, vx: (Math.random() - 0.5) * 6, vy: 4 + Math.random() * 7, s: 10 + Math.random() * 14, c: cols[(Math.random() * 4) | 0], r: Math.random() * 6 }));
  const t0 = performance.now();
  const loop = (now) => {
    ctx.clearRect(0, 0, 1920, 1080);
    P.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.r += 0.05; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.round(p.r / 0.785) * 0.785); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s); ctx.restore(); });
    if (now - t0 < 4500) requestAnimationFrame(loop); else cv.remove();
  };
  requestAnimationFrame(loop);
}

/* ================= BOOT ================= */
installMotifVars();
fit();
bindDrawer();
startNet();
if (S.pos.screen === 'level') { enterStep(); } else { if (S.pos.screen !== 'intro') render(); else render(); }
renderHud();
window.__RU = { S: () => S, go, advance, reveal, next, prev, enterLevel, addXP, undo, poll: () => poll };
})();
