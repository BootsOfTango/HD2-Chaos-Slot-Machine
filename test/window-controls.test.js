const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { CHANNELS, installWindowControls } = require('../electron/window-controls');

function fixture(initialFullscreen = false) {
  const handlers = new Map();
  const owners = new Map();
  const attach = installWindowControls({
    ipcMain: { handle: (channel, handler) => handlers.set(channel, handler) },
    BrowserWindow: { fromWebContents: sender => owners.get(sender) }
  });
  function createWindow(fullscreen = initialFullscreen) {
    const window = new EventEmitter();
    window.destroyed = false;
    window.fullscreen = fullscreen;
    window.transitions = [];
    window.isDestroyed = () => window.destroyed;
    window.isFullScreen = () => window.fullscreen;
    window.setFullScreen = value => {
      window.transitions.push(value);
      if (window.fullscreen === value) return;
      window.fullscreen = value;
      window.emit(value ? 'enter-full-screen' : 'leave-full-screen');
    };
    window.webContents = new EventEmitter();
    window.webContents.mainFrame = {};
    window.webContents.destroyed = false;
    window.webContents.isDestroyed = () => window.webContents.destroyed;
    window.messages = [];
    window.webContents.send = (...args) => window.messages.push(args);
    owners.set(window.webContents, window);
    return window;
  }
  const window = createWindow();
  attach(window);
  const event = { sender: window.webContents, senderFrame: window.webContents.mainFrame };
  return { window, event, handlers, attach, createWindow };
}

test('only three narrow window operations are registered and return actual fullscreen state', () => {
  const f = fixture(true);
  assert.deepEqual([...f.handlers.keys()], [CHANNELS.getState, CHANNELS.setFullscreen, CHANNELS.toggleFullscreen]);
  assert.deepEqual(f.handlers.get(CHANNELS.getState)(f.event), { isFullscreen: true });
  assert.deepEqual(f.handlers.get(CHANNELS.setFullscreen)(f.event, false), { isFullscreen: false });
  assert.deepEqual(f.handlers.get(CHANNELS.toggleFullscreen)(f.event), { isFullscreen: true });
  assert.deepEqual(f.window.transitions, [false, true]);
});

test('only an attached window owning the exact sender main frame can control its state', () => {
  const f = fixture();
  const stranger = f.createWindow();
  const denied = [
    { sender: f.window.webContents, senderFrame: {} },
    { sender: f.window.webContents, senderFrame: null },
    { sender: stranger.webContents, senderFrame: stranger.webContents.mainFrame },
    { sender: {}, senderFrame: f.window.webContents.mainFrame }
  ];
  for (const event of denied) {
    for (const handler of f.handlers.values()) assert.throws(() => handler(event, true), /owning application frame/);
  }
  f.window.destroyed = true;
  assert.throws(() => f.handlers.get(CHANNELS.toggleFullscreen)(f.event), /owning application frame/);
  assert.deepEqual(f.window.transitions, []);
});

test('nonboolean fullscreen arguments are rejected without changing window state', () => {
  const f = fixture();
  for (const value of [undefined, null, 0, 1, 'true', {}, []]) {
    assert.throws(() => f.handlers.get(CHANNELS.setFullscreen)(f.event, value), /must be a boolean/);
  }
  assert.deepEqual(f.window.transitions, []);
});

test('F11 toggles on keydown once, suppresses repeats, and leaves Escape to the renderer', () => {
  const f = fixture();
  let prevented = 0;
  const keyEvent = { preventDefault: () => { prevented += 1; } };
  const send = input => f.window.webContents.emit('before-input-event', keyEvent, input);
  send({ type: 'keyDown', key: 'F11', isAutoRepeat: false });
  assert.equal(f.window.fullscreen, true);
  send({ type: 'keyDown', key: 'F11', isAutoRepeat: true });
  assert.equal(f.window.fullscreen, true);
  send({ type: 'keyUp', key: 'F11', isAutoRepeat: false });
  send({ type: 'keyDown', key: 'Escape', isAutoRepeat: false });
  assert.equal(prevented, 2);
  assert.deepEqual(f.window.transitions, [true]);
  send({ type: 'keyDown', key: 'F11', isAutoRepeat: false });
  assert.equal(f.window.fullscreen, false);
  assert.equal(prevented, 3);
});

test('renderer receives authoritative state on initial load and native fullscreen transitions', () => {
  const f = fixture(true);
  f.attach(f.window);
  f.window.webContents.emit('did-finish-load');
  f.window.setFullScreen(false);
  f.window.setFullScreen(true);
  assert.deepEqual(f.window.messages, [
    [CHANNELS.stateChanged, { isFullscreen: true }],
    [CHANNELS.stateChanged, { isFullscreen: false }],
    [CHANNELS.stateChanged, { isFullscreen: true }]
  ]);
  f.window.webContents.destroyed = true;
  f.window.emit('leave-full-screen');
  assert.equal(f.window.messages.length, 3);
});

test('preload subscriptions expose only state, can unsubscribe, and invoke narrow channels', async () => {
  const exposed = new Map();
  const invoked = [];
  const ipc = new EventEmitter();
  ipc.invoke = (...args) => { invoked.push(args); return Promise.resolve({ isFullscreen: false }); };
  const source = fs.readFileSync(path.join(__dirname, '..', 'electron', 'preload.js'), 'utf8');
  vm.runInNewContext(source, {
    require: name => {
      assert.equal(name, 'electron');
      return { ipcRenderer: ipc, contextBridge: { exposeInMainWorld: (key, api) => exposed.set(key, api) } };
    },
    process: { argv: [] }
  });
  const api = exposed.get('chaosSlotMachine');
  await api.getWindowState();
  await api.setFullscreen(true);
  await api.toggleFullscreen();
  assert.deepEqual(invoked, [[CHANNELS.getState], [CHANNELS.setFullscreen, true], [CHANNELS.toggleFullscreen]]);
  const seen = [];
  const unsubscribe = api.onWindowStateChanged(state => seen.push(state));
  ipc.emit(CHANNELS.stateChanged, { sender: 'private Electron object' }, { isFullscreen: true, privateProperty: 'not exposed' });
  assert.equal(seen[0].isFullscreen, true);
  assert.deepEqual(Object.keys(seen[0]), ['isFullscreen']);
  unsubscribe();
  unsubscribe();
  ipc.emit(CHANNELS.stateChanged, {}, { isFullscreen: false });
  assert.equal(seen.length, 1);
  assert.equal(ipc.listenerCount(CHANNELS.stateChanged), 0);
  assert.throws(() => api.onWindowStateChanged(null), /must be a function/);
});
