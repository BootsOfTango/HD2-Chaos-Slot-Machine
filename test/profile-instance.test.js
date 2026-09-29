const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const { acquireProfileInstance } = require('../electron/profile-instance');
test('duplicate launch quits normally without enumerating or creating a window', () => {
  let quit = 0; const app = new EventEmitter(); app.requestSingleInstanceLock = () => false; app.quit = () => quit++;
  assert.equal(acquireProfileInstance(app, { getAllWindows: () => { throw new Error('must not inspect windows'); } }), false);
  assert.equal(quit, 1); assert.equal(app.listenerCount('second-instance'), 0);
});
test('owner restores and focuses the existing window without changing fullscreen', () => {
  const calls = []; const app = new EventEmitter(); app.requestSingleInstanceLock = () => true;
  const window = { isDestroyed: () => false, isMinimized: () => true, restore: () => calls.push('restore'), show: () => calls.push('show'), focus: () => calls.push('focus') };
  assert(acquireProfileInstance(app, { getAllWindows: () => [window] }));
  app.emit('second-instance'); assert.deepEqual(calls, ['restore', 'show', 'focus']);
});
test('second-instance during startup or after window destruction is harmless', () => {
  const app = new EventEmitter(); app.requestSingleInstanceLock = () => true;
  acquireProfileInstance(app, { getAllWindows: () => [{ isDestroyed: () => true }] });
  assert.doesNotThrow(() => app.emit('second-instance'));
});
test('main takes the profile lock before diagnostic writes and guards migration and windows', () => {
  const source = fs.readFileSync(path.join(__dirname, '../electron/main.js'), 'utf8');
  assert(source.indexOf("app.setPath('userData'") < source.indexOf('const ownsProfile ='));
  assert(source.includes('ownsProfile ? createDiagnostics'));
  assert(source.includes('if (ownsProfile && !profile.isolated)'));
  assert(source.includes('if (!IS_TEST_HARNESS && ownsProfile)'));
  assert(source.includes("if (!ownsProfile) throw new Error('Another app instance"));
});
