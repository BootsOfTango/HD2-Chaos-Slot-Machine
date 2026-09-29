const fs = require('node:fs');
const path = require('node:path');
const { acquireDesktopTestLock, runElectronChild, writeJson } = require('./desktop-test-safety');
const root = path.resolve(__dirname, '..'), runRoot = path.join(root, '.test-data', `origin-startup-${Date.now()}`);
fs.mkdirSync(runRoot, { recursive: true });
(async () => {
  const lock = acquireDesktopTestLock(runRoot), reports = [];
  try {
    for (const scenario of ['fallback','missing','damaged','future','native','native-damaged','destination','interrupted']) {
      for (const phase of ['seed','migrate','restart']) {
        const directory = path.join(runRoot, scenario), profile = path.join(directory, 'profile');
        const env = { ...process.env, HD2CSM_ORIGIN_TEST_ROOT: runRoot, HD2CSM_USER_DATA_DIR: profile, HD2_ELECTRON_TEST_HARNESS: '1', HD2CSM_AUTOMATION: '1' };
        delete env.ELECTRON_RUN_AS_NODE;
        await runElectronChild({ executable: require('electron'), args: [path.join(__dirname, 'electron-origin-startup-smoke.js'), scenario, phase], cwd: root, env, lock, evidence: path.join(directory, phase), timeoutMs: 60000 });
        if (fs.existsSync(path.join(directory, `${phase}-failure.json`))) throw Error(`Failed ${scenario}/${phase}; inspect ${directory}`);
        const report = JSON.parse(fs.readFileSync(path.join(directory, `${phase}.json`)));
        const shutdown = JSON.parse(fs.readFileSync(path.join(profile, 'desktop-diagnostics.json')));
        if (!report.passed || shutdown.pid !== report.processId || !shutdown.events.some(e => e.event === 'will-quit')) throw Error('Missing graceful shutdown');
        writeJson(path.join(directory, `${phase}-shutdown.json`), shutdown); reports.push({ scenario, phase, ...report });
      }
    }
    writeJson(path.join(runRoot, 'report.json'), { passed: true, reports }); console.log(`PASS startup migrations: ${runRoot}`);
  } finally { lock.release(); }
})().catch(error => { writeJson(path.join(runRoot, 'failure.json'), { error: error.stack }); console.error(error.stack); process.exitCode = 1; });
