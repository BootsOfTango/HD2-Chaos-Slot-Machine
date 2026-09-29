const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
test('production disables unused Node entry points and requires validated ASAR code', () => {
  const config = require('../electron-builder.config');
  assert.deepEqual(config.electronFuses, {
    runAsNode: false, enableNodeOptionsEnvironmentVariable: false, enableNodeCliInspectArguments: false,
    enableEmbeddedAsarIntegrityValidation: true, onlyLoadAppFromAsar: true,
    // Deliberate compatibility exception: Electron 44 otherwise denies old localStorage.
    grantFileProtocolExtraPrivileges: true
  });
});
test('legacy reader is script-free and main startup trusts only custom-origin app', () => {
  const html = fs.readFileSync(path.join(__dirname, '../assets/origin-bootstrap.html'), 'utf8');
  assert.doesNotMatch(html, /<script|<iframe|<img|<link|\bon\w+\s*=/i);
  assert.match(html, /default-src 'none'/);
  const coordinator = fs.readFileSync(path.join(__dirname, '../electron/origin-migration.js'), 'utf8');
  assert.doesNotMatch(coordinator, /\bpreload\s*:/);
  const main = fs.readFileSync(path.join(__dirname, '../electron/main.js'), 'utf8');
  assert.match(main, /createTrustedIpc\(\{ ipcMain, BrowserWindow, entryUrl: ENTRY_URL \}\)/);
  assert.doesNotMatch(main, /mainWindow\.loadFile/);
});
