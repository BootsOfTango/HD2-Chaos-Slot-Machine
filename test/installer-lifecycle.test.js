const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process'),yaml=require('js-yaml');
const root=path.resolve(__dirname,'..');
const workflowText=fs.readFileSync(path.join(root,'.github/workflows/windows-lifecycle.yml'),'utf8');
const workflow=yaml.load(workflowText);
const script=path.join(root,'scripts/test-windows-lifecycle.ps1');
const source=fs.readFileSync(script,'utf8');

test('lifecycle runs unprivileged, on separate standard Windows jobs, without release or signing access',()=>{
  assert.deepEqual(workflow.permissions,{contents:'read'});
  assert.deepEqual(Object.keys(workflow.on).sort(),['pull_request','workflow_dispatch']);
  assert.match(workflow.jobs.build.if,/head\.repo\.full_name == github\.repository/);
  assert.match(workflow.jobs.build.if,/codex\/release-readiness/);
  assert.equal(workflow.jobs.lifecycle.needs,'build');
  for(const job of Object.values(workflow.jobs)) assert.equal(job['runs-on'],'windows-2022');
  assert.doesNotMatch(workflowText,/secrets\.|contents: write|id-token: write|self-hosted|gh release|pull_request_target/);
  assert.ok(workflow.jobs.build.steps.some(s=>s.run?.includes('--publish never')));
  assert.equal(workflow.concurrency['cancel-in-progress'],false);
});

test('lifecycle handoff is immutable and exact; report upload cannot include a profile',()=>{
  const upload=workflow.jobs.build.steps.find(s=>s.id==='upload');
  const files=upload.with.path.trim().split('\n');
  assert.equal(files.length,5);assert.ok(files.every(f=>f.startsWith('out/lifecycle-upload/')&&!f.includes('*')));
  assert.equal(upload.with['retention-days'],3);
  const fresh=workflow.jobs.lifecycle.steps;
  assert.equal(fresh[0].with['artifact-ids'],'${{ needs.build.outputs.artifact-id }}');
  assert.equal(fresh[0].with['run-id'],undefined);
  assert.equal(fresh[0].with.repository,undefined);
  assert.ok(!fresh.some(s=>/checkout|setup-node/.test(s.uses||'')||/npm |node |python /.test(s.run||'')));
  assert.equal(fresh.at(-1).with.path,'${{ runner.temp }}/hd2-lifecycle-evidence/report.json');
  assert.equal(fresh.at(-1).if,'always()');
});

test('native lifecycle checks ordinary uninstall effects and save bytes without cleanup or forced killing',()=>{
  assert.match(source,/actual-uninstall-launcher/);
  assert.match(source,/Uninstall effects incomplete; no manual deletion or forced termination/);
  assert.match(source,/Reinstall preserved exact synthetic save bytes before launch/);
  assert.match(source,/CloseMainWindow\(\)/);
  assert.match(source,/No automatic scoring recalibration/);
  assert.doesNotMatch(source,/_\?=|--delete-app-data|Stop-Process|taskkill|\.Kill\(|Set-MpPreference|ExecutionPolicy/);
  const removes=source.split('\n').filter(line=>line.includes('Remove-Item'));
  assert.equal(removes.length,1);assert.match(removes[0],/Env:/);
  assert.ok(source.indexOf('requires explicitly approved disposable')<source.indexOf('New-Item'));
});

test('PowerShell refusal paths and validate-only cannot touch this PC installation', {skip:process.platform!=='win32'},()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'hd2-ci-guard-'));
  const sentinel=path.join(temp,'sentinel.txt');fs.writeFileSync(sentinel,'must stay');
  const env={...process.env,GITHUB_ACTIONS:'false',RUNNER_ENVIRONMENT:'local',RUNNER_OS:'Windows',ImageOS:'win22',GITHUB_RUN_ID:'123',GITHUB_REPOSITORY:'BootsOfTango/Helldivers-2-Roulette',RUNNER_TEMP:temp};
  const run=(overrides={},switches=['-AllowDisposableGitHubRunner','-ValidateOnly'],bundle=path.join(temp,'hd2-lifecycle-bundle'))=>spawnSync('pwsh',['-NoProfile','-NonInteractive','-File',script,'-Bundle',bundle,...switches],{env:{...env,...overrides},encoding:'utf8',windowsHide:true,timeout:15000});
  try {
    let r=run();assert.notEqual(r.status,0);assert.match(r.stderr,/REFUSED/);
    r=run({GITHUB_ACTIONS:'true',RUNNER_ENVIRONMENT:'self-hosted'});assert.notEqual(r.status,0);assert.match(r.stderr,/REFUSED/);
    const disposable={GITHUB_ACTIONS:'true',RUNNER_ENVIRONMENT:'github-hosted'};
    r=run(disposable,['-ValidateOnly']);assert.notEqual(r.status,0);
    r=run(disposable,undefined,temp);assert.notEqual(r.status,0);assert.match(r.stderr,/Unexpected runner bundle path/);
    r=run(disposable);assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/no mutation/);
    assert.deepEqual(fs.readdirSync(temp),['sentinel.txt']);assert.equal(fs.readFileSync(sentinel,'utf8'),'must stay');
  } finally { fs.rmSync(temp,{recursive:true,force:true}); }
});

test('bundle preparation uses the public synthetic fixture, not developer/player save folders',()=>{
  const preparer=fs.readFileSync(path.join(root,'scripts/prepare-lifecycle-bundle.js'),'utf8');
  assert.match(preparer,/test\/fixtures\/card-compatibility\.json/);
  assert.match(preparer,/ci-installer-lifecycle-card/);
  assert.doesNotMatch(preparer,/mission-owner-review|AppData|backup\.json|process\.env\.(APPDATA|LOCALAPPDATA)/);
  assert.match(preparer,/Inspected installer changed/);
  assert.match(preparer,/flag:'wx'/);
});
