const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { app, session, dialog, BrowserWindow, ipcMain } = require('electron');
const { installHarnessQuit, writeJson, writeDurable } = require('./desktop-test-safety');
const storage = require('../electron/storage');
const missionEngine = require('../assets/mission-selection').createEngine(require('../assets/mission-catalog.json'));
const missionState = require('../assets/mission-state');
const missionContext = { planetKey: 'id:7', faction: 'Automatons', difficulty: 7, campaign: 'liberation', active: true };
const missionPlanner = { version: 1, confirmation: missionEngine.confirm(missionContext, [{ kind: 'catalog', id: 'mission:launch-icbm' }]) };
const missionSelection = missionState.capture(missionEngine.select(missionContext, 'mission:launch-icbm'), missionContext, missionEngine.getCatalog().revision);
const phase = process.argv[2], runRoot = process.env.HD2CSM_TRANSFER_ROOT;
if (!runRoot || !path.isAbsolute(runRoot) || !['desktop', 'desktop-restart', 'browser', 'browser-restart'].includes(phase) || process.env.HD2_ELECTRON_TEST_HARNESS !== '1' || process.env.HD2CSM_USER_DATA_DIR !== path.join(runRoot, phase.split('-')[0], 'user-data')) throw new Error('Isolated runner required.');
const userData = process.env.HD2CSM_USER_DATA_DIR, browser = phase.startsWith('browser');
const incoming = path.join(runRoot, 'incoming.json'), outgoing = path.join(runRoot, 'outgoing.json');
installHarnessQuit(app); app.setAppPath(path.resolve(__dirname, '..'));
const { createMainWindow } = require('../electron/main');
dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [incoming] });
dialog.showSaveDialog = async () => ({ canceled: false, filePath: outgoing });
const checks = [], check = (ok, label) => { assert(ok, label); checks.push(label); };
let window;
const evaluate = expression => window.webContents.executeJavaScript(expression, true);
(async () => {
  await app.whenReady();
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_details, callback) => callback({ cancel: true }));
  // No preload means the real page uses its browser/localStorage implementation.
  // Suppress only this harness's native first-run reminder before page load;
  // later transfer alerts are captured by the explicit renderer stub below.
  window = browser ? new BrowserWindow({ width: 1280, height: 900, show: false, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, disableDialogs: true, backgroundThrottling: false } }) : createMainWindow({ show: true, automation: true, fullscreen: false });
  if (browser) window.loadFile(path.join(__dirname, '..', 'index.html'));
  await new Promise((resolve, reject) => { window.webContents.once('did-finish-load', resolve); window.webContents.once('did-fail-load', (_e, code, text) => reject(new Error(`${code}: ${text}`))); });
  await evaluate('bootStateReady.then(() => saveHealth.flush())');
  await evaluate('missionUIReady');
  check(await evaluate('!!missionUI'), 'bundled mission catalog and UI load offline');
  console.log(`Transfer ${phase}: renderer ready`);
  await evaluate('window.transferAlerts = []; window.alert = message => transferAlerts.push(String(message)); true');
  check(app.getPath('userData') === userData, 'isolated profile');
  check(await evaluate('!!desktopStorage') === !browser, 'expected desktop or browser backend');
  if (phase.endsWith('restart')) {
    const expected = JSON.parse(fs.readFileSync(path.join(runRoot, `${phase.split('-')[0]}-expected.json`)));
    const actual = await evaluate('buildPersistedStatePayload()');
    check(JSON.stringify(actual) === JSON.stringify(expected), 'complete imported payload survives separate-process restart');
    check(actual.cards.some(card => card.id === 'accepted-transfer'), 'accepted card restored');
    check(JSON.stringify(actual.settings.missionPlanner) === JSON.stringify(missionPlanner), 'mission shortlist survives restart');
    check(JSON.stringify(actual.cards[0].missionSelection) === JSON.stringify(missionSelection), 'historical mission snapshot survives restart');
    await evaluate('window.prompt = () => "CLEAR ALL DATA"; true');
    await evaluate('clearAllData()');
    check(await evaluate('state.settings.missionPlanner.confirmation === null'), 'explicit Clear All resets mission shortlist');
    if (browser) check(await evaluate('!!localStorage.getItem(STORAGE_IMPORT_BACKUP_KEY)'), 'browser pre-import backup survives boot autosave');
    else check(fs.readdirSync(path.join(userData, 'backups')).some(name => fs.readFileSync(path.join(userData, 'backups', name), 'utf8').includes('original-transfer')), 'pre-import desktop backup remains recoverable');
  } else {
    await evaluate(`state.cards = [{ id: 'original-transfer', seed: 'original' }]; state.settings.rememberedPlayerName = 'Original Diver'; saveState()`);
    const initial = await evaluate('JSON.stringify(buildPersistedStatePayload())');
    const disk = browser ? await evaluate('localStorage.getItem(STORAGE_KEY)') : fs.readFileSync(path.join(userData, 'state.json'), 'utf8');
    const submit = async data => {
      if (browser) return evaluate(`importJSONFile(new File([${JSON.stringify(JSON.stringify(data))}], 'test.json', {type:'application/json'}))`);
      writeJson(incoming, data); return evaluate('importJSONFile()');
    };
    const bad = [
      { items: { primaries: [{}] } },
      { items: { primaries: [{ id: 'primary:unknown-without-name' }] } },
      { cards: [{ id: 'bad', stats: [] }] },
      { cards: [{ id: 'bad', mode: { toString: null } }] },
      JSON.parse('{"items":{"__proto__":[{"name":"bad"}]},"cards":[]}'),
      { saveFormatVersion: 1, data: null, cards: [] },
      { settings: { missionPlanner: null } },
      { settings: { missionPlanner: { version: 2, confirmation: null } } }
    ];
    for (const [index, data] of bad.entries()) {
      check(await submit(data) === false, `malformed case ${index + 1} rejected`);
      check(await evaluate('JSON.stringify(buildPersistedStatePayload())') === initial, `malformed case ${index + 1} leaves in-memory state unchanged`);
      const after = browser ? await evaluate('localStorage.getItem(STORAGE_KEY)') : fs.readFileSync(path.join(userData, 'state.json'), 'utf8');
      check(after === disk, `malformed case ${index + 1} leaves working bytes unchanged`);
    }
    check(await evaluate('!importInProgress && !document.getElementById("appCanvas").inert'), 'rejection restores interactive controls');
    const oversized = await evaluate(`(async () => { let read = false; const ok = await importJSONFile({ size: HD2CSMTransfer.MAX_BYTES + 1, text: async () => { read = true; return '{}'; } }); return { ok, read }; })()`);
    check(!oversized.ok && !oversized.read, 'oversize browser-file path refused before reading');
    const accepted = { items: {}, cards: [{ id: 'accepted-transfer', seed: 'transfer', planet: 'Legacy Planet' }], settings: { rememberedPlayerName: 'Transfer Diver' } };
    accepted.settings.missionPlanner = missionPlanner;
    accepted.cards[0].mode = 'Normal (40)'; accepted.cards[0].missionSelection = missionSelection;
    if (browser) {
      await evaluate(`window.realTransferSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === STORAGE_KEY) throw new DOMException('Injected quota failure', 'QuotaExceededError'); return realTransferSetItem.call(this, key, value); }; true`);
      check(await submit(accepted) === false, 'browser quota failure stops import');
      check(await evaluate('JSON.stringify(buildPersistedStatePayload())') === initial && await evaluate('localStorage.getItem(STORAGE_KEY)') === disk, 'quota failure keeps original memory and disk');
      await evaluate('Storage.prototype.setItem = realTransferSetItem; true');
    } else {
      ipcMain.removeHandler('storage:commitImport');
      ipcMain.handle('storage:commitImport', () => ({ ok: false, error: 'Injected import write failure' }));
      check(await submit(accepted) === false, 'desktop commit failure stops import');
      check(await evaluate('JSON.stringify(buildPersistedStatePayload())') === initial && fs.readFileSync(path.join(userData, 'state.json'), 'utf8') === disk, 'commit failure keeps original memory and disk');
      let release;
      ipcMain.removeHandler('storage:commitImport');
      ipcMain.handle('storage:commitImport', async (_event, data) => { await new Promise(resolve => { release = resolve; }); return storage.commitImportData(userData, data); });
      writeJson(incoming, accepted);
      await evaluate('window.pendingTransfer = importJSONFile(); true');
      const deadline = Date.now() + 5000;
      while (!release && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 10));
      check(!!release, 'prepared import reaches commit boundary');
      const paused = await evaluate(`(async () => { const event = new Event('beforeunload', {cancelable:true}); window.dispatchEvent(event); return { close: event.defaultPrevented, inert: document.getElementById('appCanvas').inert, repeat: await importJSONFile(), autosave: await saveState(), payload: JSON.stringify(buildPersistedStatePayload()) }; })()`);
      check(paused.close && paused.inert && paused.repeat === false && paused.autosave === false && paused.payload === initial, 'pending commit guards close/reentry/autosave without optimistic state');
      release(); check(await evaluate('pendingTransfer') === true, 'acknowledged commit publishes prepared state');
      ipcMain.removeHandler('storage:commitImport'); ipcMain.handle('storage:commitImport', (_event, data) => storage.commitImportData(userData, data));
    }
    if (browser) check(await submit(accepted) === true, 'browser import commits successfully after quota recovery');
    check(await evaluate('state.cards[0].planet.name') === 'Legacy Planet', 'legacy planet text normalized safely');
    check(await evaluate('state.settings.rememberedPlayerName') === 'Transfer Diver', 'accepted preferences published');
    check(await evaluate('JSON.stringify(state.settings.missionPlanner)') === JSON.stringify(missionPlanner), 'mission shortlist published without data loss');
    check(await evaluate('JSON.stringify(state.cards[0].missionSelection)') === JSON.stringify(missionSelection), 'historical mission metadata preserved by import normalization');
    check(await evaluate('prepareImportedData({items:{},cards:[],settings:{}}).settings.missionPlanner.confirmation === null'), 'old import does not inherit an unrelated current shortlist');
    check(await evaluate('!importInProgress && !document.getElementById("appCanvas").inert'), 'success restores controls');
    if (!browser) {
      check(await evaluate('exportJSON()') === true, 'real desktop IPC export succeeds');
      check(storage.readImportFile(outgoing).data.cards[0].id === 'accepted-transfer', 'export is accepted by same bounded reader');
      const large = { ...accepted, items: { primaries: [{ name: 'Transfer Metadata', enabled: false, owned: true, retainedMetadata: 'x'.repeat(6 * 1024 * 1024) }] } };
      check(await submit(large) === true, 'real desktop import above former 5 MiB limit succeeds');
      check(await evaluate('exportJSON()') === true && fs.statSync(outgoing).size > 5 * 1024 * 1024, 'large prepared desktop export is valid and exceeds old limit');
      check(storage.readImportFile(outgoing).data.items.primaries.some(row => row.retainedMetadata?.length === 6 * 1024 * 1024), 'large metadata survives desktop export reader');
    }
    check(await evaluate('transferAlerts.some(message => message.includes("Import stopped"))'), 'failures are explained visibly');
    writeJson(path.join(runRoot, `${phase}-expected.json`), await evaluate('buildPersistedStatePayload()'));
    // Browser-path checks are logical/storage checks, not visual acceptance.
    // Do not wait for animation frames of an occluded/hidden browser window.
    if (!browser) {
      await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
      writeDurable(path.join(runRoot, `${phase}.png`), (await window.webContents.capturePage()).toPNG());
      await evaluate(`window.missionVisualPrevious = { current: structuredClone(state.current), planner: structuredClone(state.settings.missionPlanner) };
        resetCurrentSpinState(); state.current.loadout = {primary:'Visual fixture',sidearm:'Visual fixture',throwable:'Visual fixture',booster:'Visual fixture',stratagems:[]}; state.current.locked = true; state.current.difficultySelected = true;
        state.current.difficulty = 7; state.current.planet = getPlanetPoolSource()[0]; state.current.planetLocked = true;
        state.current.faction = state.current.planet.faction; state.settings.missionPlanner = HD2MissionState.defaults();
        doUseThisRun(); switchTab('spin'); document.getElementById('operationChecklist').open = true;
        document.getElementById('missionPlannerPanel').scrollIntoView({block:'center'}); true`);
      check(await evaluate('missionUI.validSelection()'), 'visual fixture has a usable mission recommendation');
      await new Promise(resolve => setTimeout(resolve, 350));
      writeDurable(path.join(runRoot, 'mission-checklist.png'), (await window.webContents.capturePage()).toPNG());
      await evaluate(`window.lockedMissionEvidence = JSON.stringify(state.current.missionSelection); state.current.modeConfirmed = true;
        state.current.difficulty = 1; renderSpin(); true`);
      check(await evaluate('JSON.stringify(state.current.missionSelection) === lockedMissionEvidence'), 'finalized mission snapshot survives changed live context');
      await evaluate(`state.current = missionVisualPrevious.current; state.settings.missionPlanner = missionVisualPrevious.planner; renderSpin(); true`);
    }
  }
  writeJson(path.join(runRoot, `${phase}.json`), { passed: true, processId: process.pid, checks });
  console.log(`PASS transfer ${phase}: ${checks.length} checks`); window.close();
})().catch(async error => {
  writeJson(path.join(runRoot, `${phase}-failure.json`), { error: error.stack }); console.error(error.stack);
  if (window && !window.isDestroyed()) { try { await evaluate('importInProgress = false; discardUnsavedOnClose = true;'); } catch (_) {} }
  app.quit();
});
