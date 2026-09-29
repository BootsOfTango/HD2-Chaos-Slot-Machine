(function (root, factory) {
  const common = typeof module === 'object' && module.exports;
  const api = factory(common ? require('./armory-preferences') : root.HD2ArmoryPreferences,
    common ? require('./mission-state') : root.HD2MissionState,
    common ? require('./solo-score') : root.HD2SoloScore,
    common ? require('./card-rules') : root.HD2CardRules);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HD2CSMTransfer = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (armory, missionState, soloScore, cardRules) {
  'use strict';
  const MAX_BYTES = 32 * 1024 * 1024;
  const MAX_DEPTH = 48, MAX_NODES = 250000, MAX_CARDS = 10000;
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
  function fail(message) { const error = new Error(message); error.friendly = true; throw error; }
  function checkSize(raw) {
    if (typeof raw !== 'string') fail('The JSON file must contain text.');
    if (raw.length > MAX_BYTES || new TextEncoder().encode(raw).length > MAX_BYTES) fail('This JSON is too large. Import and export support up to 32 MiB; no data was replaced.');
    return raw;
  }
  // Bound nesting before JSON.parse, including data inside quoted strings.
  function parseJson(raw) {
    checkSize(raw);
    let depth = 0, quoted = false, escaped = false;
    for (const character of raw) {
      if (quoted) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === '"') quoted = false;
      } else if (character === '"') quoted = true;
      else if (character === '{' || character === '[') {
        if (++depth > MAX_DEPTH) fail('This JSON is nested too deeply. No data was replaced.');
      } else if (character === '}' || character === ']') depth--;
    }
    try { return JSON.parse(raw); } catch (_) { fail('That file is not valid JSON.'); }
  }
  function checkTree(value) {
    let nodes = 0;
    const seen = new Set();
    const stack = [[value, 1]];
    while (stack.length) {
      const [node, depth, leaving] = stack.pop();
      if (leaving) { seen.delete(node); continue; }
      if (++nodes > MAX_NODES) fail('This JSON has too many fields. No data was replaced.');
      if (node === null || ['string', 'boolean'].includes(typeof node)) continue;
      if (typeof node === 'number' && Number.isFinite(node)) continue;
      if (typeof node !== 'object') fail('Only ordinary JSON values are supported.');
      if (depth > MAX_DEPTH) fail('This JSON is nested too deeply. No data was replaced.');
      if (seen.has(node)) fail('Repeated object references are not supported in a JSON transfer.');
      seen.add(node);
      stack.push([node, depth, true]);
      if (!Array.isArray(node) && ![Object.prototype, null].includes(Object.getPrototypeOf(node))) fail('Only ordinary JSON objects are supported.');
      const keys = Object.keys(node);
      if (nodes + stack.length + keys.length > MAX_NODES) fail('This JSON has too many fields. No data was replaced.');
      for (const key of keys) {
        if (forbidden.has(key)) fail(`Unsupported JSON key: ${key}. No data was replaced.`);
        stack.push([node[key], depth + 1]);
      }
    }
  }
  function validateData(data) {
    checkTree(data);
    if (!record(data)) fail('State data must be a JSON object.');
    if (!['items', 'cards', 'settings'].some(key => own(data, key))) fail('That JSON does not contain supported Chaos Slot Machine data.');
    if (own(data, 'items')) {
      if (!record(data.items)) fail('Items must be a JSON object.');
      for (const [group, rows] of Object.entries(data.items)) {
        if (!Array.isArray(rows)) fail(`Item group "${group}" must be a list.`);
        rows.forEach((row, index) => {
          if (!record(row)) fail(`Item ${group}[${index}] must be an object.`);
          if (!(typeof row.name === 'string' && row.name.trim()) && !(typeof row.id === 'string' && row.id.trim())) fail(`Item ${group}[${index}] needs a name or known stable ID.`);
          if (!['primaries', 'sidearms', 'throwables', 'stratagems', 'boosters'].includes(group) && !(typeof row.name === 'string' && row.name.trim())) fail(`Item ${group}[${index}] needs a name.`);
          for (const key of ['name', 'id', 'warbond', 'category', 'subgroup', 'faction', 'sector']) {
            if (row[key] != null && typeof row[key] !== 'string') fail(`Item ${group}[${index}].${key} must be text.`);
          }
          for (const key of ['enabled', 'owned']) if (own(row, key) && typeof row[key] !== 'boolean') fail(`Item ${group}[${index}].${key} must be true or false.`);
          for (const key of ['aliases', 'legacyIds']) if (own(row, key) && (!Array.isArray(row[key]) || row[key].some(value => typeof value !== 'string'))) fail(`Item ${group}[${index}].${key} must be a list of text.`);
        });
      }
    }
    if (own(data, 'cards')) {
      if (!Array.isArray(data.cards)) fail('Cards must be a list.');
      if (data.cards.length > MAX_CARDS) fail('A JSON transfer supports up to 10,000 cards. No data was replaced.');
      const ids = new Set();
      data.cards.forEach((card, index) => {
        if (!record(card)) fail(`Card ${index + 1} must be an object.`);
        if (card.id != null) {
          if (!['string', 'number'].includes(typeof card.id)) fail(`Card ${index + 1} ID must be text or a legacy number.`);
          const id = String(card.id);
          if (forbidden.has(id) || (id && ids.has(id))) fail(`Card ${index + 1} has a reserved or duplicate ID.`);
          if (id) ids.add(id);
        }
        for (const key of ['stats', 'lockedStatsSnapshot', 'loadout']) if (card[key] != null && !record(card[key])) fail(`Card ${index + 1}.${key} must be an object.`);
        if (card.planet != null && !record(card.planet) && typeof card.planet !== 'string') fail(`Card ${index + 1}.planet must be an object or legacy text.`);
      });
    }
    if (own(data, 'settings')) {
      if (!record(data.settings)) fail('Settings must be a JSON object.');
      if (data.settings.rememberedPlayerName != null && typeof data.settings.rememberedPlayerName !== 'string') fail('Remembered player name must be text.');
      if (own(data.settings, 'armoryBrowser')) armory.validate(data.settings.armoryBrowser);
    }
    missionState.validateData(data);
    soloScore.validateData(data);
    cardRules.validateData(data);
    return data;
  }
  function parse(raw) {
    const parsed = parseJson(raw);
    checkTree(parsed);
    if (record(parsed) && own(parsed, 'saveFormatVersion')) {
      const version = Number(parsed.saveFormatVersion);
      if (version > 2) { const error = new Error('This file uses a save format newer than this app supports. Update the app before importing it.'); error.code = 'UNSUPPORTED_SAVE_VERSION'; error.friendly = true; throw error; }
      if (![1,2].includes(version) || typeof parsed.applicationVersion !== 'string' || !parsed.applicationVersion.trim() || Number.isNaN(Date.parse(parsed.savedAt || parsed.exportedAt))) fail('The desktop export metadata is missing or invalid.');
      return validateData(parsed.data);
    }
    return validateData(parsed);
  }
  function serialize(data, envelope) {
    validateData(data);
    const value = envelope ? { ...envelope, data } : cardRules.envelope(data);
    checkTree(value);
    const raw = checkSize(JSON.stringify(value, null, 2));
    // Export success must mean the same transfer reader accepts its output.
    parse(raw);
    return raw;
  }
  return Object.freeze({ MAX_BYTES, MAX_DEPTH, MAX_NODES, MAX_CARDS, checkSize, validateData, parse, serialize });
});
