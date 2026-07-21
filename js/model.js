// model.js — pure domain logic for FermentLog.
// No DOM, no storage: just data in, data out. This is the unit-tested core.

export const VEGETABLES = [
  'Carrot sticks', 'Cabbage', 'Cucumber', 'Beetroot', 'Cauliflower',
  'Green beans', 'Radish', 'Garlic', 'Onion', 'Pepper', 'Other',
];

export const LID_TYPES = ['Airlock', 'Burping / self-venting lid', 'Plain lid', 'Cloth / open'];
export const WEIGHT_TYPES = ['Glass weight', 'Ceramic weight', 'Cabbage leaf', 'Smaller jar', 'None'];
export const PROBLEMS = ['Mould', 'Kahm yeast', 'Mushy / soft', 'Too salty', 'Not sour enough', 'Off smell'];
export const COMMON_ADDITIONS = ['Garlic', 'Dill', 'Mustard seed', 'Black pepper', 'Bay leaf', 'Ginger', 'Chilli'];

// Recommended brine window for vegetable ferments.
export const BRINE_MIN = 2.0;
export const BRINE_MAX = 3.0;

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

const round1 = (n) => Math.round(n * 10) / 10;

/**
 * Aggregate a list of batches into the numbers the Insights screen shows.
 * Everything degrades gracefully when there is little or no data.
 */
export function summarizeStats(batches) {
  const list = Array.isArray(batches) ? batches : [];
  const finished = list.filter((b) => batchStatus(b) === 'done');

  const successful = finished.filter((b) => b.outcome && b.outcome.success).length;
  const successRate = finished.length ? successful / finished.length : null;

  // Rating vs. condition scatter data (only finished batches with a rating).
  const rated = finished
    .map((b) => ({ batch: b, rating: overallRating(b) }))
    .filter((r) => r.rating != null);

  const ratingVsBrine = rated
    .map((r) => ({ x: computeBrinePercent(r.batch.saltGrams, r.batch.waterMl), y: r.rating, name: r.batch.name }))
    .filter((p) => p.x != null);

  const ratingVsTemp = rated
    .map((r) => ({ x: Number(r.batch.roomTempC), y: r.rating, name: r.batch.name }))
    .filter((p) => Number.isFinite(p.x));

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
    total: list.length,
    active: list.filter((b) => batchStatus(b) !== 'done').length,
    finished: finished.length,
    successRate,
    avgRating,
    ratingVsBrine,
    ratingVsTemp,
    byVegetable,
    byLid,
    problems,
    bestBatch,
    bestRating: bestBatch ? round1(bestRating) : null,
  };
}

/** Minimal empty batch with sensible Swedish-kitchen defaults. */
export function newBatch(now = new Date()) {
  const iso = now.toISOString().slice(0, 10);
  return {
    id: `b_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    vegetable: 'Carrot sticks',
    startDate: iso,
    saltGrams: 25,
    waterMl: 1000,
    roomTempC: 20,
    jarSizeMl: 1000,
    additions: [],
    vesselType: 'Glass jar',
    weightType: 'Glass weight',
    lidType: 'Burping / self-venting lid',
    checkIns: [],
    movedToFridgeDate: '',
    outcome: null,
    photos: [],
    notes: '',
    createdAt: now.toISOString(),
  };
}

export function ratingStars(n) {
  if (!Number.isFinite(n)) return '—';
  const full = Math.round(n);
  return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
}
