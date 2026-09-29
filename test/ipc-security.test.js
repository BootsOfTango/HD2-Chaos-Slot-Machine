const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const fs = require('node:fs');
const { createTrustedIpc, secureSession } = require('../electron/ipc-security');
function fixture(entryUrl) {
  const entryFile = path.resolve('index.html'), url = entryUrl || pathToFileURL(entryFile).href;
  const handlers = new Map(), owners = new Map();
  const trusted = createTrustedIpc({ entryFile, entryUrl, ipcMain: { handle: (c, h) => handlers.set(c, h) },
    BrowserWindow: { fromWebContents: sender => owners.get(sender) } });
  const sender = { isDestroyed: () => false, getURL: () => url, mainFrame: { url } };
  const window = { isDestroyed: () => false, webContents: sender };
  owners.set(sender, window); trusted.attach(window);
  const event = { sender, senderFrame: sender.mainFrame };
  let effects = 0;
  trusted.handle('storage:save', (_event, value) => { effects++; return value; });
  return { trusted, sender, window, event, url, owners, invoke: (...args) => handlers.get('storage:save')(...args), effects: () => effects };
}
test('trusted attached entry main frame can invoke a narrow operation', () => {
  const f = fixture();
  assert.equal(f.invoke(f.event, 'saved'), 'saved');
  f.sender.mainFrame.url += '#armory'; f.sender.getURL = () => f.url + '#armory';
  assert.equal(f.invoke(f.event, 'hash navigation'), 'hash navigation');
  assert.equal(f.effects(), 2);
});

test('custom entry allows main frame only and rejects former file origin and bootstrap', () => {
  const f = fixture('hd2-slot://app/index.html');
  assert.equal(f.invoke(f.event, 'ok'), 'ok');
  for (const url of [pathToFileURL(path.resolve('index.html')).href, 'hd2-slot://app/assets/origin-bootstrap.html', 'hd2-slot://other/index.html']) {
    f.sender.mainFrame.url = url; f.sender.getURL = () => url;
    assert.throws(() => f.invoke(f.event), /trusted application frame/);
  }
  assert.equal(f.effects(), 1);
});
test('foreign, missing and subframe IPC cannot reach storage side effects', () => {
  const f = fixture();
  for (const event of [null, {}, { sender: {} }, { sender: f.sender },
    { sender: f.sender, senderFrame: { url: f.url } }]) {
    assert.throws(() => f.invoke(event, 'bad'), /trusted application frame/);
  }
  const unregistered = { ...f.window }; f.owners.set(f.sender, unregistered);
  assert.throws(() => f.invoke(f.event), /trusted application frame/);
  assert.equal(f.effects(), 0);
});
test('navigated and spoofed entry URLs are rejected before handler execution', () => {
  const f = fixture();
  for (const url of ['https://example.com/index.html', 'about:blank', 'data:text/html,x',
    f.url + '?unexpected=1', f.url + '/other.html', f.url.replace('index.html', 'other.html')]) {
    f.sender.mainFrame.url = url;
    assert.throws(() => f.invoke(f.event), /trusted application frame/);
    f.sender.mainFrame.url = f.url; f.sender.getURL = () => url;
    assert.throws(() => f.invoke(f.event), /trusted application frame/);
    f.sender.getURL = () => f.url;
  }
  assert.equal(f.effects(), 0);
});
test('destroyed or detached sender fails closed', () => {
  for (const change of [f => { f.window.isDestroyed = () => true; },
    f => { f.sender.isDestroyed = () => true; }, f => { f.sender.getURL = () => { throw Error('detached'); }; }]) {
    const f = fixture(); change(f);
    assert.throws(() => f.invoke(f.event), /trusted application frame/);
    assert.equal(f.effects(), 0);
  }
});
test('unneeded permission checks, requests, device access and downloads are denied', () => {
  const session = new EventEmitter();
  let check, request, device, calls = 0;
  session.setPermissionCheckHandler = h => { check = h; calls++; };
  session.setPermissionRequestHandler = h => { request = h; calls++; };
  session.setDevicePermissionHandler = h => { device = h; calls++; };
  secureSession(session); secureSession(session);
  assert.equal(calls, 3);
  for (const permission of ['media', 'geolocation', 'notifications', 'clipboard-read', 'unknown']) {
    assert.equal(check(null, permission), false);
    let granted; request(null, permission, value => { granted = value; });
    assert.equal(granted, false);
  }
  assert.equal(device({ deviceType: 'usb' }), false);
  let prevented = 0; session.emit('will-download', { preventDefault: () => prevented++ });
  assert.equal(prevented, 1);
});
test('all application and window handlers are routed through sender validation', () => {
  const main = fs.readFileSync(path.join(__dirname, '../electron/main.js'), 'utf8');
  assert.doesNotMatch(main, /\bipcMain\.handle\(/);
  assert.match(main, /installWindowControls\(\{ ipcMain: trustedIpc/);
  for (const channel of ['storage:load', 'storage:save', 'storage:clearAll', 'storage:commitImport',
    'storage:importJson', 'storage:exportJson', 'resources:readJson', 'app:getInfo',
    'storage:openSaveFolder', 'links:openYouTubeChannel']) assert.ok(main.includes(`trustedIpc.handle('${channel}'`));
  assert.ok(main.indexOf('trustedIpc.attach(mainWindow)') < main.indexOf('mainWindow.loadURL('));
});
