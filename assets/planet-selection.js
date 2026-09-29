// Shared random/manual planet eligibility used by the live-war renderer.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HD2PlanetSelection = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const enemies = new Map([
    ['terminids', 'Terminids'], ['automatons', 'Automatons'],
    ['automaton', 'Automatons'], ['illuminate', 'Illuminate'],
  ]);
  function enemyFaction(value) {
    return typeof value === 'string' ? enemies.get(value.trim().toLowerCase()) || null : null;
  }
  function planetKey(planet) {
    if (!planet || typeof planet !== 'object' || Array.isArray(planet)) return null;
    if (planet.id !== undefined && planet.id !== null) {
      if (typeof planet.id === 'number') return Number.isSafeInteger(planet.id) && planet.id >= 0 ? 'id:' + planet.id : null;
      if (typeof planet.id === 'string' && planet.id.trim()) return 'id:' + planet.id.trim();
      return null;
    }
    return typeof planet.name === 'string' && planet.name.trim() ? 'name:' + planet.name.normalize('NFKC').trim().toLowerCase() : null;
  }
  // Caller supplies a normalized snapshot's active pool (or explicitly labeled
  // offline fallback). Never interpret an API owner as a defense's enemy here.
  // No preferred/previous faction argument: every recognized enemy is eligible.
  function eligiblePlanets(planets) {
    if (!Array.isArray(planets)) throw new TypeError('Planet pool must be an array');
    const groups = new Map();
    for (const planet of planets) {
      const key = planetKey(planet);
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(planet);
    }
    const result = [];
    for (const duplicates of groups.values()) {
      // A disabled duplicate must not resurrect an opt-out. Conflicting enemy
      // metadata is excluded instead of arbitrarily choosing a faction.
      if (duplicates.some(p => p.enabled === false || p.active === false)) continue;
      const valid = duplicates.filter(p => typeof p.name === 'string' && p.name.trim() && enemyFaction(p.faction));
      if (!valid.length || new Set(valid.map(p => enemyFaction(p.faction))).size !== 1) continue;
      const planet = structuredClone(valid[0]);
      planet.name = planet.name.trim();
      planet.faction = enemyFaction(planet.faction);
      result.push(planet);
    }
    return result;
  }
  function selectPlanet(planets, key) {
    // Manual selection and roulette use exactly the same eligibility rules.
    return eligiblePlanets(planets).find(planet => planetKey(planet) === key) || null;
  }
  function rollPlanet(planets, { currentPlanet = null, random = Math.random } = {}) {
    let pool = eligiblePlanets(planets);
    if (!pool.length) return null;
    const currentKey = planetKey(currentPlanet);
    if (currentKey && pool.length > 1) {
      const alternatives = pool.filter(planet => currentPlanet?.id == null
        ? planetKey({ name: planet.name }) !== currentKey : planetKey(planet) !== currentKey);
      if (alternatives.length) pool = alternatives;
    }
    const value = random();
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('Random value must be in [0, 1)');
    return pool[Math.floor(value * pool.length)];
  }
  return { enemyFaction, planetKey, eligiblePlanets, selectPlanet, rollPlanet };
});
