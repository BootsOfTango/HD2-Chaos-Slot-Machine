// Small initial gate: two sequential processes, not the broad/fullscreen stress suite.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { app, session } = require('electron');
const { installHarnessQuit, writeJson } = require('./desktop-test-safety');
const runRoot = process.env.HD2CSM_SAFETY_SMOKE_ROOT;
const phase = process.argv[2];
if (!runRoot || !path.isAbsolute(runRoot) || !['write', 'verify'].includes(phase) ||
    process.env.HD2_ELECTRON_TEST_HARNESS !== '1' || process.env.HD2CSM_USER_DATA_DIR !== path.join(runRoot, 'user-data')) {
  throw new Error('Safety smoke requires its exclusive runner and isolated profile.');
}
installHarnessQuit(app);
app.setAppPath(path.resolve(__dirname, '..'));
const { createMainWindow } = require('../electron/main');

(async () => {
  await app.whenReady();
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_details, callback) => callback({ cancel: true }));
  const window = createMainWindow({ show: true, automation: phase === 'write', fullscreen: phase === 'verify' });
  window.webContents.on('console-message', (event) => {
    if (event.level === 'error') console.error('Safety renderer:', event.message);
  });
  await new Promise((resolve, reject) => {
    window.webContents.once('did-finish-load', resolve);
    window.webContents.once('did-fail-load', (_event, code, message) => reject(new Error(`${code}: ${message}`)));
  });
  const result = await window.webContents.executeJavaScript(`(async () => {
    await bootStateReady;
    const checks = [];
    const assert = (ok, message) => { if (!ok) throw new Error(message); checks.push(message); };
    const info = await chaosSlotMachine.getAppInfo();
    assert(info.renderingMode === 'software' && info.hardwareAccelerationDisabled, 'app reports software rendering');
    assert(String(info.gpuFeatureStatus.gpu_compositing).startsWith('disabled'), 'hardware GPU compositing is disabled');
    assert(String(info.gpuFeatureStatus.rasterization).startsWith('disabled'), 'hardware rasterization is disabled');
    assert(state.items.primaries.length > 0 && state.items.stratagems.length > 0, 'bundled equipment loads offline');
    assert(document.getElementById('appCanvas').getBoundingClientRect().width >= 1280, 'desktop layout retains minimum width');
    if (${JSON.stringify(phase)} === 'write') {
      assert(!(await chaosSlotMachine.getWindowState()).isFullscreen, 'first gate starts windowed');
      state.settings.rememberedPlayerName = 'Isolated graphics safety check';
      localStorage.setItem(FIRST_BACKUP_WARNING_KEY, '1');
      const saved = await chaosSlotMachine.saveState(buildPersistedStatePayload());
      assert(saved.ok, 'isolated preference save is acknowledged on disk');
    } else {
      assert(!chaosSlotMachine.isTestHarness, 'second window uses normal renderer mode');
      assert((await chaosSlotMachine.getWindowState()).isFullscreen, 'second gate starts fullscreen');
      assert(state.settings.rememberedPlayerName === 'Isolated graphics safety check', 'preference survives a separate process restart');
    }
    return { checks, info };
  })()`, true);
  assert.equal(app.getPath('userData'), path.join(runRoot, 'user-data'));
  writeJson(path.join(runRoot, `${phase}.json`), { passed: true, processId: process.pid, result });
  console.log(`PASS safety ${phase}: ${result.checks.length} checks; closing normally`);
  // Fullscreen phase exercises the same guarded close as the title-bar close button.
  window.close();
})().catch(error => {
  writeJson(path.join(runRoot, `${phase}-failure.json`), { passed: false, error: error.stack });
  console.error(error.stack);
  app.quit();
});
