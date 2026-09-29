'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
const start = html.indexOf('        function getMissionDisplayName(');
const end = html.indexOf('        function getCardById(', start);
const { getMissionDisplayName: name, getMissionMarkdownName: markdown, missionCanvasLines: lines } = vm.runInNewContext(
  html.slice(start, end) + '; ({getMissionDisplayName, getMissionMarkdownName, missionCanvasLines})');

test('display uses the stored historical name and leaves legacy score category unchanged', () => {
  const card = { mode: 'Blitz (12)', missionSelection: { name: 'Historical event', minutes: 40 } };
  const before = JSON.stringify(card);
  assert.equal(name(card), 'Historical event');
  assert.equal(JSON.stringify(card), before);
});
test('legacy cards and absent optional metadata retain a useful fallback', () => {
  for (const missionSelection of [undefined, null, { name: '' }, { name: ' ' }, { name: 7 }]) {
    assert.equal(name({ mode: 'Normal (40)', missionSelection }), 'Normal (40)');
  }
  assert.equal(name(null), 'Unknown mission');
});
test('Discord mission text escapes markup and neutralizes mentions', () => {
  const value = markdown({ missionSelection: { name: '<@123> @everyone **bold** [link](https://example.invalid) `code` \\name' } });
  assert.ok(value.includes('\\<@\u200b123\\>'));
  assert.ok(value.includes('@\u200beveryone'));
  assert.ok(value.includes('\\*\\*bold\\*\\*'));
  assert.ok(value.includes('\\[link\\]\\('));
  assert.ok(value.includes('\\`code\\`'));
  assert.ok(value.includes('\\\\name'));
});
test('canvas wrapping keeps every character and breaks unspaced custom names', () => {
  const ctx = { measureText: text => ({ width: [...text].length * 24 }) };
  for (const text of ['W'.repeat(160), '🌌'.repeat(80), '<img src=x> test operation']) {
    const wrapped = Array.from(lines(ctx, { missionSelection: { name: text } }, 1088));
    assert.equal(wrapped.join(''), 'Mission: ' + text);
    assert.ok(wrapped.every(line => ctx.measureText(line).width <= 1088));
    assert.ok(836 + (wrapped.length - 1) * 32 < 1020);
    assert.ok(wrapped.every(line => !/[\ud800-\udbff]$/.test(line)), 'no split surrogate pair');
  }
});
