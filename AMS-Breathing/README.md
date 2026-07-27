# Wim Hof Breathing

A small, offline-capable **Progressive Web App** for guided Wim Hof breathing sessions — built to run full-screen on an iPhone (Add to Home Screen).

No build step, no dependencies: plain HTML, CSS and vanilla JavaScript.

## Features

- **Guided sessions** — an animated breathing ball plus on-screen text and spoken cues walk you through each breath ("Breathe in / Breathe out", with the final breath announced).
- **Two breath-holds per cycle**
  - *Exhale hold* (empty lungs): a count-up stopwatch with encouraging affirmations and time cues that get closer together the longer you hold. The ball drifts blue → yellow (1 min) → orange (2 min) → red (3 min). Double-tap the screen to end it — your time is saved.
  - *Recovery hold* (full lungs): a fixed 15 seconds with 5 s / 10 s / "breathe out" cues, then a short relax pause.
- **Configurable** — breaths per cycle (25 / 30 / 35), tempo (slow / normal / quick), and 3 or 4 cycles. The home-screen ball previews the selected tempo.
- **Statistics** — every session is saved (per-cycle hold times, date/time). Add notes, delete individual sessions.
- **Profiles** — multiple people each with their own settings and statistics.
- **Settings** — light / system / dark appearance, voice picker, "How this works" guide, version history, and a guarded "delete all sessions".
- **Offline** — installs as a PWA with a service worker and screen wake-lock.

## Run locally

Any static file server works, for example:

```bash
python3 -m http.server 7790
```

Then open `http://localhost:7790/` (serve from this folder).

## Install on iPhone

Once deployed over HTTPS (e.g. GitHub Pages), open the page in **Safari** → Share → **Add to Home Screen**.

## Safety

Never practise in or near water, while driving, or standing up. Sit or lie down, and stop if you feel unwell. Not for use during pregnancy or with heart/respiratory conditions without medical advice.
