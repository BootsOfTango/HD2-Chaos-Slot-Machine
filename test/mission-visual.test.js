'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const sandbox = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/mission-ui.js'), 'utf8'), sandbox);
const { visualFor } = sandbox.HD2MissionUI;
const catalog = require('../assets/mission-catalog.json');

test('every reviewed mission has a bundled type icon and a compact label', () => {
  for (const row of catalog.missions) {
    const before = JSON.stringify(row), visual = visualFor(row);
    assert.match(visual.src, /^assets\/missions\/(?:[a-z-]+\.svg|game-icons\/[a-z0-9-]+\.png)$/);
    assert.notEqual(visual.src, 'assets/missions/custom.svg', row.id);
    assert.ok(visual.label.length <= 32, row.id);
    assert.ok(fs.existsSync(path.join(root, visual.src)));
    assert.equal(JSON.stringify(row), before, 'presentation must not mutate catalog facts');
  }
});

test('custom, removed and hostile IDs cannot inject an image path or borrow a catalog identity', () => {
  for (const id of ['custom:mine', 'mission:unknown', '__proto__', 'constructor', '../../remote.svg']) {
    const row = { id, name: '<img src=x onerror=alert(1)>' }, visual = visualFor(row);
    assert.equal(visual.src, 'assets/missions/custom.svg');
    assert.equal(visual.label, row.name, 'name stays plain text for textContent rendering');
  }
  assert.equal(visualFor(null).label, 'Choose a mission');
});

test('Commando advice is limited to reviewed identities, not names or custom lookalikes', () => {
  for (const id of ['mission:commando-acquire-evidence','mission:commando-extract-intel','mission:commando-secure-black-box'])
    assert.match(sandbox.HD2MissionUI.adviceFor({id}), /check gear & stratagem limits/);
  for (const id of ['custom:commando','mission:commando-made-up','__proto__','mission:confiscate-assets'])
    assert.equal(sandbox.HD2MissionUI.adviceFor({id,name:'Commando: Acquire Evidence'}), '');
  assert.equal(sandbox.HD2MissionUI.adviceFor(null), '');
});

test('mission SVGs are self-contained vectors, with no scripts, external references or embedded artwork', () => {
  const files = fs.readdirSync(path.join(root, 'assets/missions')).filter(file => file.endsWith('.svg'));
  assert.equal(files.length, 24);
  for (const file of files) {
    const svg = fs.readFileSync(path.join(root, 'assets/missions', file), 'utf8');
    assert.match(svg, /viewBox="0 0 64 64"/);
    assert.match(svg, /data-design="tactical-line-v3"/, file + ' must use the refined line symbol');
    assert.match(svg, /fill="none" stroke="#ffdb4d" stroke-width="2"/);
    assert.match(svg, /stroke-linecap="round" stroke-linejoin="round"/);
    assert.match(svg, /<title>[^<]+original mission symbol<\/title>/);
    assert.doesNotMatch(svg, /<(?:script|image|foreignObject)|\bon\w+=|href=|url\(|data:/i);
    assert.match(svg, /#ffdb4d/);
  }
});
