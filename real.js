/* RARA real-audio engine + real content (events, releases, bio) for every version.
   Two real <audio> elements (Jet Fuel, Beastie), one transport, a live analyser (real kick detection,
   no invented BPM) and real waveform peaks decoded from the mp3s. Each page owns its own look. */
window.REAL = (() => {
'use strict';
const TRACKS = [
  { id: 'jet-fuel', title: 'Jet Fuel (Batida Edit)', short: 'Jet Fuel', tag: 'Batida Edit', date: 'Mar 2026', src: 'audio/jet-fuel-batida-edit.mp3' },
  { id: 'beastie', title: 'Beastie', short: 'Beastie', tag: 'Single', date: 'Mar 2026', src: 'audio/beastie.mp3' },
];
const EMAIL = 'omnisoundslabel@gmail.com';
const MAILTO = 'mailto:' + EMAIL + '?subject=Booking%20RARA%20%F0%9F%8C%8B';
const BC = 'https://machinarecords.bandcamp.com';
const IG = 'https://instagram.com/raravulcain', IG_OMNI = 'https://instagram.com/omnisoundspace', IG_MACHINA = 'https://instagram.com/machinarecs', IG_HOOP = 'https://instagram.com/hoopclubmia';
const yt = q => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
const BIO = { line: 'Producer/DJ', crews: ['@omnisoundspace', '@machinarecs', '@hoopclubmia'], role: '“The Glue”, drummer for @mrfloydlarry' };
/* third release: on Bandcamp, no audio file here, so it links out */
const NUBETTER = { title: 'NUBETTER', type: 'Release', note: 'Machina Records', href: BC, cta: 'Bandcamp' };
/* real events and appearances, newest first. Only facts RARA posted. quote = his own words. */
const EVENTS = [
  { id: 'circuit', title: 'CIRCUIT: DJ MARFOX', short: 'Circuit', kind: 'Direct support', date: 'Oct 3, 2026', venue: 'The Boombox Miami', clip: 'circuit',
    line: 'Machina Records presents DJ Marfox, the Lisbon batida pioneer, live in Miami. RARA direct support.', flyer: 'flyers/circuit-marfox-1.jpg', fr: '4/5', fp: '50% 36%', alt: 'DJ Marfox feature graphic: “You need to know DJ Marfox”', href: IG, cta: 'Instagram' },
  { id: 'jolene', title: 'JOLENE SOUND ROOM', short: 'Jolene', kind: '3-hour set', date: 'Oct 1, 2026', time: '10 PM–1 AM', venue: 'Jolene Sound Room, Miami', who: 'Opening for @berrakkita and @v1fro',
    quote: 'Been itching for an extended set, expect a wide range of afro leaning dance music and a lot of original [music]', href: IG, cta: 'Instagram' },
  { id: 'rinse', title: 'RINSE FRANCE', short: 'Rinse France', kind: 'Guest mix', date: 'July 2026', venue: 'Rinse France on YouTube', live: false,
    line: 'A guest mix for Rinse France. Not a live show: it’s a mix.', href: yt('RARA Rinse France guest mix'), cta: 'YouTube' },
  { id: 'redhouse', title: 'REDHOUSE', short: 'Redhouse', kind: 'Live set', date: 'Mar 9, 2026', venue: 'Miami',
    quote: 'ONE OF THE BEST SETS OF MY LIFE', href: IG, cta: 'Instagram' },
  { id: 'perreo', title: 'PERREO DEL FUTURO', short: 'Perreo del Futuro', kind: 'Anniversary party', date: 'Feb 28, 2026', venue: 'Miami',
    line: 'Played their 4-year anniversary (Feb 28, 2026) and their 3-year anniversary (Feb 2025).', href: IG, cta: 'Instagram' },
  { id: 'iiipoints', title: 'III POINTS', short: 'III Points', kind: 'Festival · B2B', date: 'Oct 17–18, 2025', venue: 'The Garden (Little River Cultural Garden), Miami', who: 'RARA B2B V1FRO', clip: 'iiipoints',
    quote: 'We’ve been cooking up big ethnic chunes', line: 'Full set on YouTube via Masisi Radio.', flyer: 'flyers/iiipoints-b2b.jpg', fr: '16/9', fp: '50% 50%', alt: 'RARA B2B V1FRO at III Points, still from the Masisi Radio set video', href: yt('Masisi Radio RARA V1FRO III Points'), cta: 'Full set · YouTube' },
];
/* releases that aren't playable on this page (no audio file here), newest first. Links go where RARA posted them. */
const RELS = [
  { id: 'imow', title: 'IN MY OWN WORLD', type: 'EP', note: 'Out Sept 4', href: IG, cta: 'Instagram' },
  { id: 'freaky', title: 'F.R.E.A.K.Y', type: 'Single', note: 'with MC Katriz', href: IG, cta: 'Instagram' },
  { id: 'b2df', title: 'BACK 2 DA FRONT', type: 'Single', note: 'with MC Katriz', href: IG, cta: 'Instagram' },
  { id: 'nubetter', title: 'NUBETTER', type: 'Release', note: 'Machina Records', href: BC, cta: 'Bandcamp' },
];
/* the real clips from RARA’s Instagram, re-encoded silent + small (videos/web). kind = what it is, in his words. */
const CLIPS = {
  circuit: { src: 'videos/web/circuit.mp4', poster: 'videos/web/circuit.jpg', w: 540, h: 960, name: 'DJ MARFOX · CIRCUIT', note: 'DJ Marfox live in Miami for Circuit, Machina Records, The Boombox Miami. Oct 3', ev: 'circuit' },
  iiipoints: { src: 'videos/web/iiipoints.mp4', poster: 'videos/web/iiipoints.jpg', w: 960, h: 540, name: 'ROAD TO III POINTS', note: 'Soundtracked by an unreleased KUJO × RARA × BLAYD two-track', ev: 'iiipoints' },
  ready: { src: 'videos/web/ready.mp4', poster: 'videos/web/ready.jpg', w: 540, h: 960, name: 'ARE YA READY', note: 'AI AI AI AI ARE YA READY??????' },
  talent: { src: 'videos/web/talent.mp4', poster: 'videos/web/talent.jpg', w: 960, h: 540, name: 'TALENT SHOW', note: 'BLAYD – Talent Show' },
};
const SLOGAN = 'black dance music is back in miami';
const when = e => [e.date, e.time].filter(Boolean).join(' · ');
const EV = Object.fromEntries(EVENTS.map(e => [e.id, e]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad = n => String(Math.floor(n)).padStart(2, '0');
const fmt = s => (isFinite(s) && s >= 0) ? Math.floor(s / 60) + ':' + pad(s % 60) : '–:––';
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hooks = {};
const on = (ev, fn) => ((hooks[ev] = hooks[ev] || []).push(fn), fn);
const emit = (ev, a) => (hooks[ev] || []).forEach(f => f(a));

/* ---------- clips: muted, looping, only playing while on screen ---------- */
const clipHtml = (id, cls = '', extra = '') => { const c = CLIPS[id];
  return `<video class="clip ${cls}" data-clip="${id}" src="${c.src}" poster="${c.poster}" width="${c.w}" height="${c.h}" muted loop playsinline preload="${REDUCE ? 'none' : 'metadata'}" aria-label="${c.note}" ${REDUCE ? '' : 'autoplay'} disablepictureinpicture ${extra}></video>`; };
let clipIO = null;
function armClips(root = document) {
  if (REDUCE) return;
  clipIO = clipIO || new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting) { const p = v.play(); p && p.catch && p.catch(() => {}); } else v.pause(); }), { threshold: .12 });
  root.querySelectorAll('video.clip').forEach(v => { if (v._armed) return; v._armed = true; v.muted = true; clipIO.observe(v); });
}

/* event media: the flyer, the clip, or (Circuit) both side by side. Pages style .mvw / .duo / video.clip to taste. */
const mvw = (id, ar, pos) => `<div class="mvw"${ar ? ` style="aspect-ratio:${ar}"` : ''}>${clipHtml(id, '', pos ? `style="object-position:${pos}"` : '')}<span class="cl"><i></i>${CLIPS[id].name}</span></div>`;
function evMedia(e) {
  if (e.clip) return mvw(e.clip, e.fr, e.clip === 'circuit' ? '50% 42%' : '50% 50%');
  return e.flyer ? `<img src="${e.flyer}" alt="${e.alt}" loading="lazy" style="aspect-ratio:${e.fr};object-position:${e.fp}">` : '';
}
/* a swipeable strip of clips with RARA's own captions */
const reel = ids => `<div class="reel">${ids.map(id => { const c = CLIPS[id]; return `<figure class="rf"><div class="mvw" style="aspect-ratio:${c.w}/${c.h}">${clipHtml(id)}<span class="cl"><i></i>${c.name}</span></div><figcaption>${c.note}</figcaption></figure>`; }).join('')}</div>`;
(() => { const st = document.createElement('style'); st.textContent = '.reel{display:flex;gap:6px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none}.reel::-webkit-scrollbar{display:none}.reel .rf{flex:none;margin:0;scroll-snap-align:start;max-width:86vw}.reel .rf .mvw{height:min(340px,56vh)}.reel figcaption{padding:8px 0 0;font:700 10px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;max-width:34ch}.mvw{position:relative;overflow:hidden;background:#000}.mvw video{display:block;width:100%;height:100%;object-fit:cover}.duo{display:grid;grid-template-columns:1fr 1fr;gap:2px}.duo>img,.duo>.mvw{width:100%;aspect-ratio:4/5;object-fit:cover;min-width:0}.cl{position:absolute;left:6px;bottom:6px;right:6px;display:flex;align-items:center;gap:6px;font:700 9px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.14em;color:#fff;text-shadow:0 1px 3px #000;pointer-events:none}.cl i{flex:none;width:6px;height:6px;border-radius:50%;background:#f33;animation:clb 1.4s steps(2) infinite}@keyframes clb{50%{opacity:0}}@media(prefers-reduced-motion:reduce){.cl i{animation:none}}'; document.head.appendChild(st); })();

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
document.addEventListener('DOMContentLoaded', () => armClips());
let cur = 0;
const isPlaying = i => i == null ? els.some(a => !a.paused) : !els[i].paused;
const dur = i => els[i].duration;
const time = i => els[i].currentTime;
const prog = i => (els[i].duration > 0 ? els[i].currentTime / els[i].duration : 0);

/* ---------- Web Audio analyser (only when same-origin over http; file:// would mute the tracks) ---------- */
let ctx = null, an = null, fd = null, td = null, wired = false, muted = false;
const EQV = { lo: 0, mid: 0, hi: 0, gain: 1 }; let chain = null;
const canWire = /^https?:$/.test(location.protocol);
function wire() {
  if (wired || !canWire) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext; ctx = ctx || new AC();
    an = ctx.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = .55;
    fd = new Uint8Array(an.frequencyBinCount); td = new Uint8Array(an.fftSize);
    const bq = (type, f, g, q) => { const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.gain.value = g; if (q) n.Q.value = q; return n; };
    chain = { lo: bq('lowshelf', 200, EQV.lo), mid: bq('peaking', 1000, EQV.mid, .8), hi: bq('highshelf', 4000, EQV.hi), gain: ctx.createGain() };
    chain.gain.gain.value = muted ? 0 : EQV.gain;
    chain.lo.connect(chain.mid); chain.mid.connect(chain.hi); chain.hi.connect(chain.gain); chain.gain.connect(an);
    els.forEach(a => ctx.createMediaElementSource(a).connect(chain.lo));
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
/* real EQ + mute on the live audio (only exists over http, where the analyser is wired) */
function eq(k, v) { EQV[k] = v; if (chain) { if (k === 'gain') chain.gain.gain.value = muted ? 0 : v; else chain[k].gain.value = v; } }
function mute() { muted = !muted; if (chain) chain.gain.gain.value = muted ? 0 : EQV.gain; else els.forEach(a => { a.muted = muted; }); return muted; }
function rate(r) { els.forEach(a => { a.playbackRate = r; }); }
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

return { when, TRACKS, EVENTS, EV, NUBETTER, RELS, CLIPS, clipHtml, armClips, media: evMedia, reel, mvw, SLOGAN, BIO, EMAIL, MAILTO, BC, IG, IG_OMNI, IG_MACHINA, IG_HOOP, yt, REDUCE, els, on, play, pause, toggle, next, seek, isPlaying, dur, time, prog, fmt, pad, clamp,
  rate, eq, mute, get muted() { return muted; }, get sampleRate() { return ctx ? ctx.sampleRate : 48000; }, analyse, scope, spectrum, peaks, L, switcher, fitText, copyEmail, get cur() { return cur; }, get live() { return !!an; } };
})();
