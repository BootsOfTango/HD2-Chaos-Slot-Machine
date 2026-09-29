'use strict';
// Offline, exact pixel crops only. Original screenshots are retained outside the app.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { PNG } = require('pngjs');
const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'assets/missions/game-icons/provenance.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const originals = path.join(root, '.test-data/mission-game-icon-sources/originals');
const sheet = new PNG({ width: 6 * 130, height: Math.ceil(manifest.entries.length / 6) * 130 }); sheet.data.fill(32);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
manifest.entries.forEach((entry, i) => {
  const bytes = fs.readFileSync(path.join(originals, entry.sourceFile));
  if (entry.sourceSha256 && sha(bytes) !== entry.sourceSha256) throw new Error('Source changed: ' + entry.id);
  const source = PNG.sync.read(bytes), [x,y,width,height] = entry.crop;
  if (![x,y,width,height].every(Number.isInteger) || x < 0 || y < 0 || width < 1 || height < 1 || x+width > source.width || y+height > source.height) throw new Error('Invalid crop: ' + entry.id);
  const crop = new PNG({width,height}); PNG.bitblt(source,crop,x,y,width,height,0,0);
  const output = PNG.sync.write(crop);
  fs.writeFileSync(path.join(path.dirname(manifestPath), entry.file), output);
  Object.assign(entry, { sourceSha256:sha(bytes), outputSha256:sha(output), sourceWidth:source.width, sourceHeight:source.height });
  PNG.bitblt(crop,sheet,0,0,width,height,(i%6)*130+10,Math.floor(i/6)*130+10);
});
fs.writeFileSync(manifestPath, JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(root,'.test-data/mission-game-icon-sources/crops.png'),PNG.sync.write(sheet));
console.log('Prepared '+manifest.entries.length+' exact mission screenshot crops.');
