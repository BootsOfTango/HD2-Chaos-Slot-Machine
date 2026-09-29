/* Integration checks run against the real renderer, preload bridge and disk storage.
 * Only native file dialogs and network availability are controlled by the harness.
 * Exported renderer functions can also be evaluated through CDP in the packaged EXE.
 */
async function rendererWritePhase(options = {}) {
  const checks = [];
  const assert = (condition, label) => { if (!condition) throw new Error(`SMOKE: ${label}`); checks.push(label); console.log(`SMOKE PASS: ${label}`); };
  const waitFor = async (predicate, label, timeout = 25000) => {
    const start = Date.now();
    while (!predicate()) {
      if (Date.now() - start > timeout) throw new Error(`SMOKE timeout: ${label}`);
      await new Promise(resolve => setTimeout(resolve, 40));
    }
  };
  const click = selector => {
    const element = document.querySelector(selector);
    if (!element || element.disabled) throw new Error(`SMOKE: missing/disabled control ${selector}`);
    element.click();
  };
  const input = (selector, value, event = 'input') => {
    const element = document.querySelector(selector);
    if (!element || element.disabled) throw new Error(`SMOKE: missing/disabled field ${selector}`);
    element.value = String(value);
    element.dispatchEvent(new Event(event, { bubbles: true }));
  };
  const alerts = [];
  window.alert = value => alerts.push(String(value));
  window.confirm = () => true;
  window.prompt = () => 'CLEAR ALL DATA';
  await bootStateReady;
  if (typeof missionUIReady !== 'undefined') await missionUIReady;
  await preloadItemVisuals();
  const fanNotice = document.querySelector('#fanNotice');
  assert(fanNotice && !fanNotice.hidden && getComputedStyle(fanNotice).display !== 'none', 'friendly fan credit notice is visible on launch');
  assert(fanNotice.textContent.includes('Sony Interactive Entertainment') && fanNotice.textContent.includes('Arrowhead Game Studios') && fanNotice.textContent.includes('community artwork'), 'notice credits game rights holders and community creators without claiming all project art');
  const beforeNotice = JSON.stringify(state);
  document.querySelector('#dismissFanNotice').focus();
  click('#dismissFanNotice');
  assert(fanNotice.hidden && getComputedStyle(fanNotice).display === 'none', 'Let’s dive dismisses the notice for this session');
  assert(document.activeElement === document.querySelector('[data-tab="spin"]'), 'dismissal returns keyboard focus to Spin');
  assert(JSON.stringify(state) === beforeNotice, 'credit dismissal does not change any player state');
  for (const category of ['primary', 'sidearm', 'throwable', 'booster']) {
    const entries = [...itemVisuals.byCategory[category].values()];
    assert(entries.length > 0 && entries.every(entry => entry.artworkSha256 && entry.artworkSource && !entry.assetPath.includes('placeholders')), `${category} artwork uses bundled source images, not placeholders`);
    await Promise.all(entries.map(entry => new Promise((resolve, reject) => {
      const image = new Image();
      const timer = setTimeout(() => reject(new Error(`Artwork load timed out: ${entry.name}`)), 10000);
      image.onload = () => { clearTimeout(timer); image.naturalWidth > 0 ? resolve() : reject(new Error(`Empty image: ${entry.name}`)); };
      image.onerror = () => { clearTimeout(timer); reject(new Error(`Artwork failed offline: ${entry.name}`)); };
      image.src = entry.assetPath;
    })));
    assert(true, `all ${entries.length} ${category} source images decode successfully offline`);
  }
  await waitFor(() => !isApiPlanetSyncInProgress(), 'first offline planet refresh');
  assert(!!desktopStorage, 'desktop preload storage bridge is active');
  assert(state.cards.length === 0, 'first launch starts with no saved cards');
  assert(['primaries', 'sidearms', 'throwables', 'stratagems', 'boosters', 'planets'].every(key => state.items[key]?.some(item => item.enabled !== false)), 'bundled item and planet pools are usable on first launch');
  assert(/built.in|offline|unable/i.test(document.querySelector('#apiPlanetStatus').textContent), 'offline planet status clearly identifies fallback');
  assert(getPlanetPoolSource().length > 0, 'offline first launch has a usable planet pool');
  const initialOfflineStatus = document.querySelector('#apiPlanetStatus').textContent;
  await Promise.all(HD2PlanetArt.paths.map(src => new Promise((resolve, reject) => {
    const image = new Image(), timer = setTimeout(() => reject(new Error('Planet image timeout: ' + src)), 10000);
    image.onload = () => { clearTimeout(timer); image.naturalWidth > 0 ? resolve() : reject(new Error('Empty planet image')); };
    image.onerror = () => { clearTimeout(timer); reject(new Error('Planet image failed: ' + src)); }; image.src = src;
  })));
  assert(HD2PlanetArt.paths.length === 13, 'all thirteen original biome globes decode offline');
  renderPlanets();
  assert(document.querySelectorAll('#listPlanets .planetGlobe').length === state.items.planets.length, 'every editable Armory planet has a local thumbnail');
  const artFixture = [{name:'<img src=x onerror=alert(1)>', faction:'Automatons', biome:'Moon', enabled:false}, {name:'Unknown terrain', faction:'Terminids', biome:'future-biome', enabled:true}];
  const beforeArt = JSON.stringify(state.current);
  renderApiActivePlanetsRows(artFixture);
  const liveArt = [...document.querySelectorAll('#apiActivePlanetsList .planetGlobe')];
  assert(liveArt.length === 2 && liveArt[0].dataset.planetArt === 'moon' && liveArt[1].dataset.planetArt === 'unknown', 'live/cached Armory rows share biome images and a neutral unknown fallback');
  assert(document.querySelector('#apiActivePlanetsList').textContent.includes(artFixture[0].name) && !document.querySelector('#apiActivePlanetsList [onerror]'), 'planet names remain literal text beside artwork');
  assert(JSON.stringify(state.current) === beforeArt, 'rendering planet artwork cannot change the current run');
  renderWarDataStatus();
  const brokenGlobe = HD2PlanetArt.createImage({biome:'Moon'}); document.body.append(brokenGlobe);
  brokenGlobe.src = 'assets/planets/missing-test-image.svg';
  await waitFor(() => brokenGlobe.getAttribute('src') === 'assets/planets/unknown.svg' && brokenGlobe.complete && brokenGlobe.naturalWidth > 0, 'neutral globe after image failure');
  assert(!brokenGlobe.hidden, 'missing biome image falls back to a decoded local neutral globe');
  brokenGlobe.dispatchEvent(new Event('error'));
  assert(brokenGlobe.hidden, 'failure of the neutral image terminates fallback without an error loop'); brokenGlobe.remove();
  assert(document.querySelector('#rolledPlanetImage').hidden, 'no planet illustration is shown before a planet is selected');

  click('#btnSpin');
  assert(state.ui.difficultyModalOpen, 'Spin opens the difficulty selector');
  input('#difficultyModalSelect', 7, 'change');
  click('#btnConfirmDifficultyModal');
  assert(state.current.spinning && !!state.current.loadout, 'Spin starts reels and generates a loadout without internet');
  const initialLoadout = { ...state.current.loadout };
  assert(['primary', 'sidearm', 'throwable', 'booster', 'faction'].every(key => !!initialLoadout[key]) && initialLoadout.stratagems.length === 4, 'first offline loadout contains all eight item slots and faction');
  assert(document.querySelector('#btnLock').disabled, 'Lock is disabled while item reels are moving');
  await waitFor(() => !state.current.spinning, 'full eight-reel animation');
  assert(document.querySelector('#slotPrimary').textContent.includes(initialLoadout.primary), 'full Spin animation settles on selected primary');
  playTone('final');
  await getAudioCtx().resume();
  assert(audioCtx.state === 'running' && audioCtx.destination.maxChannelCount > 0, 'WebAudio sound context starts with an output destination (not a listening test)');

  state.current.specialActive = true;
  state.current.rerollsLeft = 3;
  renderSpin();
  click('#btnReroll');
  assert(state.current.spinning && state.current._pendingFaction === normalizeFactionName(state.current.loadout.faction), 'special reroll starts animation and preserves the new faction');
  const rerolled = JSON.stringify(state.current);
  doReroll();
  assert(JSON.stringify(state.current) === rerolled, 'repeated reroll cannot change state during animation');
  await waitFor(() => !state.current.spinning, 'special reroll animation');
  click('#btnLock');
  await waitFor(() => !state.current.spinning, 'planet roll after loadout lock');
  assert(state.current.locked && state.current.planetLocked && !!state.current.planet?.name, 'Lock rolls a bundled planet offline');
  assert(document.querySelector('#rolledPlanetImage').getAttribute('src') === HD2PlanetArt.visualFor(state.current.planet).src && !document.querySelector('#rolledPlanetImage').hidden, 'settled planet roll displays its biome globe');
  const previousPlanet = state.current.planet.name;
  click('#btnRerollPlanetInline');
  assert(document.querySelector('#rolledPlanetImage').style.visibility === 'hidden', 'globe is hidden while transient planet names spin');
  await waitFor(() => !state.current.spinning, 'planet reroll');
  const lockedFaction = state.current.faction;
  assert(state.current.planet.name !== previousPlanet && normalizeFactionName(state.current.planet.faction) === lockedFaction, 'planet reroll avoids the current planet and updates faction');
  assert(document.querySelector('#rolledPlanetImage').getAttribute('src') === HD2PlanetArt.visualFor(state.current.planet).src && document.querySelector('#rolledPlanetImage').style.visibility === '', 'reroll restores the correct selected-planet globe');
  if(typeof galaxyApp!=='undefined'){
    await waitFor(()=>!!galaxyApp,'galaxy adapter initialization');
    const runBeforeMap=JSON.stringify(state.current);
    click('#btnSearchPlanetInline');
    assert(document.getElementById('galaxyDialog').open && document.querySelectorAll('#galaxyMapHost .gm-marker').length>=273,'manual planet button opens integrated offline galaxy');
    assert(document.querySelector('#galaxyMapHost .gm-eligible-filter input').checked,'manual planet chooser defaults to eligible-only');
    document.querySelector('#galaxyMapHost .gm-eligible-filter input').click();
    assert(document.querySelector('#galaxyMapHost .gm-count').textContent.includes('274') && document.querySelectorAll('#galaxyMapHost .gm-marker').length===273,'offline map has273 atlas positions plus one unplaced legacy choice, not duplicate atlas entries');
    assert(JSON.stringify(state.current)===runBeforeMap,'opening map leaves current run unchanged');
    assert(document.querySelector('#galaxyMapHost .gm-footer').textContent.includes('approximate'),'integrated map explicitly labels sector shading as approximate');
    click('#galaxyUseList');
    assert(!document.getElementById('galaxyDialog').open && document.getElementById('planetSearchPanel').style.display!=='none','map list fallback returns to existing controls');
    togglePlanetSearchPanel(false);click('#btnSearchPlanetInline');
    assert(document.querySelector('#galaxyMapHost .gm-eligible-filter input').checked,'reopening chooser restores eligible-only after browsing all planets');
    input('#galaxyMapHost .gm-search',state.current.planet.name);
    input('#galaxyMapHost .gm-sector-select','', 'change');
    const eligibleFilter=document.querySelector('#galaxyMapHost .gm-eligible-filter input');eligibleFilter.checked=true;eligibleFilter.dispatchEvent(new Event('change'));
    const choice=document.querySelector('#galaxyMapHost .gm-row');assert(!!choice,'bundled planet remains available via map list');choice.click();
    assert(document.querySelectorAll('#galaxyMapHost .gm-detail .gm-condition svg').length>=2 && document.querySelector('#galaxyMapHost .gm-detail').textContent.includes('Special activity: not reported'),'integrated conditions retain offline icons without inventing special activity');
    const mapKey=HD2PlanetSelection.planetKey(state.current.planet);
    const marker=[...document.querySelectorAll('#galaxyMapHost .gm-marker')].find(node=>node.dataset.key===mapKey);
    assert(!!marker,'offline legacy selection has a positioned marker through reviewed crosswalk');
    marker.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    click('#galaxyMapHost .gm-detail button');await waitFor(()=>!state.current.spinning,'map planet selection animation');
    assert(HD2PlanetSelection.planetKey(state.current.planet)===mapKey && state.current.planet.id==null,'offline marker choice preserves legacy identity without rewriting run data');
    assert(!document.getElementById('galaxyDialog').open && state.current.planetLocked && !state.current.planetConfirmed,'map choice enters existing planet-confirmation flow');
    const previousRun=JSON.parse(runBeforeMap);
    assert(JSON.stringify(state.current.loadout.stratagems)===JSON.stringify(previousRun.loadout.stratagems)&&state.current.rerollsLeft===previousRun.rerollsLeft,'map selection preserves equipment and reroll budget');
  }
  togglePlanetSearchPanel(true);
  assert(document.querySelectorAll('#planetSearchResults .planetGlobe').length > 0, 'manual planet search includes the same offline thumbnails');
  togglePlanetSearchPanel(false);
  click('#btnConfirmPlanetInline');
  assert(state.current.planetConfirmed && !!state.current.mode, 'planet confirmation generates a mission mode');
  assert(!!state.current.missionSelection && missionUI.validSelection(), 'offline first launch selects a specific compatible mission');
  assert(document.getElementById('missionHelp').textContent.includes('partial catalog') && document.getElementById('missionAvailability').textContent.includes('Check in-game'), 'short mission notice and expandable help disclose suggestion limits');
  assert(document.getElementById('missionFreshness').textContent.includes('Availability unconfirmed') && !document.getElementById('missionFreshness').hidden, 'offline mission context is clearly labeled');
  assert(!document.getElementById('operationChecklist').open && !document.getElementById('customMissionDetails').open && !document.getElementById('missionHelp').open, 'advanced mission controls start collapsed');
  assert(!document.querySelector('#missionPlannerPanel #operationChecklist, #missionPlannerPanel #customMissionDetails, #missionPlannerPanel #missionHelp') &&
    ['operationChecklist','customMissionDetails','missionHelp'].every(id => document.getElementById('missionTools').contains(document.getElementById(id))),
    'optional mission tools live only in Armory Advanced, not in the Spin panel');
  assert(document.getElementById('manualPoolBlock').hidden && document.getElementById('openMissionTools').hidden,
    'ordinary suggestions keep Armory Advanced closed and the mission panel uncluttered');
  const visualChoices = [...document.querySelectorAll('#missionChoices button')];
  assert(visualChoices.length === missionUI.info().pool.missions.length && visualChoices.every(b => b.getAttribute('aria-label') && b.querySelector('img') && b.querySelector('small')), 'icon cards expose the complete shared pool with names and durations');
  const previousChoice = state.current.missionSelection.id;
  const nextChoice = visualChoices.find(b => b.dataset.choiceId !== previousChoice) || visualChoices[0];
  nextChoice.focus(); nextChoice.click();
  assert(state.current.missionSelection.id === nextChoice.dataset.choiceId && missionUI.validSelection(), 'clicking a mission card uses shared eligibility');
  assert(document.activeElement === nextChoice && nextChoice.getAttribute('aria-pressed') === 'true' && document.querySelectorAll('#missionChoices [aria-pressed="true"]').length === 1, 'card selection preserves focus and has exactly one selected indicator');
  const visualCatalog = await (await fetch('assets/mission-catalog.json')).json();
  const iconPaths = new Set([...visualCatalog.missions, {id:'custom:test'}].map(row => HD2MissionUI.visualFor(row).src));
  await Promise.all([...iconPaths].map(src => new Promise((resolve, reject) => {
    const img = new Image(); img.onload = () => img.naturalWidth > 0 ? resolve() : reject(new Error('Empty mission icon ' + src));
    img.onerror = () => reject(new Error('Missing mission icon ' + src)); img.src = src;
  })));
  assert([...iconPaths].filter(src => src.endsWith('.png')).length === 60, 'all sixty verified in-game mission crops decode offline');
  const tintedMissionIcons=[...document.querySelectorAll('.missionIcon[src^="assets/missions/game-icons/"]')];
  assert(tintedMissionIcons.length>0 && tintedMissionIcons.every(img=>getComputedStyle(img).filter.includes('sepia(1)')), 'game mission icons receive the yellow display tint');
  assert(visualCatalog.missions.filter(row => HD2MissionUI.visualFor(row).src.endsWith('.svg')).length === 0, 'every catalog mission uses its verified game crop; custom fallback remains available');
  const beforeFactionMissions = deepClone(state.current);
  const factionFixtures = [["eliminate-brood-commanders","Terminids",1],["eliminate-chargers","Terminids",3],["eliminate-bile-titans","Terminids",4],["eliminate-impaler","Terminids",5],["eliminate-devastators","Automatons",1],["eliminate-automaton-hulks","Automatons",3],["eliminate-factory-strider","Automatons",4],["destroy-harvesters","Illuminate",3],["destroy-transmission-network","Automatons",2],["purge-hatcheries","Terminids",2],["nuke-nursery","Terminids",4],["sabotage-air-base","Automatons",3],["neutralize-orbital-defenses","Automatons",4]];
  for (const [id, faction, difficulty] of factionFixtures) {
    const planet = getPlanetPoolSource().find(p => normalizeFactionName(p.faction) === faction);
    assert(!!planet, 'offline fixture includes ' + faction);
    state.current.planet = planet; state.current.faction = faction;
    state.current.difficulty = difficulty; state.current.missionSelection = null;
    renderSpin();
    const button = [...document.querySelectorAll('#missionChoices button')].find(b => b.dataset.choiceId === 'mission:' + id);
    // Even a cached SVG in a newly created img decodes asynchronously.
    // Wait for this rendered element, not only the preloaded Image above.
    if (button) await waitFor(() => button.querySelector('img')?.complete, id + ' rendered icon load', 5000);
    assert(!!button && button.querySelector('img').naturalWidth > 0, id + ' is a decoded offline choice in its faction/difficulty');
    button.click();
    assert(missionUI.validSelection() && state.current.missionSelection.id === 'mission:' + id && state.current.mode === 'Normal (40)', id + ' selects through the shared engine without changing scoring family');
  }
  state.current.difficulty = 7; renderSpin();
  assert(!document.querySelector('#missionChoices [data-choice-id="mission:sabotage-supply-bases"]'), 'uncertain Supply Bases is absent from suggestions');
  state.settings.missionPlanner = {version:1,confirmation:HD2MissionSelection.createEngine(visualCatalog).confirm(missionUI.info().context,[{kind:'catalog',id:'mission:sabotage-supply-bases'}])};
  renderSpin();
  click('#missionChoices [data-choice-id="mission:sabotage-supply-bases"]');
  assert(missionUI.validSelection() && state.current.missionSelection.provenance === 'player-confirmed', 'observed Supply Bases can be selected from the confirmed operation');
  click('#useMissionSuggestions');
  assert(!document.querySelector('#missionChoices [data-choice-id="mission:sabotage-supply-bases"]'), 'clearing confirmation does not promote Supply Bases into global suggestions');
  state.current.planet = getPlanetPoolSource().find(p => normalizeFactionName(p.faction) === 'Illuminate');
  state.current.faction = 'Illuminate'; state.current.difficulty = 5; renderSpin();
  click('#missionChoices [data-choice-id="mission:retrieve-recon-craft-intel"]');
  assert(missionUI.validSelection(), 'Recon Craft Intel is an offline compatible suggestion');
  const illuminateObserved = ["mission:extract-anomalous-material","mission:free-colony","mission:democratize-the-void","mission:take-down-overship","mission:infiltrate-illuminate-lair","mission:repel-invasion-fleet","mission:destroy-exospire","mission:destroy-gazer-spire","mission:blitz-toxic-pollination"];
  document.getElementById('operationChecklist').open = true;
  for (const id of illuminateObserved) {
    assert(!document.querySelector('#missionChoices [data-choice-id="' + id + '"]'), id + ' is not guessed from the faction alone');
    click('[data-mission-id="' + id + '"]');
  }
  click('#confirmOperation');
  assert(missionUI.info().pool.missions.length === 9, 'My operation saves exactly the nine checked Illuminate missions');
  for (const id of illuminateObserved) {
    click('#missionChoices [data-choice-id="' + id + '"]');
    const expected = visualCatalog.missions.find(m => m.id === id);
    assert(missionUI.validSelection() && state.current.missionSelection.provenance === 'player-confirmed' &&
      state.current.missionSelection.minutes === expected.minutes && state.current.mode === expected.scoringFamily,
      id + ' uses the confirmed duration and unchanged scoring family');
  }
  click('#useMissionSuggestions');
  assert(illuminateObserved.every(id => !document.querySelector('#missionChoices [data-choice-id="' + id + '"]')),
    'reset removes all unverified regional choices from the automatic pool');
  document.getElementById('operationChecklist').open = false;
  for (const [front, suggested, observed] of [
    ['Terminids', [], ['mission:mobile-e711-extraction','mission:extract-e711','mission:restart-pumps','mission:cleanse-infested-district','mission:restore-air-quality']],
    ['Automatons', ['mission:seize-industrial-complex','mission:sabotage-orgo-plasma','mission:confiscate-assets'], ['mission:annex-mineral-sites','mission:halt-cyborg-production','mission:blitz-bio-processors','mission:commando-acquire-evidence','mission:commando-extract-intel','mission:commando-secure-black-box']]
  ]) {
    state.current.planet = getPlanetPoolSource().find(p => normalizeFactionName(p.faction) === front);
    state.current.faction = front; state.current.difficulty = 7; renderSpin();
    for (const id of suggested) {
      click('#missionChoices [data-choice-id="' + id + '"]');
      assert(missionUI.validSelection() && state.current.missionSelection.provenance === 'suggested', id + ' appears as a compatible suggestion');
    }
    document.getElementById('operationChecklist').open = true;
    for (const id of observed) {
      assert(!document.querySelector('#missionChoices [data-choice-id="' + id + '"]'), id + ' stays out of ordinary suggestions');
      click('[data-mission-id="' + id + '"]');
    }
    click('#confirmOperation');
    assert(missionUI.info().pool.missions.length === observed.length, front + ' regional operation keeps only checked missions');
    const gearBefore = JSON.stringify([state.current.loadout.primary,state.current.loadout.sidearm,state.current.loadout.throwable,state.current.loadout.booster,state.current.loadout.stratagems,state.current.rerollsLeft]);
    for (const id of observed) {
      click('#missionChoices [data-choice-id="' + id + '"]');
      const expected = visualCatalog.missions.find(m => m.id === id);
      assert(missionUI.validSelection() && state.current.missionSelection.provenance === 'player-confirmed' &&
        state.current.missionSelection.minutes === expected.minutes && state.current.mode === expected.scoringFamily,
        id + ' preserves confirmed timing and scoring family');
      assert(document.getElementById('missionAdvice').hidden === !id.startsWith('mission:commando-'), id + ' shows gear advice only for Commando');
    }
    assert(gearBefore === JSON.stringify([state.current.loadout.primary,state.current.loadout.sidearm,state.current.loadout.throwable,state.current.loadout.booster,state.current.loadout.stratagems,state.current.rerollsLeft]), front + ' mission choices never replace rolled equipment or reroll allowances');
    click('#useMissionSuggestions');
    assert(document.getElementById('missionAdvice').hidden, 'reset clears contextual mission advice');
    assert(observed.every(id => !document.querySelector('#missionChoices [data-choice-id="' + id + '"]')),
      front + ' regional confirmation resets without unlocking the global pool');
    document.getElementById('operationChecklist').open = false;
  }
  state.current = beforeFactionMissions; renderSpin();
  const originalMissionDifficulty = state.current.difficulty;
  state.current.difficulty = 1; renderSpin(); click('#btnRerollMode');
  assert(missionUI.validSelection() && document.querySelectorAll('#missionChoices button').length === missionUI.info().pool.missions.length, 'low-difficulty mission cards and roulette share the expanded offline pool');
  state.current.difficulty = originalMissionDifficulty; renderSpin(); click('#btnRerollMode');
  const previousCatalog = { ...visualCatalog, revision: 'review-2026-09-20-a', missions: visualCatalog.missions.slice(0, 54) };
  const previousConfirmation = HD2MissionSelection.createEngine(previousCatalog).confirm(missionUI.info().context, [{kind:'catalog',id:'mission:launch-icbm'}]);
  state.settings.missionPlanner = {version:1,confirmation:previousConfirmation}; renderSpin();
  assert(missionUI.info().pool.status === 'needs-confirmation' && document.getElementById('missionAvailability').textContent.includes('Review saved list in Armory'), 'catalog upgrade requests review of the old operation without silently adopting it');
  assert(document.getElementById('btnRerollMode').disabled && document.getElementById('btnApplyManualMode').disabled && document.querySelectorAll('#missionChoices button').length === 0, 'old catalog shortlist cannot be rolled or finalized before review');
  assert(JSON.stringify(state.settings.missionPlanner.confirmation) === JSON.stringify(previousConfirmation), 'catalog upgrade preserves the prior checklist for recovery');
  assert(!document.getElementById('openMissionTools').hidden, 'stale list exposes a recovery route to Armory');
  click('#openMissionTools');
  assert(document.querySelector('.tabBtn.active').dataset.tab === 'items' && !document.getElementById('manualPoolBlock').hidden && document.getElementById('operationChecklist').open,
    'recovery link opens the real Armory Advanced section and checklist');
  assert(document.activeElement === document.querySelector('#operationChecklist summary') && JSON.stringify(state.settings.missionPlanner.confirmation) === JSON.stringify(previousConfirmation),
    'opening Armory focuses the checklist without modifying the saved operation');
  click('#backToMission');
  assert(document.querySelector('.tabBtn.active').dataset.tab === 'spin', 'Back to mission returns to Spin without clearing the list');
  click('#useMissionSuggestions'); click('#btnRerollMode');
  assert(missionUI.validSelection(), 'explicit reset enables the expanded suggestions after catalog review');
  const missionEquipment = JSON.stringify([state.current.loadout.primary, state.current.loadout.stratagems, state.current.rerollsLeft]);
  document.getElementById('operationChecklist').open = true;
  document.getElementById('customMissionDetails').open = true;
  click('#confirmOperation');
  assert(state.settings.missionPlanner.confirmation.missions.length === 0 && !state.current.mode, 'empty operation never falls back to suggestions');
  assert(document.getElementById('btnRerollMode').disabled, 'empty operation blocks roulette');
  input('#customMissionName', '<img src=x onerror=alert(1)> Test operation');
  click('#addCustomMission');
  assert(!document.querySelector('[data-mission-id^="custom:"]'), 'custom mission requires explicit scoring family');
  input('#customMissionScore', 'Blitz (12)', 'change'); input('#customMissionMinutes', '40');
  click('#addCustomMission');
  assert(!document.querySelector('#operationMissionRows img[src="x"]') && [...document.querySelectorAll('#operationMissionRows img')].every(img => img.getAttribute('src').startsWith('assets/missions/')), 'custom mission name cannot inject markup or untrusted artwork');
  click('#confirmOperation'); click('#btnRerollMode');
  assert(document.getElementById('missionAvailability').textContent === 'Saved list · 1 mission', 'confirmed custom shortlist has a compact accurate status');
  assert(state.current.missionSelection.provenance === 'player-confirmed-custom' && state.current.mode === 'Blitz (12)' && state.current.missionSelection.minutes === 40, 'custom mission keeps duration separate from legacy scoring');
  assert([...document.querySelector('#manualModeSelect').options].filter(o => o.value).length === 1, 'manual and random mission pools agree');
  assert(applyManualMode(state.current.missionSelection.id), 'manual selection accepts confirmed custom identity');
  const missionDifficulty = state.current.difficulty;
  state.current.difficulty = missionDifficulty === 7 ? 6 : 7; renderSpin();
  assert(!state.current.missionSelection && missionUI.info().pool.status === 'needs-confirmation', 'changed difficulty invalidates recommendation and operation');
  state.current.difficulty = missionDifficulty; renderSpin();
  click('#useMissionSuggestions'); click('#btnRerollMode');
  assert(state.settings.missionPlanner.confirmation === null && state.current.missionSelection.provenance === 'suggested', 'explicit switch restores suggestions');
  state.current.difficulty = 1; renderSpin();
  assert(!state.current.missionSelection && document.getElementById('btnApplyManualMode').disabled, 'difficulty change requires a new mission recommendation');
  assert(!document.getElementById('btnRerollMode').disabled && missionUI.info().pool.missions.length > 0, 'low-difficulty pool uses reviewed basic missions on every front');
  state.current.difficulty = missionDifficulty; renderSpin(); click('#btnRerollMode');
  click('#changeMissionPlanet');
  assert(!state.current.planetConfirmed && !state.current.missionSelection && state.current.locked, 'Change planet reopens selection without unlocking equipment');
  if(typeof galaxyApp!=='undefined'){assert(document.getElementById('galaxyDialog').open,'mission Change planet opens same galaxy dialog');click('#closeGalaxyMap');}
  click('#btnConfirmPlanetInline');
  assert(JSON.stringify([state.current.loadout.primary, state.current.loadout.stratagems, state.current.rerollsLeft]) === missionEquipment, 'mission changes preserve equipment and reroll allowances');
  document.getElementById('operationChecklist').open = false;
  click('#btnRerollMode');
  assert(getMissionModesForFaction(lockedFaction).includes(state.current.mode), 'mission mode reroll stays valid for faction');
  click('#btnApplyManualMode');
  await waitFor(() => state.current.modeConfirmed, 'mode confirmation and seed animation');
  const revealedName=state.current.seed;
  assert(window.HD2RunNames.vocabularyStats().uniqueWords>=850 && revealedName.replace(/^Seed: /,'').split(' ').length===3,'offline confirmation uses the expanded three-part codename bank');
  assert(document.getElementById('spinSeed').textContent===revealedName,'revealed themed name matches the saved-run draft');
  assert(document.getElementById('spinSeed').scrollWidth<=document.getElementById('spinSeed').clientWidth+1,'three-part codename wraps inside the reveal panel');
  const namingRun=deepClone(state.current),beforeNaming=JSON.stringify(namingRun);
  assert(runNameGenerator.generate(namingRun,[{seed:revealedName}]).name!==revealedName.replace(/^Seed: /,''),'saved-name collision selects a different fitting word combination');
  assert(JSON.stringify(namingRun)===beforeNaming,'naming leaves loadout, mission and scoring inputs untouched');
  input('#spinPlayerName', 'Smoke Diver');
  click('#btnConfirmPlayer');
  await waitFor(() => state.cards.length === 1, 'saved pending Result');
  assert(state.cards[0].seed===revealedName && JSON.parse(JSON.stringify(state.cards[0])).seed===revealedName,'confirmed codename persists literally in the card and JSON');
  assert(state.cards[0].missionSelection.name && state.cards[0].missionSelection.scoringFamily === state.cards[0].mode, 'Result captures specific mission separately from scoring');
  assert(state.cards[0].soloScore?.version === 2, 'new Result opts into versioned solo scoring');
  // Retain the established legacy end-to-end regression, then test solo separately below.
  delete state.cards[0].soloScore;
  assert(document.querySelectorAll('.resultCard.is-pending').length === 1, 'pending Result is visible with EDIT treatment');
  assert(state.cards[0].scoreRaw === 0 && state.cards[0].grade === 0, 'pending Result has no ranking score');
  refreshCompareOptions();
  safeRenderRank('smoke-pending');
  assert(document.querySelector('#cmpA').options.length === 1 && document.querySelectorAll('#rankList .rankRow').length === 0, 'pending Result is excluded from Compare and Rank');

  click('button.resultSummary[data-act="toggleCard"]');
  const stats = { kills: 350, accuracy: 72, deaths: 2, stims: 5, bulletCount: 1800, blueSideObjCount: 3, stratUses: 20, distanceKm: 4.5 };
  for (const [key, value] of Object.entries(stats)) input(`#resultCardModal [data-k="${key}"]`, value, 'change');
  click('#resultCardModal [data-act="chooseMoStatus"][data-choice="true"]');
  click('#resultCardModal [data-act="chooseExtractionStatus"][data-choice="true"]');
  click('#resultCardModal [data-act="saveCard"]');
  assert(state.ui.finalizeStatsModalOpen, 'Result Save asks for stats finalization');
  click('#btnConfirmFinalizeStatsModal');
  assert(state.cards[0].statsLocked && state.cards[0].stats.kills === 350 && state.cards[0].scoreRaw > 0, 'finalized stats persist and compute a positive score');
  assert(Object.entries(stats).every(([key, value]) => state.cards[0].stats[key] === value), 'all entered mission statistics retain their exact values');
  assert(!document.querySelector('.resultCard.is-pending'), 'finalized Result loses the pending treatment');
  click('#btnCloseResultModal');

  // A second controlled fixture makes score comparisons reproducible after a real UI run.
  const second = deepClone(state.cards[0]);
  second.id = uid();
  second.playerName = 'Smoke Rival';
  second.seed = `${second.seed} TEST-PAIR`;
  second.createdAt = new Date(Date.now() + 1).toISOString();
  second.majorOrderDone = false;
  delete second.legacyScoreSnapshot;
  second.scoreRaw *= 0.75; second.grade *= 0.75;
  state.cards.push(normalizeCardRecord(second));
  recalcGrades();
  saveState();
  const success = state.cards.find(card => card.playerName === 'Smoke Diver');
  const fail = state.cards.find(card => card.playerName === 'Smoke Rival');
  const scoreRatio = computeRawScore(fail, { killTarget: 500 }) / computeRawScore(success, { killTarget: 500 });
  assert(Math.abs(scoreRatio - 0.75) < 0.000001, 'Major Order failure reduces otherwise identical raw score to 75%');
  assert(getMajorOrderScoreMultiplier(fail) === 0.75, 'Major Order failure supplies the radar penalty multiplier');

  const beforeCompare = JSON.stringify(state.cards);
  click('[data-tab="compare"]');
  assert(document.querySelector('#cmpA').options.length === 3, 'Compare lists both completed cards');
  assert(document.querySelector('#cmpRadarA svg') && document.querySelector('#cmpRadarB svg'), 'Compare renders both radars');
  const compareRows = [...document.querySelectorAll('#cmpTable tr')];
  assert(compareRows.find(row => row.cells[0]?.textContent === 'Deaths')?.cells[1].textContent === '2' && compareRows.find(row => row.cells[0]?.textContent === 'Stims')?.cells[1].textContent === '5', 'Compare shows recorded deaths and stims');
  const rawSum = state.cards.reduce((sum, card) => sum + card.scoreRaw, 0);
  assert(Math.abs(getAllTierResultsTotals().rawSum - rawSum) < 0.000001 && Math.abs(getAllTierRankTotals().rawSum - rawSum) < 0.000001, 'Results and Rank totals include full raw scores without truncation');
  click('#btnOverlayRadar');
  assert(!!document.querySelector('#cmpRadarOverlay svg'), 'Compare overlay renders');
  input('#cmpSearch', 'Smoke Rival');
  refreshCompareOptions();
  assert(document.querySelector('#cmpA').options.length === 2, 'Compare search filters the cards');
  input('#cmpSearch', '');
  refreshCompareOptions();
  assert(JSON.stringify(state.cards) === beforeCompare, 'Compare rendering, filters and overlay do not mutate saved cards');

  // Display/share fixtures change only isolated in-memory historical metadata,
  // then restore it before any export/restart checks. No Discord requests.
  const displayCard = state.cards[0], originalMission = displayCard.missionSelection;
  const hostileMission = '<img src=x onerror=alert(1)> @everyone **mission** ' + 'W'.repeat(100);
  try {
    displayCard.missionSelection = { ...originalMission, name: hostileMission };
    const fixtureBefore = JSON.stringify(state.cards), scoreBefore = computeRawScore(displayCard, { killTarget: 500 });
    switchTab('results'); renderResults();
    const displayedSummary = [...document.querySelectorAll('.resultSummary')].find(el => el.dataset.id === displayCard.id);
    assert(displayedSummary.textContent.includes(hostileMission) && !displayedSummary.querySelector('img[src="x"]'), 'Results mission names render as text, never injected markup');
    input('#resSearch', 'onerror=alert'); renderResults();
    assert(document.querySelectorAll('.resultCard').length === 1, 'Results search finds specific historical mission names');
    input('#resSearch', '');
    openResultCardModal(displayCard.id);
    assert(document.getElementById('resultCardModal').textContent.includes(hostileMission), 'Result detail retains the same historical mission name');
    click('#btnCloseResultModal');
    switchTab('compare'); input('#cmpSearch', 'onerror=alert'); refreshCompareOptions();
    assert(document.querySelector('#cmpA').options.length === 2 && document.querySelector('#cmpA').options[1].textContent.includes(hostileMission), 'Compare searches and labels specific mission names safely');
    input('#cmpSearch', ''); refreshCompareOptions();
    const markup = discordCardMarkup(displayCard), parsed = new DOMParser().parseFromString(markup, 'text/html');
    assert(parsed.body.textContent.includes(hostileMission) && !parsed.querySelector('img[src="x"]'), 'share image markup escapes the entire custom name');
    const embed = buildDiscordCardEmbed(displayCard, '');
    assert(embed.description.includes('**Mission:**') && embed.description.includes('@\u200beveryone') && embed.description.includes('\\*\\*mission\\*\\*'), 'Discord share text neutralizes mentions and formatting in mission names');
    assert(embed.description.includes(displayCard.mode), 'share text includes the unchanged scoring category');
    const measure = document.createElement('canvas').getContext('2d'); measure.font = '600 24px Inter, Segoe UI, Arial, sans-serif';
    const wrapped = missionCanvasLines(measure, displayCard, 1088);
    assert(wrapped.join('') === 'Mission: ' + hostileMission && wrapped.every(line => measure.measureText(line).width <= 1088) && 836 + (wrapped.length - 1) * 32 < 1020, 'long custom mission fits within fallback PNG bounds without truncation');
    const png = await drawDiscordCardCanvasFallback(displayCard), signature = new Uint8Array(await png.slice(0, 8).arrayBuffer());
    assert(png.type === 'image/png' && signature.join(',') === '137,80,78,71,13,10,26,10', 'actual offline fallback image export produces a PNG');
    assert(JSON.stringify(state.cards) === fixtureBefore && computeRawScore(displayCard, { killTarget: 500 }) === scoreBefore, 'display, search and image export preserve scores and historical records');
    const legacy = { ...displayCard }; delete legacy.missionSelection;
    assert(getMissionDisplayName(legacy) === legacy.mode && discordCardMarkup(legacy).includes(escapeHtml(legacy.mode)), 'legacy Results and shares remain readable without invented mission metadata');
  } finally {
    displayCard.missionSelection = originalMission;
    document.getElementById('resSearch').value = ''; document.getElementById('cmpSearch').value = '';
    renderResults(); refreshCompareOptions();
  }

  click('[data-tab="items"]');
  input('#itemsViewMode', 'category', 'change');
  input('#itemsTypeFilter', 'primary', 'change');
  const itemBefore = deepClone(state.items.primaries);
  click('#listPrimaries .itemToggleBtn:not(:disabled)');
  const toggledItem = state.items.primaries.find((item, index) => item.enabled !== itemBefore[index].enabled);
  assert(!!toggledItem, 'Armory ownership toggle updates the item pool');
  const toggled = { group: 'primaries', name: toggledItem.name, enabled: toggledItem.enabled };
  const itemImages = [...document.querySelectorAll('#listPrimaries img')];
  assert(itemImages.length > 0 && itemImages.every(img => !/^https?:/i.test(img.src)), 'Armory uses bundled local artwork while offline');
  assert(buildArmoryAnalyticsData().some(row => row.type === 'booster' && row.rolledCount === 2), 'Armory analytics includes booster results');
  input('#itemSearch', toggled.name);
  assert(document.querySelector('#listPrimaries').textContent.includes(toggled.name), 'Armory search finds the item');
  input('#itemSearch', '');

  // Armory browsing checks use the real controls and the same underlying item objects.
  const browseBefore = JSON.stringify(state.items);
  assert(document.querySelector('#tab-items').firstElementChild.id === 'armoryBrowser', 'equipment browser comes before notices, analytics and advanced tools');
  assert(!document.querySelector('#armoryStatistics').open, 'usage statistics are collapsed by default');
  assert(!document.querySelector('#manualPoolBlock').contains(document.querySelector('#itemSearch')), 'equipment search is not hidden in advanced tools');
  click('#btnClearArmoryFilters');
  assert(document.querySelectorAll('[data-armory-section]').length === 3, 'Weapons, Stratagems and Boosters have separate collapsible sections');
  const weaponsSection = document.querySelector('[data-armory-section="weapons"]');
  input('#itemSearch', toggled.name);
  assert(weaponsSection.open, 'search automatically opens a matching equipment section');
  click('#btnClearArmoryFilters');
  assert(!weaponsSection.open, 'clearing search restores the previously closed section');
  click('[data-armory-section="weapons"] > summary');
  renderItems();
  assert(weaponsSection.open, 'user-opened sections survive rerendering');
  input('#itemsOwnershipFilter', 'enabled', 'change');
  assert(document.querySelectorAll('#listPrimaries .rankOuter').length === state.items.primaries.filter(window.HD2CSMCatalogState.isEligible).length, 'included filter agrees with actual roll eligibility');
  input('#itemsOwnershipFilter', 'unowned', 'change');
  assert(document.querySelectorAll('#listPrimaries .rankOuter').length === state.items.primaries.filter(item => item.owned === false).length, 'not-owned filter uses saved ownership');
  input('#itemsOwnershipFilter', 'owned', 'change');
  assert(document.querySelectorAll('#listPrimaries .rankOuter').length === state.items.primaries.filter(item => item.owned !== false).length, 'owned filter includes owned but excluded equipment');
  input('#itemsOwnershipFilter', 'excluded', 'change');
  assert(document.querySelectorAll('#listPrimaries .rankOuter').length === state.items.primaries.filter(item => !window.HD2CSMCatalogState.isEligible(item)).length, 'excluded filter is the complement of roll eligibility');
  input('#itemSearch', 'no-equipment-matches-this-fixture');
  assert(/No equipment matches/.test(document.querySelector('#armoryBrowseStatus').textContent), 'empty filter results explain how to recover');
  click('#btnClearArmoryFilters');
  assert(document.querySelector('#itemsOwnershipFilter').value === 'all' && getItemsTypeFilter() === 'all' && document.querySelector('#itemSearch').value === '', 'Clear Filters resets search, ownership and equipment type');
  input('#itemsViewMode', 'warbond', 'change');
  await loadReviewedWarbondCatalog(); renderItems();
  assert(document.querySelectorAll('#listItemsByWarbond details.warbondGroup').length > 0 && !document.querySelector('#listItemsByWarbond details.warbondGroup').open, 'source and Warbond cards are collapsed by default');
  assert([...document.querySelectorAll('.warbondHeader img')].every(img => !/^https?:/i.test(img.src)), 'Warbond cover cards use local artwork');
  input('#itemsTypeFilter', 'sidearm', 'change');
  assert(document.querySelectorAll('#listItemsByWarbond .rankOuter').length === state.items.sidearms.length, 'type filter also applies in Warbond view');
  click('#btnClearArmoryFilters');
  input('#itemSearch', 'Meltamine');
  assert(document.querySelector('#listItemsByWarbond').textContent.includes('Melta Mine') && document.querySelector('#listItemsByWarbond details').open, 'alias search reveals the matching Warbond and correct equipment');
  click('#btnClearArmoryFilters');
  assert(JSON.stringify(state.items) === browseBefore && JSON.stringify(state.cards) === beforeCompare, 'browsing, filtering and expanding do not mutate equipment or Results');
  input('#itemSearch', toggled.name);
  const sharedToggle = document.querySelector('#listItemsByWarbond .itemToggleBtn');
  sharedToggle.focus(); sharedToggle.click();
  assert(document.activeElement?.getAttribute('aria-label') === `Include in rolls: ${toggled.name}`, 'ownership rerender restores keyboard focus');
  click('#listItemsByWarbond .itemToggleBtn'); // Restore fixture choice.
  input('#itemsViewMode', 'category', 'change');
  assert(document.querySelector('#listPrimaries .itemToggleBtn').getAttribute('aria-pressed') === String(toggled.enabled), 'category and Warbond controls share one eligibility state');
  click('#btnClearArmoryFilters');

  input('#itemsTypeFilter', 'stratagem', 'change');
  const strats = state.items.stratagems;
  const roleGroups = [...document.querySelectorAll('#listStrats [data-armory-role]')];
  assert(roleGroups.length >= 5 && roleGroups.reduce((total, group) => total + group.querySelectorAll('.rankOuter').length, 0) === strats.length, 'role groups include every stratagem exactly once');
  for (const group of roleGroups) {
    assert(group.querySelectorAll('.rankOuter').length === strats.filter(item => HD2ArmoryPreferences.role(item) === group.dataset.armoryRole).length, `${group.dataset.armoryRole} group matches reviewed catalog roles`);
  }
  click('[data-armory-section="stratagems"] > summary');
  click('[data-armory-role="eagle"] > summary');
  input('#itemSearch', 'eagle');
  assert(document.querySelector('[data-armory-role="eagle"]').open, 'role search opens matching stratagem subgroup');
  click('#btnClearArmoryFilters');
  assert(document.querySelector('[data-armory-role="eagle"]').open, 'user-expanded role remains open after clearing temporary search');
  const preferencesBeforeBadImport = JSON.stringify(getArmoryPreferences());
  let badPreferencesRejected = false;
  try { prepareImportedData({ settings: { armoryBrowser: { ...getArmoryPreferences(), expandedGroups: [123] } } }); } catch (_) { badPreferencesRejected = true; }
  assert(badPreferencesRejected && JSON.stringify(getArmoryPreferences()) === preferencesBeforeBadImport, 'damaged preference import is rejected without changing working preferences');
  input('#itemsOwnershipFilter', 'owned', 'change');
  input('#itemSearch', 'temporary search must not survive restart');
  const armoryPreferences = getArmoryPreferences();
  assert(armoryPreferences.ownershipFilter === 'owned' && armoryPreferences.expandedGroups.includes('role:eagle') && !Object.hasOwn(armoryPreferences, 'search'), 'only deliberate browsing preferences enter saved payload, not search text');

  click('[data-tab="rank"]');
  assert(document.querySelectorAll('#rankList .rankRow').length === 2, 'Rank displays both finalized runs');
  input('#rankSearchCategory', 'player', 'change');
  input('#rankSearchInput', 'Smoke Rival');
  click('#btnRankSearch');
  assert(document.querySelectorAll('#rankList .rankBlinkMatch').length === 1, 'Rank search locates the matching player');
  assert(document.querySelector('#rankDetailPanel').textContent.trim().length > 20, 'Rank detail panel renders');

  if (!options.skipNativeDialogs) {
    await exportJSON();
    assert(alerts.some(message => /Export complete/i.test(message)), 'desktop IPC exports JSON successfully');
    await clearAllData();
    assert(state.cards.length === 0 && state.settings.rememberedPlayerName === '', 'Clear All completes and clears working state');
    assert(JSON.stringify(getArmoryPreferences()) === JSON.stringify(HD2ArmoryPreferences.defaults()), 'Clear All resets browsing preferences without reviving legacy keys');
    await importJSONFile();
    assert(state.cards.length === 2 && state.settings.rememberedPlayerName === 'Smoke Diver', 'desktop IPC imports exported cards and settings');
    assert(state.items[toggled.group].find(item => item.name === toggled.name).enabled === toggled.enabled, 'import restores Armory ownership changes');
    assert(JSON.stringify(getArmoryPreferences()) === JSON.stringify(armoryPreferences), 'import restores view, ownership filter and expanded sections');
  }
  const persisted = await desktopStorage.saveState(buildPersistedStatePayload());
  assert(persisted.ok, 'final state is flushed through the desktop storage bridge');
  const info = await window.chaosSlotMachine.getAppInfo();
  assert(info.name === 'HD2 Chaos Slot Machine', 'desktop metadata exposes the renamed application');
  assert(info.publicVersion === '1.0.0' && info.compatibilityVersion === '1.1.14', 'public 1.0 and unchanged internal compatibility version are distinct');
  assert(document.title === 'HD2 Chaos Slot Machine', 'browser and native titles use full-word identity');
  const mark = document.querySelector('.appBrandEmblem');
  await mark.decode();
  assert(mark.naturalWidth > 0 && mark.src.endsWith('hd2-chaos-slot-machine.svg'), 'new local full-word mark decodes offline');
  const legacyScores = state.cards.map(c => [c.id,c.scoreRaw,c.grade]);
  const solo = deepClone(state.cards[0]);
  solo.id = uid(); solo.seed = 'Solo score review'; solo.playerName = 'Solo Test Diver';
  solo.statsLocked = false; solo.lockedStatsSnapshot = null; solo.statsLockedAt = null;
  delete solo.legacyScoreSnapshot; solo.soloScore = HD2SoloScore.create();
  solo.stats.blueSideObjCount = 3;
  state.cards.push(normalizeCardRecord(solo)); renderResults(); openResultCardModal(solo.id, {guided:false});
  assert(document.getElementById('soloEntry') && document.querySelector('[data-role="moButtons"]').closest('.modalMajorOrderBlock').hidden, 'solo form shows score inputs instead of Major Order scoring');
  input('#soloMinutes','20','change'); input('#soloAvailable','2','change'); input('#soloOutcome','true','change');
  click('#resultCardModal [data-act="saveCard"]');
  assert(!state.ui.finalizeStatsModalOpen && alerts.at(-1).includes('cannot exceed'), 'UI rejects more completed than available objectives');
  input('#soloAvailable','4','change');
  click('#resultCardModal [data-act="saveCard"]');
  assert(state.ui.finalizeStatsModalOpen && document.querySelector('#finalizeStatsConfirmModal .tiny').textContent.includes('Comments'), 'solo finalization warns about locking values and preserving comments');
  click('#btnConfirmFinalizeStatsModal');
  const finalizedSolo=getCardById(solo.id), frozenSolo=JSON.stringify(finalizedSolo.soloScore);
  assert(finalizedSolo.statsLocked && finalizedSolo.soloScore.result.eligible, 'solo result locks an eligible score snapshot');
  assert(finalizedSolo.soloScore.result.axes[4] === 75, 'three of four side objectives produces 75 utility');
  assert(document.querySelector('#resultCardModal .soloRadar') && document.getElementById('soloMinutes').disabled, 'finalized modal displays radar and locks new scoring inputs');
  input('#resultCardModal [data-k="newCommentText"]','Comment after solo finalization','input');
  click('#resultCardModal [data-act="addCardComment"]');
  assert(getCardById(solo.id).commentNotes.some(c=>c.text==='Comment after solo finalization'), 'comments remain addable after new score finalization');
  assert(JSON.stringify(getCardById(solo.id).soloScore)===frozenSolo, 'comments cannot change the locked score');
  closeResultCardModal(); recalcGrades();
  assert(JSON.stringify(state.cards.filter(c=>!c.soloScore).map(c=>[c.id,c.scoreRaw,c.grade]))===JSON.stringify(legacyScores), 'adding and recalculating solo cards preserves historical score values');
  switchTab('rank');
  assert(document.querySelectorAll('#soloRankRows .soloRankRow').length===1 && document.getElementById('rankFocusPanel').hidden, 'default Rank shows only eligible comparable solo runs');
  click('#soloLegacyToggle');
  assert(!document.getElementById('rankFocusPanel').hidden && document.querySelectorAll('#rankList .rankRow').length===2, 'Legacy ranking remains separately accessible');
  click('#soloLegacyToggle');
  // Exercise the actual default guided path separately from the legacy form regression.
  const guided=deepClone(finalizedSolo);guided.id=uid();guided.statsLocked=false;guided.lockedStatsSnapshot=null;guided.soloScore=HD2SoloScore.create();guided.originalNote='';guided.notes='';
  // This fixture asserts sector geometry, so use known reference geography rather
  // than a random legacy planet whose recorded sector may differ from the atlas.
  const guidedPlanet=getPlanetPoolSource().find(p=>p.name.toUpperCase()==='GENESIS PRIME');
  assert(!!guidedPlanet, 'saved-card geometry fixture has a known bundled planet');
  guided.planet=deepClone(guidedPlanet);guided.faction=guidedPlanet.faction;
  state.cards.push(guided);const beforeGuided=JSON.stringify(guided);openResultCardModal(guided.id);
  assert(document.querySelector('#entryValue').dataset.key==='kills' && document.querySelector('.resultDetail').hidden, 'unfinished cards open one-question entry, not the long form');
  click('.entryOptions button');
  assert(!document.querySelector('.resultDetail').hidden && document.querySelector('[data-act="deleteCard"]').getClientRects().length && document.querySelector('[data-k="newCommentText"]').getClientRects().length, 'Card options preserves access to unfinished-card details, deletion and comments');
  openResultCardModal(guided.id);
  input('#entryValue','999');click('#entryNext');
  [...document.querySelectorAll('#cardEntryWizard button')].find(b=>b.textContent==='Back').click();
  assert(document.querySelector('#entryValue').value==='999', 'Back preserves previous draft answers');
  click('#btnCloseResultModal');
  assert(JSON.stringify(guided)===beforeGuided && !state.ui.resultCardDrafts[guided.id], 'Cancel discards the entire unsaved entry without changing card data');
  openResultCardModal(guided.id);input('#entryValue','-1');click('#entryNext');
  assert(document.querySelector('#entryValue').dataset.key==='kills' && document.querySelector('#entryError').textContent, 'guided entry blocks invalid counts');
  const answers={kills:400,accuracy:80,deaths:2,stims:4,bulletCount:1200,blueSideObjCount:3,stratUses:12,distanceKm:5.2,minutes:20,sideAvailable:4,missionSuccess:true,extractedSafely:true,originalNote:'<Original> locked note'};
  for(const step of HD2CardEntry.steps(true)) {
    if(step.type==='choice')click('#cardEntryWizard [data-choice="true"]');
    else input('#entryValue',answers[step.key]);
    click('#entryNext');
  }
  assert(document.querySelectorAll('.entryReviewRow').length===13 && !guided.statsLocked, 'all thirteen answers are reviewed before any final save');
  assert(document.querySelector('.entryWarning').textContent.includes('permanently') && document.querySelector('.entryReview').textContent.includes('<Original>'), 'review includes permanent-lock warning and renders note literally');
  click('#entrySave');assert(!guided.statsLocked && document.querySelector('#entryError').textContent.includes('tick'), 'saving requires explicit review acknowledgement');
  click('[aria-label="Edit KILLS"]');input('#entryValue','420');click('#entryNext');
  assert(document.querySelector('#entrySave') && !document.querySelector('#entryAcknowledge').checked, 'review edit returns directly and resets acknowledgement');
  assert(JSON.stringify(guided)===beforeGuided, 'review and edits leave the original card untouched');
  click('#entryAcknowledge');click('#entrySave');
  assert(guided.statsLocked && guided.stats.kills===420 && guided.originalNote==='<Original> locked note' && guided.soloScore.result.eligible, 'guided final save locks the reviewed numbers, note and computed score');
  assert(!document.querySelector('#cardEntryWizard') && document.querySelectorAll('.cardDetailFold').length===2, 'finalized card opens compact folded details instead of guided entry');
  const planetVisualBefore=JSON.stringify(guided);
  await waitFor(()=>document.querySelector('.cardPlanetVisual svg'), 'saved-card sector locator');
  const planetVisual=document.querySelector('.cardPlanetVisual');
  assert(!planetVisual.closest('details') && planetVisual.getBoundingClientRect().height>100, 'saved planet globe and sector locator remain visible outside collapsed loadout');
  assert(planetVisual.querySelector('img').complete && planetVisual.querySelector('img').naturalWidth>0, 'saved planet illustration loads locally offline');
  assert(planetVisual.textContent.includes(guided.planet.name) && planetVisual.textContent.includes(guided.faction), 'saved planet panel uses recorded name and enemy faction');
  assert(planetVisual.querySelector('svg').getAttribute('aria-label').includes('not historical territory'), 'locator states reference geography rather than historical territory');
  assert(!!planetVisual.querySelector('.cardPlanetSector') && !!planetVisual.querySelector('.cardPlanetSectorName') && !!planetVisual.querySelector('.cardPlanetTargetName'), 'saved locator shows sector outline, sector name and target name');
  assert(planetVisual.querySelector('.cardPlanetFaction').textContent.includes('saved run'), 'locator tint explicitly identifies the saved run faction');
  assert(JSON.stringify(guided)===planetVisualBefore, 'asynchronous saved planet rendering never mutates the card');
  const apostropheCard={planet:{name:'Nabatea Secundus',sector:'L’estrade Sector'},faction:'Terminids'};
  const apostropheBefore=JSON.stringify(apostropheCard);
  const referenceAtlas=await(await fetch('assets/galaxy-atlas-bundled.json')).json();
  const apostropheModel=HD2CardPlanet.model(apostropheCard,referenceAtlas);
  assert(apostropheModel.region.length>0 && apostropheModel.connections.length>0 && JSON.stringify(apostropheCard)===apostropheBefore, 'legacy sector apostrophe renders outline/routes without changing saved text');
  const synthetic=deepClone(guided);synthetic.planet={name:'<img src=x onerror=alert(1)>',sector:'Unknown',biome:'Unrecognized'};
  const fixture=document.createElement('div');fixture.innerHTML='<div class="modalLoadoutGrid"></div>';document.body.append(fixture);
  HD2CardPlanet.mount(fixture,synthetic);await new Promise(resolve=>setTimeout(resolve,50));
  assert(fixture.textContent.includes(synthetic.planet.name) && !fixture.querySelector('[onerror]') && fixture.querySelector('.cardPlanetMissing'), 'custom historical planet renders literal text and honest missing-location fallback');
  fixture.remove();
  input('#resultCardModal [data-k="newCommentText"]','Wizard follow-up','input');click('#resultCardModal [data-act="addCardComment"]');
  assert(guided.commentNotes.some(c=>c.text==='Wizard follow-up') && guided.stats.kills===420, 'guided finalized cards still accept comments without changing numbers');
  closeResultCardModal();recalcGrades();
  const roundtrip=HD2CSMTransfer.parse(HD2CSMTransfer.serialize(buildPersistedStatePayload()));
  const oldSolo=deepClone(guided);delete oldSolo.cardHistory;oldSolo.soloScore.version=1;oldSolo.stats.kills=394;oldSolo.lockedStatsSnapshot.kills=394;oldSolo.soloScore.inputs.minutes=100;delete oldSolo.soloScore.originalResult;oldSolo.soloScore.result=HD2SoloScore.evaluate(oldSolo);
  const oldBytes=JSON.stringify(oldSolo), prepared=prepareStateData({cards:[oldSolo]});
  assert(prepared.candidate.cards[0].soloScore.version===1 && prepared.candidate.cards[0].soloScore.result.axes[0]===19.7, 'startup leaves old scoring rules untouched until consent');
  assert(JSON.stringify(oldSolo)===oldBytes && prepared.candidate.cards[0].cardHistory.source.soloScore.result.axes[0]===19.7, 'startup archives raw original without altering its rating');
  assert(!prepareStateData(prepared.candidate).migrated, 'reopening deferred cards does not upgrade or compound the curve');
  assert(JSON.stringify(roundtrip.cards.find(c=>c.id===solo.id).soloScore)===frozenSolo, 'JSON roundtrip preserves new inputs and locked ratings');
  // Exercise the production optional activity service + view using a separate
  // in-memory cache and controlled responses, never the player's/global service.
  const activityBefore=JSON.stringify({current:state.current,cards:state.cards});
  const activityAtlas=HD2GalaxyMap.validateAtlas(await (await fetch('assets/galaxy-atlas-bundled.json')).json());
  const activityMemory=new Map();let activityClock=Date.now(),activityBad=false;
  const activityDisk={getItem:k=>activityMemory.get(k)??null,setItem:(k,v)=>activityMemory.set(k,v)};
  const activityService=HD2ActivityService.createService({storage:activityDisk,now:()=>activityClock,fetchImpl:async url=>new Response(JSON.stringify(
    url===HD2ActivityService.URL?{id:801}:activityBad?{}:{warId:801,time:100,planetStatus:[{index:34}],planetActiveEffects:[{index:34,galacticEffectId:1202},{index:34,galacticEffectId:1203},{index:34,galacticEffectId:1400}]}))});
  const activityHost=document.createElement('div');document.body.append(activityHost);
  const activityWidget=HD2GalaxyView.mount(activityHost,{getInputs:()=>({atlas:activityAtlas,activity:activityService.getState(),now:activityClock,online:true})});
  const activityOff=activityService.subscribe(()=>activityWidget.update());
  await activityService.refresh();activityWidget.inspect('id:34');
  assert(activityHost.querySelector('.gm-activity').textContent.includes('Jet Brigade') && activityHost.querySelector('.gm-activity').textContent.includes('Heavy SEAF'), 'production activity service supplies reviewed reported badges to the actual map view');
  assert(activityHost.querySelectorAll('.gm-activity svg').length===2, 'paired activity codes collapse to two original vector icons');
  await activityService.setOnline(false);
  assert(activityHost.querySelector('.gm-activity').textContent.includes('Cached activity'), 'offline activity immediately displays cached warning');
  const activityRestart=HD2ActivityService.createService({storage:activityDisk,online:false,now:()=>activityClock});
  assert(activityRestart.getState().source==='cache' && activityRestart.getState().snapshot.effects.length===3, 'independent activity cache survives service restart with validated codes');
  activityBad=true;activityClock+=60000;await activityService.setOnline(true);await activityService.refresh();
  assert(activityService.getState().lastError==='invalid-snapshot' && activityHost.querySelector('.gm-activity').textContent.includes('Jet Brigade') && activityHost.querySelector('.gm-activity').textContent.includes('Cached activity'), 'invalid activity response retains previous badges as unconfirmed');
  assert(JSON.stringify({current:state.current,cards:state.cards})===activityBefore, 'activity refresh, disconnect and failure never mutate run or historical cards');
  activityOff();activityService.dispose();activityRestart.dispose();activityWidget.dispose();activityHost.remove();
  await saveState(); await saveHealth.flush();
  return { checks, alerts, toggled, armoryPreferences, initialOfflineStatus, scoreRatio, soloId:solo.id, soloSnapshot:frozenSolo, guidedId:guided.id, guidedSnapshot:JSON.stringify(guided.soloScore), audioState: audioCtx.state, cardIds: state.cards.map(card => card.id), info };
}

async function rendererVerifyPhase(expected) {
  const checks = [];
  const assert = (condition, label) => { if (!condition) throw new Error(`SMOKE: ${label}`); checks.push(label); };
  window.alert = () => {};
  await bootStateReady;
  assert(!document.querySelector('#fanNotice').hidden, 'credit notice returns on process restart without a saved preference');
  document.querySelector('#dismissFanNotice').click();
  assert(state.cards.length === 4 && state.cards.every(card => card.statsLocked), 'separate process restores legacy and solo finalized cards');
  assert(JSON.stringify(state.cards.find(c=>c.id===expected.soloId).soloScore)===expected.soloSnapshot, 'separate process preserves exact solo scoring snapshot');
  const guided=state.cards.find(c=>c.id===expected.guidedId);
  assert(JSON.stringify(guided.soloScore)===expected.guidedSnapshot && guided.stats.kills===420 && guided.originalNote==='<Original> locked note' && guided.commentNotes.some(c=>c.text==='Wizard follow-up'), 'guided finalization preserves exact scores, edited answer, note and comment after restart');
  const beforePlanetView=JSON.stringify(state.cards);openResultCardModal(guided.id);
  for(let i=0;i<100&&!document.querySelector('.cardPlanetVisual svg');i++)await new Promise(resolve=>setTimeout(resolve,50));
  assert(!!document.querySelector('.cardPlanetVisual svg') && document.querySelector('.cardPlanetVisual').textContent.includes(guided.planet.name), 'offline process restart restores saved-card sector locator and recorded planet');
  assert(JSON.stringify(state.cards)===beforePlanetView, 'restart planet visualization preserves all saved card bytes');
  closeResultCardModal();
  assert(JSON.stringify(state.cards.map(card => card.id)) === JSON.stringify(expected.cardIds), 'separate process restores exact card identities');
  assert(state.settings.rememberedPlayerName === 'Smoke Diver', 'remembered player survives process restart');
  assert(state.items[expected.toggled.group].find(item => item.name === expected.toggled.name).enabled === expected.toggled.enabled, 'Armory ownership survives process restart');
  if (expected.armoryPreferences) {
    assert(JSON.stringify(getArmoryPreferences()) === JSON.stringify(expected.armoryPreferences), 'view, filters and expansion preferences survive separate process restart');
    assert(document.querySelector('#itemSearch').value === '', 'search text resets on process restart');
    switchTab('items');
    assert(document.querySelector('#itemsOwnershipFilter').value === expected.armoryPreferences.ownershipFilter && document.querySelector('[data-armory-role="eagle"]').open, 'restored preferences are applied to actual Armory controls');
  }
  const success = state.cards.find(card => card.playerName === 'Smoke Diver');
  const fail = state.cards.find(card => card.playerName === 'Smoke Rival');
  assert(Math.abs(fail.scoreRaw / success.scoreRaw - 0.75) < 0.000001, 'scoring remains stable after process restart');
  switchTab('results');
  assert(document.querySelectorAll('.resultCard').length === 4, 'Results restores legacy and solo cards');
  switchTab('compare');
  assert(document.querySelector('#cmpRadarA svg') && document.querySelector('#cmpRadarB svg'), 'Compare renders after restart');
  switchTab('rank');
  assert(document.querySelectorAll('#rankList .rankRow').length === 2, 'Rank renders after restart');
  if (expected.network) checks.push(...(await rendererWarCacheVerify()).checks);
  return { checks };
}

async function rendererWarCacheVerify() {
  const checks = [], assert = (ok, label) => { if (!ok) throw Error('WAR RESTART: ' + label); checks.push(label); };
  await bootStateReady;
  initializeWarService();
  while (isApiPlanetSyncInProgress()) await new Promise(resolve => setTimeout(resolve, 30));
  assert(warService.getState().snapshot.source === 'cache', 'real process restart restores the disk-backed war cache offline');
  assert(warService.getState().snapshot.planets.length === 3, 'cache restart retains all three fixture campaign identities');
  assert(state.items.planets.some(p => p.id === '900' && !p.enabled), 'planet stable-ID opt-out survives process restart');
  assert(getPlanetPoolSource().length === 2 && getPlanetPoolSource().every(p => p.id !== 900), 'restored opt-out filters both manual and random pools');
  assert(document.querySelector('#spinWarStatus').textContent.includes('Not confirmed currently playable'), 'offline restart labels cached planets unconfirmed');
  return { checks };
}

async function rendererNetworkPhase() {
  const checks = [];
  const assert = (condition, label) => { if (!condition) throw new Error(`NETWORK: ${label}`); checks.push(label); };
  await bootStateReady;
  await loadAndRenderApiActivePlanets({ manual: false });
  while (isApiPlanetSyncInProgress()) await new Promise(resolve => setTimeout(resolve, 40));
  const originalService = warService;
  const observed = originalService.getState();
  const live = { fresh: observed.status.state === 'fresh', count: observed.snapshot.planets.length,
    source: observed.snapshot.source, fetchedAt: observed.snapshot.fetchedAt, error: observed.lastError };
  originalService.stop();
  let time = Date.now(), timerId = 0, requestCount = 0;
  const timers = new Map();
  const fixture = ['Terminids', 'Automatons', 'Illuminate'].map((faction, index) => ({ id: 900 + index, faction: 'Humans', type: 0,
    planet: { index: 900 + index, name: 'Network Test ' + faction, sector: 'Test Sector', currentOwner: faction, biome: { name: 'Jungle' }, event: null } }));
  fixture[1].faction = 'Automatons'; fixture[1].planet.currentOwner = 'Humans';
  fixture[1].planet.event = { faction: 'Automatons', campaignId: 901, startTime: new Date(time - 60000).toISOString(), endTime: new Date(time + 86400000).toISOString() };
  let transport = async () => ({ ok: true, json: async () => fixture });
  warService = window.HD2WarRefresh.createService({ bundledPlanets: DEFAULTS.items.planets, bundleVersion: 'test',
    storage: { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) },
    now: () => time, fetchImpl: (...args) => { requestCount++; return transport(...args); },
    setTimer: (fn, delay) => { timers.set(++timerId, { fn, delay }); return timerId; }, clearTimer: id => timers.delete(id) });
  warService.subscribe(() => { renderWarDataStatus(); renderPlanetSearchResults(); });
  const advanceCooldown = () => { time = Math.max(time, warService.getState().nextAllowedAt) + 1; };
  const waitSpin = async () => { while (state.current.spinning) await new Promise(resolve => setTimeout(resolve, 30)); };
  const cardsBefore = JSON.stringify(state.cards);
  const originalRandom = Math.random;
  const originalAlert = window.alert;
  window.alert = () => {};
  try {
    await warService.start();
    assert(/^Live campaign list: 3/.test(document.querySelector('#apiPlanetStatus').textContent), 'successful refresh updates visible three-faction list');
    assert(document.querySelector('#spinWarStatus').textContent.includes('Last successful update'), 'Spin displays the dated live status');
    const cached = JSON.parse(localStorage.getItem(window.HD2WarRefresh.CACHE_KEY));
    assert(cached && Number.isFinite(Date.parse(cached.fetchedAt)), 'successful refresh writes new dated cache');
    const pool = getPlanetPoolSource();
    assert(pool.length === 3 && pool.find(p => p.id === 901).faction === 'Automatons', 'human-owned defense attacker is selectable');
    const seen = new Set(); for (const random of [0, 0.5, 0.99]) { Math.random = () => random; seen.add(rollAvailablePlanet().faction); }
    Math.random = originalRandom;
    assert(seen.size === 3, 'unrestricted random pool reaches every faction');
    const calls = requestCount; await loadAndRenderApiActivePlanets({ manual: true });
    assert(requestCount === calls, 'manual renderer refresh respects service cooldown');
    assert(document.querySelector('#btnRefreshWarData').disabled, 'visible refresh button shows cooldown');

    resetCurrentSpinState(); state.current.loadout = rollLoadout(null); state.current.locked = true; state.current.difficultySelected = true;
    state.current.specialActive = true; state.current.rerollsLeft = 2;
    const equipment = JSON.stringify([state.current.loadout.primary, state.current.loadout.sidearm, state.current.loadout.throwable, state.current.loadout.stratagems, state.current.loadout.booster]);
    Math.random = () => 0; doRollPlanet(); await waitSpin();
    const first = state.current.planet.id; doClearPlanet(); await waitSpin(); Math.random = originalRandom;
    assert(state.current.planet.id !== first && state.current.faction === 'Automatons', 'UI planet reroll excludes current and changes faction');
    assert(state.current.loadout.faction === state.current.faction, 'loadout faction follows chosen planet');
    assert(state.current.rerollsLeft === 2 && equipment === JSON.stringify([state.current.loadout.primary, state.current.loadout.sidearm, state.current.loadout.throwable, state.current.loadout.stratagems, state.current.loadout.booster]), 'planet changes preserve equipment and equipment reroll allowance');
    state.current.mode = 'Normal (40)'; state.current.modeConfirmed = true;
    togglePlanetSearchPanel(true); renderPlanetSearchResults();
    const choose = () => [...document.querySelectorAll('.planetSearchRow')].find(row => row.textContent.includes('Network Test Illuminate'))?.querySelector('button');
    assert(choose() && !choose().disabled, 'manual planet search exposes an enabled choice button');
    choose().click(); assert(choose()?.textContent === 'CONFIRM?', 'manual choice button requests confirmation');
    choose().click(); await waitSpin();
    assert(state.current.faction === 'Illuminate' && state.current.planet.id === 902, 'manual selection shares eligibility and sets faction');
    assert(state.current.mode === null && !state.current.modeConfirmed, 'changing planet clears prior mission selection');
    state.current.planetConfirmed = true;
    const locked = JSON.stringify(state.current);
    transport = async () => ({ ok: true, json: async () => fixture.slice(0, 1) });
    advanceCooldown(); await warService.refresh();
    assert(JSON.stringify(state.current) === locked && JSON.stringify(state.cards) === cardsBefore, 'background refresh cannot alter confirmed run or Results');
    assert(getPlanetPoolSource().length === 1 && state.current.planet.id === 902, 'removed live campaign does not silently replace the confirmed planet');
    transport = async () => ({ ok: true, json: async () => fixture });
    const periodic = [...timers.values()].find(t => t.delay === window.HD2WarSnapshot.FRESH_MS);
    time += window.HD2WarSnapshot.FRESH_MS; periodic.fn();
    for (let i = 0; i < 30; i++) await Promise.resolve();
    assert(getPlanetPoolSource().length === 3 && JSON.stringify(state.current) === locked, 'five-minute service update reaches the renderer without mutating the run');
    state.current.planetConfirmed = false;
    selectManualPlanetCandidate(pool[0]);
    window.HD2WarPlanetPool.setEnabled(state.items.planets, pool[0], false);
    confirmManualPlanetSelection();
    assert(state.current.planet.id === 902 && !state.current.manualPlanetCandidate, 'manual confirmation revalidates a newly disabled candidate');
    assert(getPlanetPoolSource().every(p => p.id !== 900), 'legacy/ID preferences remove disabled planets from shared pool');
    const prepared = prepareImportedData(buildPersistedStatePayload());
    assert(prepared.items.planets.some(p => p.id === '900' && p.enabled === false), 'planet ID opt-out is covered by full JSON export/import');
    for (const p of pool) window.HD2WarPlanetPool.setEnabled(state.items.planets, p, false);
    renderWarDataStatus();
    assert(rollAvailablePlanet() === null && getAllPlanetsSortedBySector().length === 0, 'all disabled means empty random and manual pools, no hidden bundled bypass');
    for (const p of pool) window.HD2WarPlanetPool.setEnabled(state.items.planets, p, true);

    for (const failure of ['offline', 'rate-limit', 'invalid', 'empty', 'timeout']) {
      transport = failure === 'offline' ? async () => { throw new Error('simulated disconnected network'); }
        : failure === 'rate-limit' ? async () => ({ ok: false, status: 429, headers: { get: () => '60' } })
        : failure === 'timeout' ? (_url, opts) => new Promise((_resolve, reject) => opts.signal.addEventListener('abort', () => reject(new Error('simulated request timeout'))))
        : async () => ({ ok: true, json: async () => failure === 'empty' ? [] : { invalid: true } });
      advanceCooldown(); const task = loadAndRenderApiActivePlanets({ manual: true });
      if (failure === 'timeout') { for (let i = 0; i < 20; i++) await Promise.resolve(); [...timers.values()].find(t => t.delay === window.HD2WarRefresh.TIMEOUT_MS).fn(); }
      await task;
      const status = document.querySelector('#apiPlanetStatus').textContent;
      assert(status.includes('Cached planets from') && status.includes('Not confirmed currently playable'), `${failure} displays dated unconfirmed cached status`);
      assert(!!rollLoadout(null).primary && !!rollAvailablePlanet(), `${failure} leaves randomization usable`);
    }
    transport = async () => ({ ok: true, json: async () => fixture }); advanceCooldown(); await loadAndRenderApiActivePlanets({ manual: true });
    assert(/^Live campaign list/.test(document.querySelector('#apiPlanetStatus').textContent), 'refresh recovers after connectivity returns');
    // End fake-clock fault injection; create a real-clock successful fetch/cache
    // for the separate-process check. Only this test profile's fixture key is reset.
    warService.stop(); localStorage.removeItem(window.HD2WarRefresh.CACHE_KEY);
    warService = window.HD2WarRefresh.createService({ bundledPlanets: DEFAULTS.items.planets, bundleVersion: 'test',
      storage: { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) },
      fetchImpl: async () => ({ ok: true, json: async () => fixture }) });
    warService.subscribe(() => renderWarDataStatus());
    await warService.start();
    // Persist one explicit opt-out for a separate-process cache/preferences check.
    window.HD2WarPlanetPool.setEnabled(state.items.planets, pool[0], false);
    await saveState(); await saveHealth.flush();
    assert(JSON.stringify(state.cards) === cardsBefore, 'network/selection testing preserves historical Results and scores');
  } finally { Math.random = originalRandom; window.alert = originalAlert; warService.stop(); }
  return { checks, live };
}

async function rendererMissionLifecyclePhase() {
  const checks = [], check = (ok, label) => { if (!ok) throw Error('MISSION UI: ' + label); checks.push(label); console.log('MISSION UI PASS: ' + label); };
  await missionUIReady;
  while (isApiPlanetSyncInProgress()) await new Promise(r => setTimeout(r, 25));
  await saveHealth.flush();
  const previousService = warService, previousRun = state.current, previousPlanner = state.settings.missionPlanner;
  const previousSave = saveState, previousCards = JSON.stringify(state.cards);
  previousService.stop();
  const base = previousService.getState();
  let snapshot, saves = 0;
  const makeSnapshot = (end, campaign = 770, attacker = null) => HD2WarSnapshot.normalizeCampaigns([{ id: campaign, type: 1, faction: 'Automatons',
    planet: { index: 770, name: 'Mission timer fixture', currentOwner: 'Humans', disabled: false,
      event: { id: 771, eventType: 1, campaignId: campaign, faction: attacker, startTime: new Date(Date.now() - 60000).toISOString(), endTime: end } }
  }], { now: Date.now() });
  warService = { ...previousService, getState: () => ({ ...base, snapshot, online: true, lastError: null }) };
  saveState = async () => { saves++; return false; }; // Isolated failure injection; never writes the owner's profile.
  const button = id => document.getElementById(id).click();
  const waitFor = async (predicate, label) => {
    const deadline = Date.now() + 6000;
    while (!predicate()) { if (Date.now() > deadline) throw Error('MISSION UI timeout: ' + label); await new Promise(r => setTimeout(r, 25)); }
  };
  try {
    snapshot = makeSnapshot(new Date(Date.now() + 1500).toISOString());
    state.current = { ...previousRun, faction: 'Automatons', loadout: { primary: 'Timer fixture', stratagems: [], faction: 'Automatons' }, locked: true, planetLocked: true,
      planetConfirmed: true, modeConfirmed: false, spinning: false, difficulty: 7, difficultySelected: true,
      planet: { id: 770, name: 'Mission timer fixture' }, missionSelection: null, mode: null };
    state.settings.missionPlanner = HD2MissionState.defaults(); renderSpin();
    document.getElementById('operationChecklist').open = true;
    const box = document.querySelector('[data-mission-id="mission:evacuate-high-value-assets"]');
    box.checked = true; box.dispatchEvent(new Event('change')); button('confirmOperation');
    check(missionUI.apply('mission:evacuate-high-value-assets'), 'current defense checklist accepts asset defense');
    await waitFor(() => saves > 0 && document.getElementById('operationFeedback').textContent.includes('could not be saved'), 'save failure feedback');
    check(true, 'failed checklist save is visibly reported without pretending it persisted');
    const savedOperation = JSON.stringify(state.settings.missionPlanner);
    await waitFor(() => !state.current.missionSelection, 'event expiry clears recommendation without input or refresh');
    check(missionUI.info().pool.status === 'needs-confirmation', 'real renderer timer invalidates the expired-event operation');
    check(JSON.stringify(state.settings.missionPlanner) === savedOperation, 'expiry retains old operation for recovery instead of overwriting it');
    check(document.getElementById('btnApplyManualMode').disabled && document.getElementById('btnRerollMode').disabled, 'expired operation disables both manual finalize and roulette');
    check(!document.getElementById('missionFreshness').hidden && document.getElementById('missionFreshness').textContent.includes('Availability unconfirmed'), 'timer-driven expiry displays unconfirmed cached status');

    button('useMissionSuggestions');
    check(missionUI.apply('mission:launch-icbm'), 'independent campaign enemy still permits ordinary suggestions after event expiry');
    const catalog = (await (await fetch('assets/mission-catalog.json')).json());
    const engine = HD2MissionSelection.createEngine(catalog);
    state.settings.missionPlanner = { version: 1, confirmation: engine.confirm(missionUI.info().context, [{ kind: 'catalog', id: 'mission:launch-icbm' }]) };
    renderSpin(); missionUI.apply('mission:launch-icbm');
    const confirmed = JSON.stringify(state.settings.missionPlanner);
    snapshot = { ...snapshot, fetchedAt: new Date().toISOString() }; renderSpin();
    check(JSON.stringify(state.settings.missionPlanner) === confirmed && missionUI.validSelection(), 'unchanged-context refreshed timestamp preserves confirmation and selection');
    const selected = JSON.stringify(state.current.missionSelection);
    state.current.modeConfirmed = true; state.current.difficulty = 6; renderSpin();
    check(JSON.stringify(state.current.missionSelection) === selected, 'finalized recommendation stays historical through context changes');
    state.current.modeConfirmed = false; state.current.difficulty = 7; renderSpin();
    const beforeStaleClick = JSON.stringify(state.settings.missionPlanner), countBefore = saves;
    // Change the backing context without rendering: the click handler itself must reject the stale draft.
    snapshot = makeSnapshot(new Date(Date.now() + 60000).toISOString(), 772);
    button('confirmOperation');
    check(JSON.stringify(state.settings.missionPlanner) === beforeStaleClick && saves === countBefore, 'stale draft cannot commit under a new campaign before renderer refresh');
    check(document.getElementById('operationFeedback').textContent.includes('Review the checklist again'), 'stale draft asks for explicit review');
    snapshot = makeSnapshot(new Date(Date.now() + 1000).toISOString(), 773, 'Automatons');
    state.settings.missionPlanner = HD2MissionState.defaults(); renderSpin();
    check(missionUI.apply('mission:evacuate-high-value-assets'), 'event-derived attacker allows current defense suggestion');
    await waitFor(() => !state.current.missionSelection, 'event-only attacker expires');
    check(missionUI.info().pool.status === 'needs-context' && missionUI.info().context.faction === null, 'expired event-only enemy blocks selection instead of inventing a winner');
    check(JSON.stringify(state.cards) === previousCards, 'mission lifecycle tests leave historical Results byte-for-byte unchanged');
  } finally {
    missionUI.stop(); saveState = previousSave; warService = previousService;
    state.current = previousRun; state.settings.missionPlanner = previousPlanner;
    document.getElementById('operationChecklist').open = false; renderWarDataStatus(); renderPlanetSearchResults(); renderSpin();
  }
  return { checks };
}

async function runElectronPhase() {
  const fs = require('node:fs');
  const path = require('node:path');
  const { app, dialog, session } = require('electron');
  const { installHarnessQuit, writeJson, writeDurable } = require('./desktop-test-safety');
  installHarnessQuit(app);
  const phase = process.argv[2];
  const runRoot = process.env.HD2CSM_SMOKE_ROOT;
  if (!['write', 'verify'].includes(phase) || !runRoot || !path.isAbsolute(runRoot)) throw new Error('Smoke phase requires an explicit isolated test root and write/verify phase.');
  const userData = path.join(runRoot, 'user-data');
  app.setAppPath(path.resolve(__dirname, '..'));
  app.setPath('userData', userData);
  app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
  app.commandLine.appendSwitch('disable-javascript-dialogs');
  const { createMainWindow } = require('../electron/main');
  const exportFile = path.join(runRoot, 'export.json');
  dialog.showSaveDialog = async () => ({ canceled: false, filePath: exportFile });
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [exportFile] });
  console.log(`Smoke ${phase}: waiting for Electron ready`);
  await app.whenReady();
  console.log(`Smoke ${phase}: Electron ready`);
  const blockedRequests = [];
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (details, callback) => {
    blockedRequests.push(details.url);
    callback({ cancel: true });
  });
  const errors = [];
  const mainWindow = createMainWindow({ show: true, automation: true });
  console.log(`Electron ${phase}: window created`);
  mainWindow.webContents.on('console-message', (_event, ...args) => {
    const message = typeof args[0] === 'object' ? args[0].message : args[1];
    if (String(message).startsWith('SMOKE')) console.log(message);
    if (/Uncaught|\[boot\].*failed|\[storage\].*failed|mutated cards|view-only.*mutation/i.test(String(message))) errors.push(String(message));
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => errors.push(`Renderer exited: ${details.reason}`));
  await new Promise((resolve, reject) => {
    mainWindow.webContents.once('did-finish-load', resolve);
    mainWindow.webContents.once('did-fail-load', (_event, code, description) => reject(new Error(`Load failed ${code}: ${description}`)));
  });
  console.log(`Electron ${phase}: page loaded`);
  let result;
  try {
    const expected = phase === 'verify' ? JSON.parse(fs.readFileSync(path.join(runRoot, 'write.json'), 'utf8')).result : null;
    const expression = phase === 'write'
      ? `(${rendererWritePhase.toString()})()`
      : `const rendererWarCacheVerify = ${rendererWarCacheVerify.toString()}; (${rendererVerifyPhase.toString()})(${JSON.stringify(expected)})`;
    const missionLifecycle = phase === 'write' ? await mainWindow.webContents.executeJavaScript(`(async () => { try { return await (${rendererMissionLifecyclePhase.toString()})(); } catch (error) { throw String(error.stack || error); } })()`, true) : null;
    result = await mainWindow.webContents.executeJavaScript(expression, true);
    if (phase === 'write') {
      result.missionLifecycle = missionLifecycle;
      session.defaultSession.webRequest.onBeforeRequest(null);
      result.network = await mainWindow.webContents.executeJavaScript(`(${rendererNetworkPhase.toString()})()`, true);
      for (const tab of ['spin', 'results', 'compare', 'items', 'rank']) {
        await mainWindow.webContents.executeJavaScript(`switchTab('${tab}'); document.getElementById('appViewport').scrollTo(0, 0); window.scrollTo(0, 0);`, true);
        await mainWindow.webContents.executeJavaScript('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))', true);
        // A compositor frame can lag the DOM/RAF in software-rendered Windows captures.
        await new Promise(resolve => setTimeout(resolve, 250));
        const screenshot = await mainWindow.webContents.capturePage();
        writeDurable(path.join(runRoot, `${tab}.png`), screenshot.toPNG());
      }
      await mainWindow.webContents.executeJavaScript(`switchTab('items'); document.getElementById('appViewport').scrollTo(0, 0); document.getElementById('itemsViewMode').value = 'warbond'; document.getElementById('itemsViewMode').dispatchEvent(new Event('change'));`, true);
      await new Promise(resolve => setTimeout(resolve, 350));
      writeDurable(path.join(runRoot, 'armory-warbonds.png'), (await mainWindow.webContents.capturePage()).toPNG());
      await mainWindow.webContents.executeJavaScript(`setArmoryPreferences(${JSON.stringify(result.armoryPreferences)}); saveHealth.flush();`, true);
    }
    if (errors.length) throw new Error(errors.join('\n'));
    if (phase === 'write' && !fs.existsSync(exportFile)) throw new Error('Desktop export did not write its JSON file.');
    writeJson(path.join(runRoot, `${phase}.json`), { passed: true, phase, processId: process.pid, userData: app.getPath('userData'), blockedRequests, result });
    console.log(`PASS ${phase}: ${result.checks.length} workflow checks; blocked ${blockedRequests.length} external requests.`);
    app.quit();
  } catch (error) {
    writeJson(path.join(runRoot, `${phase}-failure.json`), { passed: false, phase, error: error.stack || String(error), errors, blockedRequests });
    console.error(error.stack || String(error));
    app.quit();
  }
}

module.exports = { rendererWritePhase, rendererVerifyPhase, rendererNetworkPhase, rendererWarCacheVerify, rendererMissionLifecyclePhase };
if (process.versions.electron && process.type === 'browser') {
  runElectronPhase().catch(error => {
    console.error(error.stack);
    const { writeJson } = require('./desktop-test-safety');
    const path = require('node:path');
    if (process.env.HD2CSM_SMOKE_ROOT) writeJson(path.join(process.env.HD2CSM_SMOKE_ROOT, `${process.argv[2]}-failure.json`), { passed: false, error: error.stack });
    require('electron').app.quit();
  });
}
