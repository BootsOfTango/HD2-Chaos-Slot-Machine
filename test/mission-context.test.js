'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const war = require('../assets/war-snapshot');
const mission = require('../assets/mission-selection');
const { forPlanet } = require('../assets/mission-context');
const engine = mission.createEngine(require('../assets/mission-catalog.json'));
const NOW = Date.parse('2026-09-16T18:00:00Z');
const START = '2026-09-16T17:00:00Z', END = '2026-09-16T19:00:00Z';
const row = (id = 7, faction = 'Automatons') => ({ id: 100 + id, type: 1, faction,
  planet: { index: id, name: 'Planet ' + id, currentOwner: faction, disabled: false, event: null } });
const event = changes => ({ id: 50, eventType: 1, campaignId: 107, faction: 'Automatons', startTime: START, endTime: END, ...changes });
const defense = () => { const c = row(); c.planet.currentOwner = 'Humans'; c.planet.event = event(); return c; };
const parse = (rows = [row()], now = NOW) => war.normalizeCampaigns(rows, { now });
const options = changes => ({ selectedPlanet: { id: 7 }, difficulty: 7, now: NOW, ...changes });
const choice = { kind: 'catalog', id: 'mission:launch-icbm' };
const clone = value => JSON.parse(JSON.stringify(value));

test('adapter uses normalized enemy for all three factions and never the selected object metadata', () => {
  const snapshot = parse([row(7), row(8, 'Terminids'), row(9, 'Illuminate')]);
  for (const [id, faction] of [[7, 'Automatons'], [8, 'Terminids'], [9, 'Illuminate']]) {
    const out = forPlanet(snapshot, options({ selectedPlanet: { id, faction: 'Humans', context: 'defense', enabled: false } }));
    assert.equal(out.context.faction, faction);
    assert.equal(out.context.campaign, 'liberation');
    assert.equal(out.context.planetKey, 'id:' + id);
    assert.equal(out.warStatus.state, 'fresh');
    assert.ok(engine.getPool(out.context).missions.length);
  }
});
test('human-owned defense keeps its event attacker and allows defense suggestions', () => {
  const out = forPlanet(parse([defense()]), options());
  assert.equal(out.context.faction, 'Automatons');
  assert.equal(out.context.campaign, 'defense');
  assert.ok(engine.select(out.context, 'mission:evacuate-high-value-assets'));
  assert.equal(out.nextRecheckAt, '2026-09-16T18:05:00.000Z');
});
test('event expiry is re-evaluated without refresh and does not invent the battle outcome', () => {
  const snapshot = parse([defense()]);
  const before = forPlanet(snapshot, options());
  const confirmation = engine.confirm(before.context, [choice]);
  const after = forPlanet(snapshot, options({ now: Date.parse(END), online: false }));
  assert.equal(after.context.campaign, 'unknown');
  assert.equal(after.context.faction, null);
  assert.equal(after.warStatus.state, 'cached');
  assert.ok(after.warnings.includes('event-expired'));
  assert.notEqual(mission.scopeKey(before.context), mission.scopeKey(after.context));
  assert.equal(engine.roll(after.context, { confirmation }), null);
  assert.equal(snapshot.planets[0].event.state, 'ongoing');
});
test('expiry retains independent campaign enemy evidence, but suppresses defense-only suggestions', () => {
  const raw = defense(); raw.planet.event = event({ faction: null });
  const snapshot = parse([raw]);
  assert.equal(snapshot.planets[0].factionSource, 'campaign');
  const out = forPlanet(snapshot, options({ now: Date.parse(END) }));
  assert.equal(out.context.faction, 'Automatons');
  assert.equal(out.context.campaign, 'unknown');
  assert.equal(engine.select(out.context, 'mission:evacuate-high-value-assets'), null);
  assert.ok(engine.select(out.context, 'mission:launch-icbm'));
});
test('future event starting locally updates attacker and scope without a network request', () => {
  const raw = defense(); raw.planet.event = event({ faction: 'Illuminate', startTime: '2026-09-16T18:02:00Z' });
  const snapshot = parse([raw]), before = forPlanet(snapshot, options());
  assert.equal(before.context.faction, 'Automatons');
  assert.equal(before.nextRecheckAt, '2026-09-16T18:02:00.000Z');
  const after = forPlanet(snapshot, options({ now: NOW + 120000 }));
  assert.equal(after.context.faction, 'Illuminate');
  assert.equal(after.context.campaign, 'defense');
  assert.equal(after.warStatus.confirmedCurrentlyPlayable, false);
  assert.ok(after.warnings.includes('event-state-changed-since-snapshot'));
  assert.notEqual(mission.scopeKey(before.context), mission.scopeKey(after.context));
});
test('undated/invalid events are not treated as proven current defense phases', () => {
  for (const e of [event({ startTime: null, endTime: null }), event({ startTime: 'bad' }), event({ endTime: START })]) {
    const raw = defense(); raw.planet.event = e;
    const out = forPlanet(parse([raw]), options());
    assert.equal(out.context.campaign, 'unknown');
    assert.equal(engine.select(out.context, 'mission:evacuate-high-value-assets'), null);
    assert.ok(out.warnings.some(w => ['event-timing-unknown', 'event-invalid'].includes(w)));
  }
});
test('campaign defense with no event preserves independent context and exposes unknown timing', () => {
  const raw = defense(); raw.planet.event = null;
  const out = forPlanet(parse([raw]), options());
  assert.equal(out.context.campaign, 'defense');
  assert.equal(out.context.faction, 'Automatons');
  assert.ok(out.warnings.includes('defense-without-event-timing'));
});
test('unrelated event changes cannot invalidate selected campaign confirmation', () => {
  const raw = row(); raw.planet.event = event({ campaignId: 999 });
  const before = forPlanet(parse([raw]), options());
  raw.planet.event = event({ campaignId: 999, id: 123, faction: 'Illuminate', endTime: '2026-09-17T19:00:00Z' });
  const after = forPlanet(parse([raw]), options());
  assert.equal(after.context.faction, 'Automatons');
  assert.equal(after.context.campaign, 'unknown');
  assert.deepEqual(after.context.eventKeys, ['campaign-type:1']);
  assert.equal(mission.scopeKey(before.context), mission.scopeKey(after.context));
  assert.ok(after.warnings.includes('unrelated-event-ignored'));
});
test('event without a campaign ID is relevant to the normalized planet', () => {
  const raw = defense(); raw.planet.event = event({ campaignId: null });
  const out = forPlanet(parse([raw]), options());
  assert.equal(out.context.campaign, 'defense');
  assert.ok(out.context.eventKeys.includes('event:campaignId:unknown'));
});
test('relevant event identity/type/schedule and campaign changes require reconfirmation', () => {
  const base = forPlanet(parse([defense()]), options());
  const confirmation = engine.confirm(base.context, [choice]);
  for (const mutate of [r => r.planet.event.id++, r => r.planet.event.eventType++,
    r => r.planet.event.endTime = '2026-09-16T20:00:00Z', r => { r.id++; r.planet.event.campaignId++; }, r => r.type++]) {
    const raw = defense(); mutate(raw);
    const next = forPlanet(parse([raw]), options());
    assert.equal(engine.getPool(next.context, confirmation).status, 'needs-confirmation');
  }
});
test('unchanged refresh, metadata, cache source and unrelated planet updates retain confirmation', () => {
  const raw = defense(), before = forPlanet(parse([raw, row(8)]), options());
  const confirmation = engine.confirm(before.context, [choice]);
  raw.planet.name = 'Renamed display'; raw.planet.health = 23; raw.planet.position = { x: 0.2, y: 0.3 };
  const nextSnapshot = parse([row(8, 'Illuminate'), raw], NOW + 1000);
  const refreshed = forPlanet(nextSnapshot, options({ now: NOW + 1000 }));
  const cached = war.readCache(nextSnapshot, { now: NOW + 2000 }).snapshot;
  const offline = forPlanet(cached, options({ now: NOW + 2000, online: false }));
  for (const out of [refreshed, offline]) assert.equal(engine.getPool(out.context, confirmation).status, 'confirmed');
  assert.equal(offline.warStatus.confirmedCurrentlyPlayable, false);
  assert.equal(offline.warStatus.lastSuccessfulAt, new Date(NOW + 1000).toISOString());
});
test('stale and failed-refresh snapshots retain offline suggestions with dated warnings', () => {
  const snapshot = parse();
  for (const change of [{ now: NOW + war.FRESH_MS }, { online: false }, { refreshFailed: true }]) {
    const out = forPlanet(snapshot, options(change));
    assert.equal(out.warStatus.state, 'cached');
    assert.equal(out.warStatus.lastSuccessfulAt, new Date(NOW).toISOString());
    assert.ok(out.warnings.includes('war-data-not-confirmed-currently-playable'));
    assert.ok(engine.roll(out.context));
  }
});
test('bundled first-launch planets work offline without asserting current campaigns', () => {
  const snapshot = war.bundledSnapshot([{ name: 'Offline', faction: 'Terminids' }], 'test-bundle');
  const out = forPlanet(snapshot, options({ selectedPlanet: { name: 'offline' }, online: false }));
  assert.equal(out.context.planetKey, 'name:offline');
  assert.equal(out.context.campaign, 'unknown');
  assert.equal(out.warStatus.state, 'bundled');
  assert.equal(out.warStatus.lastSuccessfulAt, null);
  assert.ok(engine.roll(out.context));
});
test('editable offline planet cannot inject campaign events, rules or MO interpretations', () => {
  const snapshot = war.bundledSnapshot([{ name: 'Offline', faction: 'Terminids' }], 'test-bundle');
  const editable = [{ id: 'custom-world', name: 'Custom', faction: 'Automatons', context: 'defense', campaignIds: [5],
    event: event(), verifiedEventRules: ['unlock-everything'], majorOrder: 'Defense mission' }];
  const out = forPlanet(snapshot, options({ editable, selectedPlanet: { id: 'custom-world' } }));
  assert.equal(out.context.campaign, 'unknown');
  assert.deepEqual(out.context.campaignIds, []);
  assert.deepEqual(out.context.eventKeys, []);
  assert.deepEqual(out.context.verifiedEventRules, []);
  assert.ok(engine.roll(out.context));
});
test('legacy cached planets remain useful but do not supply missing war context', () => {
  const snapshot = war.readCache({ updatedAt: new Date(NOW).toISOString(), planets: [{ name: 'Old', faction: 'Automatons' }] }, { now: NOW }).snapshot;
  const out = forPlanet(snapshot, options({ selectedPlanet: { name: 'Old' } }));
  assert.equal(out.context.campaign, 'unknown');
  assert.ok(out.warnings.includes('offline-planet-lacks-war-context'));
  assert.ok(engine.roll(out.context));
  assert.equal(forPlanet({ ...snapshot, source: 'live' }, options({ selectedPlanet: { name: 'Old' } })).reason, 'invalid-war-snapshot');
});
test('disabled, absent and ambiguous selections cannot be resurrected by old selected objects', () => {
  const raw = row(), other = row(8); raw.planet.disabled = true;
  assert.equal(forPlanet(parse([raw, other]), options()).reason, 'planet-not-eligible');
  assert.equal(forPlanet(parse([other]), options()).reason, 'planet-no-longer-in-pool');
  const sameName = row(8); sameName.planet.name = 'Planet 7';
  assert.equal(forPlanet(parse([row(), sameName]), options({ selectedPlanet: { name: 'Planet 7' } })).reason, 'ambiguous-legacy-planet');
});
test('ID wins over name; legacy name-only selection resolves only an unambiguous current planet', () => {
  const snapshot = parse();
  const old = forPlanet(snapshot, options({ selectedPlanet: { name: ' PLANET 7 ' } }));
  assert.equal(old.context.planetKey, 'id:7');
  assert.equal(forPlanet(snapshot, options({ selectedPlanet: { id: 999, name: 'Planet 7' } })).reason, 'planet-no-longer-in-pool');
  assert.equal(forPlanet(snapshot, options({ selectedPlanet: { id: '7' } })).context.planetKey, 'id:7');
});
test('mixed ID/name-only offline duplicates do not make a legacy selection unambiguous', () => {
  const snapshot = war.bundledSnapshot([{ name: 'Offline', faction: 'Terminids' }], 'test-bundle');
  const editable = [{ name: 'Same', faction: 'Terminids' }, { id: 'custom', name: 'Same', faction: 'Automatons' }];
  assert.equal(forPlanet(snapshot, options({ editable, selectedPlanet: { name: 'Same' } })).reason, 'ambiguous-legacy-planet');
  assert.equal(forPlanet(snapshot, options({ editable, selectedPlanet: { id: 'custom' } })).context.faction, 'Automatons');
});
test('shared ownership adapter respects ID and legacy-name opt-outs, including disabled duplicates', () => {
  const snapshot = parse();
  for (const editable of [[{ id: '7', enabled: false }], [{ name: 'Planet 7', enabled: false }],
    [{ id: '7', enabled: true }, { id: '7', enabled: false }]]) {
    const out = forPlanet(snapshot, options({ editable }));
    assert.equal(out.reason, 'planet-not-eligible');
    assert.equal(engine.roll(out.context), null);
  }
});
test('conflicting or unresolved enemy rows fail closed without guessing raw owner', () => {
  const a = row(), b = row(); b.faction = 'Illuminate';
  const out = forPlanet(parse([a, b, row(8)]), options());
  assert.equal(out.reason, 'planet-not-eligible');
  assert.equal(engine.roll(out.context), null);
});
test('missing/corrupt/future snapshots cannot become an apparently live context', () => {
  for (const snapshot of [null, {}, { schemaVersion: 2 }, [], { ...clone(parse()), planets: [] },
    { ...clone(parse()), fetchedAt: '2099-01-01T00:00:00Z' }, { ...clone(parse()), source: 'official-live' }]) {
    const out = forPlanet(snapshot, options());
    assert.equal(out.context.active, false);
    assert.equal(out.warStatus.state, 'unavailable');
    assert.equal(engine.roll(out.context), null);
  }
});
test('selected event deadlines remain available after snapshot freshness expires', () => {
  const snapshot = parse([defense()]);
  const out = forPlanet(snapshot, options({ now: NOW + war.FRESH_MS }));
  assert.equal(out.nextRecheckAt, '2026-09-16T19:00:00.000Z');
  assert.equal(forPlanet(snapshot, options({ now: Date.parse(END) })).nextRecheckAt, null);
});
test('invalid clocks/difficulty/connectivity/preferences reject without coercion', () => {
  for (const change of [{ now: NaN }, { now: Infinity }, { now: 'now' }, { difficulty: '7' }, { difficulty: 11 },
    { online: 'false' }, { refreshFailed: 1 }, { editable: {} }, { editable: [null] }, { editable: new Array(1) },
    { editable: [{ id: '7', enabled: 'false' }] }, { editable: [{ id: '7', active: 1 }] }]) assert.throws(() => forPlanet(parse(), options(change)), TypeError);
  assert.equal(engine.getPool(forPlanet(parse(), options({ difficulty: null })).context).status, 'needs-context');
});
test('inputs remain unchanged and returned context/status/warnings are immutable', () => {
  const snapshot = clone(parse([defense()])), settings = options({ editable: [{ id: '7', enabled: true }] });
  const before = clone({ snapshot, settings }), out = forPlanet(snapshot, settings);
  assert.deepEqual({ snapshot, settings }, before);
  for (const value of [out, out.context, out.context.eventKeys, out.warStatus, out.warnings]) assert.ok(Object.isFrozen(value));
});
test('browser modules compose offline without Electron or network', () => {
  const sandbox = vm.createContext({ structuredClone });
  for (const name of ['planet-selection', 'war-snapshot', 'war-planet-pool', 'mission-selection', 'mission-context']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/' + name + '.js'), 'utf8'), sandbox);
  }
  const out = sandbox.HD2MissionContext.forPlanet(clone(parse([defense()])), options());
  assert.equal(out.context.campaign, 'defense');
  assert.equal(out.context.faction, 'Automatons');
});
