const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { app, session, BrowserWindow } = require('electron');
const { installHarnessQuit, writeJson } = require('./desktop-test-safety');
const { rendererSecurityPhase } = require('./renderer-security-phase');
const runRoot = process.env.HD2CSM_RENDERER_SECURITY_ROOT, phase = process.argv[2];
if (!runRoot || !path.isAbsolute(runRoot) || !['desktop','browser'].includes(phase) ||
    process.env.HD2_ELECTRON_TEST_HARNESS !== '1' || process.env.HD2CSM_USER_DATA_DIR !== path.join(runRoot, phase, 'user-data')) throw Error('Requires isolated exclusive runner');
installHarnessQuit(app);
app.setAppPath(path.resolve(__dirname, '..'));
const { createMainWindow } = require('../electron/main');
(async () => {
  await app.whenReady();
  assert.equal(process.versions.electron, require('../package.json').devDependencies.electron);
  const probeRequests = [];
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (details, callback) => {
    if (details.url.includes('example.invalid')) probeRequests.push(details.url);
    callback({ cancel: true });
  });
  const window = phase === 'desktop' ? createMainWindow({ show: true, fullscreen: false }) : new BrowserWindow({ show: false, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, disableDialogs: true, backgroundThrottling: false } });
  if (phase === 'browser') window.loadFile(path.join(__dirname, '..', 'index.html'));
  await new Promise((resolve, reject) => {
    window.webContents.once('did-finish-load', resolve);
    window.webContents.once('did-fail-load', (_event, code, message) => reject(Error(`${code}: ${message}`)));
  });
  const result = await window.webContents.executeJavaScript(`(${rendererSecurityPhase.toString()})()`, true);
  assert.equal(probeRequests.length, 0, 'CSP probes must be blocked before network dispatch');
  result.checks.push('blocked probes do not reach network request handler');
  writeJson(path.join(runRoot, `${phase}.json`), { passed: true, processId: process.pid, versions: process.versions, result });
  console.log(`PASS renderer security ${phase}: ${result.checks.length} checks; Electron ${process.versions.electron}`);
  window.close();
})().catch(error => {
  const detail = error?.stack || error?.message || String(error);
  writeJson(path.join(runRoot, `${phase}-failure.json`), { passed: false, error: detail });
  console.error(detail); app.quit();
});
