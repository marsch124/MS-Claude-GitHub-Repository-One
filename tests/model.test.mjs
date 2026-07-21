// Unit tests for the pure domain logic. Run with:  node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeBrinePercent, isBrineInRange, daysBetween, fermentDays, batchStatus,
  overallRating, summarizeStats, newBatch, ratingStars,
  nextCheckDue, isCheckDue, dueBatches, recommendation, toCSV,
  presetFromBatch, batchFromPreset, duplicateBatch, DEFAULT_REMIND_DAYS,
} from '../js/model.js';

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
