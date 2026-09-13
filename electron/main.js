const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { backupCurrentState, exportStateFile, importStateFile, loadStateFile, saveStateFile, validateData } = require('./storage');
const { readPackagedJson } = require('./resource-loader');
const { APP_ID, PRODUCT_NAME, resolveProfile, migrateLegacyProfile } = require('./identity');
const { installWindowControls } = require('./window-controls');

const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@BootsOfTango';
const IS_TEST_HARNESS = process.env.HD2_ELECTRON_TEST_HARNESS === '1';
const IS_AUTOMATION = IS_TEST_HARNESS || process.env.HD2CSM_AUTOMATION === '1';
const attachWindowControls = installWindowControls({ ipcMain, BrowserWindow });

app.setName(PRODUCT_NAME);
const profile = resolveProfile(app.getPath('appData'));
fs.mkdirSync(profile.directory, { recursive: true });
app.setPath('userData', profile.directory);
if (!profile.isolated) {
  try { migrateLegacyProfile({ destination: profile.directory, appDataPath: app.getPath('appData') }); }
  catch (err) { console.warn('Existing-save migration could not finish; legacy files are unchanged:', err.message); }
}

function isAllowedExternalUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ['www.youtube.com', 'youtube.com', 'youtu.be'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

async function openAllowedExternal(url) {
  if (!isAllowedExternalUrl(url)) return false;
  await shell.openExternal(url);
  return true;
}

function exportFilename(date = new Date()) {
  return `helldivers-2-chaos-slot-machine-export-${date.toISOString().slice(0, 10)}.json`;
}

function friendlyDialogError(err, fallback) {
  return err && err.friendly ? err.message : fallback;
}

function getWindowIconPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'build', 'icon.png')
    : path.join(__dirname, '..', 'build', 'icon.png');
}

function createMainWindow({ show = true, automation = IS_AUTOMATION, fullscreen = !automation } = {}) {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 640,
    minHeight: 480,
    fullscreen,
    title: PRODUCT_NAME,
    icon: getWindowIconPath(),
    backgroundColor: '#060805',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: automation ? ['--hd2csm-test-harness'] : [],
      backgroundThrottling: !automation,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: !app.isPackaged
    }
  });

  attachWindowControls(mainWindow);

  if (app.isPackaged) mainWindow.setMenu(null);

  if (show) mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) {
      void openAllowedExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentUrl = mainWindow.webContents.getURL();
    if (url !== currentUrl) {
      event.preventDefault();
      if (isAllowedExternalUrl(url)) {
        void openAllowedExternal(url);
      }
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  return mainWindow;
}

app.setAppUserModelId(APP_ID);

ipcMain.handle('app:getInfo', () => ({
  name: PRODUCT_NAME,
  appId: APP_ID,
  version: app.getVersion()
}));

ipcMain.handle('links:openYouTubeChannel', () => openAllowedExternal(YOUTUBE_CHANNEL_URL));
ipcMain.handle('resources:readJson', (_event, resourcePath) => readPackagedJson(app.getAppPath(), resourcePath));

ipcMain.handle('storage:load', () => loadStateFile(app.getPath('userData')));
ipcMain.handle('storage:save', (_event, data) => {
  validateData(data);
  return saveStateFile(app.getPath('userData'), data, app.getVersion());
});
ipcMain.handle('storage:openSaveFolder', () => shell.openPath(app.getPath('userData')));

ipcMain.handle('storage:exportJson', async (event, data) => {
  validateData(data);
  const owner = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showSaveDialog(owner, {
    title: `Export ${PRODUCT_NAME} JSON`,
    defaultPath: exportFilename(),
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePath) return { ok: false, canceled: true };
  return exportStateFile(result.filePath, data, app.getVersion());
});

ipcMain.handle('storage:importJson', async (event) => {
  const owner = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(owner, {
    title: `Import ${PRODUCT_NAME} JSON`,
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePaths?.[0]) return { ok: false, canceled: true };
  try {
    return importStateFile(app.getPath('userData'), result.filePaths[0], app.getVersion());
  } catch (err) {
    return { ok: false, error: friendlyDialogError(err, `Import failed. That file is not a supported ${PRODUCT_NAME} JSON export.`) };
  }
});

ipcMain.handle('storage:clearAll', (_event, data) => {
  validateData(data);
  const backup = backupCurrentState(app.getPath('userData'), 'state-before-clear-all');
  const saved = saveStateFile(app.getPath('userData'), data, app.getVersion());
  return { ok: true, backup, path: saved.path };
});


if (!IS_TEST_HARNESS) {
  app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

module.exports = { APP_ID, PRODUCT_NAME, createMainWindow, exportFilename, isAllowedExternalUrl };
