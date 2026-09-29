const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/\r\n?/g, '\n');
const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
const directives = Object.fromEntries(policy.split(';').map(s => s.trim().split(/\s+/)).map(([key, ...values]) => [key, values]));
test('only the exact reviewed inline script hash is allowed, not arbitrary inline code or eval', () => {
  const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(m => !/\bsrc\s*=/.test(m[1]));
  assert.equal(inline.length, 1);
  const hash = crypto.createHash('sha256').update(inline[0][2]).digest('base64');
  assert.deepEqual(directives['script-src'], ["'self'", `'sha256-${hash}'`]);
  assert.deepEqual(directives['script-src-attr'], ["'none'"]);
  assert.ok(!directives['script-src'].includes("'unsafe-eval'"));
  assert.doesNotMatch(html, /\son(?:error|load|click|mouseover|focus)\s*=\s*["']/i);
});
test('remote images, frames, objects and workers are not permitted', () => {
  assert.deepEqual(directives['img-src'], ["'self'", 'data:', 'blob:']);
  for (const key of ['frame-src', 'object-src', 'worker-src', 'base-uri', 'form-action']) {
    assert.deepEqual(directives[key], ["'none'"]);
  }
  assert.deepEqual(directives['connect-src'], ["'self'", 'https://api.helldivers2.dev']);
});
test('external scripts are bundled and fallback handler loads before body images', () => {
  for (const match of html.matchAll(/<script src="([^"]+)"/g)) {
    assert.match(match[1], /^assets\/[a-z-]+\.js$/);
    assert.ok(fs.existsSync(path.join(root, match[1])));
  }
  assert.ok(html.indexOf('assets/image-fallbacks.js') < html.indexOf('<body'));
});
test('imported card IDs are escaped in every Results/modal template attribute', () => {
  assert.doesNotMatch(html, /\$\{card\.id\}/);
  assert.equal((html.match(/data-id="\$\{escapeHtml\(card\.id\)\}"/g) || []).length, 20);
});
test('generator validates current CSP and computes the same hash for CRLF and LF', () => {
  const result = spawnSync('python', ['-c', "import sys;sys.path.insert(0,'scripts');from renderer_csp import with_policy;from pathlib import Path;t=Path('index.html').read_text(encoding='utf-8');assert with_policy(t)==t;assert with_policy(t.replace('\\n','\\r\\n')).replace('\\r\\n','\\n')==t;assert with_policy(t.replace('let WIRED_ONCE = false','let WIRED_ONCE = true'))!=t.replace('let WIRED_ONCE = false','let WIRED_ONCE = true');print('PASS')"], { cwd: root, encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr);
});
test('Electron is pinned identically in package, lock and installed dependency', () => {
  const version = require('../package.json').devDependencies.electron;
  assert.equal(version, '44.4.5');
  const lock = require('../package-lock.json');
  assert.equal(lock.packages[''].devDependencies.electron, version);
  assert.equal(lock.packages['node_modules/electron'].version, version);
  assert.equal(require('electron/package.json').version, version);
});
test('catalog regeneration preserves mixed line endings and the script hash byte-for-byte', () => {
  const code = [
    "import sys,tempfile,json",
    "from pathlib import Path",
    "sys.path.insert(0,'scripts')",
    "import sync_item_catalog as sync",
    "original=Path('index.html').read_bytes()",
    "items=json.loads(Path('assets/item-catalog.json').read_text(encoding='utf-8'))['items']",
    "with tempfile.TemporaryDirectory(prefix='hd2-csp-test-') as directory:",
    "    sync.INDEX=Path(directory)/'index.html'",
    "    sync.INDEX.write_bytes(original)",
    "    sync.sync_index(items)",
    "    assert sync.INDEX.read_bytes()==original, 'Generator changed source bytes'",
    "    sync.sync_index(items)",
    "    assert sync.INDEX.read_bytes()==original, 'Generator was not idempotent'"
  ].join('\n');
  const result = spawnSync('python', ['-c', code], { cwd: root, encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr);
});
