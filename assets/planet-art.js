/* Original biome illustrations. Presentation only: no network, eligibility or save changes. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HD2PlanetArt = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const families = Object.freeze({
    forest: ['Temperate Forest', 'Deciduous Forest', 'Plains', 'Ionic Jungle', 'Ethereal Jungle'],
    ice: ['Tundra', 'Icy Glaciers'],
    desert: ['Desert Cliffs', 'Desert Dunes', 'Desert Oasis', 'Oasis Dunes', 'sandy_tutorial'],
    swamp: ['Basic Swamp', 'Haunted Swamp'],
    crimson: ['Ionic Crimson'],
    volcanic: ['Volcanic Jungle', 'Magma', 'Scorched Moor'],
    barren: ['Rocky Canyons', 'Boneyard', 'Deadlands'],
    moon: ['Moon'],
    acid: ['Acidic Badlands'],
    ocean: ['Super Earth'],
    urban: ['Metropolis'],
    hive: ['Hive World', 'Supercolony']
  });
  const aliases = new Map();
  const normalize = value => typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, ' ') : '';
  for (const [family, names] of Object.entries(families)) for (const name of names) aliases.set(normalize(name), family);
  const fallback = 'assets/planets/unknown.svg';
  const paths = Object.freeze([...Object.keys(families).map(key => `assets/planets/${key}.svg`), fallback]);
  function visualFor(planet) {
    const raw = typeof planet?.biome === 'string' ? planet.biome : planet?.biome?.name;
    const family = aliases.get(normalize(raw)) || 'unknown';
    return { src: `assets/planets/${family}.svg`, family,
      description: family === 'unknown' ? 'Illustrative planet • biome unknown' : `${raw.trim()} • illustrative globe, not an in-game image` };
  }
  function update(image, planet, rolling = false) {
    image.hidden = !planet;
    image.style.visibility = rolling ? 'hidden' : '';
    if (!planet) { image.removeAttribute('src'); image.removeAttribute('title'); return; }
    const visual = visualFor(planet);
    image.title = visual.description;
    // Adjacent text provides the planet name/biome. Avoid repeating it for screen readers.
    image.alt = '';
    image.dataset.planetArt = visual.family;
    if (image.getAttribute('src') !== visual.src) image.setAttribute('src', visual.src);
  }
  function createImage(planet, hero = false) {
    const image = document.createElement('img');
    image.className = hero ? 'planetGlobe planetGlobeHero' : 'planetGlobe';
    image.width = hero ? 104 : 56; image.height = hero ? 104 : 56;
    image.draggable = false;
    image.decoding = 'async';
    // Local-only, bounded fallback. If even the neutral asset is missing, keep the text usable.
    image.addEventListener('error', () => {
      if (image.getAttribute('src') !== fallback) {
        image.title = 'Illustrative planet • image unavailable'; image.setAttribute('src', fallback);
      } else image.hidden = true;
    });
    update(image, planet);
    return image;
  }
  function decorate(container, planet) {
    const text = document.createElement('div');
    text.append(...container.childNodes);
    container.classList.add('planetWithArt');
    container.replaceChildren(createImage(planet), text);
  }
  return Object.freeze({ visualFor, createImage, update, decorate, paths });
});
