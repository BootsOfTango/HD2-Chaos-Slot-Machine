/* M2B duplicate-consolidation renderer checks. All exports are self-contained
 * for serialization through CDP. The runner owns isolated profiles, offline
 * interception, native file-backend checks and process launch/restart. */
async function rendererDedupPhase() {
  const checks = [];
  const assert = (condition, label) => {
    if (!condition) throw new Error(`DEDUP SMOKE: ${label}`);
    checks.push(label); console.log(`DEDUP SMOKE PASS: ${label}`);
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const keys = ['primaries', 'sidearms', 'throwables', 'stratagems', 'boosters'];
  const rowsFrom = items => keys.flatMap(key => items[key] || []);
  const rows = () => rowsFrom(state.items);
  const find = id => rows().find(item => item.id === id);
  const idList = items => rowsFrom(items).map(item => item.id).sort();
  const flags = items => rowsFrom(items).map(item => [item.id, item.owned, item.enabled]).sort((a, b) => a[0].localeCompare(b[0]));
  const specs = [
    { id: 'stratagem:sta-x3-w-a-s-p-launcher', legacyId: 'stratagem:wasp', legacy: 'Wasp', legacyAsset: 'assets/stratagems/support/wasp.svg' },
    { id: 'stratagem:orbital-ems-strike', legacyId: 'stratagem:ems-strike', legacy: 'EMS Strike', legacyAsset: 'assets/stratagems/support/ems-strike.svg' }
  ];
  const mortarId = 'stratagem:ems-mortar-sentry';
  const containsRecord = (item, expected) => Array.isArray(item?.legacyAliasRecords) && item.legacyAliasRecords.some(record => JSON.stringify(record) === JSON.stringify(expected));
  const decodeImage = async source => {
    assert(!!source && !/^https?:/i.test(source), `image is bundled locally: ${String(source).split('/').pop()}`);
    await new Promise((resolve, reject) => {
      const image = new Image();
      const timer = setTimeout(() => reject(new Error(`DEDUP image timeout: ${source}`)), 10000);
      image.onload = () => {
        clearTimeout(timer);
        image.naturalWidth > 0 && image.naturalHeight > 0 ? resolve() : reject(new Error(`Empty image: ${source}`));
      };
      image.onerror = () => { clearTimeout(timer); reject(new Error(`DEDUP image failed: ${source}`)); };
      image.src = source;
    });
  };
  const assertCatalogShape = label => {
    assert(rows().length === freshCount && new Set(rows().map(item => item.id)).size === freshCount, `${label}: exactly ${freshCount} unique current gear records`);
    assert(JSON.stringify(idList(state.items)) === JSON.stringify(freshIds), `${label}: current catalog IDs are unchanged`);
    assert(specs.every(spec => !find(spec.legacyId) && find(spec.id)), `${label}: retired IDs occur only in compatibility/recovery data`);
    assert(find(mortarId)?.name === 'EMS Mortar Sentry', `${label}: EMS Mortar Sentry remains separate equipment`);
  };

  await bootStateReady;
  await Promise.all([preloadItemVisuals(), loadItemImageDb()]);
  const originalAlert = window.alert;
  window.alert = () => {};
  assert(state.cards.length === 0, 'fresh isolated profile starts with no historical Results');
  const freshItems = clone(state.items);
  const freshIds = idList(freshItems);
  const freshCount = rowsFrom(DEFAULTS.items).length;
  const freshStratagemCount = DEFAULTS.items.stratagems.length;
  assert(freshCount === 206, 'bundled catalog contains 206 canonical gear records, including opt-in Hyena');
  assert(state.items.stratagems.length === freshStratagemCount, 'fresh stratagem count matches the bundled catalog');
  assertCatalogShape('fresh launch');
  const freshFlags = flags(freshItems);

  for (const spec of specs) {
    const item = find(spec.id);
    spec.canonical = item.name;
    spec.assetPath = getItemVisual(item.name, 'stratagem')?.src;
    assert(item.legacyIds?.includes(spec.legacyId), `${item.name} records its retired stable ID`);
    assert(item.aliases?.includes(spec.legacy), `${item.name} recognizes the legacy display name`);
    assert(item.owned && item.enabled, `${item.name} remains eligible under its unchanged fresh default`);
    assert(enabledNames(state.items.stratagems).filter(name => name === item.name).length === 1, `${item.name} has one eligible pool entry`);
    assert(!enabledNames(state.items.stratagems).includes(spec.legacy), `${spec.legacy} no longer adds a second roll weight`);
    assert(canonicalItemName(spec.legacy) === item.name, `${spec.legacy} resolves to the canonical analytics label`);
    for (const name of [item.name, spec.legacy]) {
      const visual = getItemVisual(name, 'stratagem');
      assert(visual?.src && !/placeholder/i.test(visual.src), `${name} resolves non-placeholder artwork`);
      assert(visual.src === spec.assetPath, `${name} resolves the same canonical local image`);
      await decodeImage(visual.src);
    }
  }
  const rollSamples = Array.from({ length: 64 }, (_, index) => rollLoadout(`M2B-DEDUP-ROLL-${index}`));
  assert(rollSamples.every(loadout => loadout && loadout.stratagems.length === 4), '64 real loadout selections still return four stratagems');
  assert(rollSamples.every(loadout => !loadout.stratagems.some(name => specs.some(spec => name === spec.legacy))), 'real rolls never return retired display-name duplicates');
  assert(rollSamples.every(loadout => new Set(loadout.stratagems.map(canonicalItemName)).size === 4), 'every sampled loadout contains four distinct canonical stratagems');
  assert(JSON.stringify(flags(state.items)) === JSON.stringify(freshFlags), 'artwork and actual loadout checks preserve every ownership/include choice');

  const extraStratagem = freshItems.stratagems.find(item => !specs.some(spec => spec.id === item.id) && item.id !== mortarId && item.enabled && item.owned).name;
  const mortarName = find(mortarId).name;
  const baseLoadout = rollSamples[0];
  const historyStratagems = [
    [specs[0].legacy, specs[1].legacy, mortarName, extraStratagem],
    [specs[0].canonical, specs[1].canonical, mortarName, extraStratagem],
    [specs[0].legacy, specs[0].canonical, specs[1].legacy, specs[1].canonical]
  ];
  const historicalCards = historyStratagems.map((stratagems, index) => {
    const loadout = { ...clone(baseLoadout), stratagems: clone(stratagems) };
    loadout.fingerprint = fingerprintLoadout(loadout);
    return normalizeCardRecord({
      ...loadout, id: `m2b-dedup-history-${index + 1}`, createdAt: `2026-09-14T13:0${index}:00.000Z`,
      seed: `M2B Duplicate History ${index + 1}`, playerName: 'M2B Dedup Fixture', planet: null, planetBiome: null,
      difficulty: 7, statsLocked: true, statsLockedAt: `2026-09-14T13:1${index}:00.000Z`, majorOrderDone: index !== 1,
      stats: { kills: 240 + index, accuracy: 72 + index, deaths: index, stims: 4, bulletCount: 1300 + index, stratUses: 16 + index, distanceKm: 3.5 + index, blueSideObjCount: index, extractedSafely: true },
      scoreRaw: 180 + index, scoreRawBase: 150 + index, grade: 80 + index,
      originalNote: `Keep old labels and fingerprint ${index + 1}.`, notes: `Keep old labels and fingerprint ${index + 1}.`,
      commentNotes: [{ id: `m2b-dedup-note-${index + 1}`, text: 'Do not rewrite a recorded loadout.', createdAt: '2026-09-14T13:30:00.000Z' }]
    });
  });
  // Use the app's established scoring engine before taking the baseline; this
  // is catalog migration coverage, not a change to existing import rescoring.
  state.cards = historicalCards;
  refreshLockedStatsBaseline();
  recalcGrades();
  const historicalBaseline = JSON.stringify(historicalCards);
  state.cards = [];
  refreshLockedStatsBaseline();
  assert(historicalCards.every(card => card.statsLocked && card.fingerprint === fingerprintLoadout(card) && Number.isFinite(card.scoreRaw) && card.grade > 0), 'historical fixtures have normalized locked stats, nonzero scores and original fingerprints');
  const assertHistory = label => {
    assert(JSON.stringify(state.cards) === historicalBaseline, `${label}: historical labels, IDs, fingerprints, locked stats, notes and scores remain byte-for-byte unchanged`);
    const beforeAnalytics = JSON.stringify(state.cards);
    const armory = buildArmoryStats(state.cards);
    const analytics = buildItemAnalytics(state.cards);
    for (const spec of specs) {
      const row = armory.get(spec.canonical);
      const detailedRows = analytics.itemStats.filter(item => item.slot === 'stratagem' && item.name === spec.canonical);
      assert(row?.rolledCount === 3 && row?.moSuccessCount === 2 && !armory.has(spec.legacy), `${label}: ${spec.canonical} Armory totals count each historical card once`);
      assert(detailedRows.length === 1 && detailedRows[0].total === 3 && detailedRows[0].moSuccess === 2, `${label}: ${spec.canonical} detailed analytics groups old/new aliases without double-counting one card`);
      assert(!analytics.itemStats.some(item => item.slot === 'stratagem' && item.name === spec.legacy), `${label}: no split detailed-analytics row remains for ${spec.legacy}`);
    }
    assert(armory.get(mortarName)?.rolledCount === 2 && analytics.itemStats.find(item => item.slot === 'stratagem' && item.name === mortarName)?.total === 2, `${label}: EMS Mortar statistics remain independent of Orbital EMS Strike`);
    assert(JSON.stringify(state.cards) === beforeAnalytics, `${label}: analytics are derived without mutating stored historical cards`);
  };

  // Both old and canonical rows were present in 1.1.3. Explicit canonical flags
  // must win, rather than an OR of legacy enablement silently granting equipment.
  const legacyItems = clone(freshItems);
  const retiredRows = specs.map((spec, index) => {
    const canonical = legacyItems.stratagems.find(item => item.id === spec.id);
    canonical.owned = false; canonical.enabled = false;
    canonical.dedupFixtureNote = `Canonical ownership choice ${index + 1}`;
    const retired = {
      ...clone(canonical), id: spec.legacyId, name: spec.legacy, aliases: [], assetPath: spec.legacyAsset,
      owned: true, enabled: true, dedupFixtureNote: { reason: 'Retain the complete retired row', index, custom: ['old', 'user', 'metadata'] }
    };
    delete retired.legacyIds;
    legacyItems.stratagems.push(retired);
    return clone(retired);
  });
  assert(rowsFrom(legacyItems).length === 208, 'synthetic compatibility fixture includes current Hyena plus both retired duplicate rows');
  const makeFixture = items => ({ items: clone(items), cards: clone(historicalCards), settings: { rememberedPlayerName: 'M2B Dedup Restart Diver', catalogReviewVersion: '1.1.2' } });
  applyImportedData(makeFixture(legacyItems));
  assertCatalogShape('207-record import');
  assert(JSON.stringify(flags(state.items)) === JSON.stringify(flags(legacyItems).filter(([id]) => !specs.some(spec => spec.legacyId === id))), '207-record import preserves every surviving canonical ownership/include choice');
  for (const [index, spec] of specs.entries()) {
    const item = find(spec.id);
    assert(item.owned === false && item.enabled === false, `${item.name} keeps explicit canonical exclusion despite an enabled retired duplicate`);
    assert(item.dedupFixtureNote === `Canonical ownership choice ${index + 1}`, `${item.name} keeps canonical custom metadata`);
    assert(containsRecord(item, retiredRows[index]), `${item.name} preserves the full original retired record for recovery`);
  }
  assertHistory('207-record import');

  const retiredOnly = clone(legacyItems);
  retiredOnly.stratagems = retiredOnly.stratagems.filter(item => !specs.some(spec => spec.id === item.id));
  applyImportedData(makeFixture(retiredOnly));
  assertCatalogShape('retired-only import');
  for (const [index, spec] of specs.entries()) {
    const item = find(spec.id);
    assert(item.owned === true && item.enabled === true, `${item.name} inherits eligible flags when only its retired record was saved`);
    assert(JSON.stringify(item.dedupFixtureNote) === JSON.stringify(retiredRows[index].dedupFixtureNote), `${item.name} preserves retired-only arbitrary user metadata`);
    assert(containsRecord(item, retiredRows[index]), `${item.name} retains the original retired-only identity in recovery data`);
  }
  assertHistory('retired-only import');

  // Retired stable IDs outrank names, including a misleading name that happens
  // to be a different canonical item. Also exercise a known ID with no name.
  const identityOnly = clone(retiredOnly);
  const idOnlyOriginals = [];
  specs.forEach((spec, index) => {
    const row = identityOnly.stratagems.find(item => item.id === spec.legacyId);
    if (index === 0) row.name = specs[1].canonical;
    else delete row.name;
    row.owned = index === 0; row.enabled = false;
    row.dedupFixtureNote = `Retired ID authority ${index + 1}`;
    idOnlyOriginals.push(clone(row));
  });
  applyImportedData(makeFixture(identityOnly));
  assertCatalogShape('ID-only/misleading-name import');
  specs.forEach((spec, index) => {
    const item = find(spec.id);
    assert(item.name === spec.canonical && item.owned === (index === 0) && item.enabled === false, `${spec.legacyId} resolves by identity despite ${index ? 'a missing' : 'another canonical'} name`);
    assert(item.dedupFixtureNote === `Retired ID authority ${index + 1}` && containsRecord(item, idOnlyOriginals[index]), `${spec.legacyId} retains exact original metadata and recovery record`);
  });
  assertHistory('ID-only/misleading-name import');

  const nameOnly = clone(retiredOnly);
  specs.forEach((spec, index) => {
    const row = nameOnly.stratagems.find(item => item.id === spec.legacyId);
    delete row.id; delete row.owned;
    row.enabled = index === 0;
  });
  applyImportedData(makeFixture(nameOnly));
  assertCatalogShape('name-only legacy import');
  specs.forEach((spec, index) => assert(find(spec.id).name === spec.canonical && find(spec.id).owned === (index === 0) && find(spec.id).enabled === (index === 0), `${spec.legacy} name-only import derives ownership from its legacy include flag`));
  assertHistory('name-only legacy import');

  // Persist the conflicting old full-catalog case so the second process must
  // preserve both canonical exclusions and complete discarded-record recovery.
  applyImportedData(makeFixture(legacyItems));
  const once = clone(buildPersistedStatePayload());
  applyImportedData(clone(once));
  assert(JSON.stringify(state.items) === JSON.stringify(once.items), 're-importing consolidated data is catalog-idempotent, including recovery arrays');
  assertHistory('normalized re-import');
  assert(state.settings.rememberedPlayerName === 'M2B Dedup Restart Diver', 'catalog migration preserves unrelated player settings');
  for (const [index, spec] of specs.entries()) {
    assert(containsRecord(find(spec.id), retiredRows[index]), `${spec.canonical} recovery record survives repeated imports exactly`);
  }

  renderItems(); switchTab('items');
  const notice = document.querySelector('#catalogMergeNotice');
  assert(notice && !notice.hidden, 'Armory contains the duplicate-consolidation notice');
  if (notice.tagName === 'DETAILS') notice.open = true;
  const noticeText = notice.textContent.trim();
  assert(/w\.?a\.?s\.?p/i.test(noticeText) && /EMS/i.test(noticeText), 'duplicate notice identifies both the WASP and EMS changes');
  assert(/canonical|existing|current/i.test(noticeText) && /choice|ownership|owned|enabled/i.test(noticeText), 'duplicate notice explains whose ownership/include choices are retained');
  assert(/recover|retain|preserv/i.test(noticeText) && /record|export|backup/i.test(noticeText), 'duplicate notice explains recoverable legacy records');
  notice.scrollIntoView({ block: 'center' });
  const finalData = clone(buildPersistedStatePayload());
  const rawPayload = JSON.stringify(finalData);
  const rawEnvelope = JSON.stringify({ saveFormatVersion: 1, applicationVersion: '1.1.3', savedAt: '2026-09-14T14:00:00.000Z', data: finalData });
  for (const [kind, raw] of [['plain export payload', rawPayload], ['desktop export envelope', rawEnvelope]]) {
    const parsed = parseLegacyBrowserPayload(raw);
    assert(JSON.stringify(parsed.items) === JSON.stringify(finalData.items) && JSON.stringify(parsed.cards) === historicalBaseline, `${kind} retains complete migrated gear, recovery records and history`);
    applyImportedData(parsed);
    assert(JSON.stringify(state.items) === JSON.stringify(finalData.items) && JSON.stringify(state.cards) === historicalBaseline, `${kind} re-import is lossless`);
  }
  saveState();
  if (desktopStorage) {
    const saved = await desktopStorage.saveState(buildPersistedStatePayload());
    assert(saved?.ok, 'deduplication fixture is flushed through the real desktop storage bridge');
    const loaded = await desktopStorage.loadState();
    assert(JSON.stringify(loaded.data) === JSON.stringify(buildPersistedStatePayload()), 'real desktop disk reload matches the complete migrated payload in-process');
  } else {
    assert(localStorage.getItem(STORAGE_KEY) === JSON.stringify(buildPersistedStatePayload()), 'browser fallback stores the exact migrated payload');
  }
  renderItems(); switchTab('items');
  const finalNotice = document.querySelector('#catalogMergeNotice');
  if (finalNotice?.tagName === 'DETAILS') finalNotice.open = true;
  finalNotice?.scrollIntoView({ block: 'center' });
  window.alert = originalAlert;
  return {
    checks, specs, retiredRows, mortarId, freshCount, freshStratagemCount, noticeText,
    expectedIds: idList(state.items), expectedFlags: flags(state.items), expectedItems: clone(state.items),
    expectedCards: clone(state.cards), expectedSettings: clone(buildPersistedStatePayload().settings),
    exportData: clone(buildPersistedStatePayload()),
    exportCoverage: 'Plain/enveloped payload parsing plus real desktop save/load; runner owns exported-file backend verification. Native file-picker interaction is not exercised.',
    artworkCoverage: 'Canonical and retired names resolve and decode bundled images; offline enforcement is runner-owned.'
  };
}

async function rendererDedupVerify(expected) {
  const checks = [];
  const assert = (condition, label) => {
    if (!condition) throw new Error(`DEDUP RESTART: ${label}`);
    checks.push(label); console.log(`DEDUP RESTART PASS: ${label}`);
  };
  const keys = ['primaries', 'sidearms', 'throwables', 'stratagems', 'boosters'];
  const rows = () => keys.flatMap(key => state.items[key] || []);
  const find = id => rows().find(item => item.id === id);
  const flags = () => rows().map(item => [item.id, item.owned, item.enabled]).sort((a, b) => a[0].localeCompare(b[0]));
  const decodeImage = async source => {
    assert(!!source && !/^https?:/i.test(source), `restart artwork remains local: ${String(source).split('/').pop()}`);
    await new Promise((resolve, reject) => {
      const image = new Image();
      const timer = setTimeout(() => reject(new Error(`DEDUP RESTART image timeout: ${source}`)), 10000);
      image.onload = () => { clearTimeout(timer); image.naturalWidth > 0 && image.naturalHeight > 0 ? resolve() : reject(new Error(`Empty image: ${source}`)); };
      image.onerror = () => { clearTimeout(timer); reject(new Error(`DEDUP RESTART image failed: ${source}`)); };
      image.src = source;
    });
  };

  await bootStateReady;
  await Promise.all([preloadItemVisuals(), loadItemImageDb()]);
  assert(rows().length === expected.freshCount && state.items.stratagems.length === expected.freshStratagemCount, 'separate process restores the consolidated catalog and stratagem counts');
  assert(JSON.stringify(rows().map(item => item.id).sort()) === JSON.stringify(expected.expectedIds), 'separate process restores every canonical stable ID without resurrecting retired rows');
  assert(JSON.stringify(flags()) === JSON.stringify(expected.expectedFlags), 'separate process restores every ownership/include choice');
  assert(keys.every(key => JSON.stringify(state.items[key]) === JSON.stringify(expected.expectedItems[key])), 'separate process restores exact catalog metadata and recovery arrays');
  assert(JSON.stringify(state.cards) === JSON.stringify(expected.expectedCards), 'separate process preserves old labels, fingerprints, locked stats, scores and notes byte-for-byte');
  assert(JSON.stringify(buildPersistedStatePayload().settings) === JSON.stringify(expected.expectedSettings), 'separate process restores unrelated saved settings exactly');
  const beforeAnalytics = JSON.stringify(state.cards);
  const armory = buildArmoryStats(state.cards);
  const analytics = buildItemAnalytics(state.cards);
  for (const [index, spec] of expected.specs.entries()) {
    const item = find(spec.id);
    assert(item?.owned === false && item?.enabled === false && !find(spec.legacyId), `${spec.canonical} remains excluded and its retired row stays out of the live pool`);
    assert(item.legacyIds?.includes(spec.legacyId) && item.aliases?.includes(spec.legacy), `${spec.canonical} retains both stable-ID and name compatibility`);
    assert(item.legacyAliasRecords?.some(record => JSON.stringify(record) === JSON.stringify(expected.retiredRows[index])), `${spec.canonical} complete retired record survives an actual process restart`);
    const stat = armory.get(spec.canonical);
    assert(stat?.rolledCount === 3 && stat?.moSuccessCount === 2 && !armory.has(spec.legacy), `${spec.canonical} Armory totals still count distinct equipment once per historical card`);
    const detailed = analytics.itemStats.filter(row => row.slot === 'stratagem' && row.name === spec.canonical);
    assert(detailed.length === 1 && detailed[0].total === 3 && detailed[0].moSuccess === 2, `${spec.canonical} detailed analytics remain unified and correct after restart`);
    for (const name of [spec.canonical, spec.legacy]) {
      const visual = getItemVisual(name, 'stratagem');
      assert(visual?.src && !/placeholder/i.test(visual.src), `${name} still resolves non-placeholder artwork after restart`);
      await decodeImage(visual.src);
    }
  }
  const mortar = find(expected.mortarId);
  assert(mortar?.name === 'EMS Mortar Sentry' && armory.get(mortar.name)?.rolledCount === 2 && analytics.itemStats.find(row => row.slot === 'stratagem' && row.name === mortar.name)?.total === 2, 'EMS Mortar Sentry and its statistics remain separate after restart');
  assert(JSON.stringify(state.cards) === beforeAnalytics, 'restart analytics do not mutate historical Results');
  renderItems(); switchTab('items');
  const notice = document.querySelector('#catalogMergeNotice');
  assert(notice && !notice.hidden && notice.textContent.trim() === expected.noticeText, 'restart displays the same ownership and recovery explanation');
  if (notice.tagName === 'DETAILS') notice.open = true;
  notice.scrollIntoView({ block: 'center' });
  if (desktopStorage) {
    const loaded = await desktopStorage.loadState();
    assert(JSON.stringify(loaded.data) === JSON.stringify(buildPersistedStatePayload()), 'separate-process renderer agrees with the exact disk-backed save payload');
  }
  return { checks };
}

async function rendererDedupSeed(expected) {
  const checks = [];
  const assert = (condition, label) => {
    if (!condition) throw new Error(`DEDUP OLD SEED: ${label}`);
    checks.push(label); console.log(`DEDUP OLD SEED PASS: ${label}`);
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const keys = ['primaries', 'sidearms', 'throwables', 'stratagems', 'boosters'];
  const rowsFrom = items => keys.flatMap(key => items[key] || []);
  const specs = [
    { id: 'stratagem:sta-x3-w-a-s-p-launcher', legacyId: 'stratagem:wasp', legacy: 'Wasp' },
    { id: 'stratagem:orbital-ems-strike', legacyId: 'stratagem:ems-strike', legacy: 'EMS Strike' }
  ];
  const mortarId = 'stratagem:ems-mortar-sentry';

  await bootStateReady;
  assert(desktopStorage && typeof desktopStorage.getAppInfo === 'function', 'old application exposes the real desktop storage and app-info bridge');
  const appInfo = await desktopStorage.getAppInfo();
  assert(appInfo?.version === '1.1.3', 'seed is running inside the actual archived 1.1.3 application');
  const oldItems = clone(DEFAULTS.items);
  const originalRows = rowsFrom(oldItems);
  assert(originalRows.length === 207 && new Set(originalRows.map(item => item.id)).size === 207, 'archived runtime supplies its actual 207 unique default gear records');
  assert(expected && Array.isArray(expected.expectedCards) && expected.expectedCards.length === 3, 'runner supplied the three already-normalized, scored historical cards');
  const cardsBeforeSeed = JSON.stringify(expected.expectedCards);
  for (const [index, spec] of specs.entries()) {
    const canonical = oldItems.stratagems.find(item => item.id === spec.id);
    const retired = oldItems.stratagems.find(item => item.id === spec.legacyId);
    assert(canonical && retired && retired.name === spec.legacy, `old catalog contains both actual records for ${spec.legacy}`);
    assert(!canonical.legacyIds?.includes(spec.legacyId), `old ${canonical.name} has not already acquired the new ID migration`);
    spec.canonical = canonical.name;
    canonical.owned = false; canonical.enabled = false;
    canonical.dedupUpgradeNote = `Original 1.1.3 canonical exclusion ${index + 1}`;
    retired.owned = true; retired.enabled = true;
    retired.dedupUpgradeNote = { source: 'Saved through the archived 1.1.3 EXE', index, userMetadata: ['retain', 'this', 'entire', 'record'] };
  }
  assert(originalRows.find(item => item.id === mortarId)?.name === 'EMS Mortar Sentry', 'old catalog includes the distinct EMS Mortar Sentry');
  const oldAlert = window.alert;
  window.alert = () => {};
  try {
    applyImportedData({
      items: oldItems,
      cards: clone(expected.expectedCards),
      settings: { ...clone(expected.expectedSettings || {}), rememberedPlayerName: 'M2B Real 1.1.3 Upgrade Diver' }
    });
    const data = clone(buildPersistedStatePayload());
    assert(rowsFrom(data.items).length === 207, 'old renderer retains both duplicate pairs before saving');
    assert(JSON.stringify(data.cards) === cardsBeforeSeed, 'old renderer preserves the prepared history labels, fingerprints, locked stats, notes and scores');
    const retiredRows = specs.map(spec => clone(data.items.stratagems.find(item => item.id === spec.legacyId)));
    for (const [index, spec] of specs.entries()) {
      const canonical = data.items.stratagems.find(item => item.id === spec.id);
      assert(canonical?.owned === false && canonical?.enabled === false && retiredRows[index]?.owned === true && retiredRows[index]?.enabled === true, `old ${spec.canonical} and ${spec.legacy} retain their deliberately conflicting ownership flags`);
      assert(canonical.dedupUpgradeNote === `Original 1.1.3 canonical exclusion ${index + 1}` && retiredRows[index].dedupUpgradeNote?.index === index, `old ${spec.canonical} and its duplicate retain custom metadata before upgrade`);
    }
    saveState();
    const saved = await desktopStorage.saveState(data);
    assert(saved?.ok && typeof saved.path === 'string', 'actual 1.1.3 desktop bridge saves the old 207-row payload to disk');
    const loaded = await desktopStorage.loadState();
    assert(JSON.stringify(loaded.data) === JSON.stringify(data), 'actual 1.1.3 disk reload exactly matches all seeded items, cards and settings');
    const savedData = clone(loaded.data);
    const surviving = rowsFrom(savedData.items).filter(item => !specs.some(spec => spec.legacyId === item.id));
    assert(surviving.length === 205, 'old saved payload defines exactly 205 surviving ownership choices for the upgrade');
    return {
      checks, specs, retiredRows, mortarId, applicationVersion: appInfo.version, savePath: saved.path,
      seededItems: savedData.items, seededCards: savedData.cards, seededSettings: savedData.settings,
      expectedIds: surviving.map(item => item.id).sort(),
      expectedFlags: surviving.map(item => [item.id, item.owned, item.enabled]).sort((a, b) => a[0].localeCompare(b[0])),
      exportData: savedData
    };
  } finally {
    window.alert = oldAlert;
  }
}

async function rendererDedupUpgradeVerify(seed, expectedVersion) {
  const checks = [];
  const assert = (condition, label) => {
    if (!condition) throw new Error(`DEDUP OLD UPGRADE: ${label}`);
    checks.push(label); console.log(`DEDUP OLD UPGRADE PASS: ${label}`);
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const keys = ['primaries', 'sidearms', 'throwables', 'stratagems', 'boosters'];
  const rows = () => keys.flatMap(key => state.items[key] || []);
  const find = id => rows().find(item => item.id === id);
  const flags = () => rows().map(item => [item.id, item.owned, item.enabled]).sort((a, b) => a[0].localeCompare(b[0]));

  // Do not import or seed anything here. These assertions cover automatic load
  // of the file that the old executable wrote, before any explicit new save.
  await bootStateReady;
  await Promise.all([preloadItemVisuals(), loadItemImageDb()]);
  assert(seed?.applicationVersion === '1.1.3' && Array.isArray(seed.retiredRows) && seed.retiredRows.length === 2, 'runner supplied evidence from the actual archived-app seed');
  assert(desktopStorage && typeof desktopStorage.getAppInfo === 'function', 'upgraded process uses the real desktop storage bridge');
  const appInfo = await desktopStorage.getAppInfo();
  assert(typeof expectedVersion === 'string' && appInfo?.version === expectedVersion, 'upgrade verification runs inside the expected current packaged application');
  assert(rows().length === 206 && new Set(rows().map(item => item.id)).size === 206, 'first boot consolidates the old duplicates and adds exactly one opt-in Hyena');
  assert(JSON.stringify(rows().filter(item => item.id !== 'primary:r-4-hyena').map(item => item.id).sort()) === JSON.stringify(seed.expectedIds), 'first boot preserves the complete old surviving stable-ID set');
  assert(JSON.stringify(flags().filter(([id]) => id !== 'primary:r-4-hyena')) === JSON.stringify(seed.expectedFlags), 'first boot preserves all 205 canonical ownership/include choices from the old disk save');
  assert(find('primary:r-4-hyena')?.owned === false && find('primary:r-4-hyena')?.enabled === false, 'new Hyena is excluded when upgrading an actual old EXE save');
  assert(JSON.stringify(state.cards) === JSON.stringify(seed.seededCards), 'first boot preserves old saved historical labels, fingerprints, locked stats, notes and scores exactly');
  assert(JSON.stringify(buildPersistedStatePayload().settings) === JSON.stringify(seed.seededSettings), 'first boot preserves old saved player and catalog-review settings exactly');
  for (const [index, spec] of seed.specs.entries()) {
    const canonical = find(spec.id);
    assert(canonical?.name === spec.canonical && !find(spec.legacyId), `${spec.canonical} is the sole live entry after loading the old executable save`);
    assert(canonical.legacyIds?.includes(spec.legacyId) && canonical.aliases?.includes(spec.legacy), `${spec.canonical} receives current retired-ID and legacy-name compatibility metadata`);
    assert(canonical.owned === false && canonical.enabled === false && !enabledNames(state.items.stratagems).includes(spec.canonical), `${spec.canonical} canonical exclusion wins over the old enabled duplicate`);
    assert(canonical.dedupUpgradeNote === `Original 1.1.3 canonical exclusion ${index + 1}`, `${spec.canonical} keeps old canonical custom metadata`);
    assert(canonical.legacyAliasRecords?.some(record => JSON.stringify(record) === JSON.stringify(seed.retiredRows[index])), `${spec.canonical} preserves the complete original old-runtime duplicate record for recovery`);
  }
  const mortar = find(seed.mortarId);
  assert(mortar?.name === 'EMS Mortar Sentry', 'real upgrade does not merge or remove EMS Mortar Sentry');

  const historyBeforeAnalytics = JSON.stringify(state.cards);
  const armory = buildArmoryStats(state.cards);
  const analytics = buildItemAnalytics(state.cards);
  for (const spec of seed.specs) {
    const simple = armory.get(spec.canonical);
    const detailed = analytics.itemStats.filter(row => row.slot === 'stratagem' && row.name === spec.canonical);
    assert(simple?.rolledCount === 3 && simple?.moSuccessCount === 2 && !armory.has(spec.legacy), `${spec.canonical} old saved history produces unified Armory counts once per card`);
    assert(detailed.length === 1 && detailed[0].total === 3 && detailed[0].moSuccess === 2, `${spec.canonical} old saved history produces unified detailed analytics once per card`);
  }
  assert(armory.get(mortar.name)?.rolledCount === 2 && analytics.itemStats.find(row => row.slot === 'stratagem' && row.name === mortar.name)?.total === 2, 'real-upgrade history keeps separate EMS Mortar statistics');
  assert(JSON.stringify(state.cards) === historyBeforeAnalytics, 'new analytics do not mutate the actual old saved history');
  renderItems(); switchTab('items');
  const notice = document.querySelector('#catalogMergeNotice');
  assert(notice && !notice.hidden && /recover|retain|preserv/i.test(notice.textContent), 'first-upgrade Armory displays the duplicate and recovery explanation');
  if (notice.tagName === 'DETAILS') notice.open = true;
  notice.scrollIntoView({ block: 'center' });

  const data = clone(buildPersistedStatePayload());
  saveState();
  const saved = await desktopStorage.saveState(data);
  assert(saved?.ok && saved.path === seed.savePath, 'current executable writes the migrated state back to the same isolated old-app save path');
  const loaded = await desktopStorage.loadState();
  assert(JSON.stringify(loaded.data) === JSON.stringify(data), 'current executable disk reload matches the entire automatically upgraded payload');
  assert(JSON.stringify(loaded.data.cards) === JSON.stringify(seed.seededCards), 'writing the upgraded save preserves the old history exactly on disk');
  return { checks, applicationVersion: appInfo.version, savePath: saved.path, exportData: clone(loaded.data) };
}

module.exports = { rendererDedupPhase, rendererDedupVerify, rendererDedupSeed, rendererDedupUpgradeVerify };
