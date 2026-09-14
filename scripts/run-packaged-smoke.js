// Run the real packaged EXE through its Chromium debugging protocol. This file
// is not included in the app. It never reads or modifies the user's normal save.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { rendererWritePhase, rendererVerifyPhase, rendererNetworkPhase } = require('./electron-smoke-phase');
const { rendererGearPhase, rendererGearVerify } = require('./gear-smoke-phase');
const { rendererSourceAuditPhase, rendererSourceAuditVerify } = require('./source-audit-smoke-phase');
const root = path.resolve(__dirname, '..');
const gearOnly = process.argv.includes('--gear');
const sourceOnly = process.argv.includes('--sources');
const executable = path.resolve(process.argv.slice(2).find(value => !value.startsWith('--')) || path.join(root, 'dist', 'win-unpacked', 'Helldivers 2 Chaos Slot Machine.exe'));
const runRoot = path.join(root, '.test-data', `${sourceOnly ? 'packaged-sources' : gearOnly ? 'packaged-gear' : 'packaged-smoke'}-${Date.now()}`);
const userData = path.join(runRoot, 'user-data');
fs.mkdirSync(runRoot, { recursive: true });
if (!fs.existsSync(executable)) throw new Error(`Packaged executable not found: ${executable}`);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject, timer } = pending.get(message.id);
      clearTimeout(timer);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled') {
      const text = message.params.args.map(arg => arg.value || arg.description || '').join(' ');
      if (/^(SMOKE|GEAR SMOKE|GEAR RESTART) PASS:/.test(text) || (process.argv.includes('--verbose') && /^SOURCE AUDIT (SMOKE|RESTART) PASS:/.test(text))) console.log(text);
    }
  });
  socket.addEventListener('close', () => {
    for (const entry of pending.values()) { clearTimeout(entry.timer); entry.reject(new Error('CDP connection closed')); }
    pending.clear();
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`CDP timeout: ${method}`)); }, 120000);
    pending.set(requestId, { resolve, reject, timer });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
  return { send, errors, close: () => socket.close(), evaluate: async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  } };
}

async function phase(name, expected) {
  const env = { ...process.env, HD2CSM_USER_DATA_DIR: userData, HD2CSM_AUTOMATION: '1' };
  if (name === 'normal-startup') delete env.HD2CSM_AUTOMATION;
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.HD2_ELECTRON_TEST_HARNESS;
  const args = ['--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', '--autoplay-policy=no-user-gesture-required'];
  // An app-local unreachable proxy blocks network from the very first request.
  if (name !== 'network') args.push('--proxy-server=http://127.0.0.1:9');
  const child = spawn(executable, args, { cwd: path.dirname(executable), env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk.toString(); });
  child.stderr.on('data', chunk => { output += chunk.toString(); });
  child.on('error', error => { output += error.stack; });
  let client;
  try {
    const deadline = Date.now() + 20000;
    let port;
    while (Date.now() < deadline && !port) {
      const match = output.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/);
      if (match) port = match[1];
      if (!port) await delay(100);
    }
    if (!port) throw new Error(`No packaged debug endpoint appeared. ${output}`);
    let target;
    while (Date.now() < deadline && !target) {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = targets.find(item => item.type === 'page' && item.url.startsWith('file:'));
      if (!target) await delay(100);
    }
    if (!target) throw new Error('Packaged renderer did not load its local HTML.');
    client = await connect(target.webSocketDebuggerUrl);
    await client.send('Runtime.enable');
    await client.send('Page.enable');
    await client.evaluate(`(async () => { while (typeof bootStateReady === 'undefined') await new Promise(r => setTimeout(r, 50)); await bootStateReady; })()`);
    const result = name === 'source-write'
      ? await client.evaluate(`(${rendererSourceAuditPhase.toString()})(${JSON.stringify(require('../assets/catalog-reviews/2026-09-14.json'))})`)
      : name === 'source-verify'
        ? await client.evaluate(`(${rendererSourceAuditVerify.toString()})(${JSON.stringify(expected)})`)
      : name === 'gear-write'
      ? await client.evaluate(`(${rendererGearPhase.toString()})()`)
      : name === 'gear-verify'
        ? await client.evaluate(`(${rendererGearVerify.toString()})(${JSON.stringify(expected)})`)
      : name === 'normal-startup'
      ? await client.evaluate(`(async () => {
          const checks = [];
          const assert = (ok, label) => { if (!ok) throw new Error(label); checks.push(label); };
          assert(!chaosSlotMachine.isTestHarness, 'packaged normal launch has automation mode disabled');
          assert((await chaosSlotMachine.getWindowState()).isFullscreen, 'packaged normal launch starts in true fullscreen');
          assert(document.querySelector('#appCanvas').getBoundingClientRect().width >= 1280, 'packaged desktop canvas is at least1280 CSS pixels');
          await chaosSlotMachine.setFullscreen(false);
          await new Promise(r => setTimeout(r, 300));
          assert(!(await chaosSlotMachine.getWindowState()).isFullscreen, 'packaged window can exit fullscreen');
          assert(document.querySelector('#btnToggleFullscreen').getAttribute('aria-pressed') === 'false', 'packaged toolbar reflects windowed state');
          document.querySelector('#btnToggleFullscreen').click();
          await new Promise(r => setTimeout(r, 300));
          assert((await chaosSlotMachine.getWindowState()).isFullscreen, 'packaged toolbar reenters fullscreen');
          assert(state.cards.length > 0, 'normal packaged launch retains isolated saved Results');
          return { checks };
        })()`)
      : name === 'write'
      ? await client.evaluate(`(${rendererWritePhase.toString()})({skipNativeDialogs:true})`)
      : name === 'verify'
        ? await client.evaluate(`(${rendererVerifyPhase.toString()})(${JSON.stringify(expected)})`)
        : await client.evaluate(`(${rendererNetworkPhase.toString()})()`);
    if (name === 'write') {
      // Only this isolated profile: the normal-startup check skips the one-time
      // informational alert, not the application's normal startup/window path.
      await client.evaluate(`localStorage.setItem(FIRST_BACKUP_WARNING_KEY, '1')`);
      for (const tab of ['spin', 'results', 'compare', 'items', 'rank']) {
        await client.evaluate(`switchTab('${tab}'); document.querySelector('#appViewport').scrollTo(0,0);`);
        await delay(350);
        const screenshot = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        fs.writeFileSync(path.join(runRoot, `${tab}.png`), Buffer.from(screenshot.data, 'base64'));
      }
      // Reproduce the user's reported images using real slot rendering, without
      // editing saved cards or the normal user's profile.
      await client.evaluate(`(async () => {
        switchTab('spin');
        const samples = [['slotPrimary','BR-14 Adjudicator','primary'], ['slotSidearm','CQC-19 Machete','sidearm'], ['slotThrowable','G-31 Arc','throwable'], ['slotBooster','Increased Reinforcement Budget','booster']];
        for (const [id,name,category] of samples) {
          setSlotVisualState(document.getElementById(id), name, category);
          const img = document.querySelector('#' + id + ' img');
          img.loading = 'eager';
          await img.decode();
          if (!img.naturalWidth || !img.src.includes('-wiki.')) throw new Error('Reported artwork is not loaded: ' + name);
        }
        document.getElementById('slotGrid').scrollIntoView({block:'center'});
      })()`);
      const artworkScreenshot = await client.send('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
      fs.writeFileSync(path.join(runRoot, 'reported-artwork.png'), Buffer.from(artworkScreenshot.data, 'base64'));
      result.checks.push('all four user-reported slot images render from bundled source artwork offline');
      await client.evaluate('renderSpin()');
    }
    if (name === 'normal-startup') {
      const screenshot = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      fs.writeFileSync(path.join(runRoot, 'normal-startup-fullscreen.png'), Buffer.from(screenshot.data, 'base64'));
    }
    if (name === 'gear-write') {
      await client.evaluate(`switchTab('items'); document.querySelector('#newGearPanel').open = true; document.querySelector('#newGearPanel').scrollIntoView({block:'start'});`);
      await delay(200);
      const screenshot = await client.send('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
      fs.writeFileSync(path.join(runRoot, 'new-gear.png'), Buffer.from(screenshot.data, 'base64'));
      await client.evaluate(`document.querySelector('#appViewport').scrollBy(0,400)`);
      const lower = await client.send('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
      fs.writeFileSync(path.join(runRoot, 'new-gear-controls.png'), Buffer.from(lower.data, 'base64'));
    }
    if (name === 'source-write') {
      await client.evaluate(`switchTab('items'); document.querySelector('#catalogAuditPanel').open = true; document.querySelector('#catalogAuditPanel').scrollIntoView({block:'center'});`);
      await delay(150);
      const screenshot = await client.send('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
      fs.writeFileSync(path.join(runRoot, 'source-audit.png'), Buffer.from(screenshot.data, 'base64'));
      await client.evaluate(`if(document.querySelector('#manualPoolBlock').hidden) document.querySelector('[data-target="manualPoolBlock"]').click();`);
      for (const source of ["Freedom's Flame", 'Chemical Agents', 'Urban Legends']) {
        await client.evaluate(`(async () => {
          localStorage.setItem(ITEMS_VIEW_MODE_KEY,'warbond'); localStorage.setItem(ITEMS_TYPE_FILTER_KEY,'all');
          document.querySelector('#itemSearch').value=${JSON.stringify(source)}; renderItems();
          const group = [...document.querySelectorAll('#listItemsByWarbond .warbondGroup')].find(group => group.querySelector('.warbondHeader')?.textContent.trim() === ${JSON.stringify(source)});
          if (!group || !group.getBoundingClientRect().height) throw new Error('Source group is not visible: ' + ${JSON.stringify(source)});
          group.scrollIntoView({block:'start'}); document.querySelector('#appViewport').scrollBy(0,-150);
          const cover = [...group.querySelectorAll('img')].find(img => img.src.includes('/warbonds/official/'));
          if(!cover) throw new Error('Missing source group cover');
          cover.loading='eager'; await cover.decode();
        })()`);
        await delay(200);
        const cover = await client.send('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
        fs.writeFileSync(path.join(runRoot, source.replace(/[^a-z0-9]+/gi,'-') + '.png'), Buffer.from(cover.data,'base64'));
      }
    }
    if (client.errors.length) throw new Error(client.errors.join('\n'));
    fs.writeFileSync(path.join(runRoot, `${name}.json`), JSON.stringify({ passed: true, executable, processId: child.pid, userData, result }, null, 2));
    console.log(`PASS packaged ${name}: ${result.checks.length} checks`);
    return result;
  } finally {
    if (client) {
      client.evaluate('window.close()').catch(() => {});
      await delay(500);
      client.close();
    }
    if (child.exitCode === null) child.kill();
    await delay(500);
    fs.writeFileSync(path.join(runRoot, `${name}-process.log`), output);
  }
}

(async () => {
  if (gearOnly || sourceOnly) {
    const written = await phase(sourceOnly ? 'source-write' : 'gear-write');
    const verified = await phase(sourceOnly ? 'source-verify' : 'gear-verify', written);
    // Additional file-level backend coverage, without a native dialog or any
    // personal profile. Use the exact payload emitted by the packaged renderer.
    const assert = require('node:assert/strict');
    const storage = require('../electron/storage');
    const exportPath = path.join(runRoot, sourceOnly ? 'source-export.json' : 'gear-export.json');
    storage.exportStateFile(exportPath, written.exportData);
    const envelope = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    assert.equal(envelope.applicationVersion, require('../package.json').version);
    assert.deepEqual(envelope.data, written.exportData);
    const importedProfile = path.join(runRoot, 'file-import-profile');
    storage.importStateFile(importedProfile, exportPath);
    assert.deepEqual(storage.loadStateFile(importedProfile).data, written.exportData);
    const fileRoundtrip = {passed:true, checks:3, exportPath, importedProfile, coverage:'Real storage backend export/import/load with packaged-renderer payload; native file picker not exercised.'};
    fs.writeFileSync(path.join(runRoot, 'report.json'), JSON.stringify({passed:true,executable,userData,written,verified,fileRoundtrip},null,2));
    console.log(`PASS packaged ${sourceOnly ? 'source-audit' : 'gear'} upgrade and restart. Evidence: ${runRoot}`);
    return;
  }
  const written = await phase('write');
  const verified = await phase('verify', written);
  const normalStartup = await phase('normal-startup');
  const network = await phase('network');
  fs.writeFileSync(path.join(runRoot, 'report.json'), JSON.stringify({ passed: true, executable, userData, written, verified, normalStartup, network, nativeDialogs: 'Storage IPC used real development handlers with stubbed file-picker responses. Packaged native file-picker interaction excluded; informational first-save alert pre-acknowledged only in isolated normal-startup profile.' }, null, 2));
  console.log(`PASS packaged application. Evidence: ${runRoot}`);
})().catch(error => {
  fs.writeFileSync(path.join(runRoot, 'failure.json'), JSON.stringify({ passed: false, executable, error: error.stack }, null, 2));
  console.error(error.stack);
  console.error(`Packaged evidence: ${runRoot}`);
  process.exitCode = 1;
});
