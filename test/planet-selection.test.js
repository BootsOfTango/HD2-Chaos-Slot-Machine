'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { planetKey, enemyFaction, eligiblePlanets, selectPlanet, rollPlanet } = require('../assets/planet-selection');
const pool = () => [
  { id: 0, name: 'Bug World', faction: 'Terminids', active: true, position: { x: 1, y: 2 } },
  { id: 1, name: 'Bot World', faction: 'Automatons', active: true },
  { id: 2, name: 'Squid World', faction: 'Illuminate', active: true },
];
test('rolls span all factions uniformly per unique eligible planet', () => {
  const counts = [0, 0, 0];
  for (let i = 0; i < 300; i++) counts[rollPlanet(pool(), { random: () => (i + 0.5) / 300 }).id]++;
  assert.deepEqual(counts, [100, 100, 100]);
});
test('reroll excludes current planet and can cross to either other faction', () => {
  assert.equal(rollPlanet(pool(), { currentPlanet: pool()[0], random: () => 0 }).faction, 'Automatons');
  assert.equal(rollPlanet(pool(), { currentPlanet: pool()[0], random: () => 0.999 }).faction, 'Illuminate');
  assert.equal(rollPlanet(pool().slice(0, 1), { currentPlanet: pool()[0], random: () => 0 }).id, 0);
});
test('missing current ID does not remove another planet', () => {
  assert.equal(rollPlanet(pool(), { currentPlanet: { id: 100 }, random: () => 0 }).id, 0);
});
test('legacy name-only current planet is excluded after a live refresh adds IDs', () => {
  assert.equal(rollPlanet(pool(), { currentPlanet: { name: ' BUG WORLD ' }, random: () => 0 }).id, 1);
  assert.equal(rollPlanet(pool(), { currentPlanet: { id: 99, name: 'Bug World' }, random: () => 0 }).id, 0);
});
test('manual selection shares disabled/inactive/unknown filtering with roulette', () => {
  const input = [...pool(), { id: 3, name: 'Disabled', faction: 'Terminids', enabled: false }, { id: 4, name: 'Inactive', faction: 'Automatons', active: false }, { id: 5, name: 'Earth', faction: 'Super Earth' }, { id: 6, name: 'Unknown', faction: 'New enemy' }];
  assert.equal(eligiblePlanets(input).length, 3);
  for (const id of [3, 4, 5, 6]) assert.equal(selectPlanet(input, 'id:' + id), null);
  assert.equal(selectPlanet(input, 'id:1').faction, 'Automatons');
});
test('duplicate records cannot weight rolls or resurrect disabled choices', () => {
  assert.equal(eligiblePlanets([...pool(), ...pool()]).length, 3);
  assert.deepEqual(eligiblePlanets([...pool(), { ...pool()[0], enabled: false }]).map(p => p.id), [1, 2]);
  assert.deepEqual(eligiblePlanets([...pool(), { ...pool()[0], faction: 'Illuminate' }]).map(p => p.id), [1, 2]);
});
test('selection returns independent copies and never mutates source snapshots', () => {
  const input = pool(), before = structuredClone(input);
  const selected = rollPlanet(input, { random: () => 0 });
  selected.position.x = 99; selected.faction = 'changed';
  selectPlanet(input, 'id:0').position.y = 99;
  assert.deepEqual(input, before);
});
test('legacy names have stable keys while explicit IDs win including zero', () => {
  assert.equal(planetKey({ name: '  Legacy ' }), 'name:legacy');
  assert.equal(planetKey({ id: 0, name: 'Renamed' }), 'id:0');
  assert.equal(planetKey({ id: '0', name: 'Renamed' }), 'id:0');
  assert.equal(eligiblePlanets([{ name: 'Legacy', faction: 'automaton' }, { name: ' legacy ', faction: 'Automatons' }]).length, 1);
  for (const id of [-1, NaN, Infinity, {}, '', true]) assert.equal(planetKey({ id, name: 'Fallback must not conceal invalid ID' }), null);
});
test('empty or malformed pools never trigger network or random calls', () => {
  const input = [null, {}, [], { name: ' ' }, { id: 8, name: 123, faction: 'Terminids' }];
  assert.equal(rollPlanet(input, { random: () => { throw Error('should not be called'); } }), null);
  assert.throws(() => eligiblePlanets(null), /array/);
  assert.equal(enemyFaction('Super Earth'), null);
});
test('invalid random values are rejected rather than biasing the pool', () => {
  for (const value of [-0.1, 1, NaN, Infinity, '0']) assert.throws(() => rollPlanet(pool(), { random: () => value }), /\[0, 1\)/);
});
test('browser export works without Electron or Node and is loaded by the renderer', () => {
  const source = fs.readFileSync(path.join(__dirname, '../assets/planet-selection.js'), 'utf8');
  const context = vm.createContext({ structuredClone });
  vm.runInContext(source, context);
  assert.equal(context.HD2PlanetSelection.rollPlanet(pool(), { random: () => 0.9 }).faction, 'Illuminate');
  assert.match(fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8'), /src=["']assets\/planet-selection\.js/);
});
