/* M2 integration checks for an explicitly isolated, fresh automation profile.
 * Both exports are self-contained so a runner can serialize them through CDP.
 * This module does not launch a process, choose a profile or open native dialogs.
 */
async function rendererGearPhase(identityReview) {
  const checks = [];
  const assert = (condition, label) => {
    if (!condition) throw new Error(`GEAR SMOKE: ${label}`);
    checks.push(label); console.log(`GEAR SMOKE PASS: ${label}`);
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const keys = ['primaries', 'sidearms', 'throwables', 'stratagems', 'boosters'];
  const categories = { primaries: 'primary', sidearms: 'sidearm', throwables: 'throwable', stratagems: 'stratagem', boosters: 'booster' };
  const rows = () => keys.flatMap(key => state.items[key].map(item => ({ key, item })));
  const additions = () => rows().filter(({ item }) => item.introducedIn === '1.1.2');
  const find = id => rows().find(({ item }) => item.id === id)?.item;
  const control = key => [...document.querySelectorAll('#newGearContent [data-gear-control]')].find(element => element.dataset.gearControl === key);
  const click = key => {
    const element = control(key);
    if (!element || element.disabled) throw new Error(`GEAR SMOKE: missing/disabled control ${key}`);
    element.click();
  };
  const waitFor = async (predicate, label, timeout = 25000) => {
    const started = Date.now();
    while (!predicate()) {
      if (Date.now() - started > timeout) throw new Error(`GEAR SMOKE timeout: ${label}`);
      await new Promise(resolve => setTimeout(resolve, 40));
    }
  };
  const decodeImage = async source => {
    assert(!/^https?:/i.test(source), `artwork is bundled locally: ${source.split('/').pop()}`);
    await new Promise((resolve, reject) => {
      const image = new Image();
      const timer = setTimeout(() => reject(new Error(`GEAR SMOKE image timeout: ${source}`)), 10000);
      image.onload = () => { clearTimeout(timer); image.naturalWidth > 0 && image.naturalHeight > 0 ? resolve() : reject(new Error(`Empty artwork: ${source}`)); };
      image.onerror = () => { clearTimeout(timer); reject(new Error(`GEAR SMOKE image failed: ${source}`)); };
      image.src = source;
    });
  };

  await bootStateReady;
  await preloadItemVisuals();
  assert(identityReview?.schemaVersion === 1 && identityReview.merges?.length === 2, 'runner supplied two complete retired catalog snapshots for a genuine 202-row legacy fixture');
  await waitFor(() => !isApiPlanetSyncInProgress(), 'initial planet refresh');
  const originalAlert = window.alert;
  const alerts = [];
  window.alert = message => alerts.push(String(message));
  // Safety tripwire in addition to the runner's explicit isolated user-data path.
  assert(state.cards.length === 0, 'fresh isolated profile starts without historical Results');
  assert(additions().length === 5, 'catalog exposes exactly five 1.1.2 gear additions');
  assert(additions().every(({ item }) => item.owned === false && item.enabled === false), 'all five additions start unowned and excluded');
  assert(rows().filter(({ item }) => item.introducedIn !== '1.1.2').length === 200 && rows().length === 205, 'fresh catalog has 200 unique legacy items plus five opt-in additions');
  assert(identityReview.merges.every(merge => find(merge.canonicalId)?.legacyIds?.includes(merge.retiredItem.id) && !find(merge.retiredItem.id)), 'both retired duplicate IDs remain compatibility identities, never extra rollable rows');
  assert(!document.querySelector('#newGearNotice').hidden, 'fresh launch displays the catalog review notice');
  document.querySelector('#btnReviewNewGear').click();
  assert(document.querySelector('#newGearPanel').open && document.querySelector('#tab-items').style.display !== 'none', 'Review new gear opens the Armory panel');

  const freshItems = clone(state.items);
  const newIds = additions().map(({ item }) => item.id);
  const primary = additions().find(({ key }) => key === 'primaries').item;
  const primaryId = primary.id;
  const warbondIds = additions().filter(({ item }) => item.acquisition?.kind === 'warbond').map(({ item }) => item.id);
  const rewardIds = additions().filter(({ item }) => item.acquisition?.kind === 'campaign-reward').map(({ item }) => item.id);
  assert(warbondIds.length === 4 && rewardIds.length === 1, 'Warbond contains four rollable additions; campaign reward is separate');
  const rewardId = rewardIds[0];
  const orbital = state.items.stratagems.find(item => item.name === 'Orbital Gas Strike');
  assert(orbital && orbital.id !== rewardId && find(rewardId).name === 'Eagle Gas Airstrike', 'Orbital Gas Strike is retained separately from Eagle Gas Airstrike');
  assert(additions().every(({ item }) => typeof item.id === 'string' && Array.isArray(item.aliases) && item.acquisition?.sourceUrl && item.acquisition?.verifiedAt), 'new items carry stable IDs, aliases and reviewed acquisition provenance');

  const imageElements = [...document.querySelectorAll('#newGearContent .newGearRow img, #newGearContent .newGearCover')];
  assert(imageElements.length === 6, 'new gear panel renders all five item images and the Warbond cover');
  for (const image of imageElements) await decodeImage(image.currentSrc || image.src);
  assert(imageElements.every(image => !/placeholder/i.test(image.currentSrc || image.src)), 'new gear images and cover do not use placeholder paths');
  for (const { key, item } of additions()) {
    const visual = getItemVisual(item.name, categories[key]);
    assert(visual && !/placeholder/i.test(visual.src || visual.assetPath || ''), `${item.name} resolves a non-placeholder reel visual`);
  }

  assert(control(`${primaryId}:enabled`).disabled, 'Include in rolls is disabled while a new item is unowned');
  click(`${primaryId}:owned`);
  assert(find(primaryId).owned === true && find(primaryId).enabled === false, 'Owned checkbox does not silently include the item');
  click(`${primaryId}:enabled`);
  assert(find(primaryId).owned === true && find(primaryId).enabled === true, 'Include checkbox opts the owned item into rolls');
  const ownership = window.HD2CSMCatalogState;
  const eligibilityBefore = clone(state.items.primaries);
  state.items.primaries.forEach(item => ownership.setEnabled(item, item.id === primaryId));
  assert(JSON.stringify(enabledNames(state.items.primaries)) === JSON.stringify([find(primaryId).name]), 'forced primary pool contains only the selected new primary');
  assert(rollLoadout('M2-FORCED-PRIMARY').primary === find(primaryId).name, 'actual loadout selection can roll the opted-in new primary deterministically');
  state.items.primaries = eligibilityBefore;
  renderItems();
  click(`${primaryId}:enabled`);
  assert(find(primaryId).owned === true && find(primaryId).enabled === false, 'turning Include off preserves ownership');
  click(`${primaryId}:enabled`);
  click(`${primaryId}:owned`);
  assert(find(primaryId).owned === false && find(primaryId).enabled === false && control(`${primaryId}:enabled`).disabled, 'clearing ownership also clears inclusion and disables its control');

  const oldFlags = JSON.stringify(rows().filter(({ item }) => item.introducedIn !== '1.1.2').map(({ item }) => [item.id, item.owned, item.enabled]));
  click('enable-castellans-creed');
  assert(warbondIds.every(id => find(id).owned && find(id).enabled), 'Warbond bulk enable selects all four declared-unlocked items');
  assert(find(rewardId).owned === false && find(rewardId).enabled === false, 'Warbond bulk enable never grants the campaign reward');
  assert(JSON.stringify(rows().filter(({ item }) => item.introducedIn !== '1.1.2').map(({ item }) => [item.id, item.owned, item.enabled])) === oldFlags, 'Warbond bulk action leaves every legacy gear flag unchanged');

  const beforeEmpty = clone(state.items);
  keys.forEach(key => state.items[key].forEach(item => ownership.setOwned(item, false)));
  assert(keys.every(key => enabledNames(state.items[key]).length === 0), 'all-disabled or unowned lists remain empty, without a hidden fallback');
  const emptyRoll = rollLoadout('M2-EMPTY-POOLS');
  assert(emptyRoll === null, 'actual loadout helper rejects empty required gear pools without drawing excluded gear');
  renderSpin();
  assert(!document.querySelector('#gearPoolWarning').hidden && getEmptyGearSlots().length === 5, 'empty gear slots receive a visible actionable warning');
  state.items = beforeEmpty;

  // Reconstruct all 202 historical records, including both now-retired duplicates.
  // Name-only, pre-ownership records deliberately conflict across each pair.
  const legacyItems = clone(freshItems);
  keys.forEach(key => {
    legacyItems[key] = legacyItems[key].filter(item => item.introducedIn !== '1.1.2').map((item, index) => {
      const legacy = { ...item, enabled: index % 3 !== 0 };
      for (const field of ['id', 'owned', 'aliases', 'legacyIds', 'acquisition', 'introducedIn']) delete legacy[field];
      return legacy;
    });
  });
  const retiredFixtures = identityReview.merges.map(merge => {
    const canonical = find(merge.canonicalId);
    const key = keys.find(group => categories[group] === merge.retiredItem.type);
    assert(canonical && key && merge.retiredItem.id !== canonical.id, `${merge.retiredItem.id} has a distinct category-matching canonical target`);
    const canonicalLegacy = legacyItems[key].find(item => item.name === canonical.name);
    assert(!!canonicalLegacy, `${canonical.name} exists independently in the reconstructed old fixture`);
    const retired = { ...clone(merge.retiredItem), enabled: !canonicalLegacy.enabled, legacyFixtureNote: `Recover original ${merge.retiredItem.name}` };
    for (const field of ['id', 'owned', 'aliases', 'legacyIds', 'acquisition', 'introducedIn']) delete retired[field];
    legacyItems[key].push(retired);
    return { canonicalId: canonical.id, key, original: clone(retired) };
  });
  assert(keys.reduce((count, key) => count + legacyItems[key].length, 0) === 202, 'legacy import fixture genuinely contains all 202 old rows, including two retired duplicates');
  assert(retiredFixtures.every(spec => legacyItems[spec.key].some(item => item.name === spec.original.name)), 'both retired short names exist as independent historical fixture records');
  const aliasSource = keys.flatMap(key => DEFAULTS.items[key].map(item => ({ key, item }))).find(({ item }) => item.introducedIn !== '1.1.2' && !item.legacyIds?.length && item.aliases?.some(alias => ownership.normalizeName(alias) !== ownership.normalizeName(item.name)));
  assert(!!aliasSource, 'legacy catalog provides a real noncanonical alias fixture');
  const legacyAlias = aliasSource.item.aliases.find(alias => ownership.normalizeName(alias) !== ownership.normalizeName(aliasSource.item.name));
  const historical = normalizeCardRecord({
    ...rollLoadout('M2-HISTORICAL-SNAPSHOT'), id: 'm2-gear-history-fixture', createdAt: '2026-09-13T12:00:00.000Z',
    playerName: 'M2 Isolated History', difficulty: 7, statsLocked: true,
    statsLockedAt: '2026-09-13T12:05:00.000Z', majorOrderDone: true,
    stats: { kills: 250, accuracy: 75, deaths: 2, stims: 4, bulletCount: 1200, stratUses: 15, distanceKm: 3.5, blueSideObjCount: 2, extractedSafely: true },
    notes: 'Keep the recorded loadout name; catalog migration must not rewrite history.'
  });
  const cardField = { primaries: 'primary', sidearms: 'sidearm', throwables: 'throwable', boosters: 'booster' }[aliasSource.key];
  if (cardField) historical[cardField] = legacyAlias;
  else historical.stratagems[0] = legacyAlias;
  const legacyFixture = { items: legacyItems, cards: [historical], settings: { rememberedPlayerName: 'M2 Legacy Diver' } };
  applyImportedData(clone(legacyFixture));
  const historicalBaseline = JSON.stringify(state.cards);
  assert(rows().length === 205 && rows().filter(({ item }) => item.introducedIn !== '1.1.2').length === 200, '202 historical rows migrate to 200 unique legacy identities plus five excluded additions');
  assert(rows().filter(({ item }) => item.introducedIn !== '1.1.2').every(({ key, item }) => {
    const original = legacyItems[key].find(legacy => legacy.name === item.name);
    return original && item.enabled === original.enabled && item.owned === original.enabled;
  }), 'legacy import preserves every canonical enabled/disabled choice and derives ownership without OR-enabling duplicates');
  for (const spec of retiredFixtures) {
    const canonical = find(spec.canonicalId);
    assert(canonical.legacyAliasRecords?.some(record => JSON.stringify(record) === JSON.stringify(spec.original)), `${spec.original.name} conflicting original record remains fully recoverable`);
    assert(!rows().some(({ item }) => item.name === spec.original.name), `${spec.original.name} no longer independently weights the roll pool`);
  }
  assert(additions().every(({ item }) => !item.owned && !item.enabled), 'upgrading the 202-item legacy fixture does not opt into new gear');
  assert(state.settings.rememberedPlayerName === 'M2 Legacy Diver' && state.settings.catalogReviewVersion === '', 'legacy remembered player imports while new review status remains unset');

  const aliasFixture = clone(legacyFixture);
  const aliasRow = aliasFixture.items[aliasSource.key].find(item => item.name === aliasSource.item.name);
  aliasRow.name = legacyAlias; aliasRow.enabled = false; aliasRow.smokeCustomNote = 'Keep alias-source custom metadata';
  applyImportedData(clone(aliasFixture));
  assert(find(aliasSource.item.id).name === aliasSource.item.name && !find(aliasSource.item.id).enabled && !find(aliasSource.item.id).owned, 'legacy alias imports resolve to the canonical ID without enabling disabled equipment');
  assert(find(aliasSource.item.id).smokeCustomNote === aliasRow.smokeCustomNote, 'alias migration keeps arbitrary per-item user metadata');
  assert(JSON.stringify(state.cards) === historicalBaseline, 'catalog alias migration leaves normalized historical cards byte-for-byte unchanged');

  const duplicateFixture = clone(aliasFixture);
  duplicateFixture.items[aliasSource.key].push({ id: aliasSource.item.id, name: 'Outdated display label', owned: true, enabled: false, smokeCustomNote: 'Stable ID winner' });
  applyImportedData(clone(duplicateFixture));
  const duplicateWinner = find(aliasSource.item.id);
  assert(duplicateWinner.owned === true && duplicateWinner.enabled === false && duplicateWinner.smokeCustomNote === 'Stable ID winner', 'stable-ID duplicate wins deterministically without OR-enabling records');
  assert(duplicateWinner.legacyAliasRecords?.some(record => record.name === legacyAlias), 'discarded alias record remains recoverable in the migrated item');
  const once = clone(buildPersistedStatePayload());
  applyImportedData(clone(once));
  assert(JSON.stringify(state.items) === JSON.stringify(once.items), 're-importing the normalized payload is catalog-idempotent');
  assert(JSON.stringify(state.cards) === historicalBaseline, 'duplicate reconciliation and repeated import preserve historical snapshots');

  state.items.primaries.push({ name: 'M2 Session-only Custom', enabled: true, owned: true, id: 'custom:primary:m2-session-only-custom' });
  applyImportedData(clone(aliasFixture));
  assert(!rows().some(({ item }) => item.name === 'M2 Session-only Custom'), 'a second player import does not retain a prior session custom gear row');
  const importedCustom = clone(aliasFixture);
  importedCustom.items.primaries.push({ name: 'M2 Preserved Custom Primary', enabled: false, owned: true, note: { owner: 'isolated test fixture' } });
  applyImportedData(clone(importedCustom));
  const custom = state.items.primaries.find(item => item.name === 'M2 Preserved Custom Primary');
  assert(custom?.id?.startsWith('custom:primary:') && custom.owned === true && custom.enabled === false, 'custom import gains a stable ID while retaining owned-but-excluded state');

  // Exercise each real Add handler before export; identity must not wait for restart.
  switchTab('items');
  if (document.querySelector('#manualPoolBlock').hidden) document.querySelector('[data-target="manualPoolBlock"]').click();
  const modeSelect = document.querySelector('#itemsViewMode');
  modeSelect.value = 'category'; modeSelect.dispatchEvent(new Event('change', { bubbles: true }));
  const typeSelect = document.querySelector('#itemsTypeFilter');
  typeSelect.value = 'all'; typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
  const addControls = { primaries: 'Primary', sidearms: 'Sidearm', throwables: 'Throwable', stratagems: 'Strat', boosters: 'Booster' };
  const addViaUI = (key, name) => {
    const suffix = addControls[key];
    const field = document.querySelector(`#add${suffix}`);
    field.value = name; field.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector(`#btnAdd${suffix}`).click();
  };
  const addedCustomIds = [];
  for (const key of keys) {
    const name = `M2 UI Custom ${categories[key]}`;
    addViaUI(key, name);
    const added = buildPersistedStatePayload().items[key].find(item => item.name === name);
    assert(added?.id?.startsWith(`custom:${categories[key]}:`) && added.owned === true && added.enabled === true, `${categories[key]} Add creates a stable ID and explicit ownership in the immediate export payload`);
    addedCustomIds.push(added.id);
    const beforeDuplicate = JSON.stringify(state.items[key]);
    addViaUI(key, name);
    assert(JSON.stringify(state.items[key]) === beforeDuplicate, `${categories[key]} Add rejects repeated custom names without changing roll weight`);
  }
  const beforeKnownDuplicate = JSON.stringify(state.items);
  addViaUI(aliasSource.key, aliasSource.item.name);
  assert(JSON.stringify(state.items) === beforeKnownDuplicate, 'Add rejects an existing canonical name without changing disabled ownership choices');
  addViaUI(aliasSource.key, legacyAlias);
  assert(JSON.stringify(state.items) === beforeKnownDuplicate, 'Add rejects an existing catalog alias without changing ownership or creating duplicate roll weights');
  assert(alerts.filter(message => /already in Armory/.test(message)).length === 7 && alerts.every(message => /existing choices were not changed/.test(message)), 'duplicate Add attempts explain where to edit ownership instead');

  renderItems(); switchTab('items'); document.querySelector('#newGearPanel').open = true;
  click(`${primaryId}:owned`); click(`${primaryId}:enabled`);
  click(`${rewardId}:owned`); // Deliberately keep this reward owned but excluded across restart.
  document.querySelector('#btnDismissNewGear').click();
  state.settings.rememberedPlayerName = 'M2 Restart Diver';
  const finalData = clone(buildPersistedStatePayload());
  assert(finalData.settings.catalogReviewVersion === '1.1.2' && document.querySelector('#newGearNotice').hidden, 'review dismissal is represented in saved settings and hides the notice');
  const browserExport = JSON.stringify({ ...finalData, cards: normalizeAndMigrateIncomingCards(clone(finalData.cards)).cards });
  const desktopEnvelope = JSON.stringify({ saveFormatVersion: 1, applicationVersion: '1.1.2', savedAt: '2026-09-13T12:00:00.000Z', exportedAt: '2026-09-13T12:00:00.000Z', data: JSON.parse(browserExport) });
  for (const [kind, raw] of [['browser payload', browserExport], ['desktop envelope fixture', desktopEnvelope]]) {
    const parsed = parseLegacyBrowserPayload(raw);
    assert(keys.every(key => parsed.items[key].every(item => item.id && typeof item.enabled === 'boolean' && typeof item.owned === 'boolean')) && parsed.settings.catalogReviewVersion === '1.1.2', `${kind} preserves IDs, ownership, inclusion and catalog review version`);
    applyImportedData(parsed);
    assert(JSON.stringify(state.items) === JSON.stringify(finalData.items) && JSON.stringify(state.cards) === historicalBaseline, `${kind} roundtrip preserves catalog choices and historical cards`);
  }
  saveState();
  if (desktopStorage) {
    const saved = await desktopStorage.saveState(buildPersistedStatePayload());
    assert(saved?.ok, 'final fixture is flushed through the real desktop storage bridge');
    const loaded = await desktopStorage.loadState();
    assert(JSON.stringify(loaded.data) === JSON.stringify(buildPersistedStatePayload()), 'desktop disk save reloads the exact final payload in-process');
  } else {
    assert(localStorage.getItem(STORAGE_KEY) === JSON.stringify(buildPersistedStatePayload()), 'browser storage contains the exact final fixture payload');
  }
  renderItems(); switchTab('items'); document.querySelector('#newGearPanel').open = true;
  document.querySelector('#newGearPanel').scrollIntoView({ block: 'start' });
  window.alert = originalAlert;
  return {
    checks, alerts, newIds, primaryId, rewardId, customId: custom.id, addedCustomIds,
    expectedItems: clone(state.items), expectedCards: clone(state.cards), expectedSettings: clone(buildPersistedStatePayload().settings),
    exportData: JSON.parse(browserExport),
    exportCoverage: 'Renderer payload serialization and parsing plus real desktop save/load. Native export dialog and browser download are runner-owned, not exercised here.',
    artworkCoverage: 'Six bundled images decoded; offline behavior requires runner-blocked HTTP/HTTPS.'
  };
}

async function rendererGearVerify(expected) {
  const checks = [];
  const assert = (condition, label) => { if (!condition) throw new Error(`GEAR RESTART: ${label}`); checks.push(label); console.log(`GEAR RESTART PASS: ${label}`); };
  await bootStateReady;
  await preloadItemVisuals();
  const keys = ['primaries', 'sidearms', 'throwables', 'stratagems', 'boosters'];
  const find = id => keys.flatMap(key => state.items[key]).find(item => item.id === id);
  assert(keys.every(key => JSON.stringify(state.items[key]) === JSON.stringify(expected.expectedItems[key])), 'separate process restores every gear ID, fact, ownership flag and include flag');
  assert(JSON.stringify(state.cards) === JSON.stringify(expected.expectedCards), 'separate process preserves normalized historical Results exactly');
  assert(JSON.stringify(buildPersistedStatePayload().settings) === JSON.stringify(expected.expectedSettings), 'separate process restores remembered player and catalog review status');
  assert(find(expected.primaryId)?.owned === true && find(expected.primaryId)?.enabled === true, 'opted-in new primary remains owned and included after restart');
  assert(find(expected.rewardId)?.owned === true && find(expected.rewardId)?.enabled === false, 'owned but excluded campaign reward remains excluded after restart');
  assert(find(expected.customId)?.owned === true && find(expected.customId)?.enabled === false, 'custom item ID and independent ownership survive restart');
  assert(expected.addedCustomIds.length === 5 && expected.addedCustomIds.every(id => find(id)?.owned === true && find(id)?.enabled === true), 'all five custom items created through Add retain their immediate IDs and ownership after restart');
  assert(!keys.some(key => state.items[key].some(item => item.name === 'M2 Session-only Custom')), 'discarded prior-player session gear does not reappear after restart');
  assert(document.querySelector('#newGearNotice').hidden, 'reviewed catalog does not repeat its startup notice after restart');
  switchTab('items'); document.querySelector('#newGearPanel').open = true;
  const checkbox = property => [...document.querySelectorAll('#newGearContent [data-gear-control]')].find(element => element.dataset.gearControl === `${expected.primaryId}:${property}`);
  assert(checkbox('owned')?.checked && checkbox('enabled')?.checked, 'Armory controls display restored new-item choices');
  document.querySelector('#newGearPanel').scrollIntoView({ block: 'start' });
  return { checks };
}

module.exports = { rendererGearPhase, rendererGearVerify };
