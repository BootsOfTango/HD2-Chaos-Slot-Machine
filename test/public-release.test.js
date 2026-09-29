const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { REQUIRED, checkReadiness } = require('../scripts/check-public-release');
const complete = () => ({ checks: Object.fromEntries(REQUIRED.map(key => [key, { status: 'passed', evidence: 'docs/review.md' }])) });

test('informed artwork-risk decision is version-specific, explicit, and never a technical waiver',()=>{
  const manifest=complete();
  manifest.checks.artworkRights={status:'owner-accepted-risk',permissionEstablished:false,ownerApprovedVersion:'1.1.1',evidence:'docs/DISTRIBUTION_DECISIONS.md'};
  assert.deepEqual(checkReadiness(manifest,()=>true,'1.1.1'),[]);
  for(const version of [undefined,'1.1.2',''])assert.equal(checkReadiness(manifest,()=>true,version).length,1);
  assert.equal(checkReadiness(manifest,()=>false,'1.1.1').length,REQUIRED.length);
  manifest.checks.artworkRights.permissionEstablished=true;
  assert.equal(checkReadiness(manifest,()=>true,'1.1.1').length,1);
  manifest.checks.artworkRights.permissionEstablished=false;
  manifest.checks.securityReview={...manifest.checks.artworkRights};
  assert.equal(checkReadiness(manifest,()=>true,'1.1.1').length,1);
});
test('public release fails closed for absent, blocked or incomplete evidence', () => {
  assert.equal(checkReadiness(null).length, REQUIRED.length);
  for (const key of REQUIRED) {
    const manifest = complete(); delete manifest.checks[key];
    assert.equal(checkReadiness(manifest, () => true).length, 1);
    manifest.checks[key] = { status: 'blocked', evidence: 'docs/review.md' };
    assert.equal(checkReadiness(manifest, () => true).length, 1);
    manifest.checks[key] = { status: 'passed', evidence: '' };
    assert.equal(checkReadiness(manifest, () => true).length, 1);
  }
});
test('release evidence must name an existing repository document, not a private profile or URL', () => {
  for (const evidence of ['C:/private.md', '../review.md', '.test-data/review.md', 'docs/../private.md', 'https://example.com/review.md']) {
    const manifest = complete(); manifest.checks.artworkRights.evidence = evidence;
    assert.equal(checkReadiness(manifest, () => true).length, 1);
  }
  assert.equal(checkReadiness(complete(), () => false).length, REQUIRED.length);
  assert.deepEqual(checkReadiness(complete(), () => true), []);
});
test('tag publication executes the readiness gate before build and upload', () => {
  const workflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/windows-release.yml'), 'utf8');
  assert.ok(workflow.indexOf('npm run verify:public-release') < workflow.indexOf('run: npm run build:win'));
  assert.match(workflow, /npm audit --audit-level=moderate/);
});
test('the project preserves Apache and packages separate attribution/security notices', () => {
  const license = fs.readFileSync(path.join(__dirname, '../LICENSE.txt'), 'utf8');
  assert.match(license, /Apache License/); assert.match(license, /irrevocable/);
  const config = require('../electron-builder.config');
  for (const name of ['LICENSE.txt', 'NOTICE.txt', 'THIRD_PARTY_NOTICES.md', 'SECURITY.md']) {
    assert.ok(config.extraFiles.some(entry => entry.from === name && entry.to === name));
  }
});
