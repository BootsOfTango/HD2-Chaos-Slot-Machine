const fs = require('node:fs');
const path = require('node:path');
const { acquireDesktopTestLock, runElectronChild, writeJson } = require('./desktop-test-safety');

const root = path.resolve(__dirname, '..');
const runRoot = path.join(root, '.test-data', `electron-smoke-${Date.now()}`);
fs.mkdirSync(runRoot, { recursive: true });
const electron = require('electron');
const env = {
  ...process.env,
  HD2_ELECTRON_TEST_HARNESS: '1',
  HD2CSM_AUTOMATION: '1',
  HD2CSM_USER_DATA_DIR: path.join(runRoot, 'user-data'),
  HD2CSM_SMOKE_ROOT: runRoot
};
delete env.ELECTRON_RUN_AS_NODE;

(async () => {
  const lock = acquireDesktopTestLock(runRoot);
  try {
    const reports = [];
    for (const phase of ['write', 'verify']) {
      console.log(`Electron smoke: ${phase}, software rendering, exclusive desktop-test lock`);
      const phaseEvidence = path.join(runRoot, phase);
      await runElectronChild({ executable: electron, args: [path.join(__dirname, 'electron-smoke-phase.js'), phase, '--disable-gpu'],
        cwd: root, env, evidence: phaseEvidence, lock });
      const failureFile = path.join(runRoot, `${phase}-failure.json`);
      if (fs.existsSync(failureFile)) throw new Error(JSON.parse(fs.readFileSync(failureFile, 'utf8')).error || `${phase} failed; inspect ${failureFile}`);
      const report = JSON.parse(fs.readFileSync(path.join(runRoot, `${phase}.json`), 'utf8'));
      if (!report.passed || fs.existsSync(path.join(runRoot, `${phase}-failure.json`))) throw new Error(`${phase} did not pass.`);
      const shutdown = JSON.parse(fs.readFileSync(path.join(env.HD2CSM_USER_DATA_DIR, 'desktop-diagnostics.json'), 'utf8'));
      if (!shutdown.events.some(event => event.event === 'will-quit')) throw new Error('Missing graceful quit evidence.');
      writeJson(path.join(phaseEvidence, 'shutdown.json'), shutdown);
      reports.push(report);
    }
    writeJson(path.join(runRoot, 'report.json'), { passed: true, reports, gracefulExit: true });
    console.log(`PASS: Electron workflow and separate-process restart. Evidence: ${runRoot}`);
  } finally { lock.release(); }
})().catch(error => {
  writeJson(path.join(runRoot, 'failure.json'), { passed: false, error: error.stack });
  console.error(error.stack, `\nIsolated evidence: ${runRoot}`); process.exitCode = 1;
});
