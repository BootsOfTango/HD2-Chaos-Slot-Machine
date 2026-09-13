const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const mapping = require('../assets/item-images.json');

for (const category of ['primary', 'sidearm', 'throwable', 'booster']) {
  test(`${category}: every catalog image is bundled source artwork, not a placeholder`, () => {
    assert.ok(mapping[category].length > 0);
    for (const entry of mapping[category]) {
      assert.match(entry.assetPath, /-wiki\.(png|jpg|webp|gif|svg)$/, entry.name);
      assert.ok(!entry.assetPath.includes('placeholders'), entry.name);
      assert.equal(new URL(entry.imageUrl).hostname, 'helldivers.wiki.gg');
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
