'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const api = require('../assets/mission-selection');
const catalog = require('../assets/mission-catalog.json');
const engine = api.createEngine(catalog);
const context = overrides => ({ planetKey: 'id:7', faction: 'Automatons', difficulty: 7, campaign: 'liberation',
  active: true, enabled: true, campaignIds: [20], eventKeys: [], verifiedEventRules: [], ...overrides });
const choice = id => ({ kind: 'catalog', id: 'mission:' + id });
const ids = pool => pool.missions.map(row => row.id);
const custom = overrides => ({ kind: 'custom', id: 'custom:observed-event', name: 'My observed event', minutes: null, scoringFamily: null, ...overrides });
const clone = value => JSON.parse(JSON.stringify(value));

test('reviewed partial catalog has sixty source-attributed identities and twenty-seven confirmation-only variants', () => {
  assert.equal(api.validateCatalog(catalog).missions.length, 60);
  assert.equal(catalog.coverage, 'partial');
  assert.equal(catalog.missions.filter(row => !row.suggestionEnabled).length, 27);
  assert.ok(catalog.sources.every(source => source.kind === 'community-reference' && source.access === 'indexed-text'));
});
test('resolved enemy determines suggestions, without cross-faction eradication', () => {
  assert.deepEqual(ids(engine.getPool(context())), ['mission:launch-icbm', 'mission:eradicate-automatons', 'mission:retrieve-valuable-data', 'mission:emergency-evacuation', 'mission:blitz-automatons', 'mission:spread-democracy', 'mission:destroy-command-bunkers', 'mission:sabotage-air-base', 'mission:neutralize-orbital-defenses', 'mission:seize-industrial-complex', 'mission:sabotage-orgo-plasma', 'mission:confiscate-assets']);
  assert.deepEqual(ids(engine.getPool(context({ faction: 'Terminids' }))), ['mission:launch-icbm', 'mission:eradicate-terminids', 'mission:retrieve-valuable-data', 'mission:emergency-evacuation', 'mission:blitz-terminids', 'mission:spread-democracy', 'mission:enable-oil-extraction', 'mission:purge-hatcheries', 'mission:nuke-nursery']);
  assert.deepEqual(ids(engine.getPool(context({ faction: 'Illuminate' }))), ['mission:launch-icbm', 'mission:retrieve-valuable-data', 'mission:evacuate-colonists', 'mission:retrieve-recon-craft-intel']);
});
test('difficulty boundaries include low-level basics; a genuinely empty catalog subset has no invented fallback', () => {
  const basics = ['mission:upload-escape-pod-data', 'mission:start-fuel-pumps', 'mission:terminate-illegal-broadcast', 'mission:spread-democracy'];
  assert.deepEqual(ids(engine.getPool(context({ difficulty: 1 }))), [...basics, 'mission:eliminate-devastators', 'mission:seize-industrial-complex', 'mission:sabotage-orgo-plasma', 'mission:confiscate-assets']);
  assert.deepEqual(ids(engine.getPool(context({ difficulty: 2 }))), ['mission:eradicate-automatons', ...basics, 'mission:eliminate-devastators', 'mission:destroy-transmission-network', 'mission:seize-industrial-complex', 'mission:sabotage-orgo-plasma', 'mission:confiscate-assets']);
  for (const difficulty of [3, 10]) assert.ok(ids(engine.getPool(context({ difficulty }))).includes('mission:launch-icbm'));
  const restricted = api.createEngine({ ...catalog, missions: [catalog.missions[0]] });
  assert.equal(restricted.getPool(context({ difficulty: 1 })).status, 'empty-suggestions');
  assert.equal(restricted.roll(context({ difficulty: 1 }), { random: () => { throw Error('No draw expected'); } }), null);
});
test('high-value assets needs known defense context and difficulty five', () => {
  for (const campaign of ['liberation', 'event', 'unknown']) {
    assert.equal(engine.select(context({ campaign }), 'mission:evacuate-high-value-assets'), null);
  }
  assert.equal(engine.select(context({ campaign: 'defense', difficulty: 4 }), 'mission:evacuate-high-value-assets'), null);
  assert.ok(engine.select(context({ campaign: 'defense', difficulty: 5 }), 'mission:evacuate-high-value-assets'));
});
test('Illuminate regional exception is never guessed from defense, MO prose or an arbitrary flag', () => {
  const c = context({ faction: 'Illuminate', campaign: 'defense', majorOrder: 'Defend evacuation sites', verifiedEventRules: ['illuminate-region'] });
  assert.equal(engine.select(c, 'mission:defend-evacuation-site'), null);
  const confirmation = engine.confirm(c, [choice('defend-evacuation-site')]);
  const result = engine.select(c, 'mission:defend-evacuation-site', { confirmation });
  assert.equal(result.provenance, 'player-confirmed');
  assert.deepEqual(result.ruleConflicts, ['confirmation-required']);
});
test('missing planet/enemy/difficulty and inactive or excluded planets stop both selection paths', () => {
  for (const change of [{ planetKey: null }, { faction: null }, { difficulty: null }, { active: false }, { enabled: false }]) {
    const c = context(change), pool = engine.getPool(c);
    assert.equal(pool.status, 'needs-context');
    assert.ok(pool.reasons.length);
    assert.equal(engine.select(c, 'mission:launch-icbm'), null);
    assert.equal(engine.roll(c), null);
    assert.throws(() => engine.confirm(c, []), /eligible planet/);
  }
  assert.equal(engine.getPool({}).status, 'needs-context');
});
test('malformed context fails closed instead of coercing difficulty or guessing enemies', () => {
  for (const change of [{ planetKey: '7' }, { faction: 'Humans' }, { faction: 'automaton' }, { difficulty: '7' },
    { difficulty: 0 }, { difficulty: 11 }, { difficulty: 2.5 }, { difficulty: NaN }, { campaign: 'MO defense' },
    { active: 'true' }, { enabled: 1 }, { campaignIds: [20, 20] }, { campaignIds: [-1] },
    { eventKeys: ['\n'] }, { verifiedEventRules: ['prose with spaces'] }, { eventKeys: new Array(1) }]) {
    assert.throws(() => engine.getPool(context(change)), TypeError);
  }
});
test('pool is always labeled inferred or player-confirmed, never exact live availability', () => {
  const c = context({ campaign: 'unknown', fetchedAt: 'now', source: 'live' });
  const pool = engine.getPool(c);
  assert.equal(pool.label, 'Suggested compatible missions');
  assert.equal(pool.exactLiveAvailability, false);
  assert.ok(pool.warnings.includes('partial-catalog'));
  assert.ok(pool.warnings.includes('unknown-campaign-context'));
  assert.equal(engine.getPool(c, engine.confirm(c, [choice('launch-icbm')])).exactLiveAvailability, false);
});
test('verified structured event rules gate event suggestions; MO words do not unlock them', () => {
  const seed = clone(catalog);
  seed.missions[0].requiredEventRules = ['test:reviewed-event'];
  const eventEngine = api.createEngine(seed), c = context({ majorOrder: 'test:reviewed-event' });
  assert.equal(eventEngine.select(c, 'mission:launch-icbm'), null);
  assert.ok(eventEngine.select({ ...c, verifiedEventRules: ['test:reviewed-event'] }, 'mission:launch-icbm'));
});
test('random and manual selection share the exact confirmed pool', () => {
  const c = context(), confirmation = engine.confirm(c, [choice('eradicate-automatons')]);
  assert.equal(engine.select(c, 'mission:launch-icbm', { confirmation }), null);
  assert.equal(engine.roll(c, { confirmation, random: () => 0.99 }).id, 'mission:eradicate-automatons');
  assert.deepEqual(engine.roll(c, { confirmation }), engine.select(c, 'mission:eradicate-automatons', { confirmation }));
});
test('an intentionally empty confirmation stays empty rather than reverting to suggestions', () => {
  const c = context(), confirmation = engine.confirm(c, []);
  assert.equal(engine.getPool(c, confirmation).status, 'empty-confirmed');
  assert.equal(engine.roll(c, { confirmation }), null);
  assert.equal(engine.select(c, 'mission:launch-icbm', { confirmation }), null);
});
test('context scope survives timestamp/progress/MO prose changes and reordered event keys', () => {
  const c = context({ campaignIds: [20, 21], eventKeys: ['event:one:ongoing', 'event:two:ongoing'], verifiedEventRules: ['rule:b', 'rule:a'] });
  const confirmation = engine.confirm(c, [choice('launch-icbm')]);
  const refreshed = { ...c, campaignIds: [21, 20], eventKeys: [...c.eventKeys].reverse(), verifiedEventRules: ['rule:a', 'rule:b'],
    fetchedAt: '2026-09-17T00:00:00Z', progress: 0.9, source: 'cache', majorOrder: 'New unrelated wording' };
  assert.equal(api.scopeKey(c), api.scopeKey(refreshed));
  assert.equal(engine.getPool(refreshed, confirmation).status, 'confirmed');
});
test('planet, difficulty, enemy, campaign and relevant event changes invalidate confirmation', () => {
  const c = context(), confirmation = engine.confirm(c, [choice('launch-icbm')]);
  for (const change of [{ planetKey: 'id:8' }, { difficulty: 8 }, { faction: 'Terminids' }, { campaign: 'defense' },
    { campaignIds: [21] }, { eventKeys: ['event:1:ongoing'] }, { verifiedEventRules: ['event:reviewed'] }]) {
    const next = { ...c, ...change };
    assert.equal(engine.getPool(next, confirmation).status, 'needs-confirmation');
    assert.equal(engine.roll(next, { confirmation }), null);
  }
});
test('relevant event expiration invalidates scope even when its identity is unchanged', () => {
  const c = context({ eventKeys: ['event:1:ongoing'] }), confirmation = engine.confirm(c, [choice('launch-icbm')]);
  assert.equal(engine.getPool({ ...c, eventKeys: ['event:1:expired'] }, confirmation).status, 'needs-confirmation');
});
test('catalog-revision changes require reconfirmation, never silent reinterpretation', () => {
  const c = context(), confirmation = engine.confirm(c, [choice('launch-icbm')]);
  const updated = clone(catalog); updated.revision = 'next-review';
  assert.equal(api.createEngine(updated).getPool(c, confirmation).status, 'needs-confirmation');
});
test('unknown, malformed and future-version confirmations are preserved and do not fall back', () => {
  const c = context(), good = engine.confirm(c, [choice('launch-icbm')]);
  for (const bad of [false, [], {}, { ...good, version: 2 }, { ...good, scope: null }, { ...good, extra: true },
    { ...good, missions: [choice('unknown')] }, { ...good, missions: [choice('launch-icbm'), choice('launch-icbm')] }]) {
    const before = clone(bad);
    assert.equal(engine.getPool(c, bad).status, 'needs-confirmation');
    assert.deepEqual(bad, before);
    assert.equal(engine.roll(c, { confirmation: bad }), null);
  }
});
test('player-confirmed out-of-suggestion catalog choices are explicit overrides, not global edits', () => {
  const c = context(), confirmation = engine.confirm(c, [choice('evacuate-high-value-assets')]);
  const mission = engine.roll(c, { confirmation });
  assert.deepEqual(mission.ruleConflicts, ['campaign']);
  assert.equal(mission.provenance, 'player-confirmed');
  assert.equal(engine.select(c, mission.id), null);
  assert.equal(catalog.missions[3].campaigns[0], 'defense');
});
test('custom/event mission remains local to confirmation with no inferred duration or score', () => {
  const c = context(), confirmation = engine.confirm(c, [custom()]);
  const mission = engine.roll(c, { confirmation });
  assert.equal(mission.provenance, 'player-confirmed-custom');
  assert.equal(mission.minutes, null);
  assert.equal(mission.scoringFamily, null);
  assert.equal(engine.select(c, mission.id), null);
  assert.equal(engine.roll(context({ planetKey: 'id:8' }), { confirmation }), null);
});
test('specific identity and duration do not silently change the legacy scoring family', () => {
  const c = context(), confirmation = engine.confirm(c, [custom({ minutes: 40, scoringFamily: 'Blitz (12)' })]);
  assert.equal(engine.roll(c, { confirmation }).scoringFamily, 'Blitz (12)');
  for (const row of catalog.missions) assert.ok(api.SCORING_FAMILIES.includes(row.scoringFamily));
  assert.equal(engine.select(c, 'mission:launch-icbm').scoringFamily, 'Normal (40)');
});
test('duplicate choices and invalid custom entries cannot reweight or pollute the pool', () => {
  const c = context();
  for (const choices of [[choice('launch-icbm'), choice('launch-icbm')], [custom(), custom()], new Array(1),
    [custom({ id: 'mission:launch-icbm' })], [custom({ name: ' ' })], [custom({ name: 'x'.repeat(161) })],
    [custom({ minutes: 0 })], [custom({ minutes: '40' })], [custom({ scoringFamily: 'new scoring' })],
    [custom({ extra: 'ignored?' })], [custom({ name: 'Control\u0000character' })], Array.from({ length: 33 }, (_, i) => custom({ id: 'custom:' + i }))]) {
    assert.throws(() => engine.confirm(c, choices), TypeError);
  }
});
test('uniform draws cover eligible identities and rerolls avoid current mission when possible', () => {
  const c = context(), counts = new Map();
  const poolIds = ids(engine.getPool(c)), draws = poolIds.length * 20;
  for (let i = 0; i < draws; i++) {
    const id = engine.roll(c, { random: () => (i + 0.5) / draws }).id;
    counts.set(id, (counts.get(id) || 0) + 1);
    assert.ok(engine.select(c, id));
  }
  assert.deepEqual([...counts.keys()], poolIds);
  assert.deepEqual([...counts.values()], poolIds.map(() => 20));
  assert.notEqual(engine.roll(c, { currentId: 'mission:launch-icbm' }).id, 'mission:launch-icbm');
  const low = context({ difficulty: 2 });
  const confirmation = engine.confirm(low, [choice('eradicate-automatons')]);
  assert.equal(engine.roll(low, { confirmation, currentId: 'mission:eradicate-automatons' }).id, 'mission:eradicate-automatons');
});

test('Blitz minima are faction-specific; unresolved Illuminate regional variants require confirmation', () => {
  for (const [faction, id, minimum] of [['Terminids', 'blitz-terminids', 2], ['Automatons', 'blitz-automatons', 3]]) {
    assert.equal(engine.select(context({ faction, difficulty: minimum - 1 }), 'mission:' + id), null);
    for (const difficulty of [minimum, 10]) assert.equal(engine.select(context({ faction, difficulty }), 'mission:' + id).scoringFamily, 'Blitz (12)');
  }
  for (const id of ['blitz-illuminate-ships', 'blitz-illuminate-gateways']) {
    for (const difficulty of [1, 2, 3, 10]) {
      const c = context({ faction: 'Illuminate', difficulty });
      assert.equal(engine.select(c, 'mission:' + id), null);
      const confirmation = engine.confirm(c, [choice(id)]);
      assert.equal(engine.select(c, 'mission:' + id, { confirmation }).provenance, 'player-confirmed');
    }
  }
});

test('normal evacuation is separate from asset defense and Illuminate city naming does not double weight', () => {
  assert.equal(engine.select(context({ difficulty: 2 }), 'mission:emergency-evacuation'), null);
  assert.equal(engine.select(context({ difficulty: 3 }), 'mission:emergency-evacuation').scoringFamily, 'Normal (40)');
  const c = context({ faction: 'Illuminate', difficulty: 1 });
  assert.deepEqual(ids(engine.getPool(c)), ['mission:evacuate-colonists', 'mission:upload-escape-pod-data', 'mission:terminate-illegal-broadcast', 'mission:retrieve-recon-craft-intel']);
  assert.equal(engine.select(c, 'mission:evacuate-colonists').minutes, 40);
  assert.equal(engine.select(c, 'mission:emergency-evacuation'), null);
});

test('reviewed data retrieval appears on all fronts from Medium without changing score mappings', () => {
  for (const faction of api.FACTIONS) {
    assert.equal(engine.select(context({ faction, difficulty: 2 }), 'mission:retrieve-valuable-data'), null);
    assert.equal(engine.select(context({ faction, difficulty: 3 }), 'mission:retrieve-valuable-data').scoringFamily, 'Normal (40)');
  }
});

test('Rapid Acquisition and Gloom identity do not imply regional availability from MO text', () => {
  for (const [id, faction, family] of [['rapid-acquisition', 'Automatons', 'Rapid Acquisition (15)'], ['chart-terminid-tunnels', 'Terminids', 'Normal (40)']]) {
    const c = context({ faction, majorOrder: 'Magma Gloom platinum acquisition' });
    assert.equal(engine.select(c, 'mission:' + id), null);
    const confirmation = engine.confirm(c, [choice(id)]);
    assert.equal(engine.select(c, 'mission:' + id, { confirmation }).scoringFamily, family);
  }
});
test('invalid random values are rejected', () => {
  for (const value of [1, -0.01, NaN, Infinity, '0']) assert.throws(() => engine.roll(context(), { random: () => value }), /\[0, 1\)/);
});
test('catalog input mutation and returned metadata mutation cannot affect engine facts', () => {
  const input = clone(catalog), local = api.createEngine(input);
  input.missions[0].name = 'Changed'; input.missions[0].factions.length = 0;
  local.getCatalog().missions[0].name = 'Also changed';
  assert.equal(local.select(context(), 'mission:launch-icbm').name, 'Launch ICBM');
  assert.throws(() => { local.getPool(context()).missions[0].name = 'No'; }, TypeError);
});
test('normalization and confirmation never mutate caller data and output is immutable', () => {
  const c = context({ campaignIds: [21, 20], eventKeys: ['b', 'a'] }), choices = [custom()], before = clone({ c, choices });
  const confirmation = engine.confirm(c, choices);
  choices[0].name = 'Changed later';
  assert.deepEqual(c, before.c);
  assert.equal(confirmation.missions[0].name, before.choices[0].name);
  assert.ok(Object.isFrozen(confirmation.missions[0]));
  assert.ok(Object.isFrozen(api.normalizeContext(c).eventKeys));
});
test('catalog validator rejects future versions, duplicate IDs, invalid rules and missing evidence', () => {
  const mutations = [c => c.version = 2, c => c.coverage = 'complete', c => c.missions.push(clone(c.missions[0])),
    c => c.missions[0].minDifficulty = 0, c => c.missions[0].maxDifficulty = 2,
    c => c.missions[0].campaigns = ['unknown'], c => c.missions[0].factions = ['Humans'],
    c => c.missions[0].requiredEventRules = ['MO prose'], c => c.missions[0].suggestionEnabled = 'yes',
    c => c.missions[0].sourceIds = [], c => c.missions[0].sourceIds = ['missing'], c => c.missions[0].scoringFamily = 'Normal',
    c => c.sources.push(clone(c.sources[0])), c => c.sources[0].url = 'javascript:alert(1)', c => c.missions[0].extra = true];
  for (const mutate of mutations) {
    const value = clone(catalog); mutate(value);
    assert.throws(() => api.createEngine(value), TypeError);
  }
});
test('standalone browser export works offline with no Node or network capabilities', () => {
  const sandbox = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/mission-selection.js'), 'utf8'), sandbox);
  const local = sandbox.HD2MissionSelection.createEngine(clone(catalog));
  assert.equal(local.roll(context(), { random: () => 0 }).id, 'mission:launch-icbm');
  assert.equal(local.getPool(context(), local.confirm(context(), [custom()])).missions[0].scoringFamily, null);
});
