const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { PNG } = require('pngjs');
const catalog = require('../scripts/catalog-history-fixture').projectBeforeIronclad(require('../assets/item-catalog.json'));
const baseline = require('./fixtures/hyena-revenants-baseline.json');
const art = require('../assets/catalog-additions/provenance.json');
const { projectBeforeHyenaRevenants } = require('../scripts/catalog-history-fixture');
const { mergeItems, isEligible, setOwned, setEnabled } = require('../assets/catalog-state');
const stable = x => Array.isArray(x) ? x.map(stable) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map(k => [k, stable(x[k])])) : x;
const hash = x => crypto.createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const defaults = c => Object.fromEntries(Object.entries({primaries:'primary',sidearms:'sidearm',throwables:'throwable',stratagems:'stratagem',boosters:'booster'}).map(([key,type]) => [key,c.items.filter(i=>i.type===type).map(i=>({...structuredClone(i),owned:i.defaultEnabled!==false,enabled:i.defaultEnabled!==false}))]));
const hyena = catalog.items.find(i=>i.id==='primary:r-4-hyena');
const bond = catalog.warbonds.find(b=>b.id==='warbond:righteous-revenants');

test('independent owner-reviewed package protects every prior item and Warbond unchanged', () => {
  assert.equal(baseline.asarSha256, '0f12765df1acd214a09d37f68fa99a325260113fd3f306a780493709bd35bb33');
  const prior = projectBeforeHyenaRevenants(catalog);
  assert.equal(catalog.items.length, 206); assert.equal(catalog.warbonds.length, 24);
  assert.equal(prior.items.length, 205); assert.equal(prior.warbonds.length, 23);
  assert.equal(hash(prior), baseline.hashes.catalog);
  assert.equal(hash(prior.items), baseline.hashes.items);
  assert.equal(hash(prior.warbonds), baseline.hashes.warbonds);
  const changed = structuredClone(catalog); changed.items.find(i=>i.id!=='primary:r-4-hyena').aliases.push('Unexpected');
  assert.notEqual(hash(projectBeforeHyenaRevenants(changed)), baseline.hashes.catalog);
});

test('Hyena is a primary marksman campaign reward, excluded in fresh and upgraded profiles', () => {
  assert.equal(hyena.type,'primary'); assert.equal(hyena.subgroup,'marksman-rifle'); assert.equal(hyena.defaultEnabled,false);
  assert.equal(hyena.acquisition.id,'campaign:celestial-fence'); assert.equal(hyena.acquisition.kind,'campaign-reward');
  assert.equal(hyena.acquisition.startsAt,'2026-06-30T00:00:00Z'); assert.equal(hyena.acquisition.endsAt,'2026-07-13T14:00:00Z');
  const old = defaults(projectBeforeHyenaRevenants(catalog));
  Object.values(old).flat().forEach((i,n)=>{i.owned=n%3!==0;i.enabled=i.owned&&n%2===0;i.privateNote='preserve';});
  const before=JSON.stringify(old), merged=mergeItems(defaults(catalog),old);
  assert.equal(JSON.stringify(old),before);
  for(const original of Object.values(old).flat()) assert.deepEqual(Object.values(merged).flat().find(i=>i.id===original.id),original);
  for(const state of [defaults(catalog),merged]) {
    const item=state.primaries.find(i=>i.id===hyena.id);
    assert.equal(item.owned,false);assert.equal(item.enabled,false);assert.equal(isEligible(item),false);
    assert.equal(setEnabled(item,true),false);setOwned(item,true);assert.equal(isEligible(item),false);setEnabled(item,true);assert.equal(isEligible(item),true);
  }
});

test('pre-existing custom/name-only Hyena choices migrate once and survive JSON roundtrip', () => {
  for(const name of ['Hyena','R-4 Hyena']) for(const [owned,enabled] of [[true,true],[true,false],[false,false]]) {
    const saved={primaries:[{id:'custom:primary:hyena',name,owned,enabled,privateNote:'keep'}]};
    const merged=mergeItems(defaults(catalog),saved), rows=merged.primaries.filter(i=>i.id===hyena.id);
    assert.equal(rows.length,1);assert.equal(rows[0].owned,owned);assert.equal(rows[0].enabled,enabled);assert.equal(rows[0].privateNote,'keep');
    assert.equal(merged.primaries.some(i=>i.id==='custom:primary:hyena'),false);
    assert.deepEqual(mergeItems(defaults(catalog),JSON.parse(JSON.stringify(merged))),merged);
  }
});

test('Righteous Revenants registers exactly its three existing primaries, without WASP or extra equipment', () => {
  assert.deepEqual(bond.equipmentIds.slice().sort(),['primary:plas-39-accelerator-rifle','primary:sta-11-smg','primary:sta-52-assault-rifle']);
  assert.equal(bond.releasedAt,'2025-12-18');assert.equal(bond.edition,'Legendary Warbond');
  for(const id of bond.equipmentIds) assert.equal(catalog.items.find(i=>i.id===id).acquisition.id,bond.id);
  assert.equal(catalog.items.find(i=>i.id==='stratagem:sta-x3-w-a-s-p-launcher').acquisition.kind,'requisition');
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.ok(html.includes('"Righteous Revenants": "assets/catalog-additions/righteous-revenants-cover.png"'));
});

test('new artwork decodes with recorded delivered hashes and original-metadata limitations retained', () => {
  assert.equal(art.assets.length,2);
  for(const a of art.assets) {
    const bytes=fs.readFileSync(path.join(__dirname,'..',a.assetPath));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.sha256);
    assert.equal(crypto.createHash('sha1').update(bytes).digest('hex'),a.deliveredSha1);
    assert.equal(bytes.length,a.bytes);
    const png=PNG.sync.read(bytes);assert.equal(png.width,a.width);assert.equal(png.height,a.height);
    assert.notEqual(a.deliveredSha1,a.mediaWikiOriginalSha1);assert.match(a.limitation,/differ/);
    assert.match(a.contributor,/Helldivers Wiki/);
  }
});
