const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { configureSoftwareRendering, createDiagnostics, installGracefulClose } = require('../electron/desktop-safety');
const { writeJson, writeDurable } = require('../electron/durable-file');
const { acquireDesktopTestLock, observeExit } = require('../scripts/desktop-test-safety');

function temporary(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hd2csm-safety-unit-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('software rendering is configured before readiness and cannot silently opt into hardware', () => {
  let disabled = 0;
  const graphics = configureSoftwareRendering({ isReady: () => false, disableHardwareAcceleration: () => disabled++ });
  assert.equal(disabled, 1);
  assert.deepEqual(graphics, { renderingMode: 'software', hardwareAccelerationDisabled: true });
  assert(Object.isFrozen(graphics));
  assert.throws(() => configureSoftwareRendering({ isReady: () => true }), /before Electron is ready/);
});

test('normal main entry configures software rendering before any profile or window work', () => {
  const source = fs.readFileSync(path.join(__dirname, '../electron/main.js'), 'utf8');
  const configure = source.indexOf('const graphics = configureSoftwareRendering(app)');
  assert(configure > 0 && configure < source.indexOf('app.setName('));
  assert(configure < source.indexOf('new BrowserWindow('));
  assert(!source.includes('enableHardwareAcceleration'));
});

test('diagnostics are bounded, preserve quit evidence, and contain no save payload', t => {
  const directory = temporary(t);
  const app = new EventEmitter();
  app.isReady = () => true;
  app.getGPUFeatureStatus = () => ({ gpu_compositing: 'disabled_software' });
  const diagnostics = createDiagnostics(app, directory, { renderingMode: 'software' });
  for (let n = 0; n < 50; n++) diagnostics.record('probe');
  app.emit('child-process-gone', {}, { type: 'GPU', reason: 'crashed', exitCode: 1, privateData: 'not recorded' });
  app.emit('will-quit');
  const data = JSON.parse(fs.readFileSync(diagnostics.file, 'utf8'));
  assert.equal(data.events.length, 40);
  assert.equal(data.events.at(-1).event, 'will-quit');
  assert.equal(data.gpuFeatureStatus.gpu_compositing, 'disabled_software');
  assert.equal(data.events.at(-2).privateData, undefined);
});

test('unwritable diagnostics do not prevent startup or graceful quit', () => {
  const app = new EventEmitter();
  app.isReady = () => false;
  assert.doesNotThrow(() => createDiagnostics(app, 'unused', {}, () => { throw new Error('test disk failure'); }));
  assert.doesNotThrow(() => app.emit('will-quit'));
});

function fakeWindow(fullscreen) {
  const window = new EventEmitter();
  window.webContents = new EventEmitter();
  window.fullscreen = fullscreen;
  window.destroyed = false;
  window.cancel = false;
  window.isFullScreen = () => window.fullscreen;
  window.isDestroyed = () => window.destroyed;
  window.setFullScreen = value => { window.fullscreen = value; };
  window.close = () => {
    let prevented = false;
    window.emit('close', { preventDefault: () => { prevented = true; } });
    if (prevented) return;
    if (window.cancel) { window.webContents.emit('will-prevent-unload'); return; }
    window.destroyed = true;
    window.emit('closed');
  };
  return window;
}

test('windowed close uses the normal close lifecycle', () => {
  const window = fakeWindow(false);
  const events = [];
  installGracefulClose(window, { record: event => events.push(event) });
  window.close();
  assert(window.destroyed);
  assert.deepEqual(events, ['window-close', 'window-closed']);
});

test('fullscreen close exits fullscreen and settles before normal close; repeated close cannot bypass wait', async () => {
  const window = fakeWindow(true);
  let finish;
  const events = [];
  installGracefulClose(window, { record: event => events.push(event), sleep: () => new Promise(resolve => { finish = resolve; }) });
  window.close();
  assert.equal(window.fullscreen, false);
  assert.equal(window.destroyed, false);
  window.close();
  assert.equal(window.destroyed, false);
  finish();
  await new Promise(resolve => setImmediate(resolve));
  assert(window.destroyed);
  assert.deepEqual(events, ['close-requested-from-fullscreen', 'close-fullscreen-exited', 'window-close', 'window-closed']);
});

test('page cancellation remains effective after fullscreen close preparation', async () => {
  const window = fakeWindow(true);
  window.cancel = true;
  const events = [];
  installGracefulClose(window, { record: event => events.push(event), sleep: async () => {} });
  window.close();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(window.destroyed, false);
  assert(events.includes('close-cancelled-by-page'));
  window.cancel = false;
  window.close();
  assert(window.destroyed);
});

test('failed fullscreen exit leaves the window open and permits a later retry', async () => {
  const window = fakeWindow(true);
  window.setFullScreen = () => {};
  const events = [];
  installGracefulClose(window, { record: event => events.push(event), timeoutMs: 0, sleep: async () => {} });
  window.close();
  await new Promise(resolve => setImmediate(resolve));
  assert(!window.destroyed);
  assert(events.includes('close-deferred'));
  window.setFullScreen = value => { window.fullscreen = value; };
  window.close();
  await new Promise(resolve => setImmediate(resolve));
  assert(window.destroyed);
});

test('durable reports replace whole contents without leaving temporary files', t => {
  const directory = temporary(t);
  const file = path.join(directory, 'report.json');
  writeJson(file, { old: true });
  writeJson(file, { passed: true });
  assert.deepEqual(JSON.parse(fs.readFileSync(file)), { passed: true });
  assert.deepEqual(fs.readdirSync(directory), ['report.json']);
  writeDurable(path.join(directory, 'image.bin'), Buffer.from([1, 2, 3]));
  assert.deepEqual([...fs.readFileSync(path.join(directory, 'image.bin'))], [1, 2, 3]);
});

test('desktop test lock excludes a second runner and releases after normal completion', t => {
  const lockPath = path.join(temporary(t), 'test.lock');
  const lock = acquireDesktopTestLock('test', { lockPath });
  assert.throws(() => acquireDesktopTestLock('second', { lockPath }), /Another desktop test/);
  assert(lock.release());
  assert(!fs.existsSync(lockPath));
});

test('living orphaned child prevents lock recovery even when runner died', t => {
  const lockPath = path.join(temporary(t), 'test.lock');
  writeJson(lockPath, { token: 'previous', ownerPid: 123, childPid: 456 });
  assert.throws(() => acquireDesktopTestLock('test', { lockPath, alive: pid => pid === 456 }), /Another desktop test/);
  assert(fs.existsSync(lockPath));
});

test('a lock is recovered only when both its owner and child are gone', t => {
  const lockPath = path.join(temporary(t), 'test.lock');
  writeJson(lockPath, { token: 'previous', ownerPid: 123, childPid: 456 });
  const lock = acquireDesktopTestLock('test', { lockPath, alive: () => false });
  assert.notEqual(JSON.parse(fs.readFileSync(lockPath)).token, 'previous');
  assert(lock.release());
});

test('a crash between spawn and child tracking cannot silently recover the lock', t => {
  const lockPath = path.join(temporary(t), 'test.lock');
  const lock = acquireDesktopTestLock('test', { lockPath, alive: () => false });
  lock.prepareLaunch();
  assert.equal(lock.release(), false);
  assert.throws(() => acquireDesktopTestLock('second', { lockPath, alive: () => false }), /Another desktop test/);
});

test('launch reservation refuses a second living child and clears after tracked completion', t => {
  const lockPath = path.join(temporary(t), 'test.lock');
  let living = true;
  const lock = acquireDesktopTestLock('test', { lockPath, alive: () => living });
  lock.prepareLaunch();
  lock.track({ pid: 456 });
  assert.throws(() => lock.prepareLaunch(), /previous one has ended/);
  living = false;
  assert.doesNotThrow(() => lock.prepareLaunch());
  lock.track({ pid: undefined }); // A failed spawn has no child process.
  assert(lock.release());
});

test('a separate Node runner also refuses the held lock without launching Electron', t => {
  const lockPath = path.join(temporary(t), 'test.lock');
  const lock = acquireDesktopTestLock('test', { lockPath });
  const child = require('node:child_process').spawnSync(process.execPath, ['-e',
    `const {acquireDesktopTestLock}=require(${JSON.stringify(path.resolve(__dirname, '../scripts/desktop-test-safety'))});
     try { acquireDesktopTestLock('other', {lockPath:${JSON.stringify(lockPath)}}); process.exitCode=2; }
     catch (error) { if (!error.message.includes('Another desktop test')) throw error; console.log('blocked'); }`
  ], { encoding: 'utf8', windowsHide: true });
  assert.equal(child.status, 0);
  assert.match(child.stdout, /blocked/);
  assert(lock.release());
});

test('damaged lock fails closed instead of starting another GUI', t => {
  const lockPath = path.join(temporary(t), 'test.lock');
  fs.writeFileSync(lockPath, '\0\0');
  assert.throws(() => acquireDesktopTestLock('test', { lockPath }), /unreadable/);
  assert.equal(fs.readFileSync(lockPath).length, 2);
});

test('runner does not release a lock while its tracked child lives', t => {
  const lockPath = path.join(temporary(t), 'test.lock');
  let living = true;
  const lock = acquireDesktopTestLock('test', { lockPath, alive: () => living });
  lock.track({ pid: 456 });
  assert.equal(lock.release(), false);
  living = false;
  assert.equal(lock.release(), true);
});

test('exit observation catches early exits and spawn errors', async () => {
  const child = new EventEmitter();
  const exit = observeExit(child);
  child.emit('close', 0, null);
  assert.deepEqual(await exit.wait(10), { code: 0, signal: null });
  const failed = new EventEmitter();
  const failedExit = observeExit(failed);
  failed.emit('error', new Error('spawn failed'));
  assert.equal((await failedExit.wait(10)).error, 'spawn failed');
});

test('uncertain shutdown keeps the lock for explicit review even after the runner/child end', t => {
  const lockPath = path.join(temporary(t), 'test.lock');
  const lock = acquireDesktopTestLock('test', { lockPath, alive: () => false });
  lock.retain('shutdown not confirmed');
  assert.equal(lock.release(), false);
  assert.throws(() => acquireDesktopTestLock('second', { lockPath, alive: () => false }), /Another desktop test/);
});

test('diagnostic API failure during quit never escapes the lifecycle listener', () => {
  const app = new EventEmitter();
  app.isReady = () => true;
  app.getGPUFeatureStatus = () => { throw new Error('GPU info unavailable'); };
  assert.doesNotThrow(() => createDiagnostics(app, 'unused', {}, () => {}));
  assert.doesNotThrow(() => app.emit('will-quit'));
});

test('exit timeout does not kill a child and a later graceful exit remains observable', async () => {
  const child = new EventEmitter();
  child.pid = 123;
  child.kill = () => { throw new Error('MUST NOT KILL'); };
  const exit = observeExit(child);
  await assert.rejects(exit.wait(10), /NOT force-killed/);
  child.emit('close', 0, null);
  assert.equal((await exit.wait(10)).code, 0);
});

test('all shipped desktop runners hold the shared lock and contain no force-exit fallback', () => {
  for (const name of ['run-electron-smoke.js', 'run-window-smoke.js', 'run-packaged-smoke.js', 'run-desktop-safety-smoke.js']) {
    const source = fs.readFileSync(path.join(__dirname, '../scripts', name), 'utf8');
    assert(source.includes('acquireDesktopTestLock('), name);
    assert(!/spawnSync|child\.kill\(/.test(source), name);
  }
  for (const name of ['electron-smoke-phase.js', 'electron-window-smoke.js']) {
    const source = fs.readFileSync(path.join(__dirname, '../scripts', name), 'utf8');
    assert(!/app\.exit\(|browserWindow\.destroy\(/.test(source), name);
    assert(source.includes('app.quit()'), name);
  }
});
