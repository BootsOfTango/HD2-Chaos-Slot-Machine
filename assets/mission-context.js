// Source-only bridge from normalized war snapshots to mission eligibility.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(
    require('./planet-selection'), require('./war-snapshot'), require('./war-planet-pool'), require('./mission-selection'));
  else root.HD2MissionContext = factory(root.HD2PlanetSelection, root.HD2WarSnapshot, root.HD2WarPlanetPool, root.HD2MissionSelection);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (selection, war, preferences, missions) {
  'use strict';
  if (!selection || !war || !preferences || !missions) throw new Error('Load planet, war and mission dependencies before mission-context');
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  function freeze(value) {
    if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  }
  function checkedSnapshot(raw, now) {
    if (!object(raw) || raw.schemaVersion !== war.VERSION) throw new Error('Unsupported war snapshot');
    if (raw.source === 'bundled') {
      if (raw.origin !== 'bundled') throw new Error('Invalid bundled snapshot');
      return war.bundledSnapshot(raw.planets, raw.bundleVersion);
    }
    if (raw.source === 'live' && raw.origin !== 'campaigns-v1') throw new Error('Legacy data cannot be live');
    const decoded = war.readCache(raw, { now });
    if (decoded.status !== 'valid') throw new Error('Invalid war snapshot');
    // readCache intentionally relabels data cached; retain live only for an
    // already normalized live input. Raw campaign responses are not accepted.
    return { ...decoded.snapshot, source: raw.source };
  }
  function eventState(event, now) {
    if (event.state === 'invalid' || (event.startAt && event.endAt && Date.parse(event.endAt) <= Date.parse(event.startAt))) return 'invalid';
    if (event.endAt && Date.parse(event.endAt) <= now) return 'expired';
    if (event.startAt && Date.parse(event.startAt) > now) return 'future';
    return event.startAt && event.endAt ? 'ongoing' : 'undated';
  }
  function forPlanet(rawSnapshot, { selectedPlanet = null, difficulty = null, editable = [], now = Date.now(), online = true, refreshFailed = false } = {}) {
    if (!Number.isFinite(now) || !Number.isFinite(new Date(now).getTime())) throw new TypeError('Invalid mission-context clock');
    if (typeof online !== 'boolean' || typeof refreshFailed !== 'boolean') throw new TypeError('Invalid connectivity state');
    // Validate difficulty independently of missing/invalid war data.
    const empty = missions.normalizeContext({ difficulty });
    if (!Array.isArray(editable) || editable.length > war.MAX_PLANETS || !Array.from(editable).every(p => object(p) &&
      (p.enabled === undefined || typeof p.enabled === 'boolean') && (p.active === undefined || typeof p.active === 'boolean'))) {
      throw new TypeError('Invalid planet preferences');
    }
    const warnings = [], deadlines = [];
    let snapshot, warStatus = war.snapshotStatus(null, { now });
    const result = (context, reason = null) => freeze({ context, warStatus, warnings: [...new Set(warnings)], reason,
      nextRecheckAt: deadlines.length ? new Date(Math.min(...deadlines)).toISOString() : null });
    if (!rawSnapshot) return result(empty, 'war-data-unavailable');
    try { snapshot = checkedSnapshot(rawSnapshot, now); }
    catch (_) { return result(empty, 'invalid-war-snapshot'); }
    warStatus = war.snapshotStatus(snapshot, { now, online, refreshFailed });
    if (!warStatus.confirmedCurrentlyPlayable) warnings.push('war-data-not-confirmed-currently-playable');
    if (warStatus.state === 'fresh') {
      const expires = Date.parse(snapshot.fetchedAt) + war.FRESH_MS;
      if (expires > now) deadlines.push(expires);
    }
    const key = selection.planetKey(selectedPlanet);
    if (!key || key.length > 220 || /[\u0000-\u001f\u007f]/.test(key)) return result(empty, 'choose-valid-planet');
    let pool;
    try { pool = preferences.pool(snapshot, editable); }
    catch (_) { return result(empty, 'invalid-planet-preferences'); }
    // A saved selection supplies identity only. Never trust its old faction,
    // event, campaign or enabled flag over the current shared planet pool.
    const matches = pool.filter(p => selectedPlanet.id == null
      ? selection.planetKey({ name: p.name }) === key : selection.planetKey(p) === key);
    if (!matches.length) return result(empty, 'planet-no-longer-in-pool');
    if (new Set(matches.map(selection.planetKey)).size !== 1) return result(empty, 'ambiguous-legacy-planet');
    const planet = selection.eligiblePlanets(matches)[0];
    if (!planet) return result(empty, 'planet-not-eligible');
    let faction = selection.enemyFaction(planet.faction), campaign = planet.context || 'unknown';
    let campaignIds = planet.campaignIds || [], eventKeys = [];
    // Editable offline planets may carry stale or arbitrary metadata. They may
    // still roll offline, but cannot assert current campaigns or event rules.
    const fallback = snapshot.source === 'bundled' || snapshot.origin === 'legacy-cache';
    if (fallback) {
      campaign = 'unknown'; campaignIds = [];
      warnings.push('offline-planet-lacks-war-context');
    } else {
      eventKeys = [...new Set(planet.campaignTypes)].sort((a, b) => a - b).map(type => 'campaign-type:' + type);
      const event = planet.event;
      const relevant = event && (event.campaignId === null || campaignIds.includes(event.campaignId));
      if (relevant) {
        const state = eventState(event, now);
        eventKeys.push(...['id', 'type', 'campaignId', 'faction', 'startAt', 'endAt'].map(field => 'event:' + field + ':' + (event[field] ?? 'unknown')),
          'event:state:' + state, 'event:unknownFaction:' + event.unknownFaction);
        for (const stamp of [event.startAt, event.endAt]) {
          if (stamp && Date.parse(stamp) > now) deadlines.push(Date.parse(stamp));
        }
        if (state !== event.state) {
          warnings.push('event-state-changed-since-snapshot');
          warStatus = { ...warStatus, state: 'cached', confirmedCurrentlyPlayable: false, label: 'Not confirmed currently playable' };
          warnings.push('war-data-not-confirmed-currently-playable');
        }
        if (state === 'ongoing' || state === 'undated') {
          // Same precedence as M3 normalization, evaluated at the current clock.
          if (event.unknownFaction) faction = null;
          else if (event.faction) faction = event.faction;
          campaign = state === 'ongoing' ? (planet.owner === 'Super Earth' ? 'defense' : 'event') : 'unknown';
          if (state === 'undated') warnings.push('event-timing-unknown');
        } else {
          // An expired attacker does not tell us who won or who now owns the
          // planet. Only retain enemy evidence independently resolved by M3.
          if (planet.factionSource === 'event') faction = null;
          if (campaign === 'defense' || campaign === 'event') campaign = 'unknown';
          warnings.push('event-' + state);
        }
      } else if (event) {
        warnings.push('unrelated-event-ignored');
        // M3 context can say "event" even for an unrelated event. Do not carry
        // that phase into mission restrictions; don't guess an alternative.
        if (campaign === 'event') campaign = 'unknown';
      } else if (campaign === 'defense') warnings.push('defense-without-event-timing');
    }
    if (campaign === 'unknown') warnings.push('unknown-campaign-context');
    try {
      return result(missions.normalizeContext({ planetKey: selection.planetKey(planet), faction, difficulty, campaign,
        active: planet.active !== false, enabled: planet.enabled !== false, campaignIds, eventKeys,
        // No verified production event rules exist yet. Neither MO text nor
        // arbitrary fields in editable/imported rows may enable one.
        verifiedEventRules: [] }));
    } catch (_) { return result(empty, 'unsupported-mission-context'); }
  }
  return Object.freeze({ forPlanet });
});
