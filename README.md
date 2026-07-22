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
  brine %, with a hint for the recommended 2–3% range. Start from a **saved recipe**
  or **duplicate** a previous batch in one tap.
- **Track everything:** conditions, **spices** (add your own and they're remembered),
  equipment (vessel / weight / lid), timeline check-ins (add & remove individually),
  outcome ratings (taste, sourness, crunch, overall), problems seen (mould, kahm yeast,
  mushy…), photos (reorder / remove), and free-text notes.
- **Add your own vegetables & spices** — type a new one once and it becomes a normal,
  remembered option next time.
- **In-app changelog** — browse every improvement version-by-version from Settings →
  "What's new".
- **Bakes** — a dedicated log for **sourdough & baking** (via a Jars / Bakes toggle on the
  first tab): name, date, an optional linked recipe, photos, crust/crumb/flavour/overall
  ratings, problems and notes. Recipes connect to your log — "Start a batch from this" on a
  veg-ferment recipe, or "Log a bake from this" on a sourdough recipe.
- **Recipes** — a separate recipe book (its own tab) for full recipes including
  **sourdough bread**: title, category, description, photos, ingredients, equipment,
  hands-on & total time, **timed step-by-step method**, and storage notes. Comes with a
  ready-made sourdough example, and you can duplicate / share / print any recipe.
- **AI assistant (optional)** — describe or **dictate** a **recipe** *or* a **batch** in
  plain words and have it structured into the fields automatically (it even works out salt
  grams from a brine %). Also: **dictate a taste-test check-in** ("day 4, tangy and
  crunchy") into a batch's timeline, an **"Improve"** button to refine a recipe, and
  **"AI tips"** for a batch. Uses your own Anthropic API key (stored only on-device; only
  the described text is sent). Set up and fully explained under Settings → AI assistant.
  Everything else works fully offline.
- **Taste-test reminders** — set a per-batch interval; the app flags batches that are
  due, and (with permission) shows a notification when you open it.
- **Insights** — success rate, average rating, and scatter charts for rating vs.
  brine %, temperature, and days fermented, plus a rating trend, per-vegetable and
  per-lid averages, problem frequency, a **vegetable filter**, a "best batch so far"
  card, and a **recommended recipe** learned from your top results.
- **Private & offline** — data stored on-device (IndexedDB). One-tap **JSON backup**
  (export / import) and **CSV export** for spreadsheets.
- **Light / dark / system theme** toggle.

## Guide

New here? Read the illustrated **[How FermentLog works](docs/HOW-IT-WORKS.md)** walkthrough,
or open it in the app at **Settings → How FermentLog works**.

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
