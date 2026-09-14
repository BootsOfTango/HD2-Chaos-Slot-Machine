/* M2B renderer checks for the reviewed legacy source audit and three display-name fixes.
 * Both exports are self-contained so a runner can serialize them through CDP with .toString().
 * This module does not launch Electron, choose a profile, touch native dialogs, or modify source data.
 */
async function rendererSourceAuditPhase(review, identityReview) {
  const checks = [];
  const assert = (condition, label) => {
    if (!condition) throw new Error(`SOURCE AUDIT SMOKE: ${label}`);
    checks.push(label); console.log(`SOURCE AUDIT SMOKE PASS: ${label}`);
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const keys = ['primaries', 'sidearms', 'throwables', 'stratagems', 'boosters'];
  const containers = { primaries: 'listPrimaries', sidearms: 'listSidearms', throwables: 'listThrowables', stratagems: 'listStrats', boosters: 'listBoosters' };
  const typeLabels = { primaries: 'Primary', sidearms: 'Sidearm', throwables: 'Throwable', stratagems: 'Stratagem', boosters: 'Booster' };
  const rowsFrom = items => keys.flatMap(key => (items[key] || []).map(item => ({ key, item })));
  const rows = () => rowsFrom(state.items);
  const findRecord = id => rows().find(({ item }) => item.id === id || item.legacyIds?.includes(id));
  const find = id => findRecord(id)?.item;
  const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const renameSpecs = [
    {
      id: 'sidearm:cqc-1-saber', canonical: 'CQC-2 Saber', legacy: 'CQC-1 Saber',
      assetPath: 'assets/weapons/sidearms/cqc-1-saber-wiki.png', kind: 'warbond', group: 'Masters of Ceremony'
    },
    {
      id: 'sidearm:cqc-19-machete', canonical: 'CQC-42 Machete', legacy: 'CQC-19 Machete',
      assetPath: 'assets/weapons/sidearms/cqc-19-machete-wiki.png', kind: 'superstore', group: 'Superstore'
    },
    {
      id: 'sidearm:cqc-2-stun-lance', canonical: 'CQC-19 Stun Lance', legacy: 'CQC-2 Stun Lance',
      assetPath: 'assets/weapons/sidearms/cqc-2-stun-lance-wiki.png', kind: 'warbond', group: 'Urban Legends'
    }
  ];
  assert(review && review.schemaVersion === 1 && Array.isArray(review.items) && Array.isArray(review.warbonds), 'runner supplied the versioned source-review manifest');
  assert(review.items.length === 35 && new Set(review.items.map(item => item.id)).size === 35, 'review manifest contains 35 unique bounded corrections');
  assert(identityReview?.schemaVersion === 1 && identityReview.merges?.length === 2, 'runner supplied the two explicit identity merges alongside the unchanged historical source review');
  const retiredIds = new Map(identityReview.merges.map(merge => [merge.retiredItem.id, merge]));
  const sourceSpecs = review.items.map(correction => {
    const merge = retiredIds.get(correction.id);
    const canonical = merge ? review.items.find(row => row.id === merge.canonicalId) : correction;
    assert(!!canonical, `${correction.id} resolves to a reviewed canonical identity`);
    return {
      id: correction.id,
      canonicalId: canonical.id,
      canonical: canonical.name || canonical.previousName,
      legacyName: merge ? correction.previousName : '',
      kind: correction.acquisition?.kind,
      group: correction.warbond,
      verification: correction.acquisition?.verification,
      sourceUrl: correction.acquisition?.sourceUrl,
      verifiedAt: correction.acquisition?.verifiedAt
    };
  });
  assert(sourceSpecs.filter(spec => spec.verification === 'primary-source').length === 23 && sourceSpecs.filter(spec => spec.verification === 'community-source').length === 12, 'review manifest explicitly distinguishes 23 primary-source and 12 community-source facts');
  assert(new Set(sourceSpecs.map(spec => spec.canonicalId)).size === 33, '35 historical facts resolve to 33 current unique reviewed identities');
  const coverSpecs = [
    { group: "Freedom's Flame", path: 'assets/warbonds/official/freedoms-flame.jpg' },
    { group: 'Chemical Agents', path: 'assets/warbonds/official/chemical-agents.jpg' },
    { group: 'Urban Legends', path: 'assets/warbonds/official/urban-legends.jpg' }
  ];
  const flagPairs = items => rowsFrom(items)
    .map(({ item }) => [item.id, item.owned, item.enabled])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  const idList = items => rowsFrom(items).map(({ item }) => item.id).sort();
  const decodeImage = async source => {
    assert(!!source && !/^https?:/i.test(source), `artwork is bundled locally: ${String(source).split('/').pop()}`);
    await new Promise((resolve, reject) => {
      const image = new Image();
      const timer = setTimeout(() => reject(new Error(`SOURCE AUDIT image timeout: ${source}`)), 10000);
      image.onload = () => {
        clearTimeout(timer);
        image.naturalWidth > 0 && image.naturalHeight > 0 ? resolve() : reject(new Error(`Empty artwork: ${source}`));
      };
      image.onerror = () => { clearTimeout(timer); reject(new Error(`SOURCE AUDIT image failed: ${source}`)); };
      image.src = source;
    });
  };
  const sourceInfo = item => {
    const info = getCatalogSourceInfo(item);
    assert(info && typeof info === 'object', `${item.name} exposes source display metadata`);
    return info;
  };
  const assertReviewedSource = spec => {
    const record = findRecord(spec.id);
    const item = record?.item;
    assert(item?.id === spec.canonicalId && item?.name === spec.canonical, `${spec.id} resolves to its reviewed canonical identity and display name`);
    if (spec.legacyName) assert(item.legacyIds.includes(spec.id) && item.aliases.includes(spec.legacyName), `${spec.id} remains recoverable as a retired ID and name alias`);
    const info = sourceInfo(item);
    assert(info.kind === spec.kind, `${item.name} uses source kind ${spec.kind}`);
    assert(info.group === spec.group, `${item.name} remains in the distinct ${spec.group} source group`);
    assert(typeof info.label === 'string' && info.label.trim().length > 0, `${item.name} has a human-readable source-kind label`);
    assert(info.reviewed === true, `${item.name} is explicitly marked source-reviewed`);
    assert(info.verification === spec.verification && !/pending|unverified/i.test(info.verification), `${item.name} exposes the manifest's verification tier`);
    let actualUrl = '', expectedUrl = '';
    try { actualUrl = new URL(info.sourceUrl).href; expectedUrl = new URL(spec.sourceUrl).href; } catch (_) {}
    assert(actualUrl === expectedUrl && actualUrl.startsWith('https://'), `${item.name} exposes the reviewed HTTPS source exactly`);
    assert(info.verifiedAt === spec.verifiedAt && Number.isFinite(Date.parse(info.verifiedAt)), `${item.name} exposes the reviewed verification date exactly`);
    const row = buildItemEditorRow({ item, containerId: containers[record.key], typeLabel: typeLabels[record.key], onToggle: () => {} });
    const rowText = normalize(row.textContent);
    assert(rowText.includes(normalize(info.label)) && rowText.includes(normalize(info.group)), `${item.name} renders source-kind and source-group tags in Armory`);
    return { id: spec.id, canonicalId: spec.canonicalId, legacyName: spec.legacyName, kind: info.kind, label: info.label, group: info.group, reviewed: info.reviewed, verification: info.verification, sourceUrl: info.sourceUrl, verifiedAt: info.verifiedAt };
  };

  await bootStateReady;
  await Promise.all([preloadItemVisuals(), loadItemImageDb()]);
  const originalAlert = window.alert;
  window.alert = () => {};

  assert(state.cards.length === 0, 'fresh isolated profile starts without historical Results');
  assert(typeof getCatalogSourceInfo === 'function', 'catalog source helper is available to the renderer');
  assert(rows().length === 205, 'fresh renderer contains exactly 205 canonical gear records');
  assert(new Set(rows().map(({ item }) => item.id)).size === 205, 'all 205 fresh gear IDs are unique');
  assert([...retiredIds.keys()].every(id => !rows().some(({ item }) => item.id === id)), 'retired duplicate IDs are not independent rollable entries');
  assert(keys.every(key => state.items[key].every(item => item && typeof item.id === 'string' && typeof item.owned === 'boolean' && typeof item.enabled === 'boolean')), 'all canonical categories expose stable IDs and explicit ownership/include flags');

  const freshItems = clone(state.items);
  const freshIds = idList(freshItems);
  const freshFlags = flagPairs(freshItems);
  for (const spec of renameSpecs) {
    const item = find(spec.id);
    assert(item?.name === spec.canonical, `${spec.id} keeps its stable ID while using ${spec.canonical}`);
    assert(Array.isArray(item.aliases) && item.aliases.includes(spec.legacy), `${spec.canonical} retains ${spec.legacy} as a legacy alias`);
  }

  const reviewedSources = sourceSpecs.map(assertReviewedSource);
  const urban = reviewedSources.find(info => info.group === 'Urban Legends');
  const superstore = reviewedSources.find(info => info.group === 'Superstore');
  assert(urban?.kind === 'warbond' && superstore?.kind === 'superstore', 'Warbond Urban Legends and Superstore remain separate source kinds and groups');

  assert(typeof renderCatalogAuditStatus === 'function', 'catalog audit status renderer is available');
  renderCatalogAuditStatus();
  const auditStatus = document.querySelector('#catalogAuditStatus');
  assert(auditStatus && !auditStatus.hidden && /audit|review|verified/i.test(auditStatus.textContent) && auditStatus.textContent.trim().length > 20, 'Armory displays a substantive catalog audit status');
  assert(auditStatus.textContent.includes('27 official-source') && auditStatus.textContent.includes('11 community-source') && auditStatus.textContent.includes('167 pending / 205'), 'catalog audit status reports 38 unique reviewed identities plus 167 pending, including the five prior additions');

  for (const spec of renameSpecs) {
    const canonicalVisual = getItemVisual(spec.canonical, 'sidearm');
    const legacyVisual = getItemVisual(spec.legacy, 'sidearm');
    assert(canonicalVisual?.src === spec.assetPath, `${spec.canonical} resolves its unchanged local artwork path`);
    assert(legacyVisual?.src === spec.assetPath, `${spec.legacy} alias resolves the same local artwork path`);
    await decodeImage(canonicalVisual.src);
    await decodeImage(legacyVisual.src);
  }
  for (const spec of coverSpecs) {
    const manifestCover = review.warbonds.find(warbond => warbond.name === spec.group);
    assert(manifestCover?.coverAssetPath === spec.path && Array.isArray(manifestCover.equipmentIds) && manifestCover.equipmentIds.length > 0, `${spec.group} manifest declares its confirmed cover and equipment set`);
    assert(WARBOND_ART[spec.group] === spec.path, `${spec.group} uses the confirmed official-cover path`);
    await decodeImage(spec.path);
  }
  assert(JSON.stringify(flagPairs(state.items)) === JSON.stringify(freshFlags), 'source rendering, status and artwork checks do not change any of the 205 ownership/include choices');

  const baseLoadout = rollLoadout('M2B-SOURCE-HISTORY');
  assert(!!baseLoadout, 'fresh canonical pools can create the source-audit history fixture');
  const legacyCards = renameSpecs.map((spec, index) => {
    const note = `Historical card must retain ${spec.legacy}.`;
    const loadout = { ...clone(baseLoadout), sidearm: spec.legacy };
    loadout.fingerprint = fingerprintLoadout(loadout);
    return normalizeCardRecord({
      ...loadout,
      id: `m2b-source-history-${index + 1}`,
      createdAt: `2026-09-14T12:0${index}:00.000Z`,
      seed: `M2B Legacy Name ${index + 1}`,
      playerName: 'M2B Source Audit',
      planet: null,
      planetBiome: null,
      difficulty: 7,
      statsLocked: true,
      statsLockedAt: `2026-09-14T12:1${index}:00.000Z`,
      majorOrderDone: index !== 1,
      stats: { kills: 200 + index, accuracy: 70 + index, deaths: index, stims: 3 + index, bulletCount: 1100 + index, stratUses: 14 + index, distanceKm: 3.5 + index, blueSideObjCount: index, extractedSafely: true },
      originalNote: note,
      notes: note,
      commentNotes: []
    });
  });
  assert(legacyCards.length === renameSpecs.length && legacyCards.every((card, index) => (
    card?.id === `m2b-source-history-${index + 1}` &&
    typeof card.createdAt === 'string' && typeof card.seed === 'string' &&
    typeof card.mode === 'string' && typeof card.faction === 'string' &&
    typeof card.primary === 'string' && card.sidearm === renameSpecs[index].legacy &&
    typeof card.throwable === 'string' && typeof card.booster === 'string' &&
    Array.isArray(card.stratagems) && card.stratagems.length === 4 &&
    card.fingerprint === fingerprintLoadout(card) &&
    card.statsLocked === true && typeof card.statsLockedAt === 'string' &&
    card.stats && card.lockedStatsSnapshot &&
    stableStatsSignature(card.stats) === stableStatsSignature(card.lockedStatsSnapshot) &&
    card.difficulty === 7 && card.difficultyTier === 'helldive' &&
    card.originalNote === card.notes && Array.isArray(card.commentNotes) &&
    Number.isFinite(card.scoreRaw) && Number.isFinite(card.scoreRawBase) && Number.isFinite(card.grade)
  )), 'historical fixtures use the current normalized locked-card shape');

  const legacyItems = clone(freshItems);
  const fixtureFlags = [
    { owned: true, enabled: false },
    { owned: false, enabled: false },
    { owned: true, enabled: true }
  ];
  renameSpecs.forEach((spec, index) => {
    const row = legacyItems.sidearms.find(item => item.id === spec.id);
    assert(!!row, `legacy fixture locates stable ID ${spec.id}`);
    row.name = spec.legacy;
    row.aliases = [];
    row.warbond = 'Unassigned / Custom';
    row.source = 'Unassigned / Custom';
    row.acquisition = { kind: 'unverified', label: 'Unassigned / Custom', verification: 'legacy-assignment-pending-audit' };
    row.owned = fixtureFlags[index].owned;
    row.enabled = fixtureFlags[index].enabled;
    row.sourceAuditSmokeNote = `preserve-${index + 1}`;
  });
  const legacyFixture = { items: legacyItems, cards: legacyCards, settings: { rememberedPlayerName: 'M2B Legacy Source Diver', catalogReviewVersion: '1.1.2' } };
  const expectedFixtureFlags = flagPairs(legacyItems);
  applyImportedData(clone(legacyFixture));
  const historicalBaseline = JSON.stringify(state.cards);

  assert(rows().length === 205 && new Set(rows().map(({ item }) => item.id)).size === 205, 'legacy CQC wrong-name import neither merges nor deletes any of the 205 canonical identities');
  assert(JSON.stringify(idList(state.items)) === JSON.stringify(freshIds), 'legacy wrong-name import preserves the complete stable-ID set');
  assert(JSON.stringify(flagPairs(state.items)) === JSON.stringify(expectedFixtureFlags), 'legacy CQC wrong-name import preserves all 205 explicit ownership/include choices');
  renameSpecs.forEach((spec, index) => {
    const item = find(spec.id);
    assert(item.name === spec.canonical && item.aliases.includes(spec.legacy), `${spec.legacy} plus stable ID migrates to canonical ${spec.canonical}`);
    assert(item.owned === fixtureFlags[index].owned && item.enabled === fixtureFlags[index].enabled, `${spec.canonical} keeps the imported ownership/include combination`);
    assert(item.sourceAuditSmokeNote === `preserve-${index + 1}`, `${spec.canonical} keeps arbitrary legacy item metadata`);
    const canonicalVisual = getItemVisual(spec.canonical, 'sidearm');
    const legacyVisual = getItemVisual(spec.legacy, 'sidearm');
    assert(canonicalVisual?.src === spec.assetPath && legacyVisual?.src === spec.assetPath, `${spec.canonical} and ${spec.legacy} keep the external artwork mapping through legacy import migration`);
  });
  assert(state.cards.every((card, index) => card.id === legacyCards[index].id && card.sidearm === renameSpecs[index].legacy && card.notes.includes(renameSpecs[index].legacy)), 'historical cards retain their IDs and original legacy display-name snapshots');
  assert(state.settings.rememberedPlayerName === 'M2B Legacy Source Diver', 'legacy source fixture preserves unrelated remembered-player settings');
  sourceSpecs.forEach(assertReviewedSource);

  const once = clone(buildPersistedStatePayload());
  applyImportedData(clone(once));
  assert(JSON.stringify(state.items) === JSON.stringify(once.items), 're-importing normalized source-audit data is catalog-idempotent');
  assert(JSON.stringify(state.cards) === historicalBaseline, 're-import leaves historical card IDs, names, stats and scores byte-for-byte unchanged');

  saveState();
  if (desktopStorage) {
    const saved = await desktopStorage.saveState(buildPersistedStatePayload());
    assert(saved?.ok, 'source-audit fixture is flushed through the real desktop storage bridge');
    const loaded = await desktopStorage.loadState();
    assert(JSON.stringify(loaded.data) === JSON.stringify(buildPersistedStatePayload()), 'desktop disk reload matches the final source-audit payload in-process');
  } else {
    assert(localStorage.getItem(STORAGE_KEY) === JSON.stringify(buildPersistedStatePayload()), 'browser fallback contains the exact final source-audit payload');
  }
  window.alert = originalAlert;
  const exportData = clone(buildPersistedStatePayload());
  return {
    checks,
    renameSpecs,
    sourceSpecs: reviewedSources,
    coverSpecs,
    expectedIds: idList(state.items),
    expectedFlags: flagPairs(state.items),
    expectedItems: clone(state.items),
    expectedCards: clone(state.cards),
    expectedSettings: clone(buildPersistedStatePayload().settings),
    exportData,
    auditStatus: auditStatus.textContent.trim()
  };
}

async function rendererSourceAuditVerify(expected) {
  const checks = [];
  const assert = (condition, label) => {
    if (!condition) throw new Error(`SOURCE AUDIT RESTART: ${label}`);
    checks.push(label); console.log(`SOURCE AUDIT RESTART PASS: ${label}`);
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const keys = ['primaries', 'sidearms', 'throwables', 'stratagems', 'boosters'];
  const containers = { primaries: 'listPrimaries', sidearms: 'listSidearms', throwables: 'listThrowables', stratagems: 'listStrats', boosters: 'listBoosters' };
  const typeLabels = { primaries: 'Primary', sidearms: 'Sidearm', throwables: 'Throwable', stratagems: 'Stratagem', boosters: 'Booster' };
  const rows = () => keys.flatMap(key => (state.items[key] || []).map(item => ({ key, item })));
  const findRecord = id => rows().find(({ item }) => item.id === id || item.legacyIds?.includes(id));
  const find = id => findRecord(id)?.item;
  const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const flagPairs = () => rows().map(({ item }) => [item.id, item.owned, item.enabled]).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  const idList = () => rows().map(({ item }) => item.id).sort();
  const decodeImage = async source => {
    assert(!!source && !/^https?:/i.test(source), `restart artwork is bundled locally: ${String(source).split('/').pop()}`);
    await new Promise((resolve, reject) => {
      const image = new Image();
      const timer = setTimeout(() => reject(new Error(`SOURCE AUDIT RESTART image timeout: ${source}`)), 10000);
      image.onload = () => { clearTimeout(timer); image.naturalWidth > 0 && image.naturalHeight > 0 ? resolve() : reject(new Error(`Empty artwork: ${source}`)); };
      image.onerror = () => { clearTimeout(timer); reject(new Error(`SOURCE AUDIT RESTART image failed: ${source}`)); };
      image.src = source;
    });
  };

  await bootStateReady;
  await Promise.all([preloadItemVisuals(), loadItemImageDb()]);
  assert(rows().length === 205 && new Set(rows().map(({ item }) => item.id)).size === 205, 'separate process restores exactly 205 unique gear identities');
  assert(JSON.stringify(idList()) === JSON.stringify(expected.expectedIds), 'separate process restores the exact stable-ID set');
  assert(JSON.stringify(flagPairs()) === JSON.stringify(expected.expectedFlags), 'separate process restores every ownership/include choice');
  assert(keys.every(key => JSON.stringify(state.items[key]) === JSON.stringify(expected.expectedItems[key])), 'separate process restores every canonical catalog row and preserved custom field');
  assert(JSON.stringify(state.cards) === JSON.stringify(expected.expectedCards), 'separate process preserves historical card IDs, legacy labels, stats and scores exactly');
  assert(JSON.stringify(buildPersistedStatePayload().settings) === JSON.stringify(expected.expectedSettings), 'separate process restores unrelated settings exactly');

  for (const spec of expected.renameSpecs) {
    const item = find(spec.id);
    assert(item?.name === spec.canonical && item.aliases?.includes(spec.legacy), `${spec.id} restores its canonical name and legacy alias`);
    const canonicalVisual = getItemVisual(spec.canonical, 'sidearm');
    const legacyVisual = getItemVisual(spec.legacy, 'sidearm');
    assert(canonicalVisual?.src === spec.assetPath && legacyVisual?.src === spec.assetPath, `${spec.canonical} and ${spec.legacy} resolve the same artwork after restart`);
    await decodeImage(canonicalVisual.src);
    await decodeImage(legacyVisual.src);
  }

  for (const expectedInfo of expected.sourceSpecs) {
    const record = findRecord(expectedInfo.id);
    const item = record?.item;
    assert(item?.id === expectedInfo.canonicalId, `${expectedInfo.id} restores its exact canonical identity`);
    if (expectedInfo.legacyName) assert(item.legacyIds.includes(expectedInfo.id) && item.aliases.includes(expectedInfo.legacyName), `${expectedInfo.id} retains retired ID/name compatibility after restart`);
    const info = getCatalogSourceInfo(item);
    assert(info?.kind === expectedInfo.kind && info?.group === expectedInfo.group && info?.reviewed === true, `${item.name} restores its reviewed source kind and group`);
    assert(info.label === expectedInfo.label && info.verification === expectedInfo.verification && info.sourceUrl === expectedInfo.sourceUrl && info.verifiedAt === expectedInfo.verifiedAt, `${item.name} restores exact source verification metadata`);
    const row = buildItemEditorRow({ item, containerId: containers[record.key], typeLabel: typeLabels[record.key], onToggle: () => {} });
    const rowText = normalize(row.textContent);
    assert(rowText.includes(normalize(info.label)) && rowText.includes(normalize(info.group)), `${item.name} restores source-kind and source-group tags in Armory`);
  }

  for (const spec of expected.coverSpecs) {
    assert(WARBOND_ART[spec.group] === spec.path, `${spec.group} keeps its confirmed official-cover path after restart`);
    await decodeImage(spec.path);
  }
  renderCatalogAuditStatus();
  const auditStatus = document.querySelector('#catalogAuditStatus');
  assert(auditStatus && !auditStatus.hidden && auditStatus.textContent.trim() === expected.auditStatus, 'catalog audit status remains stable after restart');
  return { checks, restoredItems: clone(state.items), auditStatus: auditStatus.textContent.trim() };
}

module.exports = { rendererSourceAuditPhase, rendererSourceAuditVerify };
