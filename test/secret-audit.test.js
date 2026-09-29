const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
test('bounded secret scanner detects synthetic credentials without emitting their values', () => {
  const code = `
from scripts.audit_git_secrets import matching_rules, sensitive_path
assert 'github-classic-token' in matching_rules(('gh' + 'p_' + 'A' * 36).encode())
assert 'private-key-header' in matching_rules(('-----BEGIN ' + 'PRIVATE KEY-----').encode())
assert 'aws-access-key-id' in matching_rules(('AK' + 'IA' + 'A' * 16).encode())
assert 'npm-token' in matching_rules(('np' + 'm_' + 'A' * 36).encode())
assert 'github-fine-grained-token' in matching_rules(('github_' + 'pat_' + 'A' * 50).encode())
assert 'credential-bearing-http-url' in matching_rules(('https://' + 'fake:fixture@' + 'example.invalid').encode())
assert matching_rules(b'No credentials; https://example.invalid/public') == []
for name in ['.env', 'x/.env.local', 'a/private.pem', '.test-data/save.json', 'id_rsa', '.npmrc']:
    assert sensitive_path(name)
for name in ['.env.example', 'assets/item-catalog.json', 'docs/security.md']:
    assert not sensitive_path(name)
print('Synthetic secret/path checks passed; no values emitted')
`;
  const result = spawnSync('python', ['-c', code], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /checks passed/);
});
