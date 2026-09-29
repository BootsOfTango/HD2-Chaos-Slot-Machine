const path = require('node:path');
const { writeJson } = require('./durable-file');

function configureSoftwareRendering(app) {
  if (app.isReady()) throw new Error('Software rendering must be configured before Electron is ready.');
  app.disableHardwareAcceleration();
  return Object.freeze({ renderingMode: 'software', hardwareAccelerationDisabled: true });
}

function createDiagnostics(app, directory, graphics, persist = writeJson) {
  const file = path.join(directory, 'desktop-diagnostics.json');
  const snapshot = { pid: process.pid, startedAt: new Date().toISOString(), ...graphics, events: [] };
  function record(event, detail = {}) {
    snapshot.events.push({ event, at: new Date().toISOString(), ...detail });
    snapshot.events = snapshot.events.slice(-40);
    try {
      if (app.isReady()) snapshot.gpuFeatureStatus = app.getGPUFeatureStatus();
      persist(file, snapshot);
    }
    catch (error) { console.warn('[desktop-safety] Diagnostic write failed:', error.message); }
  }
  record('startup-configured');
  app.on('gpu-info-update', () => record('gpu-info-update'));
  app.on('child-process-gone', (_event, details) => record('child-process-gone', {
    type: details.type, reason: details.reason, exitCode: details.exitCode
  }));
  app.on('before-quit', () => record('before-quit'));
  app.on('will-quit', () => record('will-quit'));
  return { record, file };
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// A normal window.close() still runs Electron's close/beforeunload handlers.
// Never destroy the window or force process exit when a close is cancelled.
function installGracefulClose(window, { record = () => {}, settleMs = 250, timeoutMs = 10000, sleep = delay } = {}) {
  let preparing = false;
  let allowClose = false;
  window.on('closed', () => record('window-closed'));
  window.webContents.on('will-prevent-unload', () => {
    allowClose = false;
    preparing = false;
    record('close-cancelled-by-page');
  });
  window.on('close', event => {
    if (preparing) { event.preventDefault(); return; }
    if (allowClose || !window.isFullScreen()) {
      record('window-close');
      return;
    }
    event.preventDefault();
    preparing = true;
    record('close-requested-from-fullscreen');
    void (async () => {
      try {
        window.setFullScreen(false);
        const deadline = Date.now() + timeoutMs;
        while (!window.isDestroyed() && window.isFullScreen()) {
          if (Date.now() >= deadline) throw new Error('Fullscreen exit timed out; window left open.');
          await sleep(50);
        }
        if (window.isDestroyed()) return;
        record('close-fullscreen-exited');
        await sleep(settleMs);
        if (window.isDestroyed()) return;
        allowClose = true;
        preparing = false;
        window.close();
      } catch (error) {
        preparing = false;
        record('close-deferred', { error: error.message });
        console.warn('[desktop-safety]', error.message);
      }
    })();
  });
}

module.exports = { configureSoftwareRendering, createDiagnostics, installGracefulClose };
