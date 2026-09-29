'use strict';
// Read-only, dated research audit. Never adds gear, grants ownership, or fetches updates.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const titleFromUrl = value => {
  try { return decodeURIComponent(new URL(value).pathname.split('/').pop()).replaceAll('_', ' '); }
  catch { return ''; }
};
const upcoming = new Set(['AR-11 Arbitrator', 'GL-15 Evictor', 'P-34 Breacher', 'G-60 Anti-Tank Seeker', 'G-8 Immolation', 'Integrated Extinguishers', 'Surplus EAT Allocation']);
const excluded = new Map([
  ['M-104 Incinerator FRV', 'Not currently obtainable/selectable according to the dated community procurement page'],
  ['Guard Dog (disambiguation)', 'Disambiguation'], ['Exosuit (disambiguation)', 'Disambiguation'],
  ['FRV (disambiguation)', 'Disambiguation'], ['Eagle Rearm', 'Rearm command, not equipment'],
  ['April Fools/Budget Helldiver', 'April Fools entry'], ['Boosters', 'Index page'], ['Warbonds', 'Index page']
]);

function audit({ catalog, images, inventory, releaseReview = require('../assets/catalog-additions/ironclad/review.json'), readAsset = name => fs.readFileSync(path.join(root, name)) }) {
  const issues = [], deferred = [], ignored = [], seen = new Set();
  const rows = Object.values(images).filter(Array.isArray).flat();
  const released = new Map((releaseReview?.items || []).map(item => [item.name, item]));
  const byId = new Map(rows.map(row => [row.id, row]));
  if (byId.size !== rows.length) issues.push({ kind: 'duplicate-image-id' });
  if (new Set(catalog.items.map(item => item.id)).size !== catalog.items.length) issues.push({ kind: 'duplicate-item-id' });
  const aliases = new Map();
  for (const item of catalog.items) {
    const image = byId.get(item.id);
    for (const name of [item.name, ...(item.aliases || []), image?.wikiTitle, titleFromUrl(item.acquisition?.sourceUrl)]) {
      const key = normalize(name);
      if (!key) continue;
      if (!aliases.has(key)) aliases.set(key, new Set());
      aliases.get(key).add(item.id);
    }
  }
  // Reviewed full designations; not fuzzy matches or additional items.
  const designations = {
    'AX/FLAM-75 Hot Dog': 'hot-dog', 'AX/AR-23 Guard Dog': 'guard-dog', 'AX/LAS-5 Rover': 'guard-dog-rover',
    'A/AC-8 Autocannon Sentry': 'autocannon-sentry', 'A/ARC-3 Tesla Tower': 'tesla-tower',
    'A/G-16 Gatling Sentry': 'gatling-sentry', 'A/M-12 Mortar Sentry': 'mortar-sentry',
    'A/M-23 EMS Mortar Sentry': 'ems-mortar-sentry', 'A/MG-43 Machine Gun Sentry': 'machine-gun-sentry',
    'A/MLS-4X Rocket Sentry': 'rocket-sentry', 'E/MG-101 HMG Emplacement': 'hmg-emplacement',
    'E/GL-21 Grenadier Battlement': 'grenadier-battlement'
  };
  for (const [title, suffix] of Object.entries(designations)) {
    const id = `stratagem:${suffix}`, key = normalize(title);
    if (!catalog.items.some(item => item.id === id)) continue;
    if (!aliases.has(key)) aliases.set(key, new Set());
    aliases.get(key).add(id);
  }
  const required = ['Primary-Weapons', 'Secondary-Weapons', 'Throwables', 'Boosters', 'Support-Weapon-Stratagems', 'Backpack-Stratagems', 'Vehicle-Stratagems', 'Orbital-Stratagems', 'Eagle-Stratagems', 'Sentry-Stratagems', 'Emplacement-Stratagems', 'Warbonds'];
  for (const name of required) if (!inventory.categories.some(category => category.name === name)) issues.push({ kind: 'missing-inventory-category', name });
  for (const category of inventory.categories) {
    if (!category.completeResponse || !category.titles.length) issues.push({ kind: 'incomplete-inventory', name: category.name });
    for (const title of category.titles) {
      if (upcoming.has(title) && !released.has(title)) {
        deferred.push({ title, reason: 'Ironclad Democracy announced for 2026-09-22; requires release review, never automatic inclusion' });
        if (aliases.has(normalize(title))) issues.push({ kind: 'unreleased-in-catalog', title });
        continue;
      }
      if (excluded.has(title)) { ignored.push({ title, reason: excluded.get(title) }); continue; }
      if (category.name === 'Warbonds') {
        const key = normalize(title.replace(/ (Premium|Legendary)?\s*Warbond$/, ''));
        const matches = catalog.warbonds.filter(warbond => normalize(warbond.name) === key);
        if (matches.length !== 1) issues.push({ kind: 'warbond-record', title, matches: matches.map(warbond => warbond.id) });
        continue;
      }
      const matches = [...(aliases.get(normalize(title)) || [])];
      if (matches.length !== 1) issues.push({ kind: matches.length ? 'ambiguous-item' : 'missing-item', title, category: category.name, matches });
      else seen.add(matches[0]);
    }
  }
  // Supplement dated categories only with this explicit checked-in release
  // review, never today's clock. A matching alias alone cannot approve gear.
  for(const reviewed of released.values()) {
    const actual=catalog.items.find(item=>item.id===reviewed.id);
    if(!actual || actual.name!==reviewed.name || actual.type!==reviewed.type ||
      actual.acquisition?.id!==reviewed.acquisition.id || actual.acquisition?.kind!==reviewed.acquisition.kind) {
      issues.push({kind:'reviewed-release-mismatch',id:reviewed.id});continue;
    }
    seen.add(actual.id);
  }
  let hashed = 0, svg = 0, traced = 0;
  for (const item of catalog.items) {
    const row = byId.get(item.id);
    if (!row || row.assetPath !== item.assetPath) { issues.push({ kind: 'image-assignment', id: item.id }); continue; }
    let bytes;
    try { bytes = readAsset(item.assetPath); } catch { issues.push({ kind: 'missing-asset', id: item.id }); continue; }
    if (!row.artworkSha256) issues.push({ kind: 'unrecorded-artwork-hash', id: item.id });
    else if (crypto.createHash('sha256').update(bytes).digest('hex') !== row.artworkSha256) issues.push({ kind: 'artwork-hash-mismatch', id: item.id });
    else hashed++;
    if (item.assetPath.endsWith('.svg')) {
      svg++;
      const text = bytes.toString('utf8');
      if (/Traced by Dogo314/i.test(text)) traced++;
      if (/<script\b|<foreignObject\b|\bon\w+\s*=|(?:href|url)\s*[=(]\s*["']?https?:/i.test(text)) issues.push({ kind: 'svg-active-content-review', id: item.id });
    }
  }
  for (const row of rows) if (!catalog.items.some(item => item.id === row.id)) issues.push({ kind: 'orphan-image', id: row.id });
  for (const warbond of catalog.warbonds) {
    try { readAsset(warbond.coverAssetPath); } catch { issues.push({ kind: 'missing-cover', id: warbond.id }); }
    const actual = catalog.items.filter(item => item.acquisition?.id === warbond.id).map(item => item.id).sort();
    const declared = [...warbond.equipmentIds].sort();
    if (JSON.stringify(actual) !== JSON.stringify(declared)) issues.push({ kind: 'warbond-membership', id: warbond.id, actual, declared });
  }
  return { asOf: inventory.asOf, supplementalReviewAt: releaseReview?.reviewedAt || null, ready: issues.length === 0, scope: inventory.scope,
    counts: { catalogItems: catalog.items.length, matchedUniqueItems: seen.size, warbondRecords: catalog.warbonds.length, verifiedLocalHashes: hashed, svgItems: svg, embeddedCommunityTraceCredits: traced },
    issues, deferred, ignored,
    limitations: ['Dated category evidence is not proof of complete live-game availability.', 'Hash integrity is not visual authenticity or redistribution permission.', 'Community SVG traces are not certified original in-game files.'] };
}

if (require.main === module) {
  const report = audit({ catalog: require('../assets/item-catalog.json'), images: require('../assets/item-images.json'), inventory: require('../test/fixtures/catalog-inventory-2026-09-15.json') });
  console.log(JSON.stringify(report, null, 2));
  if (process.argv.includes('--strict') && !report.ready) process.exitCode = 1;
}
module.exports = { audit };
