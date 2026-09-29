(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./planet-selection'));
  else root.HD2WarPlanetPool = factory(root.HD2PlanetSelection);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (selection) {
  'use strict';
  const nameKey = p => selection.planetKey({ name: p?.name });
  function preferencesFor(planet, editable) {
    const id = selection.planetKey(planet);
    const exact = planet.id != null ? editable.filter(p => p.id != null && selection.planetKey(p) === id) : [];
    return exact.length ? exact : editable.filter(p => p.id == null && nameKey(p) === nameKey(planet));
  }
  function pool(snapshot, editable = []) {
    const preferences = Array.isArray(editable) ? editable : [];
    // Offline custom/editable planets stay available, but cannot masquerade as
    // current campaigns when a valid live/cached campaign list is present.
    const source = snapshot.source === 'bundled' && preferences.length ? preferences : snapshot.planets;
    return source.map(planet => {
      const matches = preferencesFor(planet, preferences), preferred = matches[0];
      return { ...structuredClone(planet),
        enabled: matches.length ? matches.every(p => p.enabled !== false) : planet.enabled !== false,
        weather: planet.hazards?.length ? planet.hazards.join('; ') : preferred?.weather || planet.weather || '—',
        source: snapshot.source, fetchedAt: snapshot.fetchedAt, bundleVersion: snapshot.bundleVersion };
    });
  }
  function setEnabled(editable, planet, enabled) {
    if (!Array.isArray(editable) || !selection.planetKey(planet) || typeof enabled !== 'boolean') throw new TypeError('Invalid planet preference');
    const matches = preferencesFor(planet, editable);
    if (matches.length) {
      for (const p of matches) { p.enabled = enabled; if (planet.id != null) p.id = String(planet.id); }
    } else editable.push({ id: planet.id == null ? null : String(planet.id), name: planet.name, faction: planet.faction,
      sector: planet.sector || '—', biome: planet.biome || '—', weather: planet.weather || '—', enabled });
  }
  return { pool, setEnabled };
});
