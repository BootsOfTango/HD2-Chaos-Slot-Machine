const fs = require('node:fs');
const path = require('node:path');
const REQUIRED = Object.freeze(['artworkRights', 'licenseInventory', 'securityReview',
  'versionAndBranding', 'finalArtifactTests', 'finalArtifactScanAndSigning']);
function checkReadiness(manifest, exists = () => false) {
  return REQUIRED.flatMap(key => {
    const row = manifest?.checks?.[key];
    if (!row || row.status !== 'passed') return [`${key}: ${row?.reason || 'not reviewed'}`];
    if (typeof row.evidence !== 'string' || !/^docs\/[a-zA-Z0-9_/-]+\.md$/.test(row.evidence) ||
        row.evidence.split('/').includes('..') || !exists(row.evidence)) return [`${key}: missing checked-in evidence document`];
    return [];
  });
}
if (require.main === module) {
  try {
    const root = path.resolve(__dirname, '..');
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/public-release-readiness.json'), 'utf8'));
    const blockers = checkReadiness(manifest, file => fs.existsSync(path.join(root, file)));
    const identity = JSON.parse(fs.readFileSync(path.join(root, 'release-identity.json'), 'utf8'));
    if (identity.channel !== 'release') blockers.push('releaseChannel: source is still labeled local-preview, not a reviewed public release.');
    if (blockers.length) {
      console.error('PUBLIC RELEASE BLOCKED\n' + blockers.map(line => '- ' + line).join('\n'));
      process.exitCode = 1;
    } else console.log('Recorded public-release gates passed. Human evidence review and final downloaded-artifact verification are still required.');
  } catch (error) { console.error('PUBLIC RELEASE BLOCKED: unreadable readiness record:', error.message); process.exitCode = 1; }
}
module.exports = { REQUIRED, checkReadiness };
