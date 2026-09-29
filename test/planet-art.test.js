'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const art = require('../assets/planet-art');
const { resolveRequest } = require('../electron/local-protocol');
const root = path.join(__dirname, '..');

test('every bundled biome label resolves to a local illustration without changing planet data', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const biomes = new Set([...html.matchAll(/biome: "([^"]+)"/g)].map(m => m[1]));
  assert.ok(biomes.size >= 27);
  for (const biome of biomes) {
    const planet = Object.freeze({ name: 'Test', biome, faction: 'Automatons', enabled: false });
    const visual = art.visualFor(planet);
    assert.notEqual(visual.family, 'unknown', biome);
    assert.ok(art.paths.includes(visual.src));
    assert.match(visual.description, /illustrative globe, not an in-game image/);
    assert.equal(planet.enabled, false);
  }
});

test('biome normalization is exact, conservative and not based on faction, planet name or weather', () => {
  assert.equal(art.visualFor({biome: '  icy   GLACIERS  '}).family, 'ice');
  assert.equal(art.visualFor({biome: {name:'Moon'}}).family, 'moon');
  for (const biome of [null, 22, {}, ['Moon'], {name: {}}, 'New biome', '__proto__', 'constructor', 'not a Moon', '../../private.svg', 'https://evil.test/a.png', '<img src=x>']) {
    assert.equal(art.visualFor({name:'Super Earth', biome, weather:'Magma', image:'https://evil.test', faction:'Terminids'}).family, 'unknown');
  }
  assert.equal(art.visualFor(null).family, 'unknown');
});

test('all thirteen globe assets are small, self-contained local vectors allowed by the protocol', () => {
  assert.equal(art.paths.length, 13);
  assert.equal(new Set(art.paths).size, 13);
  for (const file of art.paths) {
    const svg = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(svg, /viewBox="0 0 240 240"/);
    assert.ok(Buffer.byteLength(svg) < 6000);
    assert.doesNotMatch(svg, /<(?:script|image|foreignObject|filter|animate)|\bon\w+=|href=|data:|url\((?!#)/i);
    assert.equal(resolveRequest('hd2-slot://app/' + file).status, 200);
  }
});

test('planet images have project provenance and a separate artwork audit group', () => {
  const { assetGroup } = require('../scripts/audit-distribution');
  assert.equal(assetGroup(art.paths[0]), 'project-planet-illustrations-origin-review');
  assert.match(fs.readFileSync(path.join(root, 'assets/planets/ORIGIN.md'), 'utf8'), /not official/);
});
