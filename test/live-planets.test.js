const test = require('node:test');
const assert = require('node:assert/strict');
const { parseActivePlanets, validateCachedPlanets, fetchActivePlanets } = require('../assets/live-planets');

test('fetchActivePlanets aborts slow live requests after timeout', async () => {
  const started = Date.now();
  await assert.rejects(
    fetchActivePlanets((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    }), { timeoutMs: 25 }),
    /aborted/i
  );
  assert.ok(Date.now() - started < 1000);
});

test('fetchActivePlanets surfaces offline failures for UI fallback', async () => {
  await assert.rejects(
    fetchActivePlanets(() => Promise.reject(new Error('network disabled')), { timeoutMs: 25 }),
    /network disabled/
  );
});

test('fetchActivePlanets rejects an empty successful response so callers can fall back', async () => {
  await assert.rejects(
    fetchActivePlanets(() => Promise.resolve({
      ok: true,
      json: async () => []
    }), { timeoutMs: 25 }),
    /did not include active planets/
  );
});

test('parseActivePlanets rejects invalid live data', () => {
  assert.throws(() => parseActivePlanets({ planet: { name: 'Bad' } }), /not a list/);
  assert.throws(() => parseActivePlanets([]), /did not include active planets/);
  assert.throws(() => parseActivePlanets([{ planet: null }]), /did not include active planets/);
  assert.throws(() => parseActivePlanets([{ planet: {} }]), /did not include active planets/);
  assert.throws(() => parseActivePlanets([{ planet: { name: '   ' } }]), /did not include active planets/);
  assert.throws(() => parseActivePlanets([{ planet: { name: 'Disabled', disabled: true } }]), /did not include active planets/);
});

test('parseActivePlanets normalizes valid live data for caching and display', () => {
  const active = parseActivePlanets([
    { planet: { name: 'Zeta', sector: 'Z', currentOwner: 'automatons', biome: { name: 'Moon' } } },
    { planet: { name: 'Alpha', sector: 'A', owner: 'Terminids', biome: { name: 'Jungle' } } },
    { planet: { name: 'Disabled', disabled: true } }
  ]);
  assert.deepEqual(active, [
    { name: 'Alpha', sector: 'A', faction: 'Terminids', biome: 'Jungle' },
    { name: 'Zeta', sector: 'Z', faction: 'Automatons', biome: 'Moon' }
  ]);
});


test('validateCachedPlanets accepts cached data with an updated date', () => {
  const cached = validateCachedPlanets({
    updatedAt: '2026-08-04T00:00:00.000Z',
    planets: [{ name: 'Cached', sector: 'Cache', faction: 'Illuminate', biome: 'Ice' }]
  });
  assert.deepEqual(cached, {
    updatedAt: '2026-08-04T00:00:00.000Z',
    planets: [{ name: 'Cached', sector: 'Cache', faction: 'Illuminate', biome: 'Ice' }]
  });
});

test('validateCachedPlanets rejects unusable cached data', () => {
  assert.equal(validateCachedPlanets(null), null);
  assert.equal(validateCachedPlanets({ updatedAt: '2026-08-04T00:00:00.000Z', planets: [] }), null);
  assert.equal(validateCachedPlanets({ updatedAt: 1785801600000, planets: [{ name: 'Cached' }] }), null);
  assert.equal(validateCachedPlanets({ updatedAt: 'not-a-timestamp', planets: [{ name: 'Cached' }] }), null);
  assert.equal(validateCachedPlanets({ updatedAt: '2026-08-04T00:00:00.000Z', planets: [null, {}, { name: '   ' }, { name: 123 }] }), null);
});

test('validateCachedPlanets discards blank records while preserving meaningful cached planets', () => {
  const cached = validateCachedPlanets({
    updatedAt: ' 2026-08-04T00:00:00.000Z ',
    planets: [
      null,
      { name: '   ' },
      { name: '  Valid Planet  ', sector: '  Orion  ', faction: 'automatons', biome: '  Ice  ' }
    ]
  });
  assert.deepEqual(cached, {
    updatedAt: '2026-08-04T00:00:00.000Z',
    planets: [{ name: 'Valid Planet', sector: 'Orion', faction: 'Automatons', biome: 'Ice' }]
  });
});
