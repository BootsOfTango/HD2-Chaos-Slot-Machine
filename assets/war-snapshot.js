// Immutable M3 snapshot normalization. Network/storage are owned by war-refresh.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./planet-selection'));
  else root.HD2WarSnapshot = factory(root.HD2PlanetSelection);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (selection) {
  'use strict';
  if (!selection) throw new Error('Load planet-selection before war-snapshot');
  const VERSION = 1, MAX_PLANETS = 5000, FRESH_MS = 5 * 60 * 1000, FUTURE_SKEW_MS = 60 * 1000;
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const integer = value => Number.isSafeInteger(value) && value >= 0;
  const text = (value, max = 160) => typeof value === 'string' && value.trim().length <= max ? value.trim() : '';
  function freeze(value) {
    if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  }
  function time(value) {
    if (typeof value !== 'string') return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,7})?(Z|[+-]\d{2}:\d{2})$/.exec(value.trim());
    if (!match) return null;
    const [, y, m, d, h, min, sec] = match.map((v, i) => i > 0 && i < 7 ? Number(v) : v);
    const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (m < 1 || m > 12 || d < 1 || d > days[m - 1] || h > 23 || min > 59 || sec > 59) return null;
    const n = Date.parse(value.trim());
    return Number.isFinite(n) ? new Date(n).toISOString() : null;
  }
  function clock(now) {
    if (!Number.isFinite(now) || !Number.isFinite(new Date(now).getTime())) throw new Error('Invalid snapshot clock');
    return now;
  }
  function fetchedTime(value, now) {
    const stamp = time(value);
    if (!stamp || Date.parse(stamp) > clock(now) + FUTURE_SKEW_MS) throw new Error('Invalid or future snapshot timestamp');
    return stamp;
  }
  function owner(value) {
    const enemy = selection.enemyFaction(value);
    if (enemy) return enemy;
    return typeof value === 'string' && ['humans', 'super earth'].includes(value.trim().toLowerCase()) ? 'Super Earth' : null;
  }
  function localized(value) { return text(value) || (object(value) ? text(value['en-US']) : ''); }
  function position(value) {
    return object(value) && Number.isFinite(value.x) && Number.isFinite(value.y) ? { x: value.x, y: value.y } : null;
  }
  function eventRecord(raw, at) {
    if (raw === null || raw === undefined) return null;
    if (!object(raw)) return { id: null, type: null, campaignId: null, faction: null, startAt: null, endAt: null, state: 'invalid', unknownFaction: true };
    const startAt = time(raw.startTime), endAt = time(raw.endTime);
    const invalid = (raw.startTime != null && !startAt) || (raw.endTime != null && !endAt) || (startAt && endAt && Date.parse(endAt) <= Date.parse(startAt));
    const state = invalid ? 'invalid' : endAt && Date.parse(endAt) <= at ? 'expired' : startAt && Date.parse(startAt) > at ? 'future' : startAt && endAt ? 'ongoing' : 'undated';
    return { id: integer(raw.id) ? raw.id : null, type: integer(raw.eventType) ? raw.eventType : null,
      campaignId: integer(raw.campaignId) ? raw.campaignId : null, faction: selection.enemyFaction(raw.faction),
      startAt, endAt, state, unknownFaction: raw.faction != null && !selection.enemyFaction(raw.faction) };
  }
  function resolveEnemy(planet, campaign, event) {
    const currentOwner = owner(planet.currentOwner);
    // v1 Event.faction identifies the initiator; Campaign.faction identifies
    // the combatant. Neither should be replaced by the human defender's owner.
    const relevant = event && ['ongoing', 'undated'].includes(event.state) && (event.campaignId === null || event.campaignId === campaign.id);
    if (relevant && event.unknownFaction) return { faction: null, factionSource: 'unresolved' };
    if (relevant && event.faction && (event.campaignId === null || event.campaignId === campaign.id)) return { faction: event.faction, factionSource: 'event' };
    const combatant = selection.enemyFaction(campaign.faction);
    if (combatant) return { faction: combatant, factionSource: 'campaign' };
    // Liberation campaigns report Humans as the campaigning faction. This is
    // recognized friendly context, not an unknown species or an enemy to roll.
    // Their opponent can be the enemy owner when no active event contradicts it.
    if (campaign.faction != null && owner(campaign.faction) !== 'Super Earth') return { faction: null, factionSource: 'unresolved' };
    // Missing/invalid active-event evidence must not be replaced with a guessed owner.
    if (event && event.state !== 'expired' && event.state !== 'future') return { faction: null, factionSource: 'unresolved' };
    const faction = selection.enemyFaction(currentOwner);
    return { faction, factionSource: faction ? 'owner' : 'unresolved' };
  }
  function basePlanet(p) {
    return { id: integer(p.index) ? p.index : null, name: localized(p.name), sector: text(p.sector) || '—',
      position: position(p.position), biome: localized(p.biome?.name) || text(p.biome) || '—',
      hazards: Array.isArray(p.hazards) ? [...new Set(p.hazards.slice(0, 32).map(h => localized(h?.name) || text(h)).filter(Boolean))] : [] };
  }
  function mergePlanets(rows, issues) {
    const grouped = new Map();
    for (const row of rows) {
      const key = selection.planetKey(row);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(row);
    }
    return [...grouped.values()].map(group => {
      const first = group[0];
      if (group.length > 1) issues.add('duplicate-planets');
      const conflicts = group.some(p => p.faction !== first.faction || p.owner !== first.owner || p.name !== first.name || JSON.stringify(p.event) !== JSON.stringify(first.event));
      if (conflicts) issues.add('conflicting-planets');
      return { ...first, active: group.every(p => p.active), enabled: group.every(p => p.enabled),
        faction: conflicts ? null : first.faction, factionSource: conflicts ? 'conflict' : first.factionSource,
        campaignIds: [...new Set(group.flatMap(p => p.campaignIds))].sort((a, b) => a - b),
        campaignTypes: [...new Set(group.flatMap(p => p.campaignTypes))].sort((a, b) => a - b) };
    }).sort((a, b) => (a.id ?? Infinity) - (b.id ?? Infinity) || a.name.localeCompare(b.name, 'en'));
  }
  function snapshot(source, origin, fetchedAt, planets, issues, bundleVersion = null) {
    return freeze({ schemaVersion: VERSION, source, origin, fetchedAt, bundleVersion, planets, issues: [...issues].sort() });
  }
  function normalizeCampaigns(data, { now = Date.now(), fetchedAt = new Date(now).toISOString() } = {}) {
    const stamp = fetchedTime(fetchedAt, now), at = Date.parse(stamp);
    if (!Array.isArray(data) || !data.length || data.length > MAX_PLANETS) throw new Error('Invalid or empty campaign list');
    const issues = new Set(), rows = [];
    for (const c of data) {
      const p = c?.planet;
      if (!object(c) || !object(p) || !integer(c.id) || !integer(p.index) || !localized(p.name) || (p.disabled != null && typeof p.disabled !== 'boolean')) {
        issues.add('malformed-campaign'); continue;
      }
      const event = eventRecord(p.event, at), resolved = resolveEnemy(p, c, event), currentOwner = owner(p.currentOwner);
      if (!resolved.faction) issues.add('unknown-enemy');
      if (event && event.state !== 'ongoing') issues.add('event-' + event.state);
      if (event && event.campaignId !== null && event.campaignId !== c.id) issues.add('event-campaign-mismatch');
      if (event?.faction && selection.enemyFaction(c.faction) && event.faction !== selection.enemyFaction(c.faction)) issues.add('event-campaign-faction-difference');
      rows.push({ ...basePlanet(p), owner: currentOwner, ...resolved, active: p.disabled !== true, enabled: true,
        context: currentOwner === 'Super Earth' && resolved.faction ? 'defense' : event && ['ongoing', 'undated'].includes(event.state) ? 'event' : selection.enemyFaction(currentOwner) ? 'liberation' : 'unknown',
        event, campaignIds: [c.id], campaignTypes: integer(c.type) ? [c.type] : [] });
    }
    const planets = mergePlanets(rows, issues);
    if (!selection.eligiblePlanets(planets).length) throw new Error('No usable active campaign planets');
    return snapshot('live', 'campaigns-v1', stamp, planets, issues);
  }
  function fallbackPlanets(data, source) {
    if (!Array.isArray(data) || data.length > MAX_PLANETS) throw new Error('Invalid fallback planet list');
    const rows = data.filter(p => object(p) && localized(p.name) && selection.enemyFaction(p.faction) &&
      (p.id == null || integer(p.id)) && (p.index == null || integer(p.index))).map(p => ({
      ...basePlanet({ ...p, index: integer(p.id) ? p.id : p.index }), owner: null,
      faction: selection.enemyFaction(p.faction), factionSource: source, active: p.active !== false, enabled: p.enabled !== false,
      context: 'unknown', event: null, campaignIds: [], campaignTypes: [],
    }));
    if (!rows.length) throw new Error('No usable fallback planets');
    return mergePlanets(rows, new Set());
  }
  function bundledSnapshot(planets, bundleVersion) {
    if (!text(bundleVersion)) throw new Error('Bundle version required');
    return snapshot('bundled', 'bundled', null, fallbackPlanets(planets, 'bundled'), ['not-confirmed-currently-playable'], text(bundleVersion));
  }
  function cachedPlanet(p, origin) {
    if (!object(p) || !text(p.name) || !(integer(p.id) || (p.id === null && origin === 'legacy-cache')) ||
        typeof p.active !== 'boolean' || typeof p.enabled !== 'boolean' ||
        !['event', 'campaign', 'owner', 'legacy', 'unresolved', 'conflict'].includes(p.factionSource) ||
        !['defense', 'liberation', 'event', 'unknown'].includes(p.context) ||
        !(p.faction === null || selection.enemyFaction(p.faction) === p.faction) ||
        !(p.owner === null || owner(p.owner) === p.owner) ||
        !Array.isArray(p.campaignIds) || p.campaignIds.length > MAX_PLANETS || !p.campaignIds.every(integer) ||
        !Array.isArray(p.campaignTypes) || p.campaignTypes.length > MAX_PLANETS || !p.campaignTypes.every(integer)) throw new Error('Invalid cached planet');
    let event = null;
    if (p.event !== null) {
      const e = p.event;
      if (!object(e) || !['ongoing', 'expired', 'future', 'undated', 'invalid'].includes(e.state) ||
          ![e.id, e.type, e.campaignId].every(v => v === null || integer(v)) ||
          !(e.faction === null || selection.enemyFaction(e.faction) === e.faction) || typeof e.unknownFaction !== 'boolean' ||
          ![e.startAt, e.endAt].every(v => v === null || time(v) === v)) throw new Error('Invalid cached event');
      event = { id: e.id, type: e.type, campaignId: e.campaignId, faction: e.faction, startAt: e.startAt, endAt: e.endAt, state: e.state, unknownFaction: e.unknownFaction };
    }
    return { ...basePlanet({ ...p, index: p.id }), owner: p.owner, faction: p.faction, factionSource: p.factionSource,
      active: p.active, enabled: p.enabled, context: p.context, event,
      campaignIds: [...p.campaignIds], campaignTypes: [...p.campaignTypes] };
  }
  // Pure copy-only decoder. The caller retains original bytes/key; unsupported
  // future versions must never be overwritten by the later persistence service.
  function readCache(value, { now = Date.now() } = {}) {
    try {
      clock(now);
      if (!object(value)) throw new Error('Invalid cache object');
      if (Object.hasOwn(value, 'schemaVersion') && value.schemaVersion !== VERSION) {
        return { status: 'unsupported', snapshot: null, reason: 'Unsupported war snapshot version; preserve original cache' };
      }
      if (!Object.hasOwn(value, 'schemaVersion')) {
        const stamp = fetchedTime(value.updatedAt, now);
        const planets = fallbackPlanets(value.planets, 'legacy');
        return { status: 'legacy', snapshot: snapshot('cache', 'legacy-cache', stamp, planets, ['legacy-cache-lacks-war-context', 'not-confirmed-currently-playable']) };
      }
      if (!['live', 'cache'].includes(value.source) || !['campaigns-v1', 'legacy-cache'].includes(value.origin) ||
          !Array.isArray(value.planets) || !value.planets.length || value.planets.length > MAX_PLANETS) throw new Error('Invalid cache envelope');
      const stamp = fetchedTime(value.fetchedAt, now), planets = value.planets.map(p => cachedPlanet(p, value.origin));
      if (new Set(planets.map(selection.planetKey)).size !== planets.length) throw new Error('Duplicate cache identities');
      if (!planets.some(p => p.faction)) throw new Error('No known enemies in cache');
      const issues = new Set(['not-confirmed-currently-playable']);
      if (Array.isArray(value.issues)) for (const issue of value.issues.slice(0, 32)) if (/^[a-z-]{1,80}$/.test(issue)) issues.add(issue);
      return { status: 'valid', snapshot: snapshot('cache', value.origin, stamp, planets, issues) };
    } catch (error) { return { status: 'invalid', snapshot: null, reason: error.message }; }
  }
  function updateSnapshot(previous, data, options) {
    try {
      const next = normalizeCampaigns(data, options);
      if (previous?.fetchedAt && Date.parse(next.fetchedAt) < Date.parse(previous.fetchedAt)) throw new Error('Older response cannot replace newer snapshot');
      return { accepted: true, snapshot: next, error: null };
    } catch (error) {
      // Previous must be a normalized/decoded snapshot, not raw unvalidated JSON.
      return { accepted: false, snapshot: previous || null, error: error.message };
    }
  }
  function snapshotStatus(value, { now = Date.now(), online = true, refreshFailed = false } = {}) {
    clock(now);
    if (!value) return { state: 'unavailable', confirmedCurrentlyPlayable: false, lastSuccessfulAt: null };
    const age = value.fetchedAt ? now - Date.parse(value.fetchedAt) : Infinity;
    const ended = value.planets.some(p => p.active && p.event?.endAt && ['ongoing', 'undated'].includes(p.event.state) && Date.parse(p.event.endAt) <= now);
    const fresh = value.source === 'live' && online && !refreshFailed && age >= -FUTURE_SKEW_MS && age < FRESH_MS && !ended;
    return { state: value.source === 'bundled' ? 'bundled' : fresh ? 'fresh' : 'cached', confirmedCurrentlyPlayable: fresh,
      lastSuccessfulAt: value.fetchedAt, label: fresh ? 'Live campaign snapshot' : 'Not confirmed currently playable' };
  }
  return { VERSION, MAX_PLANETS, FRESH_MS, time, normalizeCampaigns, bundledSnapshot, readCache, updateSnapshot, snapshotStatus };
});
