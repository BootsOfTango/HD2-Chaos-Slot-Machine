const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const mapping = require('../assets/item-images.json');
const newArt = [...require('../assets/new-gear/provenance.json').assets, ...require('../assets/catalog-additions/provenance.json').assets, ...require('../assets/catalog-additions/ironclad/provenance.json').assets];

test('Git preserves all SVG artwork bytes, including nested originals and the generated brand mark', () => {
  const attributes = fs.readFileSync(path.join(root, '.gitattributes'), 'utf8');
  assert.match(attributes, /^assets\/\*\*\/\*\.svg\s+-text\s*$/m);
});

test('Meltagun remains a support stratagem and uses the credited cyan icon, not its weapon render',()=>{
  const entry=mapping.stratagem.find(e=>e.id==='stratagem:40-k-meltagun');
  const item=require('../assets/item-catalog.json').items.find(e=>e.id===entry.id);
  assert.equal(item.type,'stratagem');assert.equal(item.subgroup,'support');
  assert.equal(entry.kind,'icon');assert.equal(entry.rimCategory,'support');
  assert.equal(item.assetPath,entry.assetPath);
  assert.equal(entry.assetPath,'assets/new-gear/40-k-meltagun-stratagem.svg');
  const bytes=fs.readFileSync(path.join(root,entry.assetPath));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.artworkSha256);
  assert.doesNotMatch(bytes.toString(),/<!DOCTYPE|<script|<foreignObject|\bon\w+=|(?:href|src)=/i);
  assert.match(bytes.toString(),/#55B9D2/);
  assert.ok(newArt.some(a=>a.assetPath===entry.assetPath&&a.contributor.includes('Torakhan')));
  assert.ok(fs.existsSync(path.join(root,'assets/new-gear/40-k-meltagun.png')));
});

test('historical artwork projection accepts only the reviewed replacement, not arbitrary changes',()=>{
  const {projectBeforeIronclad}=require('../scripts/catalog-history-fixture');
  const catalog=structuredClone(require('../assets/item-catalog.json'));
  const id='stratagem:40-k-meltagun';
  assert.equal(projectBeforeIronclad(catalog).items.find(i=>i.id===id).assetPath,'assets/new-gear/40-k-meltagun.png');
  catalog.items.find(i=>i.id===id).assetPath='assets/unexpected.svg';
  assert.equal(projectBeforeIronclad(catalog).items.find(i=>i.id===id).assetPath,'assets/unexpected.svg');
});

for (const category of ['primary', 'sidearm', 'throwable', 'booster']) {
  test(`${category}: every catalog image is bundled attributed artwork or an identified original symbol`, () => {
    assert.ok(mapping[category].length > 0);
    for (const entry of mapping[category]) {
      const verified = newArt.find(asset => asset.assetPath === entry.assetPath && asset.name === entry.name);
      if (verified) assert.equal(entry.artworkSha256, verified.sha256, entry.name);
      else assert.match(entry.assetPath, /-wiki\.(png|jpg|webp|gif|svg)$/, entry.name);
      assert.ok(!entry.assetPath.includes('placeholders'), entry.name);
      if(verified?.sourceKind==='original-symbolic-vector') {
        assert.equal(entry.imageUrl,'');assert.match(entry.artworkSource,/original-symbolic-vector/);
      }else if(verified) {
        assert.equal(entry.imageUrl,verified.imageUrl);assert.equal(new URL(entry.imageUrl).protocol,'https:');
        assert.equal(entry.sourceUrl,verified.filePage);
      }else assert.equal(new URL(entry.imageUrl).hostname, 'helldivers.wiki.gg');
      assert.ok(entry.sourceUrl && entry.artworkSource, entry.name);
      const bytes = fs.readFileSync(path.join(root, entry.assetPath));
      assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), entry.artworkSha256, entry.name);
      if (entry.assetPath.endsWith('.svg')) {
        assert.match(bytes.toString(), /<svg\b/);
        assert.doesNotMatch(bytes.toString(), /LOCAL PLACEHOLDER|<script|<foreignObject/i);
      } else {
        assert.ok(bytes.length > 1000, `${entry.name}: suspiciously small image`);
      }
    }
  });
}
