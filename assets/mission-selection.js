// Source-only M5 foundation. No network, storage, renderer or scoring side effects.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HD2MissionSelection = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 1;
  const FACTIONS = Object.freeze(['Terminids', 'Automatons', 'Illuminate']);
  const CAMPAIGNS = Object.freeze(['liberation', 'defense', 'event', 'unknown']);
  const SCORING_FAMILIES = Object.freeze(['Normal (40)', 'Eradication (15)', 'Blitz (12)', 'Defense (20min)', 'Rapid Acquisition (15)']);
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const copy = v => JSON.parse(JSON.stringify(v));
  function freeze(v) {
    if (v && typeof v === 'object') { Object.values(v).forEach(freeze); Object.freeze(v); }
    return v;
  }
  function requireThat(condition, message) { if (!condition) throw new TypeError(message); }
  function text(v, max = 160) {
    return typeof v === 'string' && v.length > 0 && v.length <= max && v === v.trim() && !/[\u0000-\u001f\u007f]/.test(v);
  }
  function keys(v, allowed, label) {
    requireThat(object(v) && Object.keys(v).every(k => allowed.includes(k)), 'Invalid ' + label + ' fields');
  }
  function list(v, predicate, max = 32) {
    return Array.isArray(v) && v.length <= max && Array.from(v).every(predicate) && new Set(v).size === v.length;
  }
  const token = v => text(v, 96) && /^[a-z0-9][a-z0-9:._-]*$/.test(v);
  const minutes = v => v === null || (Number.isInteger(v) && v >= 1 && v <= 180);
  const score = v => v === null || SCORING_FAMILIES.includes(v);

  // Adapter contract: normalized planet identity/enemy and explicitly reviewed
  // event-rule keys, never raw API ownership or Major Order prose. Snapshot age
  // and refresh timestamps are intentionally NOT confirmation identity.
  function normalizeContext(raw) {
    requireThat(object(raw), 'Mission context must be an object');
    const planetKey = raw.planetKey ?? null;
    requireThat(planetKey === null || (text(planetKey, 220) && /^(id|name):.+$/.test(planetKey)), 'Invalid planet key');
    const faction = raw.faction ?? null, difficulty = raw.difficulty ?? null;
    requireThat(faction === null || FACTIONS.includes(faction), 'Invalid resolved enemy faction');
    requireThat(difficulty === null || (Number.isInteger(difficulty) && difficulty >= 1 && difficulty <= 10), 'Invalid difficulty');
    const campaign = raw.campaign ?? 'unknown';
    requireThat(CAMPAIGNS.includes(campaign), 'Invalid campaign context');
    const active = raw.active ?? false, enabled = raw.enabled ?? true;
    requireThat(typeof active === 'boolean' && typeof enabled === 'boolean', 'Invalid planet eligibility');
    const campaignIds = raw.campaignIds ?? [], eventKeys = raw.eventKeys ?? [], verifiedEventRules = raw.verifiedEventRules ?? [];
    requireThat(list(campaignIds, v => Number.isSafeInteger(v) && v >= 0), 'Invalid campaign IDs');
    requireThat(list(eventKeys, v => text(v)), 'Invalid event keys');
    requireThat(list(verifiedEventRules, token), 'Invalid verified event rules');
    return freeze({ planetKey, faction, difficulty, campaign, active, enabled,
      campaignIds: [...campaignIds].sort((a, b) => a - b), eventKeys: [...eventKeys].sort(), verifiedEventRules: [...verifiedEventRules].sort() });
  }
  function contextProblems(context) {
    const reasons = [];
    if (!context.planetKey) reasons.push('choose-planet');
    if (!context.faction) reasons.push('unknown-enemy');
    if (!context.difficulty) reasons.push('choose-difficulty');
    if (!context.active || !context.enabled) reasons.push('planet-not-eligible');
    return reasons;
  }
  function scopeKey(context) {
    const c = normalizeContext(context);
    return JSON.stringify([VERSION, c.planetKey, c.faction, c.difficulty, c.campaign, c.campaignIds, c.eventKeys, c.verifiedEventRules]);
  }
  function validateCatalog(value) {
    keys(value, ['version', 'revision', 'coverage', 'reviewedAt', 'sources', 'missions'], 'mission catalog');
    requireThat(value.version === VERSION && token(value.revision) && value.coverage === 'partial', 'Unsupported mission catalog');
    requireThat(/^\d{4}-\d{2}-\d{2}$/.test(value.reviewedAt), 'Invalid catalog review date');
    requireThat(Array.isArray(value.sources) && value.sources.length > 0 && value.sources.length <= 100, 'Invalid catalog sources');
    const sourceIds = new Set();
    for (const source of value.sources) {
      keys(source, ['id', 'url', 'kind', 'access'], 'mission source');
      requireThat(token(source.id) && !sourceIds.has(source.id) && text(source.url, 500) && /^https:\/\/[^\s]+$/.test(source.url), 'Invalid mission source');
      requireThat(['community-reference', 'publisher'].includes(source.kind) && ['indexed-text', 'page'].includes(source.access), 'Invalid source provenance');
      sourceIds.add(source.id);
    }
    requireThat(Array.isArray(value.missions) && value.missions.length <= 500, 'Invalid mission rows');
    const ids = new Set();
    for (const row of value.missions) {
      keys(row, ['id', 'name', 'minutes', 'scoringFamily', 'factions', 'minDifficulty', 'maxDifficulty', 'campaigns', 'requiredEventRules', 'suggestionEnabled', 'sourceIds', 'notes'], 'mission row');
      requireThat(token(row.id) && row.id.startsWith('mission:') && !ids.has(row.id), 'Invalid or duplicate mission ID');
      ids.add(row.id);
      requireThat(text(row.name) && minutes(row.minutes) && score(row.scoringFamily), 'Invalid mission display/scoring metadata');
      requireThat(list(row.factions, v => FACTIONS.includes(v)) && row.factions.length > 0, 'Invalid mission factions');
      requireThat(Number.isInteger(row.minDifficulty) && Number.isInteger(row.maxDifficulty) && row.minDifficulty >= 1 && row.maxDifficulty <= 10 && row.minDifficulty <= row.maxDifficulty, 'Invalid mission difficulty range');
      requireThat(row.campaigns === null || (list(row.campaigns, v => CAMPAIGNS.includes(v) && v !== 'unknown') && row.campaigns.length > 0), 'Invalid mission campaign restrictions');
      requireThat(list(row.requiredEventRules, token) && typeof row.suggestionEnabled === 'boolean', 'Invalid mission event restrictions');
      requireThat(list(row.sourceIds, v => sourceIds.has(v)) && row.sourceIds.length > 0 && text(row.notes, 600), 'Missing mission evidence');
    }
    return freeze(copy(value));
  }
  function conflicts(row, c) {
    const reasons = [];
    if (!row.suggestionEnabled) reasons.push('confirmation-required');
    if (!row.factions.includes(c.faction)) reasons.push('faction');
    if (c.difficulty < row.minDifficulty || c.difficulty > row.maxDifficulty) reasons.push('difficulty');
    if (row.campaigns && !row.campaigns.includes(c.campaign)) reasons.push(c.campaign === 'unknown' ? 'unknown-campaign' : 'campaign');
    if (!row.requiredEventRules.every(rule => c.verifiedEventRules.includes(rule))) reasons.push('unverified-event-rule');
    return reasons;
  }
  function entry(row, provenance, ruleConflicts = []) {
    return { id: row.id, name: row.name, minutes: row.minutes, scoringFamily: row.scoringFamily, provenance, ruleConflicts };
  }
  function createEngine(rawCatalog) {
    const catalog = validateCatalog(rawCatalog), byId = new Map(catalog.missions.map(row => [row.id, row]));
    function validateChoices(choices) {
      requireThat(Array.isArray(choices) && choices.length <= 32 && Array.from(choices).every(object), 'Invalid confirmed shortlist');
      const ids = new Set();
      return choices.map(choice => {
        requireThat(object(choice) && token(choice.id) && !ids.has(choice.id), 'Invalid or duplicate confirmed mission');
        ids.add(choice.id);
        if (choice.kind === 'catalog') {
          keys(choice, ['kind', 'id'], 'catalog choice');
          requireThat(byId.has(choice.id), 'Unknown catalog mission');
          return { kind: 'catalog', id: choice.id };
        }
        keys(choice, ['kind', 'id', 'name', 'minutes', 'scoringFamily'], 'custom choice');
        requireThat(choice.kind === 'custom' && choice.id.startsWith('custom:') && text(choice.name) && minutes(choice.minutes) && score(choice.scoringFamily), 'Invalid custom mission');
        return copy(choice);
      });
    }
    function confirm(rawContext, choices) {
      const context = normalizeContext(rawContext);
      requireThat(contextProblems(context).length === 0, 'Choose an eligible planet, enemy and difficulty before confirmation');
      return freeze({ version: VERSION, catalogRevision: catalog.revision, scope: scopeKey(context), missions: validateChoices(choices) });
    }
    function getPool(rawContext, confirmation = null) {
      const c = normalizeContext(rawContext), reasons = contextProblems(c);
      const base = { label: 'Suggested compatible missions', provenance: 'suggested', exactLiveAvailability: false,
        catalogCoverage: catalog.coverage, warnings: ['partial-catalog', 'check-in-game-operation'], missions: [], reasons: [] };
      if (c.campaign === 'unknown') base.warnings.push('unknown-campaign-context');
      if (reasons.length) return freeze({ ...base, status: 'needs-context', reasons });
      if (confirmation !== null && confirmation !== undefined) {
        base.label = 'Player-confirmed operation'; base.provenance = 'player-confirmed';
        let choices;
        try {
          keys(confirmation, ['version', 'catalogRevision', 'scope', 'missions'], 'confirmation');
          requireThat(confirmation.version === VERSION && confirmation.catalogRevision === catalog.revision, 'Unsupported confirmation version or catalog revision');
          requireThat(confirmation.scope === scopeKey(c), 'Confirmation context changed');
          choices = validateChoices(confirmation.missions);
        } catch (error) {
          // Keep original bytes with the caller. Never silently fall back to
          // suggestions when a supplied confirmation is damaged or out of scope.
          return freeze({ ...base, status: 'needs-confirmation', reasons: [error.message] });
        }
        const missions = choices.map(choice => choice.kind === 'catalog'
          ? entry(byId.get(choice.id), 'player-confirmed', conflicts(byId.get(choice.id), c))
          : entry(choice, 'player-confirmed-custom'));
        return freeze({ ...base, status: missions.length ? 'confirmed' : 'empty-confirmed', missions,
          reasons: missions.length ? [] : ['no-missions-confirmed'] });
      }
      const missions = catalog.missions.filter(row => conflicts(row, c).length === 0).map(row => entry(row, 'suggested'));
      return freeze({ ...base, status: missions.length ? 'suggested' : 'empty-suggestions', missions,
        reasons: missions.length ? [] : ['no-reviewed-compatible-suggestions', 'confirm-your-in-game-operation'] });
    }
    function select(context, id, { confirmation = null } = {}) {
      return getPool(context, confirmation).missions.find(row => row.id === id) || null;
    }
    function roll(context, { confirmation = null, currentId = null, random = Math.random } = {}) {
      let pool = getPool(context, confirmation).missions;
      if (pool.length > 1) pool = pool.filter(row => row.id !== currentId);
      if (!pool.length) return null;
      const value = random();
      requireThat(typeof value === 'number' && Number.isFinite(value) && value >= 0 && value < 1, 'Random value must be in [0, 1)');
      return pool[Math.floor(value * pool.length)];
    }
    return Object.freeze({ getCatalog: () => copy(catalog), getPool, confirm, select, roll });
  }
  return Object.freeze({ VERSION, FACTIONS, SCORING_FAMILIES, normalizeContext, scopeKey, validateCatalog, createEngine });
});
