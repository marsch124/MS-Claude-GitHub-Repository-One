// changelog.js — the app's version and its human-readable history.
// APP_VERSION is the single source of truth shown in Settings and used to
// decide when to surface the "What's new" banner. Newest entry first.

export const APP_VERSION = '3.0';

export const CHANGELOG = [
  {
    version: '3.0',
    date: '2026-07-21',
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
    date: '2026-07-21',
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
    date: '2026-07-21',
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
