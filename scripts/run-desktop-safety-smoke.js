const fs = require('node:fs');
const path = require('node:path');
const { acquireDesktopTestLock, runElectronChild, writeJson } = require('./desktop-test-safety');
const root = path.resolve(__dirname, '..');
const runRoot = path.join(root, '.test-data', `desktop-safety-${Date.now()}`);
fs.mkdirSync(runRoot, { recursive: true });
const env = { ...process.env, HD2_ELECTRON_TEST_HARNESS: '1', HD2CSM_AUTOMATION: '1',
  HD2CSM_SAFETY_SMOKE_ROOT: runRoot, HD2CSM_USER_DATA_DIR: path.join(runRoot, 'user-data') };
delete env.ELECTRON_RUN_AS_NODE;

(async () => {
  const lock = acquireDesktopTestLock(runRoot);
  const reports = [];
  try {
    for (const phase of ['write', 'verify']) {
      console.log(`Safety ${phase}: exclusive software-rendered process. Evidence: ${runRoot}`);
      // No --disable-gpu here: verify the app's own default, not a test-only flag.
      await runElectronChild({ executable: require('electron'), args: [path.join(__dirname, 'electron-safety-smoke.js'), phase],
        cwd: root, env, lock, evidence: path.join(runRoot, phase), timeoutMs: 60000 });
      if (fs.existsSync(path.join(runRoot, `${phase}-failure.json`))) throw new Error(`Safety ${phase} failed; see phase report.`);
      const report = JSON.parse(fs.readFileSync(path.join(runRoot, `${phase}.json`), 'utf8'));
      const diagnostics = JSON.parse(fs.readFileSync(path.join(env.HD2CSM_USER_DATA_DIR, 'desktop-diagnostics.json'), 'utf8'));
      if (!report.passed || diagnostics.pid !== report.processId || !diagnostics.events.some(event => event.event === 'will-quit')) {
        throw new Error('Safety phase did not finish with matching graceful quit evidence.');
      }
      if (phase === 'verify' && !diagnostics.events.some(event => event.event === 'close-fullscreen-exited')) {
        throw new Error('Fullscreen close preparation was not observed.');
      }
      writeJson(path.join(runRoot, phase, 'shutdown.json'), diagnostics);
      reports.push(report);
    }
    writeJson(path.join(runRoot, 'report.json'), { passed: true, reports, gracefulExit: true, isolated: true });
    console.log(`PASS safety startup, restart, and fullscreen close. Evidence: ${runRoot}`);
  } finally { lock.release(); }
})().catch(error => {
  writeJson(path.join(runRoot, 'failure.json'), { passed: false, error: error.stack });
  console.error(error.stack, `\nSafety evidence: ${runRoot}`); process.exitCode = 1;
});
