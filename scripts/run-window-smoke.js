const fs = require('node:fs');
const path = require('node:path');
const { acquireDesktopTestLock, runElectronChild, writeJson } = require('./desktop-test-safety');

const root = path.resolve(__dirname, '..');
const runRoot = path.join(root, '.test-data', `window-smoke-${Date.now()}`);
fs.mkdirSync(runRoot, { recursive: true });
const env = {
  ...process.env,
  HD2_ELECTRON_TEST_HARNESS: '1',
  HD2CSM_AUTOMATION: '1',
  HD2CSM_USER_DATA_DIR: path.join(runRoot, 'user-data'),
  HD2CSM_WINDOW_SMOKE_ROOT: runRoot
};
delete env.ELECTRON_RUN_AS_NODE;

(async () => {
  const lock = acquireDesktopTestLock(runRoot);
  try {
    console.log(`Window smoke: software rendering, exclusive desktop-test lock. Evidence: ${runRoot}`);
    await runElectronChild({ executable: require('electron'), args: [path.join(__dirname, 'electron-window-smoke.js'), '--disable-gpu'],
      cwd: root, env, evidence: runRoot, lock, timeoutMs: 240000 });
    const report = JSON.parse(fs.readFileSync(path.join(runRoot, 'report.json'), 'utf8'));
    if (!report.passed) throw new Error('Window smoke did not produce a passing report.');
    const shutdown = JSON.parse(fs.readFileSync(path.join(env.HD2CSM_USER_DATA_DIR, 'desktop-diagnostics.json'), 'utf8'));
    if (!shutdown.events.some(event => event.event === 'will-quit')) throw new Error('Missing graceful quit evidence.');
    writeJson(path.join(runRoot, 'shutdown.json'), shutdown);
    writeJson(path.join(runRoot, 'runner-result.json'), { passed: true, gracefulExit: true, checks: report.checks.length });
    console.log(`PASS: ${report.checks.length} window checks. Evidence: ${runRoot}`);
    console.log('DPI cases use Electron page zoom, not physical Windows display-scaling validation.');
  } finally { lock.release(); }
})().catch(error => {
  writeJson(path.join(runRoot, 'failure.json'), { passed: false, error: error.stack });
  console.error(error.stack, `\nWindow evidence: ${runRoot}`); process.exitCode = 1;
});
