const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { app, BrowserWindow, session } = require('electron');
const { installHarnessQuit, writeJson } = require('./desktop-test-safety');
const { SCHEME, createLocalHandler } = require('../electron/local-protocol');
const m = require('../assets/origin-storage');
const { wrapData } = require('../electron/storage');
const root = path.resolve(__dirname, '..'), runRoot = process.env.HD2CSM_ORIGIN_TEST_ROOT;
const [scenario, phase] = process.argv.slice(2);
const cases = ['fallback','missing','damaged','future','native','native-damaged','destination','interrupted'];
if (!runRoot || !path.isAbsolute(runRoot) || !cases.includes(scenario) || !['seed','migrate','restart'].includes(phase) ||
  process.env.HD2_ELECTRON_TEST_HARNESS !== '1' || process.env.HD2CSM_USER_DATA_DIR !== path.join(runRoot, scenario, 'profile')) throw Error('Requires isolated origin startup runner');
const directory = process.env.HD2CSM_USER_DATA_DIR;
installHarnessQuit(app); app.setAppPath(root);
const { createMainWindow } = require('../electron/main');
const script = fs.readFileSync(path.join(root, 'assets/origin-storage.js'), 'utf8');
const p = 'hd2_chaos_slot_machine_v1', b = 'hd2_chaos_slot_machine_backup_v1';
const data = id => ({ cards: [{ id, seed: 'Migration test', difficulty: 6 }], settings: { rememberedPlayerName: id } });
const values = scenario === 'missing' ? {} : { [p]: JSON.stringify(data('old-origin')), hd2_items_view_mode: 'category' };
if (scenario === 'damaged') { values[p] = '{damaged'; values[b] = JSON.stringify(data('backup-origin')); }
if (scenario === 'future') values[p] = JSON.stringify({ saveFormatVersion: 999, data: data('future') });
const checks = [], check = (ok, label) => { assert.ok(ok, label); checks.push(label); };
(async () => {
  await app.whenReady();
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*','https://*/*'] }, (_d, cb) => cb({ cancel: true }));
  let window;
  const evaluate = code => window.webContents.executeJavaScript(`try { ${code} } catch (error) { throw new Error(error.name + ': ' + error.message); }`, true);
  if (phase === 'seed') {
    window = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false } });
    window.webContents.on('console-message', event => console.log('Origin probe renderer:', event.message));
    await window.loadFile(path.join(root, 'assets/origin-bootstrap.html'));
    await evaluate(`for (const [k,v] of Object.entries(${JSON.stringify(values)})) localStorage.setItem(k,v); localStorage.setItem('unrelated','retained');`);
    await evaluate(script); assert.deepEqual(await evaluate('HD2OriginStorage.snapshot(localStorage)'), values);
    checks.push('old-origin synthetic values seeded exactly');
    if (scenario === 'native') writeJson(path.join(directory, 'state.json'), wrapData(data('native-wins')));
    if (scenario === 'native-damaged') fs.writeFileSync(path.join(directory, 'state.json'), '{damaged native');
    if (['destination','interrupted'].includes(scenario)) {
      session.defaultSession.protocol.handle(SCHEME, createLocalHandler(root));
      await window.loadURL('hd2-slot://app/assets/origin-bootstrap.html');
      if (scenario === 'destination') await evaluate(`localStorage.setItem(${JSON.stringify(b)}, ${JSON.stringify(JSON.stringify(data('destination-wins')))});`);
      else {
        const source = { ...values, [b]: JSON.stringify(data('pending-backup')) };
        writeJson(path.join(directory, 'recovery/origin-copy-v1.json'), { version: 1, status: 'pending', source, before: {}, writes: m.makePlan(source, {}) });
        await evaluate(`localStorage.setItem(${JSON.stringify(p)}, ${JSON.stringify(source[p])});`);
        checks.push('durable journal plus partial copy simulates interrupted migration without killing a process');
      }
    }
  } else {
    window = createMainWindow({ show: false, fullscreen: false }); await window.startupReady;
    await evaluate('bootStateReady');
    check(window.webContents.getURL() === 'hd2-slot://app/index.html', 'normal startup uses restricted origin');
    check(await evaluate('!!chaosSlotMachine && document.body.classList.contains("desktop-app")'), 'normal desktop bridge and layout active');
    const blocked = ['future','native-damaged'].includes(scenario);
    check(await evaluate('saveHealth.status().blocked') === blocked, 'save health matches fixture protection');
    if (!blocked) {
      const expected = scenario === 'missing' ? null : scenario === 'native' ? 'native-wins' : scenario === 'destination' ? 'destination-wins' : scenario === 'damaged' ? 'backup-origin' : 'old-origin';
      check(await evaluate(`state.cards[0]?.id || null`) === expected, 'correct native/origin/backup precedence');
      await evaluate('saveState()');
      const saved = JSON.parse(fs.readFileSync(path.join(directory, 'state.json'))).data;
      check((saved.cards[0]?.id || null) === expected, 'validated normalized state persisted natively');
    } else {
      check(!fs.existsSync(path.join(directory, 'state.json')), 'protected load did not overwrite with defaults or old origin');
      check(await evaluate('saveState()') === false, 'automatic writes remain blocked');
    }
    if (scenario === 'interrupted') check(await evaluate(`localStorage.getItem(${JSON.stringify(b)})`) === JSON.stringify(data('pending-backup')), 'partial copy resumes remaining backup');
    if (phase === 'migrate') await evaluate("localStorage.setItem('hd2_items_view_mode','warbond');");
    else check(await evaluate("localStorage.getItem('hd2_items_view_mode')") === 'warbond', 'new-origin preference survives separate restart');
    check(JSON.parse(fs.readFileSync(path.join(directory, 'recovery/origin-copy-v1.json'))).status === 'complete', 'durable journal complete');
    await window.loadFile(path.join(root, 'assets/origin-bootstrap.html')); await evaluate(script);
    assert.deepEqual(await evaluate('HD2OriginStorage.snapshot(localStorage)'), values);
    check(await evaluate("localStorage.getItem('unrelated')") === 'retained', 'old origin unchanged including unrelated data');
  }
  session.defaultSession.flushStorageData();
  writeJson(path.join(runRoot, scenario, `${phase}.json`), { passed: true, processId: process.pid, checks });
  console.log(`PASS origin startup ${scenario}/${phase}: ${checks.length}`); window.close();
})().catch(error => { writeJson(path.join(runRoot, scenario, `${phase}-failure.json`), { error: error.stack }); console.error(error.stack); app.quit(); });
