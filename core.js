/* RARA/OS shared engine for v1–v3: a DJ-deck skin over the two real mp3s (real.js owns the audio).
   Waveforms are decoded from the real files, meters/spectrum/kick come from the live analyser. */
window.RARA = (() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const DPR = Math.min(2, window.devicePixelRatio || 1);
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad = (n, l = 2) => String(Math.floor(n)).padStart(l, '0');
const fmt = (sec, tenth = true) => { const s = Math.abs(sec), hh = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60; return (hh ? pad(hh) + ':' : '') + pad(m) + ':' + (tenth ? pad(ss) + '.' + Math.floor(ss % 1 * 10) : pad(ss)); };

/* ---------- content: the two real tracks (everything else lives in real.js) ---------- */
const EMAIL = REAL.EMAIL, MAILTO = REAL.MAILTO, BC = REAL.BC, IG_RARA = REAL.IG, IG_OMNI = REAL.IG_OMNI, YT = '';
/* the deck counts in "beats" of an internal 2-per-second grid (never shown): 1 beat = 0.5s of the real mp3 */
const BPS = 2;
const TRACKS = REAL.TRACKS.map((r, i) => ({
  i, title: r.title, short: r.short, type: i ? 'Single' : 'Edit', sub: r.tag + ' · ' + r.date, date: r.date, bpm: 120, beats: 64, aud: i,
  desc: i ? 'Out on Bandcamp, March 2026. Press play.' : 'Batida edit, out on Bandcamp, March 2026. Press play.', href: REAL.BC, cta: 'Bandcamp',
}));
TRACKS.forEach(t => { t.cues = [0.08, 0.3, 0.55, 0.78].map(f => Math.round(t.beats * f)); });
/* real 3-band envelopes, decoded from the mp3 (20 windows/sec). Until decoded: a quiet flat line. */
const WPS = 20, bands = [], waveHooks = [];
const onWave = fn => waveHooks.push(fn);
TRACKS.forEach(t => {
  const load = () => {
    const el = REAL.els[t.aud], go = () => { t.beats = Math.max(8, el.duration * BPS); t.cues = [0.08, 0.3, 0.55, 0.78].map(f => Math.round(t.beats * f)); decode(t); };
    el.duration > 0 ? go() : el.addEventListener('loadedmetadata', go, { once: true });
  };
  load();
});
function decode(t) {
  fetch(REAL.TRACKS[t.aud].src).then(r => r.arrayBuffer()).then(buf => {
    const AC = window.AudioContext || window.webkitAudioContext, c = new AC();
    return new Promise((ok, no) => c.decodeAudioData(buf, a => { c.close && c.close(); ok(a); }, no));
  }).then(ab => {
    const d = ab.getChannelData(0), win = Math.floor(ab.sampleRate / WPS), n = Math.floor(d.length / win), a = new Float32Array(n * 3);
    const lpA = 1 - Math.exp(-2 * Math.PI * 180 / ab.sampleRate), hpA = 1 - Math.exp(-2 * Math.PI * 3000 / ab.sampleRate);
    let lp = 0, lp2 = 0;
    for (let w = 0; w < n; w++) {
      let l = 0, m = 0, h = 0;
      for (let k = 0; k < win; k += 2) {
        const v = d[w * win + k]; lp += (v - lp) * lpA * 2; lp2 += (v - lp2) * hpA * 2;
        const hi = v - lp2, lo = lp, mid = v - lo - hi; l += lo * lo; m += mid * mid; h += hi * hi;
      }
      const q = win / 2; a[w * 3] = Math.sqrt(l / q); a[w * 3 + 1] = Math.sqrt(m / q); a[w * 3 + 2] = Math.sqrt(h / q);
    }
    let mx = [1e-6, 1e-6, 1e-6]; for (let i = 0; i < a.length; i++) mx[i % 3] = Math.max(mx[i % 3], a[i]);
    const all = Math.max(...mx) ;
    for (let i = 0; i < a.length; i++) a[i] = Math.pow(a[i] / (i % 3 === 0 ? mx[0] : (i % 3 === 1 ? mx[1] * .8 : mx[2] * .7)), .8);
    bands[t.i] = { a, n }; ovMemo.clear(); waveHooks.forEach(f => f(t));
  }).catch(() => {});
}
/* [lo, mid, hi] at beat b (looks up the real envelope; flat until it's decoded) */
const wave = (t, b) => {
  const B = bands[t.i]; if (!B) return [.05, .05, .05];
  if (b < 0 || b >= t.beats) return [0, 0, 0];
  const k = clamp(Math.floor(b / BPS * WPS), 0, B.n - 1) * 3; return [clamp(B.a[k], 0, 1), clamp(B.a[k + 1], 0, 1), clamp(B.a[k + 2], 0, 1)];
};
const energy = (t, b) => { const w = wave(t, b); return w[0] * .6 + w[1] * .3 + w[2] * .1; };
/* whole-track overview amplitudes for n columns (cached) */
const ovMemo = new Map();
const overviewAmps = (t, n) => {
  const k = t.i + ':' + n; if (ovMemo.has(k)) return ovMemo.get(k);
  const B = bands[t.i], a = [];
  for (let px = 0; px < n; px++) {
    if (!B) { a.push([.06, .04, .02]); continue; }
    const s = Math.floor(px / n * B.n), e = Math.max(s + 1, Math.floor((px + 1) / n * B.n)); let m = [0, 0, 0];
    for (let w = s; w < e; w++) for (let q = 0; q < 3; q++) m[q] = Math.max(m[q], B.a[w * 3 + q]);
    a.push(m);
  }
  if (B) ovMemo.set(k, a); return a;
};
const CLAP = new Set();

/* ---------- transport: a thin skin over the two real <audio> elements (real.js) ---------- */
const EQ = { lo: 0, mid: 0, hi: 0, gain: .8 };
const S = { tr: TRACKS[0], bpm: 120, rate: 1, held: false, boot: performance.now() };
Object.defineProperty(S, 'playing', { get: () => REAL.isPlaying(S.tr.aud) });
const AU = { get on() { return !REAL.muted; } };
const now = () => performance.now() / 1000;
const aud = () => REAL.els[S.tr.aud];
const wrap = b => ((b % S.tr.beats) + S.tr.beats) % S.tr.beats;
const curPos = () => aud().currentTime * BPS;
const setPos = b => { const el = aud(); if (el.duration > 0) el.currentTime = clamp(b / BPS, 0, el.duration - .05); };
const loadHooks = [], playHooks = [];
const onLoad = fn => loadHooks.push(fn), onPlay = fn => playHooks.push(fn);
function load(i, frac, quiet) {
  const t = TRACKS[i], was = S.playing;
  S.tr = t; S.rate = 1; REAL.rate(1); S.held = false;
  if (was) { REAL.play(i); } else REAL.els.forEach(a => a.pause());
  const el = REAL.els[i], go = () => { el.currentTime = frac != null && el.duration > 0 ? frac * el.duration : 0; };
  if (frac != null && !(el.duration > 0)) el.addEventListener('loadedmetadata', go, { once: true }); else go();
  loadHooks.forEach(f => f(t, quiet)); playHooks.forEach(f => f(S.playing));
  if (!quiet) toast('LOADED › ' + t.title.toUpperCase());
}
function togglePlay() { S.playing ? REAL.pause() : REAL.play(S.tr.aud); }
const cue = n => { setPos(S.tr.cues[n || 0]); if (!S.playing) REAL.play(S.tr.aud); };
/* pitch: real playbackRate 0.92..1.08 */
function setRate(r) { S.rate = clamp(r, .92, 1.08); REAL.rate(S.rate); }
/* drag-scrub helper: grab pauses the real audio, move(deltaBeats) seeks it, release resumes if it was playing */
let scrubWas = false;
const scrub = { grab() { scrubWas = S.playing; S.held = true; if (scrubWas) aud().pause(); },
  move(db) { setPos(curPos() + db); },
  release() { S.held = false; if (scrubWas) REAL.play(S.tr.aud); } };
REAL.on('state', () => { if (!S.held) playHooks.forEach(f => f(S.playing)); });
REAL.on('track', i => { if (S.tr !== TRACKS[i]) { S.tr = TRACKS[i]; S.rate = 1; loadHooks.forEach(f => f(S.tr, true)); } });
REAL.on('blocked', () => toast('TAP PLAY AGAIN'));
/* the speaker button is the mute switch (aria-pressed = sound on) */
async function toggleAudio(btn) {
  const m = REAL.mute(); if (btn) btn.setAttribute('aria-pressed', !m); toast(m ? 'MUTED' : 'SOUND ON');
}
/* knob/fader model: gain 0..1, lo/mid/hi -12..+12 dB. These drive a real EQ on the real audio. */
const CTRL = [
  { k: 'gain', label: 'Gain', min: 0, max: 1, def: .8, fmt: v => (v ? (20 * Math.log10(v)).toFixed(1) : '-∞') + 'dB' },
  { k: 'lo', label: 'Low', min: -12, max: 12, def: 0, fmt: v => (v > 0 ? '+' : '') + v.toFixed(1) },
  { k: 'mid', label: 'Mid', min: -12, max: 12, def: 0, fmt: v => (v > 0 ? '+' : '') + v.toFixed(1) },
  { k: 'hi', label: 'High', min: -12, max: 12, def: 0, fmt: v => (v > 0 ? '+' : '') + v.toFixed(1) },
];
function setEQ(k, v) {
  const n = CTRL.find(c => c.k === k); EQ[k] = clamp(v, n.min, n.max); REAL.eq(k, k === 'gain' ? EQ[k] / .8 : EQ[k]);
  return EQ[k];
}
/* kick pulse: the real kick drum, heard live from the audio (falls back to the decoded bass envelope) */
const kickEnv = () => REAL.live ? REAL.L.kick : (S.playing ? wave(S.tr, curPos())[0] * .5 : 0);

/* ---------- metering (real levels) ---------- */
function levels(pos, tt) {
  let l = 0, r = 0;
  if (S.playing) {
    const td = REAL.scope();
    if (td) { let s = 0; for (let i = 0; i < td.length; i++) { const v = (td[i] - 128) / 128; s += v * v; } l = r = clamp(Math.sqrt(s / td.length) * 3.2, 0, 1); }
    else { l = energy(S.tr, pos) * .9; r = l * (.96 + .04 * Math.sin(tt * 2.3)); }
  }
  return [clamp(l * 1.05, 0, 1), clamp(r * 1.05, 0, 1)];
}
/* VU with ballistics + peak hold; returns {l,r,hl,hr} */
const VU = { l: 0, r: 0, pl: 0, pr: 0, hl: 0, hr: 0 };
function stepVU(l, r) {
  VU.l += (l - VU.l) * (l > VU.l ? .55 : .09); VU.r += (r - VU.r) * (r > VU.r ? .55 : .09);
  if (VU.l >= VU.hl) { VU.hl = VU.l; VU.pl = 28; } else if (--VU.pl < 0) VU.hl = Math.max(0, VU.hl - .012);
  if (VU.r >= VU.hr) { VU.hr = VU.r; VU.pr = 28; } else if (--VU.pr < 0) VU.hr = Math.max(0, VU.hr - .012);
  return VU;
}
const fOf = fx => 20 * Math.pow(1000, fx);
const sig = v => 1 / (1 + Math.exp(-v));
const eqDb = f => EQ.lo * sig(Math.log2(220 / f) * 2.2) + EQ.mid * Math.exp(-Math.pow(Math.log2(f / 1000), 2) / 1.3) + EQ.hi * sig(Math.log2(f / 3800) * 2.2);
/* spectrum model: N smoothed bands + falling peaks, from the real analyser (flat when paused) */
function makeSpectrum(N) {
  const sp = { N, v: new Float32Array(N), p: new Float32Array(N), ph: new Float32Array(N) };
  sp.step = (pos, tt) => {
    const fd = S.playing ? REAL.spectrum() : null, nyq = REAL.sampleRate / 2;
    for (let k = 0; k < N; k++) {
      const f = fOf(k / (N - 1));
      let tg = 0;
      if (fd) { const bin = Math.min(fd.length - 1, Math.round(f / nyq * fd.length)); tg = Math.pow(fd[bin] / 255, 1.4) * 1.1; }
      else if (S.playing) { const [lo, mid, hi] = wave(S.tr, pos), fx = k / (N - 1); tg = lo * Math.pow(1 - fx, 2) + mid * Math.exp(-Math.pow((fx - .45) / .2, 2)) + hi * fx * fx; }
      tg = clamp(tg, 0, 1);
      sp.v[k] += (tg - sp.v[k]) * (tg > sp.v[k] ? .6 : .14);
      if (sp.v[k] >= sp.p[k]) { sp.p[k] = sp.v[k]; sp.ph[k] = 22; } else if (--sp.ph[k] < 0) sp.p[k] = Math.max(0, sp.p[k] - .014);
    }
    return sp;
  };
  return sp;
}

/* ---------- canvas + HUD helpers ---------- */
function fit(c) {
  const r = c.getBoundingClientRect(), w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  if (c.width !== w * DPR || c.height !== h * DPR) { c.width = w * DPR; c.height = h * DPR; }
  const x = c.getContext('2d'); x.setTransform(DPR, 0, 0, DPR, 0, 0); return { x, w, h };
}
let toastEl = null;
function toast(msg) {
  if (!toastEl) { toastEl = $('#toast') || Object.assign(document.body.appendChild(document.createElement('div')), { id: 'toast', className: 'toast' }); toastEl.setAttribute('role', 'status'); }
  toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove('show'), 1800);
}
async function copyEmail(sel) {
  try { await navigator.clipboard.writeText(EMAIL); toast('EMAIL COPIED'); }
  catch { const el = $(sel); if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } toast('PRESS COPY'); }
}
const tz = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
const miamiTime = () => tz.format(new Date());
/* generic pointer drag: cb(dx, dy, e) while down */
function drag(el, { down, move, up }) {
  let id = null, x0 = 0, y0 = 0, lx = 0, ly = 0;
  el.addEventListener('pointerdown', e => { id = e.pointerId; el.setPointerCapture(id); x0 = lx = e.clientX; y0 = ly = e.clientY; down && down(e); });
  el.addEventListener('pointermove', e => { if (id !== e.pointerId) return; move && move(e.clientX - lx, e.clientY - ly, e, e.clientX - x0, e.clientY - y0); lx = e.clientX; ly = e.clientY; });
  const end = e => { if (id !== e.pointerId) return; id = null; up && up(e); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
}
/* version switcher: fills #vs with links, arrow keys flip between versions */
function switcher(cur) {
  const pages = [['v1', 'club'], ['v2', 'studio'], ['v3', 'hud'], ['v4', 'strobe'], ['v5', 'tracklist'], ['v6', 'sweat'], ['v7', 'all-access']], host = $('#vs');
  if (host) host.innerHTML = pages.map(([p, n], i) => `<a href="${p}.html" ${p === cur ? 'aria-current="page"' : ''} aria-label="Version ${i + 1}, ${n}">${i + 1}</a>`).join('') + '<a href="./" aria-label="All versions" class="all">⌂</a>';
  addEventListener('keydown', e => {
    const i = pages.findIndex(p => p[0] === cur), d = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (d && !/input|textarea/i.test(e.target.tagName)) location.href = pages[(i + d + pages.length) % pages.length][0] + '.html';
  });
}
/* main loop: fn(ts, pos, tt) every frame */
function run(fn) {
  let frame = 0;
  const loop = ts => { requestAnimationFrame(loop); frame++; REAL.analyse(ts); const pos = curPos(); fn(ts, pos, S.playing ? ts / 1000 : 0, frame); };
  S.boot = performance.now(); requestAnimationFrame(loop);
}
function ready(fn) {
  let done = false; const go = () => { if (done) return; done = true; fn(); };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go); setTimeout(go, 1500);
}
return { $, $$, DPR, REDUCE, hash, clamp, pad, fmt, EMAIL, MAILTO, IG: IG_RARA, IG_OMNI, BC, YT, TRACKS, EVENTS: REAL.EVENTS, EV: REAL.EV, NUBETTER: REAL.NUBETTER, RELS: REAL.RELS, CLIPS: REAL.CLIPS, media: REAL.media, reel: REAL.reel, mvw: REAL.mvw, clipHtml: REAL.clipHtml, SLOGAN: REAL.SLOGAN, BIO: REAL.BIO, REAL, onWave, CLAP, energy, wave, overviewAmps, S, AU, EQ, CTRL, now, wrap, curPos, setPos,
  kickEnv, load, onLoad, onPlay, togglePlay, cue, setRate, scrub, toggleAudio, setEQ, levels, stepVU, VU, fOf, eqDb, makeSpectrum, fit, toast, copyEmail, miamiTime, drag, switcher, run, ready };
})();
