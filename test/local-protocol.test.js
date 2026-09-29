const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { resolveRequest, createLocalHandler, ENTRY_URL, SCHEME_REGISTRATION, SCRIPT_FILES } = require('../electron/local-protocol');
const root = path.resolve(__dirname, '..');
test('local scheme opts into standard/secure fetch without CSP bypass or service workers', () => {
  assert.deepEqual(SCHEME_REGISTRATION, { scheme: 'hd2-slot', privileges: { standard: true, secure: true, supportFetchAPI: true } });
});
test('local resource policy allows renderer resources with explicit MIME types', () => {
  for (const resource of ['index.html', ...SCRIPT_FILES, 'assets/item-catalog.json', 'assets/item-images.json',
    'assets/factions/terminids.svg', 'assets/warbonds/helldivers-mobilize.png', 'cadet.png', 'assets/origin-bootstrap.html',
    'assets/galaxy-atlas-bundled.json']) {
    const value = resolveRequest('hd2-slot://app/' + resource);
    assert.equal(value.status, 200, resource); assert.ok(value.contentType);
  }
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const [, resource] of html.matchAll(/<script[^>]+src="([^"]+)"/g)) assert.equal(resolveRequest('hd2-slot://app/' + resource).status, 200, resource);
  for (const [, resource] of html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)) {
    const route = resolveRequest('hd2-slot://app/' + resource);
    assert.equal(route.status, 200, resource); assert.equal(route.contentType, 'text/css; charset=utf-8');
  }
});
test('router refuses methods, private files, unsupported assets, ambiguous paths and foreign hosts', () => {
  for (const suffix of ['../electron/main.js', '%2e%2e/electron/main.js', 'assets/../item-images.json',
    'assets/%2e%2e/item-images.json', 'assets%2ffactions/terminids.svg', 'assets/%252e%252e/a.png',
    'assets/..%5celectron/main.js', 'assets/a.png:stream', 'assets/a%00.png', 'assets//a.png',
    'assets/./a.png', 'assets/a.png.', 'electron/main.js', 'electron/preload.js', '.env',
    '.git/config', '.test-data/save.json', 'package.json', 'assets/new-script.js', 'assets/provenance.json',
    'index.html?test=1', 'index.html#unexpected', 'assets/bad%zz.png', 'assets/%EF%BC%8F../a.png']) {
    assert.notEqual(resolveRequest('hd2-slot://app/' + suffix).status, 200, suffix);
  }
  for (const url of ['file:///index.html', 'https://app/index.html', 'hd2-slot://other/index.html',
    'hd2-slot://app.evil/index.html', 'hd2-slot://user@app/index.html', 'hd2-slot://app:44/index.html',
    'hd2-slot://APP/index.html', 'hd2-slot://app\\index.html']) assert.notEqual(resolveRequest(url).status, 200, url);
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) assert.equal(resolveRequest(ENTRY_URL, method).status, 405);
});
test('handler serves source bytes, denies missing files and never returns private error paths', async () => {
  const handler = createLocalHandler(root);
  const response = await handler({ url: ENTRY_URL, method: 'GET' });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  const head = await handler({ url: ENTRY_URL, method: 'HEAD' });
  assert.equal(head.status, 200); assert.equal(await head.text(), '');
  for (const resource of ['assets/missing-image.png', 'electron/main.js']) {
    const result = await handler({ url: 'hd2-slot://app/' + resource, method: 'GET' });
    assert.ok([403, 404].includes(result.status)); assert.equal(await result.text(), 'Resource unavailable');
  }
});
test('handler rejects directory junctions pointing outside its resource root', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hd2-protocol-'));
  try {
    const appRoot = path.join(directory, 'app'), outside = path.join(directory, 'outside');
    fs.mkdirSync(appRoot); fs.mkdirSync(outside); fs.writeFileSync(path.join(outside, 'private.png'), 'private fixture');
    fs.symlinkSync(outside, path.join(appRoot, 'assets'), process.platform === 'win32' ? 'junction' : 'dir');
    const response = await createLocalHandler(appRoot)({ url: 'hd2-slot://app/assets/private.png', method: 'GET' });
    assert.equal(response.status, 403);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
