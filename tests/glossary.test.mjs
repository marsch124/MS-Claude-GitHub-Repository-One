import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { mergeTerms, filterTerms } = require('../js/app.js');

test('mergeTerms combines built-in and custom terms', () => {
  const builtin = [{ term: 'T1', def: 'swim to bike', category: 'Racing' }];
  const custom = [{ term: 'BTA', def: 'between the arms', category: 'Gear' }];
  const merged = mergeTerms(builtin, custom);
  assert.equal(merged.length, 2);
  assert.equal(merged.find((t) => t.term === 'BTA').custom, true);
  assert.equal(merged.find((t) => t.term === 'T1').custom, false);
});

test('a custom term overrides a built-in with the same name (case-insensitive)', () => {
  const builtin = [{ term: 'Tri', def: 'old definition', category: 'General' }];
  const custom = [{ term: 'tri', def: 'my definition', category: 'General' }];
  const merged = mergeTerms(builtin, custom);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].def, 'my definition');
  assert.equal(merged[0].custom, true);
});

test('mergeTerms ignores entries with a blank term', () => {
  const merged = mergeTerms([{ term: '', def: 'x' }], [{ term: '   ', def: 'y' }]);
  assert.equal(merged.length, 0);
});

test('filterTerms matches term, expansion and definition text', () => {
  const terms = [
    { term: 'FTP', full: 'Functional Threshold Power', def: 'hardest hour', category: 'Bike' },
    { term: 'Bonk', full: '', def: 'running out of fuel', category: 'Physiology' },
  ];
  assert.equal(filterTerms(terms, 'ftp').length, 1);          // by acronym
  assert.equal(filterTerms(terms, 'threshold').length, 1);    // by expansion
  assert.equal(filterTerms(terms, 'fuel').length, 1);         // by definition
  assert.equal(filterTerms(terms, 'zzz').length, 0);          // no match
});

test('filterTerms respects the category filter and "All"', () => {
  const terms = [
    { term: 'FTP', full: '', def: 'power', category: 'Bike' },
    { term: 'CSS', full: '', def: 'swim pace', category: 'Swim' },
  ];
  assert.equal(filterTerms(terms, '', 'Bike').length, 1);
  assert.equal(filterTerms(terms, '', 'All').length, 2);
  assert.equal(filterTerms(terms, '', '').length, 2);
});

test('filterTerms returns results alphabetically by term', () => {
  const terms = [
    { term: 'Zone 2', full: '', def: 'easy', category: 'Training' },
    { term: 'Aero', full: '', def: 'fast', category: 'Bike' },
  ];
  const out = filterTerms(terms, '', 'All');
  assert.deepEqual(out.map((t) => t.term), ['Aero', 'Zone 2']);
});
