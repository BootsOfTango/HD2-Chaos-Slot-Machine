const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const storage = require('../electron/storage');
const transfer = require('../assets/transfer-validation');
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hd2-transfer-'));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir()));
    assert(path.basename(dir).startsWith('hd2-transfer-'));
    fs.rmSync(dir, { recursive: true });
  });
  storage.saveStateFile(dir, { cards: [{ id: 'original' }], items: {}, settings: {} });
  return { dir, file: path.join(dir, 'incoming.json'), before: fs.readFileSync(path.join(dir, 'state.json')) };
}
test('a supported export larger than the former 5 MiB limit imports losslessly', t => {
  const { dir, file } = fixture(t);
  const data = { cards: [{ id: 'large', notes: 'a'.repeat(6 * 1024 * 1024) }], items: {}, settings: {} };
  storage.exportStateFile(file, data);
  assert.deepEqual(storage.importStateFile(dir, file).data, data);
  assert.deepEqual(storage.loadStateFile(dir).data, data);
});
for (const [label, data] of [
  ['nameless equipment', { items: { primaries: [{}] } }],
  ['wrong card stats shape', { cards: [{ id: 'bad', stats: [] }] }],
  ['duplicate card identities', { cards: [{ id: 'same' }, { id: 'same' }] }],
  ['prototype key', JSON.parse('{"items":{"__proto__":[{"name":"bad"}]},"cards":[]}')],
  ['broken envelope cannot masquerade as legacy', { saveFormatVersion: 1, data: null, cards: [] }],
  ['nonboolean ownership', { items: { primaries: [{ name: 'Custom', owned: 'false' }] } }]
]) test(`${label} is rejected before working-save or backup mutation`, t => {
  const { dir, file, before } = fixture(t);
  const backups = fs.readdirSync(path.join(dir, 'backups'));
  fs.writeFileSync(file, JSON.stringify(data));
  assert.throws(() => storage.importStateFile(dir, file));
  assert(fs.readFileSync(path.join(dir, 'state.json')).equals(before));
  assert.deepEqual(fs.readdirSync(path.join(dir, 'backups')), backups);
});
test('oversize export preserves an existing target instead of creating an unimportable backup', t => {
  const { file } = fixture(t);
  fs.writeFileSync(file, 'original export');
  assert.throws(() => storage.exportStateFile(file, { cards: [{ notes: 'x'.repeat(transfer.MAX_BYTES) }] }), /too large/);
  assert.equal(fs.readFileSync(file, 'utf8'), 'original export');
});
test('browser and desktop transfer rules count UTF-8 bytes, not characters', () => {
  assert.throws(() => transfer.checkSize('🌐'.repeat(transfer.MAX_BYTES / 4 + 1)), /too large/);
  const data = { cards: [{ id: 3, notes: '日本語 🌐' }], items: {}, settings: {} };
  assert.deepEqual(transfer.parse(transfer.serialize(data)), data);
  assert.deepEqual(transfer.parse(transfer.serialize(data, storage.wrapData(data))), data);
});
test('depth, field-count, circular and prototype inputs fail with clear errors', () => {
  assert.throws(() => transfer.parse('{"cards":[],"settings":' + '['.repeat(60) + '0' + ']'.repeat(60) + '}'), /deeply/);
  assert.throws(() => transfer.validateData({ cards: [], settings: { extra: Array(transfer.MAX_NODES).fill(0) } }), /too many/);
  const circular = { cards: [] }; circular.loop = circular;
  assert.throws(() => transfer.validateData(circular), /references/);
  assert.throws(() => transfer.parse('{"cards":[],"settings":{"constructor":{}}}'), /Unsupported JSON key/);
  assert.deepEqual(transfer.parse('{"cards":[],"settings":{"note":"[[[\\\"quoted\\\"]]]"}}').cards, []);
});
test('legacy name/ID-only gear, locked stats and recovery records remain lossless', () => {
  const data = { items: { primaries: [{ id: 'primary:ar-23-liberator', enabled: false, owned: true, legacyAliasRecords: [{ name: 'Legacy' }] }] }, cards: [{ id: 'legacy', stratagems: 'Old Stratagem', planet: 'Old Planet', stats: {}, lockedStatsSnapshot: null }], settings: {} };
  assert.deepEqual(transfer.parse(transfer.serialize(data)), data);
});

test('read-only import preparation leaves disk and backups untouched', t => {
  const { dir, file, before } = fixture(t);
  fs.writeFileSync(file, '{"cards":[],"items":{}}');
  assert.deepEqual(storage.readImportFile(file).data, { cards: [], items: {} });
  assert(fs.readFileSync(path.join(dir, 'state.json')).equals(before));
  assert.deepEqual(fs.readdirSync(path.join(dir, 'backups')), []);
});
test('failed import replacement keeps the previous save and recovery backup', t => {
  const { dir, before } = fixture(t);
  const originalRename = fs.renameSync;
  t.mock.method(fs, 'renameSync', (source, target) => {
    if (target === path.join(dir, 'state.json')) throw new Error('Injected import replacement failure');
    return originalRename(source, target);
  });
  assert.throws(() => storage.commitImportData(dir, { cards: [{ id: 'new' }] }), /Injected/);
  assert(fs.readFileSync(path.join(dir, 'state.json')).equals(before));
  assert(fs.readdirSync(path.join(dir, 'backups')).some(file => fs.readFileSync(path.join(dir, 'backups', file)).equals(before)));
});
test('valid shared references serialize as ordinary independent JSON values', () => {
  const stats = { kills: 1 };
  const data = { cards: [{ id: 'one', stats, lockedStatsSnapshot: stats }] };
  assert.deepEqual(transfer.parse(transfer.serialize(data)), data);
});
