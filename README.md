# Triathlon Glossary 🏊‍♂️🚴‍♀️🏃

A **super-simple, phone-friendly** glossary of triathlon acronyms, abbreviations and
terms — each paired with a plain-language explanation. Comes with **180+ built-in
terms** (swim, bike, run, racing, training, physiology, gear and nutrition), a fast
search, category filters, and a big **+** button to **add your own** whenever you
hear a new one.

Built as a tiny **Progressive Web App (PWA)**: it runs in your phone's browser,
installs to the home screen, works **offline**, and keeps everything **on your own
device**. No account, no server, no cost, no tracking.

## Features

- **Search everything** — matches the acronym, its full name, *and* the explanation,
  so you can look up "FTP" or "the one about running out of fuel".
- **Filter by category** — All / General / Racing / Swim / Bike / Run / Training /
  Physiology / Gear / Nutrition.
- **Add your own terms** — tap **+**, type the term, an optional "stands for", and an
  explanation. It's saved on your phone and marked with a **"yours"** badge. Delete
  your own entries any time; the built-ins stay put.
- **Works offline** — once opened, it keeps working with no signal (e.g. mid-race
  expo, on a plane, in a pool car park).
- **Light / dark theme** — follows your phone, with a manual toggle (◐, top-right).
- **Private** — your added terms live in your browser's local storage; nothing is
  ever uploaded.

## Use it on your phone

The easiest way is to publish it with **GitHub Pages** (free) and open the link on
your phone:

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Deploy from a branch**, pick your
   branch and the **`/ (root)`** folder, Save.
3. Open the published URL on your phone → browser menu → **Add to Home Screen**.
   Now it's an app icon that opens full-screen and works offline.

## Run it locally

Any static file server works — there's no build step:

```bash
npm start          # serves at http://localhost:8080
# or:  python3 -m http.server 8080
```

Then open `http://localhost:8080`. To reach it from your phone on the same Wi-Fi,
open `http://<your-computer-ip>:8080` (note: offline install and some PWA features
need HTTPS, which GitHub Pages provides).

## Tests

The pure logic (merging built-in + custom terms, search, filtering) is unit-tested
with Node's built-in test runner — no dependencies to install:

```bash
npm test           # runs: node --test
```

Tests also run on every push via GitHub Actions (`.github/workflows/tests.yml`).

## Add terms in bulk (optional)

Most people just use the **+** button. If you'd rather pre-load a batch of terms,
edit `js/terms.js` — it's a plain list of
`{ term, full, def, category }` objects. Add yours and reload.

## Project structure

```
index.html              app shell + add-term dialog
styles.css              styling (light & dark, mobile-first)
js/terms.js             the built-in glossary data
js/app.js               search, filter, add/delete, storage (pure logic unit-tested)
manifest.webmanifest    PWA metadata (install to home screen)
service-worker.js       offline caching
icons/                  app icons
tests/glossary.test.mjs unit tests
```

MIT licensed.
