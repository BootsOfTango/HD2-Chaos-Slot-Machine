const fs = require('node:fs');
const path = require('node:path');
const { acquireDesktopTestLock, runElectronChild, writeJson } = require('./desktop-test-safety');
const root = path.resolve(__dirname, '..'), runRoot = path.join(root, '.test-data', `renderer-security-${Date.now()}`);
fs.mkdirSync(runRoot, { recursive: true });
(async () => {
  const lock = acquireDesktopTestLock(runRoot), reports = [];
  try {
    for (const phase of ['desktop', 'browser']) {
      const userData = path.join(runRoot, phase, 'user-data');
      const env = { ...process.env, HD2CSM_RENDERER_SECURITY_ROOT: runRoot, HD2CSM_USER_DATA_DIR: userData,
        HD2_ELECTRON_TEST_HARNESS: '1', HD2CSM_AUTOMATION: '1' };
      delete env.ELECTRON_RUN_AS_NODE;
      await runElectronChild({ executable: require('electron'), args: [path.join(__dirname, 'electron-renderer-security-smoke.js'), phase], cwd: root, env, lock, evidence: path.join(runRoot, phase), timeoutMs: 60000 });
      if (fs.existsSync(path.join(runRoot, `${phase}-failure.json`))) throw Error(`Security ${phase} failed; see evidence`);
      const report = JSON.parse(fs.readFileSync(path.join(runRoot, `${phase}.json`)));
      const shutdown = JSON.parse(fs.readFileSync(path.join(userData, 'desktop-diagnostics.json')));
      if (!report.passed || shutdown.pid !== report.processId || !shutdown.events.some(e => e.event === 'will-quit')) throw Error('Missing matching graceful shutdown');
      writeJson(path.join(runRoot, `${phase}-shutdown.json`), shutdown); reports.push(report);
    }
    writeJson(path.join(runRoot, 'report.json'), { passed: true, reports, gracefulExit: true, isolated: true });
    console.log(`PASS renderer security. Evidence: ${runRoot}`);
  } finally { lock.release(); }
})().catch(error => { writeJson(path.join(runRoot, 'failure.json'), { passed: false, error: error.stack }); console.error(error.stack); process.exitCode = 1; });
