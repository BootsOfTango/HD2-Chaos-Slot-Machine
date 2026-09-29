const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { wrapData, parseSave, parseImport } = require('../electron/storage');
const {
  PRODUCT_NAME, PROFILE_DIRECTORY, APP_ID, LEGACY_PROFILE_NAMES, MIGRATION_MARKER,
  MIGRATION_ARCHIVE, resolveProfile, migrateLegacyProfile
} = require('../electron/identity');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hd2csm-migration-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const appDataPath = path.join(root, 'app-data');
  const destination = path.join(appDataPath, PROFILE_DIRECTORY);
  return { root, appDataPath, destination };
}

function write(file, raw) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, raw, 'utf8');
  return raw;
}

function save(file, id = 'legacy-card') {
  return write(file, JSON.stringify(wrapData({
    cards: [{ id, statsLocked: true }],
    items: { primaries: [{ name: 'AR-23 Liberator', enabled: false }] },
    settings: { rememberedPlayerName: 'Migration Diver' }
  }, '1.0.0'), null, 2));
}

function legacyFile(f, name = LEGACY_PROFILE_NAMES[0], relative = 'state.json') {
  return path.join(f.appDataPath, name, relative);
}

test('identity uses the requested product and an explicit isolated absolute profile', t => {
  const f = fixture(t);
  assert.equal(PRODUCT_NAME, 'HD2 Chaos Slot Machine');
  assert.equal(PROFILE_DIRECTORY, 'Helldivers 2 Chaos Slot Machine');
  assert.equal(APP_ID, 'com.bootsoftango.helldivers2chaosslotmachine');
  assert.deepEqual(resolveProfile(f.appDataPath, {}), { directory: f.destination, isolated: false });
  const isolated = path.join(f.root, 'test-only');
  assert.deepEqual(resolveProfile(f.appDataPath, { HD2CSM_USER_DATA_DIR: isolated }), { directory: isolated, isolated: true });
  assert.throws(() => resolveProfile(f.appDataPath, { HD2CSM_USER_DATA_DIR: 'relative-profile' }), /absolute directory/);
  assert.throws(() => resolveProfile(f.appDataPath, { HD2CSM_USER_DATA_DIR: ' ' }), /absolute directory/);
});

test('first launch copies valid legacy state and archives backups without modifying originals', t => {
  const f = fixture(t);
  const source = legacyFile(f);
  const sourceRaw = save(source);
  const backup = legacyFile(f, LEGACY_PROFILE_NAMES[0], 'backups/state-before-import-2026.json');
  const backupRaw = save(backup, 'backup-card');
  const damaged = legacyFile(f, LEGACY_PROFILE_NAMES[0], 'recovery/state-damaged-2026.json');
  const damagedRaw = write(damaged, '{ invalid original');
  const sourceMtime = fs.statSync(source).mtimeMs;
  const result = migrateLegacyProfile(f);
  assert.equal(result.migrated, true);
  assert.equal(result.fromBackup, false);
  assert.equal(fs.readFileSync(path.join(f.destination, 'state.json'), 'utf8'), sourceRaw);
  assert.equal(fs.readFileSync(source, 'utf8'), sourceRaw);
  assert.equal(fs.statSync(source).mtimeMs, sourceMtime);
  assert.equal(fs.readFileSync(backup, 'utf8'), backupRaw);
  assert.equal(fs.readFileSync(damaged, 'utf8'), damagedRaw);
  const archive = path.join(f.destination, MIGRATION_ARCHIVE, LEGACY_PROFILE_NAMES[0]);
  assert.equal(fs.readFileSync(path.join(archive, 'backups', path.basename(backup)), 'utf8'), backupRaw);
  assert.equal(fs.readFileSync(path.join(archive, 'recovery', path.basename(damaged)), 'utf8'), damagedRaw);
  assert.equal(parseSave(sourceRaw).items.primaries[0].enabled, false);
  assert.ok(fs.existsSync(path.join(f.destination, MIGRATION_MARKER)));
});

test('damaged legacy state and newest backup are left intact while an older valid backup is recovered', t => {
  const f = fixture(t);
  const source = legacyFile(f);
  const damagedRaw = write(source, '{ damaged');
  const good = legacyFile(f, LEGACY_PROFILE_NAMES[0], 'backups/state-older.json');
  const goodRaw = save(good, 'recovered');
  const bad = legacyFile(f, LEGACY_PROFILE_NAMES[0], 'backups/state-newer.json');
  write(bad, '{ damaged backup');
  fs.utimesSync(good, new Date('2026-01-01'), new Date('2026-01-01'));
  fs.utimesSync(bad, new Date('2026-02-01'), new Date('2026-02-01'));
  const result = migrateLegacyProfile(f);
  assert.equal(result.migrated, true);
  assert.equal(result.fromBackup, true);
  assert.equal(result.source, good);
  assert.equal(fs.readFileSync(path.join(f.destination, 'state.json'), 'utf8'), goodRaw);
  assert.equal(fs.readFileSync(source, 'utf8'), damagedRaw);
  assert.equal(fs.readFileSync(bad, 'utf8'), '{ damaged backup');
});

test('legacy package-name profile is recovered when product-name profile has no usable data', t => {
  const f = fixture(t);
  write(legacyFile(f), '{ damaged');
  const source = legacyFile(f, LEGACY_PROFILE_NAMES[1]);
  save(source, 'package-profile');
  const result = migrateLegacyProfile(f);
  assert.equal(result.source, source);
  assert.equal(parseSave(fs.readFileSync(path.join(f.destination, 'state.json'), 'utf8')).cards[0].id, 'package-profile');
});

test('an existing new save is never overwritten, even if it is damaged', t => {
  for (const contents of ['{ existing damaged state', JSON.stringify(wrapData({ cards: [{ id: 'new-profile' }] }))]) {
    const f = fixture(t);
    save(legacyFile(f));
    write(path.join(f.destination, 'state.json'), contents);
    const result = migrateLegacyProfile(f);
    assert.equal(result.reason, 'existing-profile');
    assert.equal(fs.readFileSync(path.join(f.destination, 'state.json'), 'utf8'), contents);
  }
});

test('new-profile backups take precedence over migration when its current file is missing', t => {
  const f = fixture(t);
  save(legacyFile(f));
  const backup = path.join(f.destination, 'backups', 'state-new-profile.json');
  const raw = save(backup, 'new-profile-backup');
  assert.equal(migrateLegacyProfile(f).reason, 'existing-profile');
  assert.equal(fs.existsSync(path.join(f.destination, 'state.json')), false);
  assert.equal(fs.readFileSync(backup, 'utf8'), raw);
});

test('a missing or unsupported legacy profile leaves a first launch empty and is checked only once', t => {
  for (const invalid of [null, '{ damaged', JSON.stringify({ ...wrapData({ cards: [] }), saveFormatVersion: 99 }), JSON.stringify(wrapData({}))]) {
    const f = fixture(t);
    if (invalid !== null) write(legacyFile(f), invalid);
    assert.equal(migrateLegacyProfile(f).reason, 'no-valid-legacy-save');
    assert.equal(fs.existsSync(path.join(f.destination, 'state.json')), false);
    save(legacyFile(f), 'arrived-after-first-launch');
    assert.equal(migrateLegacyProfile(f).reason, 'already-checked');
    assert.equal(fs.existsSync(path.join(f.destination, 'state.json')), false);
  }
});

test('completed migration never restores legacy data over a subsequently cleared new profile', t => {
  const f = fixture(t);
  save(legacyFile(f));
  assert.equal(migrateLegacyProfile(f).migrated, true);
  const newFile = path.join(f.destination, 'state.json');
  write(newFile, JSON.stringify(wrapData({ cards: [], items: {}, settings: {} })));
  assert.equal(migrateLegacyProfile(f).reason, 'already-checked');
  assert.deepEqual(parseSave(fs.readFileSync(newFile, 'utf8')).cards, []);
});

test('prior Roulette browser and desktop exports remain import compatible', () => {
  const data = { cards: [{ id: 'roulette-export' }], items: {}, settings: { rememberedPlayerName: 'Diver' } };
  assert.deepEqual(parseImport(JSON.stringify(data)), data);
  assert.deepEqual(parseImport(JSON.stringify(wrapData(data, '1.0.0'))), data);
});

test('preload exposes the new bridge and legacy compatibility alias with opt-in automation', () => {
  for (const enabled of [false, true]) {
    const exposed = new Map();
    const invocations = [];
    const electron = {
      contextBridge: { exposeInMainWorld: (name, value) => exposed.set(name, value) },
      ipcRenderer: { invoke: (...args) => { invocations.push(args); return Promise.resolve(); } }
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'electron', 'preload.js'), 'utf8'), {
      require: name => { assert.equal(name, 'electron'); return electron; },
      process: { argv: enabled ? ['--hd2csm-test-harness'] : [] }
    });
    const api = exposed.get('chaosSlotMachine');
    assert.equal(api, exposed.get('chaosRoulette'));
    assert.equal(api.isTestHarness, enabled);
    assert.ok(Object.isFrozen(api));
    api.loadState();
    api.saveState({ cards: [] });
    assert.equal(invocations[0][0], 'storage:load');
    assert.equal(invocations[1][0], 'storage:save');
  }
});
