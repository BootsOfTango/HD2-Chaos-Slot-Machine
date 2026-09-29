const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const start = html.indexOf('        function findCardFields(');
const end = html.indexOf('        function syncCardFromResultInputs(', start);
const find = vm.runInNewContext(`(${html.slice(start, end).trim()})`);
test('card fields match exact IDs and keys without interpolating selectors', () => {
  for (const id of ['ordinary', 'quote" bracket]', 'x"], [data-id="other', 'back\\slash', 'quote\' & < >', '日本語']) {
    const field = (owner, key) => ({ getAttribute: attr => attr === 'data-id' ? owner : key });
    const wanted = field(id, 'kills'), comment = field(id, 'newCommentText'), other = field('other', 'kills');
    const root = { querySelectorAll(selector) { assert.equal(selector, '[data-id][data-k]'); return [other, wanted, comment]; } };
    assert.deepEqual(Array.from(find(root, id)), [wanted, comment]);
    assert.deepEqual(Array.from(find(root, id, 'kills')), [wanted]);
    assert.deepEqual(Array.from(find(root, id, 'absent')), []);
  }
});
test('all Results ID lookups use data equality instead of CSS interpolation', () => {
  assert.doesNotMatch(html, /querySelector(?:All)?\(`\[data-id=/);
  assert.match(html, /findCardFields\(scope, cardId\)/);
  assert.match(html, /findCardFields\(sourceRoot, id, "newCommentText"\)/);
  assert.match(html, /findCardFields\(sourceRoot, id, k\)/);
});
