const fs = require('node:fs');
const path = require('node:path');
const { acquireDesktopTestLock, runElectronChild, writeJson } = require('./desktop-test-safety');
const root = path.resolve(__dirname, '..');
const runRoot = path.join(root, '.test-data', `save-health-${Date.now()}`);
fs.mkdirSync(runRoot, { recursive: true });
(async () => {
  const lock = acquireDesktopTestLock(runRoot), reports = [];
  try {
    for (const phase of ['future', 'semantic', 'corrupt', 'backup-recovery', 'write-failure', 'pending-close']) {
      const userData = path.join(runRoot, phase, 'user-data');
      const env = { ...process.env, HD2_ELECTRON_TEST_HARNESS: '1', HD2CSM_AUTOMATION: '1', HD2CSM_USER_DATA_DIR: userData, HD2CSM_HEALTH_ROOT: runRoot };
      delete env.ELECTRON_RUN_AS_NODE;
      await runElectronChild({ executable: require('electron'), args: [path.join(__dirname, 'electron-save-health-smoke.js'), phase, '--disable-gpu'], cwd: root, env, lock, evidence: path.join(runRoot, phase), timeoutMs: 60000 });
      if (fs.existsSync(path.join(runRoot, `${phase}-failure.json`))) throw new Error(`Health phase ${phase} failed.`);
      const report = JSON.parse(fs.readFileSync(path.join(runRoot, `${phase}.json`)));
      const shutdown = JSON.parse(fs.readFileSync(path.join(userData, 'desktop-diagnostics.json')));
      if (!report.passed || report.processId !== shutdown.pid || !shutdown.events.some(e => e.event === 'will-quit')) throw new Error('Missing matching graceful shutdown.');
      if (report.electronVersion !== require('../package.json').devDependencies.electron) throw new Error('Save-health test ran on an unexpected Electron version.');
      writeJson(path.join(runRoot, phase, 'shutdown.json'), shutdown); reports.push(report);
    }
    writeJson(path.join(runRoot, 'report.json'), { passed: true, reports, isolated: true });
    console.log(`PASS save failure, protected load, retry and pending close. Evidence: ${runRoot}`);
  } finally { lock.release(); }
})().catch(error => { writeJson(path.join(runRoot, 'failure.json'), { error: error.stack }); console.error(error.stack); process.exitCode = 1; });
