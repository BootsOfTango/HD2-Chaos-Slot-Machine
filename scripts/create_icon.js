const fs = require('node:fs');
const path = require('node:path');
const pngToIco = require('png-to-ico');

const root = path.join(__dirname, '..');
const source = path.join(root, 'assets', 'branding', 'hd2csm-emblem.png');
const outDir = path.join(root, 'build');
const pngOut = path.join(outDir, 'icon.png');
const icoOut = path.join(outDir, 'icon.ico');

fs.mkdirSync(outDir, { recursive: true });

// The source is already square with transparent margins. Preserve its full
// silhouette; png-to-ico produces 16, 32, 48 and 256px Windows representations.
fs.copyFileSync(source, pngOut);

pngToIco(pngOut).then((buffer) => {
  fs.writeFileSync(icoOut, buffer);
  console.log(`Created ${path.relative(root, pngOut)} and ${path.relative(root, icoOut)}`);
}).catch((err) => {
  console.error('Icon generation failed:', err.message);
  process.exitCode = 1;
});
