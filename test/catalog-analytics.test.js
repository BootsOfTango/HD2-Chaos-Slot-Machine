const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const catalog = require('../assets/item-catalog.json');
const catalogState = require('../assets/catalog-state');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const metadata = [
  ['primaries', 'primary'], ['sidearms', 'sidearm'], ['throwables', 'throwable'],
  ['stratagems', 'stratagem'], ['boosters', 'booster']
].map(([key, visualCategory]) => ({ key, visualCategory }));
const clone = value => JSON.parse(JSON.stringify(value));
function section(first, next) {
  const start = html.indexOf(`        function ${first}`);
  const end = html.indexOf(`        function ${next}`, start);
  assert.ok(start >= 0 && end > start, `Runtime function boundary: ${first}`);
  return html.slice(start, end);
}
function runtime(items = catalog.items, cards = []) {
  const defaults = Object.fromEntries(metadata.map(meta => [meta.key,
    clone(items.filter(item => item.type === meta.visualCategory))]));
  const context = vm.createContext({
    DEFAULTS: { items: defaults },
    ITEM_LIST_METADATA: metadata,
    state: { items: clone(defaults), cards: clone(cards) },
    window: { HD2CSMCatalogState: catalogState },
    sortCardsByRankOrder: rows => rows.slice(),
    isCardComplete: () => true,
    tierForPlace: () => 'rainbow',
    clamp: (value, min, max) => Math.max(min, Math.min(max, value))
  });
  vm.runInContext([
    section('createCatalogAnalyticsResolver()', 'getArmoryExpandedGroups()'),
    section('buildArmoryStats(cards)', 'renderItemList('),
    section('getCardItems(card)', 'getStratGroup('),
    section('buildItemAnalytics(cards = [])', 'renderItemInsights(')
  ].join('\n'), context);
  return context;
}
function card(sidearm, index = 0, extra = {}) {
  return { id: `history-${index}`, sidearm, createdAt: new Date().toISOString(),
    majorOrderDone: index % 2 === 0, grade: 70 + index, scoreRaw: 200 + index,
    stats: { kills: index + 10 }, notes: `Saved label ${sidearm}`, ...extra };
}

test('both real analytics consumers combine old/new CQC names without changing saved history or flags', () => {
  const renames = [
    ['sidearm:cqc-1-saber', 'CQC-1 Saber', 'CQC-2 Saber'],
    ['sidearm:cqc-19-machete', 'CQC-19 Machete', 'CQC-42 Machete'],
    ['sidearm:cqc-2-stun-lance', 'CQC-2 Stun Lance', 'CQC-19 Stun Lance']
  ];
  const cards = renames.flatMap(([, oldName, newName], index) => [card(oldName, index * 2), card(newName, index * 2 + 1)]);
  const context = runtime(catalog.items, cards);
  context.state.items.sidearms.forEach((item, index) => { item.owned = index % 2 === 0; item.enabled = false; });
  const before = JSON.stringify({ state: context.state, defaults: context.DEFAULTS });
  const armory = context.buildArmoryAnalyticsData().filter(row => row.rolledCount);
  const insights = context.buildItemAnalytics(context.state.cards);
  assert.equal(armory.length, 3);
  assert.equal(insights.itemStats.length, 3);
  for (const [id, , name] of renames) {
    const row = armory.find(item => item.name === name);
    assert.equal(row.key, `sidearm|${id}`);
    assert.equal(row.rolledCount, 2);
    assert.equal(row.moSuccessCount, 1);
    assert.equal(row.rainbowTopCount, 2);
    assert.equal(row.moRate, 0.5);
    const stat = insights.itemStats.find(item => item.name === name);
    assert.equal(stat.total, 2);
    assert.equal(stat.moSuccess, 1);
  }
  const canonicalCards = clone(cards).map(saved => ({ ...saved,
    sidearm: renames.find(([, oldName, newName]) => [oldName, newName].includes(saved.sidearm))[2] }));
  assert.deepEqual(clone(insights), clone(context.buildItemAnalytics(canonicalCards)),
    'Derived totals/performance equal a canonical-name fixture without rewriting real records');
  assert.equal(JSON.stringify({ state: context.state, defaults: context.DEFAULTS }), before);
});

test('canonical rows resolve by category-scoped stable ID before stale names and unique aliases', () => {
  const context = runtime();
  const resolve = context.createCatalogAnalyticsResolver();
  const byId = resolve('sidearm', { id: 'sidearm:cqc-1-saber', name: 'CQC-42 Machete' });
  assert.equal(byId.name, 'CQC-2 Saber');
  assert.equal(resolve('sidearm', { id: 'sidearm:cqc-1-saber' }).key, byId.key);
  assert.equal(resolve('sidearm', 'cqc-2 SABRE').key, byId.key);
  assert.equal(resolve('sidearm', 'CQC-1 Saber').key, byId.key);
  assert.notEqual(resolve('primary', 'CQC-1 Saber').key, byId.key);
  assert.equal(resolve('primary', { id: 'sidearm:cqc-1-saber', name: 'Custom rifle' }).name, 'Custom rifle');
});

test('ambiguous aliases stay separate and canonical names outrank another item alias', () => {
  const items = [
    { id: 'primary:first', type: 'primary', name: 'First', aliases: ['Shared', 'Second'] },
    { id: 'primary:second', type: 'primary', name: 'Second', aliases: ['Shared'] },
    { id: 'sidearm:other', type: 'sidearm', name: 'Other', aliases: ['Shared'] }
  ];
  const context = runtime(items, [card('Shared', 0, { primary: 'Shared' })]);
  const resolve = context.createCatalogAnalyticsResolver();
  assert.equal(resolve('primary', 'Shared').name, 'Shared');
  assert.match(resolve('primary', 'Shared').key, /\|name:/);
  assert.equal(resolve('primary', 'Second').key, 'primary|primary:second');
  assert.equal(resolve('sidearm', 'Shared').name, 'Other');
  const rows = context.buildItemAnalytics(context.state.cards).itemStats;
  assert.equal(rows.length, 2);
  assert.ok(rows.some(row => row.slot === 'primary' && row.name === 'Shared'));
  assert.ok(rows.some(row => row.slot === 'sidearm' && row.name === 'Other'));
  // Defensive fallback also avoids arbitrary choice if a future catalog has duplicate canonical names.
  items.push({ id: 'primary:third', type: 'primary', name: 'Second', aliases: [] });
  assert.match(runtime(items).createCatalogAnalyticsResolver()('primary', 'Second').key, /\|name:/);
});

test('unchanged canonical weapons and unknown custom names keep separate per-slot analytics', () => {
  const context = runtime(catalog.items, [
    card('My Blaster', 0, { primary: 'AR-23 Liberator' }),
    card('My Blaster', 1, { primary: 'My Blaster' }),
    card('☢', 2), card('☣', 3)
  ]);
  const before = JSON.stringify(context.state);
  const armory = context.buildArmoryAnalyticsData().filter(row => row.rolledCount);
  const insights = context.buildItemAnalytics(context.state.cards).itemStats;
  for (const rows of [armory, insights]) {
    assert.equal(rows.length, 5);
    assert.equal(rows.filter(row => row.name === 'My Blaster').length, 2);
    assert.equal(rows.filter(row => ['☢', '☣'].includes(row.name)).length, 2);
    assert.ok(rows.some(row => row.name === 'AR-23 Liberator' && row.key === 'primary|primary:ar-23-liberator'));
  }
  assert.equal(armory.find(row => row.type === 'sidearm' && row.name === 'My Blaster').rolledCount, 2);
  assert.equal(insights.find(row => row.slot === 'sidearm' && row.name === 'My Blaster').total, 2);
  assert.equal(JSON.stringify(context.state), before);
});

test('empty labels produce no analytics rows and known ID-only catalog rows remain usable', () => {
  const context = runtime(catalog.items, [card(''), card('—')]);
  const resolve = context.createCatalogAnalyticsResolver();
  assert.equal(resolve('sidearm', ''), null);
  assert.equal(resolve('sidearm', '—'), null);
  assert.equal(resolve('sidearm', null), null);
  const row = context.state.items.sidearms.find(item => item.id === 'sidearm:cqc-1-saber');
  delete row.name;
  assert.equal(context.buildArmoryAnalyticsData().find(item => item.key === 'sidearm|sidearm:cqc-1-saber').name, 'CQC-2 Saber');
  assert.equal(context.buildItemAnalytics(context.state.cards).itemStats.length, 0);
});

test('old duplicate names count one equipment use per historical run in every analytics consumer', () => {
  const cards = [
    card('', 0, { stratagems: ['Wasp', 'StA-X3 W.A.S.P. Launcher', 'EMS Strike', 'Orbital EMS Strike'] }),
    card('', 1, { stratagems: ['Wasp', 'EMS Mortar Sentry'] })
  ];
  const context = runtime(catalog.items, cards);
  const before = JSON.stringify(context.state);
  const armory = context.buildArmoryAnalyticsData().filter(item => item.rolledCount);
  const insights = context.buildItemAnalytics(context.state.cards).itemStats;
  const legacy = context.buildArmoryStats(context.state.cards);
  for (const [name, count] of [['StA-X3 W.A.S.P. Launcher', 2], ['Orbital EMS Strike', 1], ['EMS Mortar Sentry', 1]]) {
    assert.equal(armory.find(item => item.name === name).rolledCount, count);
    assert.equal(insights.find(item => item.name === name).total, count);
    assert.equal(legacy.get(name).rolledCount, count);
  }
  assert.equal(armory.length, 3); assert.equal(insights.length, 3); assert.equal(legacy.size, 3);
  assert.equal(JSON.stringify(context.state), before);
});

test('retired IDs resolve before stale names in derived analytics without changing the sentry', () => {
  const resolve = runtime().createCatalogAnalyticsResolver();
  assert.equal(resolve('stratagem', { id: 'stratagem:wasp', name: 'EMS Mortar Sentry' }).name, 'StA-X3 W.A.S.P. Launcher');
  assert.equal(resolve('stratagem', { id: 'stratagem:ems-strike' }).name, 'Orbital EMS Strike');
  assert.equal(resolve('stratagem', 'EMS Mortar Sentry').key, 'stratagem|stratagem:ems-mortar-sentry');
  assert.equal(resolve('primary', { id: 'stratagem:wasp', name: 'My custom rifle' }).name, 'My custom rifle');
});
