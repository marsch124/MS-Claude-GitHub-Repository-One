// model.js — pure domain logic for FermentLog.
// No DOM, no storage: just data in, data out. This is the unit-tested core.

export const VEGETABLES = [
  'Carrot sticks', 'Cabbage', 'Cucumber', 'Beetroot', 'Cauliflower',
  'Green beans', 'Radish', 'Garlic', 'Onion', 'Pepper',
];

/** Vegetables seen in past batches that aren't built-in — sorted, de-duplicated. */
export function usedVegetables(batches) {
  const builtin = new Set(VEGETABLES);
  const extras = new Set();
  for (const b of (Array.isArray(batches) ? batches : [])) {
    const v = b && b.vegetable;
    if (v && !builtin.has(v)) extras.add(v);
  }
  return [...extras].sort((a, b) => a.localeCompare(b));
}

/** Built-in vegetables first (original order), then any unique extras as given. */
export function mergeVegetables(extra = []) {
  const seen = new Set();
  const out = [];
  for (const v of [...VEGETABLES, ...extra]) {
    if (v && !seen.has(v)) { seen.add(v); out.push(v); }
  }
  return out;
}

export const LID_TYPES = ['Airlock', 'Burping / self-venting lid', 'Plain lid', 'Cloth / open'];
export const WEIGHT_TYPES = ['Glass weight', 'Ceramic weight', 'Cabbage leaf', 'Smaller jar', 'None'];
export const PROBLEMS = ['Mould', 'Kahm yeast', 'Mushy / soft', 'Too salty', 'Not sour enough', 'Off smell'];
// Spices / flavourings. Stored on a batch under the `additions` field (kept for
// backward compatibility with data saved before the rename to "Spices").
export const COMMON_SPICES = ['Garlic', 'Dill', 'Mustard seed', 'Black pepper', 'Bay leaf', 'Ginger', 'Chilli'];

/** Spices seen in past batches that aren't built-in — sorted, de-duplicated. */
export function usedSpices(batches) {
  const builtin = new Set(COMMON_SPICES);
  const extras = new Set();
  for (const b of (Array.isArray(batches) ? batches : [])) {
    for (const s of (b && b.additions) || []) if (s && !builtin.has(s)) extras.add(s);
  }
  return [...extras].sort((a, b) => a.localeCompare(b));
}

/** Replace every occurrence of oldName with newName; de-duplicate; drop blanks. */
export function renamedList(list, oldName, newName) {
  return [...new Set((Array.isArray(list) ? list : []).map((x) => (x === oldName ? newName : x)).filter(Boolean))];
}

/** Remove every occurrence of name from a list. */
export function withoutItem(list, name) {
  return (Array.isArray(list) ? list : []).filter((x) => x !== name);
}

/** Built-in spices first (original order), then any unique extras as given. */
export function mergeSpices(extra = []) {
  const seen = new Set();
  const out = [];
  for (const s of [...COMMON_SPICES, ...extra]) {
    if (s && !seen.has(s)) { seen.add(s); out.push(s); }
  }
  return out;
}

// Recommended brine window for vegetable ferments.
export const BRINE_MIN = 2.0;
export const BRINE_MAX = 3.0;
// Default number of days between taste-test reminders.
export const DEFAULT_REMIND_DAYS = 3;

const round1 = (n) => Math.round(n * 10) / 10;
const isoDay = (d) => d.toISOString().slice(0, 10);

/**
 * Salt concentration of a brine, as a percentage by weight.
 * Approximates 1 ml water ≈ 1 g, so brine% = salt / (salt + water) * 100.
 * Returns null when inputs are missing/invalid so the UI can show a blank.
 */
export function computeBrinePercent(saltGrams, waterMl) {
  // Treat blank/absent fields as "not entered" rather than zero (Number('') === 0).
  if (saltGrams === '' || saltGrams == null || waterMl === '' || waterMl == null) return null;
  const salt = Number(saltGrams);
  const water = Number(waterMl);
  if (!Number.isFinite(salt) || !Number.isFinite(water)) return null;
  if (salt < 0 || water < 0) return null;
  const total = salt + water;
  if (total <= 0) return null;
  return (salt / total) * 100;
}

/** True when a brine sits within the generally recommended 2–3% window. */
export function isBrineInRange(brinePercent) {
  return brinePercent != null && brinePercent >= BRINE_MIN && brinePercent <= BRINE_MAX;
}

/** Whole days between two ISO dates (or now). Never negative; null if start missing. */
export function daysBetween(startDate, endDate) {
  if (!startDate) return null;
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  if (isNaN(start) || isNaN(end)) return null;
  const ms = end.setHours(12, 0, 0, 0) - start.setHours(12, 0, 0, 0);
  return Math.max(0, Math.round(ms / 86_400_000));
}

/** Days a batch spent fermenting: start → moved-to-fridge / outcome / now. */
export function fermentDays(batch) {
  if (!batch) return null;
  const end = batch.movedToFridgeDate || (batch.outcome && batch.outcome.recordedAt) || null;
  return daysBetween(batch.startDate, end);
}

/**
 * Lifecycle status derived from a batch's dates/outcome.
 *   'done'       — an outcome has been recorded
 *   'fridge'     — moved to cold storage, awaiting verdict
 *   'fermenting' — actively fermenting at room temp
 */
export function batchStatus(batch) {
  if (!batch) return 'fermenting';
  if (batch.outcome && batch.outcome.recorded) return 'done';
  if (batch.movedToFridgeDate) return 'fridge';
  return 'fermenting';
}

export function statusLabel(status) {
  return { fermenting: 'Fermenting', fridge: 'In fridge', done: 'Done' }[status] || status;
}

/** Average of the numeric rating fields present on an outcome (1–5), or null. */
export function overallRating(batch) {
  const o = batch && batch.outcome;
  if (!o) return null;
  if (Number.isFinite(o.overall)) return o.overall;
  const parts = [o.taste, o.sourness, o.crunch].filter(Number.isFinite);
  if (!parts.length) return null;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

// ---------- Taste-test reminders ----------

/**
 * The date the next taste-test is due (ISO YYYY-MM-DD), or null.
 * Only fermenting batches remind; interval comes from remindEveryDays
 * (defaults to DEFAULT_REMIND_DAYS; 0/negative means reminders off).
 * Counts from the last check-in, or the start date if none yet.
 */
export function nextCheckDue(batch) {
  if (!batch || batchStatus(batch) !== 'fermenting') return null;
  const every = batch.remindEveryDays == null ? DEFAULT_REMIND_DAYS : Number(batch.remindEveryDays);
  if (!Number.isFinite(every) || every <= 0) return null;
  const lastCheck = (batch.checkIns || []).map((c) => c.date).filter(Boolean).sort().pop();
  const base = lastCheck || batch.startDate;
  if (!base) return null;
  const d = new Date(base);
  if (isNaN(d)) return null;
  d.setDate(d.getDate() + every);
  return isoDay(d);
}

/** Is this batch due (or overdue) for a taste test as of `today`? */
export function isCheckDue(batch, today = new Date()) {
  const due = nextCheckDue(batch);
  if (!due) return false;
  const t = today instanceof Date ? today : new Date(today);
  return isoDay(t) >= due;
}

/** Subset of batches currently due for a taste test. */
export function dueBatches(batches, today = new Date()) {
  return (Array.isArray(batches) ? batches : []).filter((b) => isCheckDue(b, today));
}

// ---------- Statistics ----------

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  if (!s.length) return null;
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function mode(items) {
  const counts = new Map();
  for (const it of items) counts.set(it, (counts.get(it) || 0) + 1);
  let best = null;
  let bestN = 0;
  for (const [k, n] of counts) if (n > bestN) { best = k; bestN = n; }
  return best;
}

/**
 * A recommended "recipe" derived from your best batches (overall rating ≥ threshold).
 * Returns null until there are at least two good batches to learn from.
 */
export function recommendation(batches, threshold = 4) {
  const good = (Array.isArray(batches) ? batches : [])
    .filter((b) => batchStatus(b) === 'done' && (overallRating(b) ?? 0) >= threshold);
  if (good.length < 2) return null;
  const brines = good.map((b) => computeBrinePercent(b.saltGrams, b.waterMl)).filter((v) => v != null);
  const temps = good.map((b) => Number(b.roomTempC)).filter(Number.isFinite);
  const days = good.map(fermentDays).filter((v) => v != null);
  return {
    count: good.length,
    brine: brines.length ? round1(median(brines)) : null,
    tempC: temps.length ? round1(median(temps)) : null,
    days: days.length ? Math.round(median(days)) : null,
    lid: mode(good.map((b) => b.lidType).filter(Boolean)),
    vegetable: mode(good.map((b) => b.vegetable).filter(Boolean)),
  };
}

/**
 * Aggregate batches into the numbers the Insights screen shows.
 * Pass { vegetable } to focus the charts on a single vegetable.
 * Everything degrades gracefully when there is little or no data.
 */
export function summarizeStats(batches, { vegetable = null } = {}) {
  const all = Array.isArray(batches) ? batches : [];
  const vegetables = [...new Set(all.map((b) => b.vegetable).filter(Boolean))].sort();
  const list = vegetable ? all.filter((b) => b.vegetable === vegetable) : all;
  const finished = list.filter((b) => batchStatus(b) === 'done');

  const successful = finished.filter((b) => b.outcome && b.outcome.success).length;
  const successRate = finished.length ? successful / finished.length : null;

  // Finished batches that carry a rating, oldest first (for the trend line).
  const rated = finished
    .map((b) => ({ batch: b, rating: overallRating(b) }))
    .filter((r) => r.rating != null)
    .sort((a, b) => (a.batch.startDate || '').localeCompare(b.batch.startDate || ''));

  const ratingVsBrine = rated
    .map((r) => ({ x: computeBrinePercent(r.batch.saltGrams, r.batch.waterMl), y: r.rating, name: r.batch.name }))
    .filter((p) => p.x != null);

  const ratingVsTemp = rated
    .map((r) => ({ x: Number(r.batch.roomTempC), y: r.rating, name: r.batch.name }))
    .filter((p) => Number.isFinite(p.x));

  const ratingVsDays = rated
    .map((r) => ({ x: fermentDays(r.batch), y: r.rating, name: r.batch.name }))
    .filter((p) => p.x != null);

  // Trend: rating by attempt order (1 = oldest).
  const ratingOverTime = rated.map((r, i) => ({ x: i + 1, y: r.rating, name: r.batch.name }));

  // Average rating grouped by an arbitrary key selector.
  const avgBy = (keyFn) => {
    const buckets = new Map();
    for (const r of rated) {
      const key = keyFn(r.batch);
      if (!key) continue;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(r.rating);
    }
    return [...buckets.entries()]
      .map(([label, vals]) => ({ label, value: round1(vals.reduce((a, b) => a + b, 0) / vals.length), count: vals.length }))
      .sort((a, b) => b.value - a.value);
  };

  const byVegetable = avgBy((b) => b.vegetable);
  const byLid = avgBy((b) => b.lidType);

  // Problem frequency across finished batches.
  const problemCounts = new Map();
  for (const b of finished) {
    for (const p of (b.outcome && b.outcome.problems) || []) {
      problemCounts.set(p, (problemCounts.get(p) || 0) + 1);
    }
  }
  const problems = [...problemCounts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // The batch to try to reproduce.
  let bestBatch = null;
  let bestRating = -Infinity;
  for (const r of rated) {
    if (r.rating > bestRating) { bestRating = r.rating; bestBatch = r.batch; }
  }

  const ratings = rated.map((r) => r.rating);
  const avgRating = ratings.length ? round1(ratings.reduce((a, b) => a + b, 0) / ratings.length) : null;

  return {
    vegetables,
    total: list.length,
    active: list.filter((b) => batchStatus(b) !== 'done').length,
    finished: finished.length,
    successRate,
    avgRating,
    ratingVsBrine,
    ratingVsTemp,
    ratingVsDays,
    ratingOverTime,
    byVegetable,
    byLid,
    problems,
    bestBatch,
    bestRating: bestBatch ? round1(bestRating) : null,
  };
}

// ---------- CSV export ----------

const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Flatten batches to a CSV string (one row per batch) for spreadsheets. */
export function toCSV(batches) {
  const cols = [
    ['Name', (b) => b.name],
    ['Vegetable', (b) => b.vegetable],
    ['Start date', (b) => b.startDate],
    ['Days fermented', (b) => fermentDays(b) ?? ''],
    ['Brine %', (b) => { const v = computeBrinePercent(b.saltGrams, b.waterMl); return v == null ? '' : v.toFixed(1); }],
    ['Salt (g)', (b) => b.saltGrams],
    ['Water (ml)', (b) => b.waterMl],
    ['Room temp (C)', (b) => b.roomTempC],
    ['Vessel', (b) => b.vesselType],
    ['Weight', (b) => b.weightType],
    ['Lid', (b) => b.lidType],
    ['Spices', (b) => (b.additions || []).join('; ')],
    ['Status', (b) => statusLabel(batchStatus(b))],
    ['Success', (b) => (b.outcome && b.outcome.recorded ? (b.outcome.success ? 'yes' : 'no') : '')],
    ['Taste', (b) => (b.outcome && b.outcome.taste) ?? ''],
    ['Sourness', (b) => (b.outcome && b.outcome.sourness) ?? ''],
    ['Crunch', (b) => (b.outcome && b.outcome.crunch) ?? ''],
    ['Overall', (b) => (b.outcome && b.outcome.overall) ?? ''],
    ['Problems', (b) => ((b.outcome && b.outcome.problems) || []).join('; ')],
    ['Notes', (b) => b.notes],
  ];
  const header = cols.map((c) => c[0]).join(',');
  const rows = (Array.isArray(batches) ? batches : []).map((b) => cols.map((c) => csvCell(c[1](b))).join(','));
  return [header, ...rows].join('\n');
}

// ---------- Creation / presets / duplication ----------

/** Minimal empty batch with sensible Swedish-kitchen defaults. */
export function newBatch(now = new Date()) {
  return {
    id: `b_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    vegetable: 'Carrot sticks',
    startDate: isoDay(now),
    saltGrams: 25,
    waterMl: 1000,
    roomTempC: 20,
    jarSizeMl: 1000,
    additions: [],
    vesselType: 'Glass jar',
    weightType: 'Glass weight',
    lidType: 'Burping / self-venting lid',
    remindEveryDays: DEFAULT_REMIND_DAYS,
    checkIns: [],
    movedToFridgeDate: '',
    outcome: null,
    photos: [],
    notes: '',
    createdAt: now.toISOString(),
  };
}

const RECIPE_FIELDS = ['vegetable', 'saltGrams', 'waterMl', 'roomTempC', 'jarSizeMl',
  'vesselType', 'weightType', 'lidType', 'remindEveryDays'];

/** Save a batch's conditions/equipment as a reusable named preset. */
export function presetFromBatch(batch, name = '') {
  const p = { id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name, additions: [...(batch.additions || [])] };
  for (const f of RECIPE_FIELDS) p[f] = batch[f];
  return p;
}

/** Start a fresh batch pre-filled from a saved preset. */
export function batchFromPreset(preset, now = new Date()) {
  const b = newBatch(now);
  for (const f of RECIPE_FIELDS) if (preset[f] !== undefined) b[f] = preset[f];
  b.additions = [...(preset.additions || [])];
  return b;
}

/** Duplicate a batch: copy the recipe, reset dates/outcome/timeline/photos. */
export function duplicateBatch(batch, now = new Date()) {
  const nb = batchFromPreset(presetFromBatch(batch), now);
  nb.name = batch.name ? `${batch.name} (copy)` : '';
  return nb;
}

export function ratingStars(n) {
  if (!Number.isFinite(n)) return '—';
  const full = Math.round(n);
  return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
}

// ---------- Recipes ----------

export const RECIPE_CATEGORIES = ['Sourdough', 'Vegetable ferment', 'Drink / kombucha', 'Dairy', 'Other'];

/** An empty recipe with sensible defaults. */
export function newRecipe(now = new Date()) {
  return {
    id: `r_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    category: 'Sourdough',
    description: '',
    photos: [],
    ingredients: [],   // array of strings, one line each
    equipment: [],     // array of strings, one line each
    activeTime: '',    // hands-on time
    totalTime: '',     // start to finish (mostly waiting)
    steps: [],         // array of { title, detail, time }
    storage: '',       // keeping / storage notes
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

/** Duplicate a recipe with a fresh id and a "(copy)" title. */
export function duplicateRecipe(recipe, now = new Date()) {
  const r = structuredCloneSafe(recipe);
  r.id = `r_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`;
  r.title = recipe.title ? `${recipe.title} (copy)` : '';
  r.createdAt = now.toISOString();
  r.updatedAt = now.toISOString();
  return r;
}

function structuredCloneSafe(obj) {
  return typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
}

/** A ready-to-use worked example so bakers can start immediately. */
export function sampleSourdoughRecipe(now = new Date()) {
  const r = newRecipe(now);
  return {
    ...r,
    title: 'Everyday Sourdough Loaf',
    category: 'Sourdough',
    description: 'A simple naturally-leavened loaf with an open crumb and a crisp, deep-brown crust. Mostly waiting — very little hands-on work.',
    ingredients: [
      '100 g active sourdough starter (bubbly, doubled)',
      '350 g water, room temperature',
      '500 g bread flour',
      '10 g fine sea salt',
      '25 g water (to dissolve the salt)',
    ],
    equipment: [
      'Kitchen scale',
      'Large mixing bowl',
      'Banneton / proofing basket',
      'Dutch oven (or a baking stone + lid)',
      'Lame or a sharp knife for scoring',
    ],
    activeTime: '~45 minutes hands-on',
    totalTime: '~24 hours (mostly hands-off)',
    steps: [
      { title: 'Feed the starter', detail: 'Feed your starter and let it grow until bubbly and roughly doubled.', time: '4–6 h (or overnight)' },
      { title: 'Autolyse', detail: 'Mix the flour and 350 g water until no dry bits remain. Cover and rest to hydrate.', time: '1 h' },
      { title: 'Mix', detail: 'Add the starter and the salt dissolved in 25 g water. Squeeze and fold until smooth.', time: '15 min' },
      { title: 'Bulk fermentation', detail: 'Stretch and fold every 30 min for the first 2 h, then let it rise until puffy and ~50% larger.', time: '4–6 h at ~22°C' },
      { title: 'Shape', detail: 'Pre-shape into a round, bench-rest, then shape tightly and place seam-up in a floured banneton.', time: '30 min' },
      { title: 'Cold proof', detail: 'Cover and refrigerate overnight to develop flavour and firm up for scoring.', time: '12–16 h' },
      { title: 'Bake', detail: 'Preheat the Dutch oven to 230°C. Turn out the loaf, score, bake covered, then uncovered to brown.', time: '20 min covered + 25 min uncovered' },
    ],
    storage: 'Cool completely (at least 1 h) before slicing — the crumb sets as it cools. Keep cut-side down on a board at room temperature for 2–3 days, or slice and freeze for up to 3 months. Refresh slices straight from the freezer in a toaster.',
  };
}
