const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

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

console.log(`Window smoke: real Electron window, isolated data at ${runRoot}`);
const result = spawnSync(require('electron'), [path.join(__dirname, 'electron-window-smoke.js')], {
  cwd: root, env, stdio: 'inherit', windowsHide: true, timeout: 180000
});
if (result.error || result.status !== 0) {
  console.error(result.error || `Window smoke exited with ${result.status}`);
  console.error(`Window smoke evidence: ${runRoot}`);
  process.exit(1);
}
const report = JSON.parse(fs.readFileSync(path.join(runRoot, 'report.json'), 'utf8'));
if (!report.passed) throw new Error('Window smoke did not produce a passing report.');
console.log(`PASS: ${report.checks.length} window checks. Evidence: ${runRoot}`);
console.log('DPI cases use Electron page zoom, not physical Windows display-scaling validation.');
