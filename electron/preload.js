const { contextBridge, ipcRenderer } = require('electron');

const desktopApi = Object.freeze({
  isTestHarness: process.argv.includes('--hd2csm-test-harness'),
  getWindowState: () => ipcRenderer.invoke('window:getState'),
  setFullscreen: (value) => ipcRenderer.invoke('window:setFullscreen', value),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
  onWindowStateChanged: (callback) => {
    if (typeof callback !== 'function') throw new TypeError('Window state callback must be a function.');
    const listener = (_event, state) => callback({ isFullscreen: state.isFullscreen === true });
    ipcRenderer.on('window:stateChanged', listener);
    return () => { ipcRenderer.removeListener('window:stateChanged', listener); };
  },
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  openYouTubeChannel: () => ipcRenderer.invoke('links:openYouTubeChannel'),
  readJsonResource: (resourcePath) => ipcRenderer.invoke('resources:readJson', resourcePath),
  loadState: () => ipcRenderer.invoke('storage:load'),
  previewCardRules: () => ipcRenderer.invoke('cards:previewRules'),
  applyCardRules: (token) => ipcRenderer.invoke('cards:applyRules', token),
  saveState: (data) => ipcRenderer.invoke('storage:save', data),
  exportJson: (data) => ipcRenderer.invoke('storage:exportJson', data),
  importJson: () => ipcRenderer.invoke('storage:importJson'),
  commitImport: (data) => ipcRenderer.invoke('storage:commitImport', data),
  clearAll: (data) => ipcRenderer.invoke('storage:clearAll', data),
  openSaveFolder: () => ipcRenderer.invoke('storage:openSaveFolder')
});

contextBridge.exposeInMainWorld('chaosSlotMachine', desktopApi);
// Temporary compatibility bridge for the previous renderer and existing exports.
contextBridge.exposeInMainWorld('chaosRoulette', desktopApi);
