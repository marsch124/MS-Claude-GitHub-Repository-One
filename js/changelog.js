// changelog.js — the app's version and its human-readable history.
// APP_VERSION is the single source of truth shown in Settings and used to
// decide when to surface the "What's new" banner. Newest entry first.
// Dates/times are the release moment in the user's local zone (Europe/Stockholm —
// CEST in summer, CET in winter).

export const APP_VERSION = '5.0';

export const CHANGELOG = [
  {
    version: '5.0',
    date: '2026-07-21 · 18:52 CEST',
    title: 'Bakes — sourdough gets its own log 🍞',
    changes: [
      'New Bakes log: the first tab now has a Jars / Bakes toggle. Bakes are for sourdough and other baking — each records a name, date, an optional linked recipe, photos, crust/crumb/flavour/overall ratings, problems (dense, gummy, over-proofed…) and notes.',
      'Recipes now connect to your log: on a vegetable-ferment recipe, tap "🫙 Start a batch from this" to pre-fill a new jar; on any other recipe (e.g. sourdough), tap "🥖 Log a bake from this" to start a bake already linked to the recipe.',
      'So "Batch" stays the word for a fermenting jar, while "Bake" covers bread — each with a home that fits it.',
      'Backups (Export/Import) now include your bakes too.',
    ],
  },
  {
    version: '4.4',
    date: '2026-07-21 · 18:31 CEST',
    title: 'Carrot-toned icons, release times & a How-it-works guide',
    changes: [
      'Harmonised the bottom tab-bar icons: Insights, Settings and the others now share one clean, carrot-orange icon set that matches the New button — no more mismatched emoji.',
      'Every release in this changelog now shows the date and time it shipped, in your local Central European time.',
      'Added a thorough "How it works" guide covering every feature — open it from Settings → How FermentLog works. An illustrated version with screenshots lives in the project docs.',
    ],
  },
  {
    version: '4.3',
    date: '2026-07-21 · 18:24 CEST',
    title: 'Dictate check-ins, and let AI polish things up ✨',
    changes: [
      'Dictate a taste-test check-in: on a batch, tap "Add by voice" and say something like "day 4, tangy and still crunchy" — AI works out the date (even from "day 4" or "yesterday") and adds it to the timeline.',
      'New "✨ Improve" button on a recipe: AI tidies the wording, fills in missing step times, adds a short description or storage note, and opens it for you to review and save.',
      'New "✨ AI tips" button on a batch: get 2–4 practical tips based on your brine, temperature, vegetable and equipment, and add them to the batch notes with one tap.',
      'As always: optional, uses your own on-device API key, and you review everything before it is saved.',
    ],
  },
  {
    version: '4.2',
    date: '2026-07-21 · 18:12 CEST',
    title: 'Start a batch by talking to it too 🎤🫙',
    changes: [
      'The "Build with AI" box now works for batches as well as recipes: on a new batch, describe or dictate the jar — e.g. "carrots, 2.5% brine, 20°C, airlock, garlic and dill, taste every 3 days" — and it fills in vegetable, salt/water (it even works out the grams from a brine %), temperature, spices, equipment and the reminder for you to review.',
      'Settings now has a full write-up of the AI assistant: how it works, exactly what stays private on your device, what it costs, and a step-by-step guide to getting a key.',
      'Same as before: optional, uses your own Anthropic API key stored only on your device, and only the text you describe is ever sent — everything else stays offline.',
    ],
  },
  {
    version: '4.1',
    date: '2026-07-21 · 18:03 CEST',
    title: 'Build a recipe by talking to it 🎤',
    changes: [
      'New "Build with AI" panel on the recipe form: describe a recipe in your own words — or tap the microphone on your keyboard and dictate it — and AI fills in the title, ingredients, equipment, timed steps and storage for you to review.',
      'Optional and private: it uses your own Anthropic API key, stored only on this device, and only the text you describe is ever sent. Add the key under Settings → AI recipe assistant.',
      'Everything else in the app still works fully offline; only this one button needs the internet.',
      'You always review and can edit the result before saving — nothing is stored until you say so.',
    ],
  },
  {
    version: '4.0',
    date: '2026-07-21 · 17:48 CEST',
    title: 'Recipes — including sourdough bread 🥖',
    changes: [
      'A whole new Recipes section (its own tab) for keeping full recipes, not just fermented vegetables — sourdough bread and anything else fermentation-ish is welcome.',
      'Each recipe holds a title, category, short description, photos, an ingredients list, the equipment used, hands-on time and total time, and storage / keeping notes.',
      'Method as timed steps: add as many steps as you like, each with its own title, details and time (e.g. "Bulk ferment — 4–6 h") — perfect for all the waiting between phases.',
      'Reorder or remove steps and photos while editing, and duplicate, share or print any recipe.',
      'Start instantly from a ready-made "Everyday Sourdough Loaf" example — a complete worked recipe you can bake or tweak.',
      'The old "Saved recipes" (quick-fill settings for a new jar) are now called "Batch templates", so "Recipes" clearly means these richer, full recipes.',
      'Backups (Export/Import) now include your recipes and batch templates too, not just batches.',
    ],
  },
  {
    version: '3.1',
    date: '2026-07-21 · 17:17 CEST',
    title: 'Manage your vegetables & spices',
    changes: [
      'New "Vegetables & spices" area in Settings — rename or remove any vegetable or spice you\'ve added.',
      'Renaming updates the name everywhere it\'s used — across all your batches and saved recipes — so nothing ever gets out of sync.',
      'Each item shows how many batches use it, so you always know what a change will affect.',
      'Removing a spice also takes it off every batch and recipe that used it.',
      'A vegetable that\'s still used by batches is protected from deletion (rename it, or change those batches first) so no batch is ever left without a vegetable.',
    ],
  },
  {
    version: '3.0',
    date: '2026-07-21 · 17:09 CEST',
    title: 'Custom vegetables & spices, and this changelog',
    changes: [
      'Vegetables: the vague "Other" option is gone. Pick "＋ Add another vegetable…" to type the exact vegetable (e.g. Kohlrabi). It is remembered on this device and appears as a normal option next time — no retyping.',
      'The dropdown also learns from your history: any vegetable used in a past batch shows up automatically.',
      'Renamed the "Additions" section to "Spices", which better describes what goes in the jar.',
      'You can now add your own spices too: type a spice, tap Add, and it becomes a chip you can reuse in future batches.',
      'Added this changelog so you can look back on how the app has grown. Reach it any time from Settings → "What\'s new".',
      'A gentle "What\'s new" banner appears after an update and disappears once you\'ve read the changelog.',
      'The version number now appears in Settings and always matches this changelog.',
    ],
  },
  {
    version: '2.0',
    date: '2026-07-21 · 16:45 CEST',
    title: 'Reminders, deeper insights, faster logging, export & theming',
    changes: [
      'Taste-test reminders: set how often you want to be nudged (per batch). The Batches list shows a "due for a taste test" banner and a ⏰ badge, and — with your permission — a notification appears when you open the app.',
      'Insights — new charts: rating vs. days fermented, and a rating trend from your oldest to newest batch.',
      'Insights — a vegetable filter to focus every chart on one vegetable.',
      'Insights — a "recommended recipe" card that learns the ideal brine, temperature, days and lid from your best-rated batches.',
      'Faster logging — Duplicate a batch to reuse its recipe with a fresh start date and a clean slate.',
      'Faster logging — Save any batch\'s settings as a named recipe, then start future batches from it.',
      'Editing — reorder or remove photos, and delete individual timeline check-ins.',
      'Data — export a CSV for spreadsheets, and Share or Print a single batch summary.',
      'Appearance — a System / Light / Dark theme toggle in Settings.',
    ],
  },
  {
    version: '1.0',
    date: '2026-07-21 · 10:36 CEST',
    title: 'First release — your fermentation logbook',
    changes: [
      'Log each batch with its conditions: vegetable, salt and water (with automatic brine %), room temperature, jar size and spices.',
      'A brine-strength hint nudges you toward the recommended 2–3% range for vegetable ferments.',
      'Record the equipment you used: vessel, weight and lid type.',
      'Follow a batch over time with taste-test check-ins, and mark when it moved to the fridge.',
      'Rate the result — taste, sourness, crunch and overall — and note any problems (mould, kahm yeast, mushy…).',
      'Attach photos and free-text notes to any batch.',
      'Insights: success rate, average rating, rating vs. brine and temperature, best vegetable and lid, problem frequency, and a "best batch so far" card.',
      'Everything is stored privately on your device and works offline. Back up or restore with a one-tap JSON file.',
      'Installable to your phone\'s home screen as a Progressive Web App.',
    ],
  },
];
