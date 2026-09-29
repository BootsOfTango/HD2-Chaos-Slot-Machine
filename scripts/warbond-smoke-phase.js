/* Source-review and Warbond ownership checks. Each export is self-contained for
 * CDP serialization. The runner supplies the reviewed manifest, isolates saves,
 * blocks network access, verifies exported files and launches each process. */
async function rendererWarbondPhase(review) {
  const checks = [];
  const assert = (condition, label) => {
    if (!condition) throw new Error(`WARBOND SMOKE: ${label}`);
    checks.push(label); console.log(`WARBOND SMOKE PASS: ${label}`);
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const keys = ['primaries', 'sidearms', 'throwables', 'stratagems', 'boosters'];
  const categories = { primaries: 'primary', sidearms: 'sidearm', throwables: 'throwable', stratagems: 'stratagem', boosters: 'booster' };
  const containers = { primaries: 'listPrimaries', sidearms: 'listSidearms', throwables: 'listThrowables', stratagems: 'listStrats', boosters: 'listBoosters' };
  const recordsFrom = items => keys.flatMap(key => (items[key] || []).map(item => ({ key, item })));
  const records = () => recordsFrom(state.items);
  const findRecord = id => records().find(({ item }) => item.id === id);
  const find = id => findRecord(id)?.item;
  const ids = items => recordsFrom(items).map(({ item }) => item.id).sort();
  const flags = (items, except = []) => recordsFrom(items).filter(({ item }) => !except.includes(item.id)).map(({ item }) => [item.id, item.owned, item.enabled]).sort((a, b) => a[0].localeCompare(b[0]));
  const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const decodeImage = async source => {
    assert(!!source && !/^https?:/i.test(source), `artwork resolves locally: ${String(source).split('/').pop()}`);
    await new Promise((resolve, reject) => {
      const image = new Image();
      const timeout = setTimeout(() => reject(new Error(`WARBOND image timeout: ${source}`)), 10000);
      image.onload = () => { clearTimeout(timeout); image.naturalWidth > 0 && image.naturalHeight > 0 ? resolve() : reject(new Error(`Empty artwork: ${source}`)); };
      image.onerror = () => { clearTimeout(timeout); reject(new Error(`WARBOND image failed: ${source}`)); };
      image.src = source;
    });
  };
  const setView = (mode, search = '') => {
    if (document.querySelector('#manualPoolBlock')?.hidden) document.querySelector('[data-target="manualPoolBlock"]')?.click();
    localStorage.setItem(ITEMS_VIEW_MODE_KEY, mode);
    localStorage.setItem(ITEMS_TYPE_FILTER_KEY, 'all');
    if (typeof setArmoryPreferences === 'function') setArmoryPreferences({ viewMode: mode, typeFilter: 'all', ownershipFilter: 'all' });
    document.querySelector('#itemSearch').value = search;
    renderItems(); switchTab('items');
  };
  const groupFor = bond => [...document.querySelectorAll('.warbondGroup[data-warbond-id]')].find(element => element.dataset.warbondId === bond.id);
  const assertWholeSetCounter = (bond, label) => {
    const counter = groupFor(bond)?.querySelector('[data-warbond-count]');
    const members = bond.equipmentIds.map(find);
    const owned = members.filter(item => item?.owned === true).length;
    const included = members.filter(item => item?.owned === true && item?.enabled === true).length;
    const ownedMatch = counter?.textContent.match(/\b(\d+) owned\b/);
    const includedMatch = counter?.textContent.match(/\b(\d+) included\b/);
    assert(counter && Number(counter.dataset.warbondCount) === bond.equipmentIds.length, `${label}: ${bond.name} counter uses the complete declared equipment set`);
    assert(ownedMatch && Number(ownedMatch[1]) === owned && includedMatch && Number(includedMatch[1]) === included, `${label}: ${bond.name} counter reports the actual whole-set owned and included totals`);
  };
  const bulk = (bond, action) => {
    const button = groupFor(bond)?.querySelector(`[data-warbond-action="${action}"]`);
    assert(button && !button.disabled, `${bond.name} exposes an actionable ${action} bulk control`);
    assert(normalize(`${button.textContent} ${button.getAttribute('aria-label') || ''}`).includes(normalize(bond.name)), `${bond.name} ${action} control identifies its Warbond accessibly`);
    button.focus();
    assert(document.activeElement === button, `${bond.name} ${action} bulk control can receive keyboard focus`);
    button.click();
    const replacement = groupFor(bond)?.querySelector(`[data-warbond-action="${action}"]`);
    assert(replacement && replacement !== button && document.activeElement === replacement, `${bond.name} ${action} restores focus to the replacement control after re-rendering`);
    assertWholeSetCounter(bond, `after ${action}`);
  };
  const newGearControls = id => [...document.querySelectorAll('#newGearContent [data-gear-control]')].filter(element => element.dataset.gearControl.startsWith(`${id}:`));
  const assertNewGearSync = (bond, label) => {
    bond.equipmentIds.forEach(id => {
      const item = find(id);
      const controls = newGearControls(id);
      controls.forEach(control => {
        const property = control.dataset.gearControl.slice(id.length + 1);
        assert(control.checked === item[property] && (property !== 'enabled' || control.disabled === !item.owned), `${label}: ${item.name} ${property} stays synchronized with the new-gear panel`);
      });
    });
  };

  await bootStateReady;
  await Promise.all([preloadItemVisuals(), loadItemImageDb(), loadReviewedWarbondCatalog()]);
  assert(itemVisuals.loaded && itemVisuals.validation.errors.length === 0, 'packaged item visual data validates without missing stratagem categories');
  assert(review?.schemaVersion === 1 && Array.isArray(review.items) && review.items.length > 0 && Array.isArray(review.warbonds), 'runner supplies a nonempty versioned source-review batch (new Warbond groups are optional)');
  assert(new Set(review.items.map(item => item.id)).size === review.items.length && new Set(review.warbonds.map(bond => bond.id)).size === review.warbonds.length, 'source-review batch item and Warbond IDs are unique');
  assert(state.cards.length === 0, 'fresh isolated profile starts without historical Results');
  const catalog = await readPackagedJsonResource('assets/item-catalog.json');
  assert(Array.isArray(catalog.items) && Array.isArray(catalog.warbonds), 'actual packaged catalog exposes gear and Warbond metadata offline');
  const freshItems = clone(state.items);
  const freshIds = ids(freshItems);
  const freshCount = recordsFrom(DEFAULTS.items).length;
  assert(records().length === freshCount && new Set(freshIds).size === freshCount, 'fresh catalog has the bundled count of unique stable gear identities');
  assert(JSON.stringify(freshIds) === JSON.stringify(catalog.items.map(item => item.id).sort()), 'renderer gear IDs exactly match the packaged catalog');
  const baselineFlags = flags(freshItems);
  for (const id of review.freshInstallExclusions || []) {
    assert(catalog.items.find(item => item.id === id)?.defaultEnabled === false, `${id} is an explicit bundled fresh-profile exclusion`);
    assert(find(id)?.owned === false && find(id)?.enabled === false, `${id} starts unowned and excluded in the actual packaged renderer`);
  }
  const sourceSpecs = review.items.map(correction => {
    const record = findRecord(correction.id);
    assert(!!record, `${correction.id} exists as one canonical renderer item`);
    return {
      id: correction.id, canonical: correction.name || correction.previousName, previousName: correction.previousName,
      aliases: [...new Set([...(correction.aliases || []), ...(correction.name && correction.name !== correction.previousName ? [correction.previousName] : [])])],
      category: categories[record.key], key: record.key, group: correction.warbond,
      ...(Object.hasOwn(correction, 'subgroup') ? { subgroup: correction.subgroup } : {}),
      acquisition: clone(correction.acquisition), assetPath: getItemVisual(record.item.name, categories[record.key])?.src
    };
  });
  const assertSource = (spec, label) => {
    const record = findRecord(spec.id), item = record?.item;
    assert(item?.name === spec.canonical && item.warbond === spec.group, `${label}: ${spec.id} has its reviewed name and source group`);
    assert(spec.aliases.every(alias => item.aliases?.includes(alias)), `${label}: ${spec.canonical} retains every reviewed alias`);
    if (Object.hasOwn(spec, 'subgroup')) assert(item.subgroup === spec.subgroup, `${label}: ${spec.canonical} uses reviewed subgroup ${spec.subgroup}`);
    assert(spec.aliases.every(alias => canonicalItemName(alias) === spec.canonical), `${label}: ${spec.canonical} reviewed aliases resolve to its canonical visual/analytics name`);
    const info = getCatalogSourceInfo(item);
    assert(info.reviewed === true && info.kind === spec.acquisition.kind && info.group === spec.group && info.verification === spec.acquisition.verification, `${label}: ${spec.canonical} exposes the correct reviewed source kind and tier`);
    assert(info.sourceUrl === new URL(spec.acquisition.sourceUrl).href && info.verifiedAt === spec.acquisition.verifiedAt, `${label}: ${spec.canonical} exposes its exact reviewed HTTPS source and date`);
    assert(Object.entries(spec.acquisition).every(([key, value]) => JSON.stringify(item.acquisition?.[key]) === JSON.stringify(value)), `${label}: ${spec.canonical} retains all acquisition facts and notes from the review`);
    const row = buildItemEditorRow({ item, containerId: containers[record.key], typeLabel: spec.category, onToggle: () => {} });
    const sourceLabel = row.querySelector('.catalogSourceMeta');
    assert(sourceLabel?.dataset.sourceReviewed === 'true' && sourceLabel.dataset.sourceKind === info.kind && normalize(sourceLabel.textContent).includes(normalize(spec.group)), `${label}: ${spec.canonical} renders reviewed provenance in Armory`);
    return clone(info);
  };
  sourceSpecs.forEach(spec => { spec.expectedInfo = assertSource(spec, 'fresh source review'); });
  for (const spec of sourceSpecs) {
    for (const name of [...new Set([spec.canonical, ...spec.aliases])]) {
      const visual = getItemVisual(name, spec.category);
      assert(visual?.src === spec.assetPath && !/placeholder/i.test(visual.src), `${name} resolves its non-placeholder canonical image`);
      await decodeImage(visual.src);
    }
  }

  const bonds = catalog.warbonds.filter(bond => Array.isArray(bond.equipmentIds) && bond.equipmentIds.length > 0 && bond.equipmentIds.every(id => getCatalogSourceInfo(find(id)).reviewed));
  assert(bonds.length >= review.warbonds.length && review.warbonds.every(bond => bonds.some(actual => actual.id === bond.id)), 'every newly reviewed Warbond joins the existing reviewed ownership groups');
  for (const reviewed of review.warbonds) {
    const actual = bonds.find(bond => bond.id === reviewed.id);
    assert(Object.entries(reviewed).every(([key, value]) => JSON.stringify(actual[key]) === JSON.stringify(value)), `${reviewed.name} packaged Warbond metadata exactly matches the supplied source review`);
  }
  setView('warbond');
  for (const bond of bonds) {
    assert(new Set(bond.equipmentIds).size === bond.equipmentIds.length, `${bond.name} declares a unique equipment set`);
    const actualIds = catalog.items.filter(item => item.warbond === bond.name && item.acquisition?.kind === 'warbond').map(item => item.id).sort();
    assert(JSON.stringify(actualIds) === JSON.stringify([...bond.equipmentIds].sort()), `${bond.name} has exactly its declared equipment, without unrelated acquisitions`);
    assert(bond.equipmentIds.every(id => find(id)?.acquisition?.id === bond.id), `${bond.name} member acquisition IDs match their declared Warbond`);
    assert(WARBOND_ART[bond.name] === bond.coverAssetPath && !/placeholder/i.test(bond.coverAssetPath), `${bond.name} maps to its declared locally bundled cover`);
    await decodeImage(bond.coverAssetPath);
    const group = groupFor(bond);
    const image = group?.querySelector('.warbondHeader img');
    assert(group && image?.getAttribute('src') === bond.coverAssetPath && image.alt.includes(bond.name), `${bond.name} Armory group uses the correct named cover image`);
    if (bond.id === 'warbond:helldivers-mobilize') {
      const access = group.querySelector('[data-warbond-access="standard"]');
      assert(access?.textContent.includes('equipment still requires Medals') && access.textContent.includes('Starter equipment and Superstore purchases are separate'), 'Mobilize visibly distinguishes free access from unlocked gear and separate acquisitions');
      for (const id of ['primary:ar-23-liberator', 'sidearm:p-2-peacemaker', 'throwable:g-12-high-explosive']) {
        assert(!bond.equipmentIds.includes(id) && find(id)?.acquisition.kind === 'base-game', `${id} remains starter equipment outside Mobilize bulk controls`);
      }
    }
    assertWholeSetCounter(bond, 'fresh catalog');
  }
  renderCatalogAuditStatus();
  const auditStatus = document.querySelector('#catalogAuditStatus');
  const summary = getCatalogSourceIndex().summary();
  assert(summary.total === freshCount && summary.primary + summary.community + summary.pending === freshCount, 'source audit counts partition the actual canonical catalog without hardcoded totals');
  assert(auditStatus?.textContent.includes(`${summary.primary} official-source`) && auditStatus.textContent.includes(`${summary.community} community-source`) && auditStatus.textContent.includes(`${summary.pending} pending / ${summary.total}`), 'visible source-audit counts reflect current bundled facts');
  assert(JSON.stringify(flags(state.items)) === JSON.stringify(baselineFlags), 'source review, equipment-set validation and all cover decoding leave ownership unchanged');

  const originalAlert = window.alert;
  window.alert = () => {};
  try {
    const baseLoadout = rollLoadout('WARBOND-SOURCE-HISTORY');
    assert(!!baseLoadout, 'fresh equipment pools still produce a real loadout');
    const reviewedStratagems = sourceSpecs.filter(spec => spec.category === 'stratagem');
    const reviewedStratagemIds = new Set(reviewedStratagems.map(spec => spec.id));
    const historySubjects = sourceSpecs.filter(spec => spec.category === 'stratagem' || spec.canonical !== spec.previousName);
    const historySubjectIds = new Set(historySubjects.map(spec => spec.id));
    const neutralStratagems = freshItems.stratagems.filter(item => !reviewedStratagemIds.has(item.id)).slice(0, 4).map(item => item.name);
    assert(neutralStratagems.length === 4, 'history fixture can fill other stratagem slots without accidentally selecting the reviewed stratagems');
    for (const key of [...new Set(historySubjects.filter(spec => spec.category !== 'stratagem').map(spec => spec.key))]) {
      const neutral = freshItems[key].find(item => !historySubjectIds.has(item.id));
      assert(!!neutral, `${categories[key]} history fixture has a neutral item outside the renamed identities`);
      baseLoadout[categories[key]] = neutral.name;
    }
    const historySelections = review.warbonds.map(bond => {
      const candidates = bond.equipmentIds.map(id => findRecord(id)).filter(Boolean);
      const first = candidates.find(record => reviewedStratagemIds.has(record.item.id)) || candidates[0];
      return { bond: bond.name, id: first.item.id, key: first.key, label: first.item.aliases?.[0] || first.item.name };
    });
    for (const spec of historySubjects) {
      for (const label of [...new Set([spec.canonical, ...spec.aliases])]) {
        historySelections.push({ bond: spec.group, id: spec.id, key: spec.key, label });
      }
    }
    const historicalCards = historySelections.map((selection, index) => {
      const loadout = clone(baseLoadout);
      loadout.stratagems = neutralStratagems.slice();
      const label = selection.label;
      if (selection.key === 'stratagems') loadout.stratagems[0] = label;
      else loadout[categories[selection.key]] = label;
      loadout.fingerprint = fingerprintLoadout(loadout);
      return normalizeCardRecord({
        ...loadout, id: `warbond-source-history-${index}`, createdAt: new Date(Date.UTC(2026, 8, 14, 16, index)).toISOString(),
        playerName: 'Warbond History Fixture', difficulty: 7, statsLocked: true, statsLockedAt: '2026-09-14T17:00:00.000Z',
        majorOrderDone: index % 2 === 0, planet: null, planetBiome: null,
        stats: { kills: 220 + index, accuracy: 75, deaths: index, stims: 4, bulletCount: 1200, stratUses: 18, distanceKm: 4, blueSideObjCount: index, extractedSafely: true },
        originalNote: `Keep the recorded ${selection.bond} label: ${label}`, notes: `Keep the recorded ${selection.bond} label: ${label}`, commentNotes: []
      });
    });
    const historyItemSpecs = historySubjects.map(spec => ({
      id: spec.id, canonical: spec.canonical, previousName: spec.previousName, aliases: clone(spec.aliases), category: spec.category,
      total: historySelections.filter(selection => selection.id === spec.id).length,
      moSuccess: historySelections.filter((selection, index) => selection.id === spec.id && index % 2 === 0).length
    }));
    const historyStratagemSpecs = historyItemSpecs.filter(spec => spec.category === 'stratagem');
    for (const spec of historyItemSpecs) {
      const includesLabel = (card, label) => spec.category === 'stratagem' ? card.stratagems.includes(label) : card[spec.category] === label;
      assert(historicalCards.some(card => includesLabel(card, spec.canonical)), `${spec.canonical} has a historical ${spec.category}-slot fixture under its canonical name`);
      assert(spec.aliases.every(alias => historicalCards.some(card => includesLabel(card, alias))), `${spec.canonical} has historical ${spec.category}-slot fixtures for every reviewed alias`);
      if (spec.previousName !== spec.canonical) assert(historicalCards.some(card => includesLabel(card, spec.previousName)), `${spec.canonical} has a historical card retaining its previous label ${spec.previousName}`);
    }
    state.cards = historicalCards; refreshLockedStatsBaseline(); recalcGrades();
    const historyBaseline = JSON.stringify(historicalCards);
    const assertReviewedHistory = label => {
      if (!historyItemSpecs.length) return;
      const before = JSON.stringify(state.cards);
      const armory = buildArmoryStats(state.cards);
      const analytics = buildItemAnalytics(state.cards);
      for (const spec of historyItemSpecs) {
        const simple = armory.get(spec.canonical);
        const detailed = analytics.itemStats.filter(row => row.slot === spec.category && row.name === spec.canonical);
        // The legacy compact Armory counters do not include booster slots.
        if (spec.category !== 'booster') assert(simple?.rolledCount === spec.total && simple.moSuccessCount === spec.moSuccess, `${label}: ${spec.canonical} canonical/alias history has the expected Armory totals`);
        assert(detailed.length === 1 && detailed[0].total === spec.total && detailed[0].moSuccess === spec.moSuccess, `${label}: ${spec.canonical} canonical/alias history remains one detailed ${spec.category} row`);
        assert(spec.aliases.filter(alias => alias !== spec.canonical).every(alias => (spec.category === 'booster' || !armory.has(alias)) && !analytics.itemStats.some(row => row.slot === spec.category && row.name === alias)), `${label}: ${spec.canonical} does not split historical analytics by its previous or full-name aliases`);
      }
      assert(JSON.stringify(state.cards) === before && before === historyBaseline, `${label}: reviewed-item analytics preserve recorded labels, fingerprints, locked stats and scores exactly`);
    };
    state.cards = []; refreshLockedStatsBaseline();
    const oldItems = clone(freshItems);
    recordsFrom(oldItems).forEach(({ item }, index) => {
      item.owned = index % 3 !== 0; item.enabled = index % 3 === 2;
      item.warbondSmokeNote = { retain: item.id, choice: index % 3 };
      const correction = review.items.find(row => row.id === item.id);
      if (correction) {
        item.name = correction.previousName; item.warbond = 'Old source label'; item.source = 'Old source label';
        item.aliases = [];
        if (Object.hasOwn(correction, 'subgroup')) item.subgroup = 'old-subgroup';
        item.acquisition = { kind: 'unverified', label: 'Old source label', verification: 'legacy-assignment-pending-audit' };
      }
      if (review.freshInstallExclusions?.includes(item.id)) {
        // A fresh default change must never revoke an existing saved opt-in.
        item.owned = true; item.enabled = true;
      }
    });
    const customIds = bonds.map((bond, index) => {
      const id = `custom:primary:warbond-smoke-${index}`;
      oldItems.primaries.push({ id, name: `Unverified custom equipment ${index}`, warbond: bond.name, owned: true, enabled: false,
        acquisition: clone(find(bond.equipmentIds[0]).acquisition), warbondSmokeNote: { pretendSource: bond.id, keep: true } });
      return id;
    });
    const fixture = { items: oldItems, cards: clone(historicalCards), settings: { ...clone(buildPersistedStatePayload().settings), rememberedPlayerName: 'Warbond Restart Diver' } };
    const expectedImportFlags = flags(oldItems);
    applyImportedData(clone(fixture));
    assert(JSON.stringify(flags(state.items)) === JSON.stringify(expectedImportFlags), 'whole-catalog legacy import preserves every ownership/include flag, including custom rows');
    for (const id of review.freshInstallExclusions || []) assert(find(id)?.owned === true && find(id)?.enabled === true, `${id} saved opt-in overrides the new fresh-profile exclusion`);
    assert(JSON.stringify(ids(state.items)) === JSON.stringify([...freshIds, ...customIds].sort()), 'whole-catalog source refresh keeps every stable ID and each custom record');
    assert(JSON.stringify(state.cards) === historyBaseline, 'source-correcting import preserves historical labels, fingerprints, locked stats and scores exactly');
    assertReviewedHistory('source-correcting import');
    sourceSpecs.forEach(spec => assertSource(spec, 'legacy import'));
    assert(records().every(({ item }) => JSON.stringify(item.warbondSmokeNote) === JSON.stringify(recordsFrom(oldItems).find(row => row.item.id === item.id).item.warbondSmokeNote)), 'source-correcting import retains all arbitrary per-item user metadata');
    assert(customIds.every(id => getCatalogSourceInfo(find(id)).kind === 'custom' && !getCatalogSourceInfo(find(id)).reviewed), 'custom rows with copied Warbond provenance are never treated as verified equipment');
    const renamedSpecs = sourceSpecs.filter(spec => spec.canonical !== spec.previousName);
    if (renamedSpecs.length) {
      const nameOnlyFixture = clone(fixture);
      for (const spec of renamedSpecs) delete nameOnlyFixture.items[spec.key].find(item => item.id === spec.id).id;
      applyImportedData(nameOnlyFixture);
      assert(JSON.stringify(flags(state.items)) === JSON.stringify(expectedImportFlags), 'old name-only renamed-item import preserves every canonical ownership/include flag');
      assert(JSON.stringify(ids(state.items)) === JSON.stringify([...freshIds, ...customIds].sort()), 'old name-only renamed-item import resolves to the existing stable IDs without adding custom duplicates');
      renamedSpecs.forEach(spec => assertSource(spec, 'old name-only import'));
      assertReviewedHistory('old name-only import');
    }

    for (const bond of bonds) {
      setView('warbond', bond.name);
      assertWholeSetCounter(bond, 'before bulk changes');
      const unrelatedFlags = JSON.stringify(flags(state.items, bond.equipmentIds));
      bulk(bond, 'enable');
      assert(bond.equipmentIds.every(id => find(id).owned && find(id).enabled), `${bond.name} bulk enable selects every declared item`);
      assert(JSON.stringify(flags(state.items, bond.equipmentIds)) === unrelatedFlags, `${bond.name} bulk enable excludes every unrelated and custom same-label row`);
      assertNewGearSync(bond, 'bulk enable');
      const member = findRecord(bond.equipmentIds[0]);
      setView('warbond', member.item.name);
      assert(bond.equipmentIds.some(id => !matchesItemSearch(find(id), categories[findRecord(id).key], normalizeText(member.item.name))), `${bond.name} filtered bulk fixture hides another member from the search results`);
      const visibleMembers = [...groupFor(bond).querySelectorAll('input[aria-label]')].filter(element => bond.equipmentIds.some(id => element.getAttribute('aria-label') === `Owned: ${find(id).name}`));
      assert(visibleMembers.length > 0 && visibleMembers.length < bond.equipmentIds.length, `${bond.name} filtered action runs while the DOM shows fewer than the full equipment set`);
      assertWholeSetCounter(bond, 'filtered search before action');
      bulk(bond, 'exclude');
      assert(bond.equipmentIds.every(id => find(id).owned && !find(id).enabled), `${bond.name} filtered bulk exclude reaches all declared members and preserves ownership`);
      assert(JSON.stringify(flags(state.items, bond.equipmentIds)) === unrelatedFlags, `${bond.name} filtered bulk exclude preserves all unrelated choices`);
      assertNewGearSync(bond, 'bulk exclude');
      bulk(bond, 'enable');
      assert(bond.equipmentIds.every(id => find(id).owned && find(id).enabled), `${bond.name} filtered enable restores all members, including hidden search results`);
      bulk(bond, 'unowned');
      assert(bond.equipmentIds.every(id => !find(id).owned && !find(id).enabled), `${bond.name} bulk unowned removes ownership and inclusion together`);
      assert(JSON.stringify(flags(state.items, bond.equipmentIds)) === unrelatedFlags, `${bond.name} all bulk transitions leave unrelated/custom choices untouched`);
      assertNewGearSync(bond, 'bulk unowned');

      setView('category', member.item.name);
      const categoryBox = document.querySelector(`#${containers[member.key]}`);
      const ownedControl = [...categoryBox.querySelectorAll('input')].find(element => element.getAttribute('aria-label') === `Owned: ${member.item.name}`);
      assert(ownedControl && !ownedControl.checked, `${member.item.name} category view reflects the Warbond unowned action`);
      ownedControl.click();
      assert(find(member.item.id).owned && !find(member.item.id).enabled, `${member.item.name} individual ownership does not silently enable rolls`);
      const includeControl = [...document.querySelector(`#${containers[member.key]}`).querySelectorAll('button')].find(element => element.getAttribute('aria-label') === `Include in rolls: ${member.item.name}`);
      assert(includeControl && !includeControl.disabled, `${member.item.name} category include control becomes usable after ownership`);
      includeControl.click();
      setView('warbond', bond.name);
      const warbondOwned = [...groupFor(bond).querySelectorAll('input')].find(element => element.getAttribute('aria-label') === `Owned: ${member.item.name}`);
      const warbondEnabled = [...groupFor(bond).querySelectorAll('button')].find(element => element.getAttribute('aria-label') === `Include in rolls: ${member.item.name}`);
      assert(warbondOwned?.checked && warbondEnabled?.getAttribute('aria-pressed') === 'true', `${member.item.name} category change is reflected in its Warbond view`);
      assertWholeSetCounter(bond, 'individual category edit');
      assert(bond.equipmentIds.filter(id => id !== member.item.id).every(id => !find(id).owned && !find(id).enabled), `${member.item.name} individual edit does not enable other Warbond members`);
      assertNewGearSync(bond, 'individual category edit');
      const newOwned = newGearControls(member.item.id).find(element => element.dataset.gearControl === `${member.item.id}:owned`);
      if (newOwned) {
        newOwned.click();
        assert(!find(member.item.id).owned && !find(member.item.id).enabled, `${member.item.name} new-gear panel edit updates the shared ownership state`);
        const sharedOwned = [...groupFor(bond).querySelectorAll('input')].find(element => element.getAttribute('aria-label') === `Owned: ${member.item.name}`);
        assert(sharedOwned && !sharedOwned.checked, `${member.item.name} Warbond view reflects a new-gear panel edit`);
        assertWholeSetCounter(bond, 'new-gear panel edit');
      }
      assert(JSON.stringify(state.cards) === historyBaseline, `${bond.name} ownership controls never change historical Results or scores`);
    }

    sourceSpecs.forEach(spec => assertSource(spec, 'after ownership controls'));
    assertReviewedHistory('after ownership controls');
    const finalData = clone(buildPersistedStatePayload());
    for (const [kind, raw] of [
      ['plain export', JSON.stringify(finalData)],
      ['desktop envelope', JSON.stringify({ saveFormatVersion: 1, applicationVersion: (await desktopStorage?.getAppInfo())?.version || 'browser-fixture', savedAt: new Date().toISOString(), data: finalData })]
    ]) {
      const parsed = parseLegacyBrowserPayload(raw);
      assert(JSON.stringify(parsed.items) === JSON.stringify(finalData.items) && JSON.stringify(parsed.cards) === historyBaseline, `${kind} includes complete catalog choices, custom data and historical Results`);
      applyImportedData(parsed);
      assert(JSON.stringify(state.items) === JSON.stringify(finalData.items) && JSON.stringify(state.cards) === historyBaseline, `${kind} re-import is idempotent and preserves history`);
      assertReviewedHistory(`${kind} re-import`);
    }
    saveState();
    if (desktopStorage) {
      const saved = await desktopStorage.saveState(buildPersistedStatePayload());
      assert(saved?.ok, 'Warbond fixture is flushed through the real desktop storage bridge');
      const loaded = await desktopStorage.loadState();
      assert(JSON.stringify(loaded.data) === JSON.stringify(buildPersistedStatePayload()), 'real desktop disk reload matches the complete Warbond fixture');
    } else {
      assert(localStorage.getItem(STORAGE_KEY) === JSON.stringify(buildPersistedStatePayload()), 'browser fallback contains the exact Warbond fixture');
    }
    setView(review.warbonds.length ? 'warbond' : 'category', review.warbonds[0]?.name || sourceSpecs[0].canonical);
    if (review.warbonds.length) groupFor(review.warbonds[0])?.scrollIntoView({ block: 'start' });
    return {
      checks, sourceSpecs, bonds, reviewedWarbonds: clone(review.warbonds), customIds, freshCount, historyStratagemSpecs, historyItemSpecs,
      expectedIds: ids(state.items), expectedFlags: flags(state.items), expectedItems: clone(state.items), expectedCards: clone(state.cards),
      expectedSettings: clone(buildPersistedStatePayload().settings), expectedAuditSummary: clone(summary), exportData: clone(buildPersistedStatePayload()),
      exportCoverage: 'Plain/enveloped JSON parsing and real desktop save/load; native file pickers and external file-backend checks are runner-owned.',
      artworkCoverage: 'Reviewed item names/aliases and all reviewed Warbond covers decode locally. Network blocking is runner-owned.'
    };
  } finally {
    window.alert = originalAlert;
  }
}

async function rendererWarbondVerify(expected) {
  const checks = [];
  const assert = (condition, label) => {
    if (!condition) throw new Error(`WARBOND RESTART: ${label}`);
    checks.push(label); console.log(`WARBOND RESTART PASS: ${label}`);
  };
  const keys = ['primaries', 'sidearms', 'throwables', 'stratagems', 'boosters'];
  const rows = () => keys.flatMap(key => state.items[key] || []);
  const find = id => rows().find(item => item.id === id);
  const decodeImage = async source => {
    assert(!!source && !/^https?:/i.test(source), `restart image remains local: ${String(source).split('/').pop()}`);
    await new Promise((resolve, reject) => {
      const image = new Image();
      const timeout = setTimeout(() => reject(new Error(`WARBOND RESTART image timeout: ${source}`)), 10000);
      image.onload = () => { clearTimeout(timeout); image.naturalWidth > 0 && image.naturalHeight > 0 ? resolve() : reject(new Error(`Empty artwork: ${source}`)); };
      image.onerror = () => { clearTimeout(timeout); reject(new Error(`WARBOND RESTART image failed: ${source}`)); };
      image.src = source;
    });
  };
  await bootStateReady;
  await Promise.all([preloadItemVisuals(), loadItemImageDb(), loadReviewedWarbondCatalog()]);
  assert(rows().length === expected.freshCount + expected.customIds.length, 'separate process restores the canonical catalog plus only the expected custom rows');
  assert(itemVisuals.loaded && itemVisuals.validation.errors.length === 0, 'restarted item visual data validates without missing stratagem categories');
  assert(JSON.stringify(rows().map(item => item.id).sort()) === JSON.stringify(expected.expectedIds), 'separate process restores the complete stable-ID set');
  assert(JSON.stringify(rows().map(item => [item.id, item.owned, item.enabled]).sort((a, b) => a[0].localeCompare(b[0]))) === JSON.stringify(expected.expectedFlags), 'separate process restores all ownership/include choices');
  assert(keys.every(key => JSON.stringify(state.items[key]) === JSON.stringify(expected.expectedItems[key])), 'separate process restores all catalog facts, aliases, custom metadata and ownership exactly');
  assert(JSON.stringify(state.cards) === JSON.stringify(expected.expectedCards), 'separate process preserves historical labels, fingerprints, locked stats, notes and scores exactly');
  assert(JSON.stringify(buildPersistedStatePayload().settings) === JSON.stringify(expected.expectedSettings), 'separate process preserves saved player and supported preferences exactly');
  assert(expected.customIds.every(id => getCatalogSourceInfo(find(id)).kind === 'custom' && !getCatalogSourceInfo(find(id)).reviewed), 'custom same-label rows remain explicitly unverified after restart');
  for (const spec of expected.sourceSpecs) {
    const item = find(spec.id);
    assert(item?.name === spec.canonical && spec.aliases.every(alias => item.aliases?.includes(alias)), `${spec.canonical} source identity and aliases survive restart`);
    if (Object.hasOwn(spec, 'subgroup')) assert(item.subgroup === spec.subgroup, `${spec.canonical} reviewed subgroup ${spec.subgroup} survives restart`);
    assert(spec.aliases.every(alias => canonicalItemName(alias) === spec.canonical), `${spec.canonical} aliases resolve to the same canonical name after restart`);
    assert(JSON.stringify(getCatalogSourceInfo(item)) === JSON.stringify(spec.expectedInfo), `${spec.canonical} exact reviewed source metadata survives restart`);
    for (const name of [...new Set([spec.canonical, ...spec.aliases])]) {
      const visual = getItemVisual(name, spec.category);
      assert(visual?.src === spec.assetPath && !/placeholder/i.test(visual.src), `${name} resolves unchanged non-placeholder artwork after restart`);
      await decodeImage(visual.src);
    }
  }
  if (expected.historyItemSpecs?.length) {
    const before = JSON.stringify(state.cards);
    const armory = buildArmoryStats(state.cards);
    const analytics = buildItemAnalytics(state.cards);
    for (const spec of expected.historyItemSpecs) {
      const simple = armory.get(spec.canonical);
      const detailed = analytics.itemStats.filter(row => row.slot === spec.category && row.name === spec.canonical);
      if (spec.category !== 'booster') assert(simple?.rolledCount === spec.total && simple.moSuccessCount === spec.moSuccess, `${spec.canonical} canonical/alias ${spec.category} history restores exact Armory totals`);
      assert(detailed.length === 1 && detailed[0].total === spec.total && detailed[0].moSuccess === spec.moSuccess, `${spec.canonical} canonical/alias ${spec.category} history restores one accurate detailed row`);
      assert(spec.aliases.filter(alias => alias !== spec.canonical).every(alias => (spec.category === 'booster' || !armory.has(alias)) && !analytics.itemStats.some(row => row.slot === spec.category && row.name === alias)), `${spec.canonical} historical aliases do not split analytics after restart`);
      if (spec.previousName !== spec.canonical) assert(state.cards.some(card => spec.category === 'stratagem' ? card.stratagems.includes(spec.previousName) : card[spec.category] === spec.previousName), `${spec.canonical} historical previous name remains unchanged after restart`);
    }
    assert(JSON.stringify(state.cards) === before && before === JSON.stringify(expected.expectedCards), 'restart reviewed-item analytics preserve historical labels, fingerprints, locked stats and scores exactly');
  }
  localStorage.setItem(ITEMS_VIEW_MODE_KEY, 'warbond');
  localStorage.setItem(ITEMS_TYPE_FILTER_KEY, 'all');
  if (typeof setArmoryPreferences === 'function') setArmoryPreferences({ viewMode: 'warbond', typeFilter: 'all', ownershipFilter: 'all' });
  if (document.querySelector('#manualPoolBlock')?.hidden) document.querySelector('[data-target="manualPoolBlock"]')?.click();
  document.querySelector('#itemSearch').value = '';
  renderItems(); switchTab('items');
  for (const bond of expected.bonds) {
    const actualIds = rows().filter(item => getCatalogSourceInfo(item).kind === 'warbond' && getCatalogSourceInfo(item).group === bond.name).map(item => item.id).sort();
    assert(JSON.stringify(actualIds) === JSON.stringify([...bond.equipmentIds].sort()), `${bond.name} exact verified equipment set survives restart without custom-row contamination`);
    assert(WARBOND_ART[bond.name] === bond.coverAssetPath, `${bond.name} retains its bundled cover mapping`);
    await decodeImage(bond.coverAssetPath);
    const group = [...document.querySelectorAll('.warbondGroup[data-warbond-id]')].find(element => element.dataset.warbondId === bond.id);
    assert(group && ['enable', 'exclude', 'unowned'].every(action => group.querySelector(`[data-warbond-action="${action}"]`)), `${bond.name} bulk ownership controls remain available after restart`);
    const counter = group.querySelector('[data-warbond-count]');
    const owned = bond.equipmentIds.filter(id => find(id)?.owned === true).length;
    const included = bond.equipmentIds.filter(id => find(id)?.owned === true && find(id)?.enabled === true).length;
    const ownedMatch = counter?.textContent.match(/\b(\d+) owned\b/);
    const includedMatch = counter?.textContent.match(/\b(\d+) included\b/);
    assert(counter && Number(counter.dataset.warbondCount) === bond.equipmentIds.length && ownedMatch && Number(ownedMatch[1]) === owned && includedMatch && Number(includedMatch[1]) === included, `${bond.name} whole-set counter restores the actual total, owned and included counts`);
    bond.equipmentIds.forEach(id => {
      const item = find(id);
      const owned = [...group.querySelectorAll('input')].find(element => element.getAttribute('aria-label') === `Owned: ${item.name}`);
      const enabled = [...group.querySelectorAll('button')].find(element => element.getAttribute('aria-label') === `Include in rolls: ${item.name}`);
      assert(owned?.checked === item.owned && enabled?.getAttribute('aria-pressed') === String(item.owned && item.enabled) && enabled?.disabled === !item.owned, `${item.name} Warbond controls display restored ownership and roll eligibility`);
      const newControls = [...document.querySelectorAll('#newGearContent [data-gear-control]')].filter(element => element.dataset.gearControl.startsWith(`${id}:`));
      newControls.forEach(control => {
        const property = control.dataset.gearControl.slice(id.length + 1);
        assert(control.checked === item[property] && (property !== 'enabled' || control.disabled === !item.owned), `${item.name} new-gear ${property} control agrees after restart`);
      });
    });
  }
  const summary = getCatalogSourceIndex().summary();
  assert(JSON.stringify(summary) === JSON.stringify(expected.expectedAuditSummary), 'source-audit totals remain stable after restart and ignore custom rows');
  renderCatalogAuditStatus();
  const status = document.querySelector('#catalogAuditStatus');
  assert(status?.textContent.includes(`${summary.primary} official-source`) && status.textContent.includes(`${summary.community} community-source`) && status.textContent.includes(`${summary.pending} pending / ${summary.total}`), 'restart displays accurate dynamic audit totals');
  if (desktopStorage) {
    const loaded = await desktopStorage.loadState();
    assert(JSON.stringify(loaded.data) === JSON.stringify(buildPersistedStatePayload()), 'separate-process renderer agrees with the exact disk-backed Warbond save');
  }
  document.querySelector('#itemSearch').value = expected.reviewedWarbonds[0]?.name || expected.sourceSpecs[0].canonical;
  renderItems();
  if (expected.reviewedWarbonds.length) [...document.querySelectorAll('.warbondGroup[data-warbond-id]')].find(element => element.dataset.warbondId === expected.reviewedWarbonds[0].id)?.scrollIntoView({ block: 'start' });
  return { checks };
}

module.exports = { rendererWarbondPhase, rendererWarbondVerify };
