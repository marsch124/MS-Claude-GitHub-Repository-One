// Unit tests for the pure domain logic. Run with:  node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeBrinePercent, isBrineInRange, daysBetween, fermentDays, batchStatus,
  overallRating, summarizeStats, newBatch, ratingStars,
  nextCheckDue, isCheckDue, dueBatches, recommendation, toCSV,
  presetFromBatch, batchFromPreset, duplicateBatch, DEFAULT_REMIND_DAYS,
  VEGETABLES, usedVegetables, mergeVegetables,
  COMMON_SPICES, usedSpices, mergeSpices, renamedList, withoutItem,
  newRecipe, duplicateRecipe, sampleSourdoughRecipe, RECIPE_CATEGORIES,
  newBake, overallBakeRating, duplicateBake, BAKE_CATEGORIES, summarizeBakes,
} from '../js/model.js';
import { APP_VERSION, CHANGELOG } from '../js/changelog.js';
import { normalizeRecipe, extractJSON, normalizeBatch, normalizeCheckIn, normalizeBake } from '../js/ai.js';

test('computeBrinePercent: standard 2.5% brine', () => {
  assert.equal(computeBrinePercent(25, 975), 2.5);
});

test('computeBrinePercent: approximates water ml as grams', () => {
  assert.equal(computeBrinePercent(20, 980), 2);
});

test('computeBrinePercent: invalid or empty inputs return null', () => {
  assert.equal(computeBrinePercent('', 1000), null);
  assert.equal(computeBrinePercent(10, 'abc'), null);
  assert.equal(computeBrinePercent(0, 0), null);
  assert.equal(computeBrinePercent(-5, 1000), null);
});

test('isBrineInRange: 2–3% window', () => {
  assert.equal(isBrineInRange(2.5), true);
  assert.equal(isBrineInRange(1.9), false);
  assert.equal(isBrineInRange(3.1), false);
  assert.equal(isBrineInRange(null), false);
});

test('daysBetween: counts whole days and never goes negative', () => {
  assert.equal(daysBetween('2026-01-01', '2026-01-08'), 7);
  assert.equal(daysBetween('2026-01-10', '2026-01-01'), 0);
  assert.equal(daysBetween('', '2026-01-08'), null);
});

test('fermentDays: uses fridge date, else outcome, else now', () => {
  assert.equal(fermentDays({ startDate: '2026-01-01', movedToFridgeDate: '2026-01-11' }), 10);
  assert.equal(fermentDays({ startDate: '2026-01-01', outcome: { recordedAt: '2026-01-06T10:00:00Z' } }), 5);
  assert.equal(fermentDays({}), null);
});

test('batchStatus: derives lifecycle from dates/outcome', () => {
  assert.equal(batchStatus({ startDate: '2026-01-01' }), 'fermenting');
  assert.equal(batchStatus({ movedToFridgeDate: '2026-01-10' }), 'fridge');
  assert.equal(batchStatus({ outcome: { recorded: true } }), 'done');
});

test('overallRating: uses explicit overall, else averages parts', () => {
  assert.equal(overallRating({ outcome: { overall: 4 } }), 4);
  assert.equal(overallRating({ outcome: { taste: 4, sourness: 2, crunch: 3 } }), 3);
  assert.equal(overallRating({ outcome: {} }), null);
  assert.equal(overallRating({}), null);
});

test('ratingStars: renders filled/empty stars', () => {
  assert.equal(ratingStars(3), '★★★☆☆');
  assert.equal(ratingStars(null), '—');
});

test('newBatch: sensible carrot defaults, unique id, reminder default', () => {
  const b = newBatch(new Date('2026-07-21T10:00:00Z'));
  assert.equal(b.vegetable, 'Carrot sticks');
  assert.equal(b.startDate, '2026-07-21');
  assert.equal(b.remindEveryDays, DEFAULT_REMIND_DAYS);
  assert.ok(computeBrinePercent(b.saltGrams, b.waterMl) > 0);
  assert.notEqual(newBatch().id, newBatch().id);
});

// ---------- reminders ----------
test('nextCheckDue: counts interval from last check-in or start', () => {
  assert.equal(nextCheckDue({ startDate: '2026-07-01', remindEveryDays: 3 }), '2026-07-04');
  assert.equal(nextCheckDue({ startDate: '2026-07-01', remindEveryDays: 3, checkIns: [{ date: '2026-07-05' }] }), '2026-07-08');
});

test('nextCheckDue: null when reminders off, or batch not fermenting', () => {
  assert.equal(nextCheckDue({ startDate: '2026-07-01', remindEveryDays: 0 }), null);
  assert.equal(nextCheckDue({ startDate: '2026-07-01', movedToFridgeDate: '2026-07-05', remindEveryDays: 3 }), null);
  assert.equal(nextCheckDue({ startDate: '2026-07-01', outcome: { recorded: true }, remindEveryDays: 3 }), null);
});

test('isCheckDue / dueBatches: overdue detection', () => {
  const b = { id: 'x', startDate: '2026-07-01', remindEveryDays: 3 }; // due 2026-07-04
  assert.equal(isCheckDue(b, new Date('2026-07-04T09:00:00Z')), true);
  assert.equal(isCheckDue(b, new Date('2026-07-03T09:00:00Z')), false);
  const list = [b, { id: 'y', startDate: '2026-07-20', remindEveryDays: 3 }];
  assert.deepEqual(dueBatches(list, new Date('2026-07-05')).map((x) => x.id), ['x']);
});

// ---------- stats ----------
function finished({ name, brineSalt, brineWater, temp, veg, lid, overall, success, problems = [], start, fridge }) {
  return {
    name, vegetable: veg, saltGrams: brineSalt, waterMl: brineWater, roomTempC: temp, lidType: lid,
    startDate: start, movedToFridgeDate: fridge,
    outcome: { recorded: true, overall, success, problems, recordedAt: (fridge || start) + 'T10:00:00Z' },
  };
}

test('summarizeStats: empty input degrades gracefully', () => {
  const s = summarizeStats([]);
  assert.equal(s.total, 0);
  assert.equal(s.successRate, null);
  assert.equal(s.bestBatch, null);
  assert.deepEqual(s.ratingVsBrine, []);
  assert.deepEqual(s.vegetables, []);
});

test('summarizeStats: aggregates ratings, success, best, problems, trend', () => {
  const batches = [
    finished({ name: 'A', brineSalt: 25, brineWater: 975, temp: 20, veg: 'Carrot sticks', lid: 'Airlock', overall: 5, success: true, start: '2026-06-01', fridge: '2026-06-11' }),
    finished({ name: 'B', brineSalt: 20, brineWater: 980, temp: 24, veg: 'Carrot sticks', lid: 'Plain lid', overall: 2, success: false, problems: ['Mould'], start: '2026-06-15', fridge: '2026-06-22' }),
    finished({ name: 'C', brineSalt: 30, brineWater: 970, temp: 18, veg: 'Cabbage', lid: 'Airlock', overall: 4, success: true, start: '2026-07-01', fridge: '2026-07-14' }),
    { name: 'D', vegetable: 'Carrot sticks', startDate: '2026-07-20' }, // still fermenting
  ];
  const s = summarizeStats(batches);
  assert.equal(s.total, 4);
  assert.equal(s.active, 1);
  assert.equal(s.finished, 3);
  assert.equal(s.successRate, 2 / 3);
  assert.equal(s.bestBatch.name, 'A');
  assert.equal(s.bestRating, 5);
  assert.equal(s.ratingVsBrine.length, 3);
  assert.equal(s.ratingVsDays.length, 3);
  assert.deepEqual(s.ratingOverTime.map((p) => p.x), [1, 2, 3]);      // oldest→newest
  assert.deepEqual(s.ratingOverTime.map((p) => p.name), ['A', 'B', 'C']);
  assert.deepEqual(s.vegetables, ['Cabbage', 'Carrot sticks']);
  const mould = s.problems.find((p) => p.label === 'Mould');
  assert.equal(mould.value, 1);
});

test('summarizeStats: vegetable filter narrows the charts', () => {
  const batches = [
    finished({ name: 'A', brineSalt: 25, brineWater: 975, temp: 20, veg: 'Carrot sticks', lid: 'Airlock', overall: 5, success: true, start: '2026-06-01', fridge: '2026-06-11' }),
    finished({ name: 'C', brineSalt: 30, brineWater: 970, temp: 18, veg: 'Cabbage', lid: 'Airlock', overall: 4, success: true, start: '2026-07-01', fridge: '2026-07-14' }),
  ];
  const s = summarizeStats(batches, { vegetable: 'Cabbage' });
  assert.equal(s.total, 1);
  assert.equal(s.bestBatch.name, 'C');
  assert.deepEqual(s.vegetables, ['Cabbage', 'Carrot sticks']); // full list preserved for the dropdown
});

test('recommendation: learns from best batches, null when too few', () => {
  const batches = [
    finished({ name: 'A', brineSalt: 25, brineWater: 975, temp: 20, veg: 'Carrot sticks', lid: 'Airlock', overall: 5, success: true, start: '2026-06-01', fridge: '2026-06-11' }),
    finished({ name: 'B', brineSalt: 24, brineWater: 976, temp: 21, veg: 'Carrot sticks', lid: 'Airlock', overall: 4, success: true, start: '2026-06-15', fridge: '2026-06-23' }),
    finished({ name: 'C', brineSalt: 20, brineWater: 980, temp: 25, veg: 'Cabbage', lid: 'Plain lid', overall: 2, success: false, start: '2026-07-01', fridge: '2026-07-05' }),
  ];
  const rec = recommendation(batches);
  assert.equal(rec.count, 2);          // only the two 4★+ batches
  assert.equal(rec.lid, 'Airlock');
  assert.equal(rec.vegetable, 'Carrot sticks');
  assert.ok(rec.brine > 2 && rec.brine < 3);
  assert.equal(recommendation([batches[2]]), null);
});

// ---------- CSV ----------
test('toCSV: header + escaping of commas/quotes/newlines', () => {
  const csv = toCSV([
    { name: 'Plain', vegetable: 'Carrot sticks', startDate: '2026-07-01', saltGrams: 25, waterMl: 975 },
    { name: 'Has, comma "and" quote', vegetable: 'Cabbage', startDate: '2026-07-02', notes: 'line1\nline2' },
  ]);
  const lines = csv.split('\n');
  assert.ok(lines[0].startsWith('Name,Vegetable,Start date'));
  assert.ok(csv.includes('"Has, comma ""and"" quote"'));
  assert.ok(csv.includes('"line1\nline2"'));
  assert.ok(csv.includes('2.5')); // brine computed
});

// ---------- presets / duplication ----------
test('presetFromBatch / batchFromPreset: round-trips the recipe', () => {
  const src = newBatch(new Date('2026-07-21T10:00:00Z'));
  src.saltGrams = 30; src.roomTempC = 19; src.lidType = 'Airlock'; src.additions = ['Garlic', 'Dill'];
  const preset = presetFromBatch(src, 'My carrots');
  assert.equal(preset.name, 'My carrots');
  const b = batchFromPreset(preset, new Date('2026-08-01T10:00:00Z'));
  assert.equal(b.saltGrams, 30);
  assert.equal(b.roomTempC, 19);
  assert.equal(b.lidType, 'Airlock');
  assert.deepEqual(b.additions, ['Garlic', 'Dill']);
  assert.equal(b.startDate, '2026-08-01'); // fresh start date
  assert.notEqual(b.additions, src.additions); // copied, not shared
});

// ---------- custom vegetables ----------
test('VEGETABLES no longer contains "Other"', () => {
  assert.equal(VEGETABLES.includes('Other'), false);
});

test('usedVegetables: distinct, non-built-in, sorted', () => {
  const batches = [
    { vegetable: 'Carrot sticks' }, // built-in, excluded
    { vegetable: 'Kohlrabi' },
    { vegetable: 'Ramson' },
    { vegetable: 'Kohlrabi' },      // duplicate
    { vegetable: '' },              // ignored
  ];
  assert.deepEqual(usedVegetables(batches), ['Kohlrabi', 'Ramson']);
  assert.deepEqual(usedVegetables([]), []);
});

test('mergeVegetables: built-ins first, then unique extras', () => {
  const merged = mergeVegetables(['Kohlrabi', 'Carrot sticks', 'Kohlrabi']);
  assert.equal(merged[0], 'Carrot sticks');          // built-in order preserved
  assert.equal(merged.filter((v) => v === 'Kohlrabi').length, 1); // de-duped
  assert.equal(merged.filter((v) => v === 'Carrot sticks').length, 1);
  assert.ok(merged.includes('Kohlrabi'));
});

// ---------- custom spices ----------
test('usedSpices: distinct non-built-in spices from batch additions, sorted', () => {
  const batches = [
    { additions: ['Garlic', 'Turmeric'] }, // Garlic built-in, Turmeric custom
    { additions: ['Fennel seed', 'Turmeric'] },
    { additions: [] },
    {},
  ];
  assert.deepEqual(usedSpices(batches), ['Fennel seed', 'Turmeric']);
  assert.deepEqual(usedSpices([]), []);
});

test('mergeSpices: built-ins first, then unique extras', () => {
  const merged = mergeSpices(['Turmeric', 'Garlic', 'Turmeric']);
  assert.equal(merged[0], COMMON_SPICES[0]);
  assert.equal(merged.filter((s) => s === 'Turmeric').length, 1);
  assert.equal(merged.filter((s) => s === 'Garlic').length, 1);
  assert.ok(merged.includes('Turmeric'));
});

test('renamedList: replaces, de-duplicates, drops blanks', () => {
  assert.deepEqual(renamedList(['Garlic', 'Dill'], 'Garlic', 'Roasted garlic'), ['Roasted garlic', 'Dill']);
  // renaming onto an existing value merges (no duplicate)
  assert.deepEqual(renamedList(['Garlic', 'Dill'], 'Dill', 'Garlic'), ['Garlic']);
  assert.deepEqual(renamedList(['A', ''], 'A', ''), []); // blanks dropped
  assert.deepEqual(renamedList(null, 'x', 'y'), []);
});

test('withoutItem: removes all occurrences', () => {
  assert.deepEqual(withoutItem(['Garlic', 'Dill', 'Garlic'], 'Garlic'), ['Dill']);
  assert.deepEqual(withoutItem(null, 'x'), []);
});

// ---------- recipes ----------
test('newRecipe: sensible defaults, unique id', () => {
  const r = newRecipe(new Date('2026-07-21T10:00:00Z'));
  assert.equal(r.category, 'Sourdough');
  assert.ok(RECIPE_CATEGORIES.includes(r.category));
  assert.deepEqual(r.ingredients, []);
  assert.deepEqual(r.steps, []);
  assert.equal(r.createdAt, r.updatedAt);
  assert.notEqual(newRecipe().id, newRecipe().id);
});

test('sampleSourdoughRecipe: fully populated worked example', () => {
  const r = sampleSourdoughRecipe();
  assert.match(r.title, /Sourdough/i);
  assert.ok(r.ingredients.length >= 4);
  assert.ok(r.equipment.length >= 3);
  assert.ok(r.steps.length >= 5);
  assert.ok(r.steps.every((s) => s.title && s.time)); // each step has a name and a time
  assert.ok(r.totalTime && r.activeTime && r.storage);
});

test('duplicateRecipe: deep copy, new id, "(copy)" title', () => {
  const src = sampleSourdoughRecipe();
  const dup = duplicateRecipe(src, new Date('2026-08-01T10:00:00Z'));
  assert.equal(dup.title, src.title + ' (copy)');
  assert.notEqual(dup.id, src.id);
  assert.notEqual(dup.steps, src.steps);      // arrays copied, not shared
  dup.steps[0].title = 'changed';
  assert.notEqual(src.steps[0].title, 'changed');
});

// ---------- AI recipe builder (pure helpers) ----------
test('normalizeRecipe: coerces output, drops junk, clamps category', () => {
  const r = normalizeRecipe({
    title: '  Kraut  ', category: 'Nonsense', description: 'tasty',
    ingredients: ['1 cabbage', '', 3], equipment: 'not an array',
    activeTime: '20 min', totalTime: '', storage: 'fridge',
    steps: [{ title: 'Pack', detail: '', time: '15 min' }, { title: '', detail: '', time: '' }],
  });
  assert.equal(r.title, 'Kraut');
  assert.equal(r.category, 'Other');            // unknown category clamped
  assert.deepEqual(r.ingredients, ['1 cabbage']); // blanks & non-strings dropped
  assert.deepEqual(r.equipment, []);              // non-array → empty
  assert.equal(r.steps.length, 1);               // empty step removed
  assert.equal(r.steps[0].title, 'Pack');
  assert.ok(r.id.startsWith('r_'));              // real recipe skeleton
});

test('normalizeRecipe: keeps a valid category and full steps', () => {
  const r = normalizeRecipe({ title: 'Loaf', category: 'Sourdough', steps: [{ title: 'Bake', detail: 'hot', time: '45 min' }] });
  assert.equal(r.category, 'Sourdough');
  assert.deepEqual(r.steps[0], { title: 'Bake', detail: 'hot', time: '45 min' });
});

test('normalizeBatch: coerces numbers, maps lid/weight, keeps defaults', () => {
  const b = normalizeBatch({
    name: 'Spicy', vegetable: 'Kohlrabi', saltGrams: 26, waterMl: 1000, roomTempC: 19,
    jarSizeMl: null, additions: ['Garlic', ''], vesselType: 'Glass jar',
    lidType: 'airlock', weightType: 'glass weight', remindEveryDays: 2,
  });
  assert.equal(b.name, 'Spicy');
  assert.equal(b.vegetable, 'Kohlrabi');
  assert.equal(b.saltGrams, 26);
  assert.equal(b.roomTempC, 19);
  assert.equal(b.lidType, 'Airlock');          // mapped to canonical option
  assert.equal(b.weightType, 'Glass weight');
  assert.deepEqual(b.additions, ['Garlic']);   // blank dropped
  assert.equal(b.remindEveryDays, 2);
  assert.equal(b.jarSizeMl, 1000);             // null → default kept
  assert.ok(b.id.startsWith('b_'));            // real batch skeleton
  assert.deepEqual(b.checkIns, []);
  assert.equal(b.outcome, null);
});

test('normalizeBatch: empty input falls back to carrot defaults', () => {
  const b = normalizeBatch({});
  assert.equal(b.vegetable, 'Carrot sticks');
  assert.equal(b.saltGrams, 25);
  assert.equal(b.waterMl, 1000);
});

test('normalizeCheckIn: keeps a valid date, trims note', () => {
  const c = normalizeCheckIn({ date: '2026-07-05', tasteNote: '  Tangy and crunchy  ' });
  assert.equal(c.date, '2026-07-05');
  assert.equal(c.tasteNote, 'Tangy and crunchy');
});

test('normalizeCheckIn: bad/absent date falls back to today', () => {
  const now = new Date('2026-07-21T09:00:00Z');
  assert.equal(normalizeCheckIn({ date: 'day 4', tasteNote: 'x' }, now).date, '2026-07-21');
  assert.equal(normalizeCheckIn({ tasteNote: 'x' }, now).date, '2026-07-21');
  assert.equal(normalizeCheckIn({ date: '2026-13-40', tasteNote: 'x' }, now).date, '2026-07-21');
});

test('normalizeBake: clamps ratings, category, date; assembles ratings object', () => {
  const now = new Date('2026-07-21T09:00:00Z');
  const b = normalizeBake({ name: 'Loaf', category: 'Nope', bakeDate: 'yesterday', crust: 9, crumb: 2, flavour: null, overall: 4.6, problems: ['Dense crumb', ''], notes: 'good' }, now);
  assert.equal(b.name, 'Loaf');
  assert.equal(b.category, 'Sourdough');       // unknown clamped
  assert.equal(b.bakeDate, '2026-07-21');      // bad date → today
  assert.equal(b.ratings.crust, 5);            // 9 → 5
  assert.equal(b.ratings.crumb, 2);
  assert.equal(b.ratings.flavour, undefined);  // null → unset
  assert.equal(b.ratings.overall, 5);          // 4.6 → 5
  assert.deepEqual(b.problems, ['Dense crumb']);
  assert.ok(b.id.startsWith('k_'));
});

test('extractJSON: parses clean JSON and JSON embedded in prose', () => {
  assert.deepEqual(extractJSON('{"a":1}'), { a: 1 });
  assert.deepEqual(extractJSON('Sure! ```json\n{"a":2}\n``` done'), { a: 2 });
  assert.throws(() => extractJSON('no json here'));
});

// ---------- bakes ----------
test('newBake: defaults, unique id, sourdough category', () => {
  const b = newBake(new Date('2026-07-21T10:00:00Z'));
  assert.equal(b.category, 'Sourdough');
  assert.ok(BAKE_CATEGORIES.includes(b.category));
  assert.equal(b.bakeDate, '2026-07-21');
  assert.deepEqual(b.problems, []);
  assert.ok(b.id.startsWith('k_'));
  assert.notEqual(newBake().id, newBake().id);
});

test('overallBakeRating: explicit overall, else average of parts', () => {
  assert.equal(overallBakeRating({ ratings: { overall: 5 } }), 5);
  assert.equal(overallBakeRating({ ratings: { crust: 4, crumb: 2, flavour: 3 } }), 3);
  assert.equal(overallBakeRating({ ratings: {} }), null);
  assert.equal(overallBakeRating({}), null);
});

test('duplicateBake: fresh id, today date, "(copy)" name', () => {
  const src = newBake(new Date('2026-06-01T10:00:00Z'));
  src.name = 'Country loaf';
  src.ratings = { overall: 5 };
  const dup = duplicateBake(src, new Date('2026-07-21T10:00:00Z'));
  assert.equal(dup.name, 'Country loaf (copy)');
  assert.equal(dup.bakeDate, '2026-07-21');
  assert.notEqual(dup.id, src.id);
  assert.notEqual(dup.ratings, src.ratings); // deep-copied
});

test('summarizeBakes: empty degrades; aggregates ratings/recipes/problems', () => {
  assert.equal(summarizeBakes([]).total, 0);
  assert.equal(summarizeBakes([]).avgOverall, null);
  const bakes = [
    { name: 'A', category: 'Sourdough', recipeTitle: 'Everyday', bakeDate: '2026-06-01', ratings: { overall: 5 }, problems: [] },
    { name: 'B', category: 'Sourdough', recipeTitle: 'Everyday', bakeDate: '2026-06-08', ratings: { overall: 3 }, problems: ['Dense crumb'] },
    { name: 'C', category: 'Bread', recipeTitle: '', bakeDate: '2026-06-15', ratings: { crust: 4, crumb: 4, flavour: 4 }, problems: ['Dense crumb'] },
    { name: 'D', category: 'Sourdough', bakeDate: '2026-06-20' }, // unrated
  ];
  const s = summarizeBakes(bakes);
  assert.equal(s.total, 4);
  assert.equal(s.rated, 3);
  assert.equal(s.bestBake.name, 'A');
  assert.equal(s.bestRating, 5);
  const everyday = s.byRecipe.find((r) => r.label === 'Everyday');
  assert.equal(everyday.value, 4);   // (5+3)/2
  assert.equal(everyday.count, 2);
  const dense = s.problems.find((p) => p.label === 'Dense crumb');
  assert.equal(dense.value, 2);
  assert.deepEqual(s.ratingOverTime.map((p) => p.name), ['A', 'B', 'C']); // oldest→newest
});

// ---------- changelog integrity ----------
test('changelog: APP_VERSION matches the newest entry, entries well-formed', () => {
  assert.equal(CHANGELOG[0].version, APP_VERSION);
  for (const entry of CHANGELOG) {
    assert.ok(entry.version && entry.title && entry.date);
    assert.ok(Array.isArray(entry.changes) && entry.changes.length > 0);
    assert.ok(entry.changes.every((c) => typeof c === 'string' && c.length));
  }
  // versions are unique
  const versions = CHANGELOG.map((e) => e.version);
  assert.equal(new Set(versions).size, versions.length);
});

test('duplicateBatch: copies recipe, resets progress and names it (copy)', () => {
  const src = newBatch(new Date('2026-07-01T10:00:00Z'));
  src.name = 'Spicy carrot #1';
  src.checkIns = [{ date: '2026-07-03', tasteNote: 'good' }];
  src.outcome = { recorded: true, overall: 5 };
  src.photos = ['data:...'];
  src.movedToFridgeDate = '2026-07-10';
  const dup = duplicateBatch(src, new Date('2026-08-01T10:00:00Z'));
  assert.equal(dup.name, 'Spicy carrot #1 (copy)');
  assert.deepEqual(dup.checkIns, []);
  assert.equal(dup.outcome, null);
  assert.deepEqual(dup.photos, []);
  assert.equal(dup.movedToFridgeDate, '');
  assert.equal(dup.startDate, '2026-08-01');
  assert.notEqual(dup.id, src.id);
});
