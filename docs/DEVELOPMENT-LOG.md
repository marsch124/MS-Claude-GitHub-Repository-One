# FermentLog — the making of it 🥕🍞

A written-up log of the whole process, from an empty repository to a full
fermentation-and-baking companion app. It follows the conversation turn by turn: what
was asked, what was decided, and what was built. (It's a faithful reconstruction of the
session, organised for reading — not a byte-for-byte chat transcript.)

**All dates/times are Europe/Stockholm — CEST (UTC+2) on 2026-07-21 — taken from the real
commit times.**

---

## Version timeline

| Version | Time (CEST) | Title |
|---|---|---|
| — | 08:21 | Initial commit (empty repo: just a README) |
| **1.0** | 10:36 | First release — your fermentation logbook |
| **2.0** | 16:45 | Reminders, deeper insights, faster logging, export & theming |
| **3.0** | 17:09 | Custom vegetables & spices, and this changelog |
| **3.1** | 17:17 | Manage your vegetables & spices |
| **4.0** | 17:48 | Recipes — including sourdough bread |
| **4.1** | 18:03 | Build a recipe by talking to it |
| **4.2** | 18:12 | Start a batch by talking to it too |
| **4.3** | 18:24 | Dictate check-ins, and let AI polish things up |
| **4.4** | 18:31 | Carrot-toned icons, release times & a How-it-works guide |
| **5.0** | 18:52 | Bakes — sourdough gets its own log |
| **5.1** | 19:07 | Bake insights, a lessons notebook, and AI bakes |
| **5.2** | 19:18 | Unified search |

---

## 0. Where it started: "analyse the test coverage"

The very first request was to **analyse the codebase's test coverage and propose areas to
improve**. On investigation the repository was essentially **empty** — only a two-line
`README.md` and a local Claude settings file. There was no source code, no tests, no
framework, no CI. So rather than fabricate a coverage report, the honest finding was:
*there is nothing to measure coverage against yet.*

A clarifying question was declined, and a plan to "establish testing foundations" was
declined too — because the real intent surfaced in the next message.

## 1. The real idea: a fermentation logbook

> *"I want to create an app… I would like to ferment carrot sticks in a jar at home in
> Sweden… fermenting is a bit of a lottery — temperature, salinity, type of vegetable…
> it would be fantastic to have a small app on my mobile phone so I can log things and
> then learn from that with statistics presented in a visually pleasing way."*

Yes — a classic "logbook + insights" app, and a lovely fit. Two design decisions were
settled up front:

- **Delivery: a Progressive Web App (PWA)** — opens in the phone browser, "Add to Home
  Screen" to launch like a native app, works offline, free to host on GitHub Pages. No
  App Store.
- **Storage: on-device only** (private, no account, no server), with JSON Export/Import
  for backup.

And what to track was confirmed: **conditions, outcome ratings, timeline & duration,
photos & notes, and equipment used**.

## 2. v1.0 — the first release (10:36)

Built as a **no-build static PWA** (plain HTML/CSS/vanilla JS, IndexedDB for storage,
dependency-free SVG charts, a service worker + manifest for offline/installable). Core
features:

- Log a batch: vegetable (carrot sticks pre-filled), salt + water with an **auto-computed
  brine %** and a hint for the 2–3% sweet spot, temperature, jar size, spices, equipment.
- Follow it over time with taste-test check-ins and a "move to fridge" step.
- Record the outcome (taste / sourness / crunch / overall, success, problems).
- Photos and notes.
- An **Insights** dashboard: success rate, ratings vs. brine and temperature, best batch.
- Everything on-device and offline; installable to the home screen.

The **pure logic** (brine %, duration, statistics) was **unit-tested** with Node's built-in
test runner — which also gave the repository the real test coverage its branch was
originally about. A headless-browser smoke test drove the whole app end to end.

## 3. Getting it onto a phone

Two deployment questions followed:

- **"How do I deploy from a branch via the iPhone app?"** — the GitHub *app* doesn't have
  the Pages settings screen, so the answer was step-by-step **Safari on the iPhone**
  (Settings → Pages → deploy from a branch → Add to Home Screen).
- **"It seems I cannot use Pages unless I pay — is that right?"** — the real cause is that
  **Pages is free for public repos but paid for private ones**. Options given: make the
  repo public (nothing sensitive — the data lives only on the phone), or use a free host
  that supports private repos (Cloudflare Pages / Netlify).

Then: *"All working good."* 🎉

## 4. v2.0 — "I want all of the above" (16:45)

Asked what to improve next, the answer was **all of it**. Delivered in one release:

- **Taste-test reminders** (per-batch interval, a "due" banner and badge, optional
  notification on open).
- **Deeper Insights**: rating vs. days fermented, a rating trend, a vegetable filter, and
  a **"recommended recipe"** learned from the best-rated batches.
- **Faster logging**: duplicate a batch; save/reuse condition **templates**.
- **Editing**: reorder/remove photos, delete individual check-ins.
- **Data**: CSV export; share & print a batch.
- **Appearance**: System / Light / Dark theme.

## 5. Deploying v2.0, and a note on time zones

*"I would like to deploy version two now… step by step?"* Since the app is served straight
from the working branch, GitHub Pages **auto-rebuilds on every push** — so v2 was already
live; the only task was nudging the phone to fetch it (close and reopen the installed app
once or twice). With permission, the code was also mirrored to `main` for tidiness.

## 6. v3.0 — custom vegetables, "Spices", and a changelog (17:09)

> *"When entering a vegetable there are a lot of options and one called 'Other'… I do not
> want 'Other' because it doesn't say exactly what vegetable it is. I want to enter the
> vegetable so it says explicitly what was used… and have it show next time."*

- Replaced the vague **"Other"** with **"＋ Add another vegetable…"** — type the exact
  vegetable, and it's **remembered on the device** and appears as a normal option next
  time (also learned from past batches).

> *"There is a heading called 'Additions'. Maybe we should call it 'Spices'… I would also
> like an extensive changelog in the app so I can enjoy all the improvements from version
> to version."*

- Renamed **Additions → Spices**, with the same "add your own and it's remembered"
  behaviour.
- Added an **in-app changelog** (Settings → What's new), a one-time "What's new" banner,
  and a single source-of-truth version number.

(A tiny real bug was caught by the browser test here: `.form label { display:block }` was
defeating the HTML `hidden` attribute, so the custom-vegetable field never hid — fixed.)

## 7. v3.1 — manage vegetables & spices (17:17)

> *"I'd love a settings area to manage my saved vegetables and spices — sometimes they
> need to be renamed or removed."*

A **"Vegetables & spices"** manager in Settings: rename or remove any custom entry.
**Renaming propagates everywhere** (all batches and templates), removing a spice strips it
from every batch, and a vegetable still used by batches is **protected from deletion** so
no batch is ever left without one.

## 8. v4.0 — Recipes, including sourdough (17:48)

> *"I would also like to make sourdough bread within this app. A recipe function would be
> excellent with ingredients, a short description, photos, equipment used, time needed,
> time in total, time for each step, and something about storage after."*

A whole new **Recipes** section (its own tab): title, category, description, photos,
ingredients, equipment, **hands-on & total time**, a **timed step-by-step method**, and
**storage** notes. Steps and photos reorderable; recipes duplicable / shareable /
printable; and a ready-made **"Everyday Sourdough Loaf"** example to start from.

A naming decision: the thin condition-presets were renamed **"Batch templates"** so that
**"Recipes"** clearly meant these richer, full recipes.

## 9. v4.1 — build a recipe by talking to it (18:03)

> *"Could I read/enter the recipe via AI so I just speak freely and the recipe is built?
> Would that be possible to connect AI?"*

Yes — and it needed a short, honest conversation about implications first: it uses **your
own Anthropic API key** (stored only on the device), only the described text is sent, it
needs internet for that one button, and it costs a fraction of a cent per recipe. The
model was **your choice: Claude Opus 4.8** (highest quality).

Built a **"✨ Build with AI"** box on the recipe form: describe or **dictate** (via the
iPhone keyboard microphone) a recipe, and **structured outputs** guarantee a valid recipe
back, which pre-fills the form for review. Verified end to end against a **mocked API** so
no real key was needed for testing.

## 10. v4.2 — start a batch by talking, and a full AI write-up (18:12)

> *"Extend that same dictation to batch logging, and please make sure the AI stuff is
> extensively described in the Settings section."*

- The **"Build with AI"** box now works for **batches** too — it even works out salt grams
  from a brine percentage.
- The **Settings → AI assistant** section became a thorough, plain-English guide: how it
  works, exactly what stays private on the device, what it costs, and a step-by-step key
  setup.

## 11. v4.3 — dictate check-ins; AI "improve" and "tips" (18:24)

A brief, delightful mix-up: a message ended with *"just say the word 🥕"* — and the reply
was simply **"Carrot"**, taken (reasonably!) as the literal magic word. Once sorted, the
answer was **"both"**:

- **Dictate a check-in**: on a batch, say *"day 4, tangy and still crunchy"* and AI works
  out the date and adds it to the timeline.
- **"✨ Improve"** on a recipe: AI tidies wording, fills missing step times, adds a
  description/storage note, then opens it to review and save.
- **"✨ AI tips"** on a batch: practical tips from the brine, temperature, vegetable and
  equipment, addable to notes in one tap.

Another real bug caught by the browser test: improving a recipe rendered the edit form
*in place* while the URL stayed the same, so **Save was a no-op** (a same-hash navigation
doesn't re-render). Fixed by routing through the edit URL with an in-memory draft.

## 12. v4.4 — icons, timestamps & a How-it-works guide (18:31)

A five-part request:

1. **Insights tab icon** the same colour as the carrot, and
2. **Settings icon** too — designed to harmonise. → The whole tab bar became one cohesive,
   **carrot-orange SVG icon set** (jar, book, ＋, bar chart, gear).
3. **Batch vs Recipe** — a discussion (see below); recommendation given.
4. **Date & time on each release.** → Every changelog entry now shows the date and time,
   in **your local Central European time** (CEST in summer, CET in winter), sourced from
   the real commit times.
5. **A thorough "How it works" with screenshots.** → An in-app **How it works** guide
   (Settings → How FermentLog works) plus an illustrated **`docs/HOW-IT-WORKS.md`** with
   screenshots of every screen.

### The Batch-vs-Recipe answer (item 3)

Is *"batch"* a good word for both fermented veg and sourdough? **Yes** — "a batch of
kraut" and "a batch of bread" are both natural English. The subtlety was the *data model*:
a Batch was shaped around vegetable ferments (brine %, vegetable, jar), while a Recipe was
general. The recommendation:

- **A) "Start a batch from this recipe"** on veg-ferment recipes (a quick, no-AI bridge).
- **B) A dedicated "Bakes" log** for sourdough (so bread gets a home that fits it, instead
  of being forced into the veg-batch shape).

## 13. v5.0 — Bakes, and recipe → jar/bake bridges (18:52)

> *"A+B please."*

- **Bakes**: the first tab gained a **Jars / Bakes** toggle. A bake records a name, date,
  an optional **linked recipe**, photos, **crust / crumb / flavour / overall** ratings,
  problems (dense, gummy, over-proofed…) and notes.
- **Recipes connect to the log**: a vegetable-ferment recipe offers **"🫙 Start a batch
  from this"** (pre-filling a jar, guessing the vegetable and spices); any other recipe
  offers **"🥖 Log a bake from this"** (a bake pre-linked to the recipe).

So *Batch* stays the word for a fermenting jar, and *Bake* covers bread. Backups now
include bakes.

## 14. v5.1 — bake insights, a lessons notebook, and AI bakes (19:07)

> *"A small Bake insights view where I can enter lessons learned, and an AI 'Build a Bake
> by describing it' box."*

- **Bake insights**: best bake, average rating, a rating trend, average rating by recipe
  and by category, and problem frequency.
- A **📓 Lessons learned notebook** on that screen — jot what you learn (*"longer cold
  proof = tangier"*); saved on-device and included in backups.
- **Build a bake with AI**: describe/dictate a bake and it fills in the date, ratings,
  problems and notes for review.

## 15. v5.2 — unified search (19:18)

> *"Unified search would be terrific. Combined insights — no."*

A **Search** screen (from the 🔍 in the Batches or Recipes header) that looks across
**jars, bakes and recipes at once**, grouped by type, updating live as you type. It
searches deep fields too — spices, taste-test notes, bake problems, recipe ingredients,
equipment and steps — and multiple words are an AND search. Tap a result to open it.

---

## How it was built (the working method)

The same disciplined loop ran on every version:

1. **Pure logic first, unit-tested.** All the calculation-heavy, easy-to-get-wrong logic
   (brine %, statistics, reminders, CSV, AI output normalisation, search) lives in
   dependency-free modules tested with Node's built-in `node --test`. It grew from **11
   tests at v1.0 to 44 at v5.2**, all green.
2. **Real browser verification.** Every feature was driven end to end in a headless
   Chromium browser (the actual app, real IndexedDB), asserting behaviour and capturing
   **zero console errors**. The AI features were tested against a **mocked API**, so no
   real key or network was needed. These tests repeatedly caught **genuine bugs** before
   they shipped.
3. **Privacy & honesty by default.** Data stays on the device; the only thing ever sent
   anywhere is the optional AI text, using your own key. Costs, limitations (no true
   background reminders on the web; a paid API account for AI), and trade-offs were stated
   plainly rather than glossed over.
4. **Everything committed & pushed** to the working branch and mirrored to `main`, with a
   changelog entry and a bumped offline-cache version each time.

## Where it stands now (v5.2)

A private, offline-first PWA that logs **fermentation jars** and **bakes**, keeps a
**recipe book** (with a built-in sourdough example), shows **insights** for both, offers an
optional **AI assistant** for building and improving entries by voice, and lets you
**search across everything**. All on your phone, all yours.

🥕🍞 Happy fermenting — and baking.
