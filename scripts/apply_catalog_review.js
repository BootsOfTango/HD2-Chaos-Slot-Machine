// Apply reviewed catalog corrections. Never reads user saves. Explicit campaign
// exclusions affect fresh catalog defaults only, never player-owned/enabled flags.
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
  const exclusions = review.freshInstallExclusions ?? [];
  assert(Array.isArray(exclusions) && new Set(exclusions).size === exclusions.length, 'Fresh exclusions must be a unique ID list');
  for (const id of exclusions) {
    const item = byId.get(id);
    assert(seen.has(id) && item?.acquisition?.kind === 'campaign-reward', 'Fresh exclusions require an explicitly reviewed campaign reward');
    item.defaultEnabled = false;
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
  const review = JSON.parse(fs.readFileSync(reviewPath));
  const next = applyReview(JSON.parse(fs.readFileSync(catalogPath)), review);
  fs.writeFileSync(catalogPath, JSON.stringify(next, null, 2) + '\n');
  console.log(`Applied review preserving ${next.items.length} identities/player flags; ${(review.freshInstallExclusions || []).length} explicit fresh-profile exclusions.`);
}
module.exports = { applyReview };
