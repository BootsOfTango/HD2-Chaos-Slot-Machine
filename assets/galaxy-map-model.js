// Pure galaxy model. No fetch, storage or DOM.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(
    require('./planet-selection'), require('./war-snapshot'), require('./war-planet-pool'), require('./galaxy-identities'), require('./planet-activity'));
  else root.HD2GalaxyMap = factory(root.HD2PlanetSelection, root.HD2WarSnapshot, root.HD2WarPlanetPool, root.HD2GalaxyIdentities, root.HD2PlanetActivity);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (selection, war, preferences, identities, activity) {
  'use strict';
  const VERSION = 1, MAX_PLANETS = war.MAX_PLANETS;
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const id = v => Number.isSafeInteger(v) && v >= 0;
  const text = v => typeof v === 'string' && v.trim().length <= 160 && !/[\u0000-\u001f\u007f]/.test(v) ? v.trim() : '';
  const localized = v => text(v) || (object(v) ? text(v['en-US']) : '');
  // Optional atlas enrichment; absent/ambiguous fields are never "no hazards".
  function conditions(row) {
    const biome = localized(row.biome?.name) || localized(row.biome) || null;
    const hazards = Array.isArray(row.hazards) && row.hazards.length <= 32 &&
      Array.from(row.hazards).every(h => localized(h?.name) || localized(h))
      ? [...new Set(row.hazards.map(h => localized(h?.name) || localized(h)))] : null;
    return { biome, hazards };
  }
  function validConditions(v) {
    return object(v) && Object.keys(v).length === 2 && Object.hasOwn(v,'biome') && Object.hasOwn(v,'hazards') &&
      (v.biome === null || (text(v.biome) === v.biome && !!v.biome)) &&
      (v.hazards === null || (Array.isArray(v.hazards) && v.hazards.length <= 32 &&
        Array.from(v.hazards).every(h => text(h) === h && !!h)));
  }
  function freeze(v) { if (v && typeof v === 'object') { Object.values(v).forEach(freeze); Object.freeze(v); } return v; }
  function clock(now) { if (!Number.isFinite(now) || !Number.isFinite(new Date(now).getTime())) throw new TypeError('Invalid map clock'); }
  function owner(v) {
    return selection.enemyFaction(v) || (typeof v === 'string' && ['humans', 'super earth'].includes(v.trim().toLowerCase()) ? 'Super Earth' : null);
  }
  // Supported display extent, not a claim that the API schema guarantees bounds.
  // New/outlier coordinates remain in the list instead of distorting the galaxy.
  function position(v) {
    return object(v) && Number.isFinite(v.x) && Number.isFinite(v.y) && Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1
      ? { x: v.x, y: v.y } : null;
  }
  function project(v, { size = 1000, padding = 40 } = {}) {
    if (!Number.isFinite(size) || size <= 0 || size > 100000 || !Number.isFinite(padding) || padding < 0 || padding >= size / 2) throw new TypeError('Invalid map viewport');
    const p = position(v); if (!p) return null;
    const radius = size / 2 - padding;
    // API X right / Y up -> SVG X right / Y down. No rotation or X mirroring.
    return freeze({ x: size / 2 + p.x * radius, y: size / 2 - p.y * radius });
  }
  function normalizeAtlas(raw, { now = Date.now(), observedAt = new Date(now).toISOString() } = {}) {
    clock(now);
    const stamp = war.time(observedAt);
    if (!stamp || Date.parse(stamp) > now + 60000) throw new TypeError('Invalid atlas observation date');
    if (!Array.isArray(raw) || !raw.length || raw.length > MAX_PLANETS) throw new TypeError('Invalid planet atlas');
    const ids = new Set(), issues = new Set(), planets = []; let linkCount = 0;
    for (const row of raw) {
      if (!object(row) || !id(row.index) || !localized(row.name) || (row.disabled != null && typeof row.disabled !== 'boolean')) {
        issues.add('malformed-atlas-row'); continue;
      }
      if (ids.has(row.index)) throw new TypeError('Duplicate atlas planet ID');
      ids.add(row.index);
      const point = position(row.position);
      if (!point) issues.add('missing-or-unsupported-position');
      let waypoints;
      if (row.waypoints != null) {
        if (!Array.isArray(row.waypoints) || row.waypoints.length > 256 || !Array.from(row.waypoints).every(id)) throw new TypeError('Invalid waypoints');
        waypoints = [...new Set(row.waypoints)].sort((a,b)=>a-b);
        linkCount += waypoints.length; if (linkCount > 20000) throw new TypeError('Too many waypoints');
      }
      planets.push({ id: row.index, name: localized(row.name), sector: text(row.sector) || null,
        position: point, owner: owner(row.currentOwner), disabled: row.disabled === true,
        ...(Object.hasOwn(row,'biome') || Object.hasOwn(row,'hazards') ? { conditions: conditions(row) } : {}),
        ...(waypoints ? { waypoints } : {}) });
    }
    if (!planets.length) throw new TypeError('No usable atlas planets');
    return freeze({ version: VERSION, origin: 'planets-v1', observedAt: stamp,
      planets: planets.sort((a, b) => a.id - b.id), issues: [...issues].sort() });
  }
  function checkedAtlas(raw, now) {
    if (raw == null) return null;
    if (!object(raw) || raw.version !== VERSION || raw.origin !== 'planets-v1' || !Array.isArray(raw.planets)) throw new TypeError('Unsupported atlas');
    // Revalidate even JSON-restored input; this does not mark it as live war data.
    if (Object.keys(raw).some(k => !['version','origin','observedAt','planets','issues'].includes(k)) ||
      !Array.isArray(raw.issues) || raw.issues.length > 32 || !Array.from(raw.issues).every(v => typeof v === 'string' && /^[a-z-]{1,80}$/.test(v)) ||
      !Array.from(raw.planets).every(p => object(p) && id(p.id) && typeof p.disabled === 'boolean' &&
      text(p.name) === p.name && p.name.length > 0 && (p.owner === null || owner(p.owner) === p.owner) &&
      (p.sector === null || (text(p.sector) === p.sector && p.sector.length > 0)) &&
      (p.position === null || (position(p.position) && Object.keys(p.position).every(k => ['x','y'].includes(k)))) &&
      (!Object.hasOwn(p,'waypoints') || (Array.isArray(p.waypoints) && p.waypoints.length <= 256 && Array.from(p.waypoints).every(id))) &&
      (!Object.hasOwn(p,'conditions') || validConditions(p.conditions)) &&
      Object.keys(p).every(k => ['id','name','sector','position','owner','disabled','waypoints','conditions'].includes(k)))) throw new TypeError('Invalid atlas rows');
    const value = normalizeAtlas(raw.planets.map(p => ({ index: p.id, name: p.name, sector: p.sector,
      position: p.position, currentOwner: p.owner, disabled: p.disabled, waypoints: p.waypoints,
      ...(p.conditions ? { biome:p.conditions.biome, hazards:p.conditions.hazards } : {}) })), { now, observedAt: raw.observedAt });
    return freeze({ ...value, issues: [...new Set([...raw.issues, ...value.issues])].sort() });
  }
  function checkedWar(raw, now) {
    if (!object(raw) || raw.schemaVersion !== war.VERSION) return null;
    try {
      if (raw.source === 'bundled' && raw.origin === 'bundled') return war.bundledSnapshot(raw.planets, raw.bundleVersion);
      if (!['live', 'cache'].includes(raw.source) || (raw.source === 'live' && raw.origin !== 'campaigns-v1')) return null;
      const decoded = war.readCache(raw, { now });
      return decoded.status === 'valid' ? { ...decoded.snapshot, source: raw.source } : null;
    } catch (_) { return null; }
  }
  function inputs({ snapshot = null, editable = [], now = Date.now(), online = true, refreshFailed = false } = {}) {
    clock(now);
    if (typeof online !== 'boolean' || typeof refreshFailed !== 'boolean') throw new TypeError('Invalid map connectivity');
    if (!Array.isArray(editable) || editable.length > MAX_PLANETS || !Array.from(editable).every(p => object(p) &&
      (p.enabled === undefined || typeof p.enabled === 'boolean') && (p.active === undefined || typeof p.active === 'boolean'))) throw new TypeError('Invalid planet preferences');
    const valid = checkedWar(snapshot, now);
    return { snapshot: valid, pool: valid ? preferences.pool(valid, editable) : [], now, online, refreshFailed };
  }
  function selectPlanet(key, options = {}) {
    // Always revalidate against current inputs, never a stale view or atlas marker.
    const { pool } = inputs(options);
    return selection.selectPlanet(pool, key);
  }
  function build(options = {}) {
    const { snapshot, pool, now, online, refreshFailed } = inputs(options);
    let activitySnapshot=null;
    try{if(options.activity?.snapshot)activitySnapshot=activity.validateSnapshot(options.activity.snapshot,{now});}catch(_){}
    const issues = new Set(), chosen = new Map(selection.eligiblePlanets(pool).map(p => [selection.planetKey(p), p]));
    let atlas = null;
    try { atlas = checkedAtlas(options.atlas, now); }
    catch (_) { issues.add('invalid-atlas'); }
    if (!snapshot) issues.add('war-data-unavailable');
    const indexed = new Map();
    for (const p of atlas?.planets || []) indexed.set('id:' + p.id, { metadata: p, campaigns: [] });
    for (const p of pool) {
      const key = selection.planetKey(p); if (!key) continue;
      if (!indexed.has(key)) indexed.set(key, { metadata: null, campaigns: [] });
      indexed.get(key).campaigns.push(p);
    }
    // Attach audited legacy aliases to atlas metadata for display only. Keep the
    // original selection key and return original pool data on click (no migration).
    const claims = new Map();
    for (const [key, entry] of indexed) {
      if (entry.metadata || !entry.campaigns.length) continue;
      const matches = entry.campaigns.map(p => identities?.resolve(p, atlas));
      if (!matches.every(p => p && p.id === matches[0].id)) continue;
      const target = 'id:' + matches[0].id;
      if (!claims.has(target)) claims.set(target, []);
      claims.get(target).push({key, entry});
    }
    for (const [target, entries] of claims) {
      const original = indexed.get(target);
      // Conflicting alias keys or an existing ID campaign stay separate; merging
      // could otherwise hide an opt-out or change the shared selector's pool.
      if (entries.length !== 1 || !original || original.campaigns.length) continue;
      entries[0].entry.metadata = original.metadata;
      entries[0].entry.reviewedAlias = true;
      indexed.delete(target);
    }
    const rows = [];
    for (const [key, { metadata, campaigns, reviewedAlias }] of indexed) {
      const selected = chosen.get(key), current = selected || campaigns[0];
      const name = text(current?.name) || metadata?.name;
      if (!name) continue;
      // Names not in the reviewed crosswalk remain unplaced/list-only.
      const fromWar = position(current?.position), point = fromWar || metadata?.position || null;
      if (!point) issues.add('missing-or-unsupported-position');
      const selectable = !!selected;
      // Keep atlas condition provenance separate from campaign eligibility. Do not
      // infer special enemy/SEAF activity from biome, owner, or mission suggestions.
      const useAtlas = !!metadata?.conditions && (!current || snapshot.source === 'bundled' || Date.parse(atlas.observedAt)>=Date.parse(snapshot.fetchedAt));
      const environment = useAtlas ? metadata.conditions : current ? conditions(current) : {biome:null,hazards:null};
      const environmentAt = useAtlas ? atlas.observedAt : snapshot?.fetchedAt || null;
      rows.push({ key, id: current?.id ?? metadata?.id ?? null, name,
        sector: (reviewedAlias ? metadata?.sector : text(current?.sector)) || metadata?.sector || null,
        position: point, screen: project(point), positionSource: fromWar ? 'war-snapshot' : point ? 'atlas' : null,
        owner: snapshot?.source !== 'bundled' && current ? owner(current.owner) : metadata?.owner || null,
        enemyFaction: selectable ? selected.faction : null,
        campaignContext: current?.context || 'unknown', selectable,
        availability: selectable ? snapshot.source === 'bundled' ? 'offline-choice' : 'campaign-choice' :
          campaigns.length ? 'excluded-or-unresolved' : 'not-in-campaign-pool',
        selected: options.selectedKey === key, hasCampaignRecord: campaigns.length > 0,
        environment: { ...environment, observedAt:environmentAt,
          source:useAtlas ? 'atlas' : current ? snapshot.source === 'bundled' ? 'bundled' : 'campaigns' : 'unavailable',
          recent:!!environmentAt && online && !(useAtlas ? options.atlasRefreshFailed : refreshFailed) && now >= Date.parse(environmentAt) && now-Date.parse(environmentAt)<war.FRESH_MS },
        specialActivity:'not-reported',
        activity:activity?.forPlanet(activitySnapshot,current?.id??metadata?.id??null,{now,
          online:online&&options.activity?.online!==false,
          failed:!!options.activity?.lastError||options.activity?.source!=='network'})||null });
    }
    rows.sort((a, b) => a.key.localeCompare(b.key, 'en'));
    // API links only; never infer edges from proximity, ownership or sector membership.
    const byKey = new Map(rows.filter(p=>p.id!=null).map(p=>['id:'+p.id,p])), edgeMap = new Map(), sectorMap = new Map();
    for (const p of atlas?.planets || []) for (const target of p.waypoints || []) {
      if (target === p.id) continue;
      const [a,b] = [p.id,target].sort((a,b)=>a-b), from = byKey.get('id:'+a), to = byKey.get('id:'+b);
      if (!from?.screen || !to?.screen) { issues.add('unresolved-waypoint'); continue; }
      const key = a+':'+b;
      if (!edgeMap.has(key)) edgeMap.set(key,{key,from:from.key,to:to.key,fromScreen:from.screen,toScreen:to.screen});
    }
    const sectorNames = [...new Set((atlas?.planets || []).map(a=>a.sector).filter(Boolean))];
    for (const p of rows) if (p.sector) {
      // Normalize only the redundant display suffix where the atlas confirms a
      // unique sector name (e.g. list-only Mars in Sol Sector). No ID inference.
      const matches = sectorNames.filter(s=>s.toLowerCase()===p.sector.toLowerCase().replace(/ sector$/, ''));
      if (matches.length===1) p.sector=matches[0];
      if (!sectorMap.has(p.sector)) sectorMap.set(p.sector,[]);
      sectorMap.get(p.sector).push(p);
    }
    const sectors = [...sectorMap].map(([name, members])=>{
      const placed = members.filter(p=>p.screen);
      return { name, keys:members.map(p=>p.key),
        labelPosition:placed.length ? {x:placed.reduce((sum,p)=>sum+p.screen.x,0)/placed.length,y:placed.reduce((sum,p)=>sum+p.screen.y,0)/placed.length} : null };
    }).sort((a,b)=>a.name.localeCompare(b.name,'en'));
    const status = war.snapshotStatus(snapshot, { now, online, refreshFailed });
    const atlasFresh = atlas && online && Date.parse(atlas.observedAt) <= now && now - Date.parse(atlas.observedAt) < war.FRESH_MS;
    return freeze({ version: VERSION, orientation: 'x-right-y-up', projection: { size: 1000, padding: 40, center: { x: 500, y: 500 } },
      planets: rows, selectableKeys: rows.filter(p => p.selectable).map(p => p.key),
      unplacedKeys: rows.filter(p => !p.screen).map(p => p.key), warStatus: status,
      connections:[...edgeMap.values()].sort((a,b)=>a.key.localeCompare(b.key,'en')), sectors,
      connectionsAvailable:!!atlas?.planets.some(p=>Array.isArray(p.waypoints)),
      atlasStatus: { state: atlas ? atlasFresh ? 'recent-observation' : 'cached-observation' : 'unavailable', observedAt: atlas?.observedAt || null },
      sectorBoundaries: null, exactTerritoryGeometry: false, exactMissionAvailability: false, issues: [...issues].sort() });
  }
  function validateAtlas(raw, { now = Date.now() } = {}) { clock(now); if (raw == null) throw new TypeError('Atlas required'); return checkedAtlas(raw, now); }
  return Object.freeze({ VERSION, normalizeAtlas, validateAtlas, project, build, selectPlanet });
});
