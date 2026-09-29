const fs = require('node:fs');
const path = require('node:path');
const pngToIco = require('png-to-ico');

const root = path.join(__dirname, '..');
const art = require('./brand-art');
const source = path.join(root, 'assets', 'branding', 'hd2-chaos-slot-machine.svg');
const outDir = path.join(root, 'build');
const pngOut = path.join(outDir, 'icon.png');
const icoOut = path.join(outDir, 'icon.ico');

fs.mkdirSync(outDir, { recursive: true });

// SVG and Windows PNG share exact original geometry. Old art remains recoverable.
fs.writeFileSync(source, art.svg());
fs.writeFileSync(pngOut, art.png());

pngToIco(pngOut).then((buffer) => {
  fs.writeFileSync(icoOut, buffer);
  console.log(`Created ${path.relative(root, pngOut)} and ${path.relative(root, icoOut)}`);
}).catch((err) => {
  console.error('Icon generation failed:', err.message);
  process.exitCode = 1;
});
