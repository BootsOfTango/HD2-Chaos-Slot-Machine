const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

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

for (const phase of ['write', 'verify']) {
  console.log(`Electron smoke: ${phase} in an isolated process`);
  const result = spawnSync(electron, [path.join(__dirname, 'electron-smoke-phase.js'), phase], {
    cwd: root, env, stdio: 'inherit', timeout: 120000, windowsHide: true
  });
  if (result.error || result.status !== 0) {
    console.error(result.error || `Electron ${phase} exited with ${result.status}`);
    console.error(`Isolated test evidence: ${runRoot}`);
    process.exit(1);
  }
}
const reports = ['write', 'verify'].map(phase => JSON.parse(fs.readFileSync(path.join(runRoot, `${phase}.json`), 'utf8')));
fs.writeFileSync(path.join(runRoot, 'report.json'), JSON.stringify({ passed: true, reports }, null, 2));
console.log(`PASS: Electron workflow and separate-process restart. Evidence: ${runRoot}`);
