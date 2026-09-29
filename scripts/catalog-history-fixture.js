const assert = require('node:assert/strict');
const baseline = require('../test/fixtures/warbond-review-4-baseline.json');
const review = require('../assets/catalog-reviews/2026-09-14-warbonds-4.json');
const baseline5 = require('../test/fixtures/warbond-review-5-baseline.json');
const review5 = require('../assets/catalog-reviews/2026-09-14-warbonds-5.json');
const baseline6 = require('../test/fixtures/warbond-review-6-baseline.json');
const review6 = require('../assets/catalog-reviews/2026-09-14-warbonds-6.json');
const baseline7 = require('../test/fixtures/warbond-review-7-baseline.json');
const review7 = require('../assets/catalog-reviews/2026-09-14-warbonds-7.json');
const baseline8 = require('../test/fixtures/warbond-review-8-baseline.json');
const review8 = require('../assets/catalog-reviews/2026-09-15-warbonds-8.json');
const orbitalEagleBaseline = require('../test/fixtures/orbital-eagle-baseline.json');
const defensiveBaseline = require('../test/fixtures/defensive-baseline.json');
const backpackVehicleBaseline = require('../test/fixtures/backpack-vehicle-baseline.json');
const supportWeaponBaseline = require('../test/fixtures/support-weapon-baseline.json');

// Test-only projection. Restore reviewable facts, never identities, default
// eligibility or artwork. Independent pre-change digests still detect changes
// outside the explicitly reviewed fields, including prior review regressions.
function projectBeforeBatch4(catalog) {
  const previous = projectBeforeBatch5(catalog);
  previous.warbonds = previous.warbonds.filter(bond => !review.warbonds.some(added => added.id === bond.id));
  for (const original of baseline.reviewedRows) {
    const item = previous.items.find(row => row.id === original.id);
    assert(item, `Retain prior stable ID ${original.id}`);
    for (const key of ['name', 'aliases', 'subgroup', 'warbond', 'source', 'acquisition']) {
      if (Object.hasOwn(original, key)) item[key] = structuredClone(original[key]);
      else delete item[key];
    }
  }
  return previous;
}
function projectBeforeBatch5(catalog) {
  const previous = projectBeforeBatch6(catalog);
  previous.warbonds = previous.warbonds.filter(bond => !review5.warbonds.some(added => added.id === bond.id));
  for (const original of baseline5.reviewedRows) {
    const item = previous.items.find(row => row.id === original.id);
    assert(item, `Retain prior stable ID ${original.id}`);
    for (const key of ['name', 'aliases', 'subgroup', 'warbond', 'source', 'acquisition']) {
      if (Object.hasOwn(original, key)) item[key] = structuredClone(original[key]);
      else delete item[key];
    }
  }
  return previous;
}
function projectBeforeBatch6(catalog) {
  const previous = projectBeforeBatch7(catalog);
  previous.warbonds = previous.warbonds.filter(bond => !review6.warbonds.some(added => added.id === bond.id));
  for (const original of baseline6.reviewedRows) {
    const item = previous.items.find(row => row.id === original.id);
    assert(item, `Retain prior stable ID ${original.id}`);
    for (const key of ['name', 'aliases', 'subgroup', 'warbond', 'source', 'acquisition']) {
      if (Object.hasOwn(original, key)) item[key] = structuredClone(original[key]);
      else delete item[key];
    }
  }
  return previous;
}
function projectBeforeBatch7(catalog) {
  const previous = projectBeforeBatch8(catalog);
  previous.warbonds = previous.warbonds.filter(bond => !review7.warbonds.some(added => added.id === bond.id));
  for (const original of baseline7.reviewedRows) {
    const item = previous.items.find(row => row.id === original.id);
    assert(item, `Retain prior stable ID ${original.id}`);
    for (const key of ['name', 'aliases', 'subgroup', 'warbond', 'source', 'acquisition']) {
      if (Object.hasOwn(original, key)) item[key] = structuredClone(original[key]);
      else delete item[key];
    }
  }
  return previous;
}
function projectBeforeBatch8(catalog) {
  const previous = projectBeforeOrbitalEagle(catalog);
  previous.warbonds = previous.warbonds.filter(bond => !review8.warbonds.some(added => added.id === bond.id));
  for (const original of baseline8.reviewedRows) {
    const item = previous.items.find(row => row.id === original.id);
    assert(item, `Retain prior stable ID ${original.id}`);
    for (const key of ['name', 'aliases', 'subgroup', 'warbond', 'source', 'acquisition']) {
      if (Object.hasOwn(original, key)) item[key] = structuredClone(original[key]);
      else delete item[key];
    }
  }
  return previous;
}
function projectBeforeOrbitalEagle(catalog) {
  const previous = projectBeforeDefensive(catalog);
  for (const original of orbitalEagleBaseline.reviewedRows) {
    const item = previous.items.find(row => row.id === original.id);
    assert(item, `Retain prior stable ID ${original.id}`);
    for (const key of ['warbond', 'source', 'acquisition']) item[key] = structuredClone(original[key]);
  }
  return previous;
}
function projectBeforeDefensive(catalog) {
  const previous = projectBeforeBackpackVehicle(catalog);
  for (const original of defensiveBaseline.reviewedRows) {
    const item = previous.items.find(row => row.id === original.id);
    assert(item, `Retain prior stable ID ${original.id}`);
    for (const key of ['warbond', 'source', 'acquisition']) item[key] = structuredClone(original[key]);
  }
  return previous;
}
function projectBeforeBackpackVehicle(catalog) {
  const previous = projectBeforeSupportWeapon(catalog);
  for (const original of backpackVehicleBaseline.reviewedRows) {
    const item = previous.items.find(row => row.id === original.id);
    assert(item, `Retain prior stable ID ${original.id}`);
    for (const key of ['warbond', 'source', 'acquisition']) item[key] = structuredClone(original[key]);
    if (original.id === 'stratagem:m-102-fast-recon-vehicle') item.aliases = structuredClone(original.aliases);
    if (original.id === 'stratagem:m-103-supply-frv') {
      if (Object.hasOwn(original, 'defaultEnabled')) item.defaultEnabled = original.defaultEnabled;
      else delete item.defaultEnabled;
    }
  }
  return previous;
}
function projectBeforeSupportWeapon(catalog) {
  const previous = projectBeforeHyenaRevenants(catalog);
  for (const original of supportWeaponBaseline.reviewedRows) {
    const item = previous.items.find(row => row.id === original.id);
    assert(item, `Retain prior stable ID ${original.id}`);
    for (const key of ['warbond', 'source', 'acquisition']) item[key] = structuredClone(original[key]);
  }
  return previous;
}
// Test-only: remove exactly the new records, never repair historical facts.
// Independent Window Behavior package hashes protect all prior records.
function projectBeforeHyenaRevenants(catalog) {
  const previous = projectBeforeIronclad(catalog);
  previous.items = previous.items.filter(item => item.id !== 'primary:r-4-hyena');
  previous.warbonds = previous.warbonds.filter(bond => bond.id !== 'warbond:righteous-revenants');
  return previous;
}
// Restore only the explicitly reviewed Meltagun artwork path for historical
// projections. Unexpected paths are deliberately NOT repaired; regression
// tests still detect them. Current artwork has its own identity/hash test.
function projectBeforeMeltagunArt(catalog) {
  const previous=structuredClone(catalog);
  const item=previous.items.find(row=>row.id==='stratagem:40-k-meltagun');
  if(item?.assetPath==='assets/new-gear/40-k-meltagun-stratagem.svg') item.assetPath='assets/new-gear/40-k-meltagun.png';
  return previous;
}
// Remove the eight reviewed new IDs and one new group after projecting the
// later artwork-only change. Independent accepted-package hashes guard facts.
function projectBeforeIronclad(catalog) {
  const previous=projectBeforeMeltagunArt(catalog);
  const review=require('../assets/catalog-additions/ironclad/review.json');
  const added=new Set(review.items.map(item=>item.id));
  previous.items=previous.items.filter(item=>!added.has(item.id));
  previous.warbonds=previous.warbonds.filter(bond=>bond.id!==review.warbond.id);
  return previous;
}
module.exports = { projectBeforeBatch4, projectBeforeBatch5, projectBeforeBatch6, projectBeforeBatch7, projectBeforeBatch8, projectBeforeOrbitalEagle, projectBeforeDefensive, projectBeforeBackpackVehicle, projectBeforeSupportWeapon, projectBeforeHyenaRevenants, projectBeforeIronclad };
