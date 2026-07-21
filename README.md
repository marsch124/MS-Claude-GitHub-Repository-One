# FermentLog 🥕

A small, phone-friendly app for logging home fermentation batches — and learning
from them. Log each jar's conditions (salinity, temperature, vegetable, equipment),
track it over time, record how it turned out, and let the **Insights** screen show
you which conditions produce the best ferments.

Built as a **Progressive Web App (PWA)**: it runs in your phone's browser, installs to
the home screen, works **offline**, and keeps all your data **on your own device**.
No account, no server, no cost.

## Features

- **Log a batch fast** — carrot sticks pre-filled, salt + water auto-calculates the
  brine %, with a hint for the recommended 2–3% range.
- **Track everything you chose:** conditions, equipment (vessel / weight / lid),
  timeline check-ins, outcome ratings (taste, sourness, crunch, overall), problems
  seen (mould, kahm yeast, mushy…), photos, and free-text notes.
- **Insights** — success rate, average rating, rating vs. brine %, rating vs.
  temperature, best vegetable and lid type, problem frequency, and a "best batch so
  far" card telling you which conditions to repeat.
- **Private & offline** — data stored on-device (IndexedDB), with one-tap
  Export / Import backup.

## Run it locally

```bash
npm start          # serves the app at http://localhost:8080
# then open http://localhost:8080 in a browser
```

(Any static file server works — the app has no build step.)

## Tests

The pure domain logic (brine %, duration, status, statistics) is unit-tested with
Node's built-in test runner — no dependencies:

```bash
npm test           # runs: node --test
```

Tests also run automatically on every push via GitHub Actions (`.github/workflows/tests.yml`).

## Deploy (GitHub Pages)

1. Push to GitHub (this repo).
2. **Settings → Pages → Build and deployment → Deploy from a branch**, pick your
   branch and the `/ (root)` folder, Save.
3. Open the published URL on your phone → **Add to Home Screen**. Done — log your
   first real carrot batch. 🥕

## Project structure

```
index.html              app shell
styles.css              styling (light & dark, mobile-first)
js/model.js             pure logic — brine %, stats (unit-tested)
js/db.js                IndexedDB storage + export/import
js/app.js               screens & navigation
js/charts.js            dependency-free SVG charts
manifest.webmanifest    PWA metadata
service-worker.js       offline caching
icons/                  app icons
tests/model.test.mjs    unit tests
```
