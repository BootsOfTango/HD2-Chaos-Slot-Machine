// Reviewed identity changes only; never reads/writes player saves or deletes art.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
function applyIdentityMerges(catalog, review) {
  assert.equal(review.schemaVersion, 1, 'Unsupported identity review');
  const next = structuredClone(catalog);
  const seen = new Set();
  for (const merge of review.merges) {
    const { canonicalId, retiredItem } = merge;
    assert(canonicalId !== retiredItem.id && !seen.has(retiredItem.id), 'Repeated/self identity merge');
    seen.add(retiredItem.id);
    const canonical = next.items.find(item => item.id === canonicalId);
    assert(canonical && canonical.type === retiredItem.type, 'Missing/cross-category canonical identity');
    const retired = next.items.find(item => item.id === retiredItem.id);
    if (retired) assert.deepEqual(retired, retiredItem, 'Retired record changed since review');
    else assert(canonical.legacyIds?.includes(retiredItem.id), 'Missing retired identity without migration');
    assert(!next.items.some(item => item.id !== canonicalId && item.legacyIds?.includes(retiredItem.id)), 'Legacy ID already assigned elsewhere');
    canonical.legacyIds = [...new Set([...(canonical.legacyIds || []), retiredItem.id, ...(retiredItem.legacyIds || [])])];
    canonical.aliases = [...new Set([...canonical.aliases, retiredItem.name, ...retiredItem.aliases, ...(merge.aliases || [])])];
    canonical.acquisition.notes = merge.notes;
    next.items = next.items.filter(item => item.id !== retiredItem.id);
    // These two reviewed duplicates are requisition equipment, not Warbond members.
    assert(!next.warbonds.some(bond => bond.equipmentIds.includes(retiredItem.id)), 'Warbond association needs an explicit review');
  }
  return next;
}
if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  const review = require('../assets/catalog-reviews/2026-09-14-identity-merges.json');
  const file = path.join(root, 'assets/item-catalog.json');
  const next = applyIdentityMerges(JSON.parse(fs.readFileSync(file, 'utf8')), review);
  fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n');
  console.log(`Catalog now has ${next.items.length} canonical entries; retired records preserved in the review manifest.`);
}
module.exports = { applyIdentityMerges };
