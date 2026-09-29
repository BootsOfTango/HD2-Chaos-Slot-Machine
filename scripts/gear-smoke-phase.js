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
  assert(rows().filter(({ item }) => !['1.1.2', 'hyena-revenants', 'ironclad-democracy'].includes(item.introducedIn)).length === 200 && rows().length === 214, 'fresh catalog has 200 unique legacy items plus fourteen opt-in additions');
  assert(identityReview.merges.every(merge => find(merge.canonicalId)?.legacyIds?.includes(merge.retiredItem.id) && !find(merge.retiredItem.id)), 'both retired duplicate IDs remain compatibility identities, never extra rollable rows');
  assert(!document.querySelector('#newGearNotice').hidden, 'fresh launch displays the catalog review notice');
  assert(document.querySelector('#newGearPanel > summary').textContent.trim()==='NEW GEAR & OWNERSHIP','new-gear heading is not tied to an older Warbond');
  document.querySelector('#btnReviewNewGear').click();
  assert(document.querySelector('#newGearPanel').open && document.querySelector('#tab-items').style.display !== 'none', 'Review new gear opens the Armory panel');

  const freshItems = clone(state.items);
  const meltagun=find('stratagem:40-k-meltagun');
  const meltaVisual=getItemVisual('40-K Meltagun','stratagem');
  assert(meltagun?.subgroup==='support'&&meltaVisual.src==='assets/new-gear/40-k-meltagun-stratagem.svg','Meltagun resolves to a support-stratagem icon rather than its weapon render');
  await decodeImage(meltaVisual.src);
  const ironclad=rows().filter(({item})=>item.introducedIn==='ironclad-democracy');
  assert(ironclad.length===8 && ironclad.every(({item})=>!item.owned&&!item.enabled),'eight Ironclad-era additions start excluded');
  state.settings.catalogReviewVersion='hyena-revenants';renderNewGearNotice();
  assert(!document.querySelector('#newGearNotice').hidden,'previous review dismissal cannot conceal Ironclad additions');
  const otherGear=JSON.stringify(rows().filter(({item})=>item.introducedIn!=='ironclad-democracy').map(({item})=>item));
  click('enable-ironclad-democracy');
  assert(rows().filter(({item})=>item.acquisition.id==='warbond:ironclad-democracy').every(({item})=>item.owned&&item.enabled),'Ironclad bulk action enables all seven declared unlocks');
  assert(!find('primary:las-12-sai').owned&&!find('primary:las-12-sai').enabled,'Ironclad bulk action does not grant separate Superstore Sai');
  assert(JSON.stringify(rows().filter(({item})=>item.introducedIn!=='ironclad-democracy').map(({item})=>item))===otherGear,'Ironclad bulk action leaves every other item unchanged');
  for(const {item,key} of ironclad){
    const target=find(item.id),before=clone(state.items[key]);
    state.items[key].forEach(i=>HD2CSMCatalogState.setEnabled(i,false));
    HD2CSMCatalogState.setOwned(target,true);HD2CSMCatalogState.setEnabled(target,true);
    assert(rollLoadout('IRONCLAD-OPT-IN')[categories[key]]===item.name,'actual roll uses opted-in '+item.name+' in its correct slot');
    assert(getItemVisual(item.name,categories[key]).src==='assets/catalog-additions/ironclad/'+item.id.split(':')[1]+'.png','Ironclad visual resolves to its own local icon: '+item.name);
    await decodeImage(getItemVisual(item.name,categories[key]).src);
    if(['primary:ar-11-arbitrator','primary:gl-15-evictor','primary:las-12-sai'].includes(item.id)){
      const image=new Image();image.src=getItemVisual(item.name,categories[key]).src;await image.decode();
      const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
      const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
      assert(image.naturalWidth>=1000&&ctx.getImageData(0,0,1,1).data[3]===0,'high-resolution transparent weapon tile: '+item.name);
    }
    state.items[key]=before;
  }
  await decodeImage(WARBOND_ART['Ironclad Democracy']);
  state.items=clone(freshItems);renderItems();
  const hyenaId = 'primary:r-4-hyena';
  assert(find(hyenaId)?.owned === false && find(hyenaId)?.enabled === false, 'Hyena starts unowned and excluded in a fresh install');
  state.settings.catalogReviewVersion = '1.1.2'; renderNewGearNotice();
  assert(!document.querySelector('#newGearNotice').hidden, 'old dismissed review does not hide the newly added campaign reward');
  click(`${hyenaId}:owned`); click(`${hyenaId}:enabled`);
  const beforeHyenaRoll = clone(state.items);
  state.items.primaries.forEach(item => window.HD2CSMCatalogState.setEnabled(item,item.id === hyenaId));
  assert(rollLoadout('HYENA-ONLY').primary === 'R-4 Hyena', 'actual roulette can select the opted-in Hyena');
  state.items = beforeHyenaRoll; renderItems();
  click(`${hyenaId}:owned`);
  assert(!find(hyenaId).owned && !find(hyenaId).enabled, 'unowning Hyena removes it from rolls');
  await loadReviewedWarbondCatalog();
  const ironcladDefinition=reviewedWarbondData.definitions.find(d=>d.id==='warbond:ironclad-democracy');
  assert(ironcladDefinition?.equipment.length===7,'full Armory loads the reviewed seven-item Ironclad group');
  const revenants = reviewedWarbondData.definitions.find(definition => definition.id === 'warbond:righteous-revenants');
  assert(revenants?.equipment.length === 3, 'Righteous Revenants exposes a reviewed three-weapon group');
  await decodeImage(WARBOND_ART['Righteous Revenants']);
  const beforeRevenants = clone(state.items);
  const membership = new Set(revenants.equipment.map(item => item.id));
  if (document.querySelector('#manualPoolBlock')?.hidden) document.querySelector('[data-target="manualPoolBlock"]')?.click();
  localStorage.setItem(ITEMS_VIEW_MODE_KEY, 'warbond');
  localStorage.setItem(ITEMS_TYPE_FILTER_KEY, 'all');
  if (typeof setArmoryPreferences === 'function') setArmoryPreferences({ viewMode: 'warbond', typeFilter: 'all', ownershipFilter: 'all' });
  document.querySelector('#itemSearch').value = 'StA-11'; renderItems();
  for (const operation of ['unowned', 'enable', 'exclude']) {
    const group = document.querySelector('[data-warbond-id="warbond:righteous-revenants"]');
    const button = group?.querySelector(`[data-warbond-action="${operation}"]`);
    assert(button && !button.disabled, `Righteous ${operation} control is available with a filtered list`);
    button.click();
    assert(getReviewedWarbondMembers(revenants).every(item => item.owned === (operation !== 'unowned') && item.enabled === (operation === 'enable')), `Righteous ${operation} updates exactly its three weapon choices`);
  }
  assert(document.querySelector('[data-warbond-id="warbond:righteous-revenants"] .warbondHeader img')?.getAttribute('src') === WARBOND_ART['Righteous Revenants'], 'Righteous group displays its bundled cover instead of a placeholder');
  assert(rows().filter(({item})=>!membership.has(item.id)).every(({key,item}) => JSON.stringify(item) === JSON.stringify(beforeRevenants[key].find(old=>old.id===item.id))), 'Righteous controls preserve every unrelated item including Hyena and WASP');
  const beforeIroncladGroup=clone(state.items);
  document.querySelector('#itemSearch').value='Arbitrator';renderItems();
  const ironcladGroup=document.querySelector('[data-warbond-id="warbond:ironclad-democracy"]');
  assert(ironcladGroup?.querySelector('.warbondHeader img')?.getAttribute('src')===WARBOND_ART['Ironclad Democracy'],'Ironclad search reveals its sourced bundled cover');
  const ironcladThumb=ironcladGroup.querySelector('.itemVisualCell img');
  assert(ironcladThumb&&getComputedStyle(ironcladThumb).objectFit==='contain','full Armory thumbnail shows the complete wide Ironclad item without cropping');
  const listBackdrop=getComputedStyle(ironcladThumb.closest('.itemVisualCell')).backgroundColor;
  assert(listBackdrop==='rgb(32, 37, 32)'&&getComputedStyle(document.querySelector('#newGearContent .newGearRow img')).backgroundColor===listBackdrop,'new gear and Armory lists share a plain dark equipment backdrop');
  for(const operation of ['enable','exclude','unowned']){
    const group=document.querySelector('[data-warbond-id="warbond:ironclad-democracy"]');
    const button=group?.querySelector(`[data-warbond-action="${operation}"]`);
    assert(button&&!button.disabled,'filtered Ironclad '+operation+' control is usable');button.click();
    assert(getReviewedWarbondMembers(ironcladDefinition).every(i=>i.owned===(operation!=='unowned')&&i.enabled===(operation==='enable')),'filtered Ironclad '+operation+' applies to all seven members');
  }
  const ironcladIds=new Set(ironcladDefinition.equipment.map(i=>i.id));
  assert(rows().filter(({item})=>!ironcladIds.has(item.id)).every(({key,item})=>JSON.stringify(item)===JSON.stringify(beforeIroncladGroup[key].find(old=>old.id===item.id))),'full Armory Ironclad bulk controls preserve Sai and all unrelated equipment');
  document.querySelector('#itemSearch').value = '';
  localStorage.setItem(ITEMS_VIEW_MODE_KEY, 'category');
  if (typeof setArmoryPreferences === 'function') setArmoryPreferences({ viewMode: 'category' });
  state.items = beforeRevenants; renderItems();
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
  assert(imageElements.length === 16, 'new gear panel renders fourteen item images and both Warbond covers');
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

  const oldFlags = JSON.stringify(rows().filter(({ item }) => !['1.1.2', 'hyena-revenants', 'ironclad-democracy'].includes(item.introducedIn)).map(({ item }) => [item.id, item.owned, item.enabled]));
  click('enable-castellans-creed');
  assert(warbondIds.every(id => find(id).owned && find(id).enabled), 'Warbond bulk enable selects all four declared-unlocked items');
  assert(find(rewardId).owned === false && find(rewardId).enabled === false, 'Warbond bulk enable never grants the campaign reward');
  assert(rows().filter(({item})=>item.introducedIn==='ironclad-democracy').every(({item})=>!item.owned&&!item.enabled),'Castellan bulk action never grants Ironclad or Sai');
  assert(JSON.stringify(rows().filter(({ item }) => !['1.1.2', 'hyena-revenants', 'ironclad-democracy'].includes(item.introducedIn)).map(({ item }) => [item.id, item.owned, item.enabled])) === oldFlags, 'Warbond bulk action leaves every legacy gear flag unchanged');

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
    legacyItems[key] = legacyItems[key].filter(item => !['1.1.2', 'hyena-revenants', 'ironclad-democracy'].includes(item.introducedIn)).map((item, index) => {
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
  const aliasSource = keys.flatMap(key => DEFAULTS.items[key].map(item => ({ key, item }))).find(({ item }) => !['1.1.2', 'hyena-revenants', 'ironclad-democracy'].includes(item.introducedIn) && !item.legacyIds?.length && item.aliases?.some(alias => ownership.normalizeName(alias) !== ownership.normalizeName(item.name)));
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
  assert(rows().length === 214 && rows().filter(({ item }) => !['1.1.2', 'hyena-revenants', 'ironclad-democracy'].includes(item.introducedIn)).length === 200, '202 historical rows migrate to 200 unique legacy identities plus fourteen excluded additions');
  assert(rows().filter(({ item }) => !['1.1.2', 'hyena-revenants', 'ironclad-democracy'].includes(item.introducedIn)).every(({ key, item }) => {
    const original = legacyItems[key].find(legacy => legacy.name === item.name);
    return original && item.enabled === original.enabled && item.owned === original.enabled;
  }), 'legacy import preserves every canonical enabled/disabled choice and derives ownership without OR-enabling duplicates');
  for (const spec of retiredFixtures) {
    const canonical = find(spec.canonicalId);
    assert(canonical.legacyAliasRecords?.some(record => JSON.stringify(record) === JSON.stringify(spec.original)), `${spec.original.name} conflicting original record remains fully recoverable`);
    assert(!rows().some(({ item }) => item.name === spec.original.name), `${spec.original.name} no longer independently weights the roll pool`);
  }
  assert(additions().every(({ item }) => !item.owned && !item.enabled), 'upgrading the 202-item legacy fixture does not opt into new gear');
  assert(!find(hyenaId).owned && !find(hyenaId).enabled, 'legacy upgrade leaves Hyena unowned and excluded');
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
  click(`${hyenaId}:owned`); click(`${hyenaId}:enabled`);
  click('primary:las-12-sai:owned'); click('primary:las-12-sai:enabled');
  click('booster:integrated-extinguishers:owned');
  const finalData = clone(buildPersistedStatePayload());
  assert(finalData.settings.catalogReviewVersion === 'ironclad-democracy' && document.querySelector('#newGearNotice').hidden, 'review dismissal is represented in saved settings and hides the notice');
  const browserExport = JSON.stringify({ ...finalData, cards: normalizeAndMigrateIncomingCards(clone(finalData.cards)).cards });
  const desktopEnvelope = JSON.stringify({ saveFormatVersion: 1, applicationVersion: '1.1.2', savedAt: '2026-09-13T12:00:00.000Z', exportedAt: '2026-09-13T12:00:00.000Z', data: JSON.parse(browserExport) });
  for (const [kind, raw] of [['browser payload', browserExport], ['desktop envelope fixture', desktopEnvelope]]) {
    const parsed = parseLegacyBrowserPayload(raw);
    assert(keys.every(key => parsed.items[key].every(item => item.id && typeof item.enabled === 'boolean' && typeof item.owned === 'boolean')) && parsed.settings.catalogReviewVersion === 'ironclad-democracy', `${kind} preserves IDs, ownership, inclusion and catalog review version`);
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
    checks, alerts, newIds, primaryId, rewardId, hyenaId, customId: custom.id, addedCustomIds,
    expectedItems: clone(state.items), expectedCards: clone(state.cards), expectedSettings: clone(buildPersistedStatePayload().settings),
    exportData: JSON.parse(browserExport),
    exportCoverage: 'Renderer payload serialization and parsing plus real desktop save/load. Native export dialog and browser download are runner-owned, not exercised here.',
    artworkCoverage: 'Sixteen new-gear panel images decoded, including all eight Ironclad-era icons; offline behavior requires runner-blocked HTTP/HTTPS.'
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
  assert(find(expected.hyenaId)?.owned === true && find(expected.hyenaId)?.enabled === true, 'Hyena ownership and inclusion survive export/import and a separate-process restart');
  assert(find('primary:las-12-sai')?.owned && find('primary:las-12-sai')?.enabled,'separate Superstore Sai remains opted in across imports and restart');
  assert(find('booster:integrated-extinguishers')?.owned && !find('booster:integrated-extinguishers')?.enabled,'owned but excluded Ironclad booster remains excluded across imports and restart');
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
