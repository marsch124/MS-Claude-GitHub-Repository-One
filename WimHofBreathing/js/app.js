/* AMS Breathing — app logic (vanilla JS, no build) */
'use strict';

const APP_VERSION = '1.3.0';

/* ---------- Version history (newest first) ---------- */
const CHANGELOG = [
  {
    version: '1.3.0',
    date: '2026-07-27 17:58',
    changes: [
      'Renamed the app to AMS Breathing.',
      'Added a Dedication & thanks section in Settings crediting the Wim Hof Method, Kitaro Waga and the wider wellness community for the practice.',
      'The breathing ball is now much larger and more dynamic, with a bigger breath-count number.',
      'New custom icons throughout (statistics, settings, delete, note) matching the app’s look.',
      '“Quick” tempo is now labelled “Fast”.',
      'Added Data tools in Settings: back up everything to a file, import a backup, and export your sessions to an Excel (.xlsx) file.',
      'You can now attach a photo to a saved session from the Statistics page.',
    ],
  },
  {
    version: '1.2.2',
    date: '2026-07-27 17:47',
    changes: [
      'The app now updates itself automatically: whenever you open it with a connection, it loads the latest version and refreshes its offline copy in the background — no manual steps ever needed. Offline still works from the last saved copy.',
    ],
  },
  {
    version: '1.2.1',
    date: '2026-07-26 16:46',
    changes: [
      'Hardening pass before publishing: a session can no longer get stuck if something unexpected happens — the screen wake-lock and guidance are always released and the app returns home cleanly.',
      'Saving settings, sessions and profiles no longer fails silently in private-browsing or low-storage situations.',
      'When guidance is muted, the app now stays fully silent, including the "session starting" cue.',
      'Minor install/PWA polish (icons, metadata) for a cleaner Add-to-Home-Screen on iPhone.',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-07-26 13:09',
    changes: [
      'Multiple profiles: Martin and Anna each have their own settings and statistics. Switch person on the home screen ("Practising as"), and add, rename or remove people under Settings.',
      'Added an AMS logo — a breathing-ripple mark with the AMS wordmark — in the home header.',
      'The breathing ball on the home screen now previews the selected tempo: its pace changes as you switch between Slow, Normal and Quick before starting.',
      'Refined the breath-hold ball colours: blue → yellow at 1 minute → orange at 2 minutes → red at 3 minutes.',
      'Removed the "Clear all sessions" button from Statistics (too easy to hit by accident). Deleting all sessions now lives in Settings → Danger zone and requires two confirmations. Deleting a single session from Statistics is unchanged.',
      'Version history now shows the date and time of every release.',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-07-26 12:51',
    changes: [
      'Fixed: guidance voice and the on-screen display stopped working from the second cycle onward. Speech no longer cancels itself before every cue and is kept alive across the long breath-holds, and the breathing animation now runs on a continuous render loop so every cycle updates reliably.',
      'Breathing tempo tuned so the inhale is now clearly a little longer than the exhale, at every speed.',
      'The app now announces the final breath of each cycle ("Last breath") in text and speech.',
      'Breath-hold voice cues get closer together the longer you hold: every 30 seconds up to 2 minutes, then every 15 seconds (2:15, 2:30, 2:45, 3:15, 3:45 …) to keep spirits up.',
      'Encouraging affirmations and mindful sayings now appear (and are occasionally spoken) during the exhale breath-hold.',
      'The breathing ball is now large and dominates the screen, has a softer organic shape, and gradually shifts colour during a hold — blue → orange at 2 minutes → red at 3 minutes.',
      'Added a short "relax" pause after the 15-second recovery hold before the next cycle begins.',
      'Interrupted sessions (ended with ✕) are now also saved to statistics, marked as interrupted, including the partial breath-hold in progress.',
      'Statistics: add or edit a note/comment on any saved session, delete individual sessions, or clear all sessions.',
      'Added a temporary "5" breaths-per-cycle option for quick testing (to be removed later).',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-07-26 11:45',
    changes: [
      'Initial release (then named Wim Hof Breathing; renamed to AMS Breathing in v1.3.0).',
      'Home page with three pre-session settings: breaths per cycle (25 / 30 / 35), breathing tempo (slow / normal / quick) and number of cycles (3 / 4). Defaults: 30 breaths, normal tempo, 3 cycles. Choices are remembered between sessions.',
      'Start a session by double-tapping anywhere on the home screen.',
      'Guided breathing: an animated orb plus on-screen text and spoken cues say "Breathe in" / "Breathe out" for every breath of the cycle, with a live breath counter.',
      'Exhale breath-hold (empty lungs): after the breaths the app says "Fully breathe out, hold your breath" and runs a count-up stopwatch, announcing every 30 seconds. End it whenever you must by double-tapping the screen; the hold time is recorded.',
      'Recovery breath-hold (full lungs): immediately after, the app says "Take a large breath in and hold for 15 seconds", then cues 5 seconds, 10 seconds and finally "Breathe out" at 15 seconds.',
      'Repeats the full cycle 3 or 4 times, then automatically saves the session for statistics.',
      'Statistics page, plus Settings (appearance, guide voice, how-this-works, version history). Installable offline PWA with wake-lock.',
    ],
  },
];

/* ---------- Settings model ---------- */
const TEMPO = {
  slow:   { inhale: 3.2, exhale: 2.6, label: 'Slow' },
  normal: { inhale: 2.2, exhale: 1.7, label: 'Normal' },
  quick:  { inhale: 1.6, exhale: 1.2, label: 'Fast' },
};

const DEFAULTS = { breaths: 30, tempo: 'normal', cycles: 3, theme: 'system', voiceURI: '', voiceOn: true };

/* Safe localStorage helpers — Safari private mode / quota can throw. */
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } }
function lsRemove(k) { try { localStorage.removeItem(k); } catch {} }

/* ---------- Users (profiles) ---------- */
const LS_USERS = 'whb.users';
const LS_CURRENT = 'whb.current';
const DEFAULT_USERS = [{ id: 'martin', name: 'Martin' }, { id: 'anna', name: 'Anna' }];

function loadUsers() {
  try { const u = JSON.parse(localStorage.getItem(LS_USERS)); if (Array.isArray(u) && u.length) return u; } catch {}
  return DEFAULT_USERS.slice();
}
function saveUsers() { lsSet(LS_USERS, JSON.stringify(users)); }
let users = loadUsers();
let currentUserId = localStorage.getItem(LS_CURRENT) || users[0].id;
if (!users.find((u) => u.id === currentUserId)) currentUserId = users[0].id;

/* One-time migration of pre-profiles data into the first user. */
(function migrate() {
  const first = users[0].id;
  const oldS = localStorage.getItem('whb.settings');
  if (oldS) { if (!localStorage.getItem('whb.settings.' + first)) lsSet('whb.settings.' + first, oldS); lsRemove('whb.settings'); }
  const oldSess = localStorage.getItem('whb.sessions');
  if (oldSess) { if (!localStorage.getItem('whb.sessions.' + first)) lsSet('whb.sessions.' + first, oldSess); lsRemove('whb.sessions'); }
})();

function currentUser() { return users.find((u) => u.id === currentUserId) || users[0]; }
function setCurrentUser(id) { currentUserId = id; lsSet(LS_CURRENT, id); settings = loadSettings(); }
function makeUserId(name) {
  const base = (name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) || 'user';
  let id = base, n = 2;
  while (users.find((u) => u.id === id)) id = base + '-' + (n++);
  return id;
}
const settingsKey = () => 'whb.settings.' + currentUserId;
const sessionsKey = () => 'whb.sessions.' + currentUserId;

const RECOVERY_SECONDS = 15;   // full-lungs recovery hold
const SETTLE_SECONDS = 3.5;    // relax pause after recovery, before next cycle

/* Affirmations shown / spoken during the (empty-lungs) breath hold. */
const AFFIRMATIONS = [
  'Relax and let go.',
  'Stay calm and centred.',
  'Your body is strong and capable.',
  'Embrace the stillness.',
  'Every second makes you stronger.',
  'Breathe into the calm.',
  'You are safe and steady.',
  'Let peace fill your body.',
  'Soften your shoulders. Soften your face.',
  'Quiet mind, calm body.',
  'You are doing beautifully.',
  'Ride the wave, stay relaxed.',
];

function loadSettings() {
  try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(settingsKey()) || '{}')); }
  catch { return Object.assign({}, DEFAULTS); }
}
function saveSettings() { lsSet(settingsKey(), JSON.stringify(settings)); }
let settings = loadSettings();

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(sessionsKey()) || '[]'); }
  catch { return []; }
}
function saveSessions(list) { return lsSet(sessionsKey(), JSON.stringify(list)); }

/* ---------- Helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function fmtClock(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}
function fmtDuration(sec) {
  sec = Math.round(sec);
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m === 0) return s + 's';
  return m + 'm ' + String(s).padStart(2, '0') + 's';
}
function spokenMinutes(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  const parts = [];
  if (m > 0) parts.push(m + (m === 1 ? ' minute' : ' minutes'));
  if (s > 0) parts.push(s + (s === 1 ? ' second' : ' seconds'));
  return parts.join(' ') || '0 seconds';
}

/* ---------- Inline SVG icons (match the app's line style) ---------- */
const ICON = {
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19h3l9.5-9.5a1.8 1.8 0 0 0-2.5-2.5L5.5 16.5 5 19z"/><path d="M14 7.5l2.5 2.5"/></svg>',
  photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9a2 2 0 0 1 2-2h1.5l1-1.6a1 1 0 0 1 .85-.4h5.3a1 1 0 0 1 .85.4L17.5 7H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.2"/></svg>',
  del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"/><path d="M10 4h4a1 1 0 0 1 1 1v2H9V5a1 1 0 0 1 1-1z"/><path d="M6.5 7l1 12a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2l1-12"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
};

/* ---------- Generic download / file helpers ---------- */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
}
function dateStamp() { return new Date().toISOString().slice(0, 10); }
function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'user'; }
function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }

/* ---------- Colour interpolation for the breathing ball ---------- */
/* blue (start) -> yellow (1 min) -> orange (2 min) -> red (3 min+) */
const COL_BLUE = ['#5bb0e6', '#2b7bc4'];
const COL_YELLOW = ['#f2d64a', '#e6b81f'];
const COL_ORANGE = ['#f0a24a', '#db7a2c'];
const COL_RED = ['#e8574a', '#cc2f22'];
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbToHex(r) { return '#' + r.map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''); }
function lerp(a, b, f) { return a.map((v, i) => v + (b[i] - v) * f); }
function lerpHex(h1, h2, f) { return rgbToHex(lerp(hexToRgb(h1), hexToRgb(h2), f)); }
function mix(a, b, f) { return [lerpHex(a[0], b[0], f), lerpHex(a[1], b[1], f)]; }
/* Returns [inner, outer] gradient stops for a hold elapsed time (seconds). */
function ballColorsFor(t) {
  if (t <= 60) return mix(COL_BLUE, COL_YELLOW, t / 60);
  if (t <= 120) return mix(COL_YELLOW, COL_ORANGE, (t - 60) / 60);
  if (t <= 180) return mix(COL_ORANGE, COL_RED, (t - 120) / 60);
  return [COL_RED[0], COL_RED[1]];
}
function setBallColor(inner, outer) {
  const o = orb();
  o.style.setProperty('--ball-1', inner);
  o.style.setProperty('--ball-2', outer);
}
function resetBallColor() { setBallColor(COL_BLUE[0], COL_BLUE[1]); }

/* Home-screen preview ball reflects the selected breathing tempo. */
function updateMiniOrbPace() {
  const m = document.querySelector('.orb-mini');
  if (!m) return;
  const t = TEMPO[settings.tempo] || TEMPO.normal;
  m.style.animationDuration = (t.inhale + t.exhale).toFixed(2) + 's';
}

/* ---------- Speech ---------- */
let voices = [];
let speechKeepAlive = null;
function refreshVoices() {
  voices = (window.speechSynthesis ? speechSynthesis.getVoices() : []) || [];
  populateVoiceSelect();
}
function pickVoice() {
  if (!voices.length) return null;
  if (settings.voiceURI) {
    const v = voices.find((v) => v.voiceURI === settings.voiceURI);
    if (v) return v;
  }
  return voices.find((v) => v.lang && v.lang.startsWith('en') && v.default)
      || voices.find((v) => v.lang && v.lang.startsWith('en'))
      || voices[0];
}
/* Speak a cue. We deliberately do NOT call cancel() here: repeatedly cancelling
   wedges speechSynthesis on iOS (this was the cause of "no voice from cycle 2"). */
function speak(text, { force = false } = {}) {
  if (!('speechSynthesis' in window)) return;
  if (!settings.voiceOn && !force) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = 1.0; u.pitch = 1.0;
    speechSynthesis.speak(u);
  } catch { /* ignore */ }
}
function cancelSpeech() { try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch {} }
/* iOS suspends speechSynthesis after idle periods; a periodic resume keeps it warm. */
function startSpeechKeepAlive() {
  if (!('speechSynthesis' in window)) return;
  stopSpeechKeepAlive();
  speechKeepAlive = setInterval(() => {
    try { if (speechSynthesis.speaking) { speechSynthesis.pause(); speechSynthesis.resume(); } else { speechSynthesis.resume(); } } catch {}
  }, 7000);
}
function stopSpeechKeepAlive() { if (speechKeepAlive) { clearInterval(speechKeepAlive); speechKeepAlive = null; } }

/* ---------- Wake lock ---------- */
let wakeLock = null;
async function requestWakeLock() {
  try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); }
  catch { /* ignore */ }
}
function releaseWakeLock() {
  try { if (wakeLock) { wakeLock.release(); wakeLock = null; } } catch {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && running) requestWakeLock();
});

/* ---------- Navigation ---------- */
function show(view) {
  $$('.view').forEach((v) => v.classList.remove('active'));
  $('#view-' + view).classList.add('active');
  window.scrollTo(0, 0);
  if (view === 'stats') renderStats();
}

/* ---------- Double-tap detection ---------- */
function onDoubleTap(el, handler, ignoreSelector) {
  let last = 0;
  el.addEventListener('pointerup', (e) => {
    if (ignoreSelector && e.target.closest(ignoreSelector)) { last = 0; return; }
    const now = Date.now();
    if (now - last < 400) { last = 0; e.preventDefault(); handler(); }
    else { last = now; }
  });
}

/* ================= SESSION ENGINE ================= */
let running = false;
let stopFlag = false;
let tapResolve = null;      // resolves the "wait for double-tap" during an exhale hold
let sessionRec = null;      // record being built for the current session
let sessionProgressed = false;
let inExhaleHold = false;
let holdStartTs = 0;

const orb = () => $('#orb');
const cueMain = () => $('#cue-main');
const cueSub = () => $('#cue-sub');
const cueAffirm = () => $('#cue-affirm');

function handleSessionTap() {
  if (tapResolve) { const r = tapResolve; tapResolve = null; r(); }
}
function setCue(main, sub = '') { cueMain().textContent = main; cueSub().textContent = sub; }

async function interruptibleSleep(ms) {
  const step = 50; let waited = 0;
  while (waited < ms && !stopFlag) { await sleep(Math.min(step, ms - waited)); waited += step; }
}

function setPhaseClass(cls) {
  const o = orb();
  o.className = 'orb' + (cls ? ' ' + cls : '');
}

async function runBreathing(count) {
  const t = TEMPO[settings.tempo];
  const o = orb();
  $('#session-timer').hidden = true;
  $('#tap-hint').textContent = '';
  cueAffirm().textContent = '';
  resetBallColor();
  setPhaseClass('breathing');
  for (let i = 1; i <= count && !stopFlag; i++) {
    if (i === 1) sessionProgressed = true;
    const last = (i === count);
    $('#orb-count').textContent = i;
    // Inhale
    setCue(last ? 'Last breath in' : 'Breathe in', last ? 'Final breath — then hold' : ('Breath ' + i + ' of ' + count));
    o.style.transitionDuration = t.inhale + 's';
    o.classList.remove('exhale'); o.classList.add('inhale');
    speak(last ? 'Last breath. Breathe in.' : 'Breathe in');
    await interruptibleSleep(t.inhale * 1000);
    if (stopFlag) return;
    // Exhale
    setCue('Breathe out', last ? 'Final breath — then hold' : ('Breath ' + i + ' of ' + count));
    o.style.transitionDuration = t.exhale + 's';
    o.classList.remove('inhale'); o.classList.add('exhale');
    speak('Breathe out');
    await interruptibleSleep(t.exhale * 1000);
  }
  $('#orb-count').textContent = '';
}

/* Exhale hold (empty lungs) — count up until double-tap. Returns seconds held. */
async function runExhaleHold() {
  setPhaseClass('hold-empty');
  orb().style.transitionDuration = '1.4s';
  setCue('Fully breathe out', 'Hold your breath — empty lungs');
  speak('Fully breathe out. Hold your breath.');
  const timerEl = $('#session-timer');
  timerEl.hidden = false; timerEl.textContent = '0:00';
  $('#tap-hint').textContent = 'Double-tap when you need to breathe';

  const start = performance.now();
  holdStartTs = start; inExhaleHold = true;
  let nextTimeCue = 30;                 // 30s cadence, tightening to 15s after 2 min
  let nextAffirmSpeak = 8;              // first spoken affirmation ~8s in
  let shownAffirmSlot = -1;

  await new Promise((resolve) => {
    tapResolve = resolve;
    const id = setInterval(() => {
      if (!tapResolve) { clearInterval(id); return; } // ended by tap / quit
      const elapsed = (performance.now() - start) / 1000;
      timerEl.textContent = fmtClock(elapsed);

      // Ball colour shift (blue -> orange @2m -> red @3m)
      const [ci, co] = ballColorsFor(elapsed);
      setBallColor(ci, co);

      // Spoken time cues (denser after 2 minutes)
      if (elapsed >= nextTimeCue) {
        speak(spokenMinutes(nextTimeCue));
        nextTimeCue += (nextTimeCue < 120 ? 30 : 15);
      }

      // Rotating affirmation (visual every ~12s)
      const slot = Math.floor(elapsed / 12);
      if (slot !== shownAffirmSlot) {
        shownAffirmSlot = slot;
        cueAffirm().textContent = AFFIRMATIONS[slot % AFFIRMATIONS.length];
      }
      // Spoken affirmation, offset from time cues, and only when nothing is speaking
      if (elapsed >= nextAffirmSpeak) {
        const speaking = 'speechSynthesis' in window && speechSynthesis.speaking;
        if (!speaking) { speak(AFFIRMATIONS[slot % AFFIRMATIONS.length]); nextAffirmSpeak = elapsed + 30; }
        else { nextAffirmSpeak = elapsed + 3; }
      }
    }, 200);
  });

  inExhaleHold = false;
  const held = (performance.now() - start) / 1000;
  timerEl.textContent = fmtClock(held);
  cueAffirm().textContent = '';
  return held;
}

/* Recovery hold (full lungs) — 15 seconds with cues. */
async function runInhaleHold() {
  resetBallColor();
  setPhaseClass('hold-full');
  orb().style.transitionDuration = '1.5s';
  $('#session-timer').hidden = false;
  $('#tap-hint').textContent = '';
  setCue('Take a large breath in', 'Hold for ' + RECOVERY_SECONDS + ' seconds');
  speak('Take a large breath in and hold your breath for ' + RECOVERY_SECONDS + ' seconds.');

  const marks = [
    { at: 5,  say: '5 seconds',                        text: '5 seconds' },
    { at: 10, say: '10 seconds breath hold performed', text: '10 seconds' },
    { at: RECOVERY_SECONDS, say: 'Breathe out',        text: 'Breathe out' },
  ];
  const start = performance.now();
  let mi = 0;
  const timerEl = $('#session-timer');
  await new Promise((resolve) => {
    const id = setInterval(() => {
      const elapsed = (performance.now() - start) / 1000;
      timerEl.textContent = fmtClock(Math.min(elapsed, RECOVERY_SECONDS));
      while (mi < marks.length && elapsed >= marks[mi].at) {
        const m = marks[mi];
        speak(m.say);
        if (m.at === RECOVERY_SECONDS) setCue('Breathe out', 'Recovery complete'); else cueSub().textContent = m.text;
        mi++;
      }
      if (elapsed >= RECOVERY_SECONDS || stopFlag) { clearInterval(id); resolve(); }
    }, 200);
  });
}

/* Short relax pause between cycles. */
async function runSettle() {
  setPhaseClass('settle');
  orb().style.transitionDuration = '2s';
  setCue('Relax', 'Settle before the next cycle');
  speak('Relax.');
  await interruptibleSleep(SETTLE_SECONDS * 1000);
}

async function runSession() {
  running = true; stopFlag = false;
  sessionProgressed = false; inExhaleHold = false;
  sessionRec = {
    id: Date.now(),
    date: new Date().toISOString(),
    breaths: settings.breaths,
    tempo: settings.tempo,
    cycles: settings.cycles,
    holds: [],
    interrupted: false,
    comment: '',
  };
  startSpeechKeepAlive();
  try {
    await requestWakeLock();
    show('session');
    const totalCycles = settings.cycles;

    resetBallColor();
    setPhaseClass('settle');
    setCue('Get ready…', settings.breaths + ' breaths · ' + TEMPO[settings.tempo].label.toLowerCase() + ' tempo');
    await interruptibleSleep(2500);

    for (let c = 1; c <= totalCycles && !stopFlag; c++) {
      $('#session-cycle-label').textContent = 'Cycle ' + c + ' / ' + totalCycles;
      await runBreathing(settings.breaths);
      if (stopFlag) break;
      const held = await runExhaleHold();
      if (stopFlag) break;
      sessionRec.holds.push(Math.round(held));
      await runInhaleHold();
      if (stopFlag) break;
      if (c < totalCycles) await runSettle();
    }

    if (stopFlag) { sessionRec = null; return; } // quitSession handled saving

    sessionRec.completedCycles = sessionRec.holds.length;
    const list = loadSessions();
    list.unshift(sessionRec);
    saveSessions(list);

    speak('Session complete. Well done.');
    renderSummary(sessionRec);
    sessionRec = null;
    show('summary');
  } catch (err) {
    // Never leave the app wedged: abandon this session and return home.
    sessionRec = null;
    stopFlag = true;
    show('home');
  } finally {
    releaseWakeLock();
    stopSpeechKeepAlive();
    running = false;
  }
}

function quitSession() {
  if (!running) { show('home'); return; }
  stopFlag = true;
  cancelSpeech();
  stopSpeechKeepAlive();
  // Capture a breath-hold that was in progress when quitting.
  if (inExhaleHold && holdStartTs) {
    const h = Math.round((performance.now() - holdStartTs) / 1000);
    if (h > 0 && sessionRec) sessionRec.holds.push(h);
    inExhaleHold = false;
  }
  if (tapResolve) { const r = tapResolve; tapResolve = null; r(); }
  releaseWakeLock();
  running = false;

  // Log interrupted sessions that actually started breathing.
  if (sessionRec && sessionProgressed) {
    sessionRec.interrupted = true;
    sessionRec.completedCycles = sessionRec.holds.length;
    const list = loadSessions();
    list.unshift(sessionRec);
    saveSessions(list);
  }
  sessionRec = null;
  sessionProgressed = false;
  show('home');
}

/* ---------- Summary ---------- */
function renderSummary(rec) {
  const best = rec.holds.length ? Math.max(...rec.holds) : 0;
  const chips = rec.holds.map((h, i) =>
    `<div class="hold-chip"><span class="hc-lbl">Cycle ${i + 1}</span><span class="hc-val">${fmtDuration(h)}</span></div>`
  ).join('') || '<p class="empty" style="padding:12px">No completed breath-holds.</p>';
  $('#summary-body').innerHTML = `
    <div class="stats-summary">
      <div class="stat-card"><div class="num">${rec.holds.length}</div><div class="lbl">Cycles done</div></div>
      <div class="stat-card"><div class="num">${fmtDuration(best)}</div><div class="lbl">Best hold</div></div>
      <div class="stat-card"><div class="num">${rec.breaths}</div><div class="lbl">Breaths</div></div>
    </div>
    <p class="setting-label" style="margin-top:20px">Exhale breath-holds</p>
    <div class="holds">${chips}</div>`;
}

/* ---------- Statistics ---------- */
function renderStats() {
  const list = loadSessions();
  const summary = $('#stats-summary');
  const listEl = $('#stats-list');
  if (!list.length) {
    summary.innerHTML = '';
    listEl.innerHTML = '<p class="empty">No sessions yet.<br />Complete a session to see your progress here.</p>';
    return;
  }
  const allHolds = list.flatMap((s) => s.holds || []);
  const best = allHolds.length ? Math.max(...allHolds) : 0;
  const total = allHolds.reduce((a, b) => a + b, 0);
  summary.innerHTML = `
    <div class="stat-card"><div class="num">${list.length}</div><div class="lbl">Sessions</div></div>
    <div class="stat-card"><div class="num">${fmtDuration(best)}</div><div class="lbl">Best hold</div></div>
    <div class="stat-card"><div class="num">${fmtDuration(total)}</div><div class="lbl">Total held</div></div>`;

  listEl.innerHTML = list.map((s) => {
    const d = new Date(s.date);
    const dateStr = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const chips = (s.holds || []).map((h, i) =>
      `<div class="hold-chip"><span class="hc-lbl">Cycle ${i + 1}</span><span class="hc-val">${fmtDuration(h)}</span></div>`
    ).join('') || '<span class="si-meta">No completed holds</span>';
    const tempoLabel = (TEMPO[s.tempo] || { label: s.tempo }).label;
    const badge = s.interrupted ? '<span class="badge-int">Interrupted</span>' : '';
    const note = s.comment ? `<p class="note-text">${esc(s.comment)}</p>` : '';
    const photo = s.photo
      ? `<div class="si-photo-wrap">
           <img class="si-photo" src="${s.photo}" data-view="${s.id}" alt="Session photo" />
           <button class="btn small photo-remove" data-photo-remove="${s.id}">Remove photo</button>
         </div>`
      : '';
    return `<div class="session-item" data-id="${s.id}">
      <div class="si-head">
        <div>
          <div class="si-date">${dateStr} · ${timeStr} ${badge}</div>
          <div class="si-meta">${s.breaths} breaths · ${tempoLabel} tempo · ${s.cycles} cycles</div>
        </div>
        <div class="si-actions">
          <button class="si-icon note-toggle" data-note="${s.id}" aria-label="${s.comment ? 'Edit note' : 'Add note'}" title="${s.comment ? 'Edit note' : 'Add note'}">${ICON.note}</button>
          <button class="si-icon photo-add" data-photo="${s.id}" aria-label="${s.photo ? 'Replace photo' : 'Add photo'}" title="${s.photo ? 'Replace photo' : 'Add photo'}">${ICON.photo}</button>
          <button class="si-icon danger si-del" data-del="${s.id}" aria-label="Delete session" title="Delete session">${ICON.del}</button>
        </div>
      </div>
      <div class="holds">${chips}</div>
      ${note}
      ${photo}
      <div class="note-edit" hidden>
        <textarea class="note-input" rows="2" placeholder="Add a note about this session…">${esc(s.comment || '')}</textarea>
        <div class="note-actions">
          <button class="btn small primary" data-note-save="${s.id}">Save note</button>
          <button class="btn small" data-note-cancel="${s.id}">Cancel</button>
        </div>
      </div>
    </div>`;
  }).join('');

  // Delete one
  $$('.si-del', listEl).forEach((btn) => btn.addEventListener('click', () => {
    if (!confirm('Delete this session?')) return;
    saveSessions(loadSessions().filter((s) => String(s.id) !== btn.dataset.del));
    renderStats();
  }));
  // Note toggles
  $$('.note-toggle', listEl).forEach((btn) => btn.addEventListener('click', () => {
    const item = btn.closest('.session-item');
    const editor = $('.note-edit', item);
    editor.hidden = !editor.hidden;
    if (!editor.hidden) $('.note-input', item).focus();
  }));
  $$('[data-note-cancel]', listEl).forEach((btn) => btn.addEventListener('click', () => renderStats()));
  $$('[data-note-save]', listEl).forEach((btn) => btn.addEventListener('click', () => {
    const id = btn.dataset.noteSave;
    const item = btn.closest('.session-item');
    const val = $('.note-input', item).value.trim();
    const all = loadSessions();
    const rec = all.find((s) => String(s.id) === id);
    if (rec) { rec.comment = val; saveSessions(all); }
    renderStats();
  }));
  // Photo add / view / remove
  $$('.photo-add', listEl).forEach((btn) => btn.addEventListener('click', () => pickPhotoFor(btn.dataset.photo)));
  $$('.si-photo', listEl).forEach((img) => img.addEventListener('click', () => openPhoto(img.src)));
  $$('[data-photo-remove]', listEl).forEach((btn) => btn.addEventListener('click', () => removePhoto(btn.dataset.photoRemove)));
}

/* ---------- Backup / Import / Excel ---------- */
function exportBackup() {
  const payload = { app: 'AMS Breathing', version: APP_VERSION, exportedAt: new Date().toISOString(), current: currentUserId, users, data: {} };
  users.forEach((u) => {
    payload.data[u.id] = {
      settings: safeParse(localStorage.getItem('whb.settings.' + u.id)) || {},
      sessions: safeParse(localStorage.getItem('whb.sessions.' + u.id)) || [],
    };
  });
  downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), 'ams-breathing-backup-' + dateStamp() + '.json');
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const data = safeParse(reader.result);
    if (!data || data.app !== 'AMS Breathing' || !Array.isArray(data.users) || !data.data) {
      alert('That file is not an AMS Breathing backup.');
      return;
    }
    if (!confirm('Import this backup? It REPLACES all people, settings and sessions currently on this device.')) return;
    users.forEach((u) => { lsRemove('whb.settings.' + u.id); lsRemove('whb.sessions.' + u.id); });
    users = data.users; saveUsers();
    Object.keys(data.data).forEach((id) => {
      const d = data.data[id] || {};
      if (d.settings) lsSet('whb.settings.' + id, JSON.stringify(d.settings));
      if (d.sessions) lsSet('whb.sessions.' + id, JSON.stringify(d.sessions));
    });
    currentUserId = (data.current && users.find((u) => u.id === data.current)) ? data.current : (users[0] && users[0].id);
    lsSet(LS_CURRENT, currentUserId);
    alert('Backup imported.');
    location.reload();
  };
  reader.onerror = () => alert('Could not read that file.');
  reader.readAsText(file);
}

function exportExcel() {
  const list = loadSessions();
  if (!list.length) { alert('No sessions to export for ' + currentUser().name + '.'); return; }
  const maxHolds = list.reduce((m, s) => Math.max(m, (s.holds || []).length), 0);
  const header = ['Date', 'Time', 'Person', 'Breaths', 'Tempo', 'Cycles', 'Completed cycles', 'Interrupted'];
  for (let i = 1; i <= maxHolds; i++) header.push('Hold ' + i + ' (s)');
  header.push('Best (s)', 'Total (s)', 'Has photo', 'Note');
  const rows = [header];
  list.forEach((s) => {
    const d = new Date(s.date);
    const holds = s.holds || [];
    const best = holds.length ? Math.max(...holds) : 0;
    const total = holds.reduce((a, b) => a + b, 0);
    const row = [
      d.toLocaleDateString(), d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      currentUser().name, s.breaths, (TEMPO[s.tempo] || { label: s.tempo }).label, s.cycles,
      (s.completedCycles != null ? s.completedCycles : holds.length), s.interrupted ? 'Yes' : 'No',
    ];
    for (let i = 0; i < maxHolds; i++) row.push(holds[i] != null ? holds[i] : '');
    row.push(best, total, s.photo ? 'Yes' : 'No', s.comment || '');
    rows.push(row);
  });
  const blob = WHBXlsx.build('Sessions', rows);
  downloadBlob(blob, 'ams-breathing-' + slug(currentUser().name) + '-' + dateStamp() + '.xlsx');
}

/* ---------- Session photo ---------- */
let pendingPhotoId = null;
function pickPhotoFor(id) { pendingPhotoId = id; const inp = $('#photo-file'); if (inp) { inp.value = ''; inp.click(); } }
function fileToDataURL(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      try { resolve(canvas.toDataURL('image/jpeg', quality)); } catch (e) { reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')); };
    img.src = url;
  });
}
async function handlePhotoFile(file) {
  if (!file || !pendingPhotoId) return;
  const id = pendingPhotoId; pendingPhotoId = null;
  let dataUrl;
  try { dataUrl = await fileToDataURL(file, 1000, 0.6); } catch { alert('Sorry, that photo could not be processed.'); return; }
  const all = loadSessions();
  const rec = all.find((s) => String(s.id) === String(id));
  if (!rec) return;
  const prev = rec.photo;
  rec.photo = dataUrl;
  if (!saveSessions(all)) {
    rec.photo = prev;
    alert('Not enough storage on this device to save the photo. Try a smaller photo, or remove old photos/sessions.');
    return;
  }
  renderStats();
}
function removePhoto(id) {
  if (!confirm('Remove the photo from this session?')) return;
  const all = loadSessions();
  const rec = all.find((s) => String(s.id) === String(id));
  if (rec) { delete rec.photo; saveSessions(all); }
  renderStats();
}
function openPhoto(src) {
  const v = $('#photo-view'); const img = $('#photo-view-img');
  if (!v || !img) return;
  img.src = src; v.hidden = false;
}
function closePhoto() { const v = $('#photo-view'); if (v) { v.hidden = true; $('#photo-view-img').src = ''; } }

/* ---------- Theme ---------- */
function applyTheme() {
  const mode = settings.theme;
  if (mode === 'system') {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', mode);
  }
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.content = document.documentElement.getAttribute('data-theme') === 'dark' ? '#0e1a2b' : '#f2f5f9';
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (settings.theme === 'system') applyTheme();
});

/* ---------- Segmented controls ---------- */
function initSeg(id, key, cast = (v) => v) {
  const seg = $('#' + id);
  const val = settings[key];
  $$('button', seg).forEach((b) => {
    b.classList.toggle('active', cast(b.dataset.val) === val || b.dataset.val === String(val));
    b.addEventListener('click', () => {
      $$('button', seg).forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      settings[key] = cast(b.dataset.val);
      saveSettings();
      if (key === 'theme') applyTheme();
      if (key === 'tempo') updateMiniOrbPace();
    });
  });
}

/* Refresh a segmented control's active state from the current settings. */
function syncSeg(id, key, cast = (v) => v) {
  const seg = $('#' + id); if (!seg) return;
  $$('button', seg).forEach((b) => b.classList.toggle('active', cast(b.dataset.val) === settings[key] || b.dataset.val === String(settings[key])));
}
function syncSegs() {
  syncSeg('seg-breaths', 'breaths', Number);
  syncSeg('seg-tempo', 'tempo');
  syncSeg('seg-cycles', 'cycles', Number);
  syncSeg('seg-theme', 'theme');
}

/* ---------- Profiles UI ---------- */
function renderProfiles() {
  const sel = $('#user-select');
  if (sel) {
    sel.innerHTML = users.map((u) => `<option value="${u.id}">${esc(u.name)}</option>`).join('');
    sel.value = currentUserId;
  }
  const list = $('#user-list');
  if (list) {
    list.innerHTML = users.map((u) => `<button class="user-chip${u.id === currentUserId ? ' active' : ''}" data-user="${u.id}">${esc(u.name)}</button>`).join('');
    $$('.user-chip', list).forEach((b) => b.addEventListener('click', () => switchUser(b.dataset.user)));
  }
  const du = $('#danger-user'); if (du) du.textContent = currentUser().name;
}
function syncAfterUserChange() {
  applyTheme();
  syncSegs();
  const vs = $('#voice-select'); if (vs) vs.value = settings.voiceURI || '';
  const ve = $('#voice-enabled'); if (ve) ve.checked = settings.voiceOn;
  updateMiniOrbPace();
  renderProfiles();
}
function switchUser(id) {
  if (id === currentUserId) return;
  setCurrentUser(id);
  syncAfterUserChange();
}
function addUser() {
  const name = (prompt('Name of the new person:') || '').trim();
  if (!name) return;
  const id = makeUserId(name);
  users.push({ id, name }); saveUsers();
  setCurrentUser(id);
  syncAfterUserChange();
}
function renameUser() {
  const u = currentUser();
  const name = (prompt('Rename this person:', u.name) || '').trim();
  if (!name || name === u.name) return;
  u.name = name; saveUsers();
  syncAfterUserChange();
}
function removeUser() {
  if (users.length <= 1) { alert('At least one person is required.'); return; }
  const u = currentUser();
  if (!confirm('Remove ' + u.name + '? Their saved sessions and settings will be deleted.')) return;
  lsRemove('whb.settings.' + u.id);
  lsRemove('whb.sessions.' + u.id);
  users = users.filter((x) => x.id !== u.id); saveUsers();
  setCurrentUser(users[0].id);
  syncAfterUserChange();
}
function deleteAllSessions() {
  const name = currentUser().name;
  if (!confirm('Delete ALL saved sessions for ' + name + '?')) return;
  if (!confirm('Are you absolutely sure? This permanently removes every session for ' + name + ' and cannot be undone.')) return;
  saveSessions([]);
  alert('All sessions for ' + name + ' have been deleted.');
}

/* ---------- Voice select ---------- */
function populateVoiceSelect() {
  const sel = $('#voice-select');
  if (!sel) return;
  const en = voices.filter((v) => v.lang && v.lang.startsWith('en'));
  const rest = voices.filter((v) => !(v.lang && v.lang.startsWith('en')));
  const ordered = [...en, ...rest];
  sel.innerHTML = '<option value="">Device default</option>' +
    ordered.map((v) => `<option value="${v.voiceURI}">${v.name} (${v.lang})</option>`).join('');
  sel.value = settings.voiceURI || '';
}

/* ---------- How this works content ---------- */
const HOW_HTML = `
  <p>This breathing practice alternates rounds of controlled deep breathing with breath retention. AMS Breathing guides you hands-free with an animated ball, on-screen text and spoken cues. (See <em>Dedication &amp; thanks</em> for where the practice comes from.)</p>
  <h3>One cycle</h3>
  <ul>
    <li><strong>Breathe</strong> — take your chosen number of full breaths (25 / 30 / 35), following the ball: expand = breathe in, shrink = breathe out. The final breath is announced.</li>
    <li><strong>Exhale hold</strong> — after the last breath, breathe all the way out and hold with empty lungs. A stopwatch counts up and calls out the time (every 30s, then every 15s past 2 minutes), with encouraging words. The ball drifts from blue → yellow (1 min) → orange (2 min) → red (3 min). <strong>Double-tap the screen</strong> when you need to breathe again; your time is saved.</li>
    <li><strong>Recovery hold</strong> — take one big breath in and hold for 15 seconds. The app cues 5s, 10s and "breathe out" at 15s, then a short relax pause before the next cycle.</li>
  </ul>
  <p>The whole cycle repeats 3 or 4 times, then the session is saved automatically.</p>
  <h3>Starting &amp; stopping</h3>
  <p>Double-tap anywhere on the home screen to begin. During an exhale hold, double-tap to end the hold. Use ✕ to quit early — an interrupted session is still saved to your statistics (marked as interrupted).</p>
  <h3>Definitions</h3>
  <dl>
    <dt>Cycle</dt><dd>One full round: the breaths, the exhale hold, and the recovery hold.</dd>
    <dt>Inhale</dt><dd>Breathing in — the ball expands.</dd>
    <dt>Exhale</dt><dd>Breathing out — the ball shrinks.</dd>
    <dt>Breath hold on exhale (empty lungs)</dt><dd>The main, timed retention held as long as comfortable after breathing out fully.</dd>
    <dt>Breath hold on inhale (full lungs)</dt><dd>The fixed 15-second recovery retention with full lungs after a deep breath in.</dd>
  </dl>
  <p style="margin-top:14px;color:var(--danger)"><strong>Safety:</strong> Never practise in or near water, while driving, or standing up. Sit or lie down. Stop if you feel unwell. Not for use during pregnancy or with heart/respiratory conditions without medical advice.</p>
`;

/* ---------- Dedication content ---------- */
const DEDICATION_HTML = `
  <p>This is a small personal app. I’m not an expert in breathing, wellness or meditation — the breathing sequence and the practice itself come entirely from others, who deserve all the credit.</p>
  <h3>Inspiration &amp; thanks</h3>
  <ul>
    <li>The <strong>Wim Hof Method</strong> — the breathing technique this app is based on.</li>
    <li><strong>Kitaro Waga</strong> on YouTube.</li>
    <li>The wider <strong>wellness &amp; meditation community</strong>, and the many others who share this practice so generously.</li>
  </ul>
  <p>The only thing I added is this very simple app, built with <strong>Anthropic Claude Code</strong> from my prompts and input.</p>
  <p>Learning to work with Claude has been a wonderful endeavour, guided by the <strong>MacSparky Field Guide</strong> “AI Robot Assistant” community at <span class="mono">circle.com/macsparky</span>. Thank you.</p>
  <p class="hint-note" style="margin-top:14px">Please follow the guidance of qualified sources, and always listen to your body.</p>
`;

/* ---------- Version history content ---------- */
function renderVersionHistory() {
  $('#version-body').innerHTML = CHANGELOG.map((e) => {
    const [date, time] = e.date.split(' ');
    return `
    <div class="changelog-entry">
      <div class="cl-ver">Version ${e.version}</div>
      <div class="cl-date">📅 ${date}${time ? ' · 🕒 ' + time : ''}</div>
      <ul>${e.changes.map((c) => `<li>${c}</li>`).join('')}</ul>
    </div>`;
  }).join('');
}

/* ---------- Disclosure toggles ---------- */
function initDisclosure(btnId, bodyId, fill) {
  const btn = $('#' + btnId), body = $('#' + bodyId);
  let filled = false;
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    if (!open && !filled) { fill(); filled = true; }
    btn.setAttribute('aria-expanded', String(!open));
    body.hidden = open;
  });
}

/* ================= INIT ================= */
function init() {
  applyTheme();

  initSeg('seg-breaths', 'breaths', Number);
  initSeg('seg-tempo', 'tempo');
  initSeg('seg-cycles', 'cycles', Number);
  initSeg('seg-theme', 'theme');
  updateMiniOrbPace();

  // Profiles
  renderProfiles();
  $('#user-select').addEventListener('change', (e) => switchUser(e.target.value));
  $('#btn-add-user').addEventListener('click', addUser);
  $('#btn-rename-user').addEventListener('click', renameUser);
  $('#btn-remove-user').addEventListener('click', removeUser);
  $('#btn-delete-all').addEventListener('click', deleteAllSessions);

  $$('[data-goto]').forEach((b) => b.addEventListener('click', () => show(b.dataset.goto)));

  onDoubleTap($('#view-home'), () => {
    if (running) return;
    // Speaking here (inside the user gesture) also unlocks speech on iOS.
    // No force: if the user muted guidance we stay silent.
    speak('Get ready. Session starting.');
    runSession();
  }, '.seg, .icon-btn, button, select, input, a, label');

  onDoubleTap($('#session-stage'), handleSessionTap, '#btn-quit');
  $('#btn-quit').addEventListener('click', (e) => { e.stopPropagation(); quitSession(); });

  refreshVoices();
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = refreshVoices;
  $('#voice-select').addEventListener('change', (e) => { settings.voiceURI = e.target.value; saveSettings(); });
  $('#voice-enabled').checked = settings.voiceOn;
  $('#voice-enabled').addEventListener('change', (e) => { settings.voiceOn = e.target.checked; saveSettings(); });
  $('#btn-test-voice').addEventListener('click', () => speak('Breathe in. Breathe out.', { force: true }));

  initDisclosure('btn-how', 'how-body', () => { $('#how-body').innerHTML = HOW_HTML; });
  initDisclosure('btn-dedication', 'dedication-body', () => { $('#dedication-body').innerHTML = DEDICATION_HTML; });
  initDisclosure('btn-version', 'version-body', renderVersionHistory);

  // Data: backup / import / Excel
  $('#btn-export-backup').addEventListener('click', exportBackup);
  $('#btn-export-excel').addEventListener('click', exportExcel);
  $('#btn-import-backup').addEventListener('click', () => { const f = $('#import-file'); f.value = ''; f.click(); });
  $('#import-file').addEventListener('change', (e) => { if (e.target.files && e.target.files[0]) importBackup(e.target.files[0]); });

  // Session photo
  $('#photo-file').addEventListener('change', (e) => { if (e.target.files && e.target.files[0]) handlePhotoFile(e.target.files[0]); });
  $('#photo-view-close').addEventListener('click', closePhoto);
  $('#photo-view').addEventListener('click', (e) => { if (e.target.id === 'photo-view') closePhoto(); });

  $('#app-version').textContent = 'AMS Breathing · v' + APP_VERSION;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
