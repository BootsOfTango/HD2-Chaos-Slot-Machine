'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const war = require('../assets/war-snapshot');
const selection = require('../assets/planet-selection');
const STAMP = '2026-09-16T18:00:00.000Z', NOW = Date.parse(STAMP);
const options = { now: NOW, fetchedAt: STAMP };
const row = (index = 0, faction = 'Terminids') => ({ id: 100 + index, type: 1, faction,
  planet: { index, name: 'Planet ' + index, sector: 'Test sector', currentOwner: faction, disabled: false,
    position: { x: 0.25, y: -0.5 }, biome: { name: 'Tundra' }, hazards: [{ name: 'Ion storms' }], event: null } });
const event = (faction = 'Automatons') => ({ id: 20, eventType: 1, faction, campaignId: 100,
  startTime: '2026-09-16T17:00:00Z', endTime: '2026-09-16T19:00:00Z' });
const parse = rows => war.normalizeCampaigns(rows, options);
const json = value => JSON.parse(JSON.stringify(value));

test('v1 campaigns normalize IDs, coordinates, context and faction for all three enemies', () => {
  const s = parse([row(2, 'Illuminate'), row(0), row(1, 'automaton')]);
  assert.equal(s.schemaVersion, 1); assert.equal(s.source, 'live'); assert.equal(s.fetchedAt, STAMP);
  assert.deepEqual(s.planets.map(p => [p.id, p.faction]), [[0, 'Terminids'], [1, 'Automatons'], [2, 'Illuminate']]);
  assert.deepEqual(s.planets[0].position, { x: 0.25, y: -0.5 });
  assert.equal(s.planets[0].context, 'liberation'); assert.equal(s.planets[0].factionSource, 'campaign');
  assert.deepEqual(s.planets[0].hazards, ['Ion storms']); assert.deepEqual(s.planets[0].campaignIds, [100]);
});
test('human-owned defense uses active event initiator, not human owner', () => {
  const c = row(); c.planet.currentOwner = 'Humans'; c.planet.event = event(); c.faction = 'Automatons';
  const p = parse([c]).planets[0];
  assert.equal(p.owner, 'Super Earth'); assert.equal(p.faction, 'Automatons');
  assert.equal(p.factionSource, 'event'); assert.equal(p.context, 'defense'); assert.equal(p.event.state, 'ongoing');
});
test('human liberation campaigns resolve all three enemy owners without inventing human enemies', () => {
  const rows = ['Terminids', 'Automaton', 'Illuminate'].map((faction, i) => {
    const c = row(i, faction); c.faction = 'Humans'; return c;
  });
  const s = parse(rows);
  assert.deepEqual(selection.eligiblePlanets(s.planets).map(p => p.faction), ['Terminids', 'Automatons', 'Illuminate']);
  assert(s.planets.every(p => p.factionSource === 'owner' && p.context === 'liberation'));
  const c = row(); c.faction = 'Humans'; c.planet.currentOwner = 'Humans';
  assert.throws(() => parse([c]), /No usable/);
  c.planet.currentOwner = 'Terminids'; c.planet.event = { faction: 'Unknown' };
  assert.throws(() => parse([c]), /No usable/);
});
test('campaign enemy resolves human-owned defense without usable event evidence', () => {
  for (const data of [null, 'broken', { ...event(), startTime: 'invalid' }]) {
    const c = row(0, 'Illuminate'); c.planet.currentOwner = 'Super Earth'; c.planet.event = data;
    const p = parse([c]).planets[0];
    assert.equal(p.faction, 'Illuminate'); assert.equal(p.factionSource, 'campaign'); assert.equal(p.context, 'defense');
  }
});
test('active event takes precedence over conflicting campaign with visible issue', () => {
  const c = row(); c.planet.event = event('Illuminate');
  const s = parse([c]); assert.equal(s.planets[0].faction, 'Illuminate');
  assert(s.issues.includes('event-campaign-faction-difference'));
});
test('unrelated event cannot override campaign or poison it with unknown faction', () => {
  const c = row(); c.planet.event = { ...event('Unknown'), campaignId: 999 };
  const s = parse([c]); assert.equal(s.planets[0].faction, 'Terminids');
  assert(s.issues.includes('event-campaign-mismatch'));
});
test('expired and future events do not override campaign combatant', () => {
  for (const e of [{ ...event(), endTime: STAMP }, { ...event(), startTime: '2026-09-16T18:30:00Z' }]) {
    const c = row(); c.planet.event = e;
    const s = parse([c]); assert.equal(s.planets[0].faction, 'Terminids'); assert.equal(s.planets[0].factionSource, 'campaign');
    assert(s.issues.some(i => ['event-expired', 'event-future'].includes(i)));
  }
});
test('undated event is explicit and a current endpoint event can supply its initiator', () => {
  const c = row(); c.planet.currentOwner = 'Humans'; c.planet.event = { faction: 'Illuminate' };
  const s = parse([c]); assert.equal(s.planets[0].faction, 'Illuminate'); assert(s.issues.includes('event-undated'));
});
test('unknown active event or campaign faction is not guessed from an enemy owner', () => {
  const c = row(); c.planet.event = event('Unknown species');
  const other = row(1); other.faction = 'Unknown species';
  const s = parse([c, other, row(2, 'Illuminate')]);
  assert.deepEqual(selection.eligiblePlanets(s.planets).map(p => p.id), [2]);
  assert(s.issues.includes('unknown-enemy'));
});
test('recognized ownership fallback is only used when combatant and active event are absent', () => {
  const c = row(); delete c.faction;
  assert.equal(parse([c]).planets[0].factionSource, 'owner');
  c.planet.currentOwner = 'Humans'; assert.throws(() => parse([c]), /No usable/);
  c.planet.currentOwner = 'Terminids'; c.planet.event = { faction: '' }; assert.throws(() => parse([c]), /No usable/);
});
test('disabled campaigns cannot be selected but are retained as inactive context', () => {
  const c = row(); c.planet.disabled = true;
  const s = parse([c, row(1)]); assert.equal(s.planets[0].active, false);
  assert.deepEqual(selection.eligiblePlanets(s.planets).map(p => p.id), [1]);
  assert.throws(() => parse([c]), /No usable/);
});
test('malformed/oversized/empty responses cannot replace valid war data', () => {
  for (const value of [null, {}, [], [null], [{ planet: {} }], Array(war.MAX_PLANETS + 1).fill(row())]) assert.throws(() => parse(value));
  const bad = row(); bad.planet.disabled = 'false';
  const s = parse([bad, row(1)]); assert.deepEqual(s.planets.map(p => p.id), [1]); assert(s.issues.includes('malformed-campaign'));
});
test('English localized name and finite coordinates are handled without unsafe coercion', () => {
  const c = row(); c.planet.name = { 'en-US': '  Test World  ', 'de-DE': 'Welt' }; c.planet.position.x = Infinity;
  const p = parse([c]).planets[0]; assert.equal(p.name, 'Test World'); assert.equal(p.position, null);
  c.planet.name = { 'de-DE': 'Welt' }; assert.throws(() => parse([c]), /No usable/);
});
test('duplicates cannot bias odds; conflicting facts remove that planet from selection', () => {
  const s = parse([row(), row(), row(1)]); assert.equal(s.planets.length, 2); assert(s.issues.includes('duplicate-planets'));
  const conflict = row(0, 'Illuminate');
  const bad = parse([row(), conflict, row(1)]); assert.equal(bad.planets[0].factionSource, 'conflict');
  assert.deepEqual(selection.eligiblePlanets(bad.planets).map(p => p.id), [1]);
});
test('duplicate campaign IDs for one planet are merged without increasing roll weight', () => {
  const extra = row(); extra.id = 700; extra.type = 2;
  const s = parse([row(), extra]); assert.equal(s.planets.length, 1);
  assert.deepEqual(s.planets[0].campaignIds, [100, 700]); assert.deepEqual(s.planets[0].campaignTypes, [1, 2]);
});
test('snapshot and nested records are immutable and independent of raw response', () => {
  const data = [row()], before = json(data), s = parse(data);
  assert.deepEqual(data, before); data[0].planet.position.x = 9;
  assert.equal(s.planets[0].position.x, 0.25);
  assert.throws(() => { s.planets[0].position.x = 8; }, TypeError);
  assert.throws(() => { s.planets.push({}); }, TypeError);
});
test('bad and out-of-order updates keep the exact last valid snapshot', () => {
  const before = parse([row()]);
  for (const update of [war.updateSnapshot(before, [], options), war.updateSnapshot(before, [row()], { now: NOW, fetchedAt: '2026-09-16T17:00:00Z' })]) {
    assert.equal(update.accepted, false); assert.equal(update.snapshot, before); assert(update.error);
  }
  assert.equal(war.updateSnapshot(null, [], options).snapshot, null);
  const result = war.updateSnapshot(before, [row(2, 'Illuminate')], { now: NOW + 1000 });
  assert(result.accepted); assert.equal(result.snapshot.planets[0].id, 2); assert.equal(before.planets[0].id, 0);
});
test('canonical cache roundtrip retains context but never masquerades as live', () => {
  const c = row(); c.planet.currentOwner = 'Humans'; c.planet.event = event();
  const source = json(parse([c])), saved = json(source), result = war.readCache(source, { now: NOW });
  assert.equal(result.status, 'valid'); assert.equal(result.snapshot.source, 'cache');
  assert.deepEqual(result.snapshot.planets, source.planets); assert.deepEqual(source, saved);
  assert.equal(war.snapshotStatus(result.snapshot, { now: NOW }).confirmedCurrentlyPlayable, false);
});
test('legacy cache is copied, date preserved, and missing defense enemy is never invented', () => {
  const old = { updatedAt: STAMP, planets: [{ name: 'Legacy', faction: 'Automatons', sector: 'Old', enabled: false }, { name: 'Defense', faction: 'Super Earth' }] };
  const before = json(old), result = war.readCache(old, { now: NOW });
  assert.equal(result.status, 'legacy'); assert.equal(result.snapshot.fetchedAt, STAMP);
  assert.equal(result.snapshot.planets.length, 1); assert.equal(result.snapshot.planets[0].enabled, false);
  assert(result.snapshot.issues.includes('legacy-cache-lacks-war-context')); assert.deepEqual(old, before);
  assert.equal(war.readCache(json(result.snapshot), { now: NOW }).status, 'valid');
});
test('missing, damaged and future-version cache stays recoverable and is never silently upgraded', () => {
  for (const value of [null, {}, 'broken', { planets: [] }, { updatedAt: 'tomorrow', planets: [row()] }]) assert.equal(war.readCache(value, { now: NOW }).status, 'invalid');
  const future = { schemaVersion: 2, planets: [{ future: true }] }, before = json(future);
  const r = war.readCache(future, { now: NOW }); assert.equal(r.status, 'unsupported'); assert.equal(r.snapshot, null); assert.deepEqual(future, before);
});
test('corrupt cached identity, metadata, duplicates or timestamp is rejected', () => {
  const mutations = [s => { s.planets[0].id = -1; }, s => { s.planets[0].enabled = 'true'; }, s => { s.planets[0].faction = 'Unknown'; }, s => { s.planets[0].campaignIds = ['100']; }, s => { s.planets.push(s.planets[0]); }, s => { s.planets[0].event = {}; }, s => { s.fetchedAt = '2026-09-17T18:00:00Z'; }];
  for (const mutate of mutations) { const s = json(parse([row()])); mutate(s); assert.equal(war.readCache(s, { now: NOW }).status, 'invalid'); }
});
test('timestamps require real calendar dates and reject future cache clocks', () => {
  for (const date of ['2026-02-30T00:00:00Z', '2025-02-29T00:00:00Z', '2026-00-00T00:00:00Z', '2026-09-16', '2026-09-16T24:00:00Z']) assert.equal(war.time(date), null);
  assert.equal(war.time('2024-02-29T03:00:00+03:00'), '2024-02-29T00:00:00.000Z');
  assert.equal(war.time(' ' + STAMP + ' '), STAMP);
  assert.throws(() => war.normalizeCampaigns([row()], { now: NOW, fetchedAt: '2026-09-17T18:00:00Z' }), /future/);
});
test('freshness boundaries, offline/failure and defense expiry are explicit', () => {
  const s = parse([row()]);
  assert.equal(war.snapshotStatus(s, { now: NOW + war.FRESH_MS - 1 }).state, 'fresh');
  for (const opts of [{ now: NOW + war.FRESH_MS }, { now: NOW, online: false }, { now: NOW, refreshFailed: true }]) {
    const status = war.snapshotStatus(s, opts); assert.equal(status.state, 'cached'); assert.equal(status.confirmedCurrentlyPlayable, false);
  }
  const c = row(); c.planet.event = { ...event(), endTime: '2026-09-16T18:01:00Z' };
  assert.equal(war.snapshotStatus(parse([c]), { now: NOW + 60000 }).state, 'cached');
  assert.equal(war.snapshotStatus(null, { now: NOW }).state, 'unavailable');
});
test('bundled fallback works without dates/internet and preserves explicit opt-outs', () => {
  const s = war.bundledSnapshot([{ name: 'Offline', faction: 'Terminids' }, { name: 'Disabled', faction: 'Illuminate', enabled: false }], 'bundled-test');
  assert.equal(s.fetchedAt, null); assert.equal(s.bundleVersion, 'bundled-test');
  assert.equal(war.snapshotStatus(s, { now: NOW }).state, 'bundled');
  assert.equal(war.snapshotStatus(s, { now: NOW }).confirmedCurrentlyPlayable, false);
  assert.equal(selection.rollPlanet(s.planets, { random: () => 0 }).name, 'Offline');
});
test('extra remote properties are not copied into stored snapshots', () => {
  const c = row(); c.planet.html = '<script>bad</script>'; c.unneeded = 'ignore';
  assert.equal(parse([c]).planets[0].html, undefined);
  const s = json(parse([c])); s.planets[0].extra = { untrusted: true };
  assert.equal(war.readCache(s, { now: NOW }).snapshot.planets[0].extra, undefined);
});
test('browser modules work offline and the renderer loads the snapshot module', () => {
  const ctx = vm.createContext({ structuredClone });
  for (const name of ['planet-selection', 'war-snapshot']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/' + name + '.js'), 'utf8'), ctx);
  assert.equal(ctx.HD2WarSnapshot.normalizeCampaigns([row()], options).planets[0].faction, 'Terminids');
  assert.match(fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8'), /src=["']assets\/war-snapshot\.js/);
});
