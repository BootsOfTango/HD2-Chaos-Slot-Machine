const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const storage = require('../electron/storage');

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hd2-health-'));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir()));
    assert(path.basename(dir).startsWith('hd2-health-'));
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}
const data = id => ({ cards: [{ id }], items: {}, settings: {} });
const future = () => ({ ...storage.wrapData(data('future'), '99.0.0'), saveFormatVersion: 999 });

test('unrecoverable truncated save stays protected on subsequent loads until a valid backup is supplied', t => {
  const dir = fixture(t), file = path.join(dir, 'state.json');
  const raw = Buffer.from('{"saveFormatVersion":1,"data":');
  fs.writeFileSync(file, raw);
  for (let attempt = 0; attempt < 2; attempt++) {
    assert.throws(() => storage.loadStateFile(dir), /No valid native save/);
    assert.equal(fs.existsSync(file), false);
    const recovered = fs.readdirSync(path.join(dir, 'recovery'));
    assert.equal(recovered.length, 1);
    assert(fs.readFileSync(path.join(dir, 'recovery', recovered[0])).equals(raw));
  }
  const backup = path.join(dir, 'backups', 'state-restored-fixture.json');
  const backupRaw = JSON.stringify(storage.wrapData(data('restored')));
  fs.writeFileSync(backup, backupRaw);
  const loaded = storage.loadStateFile(dir);
  assert.equal(loaded.recovered, true);
  assert.equal(loaded.data.cards[0].id, 'restored');
  storage.saveStateFile(dir, loaded.data);
  assert.equal(storage.loadStateFile(dir).data.cards[0].id, 'restored');
  assert.equal(fs.readFileSync(backup, 'utf8'), backupRaw);
  const preserved = fs.readdirSync(path.join(dir, 'recovery'));
  assert.equal(preserved.length, 1);
  assert(fs.readFileSync(path.join(dir, 'recovery', preserved[0])).equals(raw));
});

test('newer-format working save is not quarantined, deleted, or silently downgraded', t => {
  const dir = fixture(t), file = path.join(dir, 'state.json');
  const raw = JSON.stringify(future()); fs.writeFileSync(file, raw);
  assert.throws(() => storage.loadStateFile(dir), /newer than this app supports/);
  assert.equal(fs.readFileSync(file, 'utf8'), raw);
  assert.throws(() => storage.saveStateFile(dir, data('defaults')), /newer than this app supports/);
  assert.equal(fs.readFileSync(file, 'utf8'), raw);
  assert.deepEqual(fs.readdirSync(path.join(dir, 'recovery')), []);
});

test('import refuses to replace a newer-format working save', t => {
  const dir = fixture(t), file = path.join(dir, 'state.json'), incoming = path.join(dir, 'import.json');
  const raw = JSON.stringify(future()); fs.writeFileSync(file, raw);
  fs.writeFileSync(incoming, JSON.stringify(storage.wrapData(data('old'))));
  assert.throws(() => storage.importStateFile(dir, incoming), /newer than this app supports/);
  assert.equal(fs.readFileSync(file, 'utf8'), raw);
});

test('a save read permission failure is not treated as corrupt JSON', t => {
  const dir = fixture(t), file = path.join(dir, 'state.json');
  storage.saveStateFile(dir, data('keep'));
  const original = fs.readFileSync, raw = original(file);
  t.mock.method(fs, 'readFileSync', function(target, ...args) {
    if (target === file) throw Object.assign(new Error('read denied'), { code: 'EACCES' });
    return original.call(fs, target, ...args);
  });
  assert.throws(() => storage.loadStateFile(dir), /read denied/);
  assert(fs.existsSync(file)); assert(original(file).equals(raw));
});

test('a newer-format backup blocks downgrade rather than falling back to an older backup', t => {
  const dir = fixture(t), backups = path.join(dir, 'backups'); fs.mkdirSync(backups);
  fs.writeFileSync(path.join(backups, 'state-future.json'), JSON.stringify(future()));
  assert.throws(() => storage.loadStateFile(dir), /newer than this app supports/);
  assert(fs.existsSync(path.join(backups, 'state-future.json')));
});

test('same-millisecond saves retain distinct recoverable previous snapshots', t => {
  const dir = fixture(t), RealDate = Date;
  t.mock.method(global, 'Date', class extends RealDate {
    constructor(...args) { super(...(args.length ? args : ['2026-09-15T12:00:00.000Z'])); }
    static now() { return 1789473600000; }
  });
  storage.saveStateFile(dir, data('one')); storage.saveStateFile(dir, data('two')); storage.saveStateFile(dir, data('three'));
  const names = fs.readdirSync(path.join(dir, 'backups'));
  assert.equal(names.length, 2);
  assert.deepEqual(names.map(name => storage.parseSave(fs.readFileSync(path.join(dir, 'backups', name), 'utf8')).cards[0].id).sort(), ['one', 'two']);
});

test('save flush failure preserves working bytes and cleans only its own temporary file', t => {
  const dir = fixture(t), file = path.join(dir, 'state.json'); storage.saveStateFile(dir, data('keep'));
  const raw = fs.readFileSync(file); const unrelated = path.join(dir, 'unrelated.tmp'); fs.writeFileSync(unrelated, 'retain');
  t.mock.method(fs, 'fsyncSync', () => { throw Object.assign(new Error('flush failed'), { code: 'EIO' }); });
  assert.throws(() => storage.saveStateFile(dir, data('replacement')), /flush failed/);
  assert(fs.readFileSync(file).equals(raw)); assert.equal(fs.readFileSync(unrelated, 'utf8'), 'retain');
  assert.deepEqual(fs.readdirSync(dir).filter(name => name.endsWith('.tmp')), ['unrelated.tmp']);
});

test('failed export flush cannot truncate an existing export', t => {
  const dir = fixture(t), file = path.join(dir, 'export.json'); fs.writeFileSync(file, 'existing export');
  t.mock.method(fs, 'fsyncSync', () => { throw new Error('flush failed'); });
  assert.throws(() => storage.exportStateFile(file, data('replacement')), /flush failed/);
  assert.equal(fs.readFileSync(file, 'utf8'), 'existing export');
});

test('rename failure retains the old save and does not leave a new temporary payload', t => {
  const dir = fixture(t), file = path.join(dir, 'state.json'); storage.saveStateFile(dir, data('keep'));
  const raw = fs.readFileSync(file);
  t.mock.method(fs, 'renameSync', () => { throw new Error('rename denied'); });
  assert.throws(() => storage.saveStateFile(dir, data('replacement')), /rename denied/);
  assert(fs.readFileSync(file).equals(raw));
  assert.deepEqual(fs.readdirSync(dir).filter(name => name.endsWith('.tmp')), []);
});
