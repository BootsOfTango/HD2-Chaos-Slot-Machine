const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
// Locked build-tool dependency; parse the workflow rather than just searching text.
const yaml = require('js-yaml');
const source = fs.readFileSync(path.join(__dirname, '../.github/workflows/windows-release.yml'), 'utf8');
const workflow = yaml.load(source);
const build = workflow.jobs['windows-build'];
const draft = workflow.jobs['draft-release'];

// Enumerate the directory: legacy/new workflows must not escape these checks.
function assertWorkflowPolicy(file, definition) {
  assert.deepEqual(definition.permissions, { contents: 'read' }, `${file}: default token rights`);
  assert.ok(!Object.hasOwn(definition.on, 'pull_request_target'), `${file}: privileged PR event`);
  assert.ok(!Object.hasOwn(definition.on, 'workflow_run'), `${file}: privileged chaining`);
  for (const [id, job] of Object.entries(definition.jobs)) {
    const context = `${file}/${id}`;
    assert.ok(Number.isInteger(job['timeout-minutes']) && job['timeout-minutes'] > 0 && job['timeout-minutes'] <= 60, `${context}: bounded timeout`);
    const draftWriter = file === 'windows-release.yml' && id === 'draft-release';
    if (job.permissions !== undefined) {
      assert.deepEqual(job.permissions, { contents: draftWriter ? 'write' : 'read' }, `${context}: token rights`);
    }
    // Reusable jobs need separate review rather than bypassing step-level checks.
    assert.equal(job.uses, undefined, `${context}: reusable job needs review`);
    assert.ok(Array.isArray(job.steps), `${context}: inspectable steps`);
    for (const step of job.steps) {
      if (step.uses) {
        assert.match(step.uses, /^actions\/[a-z-]+@[a-f0-9]{40}$/, `${context}: pinned reviewed action`);
        if (step.uses.startsWith('actions/checkout@')) {
          assert.equal(step.with?.['persist-credentials'], false, `${context}: no stored checkout token`);
        }
      }
      assert.doesNotMatch(step.run || '', /\$\{\{/, `${context}: expressions must enter shell through env`);
    }
  }
}

test('every checked-in workflow has bounded jobs, pinned actions and minimal token rights', () => {
  const directory = path.join(__dirname, '../.github/workflows');
  const files = fs.readdirSync(directory).filter(file => /\.ya?ml$/i.test(file));
  assert.ok(files.includes('blank.yml') && files.includes('validate.yml') && files.includes('windows-release.yml'));
  for (const file of files) assertWorkflowPolicy(file, yaml.load(fs.readFileSync(path.join(directory, file), 'utf8')));
});

test('workflow policy catches regressions in legacy or newly added workflows', () => {
  const original = yaml.load(fs.readFileSync(path.join(__dirname, '../.github/workflows/blank.yml'), 'utf8'));
  const regressions = [
    w => { delete w.permissions; },
    w => { w.permissions = 'write-all'; },
    w => { w.on.pull_request_target = {}; },
    w => { w.on.workflow_run = {}; },
    w => { delete w.jobs['item-catalog-maintenance']['timeout-minutes']; },
    w => { w.jobs['item-catalog-maintenance'].permissions = { contents: 'write' }; },
    w => { w.jobs['item-catalog-maintenance'].steps[0].uses = 'actions/checkout@v4'; },
    w => { delete w.jobs['item-catalog-maintenance'].steps[0].with; },
    w => { w.jobs['item-catalog-maintenance'].steps[0].with['persist-credentials'] = true; },
    w => { w.jobs['item-catalog-maintenance'].steps[1].run = 'echo ${{ github.event.pull_request.title }}'; },
    w => { w.jobs['item-catalog-maintenance'].uses = './unreviewed.yml'; },
  ];
  for (const mutate of regressions) {
    const changed = structuredClone(original); mutate(changed);
    assert.throws(() => assertWorkflowPolicy('new-workflow.yml', changed));
  }
});

test('Linux catalog validation is retained without running on publication', () => {
  const catalog = yaml.load(fs.readFileSync(path.join(__dirname, '../.github/workflows/blank.yml'), 'utf8'));
  assert.ok(!Object.hasOwn(catalog.on, 'release'));
  assert.ok(Object.hasOwn(catalog.on, 'pull_request'));
  assert.ok(catalog.jobs['item-catalog-maintenance'].steps.some(step => step.run === 'python scripts/validate_item_catalog.py'));
});

test('pull-request checks use an unprivileged event, no secrets, no persistent checkout token', () => {
  const raw = fs.readFileSync(path.join(__dirname, '../.github/workflows/validate.yml'), 'utf8');
  const validation = yaml.load(raw);
  assert.ok(Object.hasOwn(validation.on, 'pull_request'));
  assert.ok(!Object.hasOwn(validation.on, 'pull_request_target'));
  assert.deepEqual(validation.permissions, { contents: 'read' });
  assert.doesNotMatch(raw, /secrets\.|contents: write|id-token: write|workflow_run/);
  const job = validation.jobs['source-tests'];
  assert.ok(job['timeout-minutes']);
  for (const step of job.steps) if (step.uses) assert.match(step.uses, /^actions\/[a-z-]+@[a-f0-9]{40}$/);
  assert.equal(job.steps.find(step => step.uses?.startsWith('actions/checkout@')).with['persist-credentials'], false);
  assert.ok(job.steps.some(step => step.run === 'npm test'));
  assert.ok(job.steps.some(step => step.run === 'npm audit --audit-level=moderate'));
});

test('release build has only read permissions; draft writer never runs repository code', () => {
  assert.deepEqual(workflow.permissions, { contents: 'read' });
  assert.equal(build.permissions, undefined);
  assert.deepEqual(draft.permissions, { contents: 'write' });
  assert.equal(draft.needs, 'windows-build');
  assert.match(draft.if, /github.event_name == 'push'/);
  assert.ok(!draft.steps.some(step => /checkout|setup-node/.test(step.uses || '')));
  for (const step of draft.steps) {
    assert.doesNotMatch(step.run || '', /\bnpm\b|Invoke-Expression|Start-Process|\.\/scripts\//);
  }
  assert.equal(workflow.concurrency['cancel-in-progress'], false);
  assert.ok(build['timeout-minutes'] && draft['timeout-minutes']);
});

test('all actions are SHA-pinned and checkout does not persist credentials', () => {
  for (const job of Object.values(workflow.jobs)) {
    for (const step of job.steps) if (step.uses) assert.match(step.uses, /^actions\/[a-z-]+@[a-f0-9]{40}$/);
  }
  assert.equal(build.steps.find(step => step.uses?.startsWith('actions/checkout@')).with['persist-credentials'], false);
  assert.equal(build.steps.find(step => step.uses?.startsWith('actions/setup-node@')).with['package-manager-cache'], false);
});

test('readiness and tag validation precede npm install; signing secrets are step-scoped', () => {
  const gate = build.steps.findIndex(step => step.run === 'npm run verify:public-release');
  const install = build.steps.findIndex(step => step.run === 'npm ci');
  const metadata = build.steps.findIndex(step => step.id === 'metadata');
  assert.ok(gate >= 0 && metadata >= 0 && gate < install && metadata < install);
  assert.equal(workflow.env, undefined); assert.equal(build.env, undefined);
  for (const step of build.steps) {
    const secrets = JSON.stringify(step.env || {}).includes('secrets.');
    if (secrets) assert.ok(step.run === 'npm run build:win -- --publish never' || step.run === './scripts/verify_windows_signature.ps1 -Mode $env:ARTIFACT_SIGNING_MODE');
  }
  const sign = build.steps.find(step => step.run === 'npm run build:win -- --publish never');
  assert.equal(sign.env.WINDOWS_SIGNING_REQUIRED, "${{ steps.metadata.outputs.sign-build == 'true' }}");
  assert.equal(sign.env.WINDOWS_SIGNING_ENABLED, sign.env.WINDOWS_SIGNING_REQUIRED);
  const verify=build.steps.find(step => step.run === './scripts/verify_windows_signature.ps1 -Mode $env:ARTIFACT_SIGNING_MODE');
  assert.equal(verify.if,undefined,'Both signed and unsigned outputs are always checked');
  assert.equal(verify.env.ARTIFACT_SIGNING_MODE,'${{ steps.metadata.outputs.signing-mode }}');
  // GitHub-controlled values must enter shell scripts as environment variables.
  for (const job of Object.values(workflow.jobs)) for (const step of job.steps) assert.doesNotMatch(step.run || '', /\$\{\{/);
});

test('owner-approved unsigned policy does not bypass readiness or signature-status checks',()=>{
  const policy=require('../docs/release-distribution.json');
  assert.deepEqual(policy,{mode:'unsigned',decisionEvidence:'docs/DISTRIBUTION_DECISIONS.md'});
  const metadata=build.steps.find(s=>s.id==='metadata');
  assert.match(metadata.run,/Missing or unreviewed signing\/distribution policy/);
  assert.match(metadata.run,/\$policy\.mode -ceq 'signed'/);
  assert.match(build.steps.find(s=>s.run==='npm run verify:public-release').if,/refs\/tags\//);
  const script=fs.readFileSync(path.join(__dirname,'../scripts/verify_windows_signature.ps1'),'utf8');
  assert.match(script,/\$Mode='signed'/);
  assert.match(script,/\$signature.Status -ne 'NotSigned'/);
  assert.match(script,/Assert-ValidWindowsSignature -Path \$uninstaller/);
});

test('actual release metadata selects signing deliberately and rejects unknown policy', {skip:process.platform!=='win32'},()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hd2-signing-policy-'));
  try {
    fs.mkdirSync(path.join(dir,'docs'));
    fs.writeFileSync(path.join(dir,'release-identity.json'),JSON.stringify({publicVersion:'1.0.0'}));
    fs.writeFileSync(path.join(dir,'docs/DISTRIBUTION_DECISIONS.md'),'Synthetic decision fixture');
    fs.writeFileSync(path.join(dir,'metadata.ps1'),build.steps.find(s=>s.id==='metadata').run);
    const output=path.join(dir,'output.txt');
    const run=(mode,manual='false',ref='refs/tags/hd2-chaos-slot-machine-v1.0.0')=>{
      fs.writeFileSync(path.join(dir,'docs/release-distribution.json'),JSON.stringify({mode,decisionEvidence:'docs/DISTRIBUTION_DECISIONS.md'}));
      fs.writeFileSync(output,'');
      const result=spawnSync('pwsh',['-NoProfile','-NonInteractive','-File',path.join(dir,'metadata.ps1')],{cwd:dir,windowsHide:true,encoding:'utf8',env:{...process.env,BUILD_REF:ref,BUILD_REF_NAME:ref.split('/').at(-1),MANUAL_SIGN:manual,GITHUB_OUTPUT:output}});
      return {status:result.status,output:fs.readFileSync(output,'utf8'),error:result.stderr};
    };
    let r=run('unsigned');assert.equal(r.status,0,r.error);assert.match(r.output,/sign-build=false/);assert.match(r.output,/signing-mode=unsigned/);
    r=run('signed');assert.equal(r.status,0,r.error);assert.match(r.output,/signing-mode=signed/);
    r=run('unsigned','true','refs/heads/test');assert.equal(r.status,0,r.error);assert.match(r.output,/signing-mode=signed/);
    r=run('signed','false','refs/heads/test');assert.equal(r.status,0,r.error);assert.match(r.output,/signing-mode=unsigned/);
    assert.notEqual(run('anything').status,0);
    assert.notEqual(run('unsigned','false','refs/tags/hd2-chaos-slot-machine-v2.0.0').status,0);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

test('signature verification accepts NotSigned only for unsigned mode and fails closed otherwise', {skip:process.platform!=='win32'},()=>{
  const script=fs.readFileSync(path.join(__dirname,'../scripts/verify_windows_signature.ps1'),'utf8');
  const body=script.match(/function Assert-ValidWindowsSignature \{[\s\S]*?\r?\n\}/)?.[0];assert.ok(body);
  const run=(mode,status)=>spawnSync('pwsh',['-NoProfile','-NonInteractive','-Command',`$ErrorActionPreference='Stop'; $Mode='${mode}'; $expectedPublisher='fixture'; function Get-AuthenticodeSignature { [pscustomobject]@{Status='${status}';StatusMessage='fixture';SignerCertificate=$null;TimeStamperCertificate=$null} }; ${body}; Assert-ValidWindowsSignature -Path synthetic.exe`],{windowsHide:true,encoding:'utf8'});
  assert.equal(run('unsigned','NotSigned').status,0);
  for(const status of ['Valid','HashMismatch','UnknownError']) assert.notEqual(run('unsigned',status).status,0);
  assert.notEqual(run('signed','NotSigned').status,0);
});

test('artifact handoff uses an exact four-file list and same-run immutable artifact ID', () => {
  const upload = build.steps.find(step => step.id === 'upload');
  assert.equal(upload.with.path.trim().split('\n').length, 4);
  assert.ok(!upload.with.path.includes('*'));
  assert.equal(upload.with['include-hidden-files'], false);
  const download = draft.steps.find(step => step.uses?.startsWith('actions/download-artifact@'));
  assert.equal(download.with['artifact-ids'], '${{ needs.windows-build.outputs.artifact-id }}');
  assert.equal(download.with['run-id'], undefined);
  assert.equal(download.with.repository, undefined);
});

test('release creation is draft-only and never overwrites published assets', () => {
  const step = draft.steps.find(step => step.run?.includes('gh release create'));
  const commands = step.run.split('\n').filter(line => !line.trim().startsWith('#')).join('\n');
  assert.match(commands, /--verify-tag --draft/);
  assert.doesNotMatch(commands, /--clobber|gh release (edit|upload|delete)|--draft=false/);
  assert.match(commands, /\$LASTEXITCODE -ne 0/);
  assert.equal(step.env.GH_TOKEN, '${{ github.token }}');
});

test('actual PowerShell transfer validator rejects corrupt, missing, extra and wrong-tag fixtures', { skip: process.platform !== 'win32' }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hd2-release-validation-'));
  const assets = path.join(root, 'release-assets'); fs.mkdirSync(assets);
  const validator = draft.steps.find(step => step.name === 'Validate the transferred file set and checksums').run;
  const script = path.join(root, 'validate.ps1'); fs.writeFileSync(script, validator);
  const files = ['HD2-Chaos-Slot-Machine-v1.2.3-win-x64.zip', 'HD2-Chaos-Slot-Machine-Setup-v1.2.3-win-x64.exe'];
  const reset = () => {
    for (const file of fs.readdirSync(assets)) fs.rmSync(path.join(assets, file), { recursive: true });
    for (const file of files) {
      const bytes = Buffer.from('synthetic fixture, not an executable');
      fs.writeFileSync(path.join(assets, file), bytes);
      fs.writeFileSync(path.join(assets, file + '.sha256'), `${crypto.createHash('sha256').update(bytes).digest('hex')}  ${file}\n`);
    }
  };
  // Windows PowerShell must initialize its own module paths, not inherit pwsh's.
  const shellEnv = { ...process.env }; delete shellEnv.PSModulePath;
  const run = (tag = 'hd2-chaos-slot-machine-v1.2.3') => spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-File', script], {
    cwd: root, windowsHide: true, encoding: 'utf8', env: { ...shellEnv, RELEASE_VERSION: '1.2.3', RELEASE_TAG: tag }
  });
  try {
    reset(); let result = run(); assert.equal(result.status, 0, result.stderr);
    fs.appendFileSync(path.join(assets, files[0]), 'tampered'); assert.notEqual(run().status, 0);
    reset(); fs.unlinkSync(path.join(assets, files[0])); assert.notEqual(run().status, 0);
    reset(); fs.writeFileSync(path.join(assets, 'unexpected.txt'), 'extra'); assert.notEqual(run().status, 0);
    reset(); assert.notEqual(run('v9.9.9').status, 0);
    reset(); fs.writeFileSync(path.join(assets, files[0] + '.sha256'), 'wrong-name-and-hash'); assert.notEqual(run().status, 0);
    reset(); fs.unlinkSync(path.join(assets, files[0])); fs.mkdirSync(path.join(assets, files[0])); assert.notEqual(run().status, 0);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
