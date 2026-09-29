const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { app, protocol, session, BrowserWindow } = require('electron');
const { SCHEME, ENTRY_URL, SCHEME_REGISTRATION, createLocalHandler } = require('../electron/local-protocol');
const { installHarnessQuit, writeJson } = require('./desktop-test-safety');
const { rendererSecurityPhase } = require('./renderer-security-phase');
const { secureSession } = require('../electron/ipc-security');
const root = path.resolve(__dirname, '..'), runRoot = process.env.HD2CSM_PROTOCOL_TEST_ROOT, phase = process.argv[2];
if (!runRoot || !path.isAbsolute(runRoot) || !['seed','migrate','restart'].includes(phase) ||
    process.env.HD2_ELECTRON_TEST_HARNESS !== '1' || process.env.HD2CSM_USER_DATA_DIR !== path.join(runRoot, 'user-data')) throw Error('Requires isolated exclusive protocol runner');
installHarnessQuit(app); app.setAppPath(root);
const { createMainWindow } = require('../electron/main');
const migrationScript = fs.readFileSync(path.join(root, 'assets/origin-storage.js'), 'utf8');
const bootstrap = path.join(root, 'assets/origin-bootstrap.html');
const fixture = {
  hd2_chaos_slot_machine_v1: JSON.stringify({ cards: [{ id: 'legacy-origin-card', seed: 'Origin migration fixture', difficulty: 6 }] }),
  hd2_chaos_slot_machine_corrupt_v1: '{preserved damaged data',
  hd2_items_view_mode: 'category', hd2_items_type_filter: 'primary', hd2_armory_expanded_groups_v1: '["all"]',
  hd2_live_planets_cache_v1: JSON.stringify({ updatedAt: '2026-09-01T00:00:00Z', planets: [{ name: 'Origin Test Planet', faction: 'Terminids', sector: 'Test', biome: 'Test' }] })
};
const checks = [], check = (ok, label) => { assert.ok(ok, label); checks.push(label); };
const evaluate = (window, code) => window.webContents.executeJavaScript(code, true);
const ready = window => new Promise((resolve, reject) => {
  window.webContents.once('did-finish-load', resolve);
  window.webContents.once('did-fail-load', (_e, code, message) => reject(Error(`${code}: ${message}`)));
});
(async () => {
  await app.whenReady();
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*','https://*/*'] }, (_details, callback) => callback({ cancel: true }));
  if (phase === 'seed') {
    const window = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, disableDialogs: true } });
    await window.loadFile(path.join(root, 'index.html'));
    await evaluate(window, 'bootStateReady');
    check(window.webContents.getURL().startsWith('file:'), 'seed uses the existing real file-origin application');
    await evaluate(window, `for (const [key, value] of Object.entries(${JSON.stringify(fixture)})) localStorage.setItem(key, value); localStorage.setItem('unrelated-origin-key', 'private fixture');`);
    await evaluate(window, migrationScript);
    const snapshot = await evaluate(window, 'HD2OriginStorage.snapshot(localStorage)');
    for (const [key, value] of Object.entries(fixture)) check(snapshot[key] === value, `old-origin fixture stored: ${key}`);
    await session.defaultSession.flushStorageData();
    writeJson(path.join(runRoot, `${phase}.json`), { passed: true, processId: process.pid, checks }); window.close(); return;
  }
  session.defaultSession.protocol.handle(SCHEME, createLocalHandler(root));
  secureSession(session.defaultSession);
  const window = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false, sandbox: true, contextIsolation: true, backgroundThrottling: false, disableDialogs: true } });
  await window.loadFile(bootstrap); await evaluate(window, migrationScript);
  const source = await evaluate(window, 'HD2OriginStorage.snapshot(localStorage)');
  for (const [key, value] of Object.entries(fixture)) check(source[key] === value, `read-only reader sees preserved file-origin value: ${key}`);
  check(!Object.hasOwn(source, 'unrelated-origin-key'), 'unrelated old-origin key is excluded from snapshot');
  await window.loadURL(`hd2-slot://app/assets/origin-bootstrap.html`); await evaluate(window, migrationScript);
  check(await evaluate(window, 'location.origin') === 'hd2-slot://app', 'new bootstrap has the intended separate origin');
  if (phase === 'migrate') check(await evaluate(window, 'localStorage.length') === 0, 'new origin starts empty before the app runs');
  const copied = await evaluate(window, `HD2OriginStorage.copyMissing(localStorage, ${JSON.stringify(source)})`);
  if (phase === 'migrate') {
    check(copied.copied.length >= Object.keys(fixture).length, 'allowlisted data copied before normal application scripts');
    const destination = await evaluate(window, 'HD2OriginStorage.snapshot(localStorage)');
    for (const [key, value] of Object.entries(fixture)) check(destination[key] === value, `new-origin copy byte-matches: ${key}`);
  } else {
    check(copied.reason === 'already-migrated', 'separate-process restart skips completed copy');
    check(await evaluate(window, "localStorage.getItem('hd2_live_planets_cache_v1')") === null, 'intentionally cleared cache is not resurrected');
    check(await evaluate(window, "localStorage.getItem('hd2_items_view_mode')") === 'warbond', 'new-origin preference changes survive restart');
  }
  check(await evaluate(window, "localStorage.getItem('unrelated-origin-key')") === null, 'unrelated old data absent from new origin');
  await window.loadURL(ENTRY_URL); await evaluate(window, 'bootStateReady');
  check(await evaluate(window, "state.cards.some(card => card.id === 'legacy-origin-card')"), 'real renderer loads migrated fallback card on the new origin');
  check(await evaluate(window, 'state.items.primaries.length > 0 && state.items.stratagems.length > 0'), 'new-origin catalog loads offline');
  check(await evaluate(window, `(async () => {
    try { await fetch(${JSON.stringify(pathToFileURL(path.join(root, 'package.json')).href)}); return false; }
    catch { return true; }
  })()`), 'custom-origin renderer cannot fetch an arbitrary file URL');
  const status = await evaluate(window, `(async () => {
    const rows = [];
    for (const file of ['assets/item-catalog.json', 'assets/item-images.json', 'electron/main.js', '.test-data/private.json', 'package.json', 'assets/not-a-runtime-script.js']) {
      const response = await fetch(file); rows.push({ file, status: response.status });
    }
    rows.push({ file: 'POST', status: (await fetch('assets/item-catalog.json', { method: 'POST' })).status });
    return rows;
  })()`);
  for (const row of status) check(row.status === (row.file === 'POST' ? 405 : row.file.startsWith('assets/item-') ? 200 : 403), `network resource boundary: ${row.file}`);
  if (phase === 'migrate') {
    const images = await evaluate(window, `(async () => {
      const mapping = await (await fetch('assets/item-images.json')).json();
      const paths = new Set();
      const visit = value => { if (!value || typeof value !== 'object') return;
        if (typeof value.assetPath === 'string' && value.assetPath.startsWith('assets/')) paths.add(value.assetPath);
        Object.values(value).forEach(visit);
      }; visit(mapping);
      const failed = [];
      for (const source of paths) { const image = new Image(); image.src = source;
        try { await image.decode(); if (!image.naturalWidth) failed.push(source); } catch { failed.push(source); }
      }
      return { count: paths.size, failed };
    })()`);
    check(images.count >= 200 && images.failed.length === 0, 'all mapped equipment images decode through the local protocol');
    writeJson(path.join(runRoot, 'local-image-decode.json'), images);
    const result = await evaluate(window, `(${rendererSecurityPhase.toString()})()`);
    check(result.checks.length >= 43, 'expanded renderer/CSP suite works on the custom origin');
    writeJson(path.join(runRoot, 'custom-origin-security.json'), result);
    await evaluate(window, "localStorage.removeItem('hd2_live_planets_cache_v1'); localStorage.setItem('hd2_items_view_mode','warbond');");
  }
  await session.defaultSession.flushStorageData();
  // Revisit the script-free old-origin reader, not the old app bootstrap.
  await window.loadFile(bootstrap); await evaluate(window, migrationScript);
  assert.deepEqual(await evaluate(window, 'HD2OriginStorage.snapshot(localStorage)'), source);
  check(await evaluate(window, "localStorage.getItem('unrelated-origin-key')") === 'private fixture', 'old origin retains unrelated data unchanged');
  checks.push('old allowlisted data is byte-identical after migration/new-origin use');
  writeJson(path.join(runRoot, `${phase}.json`), { passed: true, processId: process.pid, checks });
  console.log(`PASS protocol ${phase}: ${checks.length} checks`); window.close();
})().catch(error => {
  const detail = error?.stack || error?.message || String(error);
  writeJson(path.join(runRoot, `${phase}-failure.json`), { passed: false, error: detail }); console.error(detail); app.quit();
});
