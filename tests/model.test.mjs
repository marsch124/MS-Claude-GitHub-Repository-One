// Unit tests for the pure domain logic. Run with:  node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeBrinePercent, isBrineInRange, daysBetween, batchStatus,
  overallRating, summarizeStats, newBatch, ratingStars,
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

test('newBatch: sensible carrot defaults, unique id', () => {
  const b = newBatch(new Date('2026-07-21T10:00:00Z'));
  assert.equal(b.vegetable, 'Carrot sticks');
  assert.equal(b.startDate, '2026-07-21');
  assert.ok(computeBrinePercent(b.saltGrams, b.waterMl) > 0); // default brine is a positive number
  assert.notEqual(newBatch().id, newBatch().id);
});

function finished({ name, brineSalt, brineWater, temp, veg, lid, overall, success, problems = [] }) {
  return {
    name, vegetable: veg, saltGrams: brineSalt, waterMl: brineWater, roomTempC: temp, lidType: lid,
    outcome: { recorded: true, overall, success, problems },
  };
}

test('summarizeStats: empty input degrades gracefully', () => {
  const s = summarizeStats([]);
  assert.equal(s.total, 0);
  assert.equal(s.successRate, null);
  assert.equal(s.bestBatch, null);
  assert.deepEqual(s.ratingVsBrine, []);
});

test('summarizeStats: aggregates ratings, success, best batch, problems', () => {
  const batches = [
    finished({ name: 'A', brineSalt: 25, brineWater: 975, temp: 20, veg: 'Carrot sticks', lid: 'Airlock', overall: 5, success: true }),
    finished({ name: 'B', brineSalt: 20, brineWater: 980, temp: 24, veg: 'Carrot sticks', lid: 'Plain lid', overall: 2, success: false, problems: ['Mould', 'Mushy / soft'] }),
    finished({ name: 'C', brineSalt: 30, brineWater: 970, temp: 18, veg: 'Cabbage', lid: 'Airlock', overall: 4, success: true }),
    { name: 'D', startDate: '2026-07-01' }, // still fermenting, no outcome
  ];
  const s = summarizeStats(batches);
  assert.equal(s.total, 4);
  assert.equal(s.active, 1);
  assert.equal(s.finished, 3);
  assert.equal(s.successRate, 2 / 3);
  assert.equal(s.bestBatch.name, 'A');
  assert.equal(s.bestRating, 5);
  assert.equal(s.ratingVsBrine.length, 3);
  assert.equal(s.ratingVsTemp.length, 3);

  // Carrot avg = (5 + 2) / 2 = 3.5; Cabbage = 4
  const carrot = s.byVegetable.find((v) => v.label === 'Carrot sticks');
  assert.equal(carrot.value, 3.5);
  assert.equal(carrot.count, 2);

  // Airlock (5,4)=4.5 should outrank Plain lid (2)
  assert.equal(s.byLid[0].label, 'Airlock');
  assert.equal(s.byLid[0].value, 4.5);

  // Problems tallied
  const mould = s.problems.find((p) => p.label === 'Mould');
  assert.equal(mould.value, 1);
});
