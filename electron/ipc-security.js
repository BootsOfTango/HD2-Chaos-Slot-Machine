const { pathToFileURL } = require('node:url');

function createTrustedIpc({ ipcMain, BrowserWindow, entryFile, entryUrl: explicitEntry }) {
  const windows = new WeakSet();
  const entryUrl = explicitEntry || pathToFileURL(entryFile).href;
  const isEntry = value => {
    try {
      const url = new URL(value);
      url.hash = '';
      return url.href === entryUrl;
    } catch { return false; }
  };
  function assertTrusted(event) {
    try {
      const sender = event?.sender;
      const window = sender && BrowserWindow.fromWebContents(sender);
      if (window && windows.has(window) && !window.isDestroyed() &&
          window.webContents === sender && !sender.isDestroyed() &&
          event.senderFrame && event.senderFrame === sender.mainFrame &&
          isEntry(sender.getURL()) && isEntry(event.senderFrame.url)) return;
    } catch { /* Detached/destroyed frames fail closed. */ }
    throw new Error('This operation is available only to the trusted application frame.');
  }
  return {
    attach: window => windows.add(window),
    assertTrusted,
    handle: (channel, handler) => ipcMain.handle(channel, (event, ...args) => {
      assertTrusted(event);
      return handler(event, ...args);
    })
  };
}

const securedSessions = new WeakSet();
function secureSession(session) {
  if (securedSessions.has(session)) return;
  // Native save/open dialogs and local sound playback need none of these grants.
  session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.setPermissionCheckHandler(() => false);
  session.setDevicePermissionHandler(() => false);
  session.on('will-download', event => event.preventDefault());
  securedSessions.add(session);
}

module.exports = { createTrustedIpc, secureSession };
