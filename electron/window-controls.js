const CHANNELS = Object.freeze({
  getState: 'window:getState',
  setFullscreen: 'window:setFullscreen',
  toggleFullscreen: 'window:toggleFullscreen',
  stateChanged: 'window:stateChanged'
});

function windowState(window) {
  return { isFullscreen: window.isFullScreen() };
}

function installWindowControls({ ipcMain, BrowserWindow }) {
  const applicationWindows = new WeakSet();

  function ownerFor(event) {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || !applicationWindows.has(window) || window.isDestroyed() ||
        window.webContents !== event.sender || !event.senderFrame ||
        event.senderFrame !== window.webContents.mainFrame) {
      throw new Error('Window controls are available only to the owning application frame.');
    }
    return window;
  }

  ipcMain.handle(CHANNELS.getState, event => windowState(ownerFor(event)));
  ipcMain.handle(CHANNELS.setFullscreen, (event, value) => {
    const window = ownerFor(event);
    if (typeof value !== 'boolean') throw new TypeError('Fullscreen must be a boolean.');
    window.setFullScreen(value);
    return windowState(window);
  });
  ipcMain.handle(CHANNELS.toggleFullscreen, event => {
    const window = ownerFor(event);
    window.setFullScreen(!window.isFullScreen());
    return windowState(window);
  });

  return function attachWindowControls(window) {
    if (applicationWindows.has(window)) return;
    applicationWindows.add(window);
    const publishState = (isFullscreen = window.isFullScreen()) => {
      if (!window.isDestroyed() && !window.webContents.isDestroyed()) {
        window.webContents.send(CHANNELS.stateChanged, { isFullscreen });
      }
    };

    window.on('enter-full-screen', () => publishState(true));
    window.on('leave-full-screen', () => publishState(false));
    window.webContents.on('did-finish-load', () => publishState());
    window.webContents.on('before-input-event', (event, input) => {
      if (input.type !== 'keyDown' || input.key !== 'F11') return;
      // Prevent the menu accelerator from toggling a second time; held keys must
      // not repeatedly enter and leave fullscreen. Escape stays with the page.
      event.preventDefault();
      if (!input.isAutoRepeat) window.setFullScreen(!window.isFullScreen());
    });
  };
}

module.exports = { CHANNELS, installWindowControls };
