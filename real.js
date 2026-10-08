/* RARA real-audio engine for v4–v7.
   Two real <audio> elements (Jet Fuel, Beastie), one transport, a live analyser (real kick detection,
   no invented BPM) and real waveform peaks decoded from the mp3s. Each page owns its own look. */
window.REAL = (() => {
'use strict';
const TRACKS = [
  { id: 'jet-fuel', title: 'Jet Fuel (Batida Edit)', short: 'Jet Fuel', tag: 'Batida Edit', src: 'audio/jet-fuel-batida-edit.mp3' },
  { id: 'beastie', title: 'Beastie', short: 'Beastie', tag: 'Single', src: 'audio/beastie.mp3' },
];
const EMAIL = 'omnisoundslabel@gmail.com';
const MAILTO = 'mailto:' + EMAIL + '?subject=Booking%20RARA%20%F0%9F%8C%8B';
const BC = 'https://machinarecords.bandcamp.com', YT = 'https://www.youtube.com/watch?v=Cv6b3C2QPJo';
const IG = 'https://instagram.com/raravulcain', IG_OMNI = 'https://instagram.com/omnisoundspace';
/* everything else RARA: real names, real links, no audio on this page */
const RELEASES = [
  { title: 'Jolene 3-Hour Set', type: 'Set', note: '3 hours, front to back', href: IG, cta: 'Instagram' },
  { title: 'CIRCUIT', type: 'Collab', note: 'with DJ Marfox', href: IG, cta: 'Instagram' },
  { title: 'TALENT SHOW', type: 'Single', note: 'with Blayd', href: BC, cta: 'Bandcamp' },
  { title: 'IN MY OWN WORLD', type: 'EP', note: 'Machina Records', href: BC, cta: 'Bandcamp' },
  { title: 'F.R.E.A.K.Y', type: 'Single', note: 'Club', href: YT, cta: 'YouTube' },
  { title: 'BACK 2 DA FRONT', type: 'Single', note: 'with MC Katriz', href: YT, cta: 'YouTube' },
  { title: 'Rinse France', type: 'Radio', note: 'Guest appearance', href: IG, cta: 'Instagram' },
  { title: 'Perreo del Futuro', type: 'Live', note: 'Perreo', href: IG, cta: 'Instagram' },
];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad = n => String(Math.floor(n)).padStart(2, '0');
const fmt = s => (isFinite(s) && s >= 0) ? Math.floor(s / 60) + ':' + pad(s % 60) : '–:––';
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hooks = {};
const on = (ev, fn) => ((hooks[ev] = hooks[ev] || []).push(fn), fn);
const emit = (ev, a) => (hooks[ev] || []).forEach(f => f(a));

/* ---------- real <audio> elements ---------- */
const els = TRACKS.map((t, i) => {
  const a = document.createElement('audio');
  a.src = t.src; a.preload = 'metadata'; a.setAttribute('playsinline', ''); a.dataset.track = t.id;
  a.addEventListener('play', () => { emit('play', i); emit('state', i); });
  a.addEventListener('pause', () => { emit('pause', i); emit('state', i); });
  a.addEventListener('loadedmetadata', () => emit('meta', i));
  a.addEventListener('ended', () => { a.currentTime = 0; const n = (i + 1) % TRACKS.length; emit('ended', i); play(n); });
  a.addEventListener('error', () => emit('error', i));
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(a));
  if (document.body) document.body.appendChild(a);
  return a;
});
let cur = 0;
const isPlaying = i => i == null ? els.some(a => !a.paused) : !els[i].paused;
const dur = i => els[i].duration;
const time = i => els[i].currentTime;
const prog = i => (els[i].duration > 0 ? els[i].currentTime / els[i].duration : 0);

/* ---------- Web Audio analyser (only when same-origin over http; file:// would mute the tracks) ---------- */
let ctx = null, an = null, fd = null, td = null, wired = false;
const canWire = /^https?:$/.test(location.protocol);
function wire() {
  if (wired || !canWire) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext; ctx = ctx || new AC();
    an = ctx.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = .55;
    fd = new Uint8Array(an.frequencyBinCount); td = new Uint8Array(an.fftSize);
    els.forEach(a => ctx.createMediaElementSource(a).connect(an));
    an.connect(ctx.destination); wired = true;
  } catch (e) { an = null; }
}
function play(i) {
  if (i == null) i = cur;
  wire(); if (ctx && ctx.state !== 'running') ctx.resume();
  els.forEach((a, j) => { if (j !== i && !a.paused) a.pause(); });
  const changed = cur !== i; cur = i;
  const p = els[i].play(); if (p && p.catch) p.catch(() => emit('blocked', i));
  if (changed) emit('track', i);
  media();
}
function pause() { els.forEach(a => a.pause()); }
function toggle(i) { if (i == null) i = cur; (i === cur && isPlaying(i)) ? pause() : play(i); }
function next(d = 1) { play((cur + d + TRACKS.length) % TRACKS.length); }
function seek(i, f) { const a = els[i]; if (a.duration > 0) a.currentTime = clamp(f, 0, .9999) * a.duration; }
function media() {
  if (!('mediaSession' in navigator)) return;
  const t = TRACKS[cur];
  try {
    navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: 'RARA', album: 'Machina Records' });
    navigator.mediaSession.setActionHandler('play', () => play(cur));
    navigator.mediaSession.setActionHandler('pause', pause);
    navigator.mediaSession.setActionHandler('nexttrack', () => next(1));
    navigator.mediaSession.setActionHandler('previoustrack', () => next(-1));
  } catch (e) { /* older browsers */ }
}

/* ---------- live levels + kick detection (call once per frame) ---------- */
const L = { low: 0, mid: 0, high: 0, kick: 0, beats: 0, hit: false, live: false };
let avg = 0, lastHit = 0, flux = 0, lastLow = 0;
function analyse(ts) {
  ts = ts || performance.now(); L.hit = false;
  const playing = isPlaying();
  if (an && playing && ctx.state === 'running') {
    an.getByteFrequencyData(fd);
    const band = (a, b) => { let s = 0; for (let k = a; k < b; k++) s += fd[k]; return s / ((b - a) * 255); };
    const lo = band(1, 5), mi = band(6, 40), hi = band(60, 200);   // ≈43–215Hz / 260Hz–1.7k / 2.6k–8.6k
    L.low += (lo - L.low) * .6; L.mid += (mi - L.mid) * .5; L.high += (hi - L.high) * .5; L.live = true;
    flux = lo - lastLow; lastLow = lo;
    avg += (lo - avg) * .04;
    if (lo > .45 && lo > avg * 1.18 && flux > .02 && ts - lastHit > 260) { lastHit = ts; L.kick = 1; L.hit = true; L.beats++; }
  } else {
    L.low *= .9; L.mid *= .9; L.high *= .9; L.live = false;
  }
  L.kick *= .90;
  return L;
}
/* time-domain scope (0..255 centred at 128) */
const scope = () => (an && wired && isPlaying() ? (an.getByteTimeDomainData(td), td) : null);
const spectrum = () => (an && wired && isPlaying() ? fd : null);

/* ---------- real waveform peaks, decoded from the mp3 ---------- */
const peakMemo = {};
function peaks(i, n) {
  const k = i + ':' + n; if (peakMemo[k]) return peakMemo[k];
  return (peakMemo[k] = fetch(TRACKS[i].src).then(r => r.arrayBuffer()).then(buf => {
    const AC = window.AudioContext || window.webkitAudioContext; ctx = ctx || new AC();
    return new Promise((ok, no) => ctx.decodeAudioData(buf, ok, no));
  }).then(ab => {
    const d = ab.getChannelData(0), step = Math.floor(d.length / n), out = new Float32Array(n);
    for (let c = 0; c < n; c++) { let m = 0, s = c * step; for (let j = 0; j < step; j += 8) { const v = Math.abs(d[s + j]); if (v > m) m = v; } out[c] = m; }
    const mx = Math.max(...out) || 1; return Array.from(out, v => v / mx);
  }).catch(() => null));
}

/* ---------- version switcher shared by v4–v7 (also fills #vs) ---------- */
const PAGES = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7'];
function switcher(curPage, linkHtml) {
  const host = document.getElementById('vs'); if (!host) return;
  host.innerHTML = PAGES.map((p, i) => `<a href="${p}.html" ${p === curPage ? 'aria-current="page"' : ''} aria-label="Version ${i + 1}">${i + 1}</a>`).join('') + '<a href="./" aria-label="All versions" class="all">⌂</a>';
  addEventListener('keydown', e => {
    const i = PAGES.indexOf(curPage), d = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (d && !/input|textarea/i.test(e.target.tagName)) location.href = PAGES[(i + d + PAGES.length) % PAGES.length] + '.html';
  });
}
/* scale a headline's font-size so it spans exactly `avail()` px, whatever font the phone falls back to */
function fitText(el, avail) {
  const run = () => { el.style.fontSize = '100px'; const pw = el.style.width; el.style.width = 'max-content'; const w = el.getBoundingClientRect().width; el.style.width = pw; if (w > 0) el.style.fontSize = (100 * avail() / w).toFixed(2) + 'px'; };
  run(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(run); addEventListener('resize', run);
}
const copyEmail = async cb => { try { await navigator.clipboard.writeText(EMAIL); cb && cb(true); } catch (e) { cb && cb(false); } };

return { TRACKS, RELEASES, EMAIL, MAILTO, BC, YT, IG, IG_OMNI, REDUCE, els, on, play, pause, toggle, next, seek, isPlaying, dur, time, prog, fmt, pad, clamp,
  analyse, scope, spectrum, peaks, L, switcher, fitText, copyEmail, get cur() { return cur; }, get live() { return !!an; } };
})();
