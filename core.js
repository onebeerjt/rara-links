/* RARA/OS shared engine: tracks, synthetic waveforms, transport clock, opt-in synth monitor.
   Each version (v1/v2/v3) owns its own markup, styling and drawing; this file owns the "music". */
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

/* ---------- content (real links, real names) ---------- */
const EMAIL = 'omnisoundslabel@gmail.com';
const MAILTO = 'mailto:' + EMAIL + '?subject=Booking%20RARA%20%F0%9F%8C%8B';
const BC = 'https://machinarecords.bandcamp.com', YT = 'https://www.youtube.com/watch?v=Cv6b3C2QPJo';
const IG_RARA = 'https://instagram.com/raravulcain', IG_OMNI = 'https://instagram.com/omnisoundspace';
const TRACKS = [
  { title: 'Jolene 3-Hour Set', type: 'Set', sub: 'Live · 3 hrs', bpm: 134, key: '8A', min: 180, seed: 11, len: '3:00:00',
    desc: 'The full three-hour Jolene set. No skips, no filler. Afro-diasporic club music front to back.', href: IG_RARA, cta: 'Watch on IG', src: 'IG' },
  { title: 'CIRCUIT × DJ Marfox', type: 'Collab', sub: 'w/ DJ Marfox', bpm: 136, key: '5A', min: 4, seed: 23,
    desc: 'CIRCUIT with Lisbon batida pioneer DJ Marfox. Two continents, one low end.', href: IG_RARA, cta: 'Watch on IG', src: 'IG' },
  { title: 'Talent Show', type: 'Single', sub: 'w/ Blayd', bpm: 140, key: '10A', min: 3, seed: 37,
    desc: 'RARA × Blayd. Club weapon. Turn it up.', href: BC, cta: 'Bandcamp', src: 'BNDCMP' },
  { title: 'In My Own World', type: 'EP', sub: 'Machina Records', bpm: 132, key: '3A', min: 14, seed: 41,
    desc: 'The EP, out now on Machina Records.', href: BC, cta: 'Bandcamp', src: 'BNDCMP' },
  { title: 'F.R.E.A.K.Y', type: 'Single', sub: 'Club', bpm: 142, key: '11B', min: 3, seed: 53,
    desc: 'Hard-hitting club sounds.', href: YT, cta: 'Watch', src: 'YT' },
  { title: 'Back 2 Da Front', type: 'Single', sub: 'w/ MC Katriz', bpm: 138, key: '6A', min: 3, seed: 67,
    desc: 'RARA × MC Katriz. Perreo pressure.', href: YT, cta: 'Watch', src: 'YT' },
  { title: 'Rinse France', type: 'Radio', sub: 'Guest mix', bpm: 135, key: '9A', min: 60, seed: 79,
    desc: 'Guest appearance on Rinse France.', href: IG_RARA, cta: 'Watch on IG', src: 'IG' },
  { title: 'Perreo del Futuro', type: 'Live', sub: 'Perreo', bpm: 130, key: '1A', min: 60, seed: 83,
    desc: 'Perreo for what comes next.', href: IG_RARA, cta: 'Watch on IG', src: 'IG' },
];
TRACKS.forEach((t, i) => {
  t.i = i;
  t.beats = Math.max(64, Math.round(t.min * t.bpm / 16) * 16);          // multiple of 16 beats keeps the loop on-grid
  t.cues = [0.08, 0.3, 0.55, 0.78].map(f => Math.round(t.beats * f / 32) * 32);
  t.kn = parseInt(t.key);
});

/* ---------- synthetic 3-band waveform: lo = kick/bass, mid = claps/vocal, hi = hats ---------- */
const CLAP = new Set([3, 6, 11, 14]);
const energy = (t, b) => {
  const r = hash(Math.floor(b / 32) * 7.13 + t.seed);
  return (Math.floor(b / 16) % 2 === 1 && r < .35) ? .3 : .62 + .38 * r;
};
const wave = (t, b) => {
  const e = energy(t, b), br = e < .35;
  const f = b - Math.floor(b), q = b * 4, s = Math.floor(q) % 16, sf = q - Math.floor(q);
  let lo = br ? .1 : Math.exp(-f * 5.5) * .95 + .16;
  if (!br && s % 4 === 2) lo += Math.exp(-sf * 3) * .22;
  const nz = hash(Math.floor(b * 8) + t.seed * 3);
  const mid = (CLAP.has(s) ? Math.exp(-sf * 3.2) * .85 * e : 0) + .12 + .22 * nz * (br ? 1.6 : 1);
  const hi = ((s % 2) ? .7 : .32) * Math.exp(-sf * 4.5) * (br ? .7 : 1) + .08 * hash(Math.floor(b * 16) + t.seed);
  return [clamp(lo * (br ? 1 : e * 1.08), 0, 1), clamp(mid, 0, 1), clamp(hi, 0, 1)];
};
/* whole-track overview amplitudes for n columns (cached) */
const ovMemo = new Map();
const overviewAmps = (t, n) => {
  const k = t.i + ':' + n; if (ovMemo.has(k)) return ovMemo.get(k);
  const a = [];
  for (let px = 0; px < n; px++) {
    const e = energy(t, px / n * t.beats), n1 = hash(px * .37 + t.seed), n2 = hash(px * .91 + t.seed * 2);
    a.push([clamp(e * (.55 + .45 * n1), 0, 1), clamp(e * (.25 + .5 * n2), 0, 1), clamp(e * .3 * n2, 0, 1)]);
  }
  ovMemo.set(k, a); return a;
};

/* ---------- transport state / clock ---------- */
const S = { tr: TRACKS[0], bpm: TRACKS[0].bpm, playing: !REDUCE, held: false, aB: 0, aT: 0, boot: performance.now() };
const AU = { ctx: null, on: false, nextStep: 0, timer: 0 };
const EQ = { lo: 0, mid: 0, hi: 0, gain: .8 };
const now = () => AU.on ? AU.ctx.currentTime : performance.now() / 1000;
const wrap = b => ((b % S.tr.beats) + S.tr.beats) % S.tr.beats;
const curPos = () => wrap((S.playing && !S.held) ? S.aB + (now() - S.aT) * S.bpm / 60 : S.aB);
const resync = () => { if (AU.on) AU.nextStep = Math.ceil(S.aB * 4 - 1e-6); };
const setPos = b => { S.aB = wrap(b); S.aT = now(); resync(); };
const kickEnv = () => { const b = curPos(), f = b - Math.floor(b); return Math.exp(-f * 5) * (energy(S.tr, b) > .35 ? 1 : .2); };
const loadHooks = [], playHooks = [];
const onLoad = fn => loadHooks.push(fn), onPlay = fn => playHooks.push(fn);
function load(i, frac, quiet) {
  const t = TRACKS[i];
  S.tr = t; S.bpm = t.bpm; S.rate = 1;
  S.aB = frac != null ? t.beats * frac : Math.max(0, t.cues[0] - 16); S.aT = now(); S.playing = !REDUCE || S.playing; S.held = false; resync();
  loadHooks.forEach(f => f(t, quiet)); playHooks.forEach(f => f(S.playing));
  if (!quiet) toast('LOADED › ' + t.title.toUpperCase());
}
function togglePlay() {
  if (S.playing) { S.aB = curPos(); S.playing = false; } else { S.aT = now(); S.playing = true; resync(); }
  playHooks.forEach(f => f(S.playing));
}
const cue = n => setPos(S.tr.cues[n || 0]);
/* pitch: rate 0.92..1.08 around the track's native BPM; keeps position continuous */
function setRate(r) { S.aB = curPos(); S.aT = now(); S.rate = clamp(r, .92, 1.08); S.bpm = S.tr.bpm * S.rate; resync(); }
/* drag-scrub helper: call grab/move(deltaBeats)/release */
const scrub = { grab() { S.aB = curPos(); S.held = true; }, move(db) { S.aB = wrap(S.aB + db); }, release() { S.held = false; S.aT = now(); resync(); } };

/* ---------- opt-in synth monitor (browser never makes sound unless the user taps) ---------- */
function initAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return false;
  const c = AU.ctx = new Ctx();
  const mk = (type, f, g, q) => { const n = c.createBiquadFilter(); n.type = type; n.frequency.value = f; n.gain.value = g; if (q) n.Q.value = q; return n; };
  AU.bus = c.createGain(); AU.bus.gain.value = .9;
  AU.lo = mk('lowshelf', 200, EQ.lo); AU.mid = mk('peaking', 1000, EQ.mid, .8); AU.hi = mk('highshelf', 4000, EQ.hi);
  AU.master = c.createGain(); AU.master.gain.value = EQ.gain * .6;
  AU.an = c.createAnalyser(); AU.an.fftSize = 1024; AU.an.smoothingTimeConstant = .6;
  AU.bus.connect(AU.lo); AU.lo.connect(AU.mid); AU.mid.connect(AU.hi); AU.hi.connect(AU.master); AU.master.connect(AU.an); AU.an.connect(c.destination);
  AU.fd = new Uint8Array(AU.an.frequencyBinCount); AU.td = new Uint8Array(AU.an.fftSize);
  const nb = c.createBuffer(1, c.sampleRate * .5, c.sampleRate), d = nb.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  AU.noise = nb; return true;
}
function voice(step, t) {
  const c = AU.ctx, g = (v, dur) => { const n = c.createGain(); n.gain.setValueAtTime(v, t); n.gain.exponentialRampToValueAtTime(.0001, t + dur); n.connect(AU.bus); return n; };
  if (step % 4 === 0) { const o = c.createOscillator(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + .12); o.connect(g(1, .38)); o.start(t); o.stop(t + .4); }
  if (CLAP.has(step)) { const s = c.createBufferSource(), f = c.createBiquadFilter(); s.buffer = AU.noise; f.type = 'bandpass'; f.frequency.value = 1700; f.Q.value = .9; s.connect(f); f.connect(g(.6, .16)); s.start(t); s.stop(t + .2); }
  if (step % 2 === 1) { const s = c.createBufferSource(), f = c.createBiquadFilter(); s.buffer = AU.noise; f.type = 'highpass'; f.frequency.value = 7500; s.connect(f); f.connect(g(step % 4 === 3 ? .22 : .12, .05)); s.start(t); s.stop(t + .08); }
  if (step === 6 || step === 14 || step === 10) { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 55; o.connect(g(.55, .28)); o.start(t); o.stop(t + .3); }
}
function tick() {
  if (!AU.on || !S.playing || S.held) return;
  const horizon = AU.ctx.currentTime + .15;
  for (;;) {
    const t = S.aT + (AU.nextStep / 4 - S.aB) * 60 / S.bpm;
    if (t > horizon) break;
    if (t >= AU.ctx.currentTime - .02) voice(((AU.nextStep % 16) + 16) % 16, t);
    AU.nextStep++;
  }
}
async function toggleAudio(btn) {
  const flag = on => { if (btn) btn.setAttribute('aria-pressed', on); };
  if (AU.on) { const p = curPos(); AU.on = false; clearInterval(AU.timer); AU.ctx.suspend(); S.aB = p; S.aT = now(); flag(false); return toast('MONITOR OFF'); }
  if (!AU.ctx && !initAudio()) return toast('AUDIO NOT SUPPORTED');
  const p = curPos(); await AU.ctx.resume(); AU.on = true;
  S.aB = p; S.aT = now(); resync(); AU.timer = setInterval(tick, 25);
  flag(true); toast('MONITOR ON · SYNTH TEST LOOP');
}
/* knob/fader model: gain 0..1, lo/mid/hi -12..+12 dB */
const CTRL = [
  { k: 'gain', label: 'Gain', min: 0, max: 1, def: .8, fmt: v => (v ? (20 * Math.log10(v)).toFixed(1) : '-∞') + 'dB' },
  { k: 'lo', label: 'Low', min: -12, max: 12, def: 0, fmt: v => (v > 0 ? '+' : '') + v.toFixed(1) },
  { k: 'mid', label: 'Mid', min: -12, max: 12, def: 0, fmt: v => (v > 0 ? '+' : '') + v.toFixed(1) },
  { k: 'hi', label: 'High', min: -12, max: 12, def: 0, fmt: v => (v > 0 ? '+' : '') + v.toFixed(1) },
];
function setEQ(k, v) {
  const n = CTRL.find(c => c.k === k); EQ[k] = clamp(v, n.min, n.max);
  if (AU.ctx) { if (k === 'gain') AU.master.gain.value = EQ[k] * .6; else AU[k].gain.value = EQ[k]; }
  return EQ[k];
}

/* ---------- metering ---------- */
function levels(pos, tt) {
  const [lo, mid, hi] = wave(S.tr, pos);
  let l = (lo * .62 + mid * .3 + hi * .08), r = l * (.94 + .06 * Math.sin(tt * 2.3)) + .02 * Math.sin(tt * 5);
  if (AU.on && S.playing) {
    AU.an.getByteTimeDomainData(AU.td); let s = 0; for (let i = 0; i < AU.td.length; i++) { const v = (AU.td[i] - 128) / 128; s += v * v; }
    l = r = clamp(Math.sqrt(s / AU.td.length) * 3.2, 0, 1);
  } else l *= (.55 + EQ.gain * .55);
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
/* spectrum model: N smoothed bands + falling peaks */
function makeSpectrum(N) {
  const sp = { N, v: new Float32Array(N), p: new Float32Array(N), ph: new Float32Array(N) };
  sp.step = (pos, tt) => {
    const [lo, mid, hi] = wave(S.tr, pos), live = AU.on && S.playing;
    if (live) AU.an.getByteFrequencyData(AU.fd);
    for (let k = 0; k < N; k++) {
      const fx = k / (N - 1), f = fOf(fx); let tg;
      if (live) { const bin = Math.min(AU.fd.length - 1, Math.round(f / (AU.ctx.sampleRate / 2) * AU.fd.length)); tg = Math.pow(AU.fd[bin] / 255, 1.4) * 1.1; }
      else tg = (lo * Math.pow(1 - fx, 2.2) * 1.15 + mid * Math.exp(-Math.pow((fx - .45) / .17, 2)) * .85 + hi * Math.pow(fx, 1.5) * .8 + .05)
        * (.78 + .22 * Math.sin(tt * 3.1 + k * 1.7)) * (1 - fx * .3) * Math.pow(10, eqDb(f) / 40) * (.4 + EQ.gain * .75) * (S.playing ? 1 : .08);
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
  const pages = [['v1', 'club'], ['v2', 'studio'], ['v3', 'hud']], host = $('#vs');
  if (host) host.innerHTML = pages.map(([p, n], i) => `<a href="${p}.html" ${p === cur ? 'aria-current="page"' : ''} aria-label="Version ${i + 1}, ${n}">${i + 1}</a>`).join('') + '<a href="./" aria-label="All versions" class="all">⌂</a>';
  addEventListener('keydown', e => {
    const i = pages.findIndex(p => p[0] === cur), d = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (d && !/input|textarea/i.test(e.target.tagName)) location.href = pages[(i + d + pages.length) % pages.length][0] + '.html';
  });
}
/* main loop: fn(ts, pos, tt) every frame */
function run(fn) {
  let frame = 0;
  const loop = ts => { requestAnimationFrame(loop); frame++; const pos = curPos(); fn(ts, pos, S.playing ? ts / 1000 : 0, frame); };
  S.boot = performance.now(); requestAnimationFrame(loop);
}
function ready(fn) {
  let done = false; const go = () => { if (done) return; done = true; fn(); };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go); setTimeout(go, 1500);
}
return { $, $$, DPR, REDUCE, hash, clamp, pad, fmt, EMAIL, MAILTO, IG: IG_RARA, IG_OMNI, BC, YT, TRACKS, CLAP, energy, wave, overviewAmps, S, AU, EQ, CTRL, now, wrap, curPos, setPos,
  kickEnv, load, onLoad, onPlay, togglePlay, cue, setRate, scrub, toggleAudio, setEQ, levels, stepVU, VU, fOf, eqDb, makeSpectrum, fit, toast, copyEmail, miamiTime, drag, switcher, run, ready };
})();
