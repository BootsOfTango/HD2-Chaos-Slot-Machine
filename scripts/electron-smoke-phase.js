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
  await preloadItemVisuals();
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
  const lockedFaction = state.current.faction;
  click('#btnRerollPlanetInline');
  await waitFor(() => !state.current.spinning, 'planet reroll');
  assert(state.current.faction === lockedFaction && normalizeFactionName(state.current.planet.faction) === lockedFaction, 'planet reroll respects the locked faction');
  click('#btnConfirmPlanetInline');
  assert(state.current.planetConfirmed && !!state.current.mode, 'planet confirmation generates a mission mode');
  click('#btnRerollMode');
  assert(getMissionModesForFaction(lockedFaction).includes(state.current.mode), 'mission mode reroll stays valid for faction');
  click('#btnApplyManualMode');
  await waitFor(() => state.current.modeConfirmed, 'mode confirmation and seed animation');
  input('#spinPlayerName', 'Smoke Diver');
  click('#btnConfirmPlayer');
  await waitFor(() => state.cards.length === 1, 'saved pending Result');
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
    await importJSONFile();
    assert(state.cards.length === 2 && state.settings.rememberedPlayerName === 'Smoke Diver', 'desktop IPC imports exported cards and settings');
    assert(state.items[toggled.group].find(item => item.name === toggled.name).enabled === toggled.enabled, 'import restores Armory ownership changes');
  }
  const persisted = await desktopStorage.saveState(buildPersistedStatePayload());
  assert(persisted.ok, 'final state is flushed through the desktop storage bridge');
  const info = await window.chaosSlotMachine.getAppInfo();
  assert(info.name === 'Helldivers 2 Chaos Slot Machine', 'desktop metadata exposes the renamed application');
  return { checks, alerts, toggled, initialOfflineStatus, scoreRatio, audioState: audioCtx.state, cardIds: state.cards.map(card => card.id), info };
}

async function rendererVerifyPhase(expected) {
  const checks = [];
  const assert = (condition, label) => { if (!condition) throw new Error(`SMOKE: ${label}`); checks.push(label); };
  window.alert = () => {};
  await bootStateReady;
  assert(state.cards.length === 2 && state.cards.every(card => card.statsLocked), 'separate process restores both finalized cards');
  assert(JSON.stringify(state.cards.map(card => card.id)) === JSON.stringify(expected.cardIds), 'separate process restores exact card identities');
  assert(state.settings.rememberedPlayerName === 'Smoke Diver', 'remembered player survives process restart');
  assert(state.items[expected.toggled.group].find(item => item.name === expected.toggled.name).enabled === expected.toggled.enabled, 'Armory ownership survives process restart');
  const success = state.cards.find(card => card.playerName === 'Smoke Diver');
  const fail = state.cards.find(card => card.playerName === 'Smoke Rival');
  assert(Math.abs(fail.scoreRaw / success.scoreRaw - 0.75) < 0.000001, 'scoring remains stable after process restart');
  switchTab('results');
  assert(document.querySelectorAll('.resultCard').length === 2, 'Results restores both finalized cards');
  switchTab('compare');
  assert(document.querySelector('#cmpRadarA svg') && document.querySelector('#cmpRadarB svg'), 'Compare renders after restart');
  switchTab('rank');
  assert(document.querySelectorAll('#rankList .rankRow').length === 2, 'Rank renders after restart');
  return { checks };
}

async function rendererNetworkPhase() {
  const checks = [];
  const assert = (condition, label) => { if (!condition) throw new Error(`NETWORK: ${label}`); checks.push(label); };
  while (isApiPlanetSyncInProgress()) await new Promise(resolve => setTimeout(resolve, 40));
  const originalFetch = window.fetch;
  let live;
  try {
    // Try the actual service first; report its availability separately from fixtures.
    await loadAndRenderApiActivePlanets({ manual: true });
    live = { passed: /^Live API returned/.test(document.querySelector('#apiPlanetStatus').textContent), status: document.querySelector('#apiPlanetStatus').textContent };
    const fixture = [{ planet: { name: 'Network Test Planet', sector: 'Test Sector', currentOwner: 'Terminids', biome: { name: 'Jungle' } } }];
    window.fetch = async () => ({ ok: true, json: async () => fixture });
    await loadAndRenderApiActivePlanets({ manual: true });
    assert(/^Live API returned 1/.test(document.querySelector('#apiPlanetStatus').textContent), 'successful refresh updates the visible live list');
    const cached = getCachedLivePlanets();
    assert(cached && Number.isFinite(Date.parse(cached.updatedAt)), 'successful refresh persists a dated cache');
    assert(rollPlanetForFaction('Automatons')?.faction === 'Automatons', 'missing live faction falls back to matching bundled planets');
    for (const failure of ['offline', 'rate-limit', 'invalid', 'empty', 'timeout']) {
      window.fetch = failure === 'offline' ? async () => { throw new Error('simulated disconnected network'); }
        : failure === 'rate-limit' ? async () => ({ ok: false, status: 429 })
        : failure === 'timeout' ? (_url, opts) => new Promise((_resolve, reject) => opts.signal.addEventListener('abort', () => reject(new Error('simulated request timeout'))))
        : async () => ({ ok: true, json: async () => failure === 'empty' ? [] : { invalid: true } });
      await loadAndRenderApiActivePlanets({ manual: true });
      const status = document.querySelector('#apiPlanetStatus').textContent;
      assert(status.includes('cached live planets from') && status.includes(formatLivePlanetsUpdatedAt(cached.updatedAt)), `${failure} displays the cache date`);
      assert(!!rollLoadout(null).primary && !!rollPlanetForFaction('Terminids'), `${failure} leaves randomization usable`);
    }
    window.fetch = async () => ({ ok: true, json: async () => fixture });
    await loadAndRenderApiActivePlanets({ manual: true });
    assert(/^Live API returned/.test(document.querySelector('#apiPlanetStatus').textContent), 'refresh recovers after connectivity returns');
  } finally { window.fetch = originalFetch; }
  return { checks, live };
}

async function runElectronPhase() {
  const fs = require('node:fs');
  const path = require('node:path');
  const { app, dialog, session } = require('electron');
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
      : `(${rendererVerifyPhase.toString()})(${JSON.stringify(expected)})`;
    result = await mainWindow.webContents.executeJavaScript(expression, true);
    if (phase === 'write') {
      session.defaultSession.webRequest.onBeforeRequest(null);
      result.network = await mainWindow.webContents.executeJavaScript(`(${rendererNetworkPhase.toString()})()`, true);
      for (const tab of ['spin', 'results', 'compare', 'items', 'rank']) {
        await mainWindow.webContents.executeJavaScript(`switchTab('${tab}')`, true);
        const screenshot = await mainWindow.webContents.capturePage();
        fs.writeFileSync(path.join(runRoot, `${tab}.png`), screenshot.toPNG());
      }
    }
    if (errors.length) throw new Error(errors.join('\n'));
    if (phase === 'write' && !fs.existsSync(exportFile)) throw new Error('Desktop export did not write its JSON file.');
    fs.writeFileSync(path.join(runRoot, `${phase}.json`), JSON.stringify({ passed: true, phase, processId: process.pid, userData: app.getPath('userData'), blockedRequests, result }, null, 2));
    console.log(`PASS ${phase}: ${result.checks.length} workflow checks; blocked ${blockedRequests.length} external requests.`);
    app.exit(0);
  } catch (error) {
    fs.writeFileSync(path.join(runRoot, `${phase}-failure.json`), JSON.stringify({ passed: false, phase, error: error.stack, errors, blockedRequests }, null, 2));
    console.error(error.stack);
    app.exit(1);
  }
}

module.exports = { rendererWritePhase, rendererVerifyPhase, rendererNetworkPhase };
if (process.versions.electron && process.type === 'browser') {
  runElectronPhase().catch(error => { console.error(error.stack); require('electron').app.exit(1); });
}
