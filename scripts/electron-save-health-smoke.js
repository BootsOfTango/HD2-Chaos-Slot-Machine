const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { app, session, ipcMain } = require('electron');
const { installHarnessQuit, writeJson, writeDurable } = require('./desktop-test-safety');
const storage = require('../electron/storage');
const phase = process.argv[2], runRoot = process.env.HD2CSM_HEALTH_ROOT;
if (!runRoot || !path.isAbsolute(runRoot) || !['future', 'semantic', 'corrupt', 'backup-recovery', 'write-failure', 'pending-close'].includes(phase) || process.env.HD2_ELECTRON_TEST_HARNESS !== '1' || process.env.HD2CSM_USER_DATA_DIR !== path.join(runRoot, phase, 'user-data')) throw new Error('Isolated runner required.');
const userData = process.env.HD2CSM_USER_DATA_DIR, file = path.join(userData, 'state.json');
fs.mkdirSync(userData, { recursive: true });
let protectedBytes, damagedBytes, backupBytes;
if (phase === 'corrupt' || phase === 'backup-recovery') {
  // Deliberately truncated JSON in this synthetic profile, never a personal save.
  damagedBytes = Buffer.from('{"saveFormatVersion":1,"data":');
  writeDurable(file, damagedBytes);
  if (phase === 'corrupt') protectedBytes = damagedBytes;
  else {
    backupBytes = Buffer.from(JSON.stringify(storage.wrapData({ cards: [], items: {}, settings: { rememberedPlayerName: 'Recovered test pilot' } })));
    writeDurable(path.join(userData, 'backups', 'state-recovery-fixture.json'), backupBytes);
  }
}
if (phase === 'future' || phase === 'semantic') {
  const payload = storage.wrapData({ cards: [], items: phase === 'semantic' ? { primaries: [{}] } : {}, settings: {} });
  if (phase === 'future') payload.saveFormatVersion = 999;
  writeJson(file, payload); protectedBytes = fs.readFileSync(file);
}
installHarnessQuit(app); app.setAppPath(path.resolve(__dirname, '..'));
const { createMainWindow } = require('../electron/main');
let window;
const checks = [];
const check = (ok, message) => { assert(ok, message); checks.push(message); };
function report() { writeJson(path.join(runRoot, `${phase}.json`), { passed: true, processId: process.pid, electronVersion: process.versions.electron, checks }); console.log(`PASS save-health ${phase}: ${checks.length} checks`); }
function preservedDamage() {
  return fs.readdirSync(path.join(userData, 'recovery')).some(name =>
    name.startsWith('state-damaged-') && fs.readFileSync(path.join(userData, 'recovery', name)).equals(damagedBytes));
}
(async () => {
  await app.whenReady();
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_details, callback) => callback({ cancel: true }));
  window = createMainWindow({ show: true, automation: true, fullscreen: false });
  await new Promise((resolve, reject) => { window.webContents.once('did-finish-load', resolve); window.webContents.once('did-fail-load', (_e, code, message) => reject(new Error(`${code}: ${message}`))); });
  await window.webContents.executeJavaScript('bootStateReady.then(() => saveHealth.flush())', true);
  check(app.getPath('userData') === userData, 'uses isolated profile');
  if (protectedBytes) {
    const result = await window.webContents.executeJavaScript(`(async () => {
      window.alert = () => {}; const before = saveHealth.status();
      state.settings.rememberedPlayerName = 'must not replace original';
      const saved = await saveState(); await importJSONFile(); await clearAllData();
      return { before, saved, visible: !document.getElementById('saveHealthNotice').hidden, message: document.querySelector('[data-save-health-message]').textContent, controls: state.items.primaries.length > 0, readonly: saveHealth.status().blocked };
    })()`, true);
    check(result.before.blocked && result.readonly, 'failed load remains protected after later actions');
    check(result.saved === false, 'later save does not overwrite with defaults');
    check(result.visible && result.message.includes('will not overwrite'), 'visible accessible save-protection warning');
    check(result.controls, 'UI remains usable with bundled equipment');
    if (phase === 'corrupt') {
      check(preservedDamage(), 'truncated original is preserved byte-for-byte in recovery');
      check(!fs.existsSync(file), 'no default save replaces the unrecoverable truncated save');
    } else check(fs.readFileSync(file).equals(protectedBytes), 'original disk bytes unchanged after boot, save, import and clear attempts');
    await window.webContents.executeJavaScript('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
    writeDurable(path.join(runRoot, `${phase}.png`), (await window.webContents.capturePage()).toPNG());
  } else if (phase === 'backup-recovery') {
    const recovered = await window.webContents.executeJavaScript(`({ name: state.settings.rememberedPlayerName, health: saveHealth.status() })`, true);
    check(recovered.name === 'Recovered test pilot', 'renderer restores the valid backup instead of fresh defaults');
    check(!recovered.health.blocked && !recovered.health.error, 'valid backup recovery leaves saving available');
    check(preservedDamage(), 'backup recovery preserves the truncated original bytes');
    check(fs.readFileSync(path.join(userData, 'backups', 'state-recovery-fixture.json')).equals(backupBytes), 'source backup remains byte-for-byte recoverable');
    check(storage.loadStateFile(userData).data.settings.rememberedPlayerName === 'Recovered test pilot', 'recovered pilot survives the boot save on disk');
  } else if (phase === 'write-failure') {
    const previousBytes = fs.readFileSync(file);
    ipcMain.removeHandler('storage:save'); ipcMain.handle('storage:save', () => { throw new Error('Injected disk write failure'); });
    const failed = await window.webContents.executeJavaScript(`(async () => {
      state.settings.rememberedPlayerName = 'retry retains latest state'; const saved = await saveState();
      const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event);
      return { saved, prevented: event.defaultPrevented, visible: !document.getElementById('saveHealthNotice').hidden, error: saveHealth.status().error };
    })()`, true);
    check(!failed.saved && failed.visible && failed.error.includes('Injected'), 'failed acknowledgement is visibly unsaved');
    check(failed.prevented, 'unsaved failure prevents silent normal close');
    check(fs.readFileSync(file).equals(previousBytes), 'failed write leaves disk bytes unchanged');
    const painted = await window.webContents.executeJavaScript(`new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
      const notice = document.getElementById('saveHealthNotice'), button = notice.querySelector('[data-save-health-retry]');
      const bounds = button.getBoundingClientRect();
      resolve(!notice.hidden && bounds.width > 0 && bounds.height > 0 && document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2) === button);
    })))`);
    check(painted, 'warning retry button is painted and not obscured');
    writeDurable(path.join(runRoot, `${phase}.png`), (await window.webContents.capturePage()).toPNG());
    ipcMain.removeHandler('storage:save'); ipcMain.handle('storage:save', (_event, data) => storage.saveStateFile(userData, data));
    const retried = await window.webContents.executeJavaScript(`(async () => {
      document.querySelector('[data-save-health-retry]').click(); await saveHealth.flush();
      const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event);
      return { hidden: document.getElementById('saveHealthNotice').hidden, prevented: event.defaultPrevented, health: saveHealth.status() };
    })()`, true);
    check(retried.hidden && !retried.prevented && !retried.health.error, 'successful real retry clears error and allows close');
    check(storage.loadStateFile(userData).data.settings.rememberedPlayerName === 'retry retains latest state', 'retry persists the current session');
  } else {
    ipcMain.removeHandler('storage:save'); ipcMain.handle('storage:save', async (_event, data) => {
      await new Promise(resolve => setTimeout(resolve, 400)); return storage.saveStateFile(userData, data);
    });
    await window.webContents.executeJavaScript("state.settings.rememberedPlayerName = 'pending close persisted'; void saveState(); true", true);
    window.once('closed', () => {
      try { check(storage.loadStateFile(userData).data.settings.rememberedPlayerName === 'pending close persisted', 'normal close waits for acknowledgement and persists latest changes'); report(); }
      catch (error) { writeJson(path.join(runRoot, `${phase}-failure.json`), { error: error.stack }); }
    });
    window.close();
    await new Promise(resolve => setTimeout(resolve, 50));
    check(!window.isDestroyed(), 'window remains open while the disk acknowledgement is pending');
    return;
  }
  report(); window.close();
})().catch(async error => {
  writeJson(path.join(runRoot, `${phase}-failure.json`), { error: error.stack }); console.error(error.stack);
  // Test-only cleanup releases the injected failure without bypassing native close.
  ipcMain.removeHandler('storage:save'); ipcMain.handle('storage:save', (_event, data) => storage.saveStateFile(userData, data));
  if (window && !window.isDestroyed()) { try { await window.webContents.executeJavaScript('saveHealth.flush().then(() => { discardUnsavedOnClose = true; })'); } catch (_) {} }
  app.quit();
});
