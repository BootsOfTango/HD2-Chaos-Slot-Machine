const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const state = require('../assets/mission-state');
const selection = require('../assets/mission-selection');
const transfer = require('../assets/transfer-validation');
const storage = require('../electron/storage');
const engine = selection.createEngine(require('../assets/mission-catalog.json'));
const context = { planetKey: 'id:7', faction: 'Automatons', difficulty: 7, campaign: 'liberation', active: true };
const confirmation = engine.confirm(context, [{ kind: 'catalog', id: 'mission:launch-icbm' }]);
const record = state.capture(engine.select(context, 'mission:launch-icbm'), context, engine.getCatalog().revision);
const data = () => ({ items: {}, cards: [{ id: 'history', mode: 'Normal (40)', score: 123, missionSelection: structuredClone(record) }], settings: { missionPlanner: { version: 1, confirmation: structuredClone(confirmation) } } });
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hd2-mission-state-'));
  t.after(() => { assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir())); assert(path.basename(dir).startsWith('hd2-mission-state-')); fs.rmSync(dir, { recursive: true }); });
  return dir;
}
test('legacy files gain no invented mission identity and defaults do not mutate input', () => {
  const old = { cards: [{ id: 'old', mode: 'Blitz (12)', score: 73 }], settings: {} };
  assert.deepEqual(transfer.parse(transfer.serialize(old)), old);
  assert.deepEqual(storage.parseSave(JSON.stringify(storage.wrapData(old))), old);
  assert.deepEqual(state.normalize(undefined), state.defaults());
  assert.equal(Object.hasOwn(old.cards[0], 'missionSelection'), false);
});
test('shortlist and historical identity round trip through browser and desktop exports unchanged', () => {
  const input = data();
  for (const raw of [transfer.serialize(input), JSON.stringify(storage.wrapData(input))]) {
    assert.deepEqual(transfer.parse(raw), input); assert.deepEqual(storage.parseImport(raw), input);
  }
});
test('native save/reload/export/import preserves mission metadata and scores', t => {
  const dir = fixture(t), input = data(), output = path.join(dir, 'export.json');
  storage.saveStateFile(dir, input); assert.deepEqual(storage.loadStateFile(dir).data, input);
  storage.exportStateFile(output, input); storage.importStateFile(dir, output);
  assert.deepEqual(storage.loadStateFile(dir).data, input);
});
test('normalization copies preferences and reset defaults clear an old shortlist', () => {
  const input = data().settings.missionPlanner, output = state.normalize(input);
  output.confirmation.missions.length = 0; assert.equal(input.confirmation.missions.length, 1);
  assert.deepEqual(state.defaults(), { version: 1, confirmation: null });
  assert.equal(state.read(undefined).status, 'missing');
});
test('empty confirmation remains different from no confirmed operation after serialization', () => {
  const input = data(); input.settings.missionPlanner.confirmation = engine.confirm(context, []);
  const recovered = transfer.parse(transfer.serialize(input));
  assert.equal(engine.getPool(context, recovered.settings.missionPlanner.confirmation).status, 'empty-confirmed');
});
test('old revisions and removed IDs stay recoverable but cannot silently enter current rolls', () => {
  const input = data(); input.settings.missionPlanner.confirmation.catalogRevision = 'old-revision';
  input.settings.missionPlanner.confirmation.missions[0].id = 'mission:retired';
  input.cards[0].missionSelection.name = 'Historical title';
  const restored = storage.parseSave(JSON.stringify(storage.wrapData(input)));
  assert.deepEqual(restored, input);
  assert.equal(engine.getPool(context, restored.settings.missionPlanner.confirmation).status, 'needs-confirmation');
});
test('custom missions retain explicit null duration/score without guessed defaults', () => {
  const custom = { kind: 'custom', id: 'custom:observed', name: '<Observed event>', minutes: null, scoringFamily: null };
  const input = data(), confirmed = engine.confirm(context, [custom]);
  input.settings.missionPlanner.confirmation = confirmed;
  input.cards[0].missionSelection = state.capture(engine.roll(context, { confirmation: confirmed }), context, engine.getCatalog().revision);
  input.cards[0].mode = 'Unknown Mode';
  assert.deepEqual(transfer.parse(transfer.serialize(input)), input);
});
test('invalid planner records fail consistently without changing caller data', () => {
  for (const value of [null, [], {}, { version: 1 }, { version: '1', confirmation: null }, { version: 1, confirmation: null, extra: true }, { version: 1, confirmation: {} }]) {
    const input = data(); input.settings.missionPlanner = value; const before = structuredClone(input);
    assert.throws(() => transfer.validateData(input), /Mission data/);
    assert.throws(() => storage.wrapData(input), /Mission data/);
    assert.deepEqual(input, before); assert.equal(state.read(value).writable, false);
  }
});
test('malformed scopes and noncanonical ordering cannot masquerade as confirmed context', () => {
  for (const scope of ['', 'not json', '{}', '[1]', 'x'.repeat(8193), '[1,null,null,null,"unknown",[],[],[]]',
    JSON.stringify([1, 'id:7', 'Automatons', 7, 'liberation', [2, 1], [], []])]) {
    assert.throws(() => state.validateConfirmation({ ...confirmation, scope }), /Mission data/);
  }
});
test('malformed choices, duplicate identities and extra fields fail closed', () => {
  for (const choices of [[null], new Array(1), [confirmation.missions[0], confirmation.missions[0]],
    [{ kind: 'catalog', id: 'custom:x' }], [{ kind: 'catalog', id: 'mission:' }],
    [{ kind: 'custom', id: 'custom:x', name: 'X', minutes: 40, scoringFamily: 'guessed' }]]) {
    assert.throws(() => state.validateConfirmation({ ...confirmation, missions: choices }), /Mission data/);
  }
});
test('historical metadata validates without re-reading current catalog facts', () => {
  const input = data(); input.cards[0].missionSelection.name = 'Old title'; input.cards[0].missionSelection.id = 'mission:removed';
  assert.deepEqual(transfer.parse(transfer.serialize(input)), input);
  input.cards[0].mode = 'Blitz (12)';
  assert.throws(() => transfer.serialize(input), /disagree/);
});
test('invalid historical identity, provenance, duration and conflicts reject import', () => {
  for (const patch of [{ version: 0 }, { id: 'custom:x' }, { provenance: 'live-game' }, { minutes: -1 },
    { ruleConflicts: ['campaign'] }, { ruleConflicts: ['unknown-rule'] }, { extra: true }]) {
    const input = data(); Object.assign(input.cards[0].missionSelection, patch);
    assert.throws(() => storage.parseImport(JSON.stringify(input)), /Mission data/);
  }
});
test('future nested versions retain the standard unsupported-save error code', () => {
  const variants = [input => input.settings.missionPlanner.version = 2,
    input => input.settings.missionPlanner.confirmation.version = 2,
    input => input.cards[0].missionSelection.version = 2,
    input => input.settings.missionPlanner.confirmation.scope = JSON.stringify([2, 'id:7', 'Automatons', 7, 'liberation', [], [], []])];
  for (const change of variants) {
    const input = data(); change(input);
    assert.throws(() => transfer.serialize(input), { code: 'UNSUPPORTED_SAVE_VERSION' });
    assert.throws(() => storage.wrapData(input), { code: 'UNSUPPORTED_SAVE_VERSION' });
  }
});
test('future mission state cannot be overwritten by autosave/import or quarantined as corruption', t => {
  const dir = fixture(t), file = path.join(dir, 'state.json');
  const envelope = storage.wrapData(data()); envelope.data.settings.missionPlanner.version = 2;
  const bytes = JSON.stringify(envelope); fs.writeFileSync(file, bytes);
  for (const action of [() => storage.loadStateFile(dir), () => storage.saveStateFile(dir, data()), () => storage.commitImportData(dir, data())]) {
    assert.throws(action, { code: 'UNSUPPORTED_SAVE_VERSION' }); assert.equal(fs.readFileSync(file, 'utf8'), bytes);
  }
  assert.deepEqual(fs.readdirSync(path.join(dir, 'recovery')), []);
});
test('damaged mission save is copied byte-for-byte to recovery before older backup is used', t => {
  const dir = fixture(t), file = path.join(dir, 'state.json'), input = data();
  storage.saveStateFile(dir, input); storage.saveStateFile(dir, input);
  const envelope = storage.wrapData(structuredClone(input)); envelope.data.settings.missionPlanner.confirmation.scope = 'damaged';
  const bytes = JSON.stringify(envelope); fs.writeFileSync(file, bytes);
  const loaded = storage.loadStateFile(dir); assert.equal(loaded.recovered, true); assert.deepEqual(loaded.data, input);
  const copies = fs.readdirSync(path.join(dir, 'recovery'));
  assert(copies.some(name => fs.readFileSync(path.join(dir, 'recovery', name), 'utf8') === bytes));
});
test('rejected mission import does not change working save or backup inventory', t => {
  const dir = fixture(t); storage.saveStateFile(dir, data());
  const file = path.join(dir, 'state.json'), bytes = fs.readFileSync(file), incoming = data(); incoming.settings.missionPlanner = null;
  assert.throws(() => storage.commitImportData(dir, incoming), /Mission data/);
  assert(fs.readFileSync(file).equals(bytes)); assert.deepEqual(fs.readdirSync(path.join(dir, 'backups')), []);
});
test('browser module validators load in actual dependency order without Node', () => {
  const sandbox = vm.createContext({ TextEncoder });
  for (const name of ['armory-preferences', 'mission-selection', 'mission-state', 'solo-score', 'card-rules', 'transfer-validation']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/' + name + '.js'), 'utf8'), sandbox);
  }
  // Create plain objects in the browser realm for its strict JSON-tree check.
  const json = JSON.stringify(data()); sandbox.payload = json;
  assert.equal(vm.runInContext('HD2CSMTransfer.serialize(HD2CSMTransfer.parse(payload))', sandbox), transfer.serialize(data()));
});
