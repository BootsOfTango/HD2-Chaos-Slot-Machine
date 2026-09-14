// Apply a reviewed, committed fact-only correction batch. Never reads user saves.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
function applyReview(catalog, review) {
  const next = structuredClone(catalog);
  const byId = new Map(next.items.map(item => [item.id, item]));
  const seen = new Set();
  for (const correction of review.items) {
    assert(!seen.has(correction.id), `Duplicate correction: ${correction.id}`); seen.add(correction.id);
    const item = byId.get(correction.id);
    assert(item, `Review cannot invent a catalog ID: ${correction.id}`);
    assert(item.name === correction.previousName || item.name === correction.name, `Unexpected current name: ${correction.id}`);
    const allowed = ['id', 'previousName', 'name', 'subgroup', 'warbond', 'source', 'acquisition', 'aliases'];
    assert(Object.keys(correction).every(key => allowed.includes(key)), 'Review cannot change ownership, IDs, type or artwork');
    const oldName = item.name;
    for (const field of ['name', 'subgroup', 'warbond', 'source', 'acquisition']) {
      if (Object.hasOwn(correction, field)) item[field] = structuredClone(correction[field]);
    }
    item.aliases = [...new Set([...item.aliases, ...(correction.aliases || []), ...(oldName !== item.name ? [oldName] : [])])];
  }
  for (const warbond of review.warbonds || []) {
    assert(warbond.equipmentIds.every(id => byId.has(id)), `Unknown Warbond equipment: ${warbond.id}`);
    const position = next.warbonds.findIndex(row => row.id === warbond.id);
    if (position < 0) next.warbonds.push(structuredClone(warbond));
    else next.warbonds[position] = structuredClone(warbond);
  }
  return next;
}
if (require.main === module) {
  const reviewPath = path.resolve(root, process.argv[2] || 'assets/catalog-reviews/2026-09-14.json');
  const catalogPath = path.join(root, 'assets/item-catalog.json');
  const next = applyReview(JSON.parse(fs.readFileSync(catalogPath)), JSON.parse(fs.readFileSync(reviewPath)));
  fs.writeFileSync(catalogPath, JSON.stringify(next, null, 2) + '\n');
  console.log(`Applied reviewed facts without changing ${next.items.length} identities or eligibility defaults.`);
}
module.exports = { applyReview };
