// changelog.js — the app's version and its human-readable history.
// APP_VERSION is the single source of truth shown in Settings and used to
// decide when to surface the "What's new" banner. Newest entry first.
// Dates/times are the release moment in the user's local zone (Europe/Stockholm —
// CEST in summer, CET in winter).

export const APP_VERSION = '5.15';

export const CHANGELOG = [
  {
    version: '5.15',
    date: '2026-07-23 · 12:20 CEST',
    title: 'Version tag on Home',
    changes: [
      'Added a small, greyed version number next to the Home heading — a handy at-a-glance check of which version you\'re on while we\'re iterating quickly. The full version and changelog remain under Settings.',
    ],
  },
  {
    version: '5.14',
    date: '2026-07-23 · 12:06 CEST',
    title: 'A proper Excel spreadsheet export 📗',
    changes: [
      'The spreadsheet export is now a real Excel workbook (.xlsx) instead of a plain CSV — much nicer to read. It opens in Numbers, Excel or Google Sheets.',
      'It has a separate tab for Ferments, Bakes, Recipes and Lessons, each with a bold carrot-orange header row that stays frozen as you scroll, and sensibly sized columns.',
      'Ratings show as ★ stars, numbers stay numbers (so you can sort and total them), and longer notes wrap neatly. Find it under Settings → Backup & export → “Export spreadsheet (Excel)”.',
    ],
  },
  {
    version: '5.13',
    date: '2026-07-23 · 11:24 CEST',
    title: 'Backup help, all in one place',
    changes: [
      'Folded the "How the backup reminder works" details into the main "How FermentLog works" guide, under Your data, backups & privacy — so all the how-to lives in one place.',
      'Settings → Backup & export now keeps just the controls (interval and last-backup date) with a pointer to the guide.',
    ],
  },
  {
    version: '5.12',
    date: '2026-07-23 · 11:02 CEST',
    title: 'Complete CSV export 📊',
    changes: [
      'The CSV export now includes everything, not just ferments: your bakes, your recipes (ingredients, equipment, timed steps and storage), and your lessons-learned / improvements notebook — each as a clearly labelled section in one spreadsheet file.',
      'Previously the CSV only covered fermenting batches; now a single export captures the whole logbook for spreadsheets.',
    ],
  },
  {
    version: '5.11',
    date: '2026-07-23 · 10:34 CEST',
    title: 'Tidier backup buttons',
    changes: [
      'The Export, Import and CSV buttons now share one calm style — no more oversized orange Export button.',
      'Clearer arrows: Export points up (data leaving the app) and Import points down (data coming in).',
      'The Export CSV button uses the carrot-orange chart icon to match the rest of the app.',
    ],
  },
  {
    version: '5.10',
    date: '2026-07-23 · 10:12 CEST',
    title: 'Backup reminders 💾',
    changes: [
      'FermentLog now gently reminds you to keep a backup: once it has been longer than your chosen interval since your last export, a "Time for a backup" note appears at the top of the Home screen — tap "Export now" to save a copy, or "Later" to hide it for a week.',
      'Set the interval under Settings → Backup & export (Weekly, Every 2 weeks, Monthly — the default, Every 3 months, or Off). It also shows when you last backed up.',
      'A "How the backup reminder works" explainer sits right there in Settings, covering what a backup is, where it goes, and how to restore.',
    ],
  },
  {
    version: '5.9',
    date: '2026-07-23 · 09:26 CEST',
    title: 'Livelier carrots 🥕',
    changes: [
      'Redrew the app icon: the three carrots in the jar are now wavy and lively rather than straight sticks.',
      'The Home tab icon matches — a jar with three little squiggly carrots, in the same style as the other tabs.',
    ],
  },
  {
    version: '5.8',
    date: '2026-07-22 · 23:36 CEST',
    title: 'A calmer Home, and Insights in one place 🏠',
    changes: [
      'Renamed the first tab to "Home" — matching the bottom navigation — since it holds both your ferments and your bakes.',
      'Removed the "Insights" and "Insights & lessons" buttons from the Home screen to keep it uncluttered; it now focuses on your list and the New button.',
      'The Insights tab now has a Ferments / Bakes toggle: switch to Bakes for your bake insights and the lessons-learned notebook, all in one place.',
    ],
  },
  {
    version: '5.7',
    date: '2026-07-22 · 22:58 CEST',
    title: 'Clearer wording on the empty home',
    changes: [
      'Reworded the empty Batches screen to say "No ferments yet" and "Start your first ferment…", matching the "My Ferments" heading — clearer than the old jar-specific wording.',
    ],
  },
  {
    version: '5.6',
    date: '2026-07-22 · 22:41 CEST',
    title: 'A cleaner Batches home 🥕',
    changes: [
      'Tidied the Batches home: the "What\'s new" banner and the "How it works" link no longer sit on the main screen — both live under Settings now, where you can reach them any time.',
      'Redrew the carrot in the empty state so it\'s longer and more tapered — a proper carrot rather than a stubby one.',
    ],
  },
  {
    version: '5.5',
    date: '2026-07-22 · 21:58 CEST',
    title: 'Carrot-toned icons everywhere, and a tidier Settings 🥕',
    changes: [
      'Swapped the leftover emoji — the baguette, carrot, jar and search glyphs dotted around the app — for the clean, carrot-orange icon set, including the empty-state illustrations, card thumbnails, the recipe-link buttons, and the search results.',
      'The search button on the Recipes screen now uses the same orange magnifier as the Batches screen.',
      'The full "How FermentLog works" guide now lives right on the Settings screen as a tap-to-open section, instead of a separate page — so it is one tap away without taking up room.',
      'The AI assistant\'s "How it works, privacy & pricing" write-up is now a tap-to-open section too, keeping Settings compact.',
    ],
  },
  {
    version: '5.4',
    date: '2026-07-22 · 11:12 CEST',
    title: 'Carrot-toned icons and a tidier Batches home 🥕',
    changes: [
      'The Jars / Bakes toggle and the search button now use clean, carrot-orange icons that match the bottom navigation — no more mismatched emoji.',
      'The heading now reads "My Ferments" (and "My Bakes"), so it\'s clear which log you\'re looking at.',
      'The Jars page now shares the Bakes page layout: a matching row of "＋ New batch" and "Insights" actions right at the top, while keeping the ongoing-first list below.',
      'The Bakes "Insights & lessons" button now uses the same bar-chart icon as Insights in the bottom navigation.',
    ],
  },
  {
    version: '5.3',
    date: '2026-07-21 · 19:34 CEST',
    title: 'A livelier Batches home 🫙',
    changes: [
      'The Batches screen now opens with an at-a-glance summary — how many jars are fermenting, in the fridge, and done.',
      'Your list is grouped with Ongoing jars first (due-for-a-taste ones right at the top), so the jar you want to open is always within easy reach, with finished ones below.',
      'A warmer empty state for your very first jar, with a quick link to the guide.',
    ],
  },
  {
    version: '5.2',
    date: '2026-07-21 · 19:18 CEST',
    title: 'Unified search 🔍',
    changes: [
      'A search screen that looks across everything at once — jars, bakes and recipes — with results grouped by type as you type. Reach it from the 🔍 in the Batches or Recipes header.',
      'It searches the useful fields too: names, vegetables and spices, taste-test notes, bake problems, recipe ingredients, equipment and steps.',
      'Tap any result to jump straight to it.',
    ],
  },
  {
    version: '5.1',
    date: '2026-07-21 · 19:07 CEST',
    title: 'Bake insights, a lessons notebook, and AI bakes 🍞✨',
    changes: [
      'New Bake insights (from the Bakes tab → "Insights & lessons"): your best bake, average rating, a rating trend, and average rating by recipe and by category, plus how often each problem shows up.',
      'A Lessons learned notebook lives on that screen — jot down what you learn as you bake (e.g. "longer cold proof = tangier"). It\'s saved on your device and included in backups.',
      'Build a bake with AI: on a new bake, describe or dictate it — "sourdough yesterday, crisp crust, crumb a bit dense, tasted great" — and it fills in the date, ratings, problems and notes for you to review.',
    ],
  },
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
