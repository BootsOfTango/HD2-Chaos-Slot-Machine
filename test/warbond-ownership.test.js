const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ownership = require('../assets/catalog-state');
const sources = require('../assets/catalog-sources');
const shipped = require('../assets/item-catalog.json');

const metadata = [
  ['primaries', 'primary'], ['sidearms', 'sidearm'], ['throwables', 'throwable'],
  ['stratagems', 'stratagem'], ['boosters', 'booster']
].map(([key, visualCategory]) => ({ key, visualCategory }));
const clone = value => JSON.parse(JSON.stringify(value));
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const start = html.indexOf('        const reviewedWarbondData =');
const end = html.indexOf('        function renderItemsByWarbond()', start);
assert.ok(start >= 0 && end > start, 'Ownership helpers are extracted from the actual renderer');
const runtimeCode = html.slice(start, end);

function fixture() {
  const warbond = { id: 'warbond:reviewed', name: 'Reviewed Warbond', equipmentIds: ['primary:one', 'sidearm:two', 'booster:three'] };
  const items = warbond.equipmentIds.map(id => ({
    id, name: id.split(':')[1], type: id.split(':')[0], warbond: warbond.name,
    acquisition: { kind: 'warbond', id: warbond.id, label: warbond.name, verification: 'primary-source',
      sourceUrl: 'https://example.com/announcement', verifiedAt: '2026-09-14' }
  }));
  items.push({ id: 'sidearm:shop', name: 'Shop item', type: 'sidearm', warbond: warbond.name,
    acquisition: { kind: 'superstore', label: 'Superstore', verification: 'primary-source', sourceUrl: 'https://example.com/shop', verifiedAt: '2026-09-14' } });
  return { items, warbonds: [warbond] };
}

function runtime(catalog = fixture(), { readError = false } = {}) {
  const calls = { reads: 0, saves: 0, items: 0, spin: 0, warnings: 0 };
  const state = { items: Object.fromEntries(metadata.map(meta => [meta.key,
    clone(catalog.items.filter(item => item.type === meta.visualCategory)).map(item => ({ ...item, owned: false, enabled: false }))])) };
  const context = vm.createContext({
    state, ITEM_LIST_METADATA: metadata,
    window: { HD2CSMCatalogState: ownership, HD2CSMCatalogSources: sources },
    readPackagedJsonResource: async resource => {
      calls.reads += 1;
      assert.equal(resource, 'assets/item-catalog.json');
      if (readError) throw new Error('Fixture unavailable');
      return clone(catalog);
    },
    saveState: () => { calls.saves += 1; },
    renderItems: () => { calls.items += 1; },
    renderSpin: () => { calls.spin += 1; },
    console: { warn: () => { calls.warnings += 1; } }
  });
  vm.runInContext(runtimeCode, context);
  return { context, calls, state };
}
const rows = state => metadata.flatMap(meta => state.items[meta.key]);

test('bundled explicit reviewed equipment sets drive controls, not current player metadata', async () => {
  const catalog = fixture();
  const { context, state, calls } = runtime(catalog);
  rows(state).forEach(item => { item.warbond = 'Player-changed group'; item.acquisition = { kind: 'custom' }; });
  const definitions = await context.loadReviewedWarbondCatalog();
  assert.equal(definitions.length, 1);
  assert.deepEqual(clone(definitions[0].equipment), catalog.warbonds[0].equipmentIds.map(id => ({ id, type: id.split(':')[0] })));
  assert.equal(context.getReviewedWarbondMembers(definitions[0]).length, 3);
  assert.equal(calls.reads, 1);
});

test('all shipped reviewed manifest equipment sets are eligible and retain their exact membership', () => {
  const { context } = runtime();
  const definitions = context.createReviewedWarbondDefinitions(clone(shipped));
  assert.equal(definitions.length, shipped.warbonds.length);
  for (const warbond of shipped.warbonds) {
    const definition = definitions.find(entry => entry.id === warbond.id);
    assert.equal(definition.name, warbond.name);
    assert.deepEqual(clone(definition.equipment.map(item => item.id)), warbond.equipmentIds);
  }
});

test('bulk actions affect exactly full canonical sets and leave same-label custom, forged and shop rows unchanged', async () => {
  const { context, state, calls } = runtime();
  const borrowed = clone(state.items.sidearms[0]);
  state.items.sidearms.push({ ...borrowed, id: 'custom:sidearm:forged', name: 'Forged acquisition', owned: true, enabled: false });
  state.items.primaries.push({ id: 'custom:primary:matching-label', name: 'Matching group', warbond: 'Reviewed Warbond', owned: false, enabled: false });
  state.items.sidearms.push({ id: 'primary:one', name: 'Wrong-category duplicate identity', owned: true, enabled: true });
  const definitions = await context.loadReviewedWarbondCatalog();
  const members = context.getReviewedWarbondMembers(definitions[0]);
  const unrelated = rows(state).filter(item => !members.includes(item));
  const before = JSON.stringify(unrelated);
  assert.equal(context.applyReviewedWarbondAction('warbond:reviewed', 'enable'), true);
  assert.ok(members.every(item => item.owned === true && item.enabled === true));
  assert.equal(JSON.stringify(unrelated), before);
  members[0].enabled = false;
  assert.equal(context.applyReviewedWarbondAction('warbond:reviewed', 'exclude'), true);
  assert.ok(members.every(item => item.owned === true && item.enabled === false));
  assert.equal(JSON.stringify(unrelated), before);
  assert.equal(context.applyReviewedWarbondAction('warbond:reviewed', 'unowned'), true);
  assert.ok(members.every(item => item.owned === false && item.enabled === false));
  assert.equal(JSON.stringify(unrelated), before);
  assert.equal(calls.saves, 3); assert.equal(calls.items, 3); assert.equal(calls.spin, 3);
});

test('exclude preserves mixed ownership and all actions retain metadata/recovery records', async () => {
  const { context, state } = runtime();
  const definitions = await context.loadReviewedWarbondCatalog();
  const members = context.getReviewedWarbondMembers(definitions[0]);
  members.forEach((item, index) => {
    item.owned = index !== 1; item.enabled = index !== 1;
    item.playerNote = { keep: index };
    item.legacyAliasRecords = [{ name: 'Recoverable old name', owned: false, enabled: false }];
  });
  const facts = members.map(({ enabled, owned, ...rest }) => JSON.stringify(rest));
  context.applyReviewedWarbondAction(definitions[0].id, 'exclude');
  assert.deepEqual(members.map(item => item.owned), [true, false, true]);
  assert.ok(members.every(item => !item.enabled));
  for (const action of ['enable', 'exclude', 'unowned']) context.applyReviewedWarbondAction(definitions[0].id, action);
  assert.deepEqual(members.map(({ enabled, owned, ...rest }) => JSON.stringify(rest)), facts);
});

test('invalid action, unreviewed set or incomplete/ambiguous live identity cannot partially mutate state', async () => {
  for (const kind of ['invalid-action', 'unknown-set', 'missing-member', 'duplicate-member']) {
    const { context, state, calls } = runtime();
    await context.loadReviewedWarbondCatalog();
    if (kind === 'missing-member') state.items.boosters = [];
    if (kind === 'duplicate-member') state.items.sidearms.push(clone(state.items.sidearms[0]));
    const before = JSON.stringify(state);
    assert.equal(context.applyReviewedWarbondAction(kind === 'unknown-set' ? 'warbond:unknown' : 'warbond:reviewed', kind === 'invalid-action' ? 'reset-all' : 'enable'), false);
    assert.equal(JSON.stringify(state), before);
    assert.equal(calls.saves, 0); assert.equal(calls.items, 0); assert.equal(calls.spin, 0);
  }
});

test('manifest membership must be unique, complete, source-reviewed and truly acquired from the named Warbond', () => {
  const edits = [
    catalog => { delete catalog.warbonds[0].equipmentIds; },
    catalog => { catalog.warbonds[0].equipmentIds = []; },
    catalog => { catalog.warbonds[0].equipmentIds.push('primary:one'); },
    catalog => { catalog.warbonds[0].equipmentIds.push('primary:missing'); },
    catalog => { catalog.warbonds[0].equipmentIds.push('sidearm:shop'); },
    catalog => { catalog.items[0].acquisition.id = 'warbond:wrong'; },
    catalog => { catalog.items[0].acquisition.verification = 'legacy-assignment-pending-audit'; },
    catalog => { delete catalog.items[0].acquisition.verifiedAt; },
    catalog => { catalog.items.push(clone(catalog.items[0])); },
    catalog => { catalog.warbonds.push(clone(catalog.warbonds[0])); }
  ];
  const { context } = runtime();
  for (const edit of edits) {
    const catalog = fixture(); edit(catalog);
    const before = JSON.stringify(catalog);
    assert.equal(context.createReviewedWarbondDefinitions(catalog).length, 0);
    assert.equal(JSON.stringify(catalog), before);
  }
});

test('bundled catalog loading is deduplicated and a read failure does not enable anything', async () => {
  for (const readError of [false, true]) {
    const { context, state, calls } = runtime(fixture(), { readError });
    const before = JSON.stringify(state);
    const promises = Array.from({ length: 4 }, () => context.loadReviewedWarbondCatalog());
    assert.ok(promises.every(promise => promise === promises[0]));
    const definitions = await promises[0];
    assert.equal(definitions.length, readError ? 0 : 1);
    assert.equal(calls.reads, 1); assert.equal(calls.warnings, readError ? 1 : 0);
    assert.equal(JSON.stringify(state), before);
    if (readError) assert.equal(context.applyReviewedWarbondAction('warbond:reviewed', 'enable'), false);
  }
});

test('bulk controls expose full-set counts and Warbond-specific accessible names', async () => {
  class Element {
    constructor(tag) { this.tagName = tag; this.children = []; this.dataset = {}; this.attributes = {}; this.listeners = {}; }
    appendChild(child) { this.children.push(child); return child; }
    setAttribute(key, value) { this.attributes[key] = value; }
    addEventListener(key, handler) { this.listeners[key] = handler; }
  }
  const { context } = runtime();
  context.document = { createElement: tag => new Element(tag) };
  const definitions = await context.loadReviewedWarbondCatalog();
  const group = new Element('div');
  context.renderReviewedWarbondControls(group, definitions[0]);
  assert.equal(group.dataset.warbondId, 'warbond:reviewed');
  const controls = group.children[0];
  assert.equal(controls.children[0].dataset.warbondCount, '3');
  assert.match(controls.children[1].textContent, /all 3 reviewed items.*search-hidden/);
  const buttons = controls.children[2].children;
  assert.deepEqual(buttons.map(button => button.dataset.warbondAction), ['enable', 'exclude', 'unowned']);
  for (const button of buttons) {
    assert.match(button.attributes['aria-label'], /^Reviewed Warbond:/);
    assert.equal(button.type, 'button'); assert.equal(button.disabled, false);
    assert.equal(typeof button.listeners.click, 'function');
  }
});
