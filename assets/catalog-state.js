(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HD2CSMCatalogState = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const GROUPS = Object.freeze({ primaries: 'primary', sidearms: 'sidearm', throwables: 'throwable', stratagems: 'stratagem', boosters: 'booster' });
  const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const normalizeName = name => String(name || '').normalize('NFKC').toLowerCase().replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

  function customId(category, name) {
    const normalized = normalizeName(name);
    if (normalized) return `custom:${category}:${normalized.replace(/ /g, '-')}`;
    // Non-Latin or symbol-only custom names still receive stable, distinct IDs.
    let hash = 2166136261;
    for (const character of String(name || '').normalize('NFKC').trim()) {
      hash ^= character.codePointAt(0);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return `custom:${category}:unnamed-${hash.toString(16).padStart(8, '0')}`;
  }

  function stableJson(value) {
    if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
    if (isRecord(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
    return JSON.stringify(value);
  }

  function withoutRecovery(record) {
    const result = clone(record);
    delete result.legacyAliasRecords;
    return result;
  }

  function withRecovery(result, chosen, discarded) {
    const records = [];
    function collect(record) {
      if (!isRecord(record)) return;
      records.push(withoutRecovery(record));
      if (Array.isArray(record.legacyAliasRecords)) record.legacyAliasRecords.forEach(collect);
    }
    if (Array.isArray(chosen.legacyAliasRecords)) chosen.legacyAliasRecords.forEach(collect);
    discarded.forEach(collect);
    const seen = new Set();
    const retained = records.map(clone).filter(record => {
      const key = stableJson(record);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    delete result.legacyAliasRecords;
    if (retained.length) result.legacyAliasRecords = retained;
    return result;
  }

  function validateRow(row, description) {
    if (!isRecord(row) || typeof row.name !== 'string' || !row.name.trim()) {
      throw new TypeError(`${description} must be an object with a nonempty name.`);
    }
  }

  function indexGroup(defaultRows, category) {
    const byId = new Map();
    const byLegacyId = new Map();
    const byName = new Map();
    const byAlias = new Map();
    for (const row of defaultRows) {
      validateRow(row, `${category} catalog item`);
      if (typeof row.id !== 'string' || !row.id.trim()) throw new TypeError(`${category} catalog item ${row.name} needs a stable ID.`);
      if (row.id !== row.id.trim() || !row.id.startsWith(`${category}:`) || !row.id.slice(category.length + 1).trim()) {
        throw new TypeError(`${category} catalog item ${row.name} needs a category-scoped stable ID.`);
      }
      if (byId.has(row.id)) throw new TypeError(`Duplicate ${category} catalog ID: ${row.id}`);
      byId.set(row.id, row);
      const nameKey = normalizeName(row.name);
      if (byName.has(nameKey)) throw new TypeError(`Ambiguous ${category} canonical name: ${row.name}`);
      byName.set(nameKey, row);
      for (const alias of Array.isArray(row.aliases) ? row.aliases : []) {
        const key = normalizeName(alias);
        if (!key) continue;
        // An ambiguous alias must not silently select either catalog item.
        const targets = byAlias.get(key) || new Set();
        targets.add(row);
        byAlias.set(key, targets);
      }
    }
    // Build canonical identities first so forward collisions cannot depend on row order.
    for (const row of defaultRows) {
      if (hasOwn(row, 'legacyIds') && !Array.isArray(row.legacyIds)) {
        throw new TypeError(`${category} catalog item ${row.name} legacyIds must be an array.`);
      }
      for (const legacyId of row.legacyIds || []) {
        if (typeof legacyId !== 'string' || legacyId !== legacyId.trim()
          || !legacyId.startsWith(`${category}:`) || !legacyId.slice(category.length + 1).trim()) {
          throw new TypeError(`${category} catalog item ${row.name} needs nonempty category-scoped legacy IDs.`);
        }
        if (byId.has(legacyId)) throw new TypeError(`Legacy ${category} ID collides with a canonical ID: ${legacyId}`);
        if (byLegacyId.has(legacyId)) throw new TypeError(`Duplicate ${category} legacy ID: ${legacyId}`);
        byLegacyId.set(legacyId, row);
      }
    }
    return { byId, byLegacyId, byName, byAlias };
  }

  function mergeGroup(defaultRows, savedRows, category, catalogIndex) {
    const { byId, byLegacyId, byName, byAlias } = catalogIndex;

    const matches = new Map();
    const custom = new Map();
    savedRows.forEach((original, index) => {
      if (!isRecord(original)) throw new TypeError(`${category} saved item ${index} must be an object with a nonempty name.`);
      const stableMatch = typeof original.id === 'string' ? byId.get(original.id) : null;
      const legacyMatch = typeof original.id === 'string' ? byLegacyId.get(original.id) : null;
      if (!stableMatch && !legacyMatch) validateRow(original, `${category} saved item ${index}`);
      const row = clone(original);
      const nameKey = normalizeName(row.name);
      let catalog = stableMatch || legacyMatch;
      let priority = stableMatch ? 4 : legacyMatch ? 3 : 0;
      if (!catalog && byName.has(nameKey)) { catalog = byName.get(nameKey); priority = 2; }
      if (!catalog && byAlias.get(nameKey)?.size === 1) { catalog = byAlias.get(nameKey).values().next().value; priority = 1; }
      const key = catalog ? catalog.id : (typeof row.id === 'string' && row.id.trim() ? row.id : customId(category, row.name));
      const target = catalog ? matches : custom;
      const candidate = { row, priority, index, catalog, key };
      const group = target.get(key) || [];
      group.push(candidate);
      target.set(key, group);
    });

    function choose(candidates, catalog = null) {
      const sorted = candidates.slice().sort((a, b) => b.priority - a.priority || a.index - b.index);
      const winner = sorted[0];
      const result = { ...clone(winner.row), ...(catalog ? clone(catalog) : {}), id: catalog?.id || winner.key };
      result.enabled = typeof winner.row.enabled === 'boolean' ? winner.row.enabled : catalog?.enabled === true;
      result.owned = typeof winner.row.owned === 'boolean' ? winner.row.owned : result.enabled;
      const discarded = sorted.slice(1).map(candidate => candidate.row);
      // Retired IDs and pre-ID names for merged equipment are replaced too, even
      // without a competing canonical row. Other name-only migrations stay unchanged.
      // Keep its full original identity/metadata available for recovery, never for rolling.
      if (winner.priority === 3 || (winner.priority === 1 && catalog?.legacyIds?.length)) discarded.unshift(winner.row);
      if (result.owned === false && result.enabled === true) {
        discarded.push(winner.row);
        result.enabled = false;
      }
      return withRecovery(result, winner.row, discarded);
    }

    return defaultRows.map(row => matches.has(row.id)
      ? choose(matches.get(row.id), row)
      : { ...clone(row), enabled: false, owned: false })
      .concat(Array.from(custom.values(), candidates => choose(candidates)));
  }

  // Gear only: the caller owns planets/non-gear merging, cards and settings.
  function mergeItems(defaultItems, savedItems = {}) {
    if (!isRecord(defaultItems) || !isRecord(savedItems)) throw new TypeError('Catalog and saved item groups must be objects.');
    const result = {};
    const indexes = {};
    // Validate the entire catalog before resolving anything, including fresh/missing groups.
    for (const [group, category] of Object.entries(GROUPS)) {
      const defaults = hasOwn(defaultItems, group) ? defaultItems[group] : [];
      if (!Array.isArray(defaults)) throw new TypeError(`Catalog group ${group} must be an array.`);
      indexes[group] = indexGroup(defaults, category);
    }
    for (const [group, category] of Object.entries(GROUPS)) {
      const defaults = defaultItems[group] || [];
      if (!hasOwn(savedItems, group)) { result[group] = clone(defaults); continue; }
      if (!Array.isArray(savedItems[group])) throw new TypeError(`Saved group ${group} must be an array.`);
      result[group] = mergeGroup(defaults, savedItems[group], category, indexes[group]);
    }
    return result;
  }

  function isEligible(item) { return isRecord(item) && item.enabled === true && item.owned !== false; }
  function setOwned(item, owned) {
    if (!isRecord(item) || typeof owned !== 'boolean') return false;
    item.owned = owned;
    if (!owned) item.enabled = false;
    return true;
  }
  function setEnabled(item, enabled) {
    if (!isRecord(item) || typeof enabled !== 'boolean' || (enabled && item.owned === false)) return false;
    item.enabled = enabled;
    return true;
  }

  return Object.freeze({ mergeItems, isEligible, setOwned, setEnabled, normalizeName });
});
