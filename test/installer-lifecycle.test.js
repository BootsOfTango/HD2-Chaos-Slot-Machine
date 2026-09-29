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
  const env={...process.env,GITHUB_ACTIONS:'false',RUNNER_ENVIRONMENT:'local',RUNNER_OS:'Windows',ImageOS:'win22',GITHUB_RUN_ID:'123',GITHUB_REPOSITORY:'BootsOfTango/HD2-Chaos-Slot-Machine',RUNNER_TEMP:temp};
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

test('normal window close re-queries cached handles and never substitutes forced shutdown', {skip:process.platform!=='win32'},()=>{
  const body=source.match(/function Request-NormalClose\(\$Process\) \{[\s\S]*?\n\}/)?.[0];
  assert.ok(body);assert.ok(body.indexOf('$Process.Refresh()')<body.indexOf('$Process.CloseMainWindow()'));
  const fake=`${body}\nfunction Start-Sleep {}\n$p=[pscustomobject]@{HasExited=$false;MainWindowHandle=[IntPtr]::Zero;Refreshes=0;Closes=0}\n$p | Add-Member ScriptMethod Refresh { $this.Refreshes++; $this.MainWindowHandle=[IntPtr]123 }\n$p | Add-Member ScriptMethod CloseMainWindow { $this.Closes++; return ($this.Refreshes -ge 2) }\nif (-not (Request-NormalClose $p) -or $p.Refreshes -ne 2 -or $p.Closes -ne 2) { throw 'Stale handle retry failed' }\n$p.HasExited=$true\nif (Request-NormalClose $p) { throw 'Already exited is not a requested close' }`;
  const r=spawnSync('pwsh',['-NoProfile','-NonInteractive','-Command',fake],{encoding:'utf8',windowsHide:true,timeout:10000});
  assert.equal(r.status,0,r.stderr);
});

test('runtime handoff needs only the verified package, not an Electron developer installation',()=>{
  const {runtimeInventory}=require('../scripts/prepare-lifecycle-bundle');
  const crypto=require('node:crypto'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hd2-ci-runtime-'));
  try {
    fs.mkdirSync(path.join(dir,'resources'));
    const files={'HD2 Chaos Slot Machine.exe':'synthetic exe','resources/app.asar':'synthetic asar','LICENSE.electron.txt':'license','LICENSES.chromium.html':'notices','README-FIRST.txt':'guide','NOTICE.txt':'notice','SECURITY.md':'security'};
    for(const [file,bytes] of Object.entries(files)) fs.writeFileSync(path.join(dir,file),bytes);
    const report={exeSha256:hash('synthetic exe'),asarSha256:hash('synthetic asar')};
    assert.equal(runtimeInventory(dir,report).length,7);
    assert.throws(()=>runtimeInventory(dir,{...report,exeSha256:'0'.repeat(64)}),/Inspected runtime changed/);
    fs.unlinkSync(path.join(dir,'NOTICE.txt'));
    assert.throws(()=>runtimeInventory(dir,report),/Missing verified runtime companion/);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

test('first-run dialog driver accepts only the exact app-owned reminder and sole OK button', {skip:process.platform!=='win32'},()=>{
  const native=source.match(/Add-Type -TypeDefinition @'\r?\n([\s\S]*?)\r?\n'@/)?.[1];
  assert.ok(native);
  const reminder=source.match(/\$taskReminder='([^']+)'/)?.[1];
  assert.ok(reminder);assert.ok(fs.readFileSync(path.join(root,'index.html'),'utf8').includes(`alert("${reminder}")`));
  // Compile the hosted helper and exercise only its pure selector. Never call
  // enumeration, acknowledgement or installer code on the developer's PC.
  const fake=`Add-Type -TypeDefinition @'\n${native}\n'@\n$d=[LifecycleDialogs+Control]::new(); $d.Process=123; $d.Class='#32770'; $d.Visible=$true; $d.Enabled=$true\n$t=[LifecycleDialogs+Control]::new(); $t.Process=123; $t.Class='Text'; $t.Text='expected'\n$b=[LifecycleDialogs+Control]::new(); $b.Process=123; $b.Class='Button'; $b.Text='OK'; $b.Id=0; $b.Enabled=$true; $b.Visible=$true\nif (-not [LifecycleDialogs]::IsReminder($d,@($t,$b),123,'expected')) {throw 'Valid reminder rejected'}\nif ([LifecycleDialogs]::IsReminder($d,@($t,$b),124,'expected')) {throw 'Wrong process accepted'}\nif ([LifecycleDialogs]::IsReminder($d,@($t,$b),123,'other')) {throw 'Unknown text accepted'}\nif ([LifecycleDialogs]::IsReminder($d,@($t,$b,$b),123,'expected')) {throw 'Multiple buttons accepted'}\n$b.Enabled=$false\nif ([LifecycleDialogs]::IsReminder($d,@($t,$b),123,'expected')) {throw 'Disabled button accepted'}\n$b.Enabled=$true; $b.Text='Cancel'\nif ([LifecycleDialogs]::IsReminder($d,@($t,$b),123,'expected')) {throw 'Wrong action accepted'}\n$b.Text='OK'; $d.Class='Other'\nif ([LifecycleDialogs]::IsReminder($d,@($t,$b),123,'expected')) {throw 'Wrong window accepted'}`;
  // Cold PowerShell/Add-Type startup competes with parallel source tests on
  // hosted Windows. Keep a bounded deadline without timing out safe compilation
  // at 15 seconds; this does not relax the selector or native lifecycle checks.
  const r=spawnSync('pwsh',['-NoProfile','-NonInteractive','-Command',fake],{encoding:'utf8',windowsHide:true,timeout:60000});
  assert.ifError(r.error);
  assert.equal(r.status,0,r.stderr);
  assert.ok(source.indexOf('if ($ValidateOnly)')<source.indexOf('Add-Type -TypeDefinition'));
  assert.ok(source.indexOf('Acknowledge-FirstRunReminder $taskApp')<source.indexOf("Confirm (Request-NormalClose $taskApp)"));
  assert.doesNotMatch(native,/EnableWindow|SendInput|keybd_event|TerminateProcess/);
  assert.match(native,/found && count==1 && PostMessage\(button,0x00F5/);
  assert.match(source,/Reminder revalidated before acknowledgement/);
  assert.match(source,/ClickObservedOk\(\$taskDialog.Handle,\$taskUi.Buttons\[0\].Handle,\$Process.Id\)/);
});
