const { app, BrowserWindow, dialog, ipcMain, shell, protocol } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { backupCurrentState, exportStateFile, readImportFile, commitImportData, loadStateFile, saveStateFile, validateData, wrapData } = require('./storage');
const transfer = require('../assets/transfer-validation');
const { readPackagedJson } = require('./resource-loader');
const { APP_ID, PRODUCT_NAME, resolveProfile, migrateLegacyProfile } = require('./identity');
const releaseIdentity = require('../release-identity.json');
const { installWindowControls } = require('./window-controls');
const { configureSoftwareRendering, createDiagnostics, installGracefulClose } = require('./desktop-safety');
const { acquireProfileInstance } = require('./profile-instance');
const { createTrustedIpc, secureSession } = require('./ipc-security');
const { SCHEME, ENTRY_URL, SCHEME_REGISTRATION, createLocalHandler } = require('./local-protocol');
const { migrateOrigin } = require('./origin-migration');
protocol.registerSchemesAsPrivileged([SCHEME_REGISTRATION]);
const preparedSessions = new WeakMap();

// App-local compatibility default, including normal/packaged and test launches.
// Do this before readiness or any BrowserWindow is created; browser HTML is unchanged.
const graphics = configureSoftwareRendering(app);

const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@BootsOfTango';
const IS_TEST_HARNESS = process.env.HD2_ELECTRON_TEST_HARNESS === '1';
const IS_AUTOMATION = IS_TEST_HARNESS || process.env.HD2CSM_AUTOMATION === '1';
const trustedIpc = createTrustedIpc({ ipcMain, BrowserWindow, entryUrl: ENTRY_URL });
const attachWindowControls = installWindowControls({ ipcMain: trustedIpc, BrowserWindow });

app.setName(PRODUCT_NAME);
const profile = resolveProfile(app.getPath('appData'));
fs.mkdirSync(profile.directory, { recursive: true });
app.setPath('userData', profile.directory);
const ownsProfile = acquireProfileInstance(app, BrowserWindow);
const diagnostics = ownsProfile ? createDiagnostics(app, profile.directory, graphics) : { record: () => {} };
if (ownsProfile && !profile.isolated) {
  try { migrateLegacyProfile({ destination: profile.directory, appDataPath: app.getPath('appData') }); }
  catch (err) { console.warn('Existing-save migration could not finish; legacy files are unchanged:', err.message); }
}

function isAllowedExternalUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password && !parsed.port &&
      ['www.youtube.com', 'youtube.com', 'youtu.be'].includes(parsed.hostname);
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
  return `hd2-chaos-slot-machine-export-${date.toISOString().slice(0, 10)}.json`;
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
  if (!ownsProfile) throw new Error('Another app instance already owns this save profile.');
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
      webviewTag: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: !app.isPackaged
    }
  });

  trustedIpc.attach(mainWindow);
  secureSession(mainWindow.webContents.session);
  attachWindowControls(mainWindow);
  installGracefulClose(mainWindow, diagnostics);
  diagnostics.record('window-created', { fullscreen, automation });
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    diagnostics.record('render-process-gone', { reason: details.reason, exitCode: details.exitCode });
  });

  if (app.isPackaged) mainWindow.setMenu(null);

  if (show) mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) {
      void openAllowedExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-attach-webview', event => event.preventDefault());
  mainWindow.webContents.on('will-frame-navigate', event => {
    if (!event.isMainFrame) event.preventDefault();
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

  const session = mainWindow.webContents.session;
  if (!preparedSessions.has(session)) {
    session.protocol.handle(SCHEME, createLocalHandler(app.getAppPath()));
    preparedSessions.set(session, migrateOrigin({ BrowserWindow, session, root: app.getAppPath(), directory: profile.directory }));
  }
  mainWindow.startupReady = preparedSessions.get(session).then(() => {
    if (!mainWindow.isDestroyed()) return mainWindow.loadURL(ENTRY_URL);
  });
  mainWindow.startupReady.catch(error => {
    diagnostics.record('startup-migration-failed', { code: error.code || 'ORIGIN_MIGRATION_FAILED' });
    if (!IS_AUTOMATION) dialog.showErrorBox('Save migration could not finish',
      'Startup was stopped to protect your saves. Original storage and the recovery journal have been preserved. Check free disk space and folder permissions before retrying.');
    console.error('Protected startup stopped:', error.message);
    app.quit();
  });

  return mainWindow;
}

app.setAppUserModelId(APP_ID);

trustedIpc.handle('app:getInfo', () => ({
  name: PRODUCT_NAME,
  appId: APP_ID,
  version: app.getVersion(),
  publicVersion: releaseIdentity.publicVersion,
  compatibilityVersion: require('../package.json').version,
  releaseChannel: releaseIdentity.channel,
  ...graphics,
  gpuFeatureStatus: app.getGPUFeatureStatus()
}));

trustedIpc.handle('links:openYouTubeChannel', () => openAllowedExternal(YOUTUBE_CHANNEL_URL));
trustedIpc.handle('resources:readJson', (_event, resourcePath) => readPackagedJson(app.getAppPath(), resourcePath));

trustedIpc.handle('storage:load', () => loadStateFile(app.getPath('userData')));
trustedIpc.handle('storage:save', (_event, data) => {
  validateData(data);
  return saveStateFile(app.getPath('userData'), data, app.getVersion());
});
trustedIpc.handle('storage:openSaveFolder', () => shell.openPath(app.getPath('userData')));
const cardRecalibration = require('./card-recalibration').create(profile.directory, app.getVersion());
trustedIpc.handle('cards:previewRules', () => {
  try { return cardRecalibration.prepare(); }
  catch(error) { return {ok:false,error:error.message}; }
});
trustedIpc.handle('cards:applyRules', (_event, token) => {
  try { return cardRecalibration.commit(token); }
  catch(error) { return {ok:false,error:error.message}; }
});

trustedIpc.handle('storage:exportJson', async (event, data) => {
  transfer.serialize(data, wrapData(data, app.getVersion()));
  const owner = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showSaveDialog(owner, {
    title: `Export ${PRODUCT_NAME} JSON`,
    defaultPath: exportFilename(),
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePath) return { ok: false, canceled: true };
  return exportStateFile(result.filePath, data, app.getVersion());
});

trustedIpc.handle('storage:importJson', async (event) => {
  const owner = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(owner, {
    title: `Import ${PRODUCT_NAME} JSON`,
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePaths?.[0]) return { ok: false, canceled: true };
  try {
    // Reading/validation is not a commit. The renderer must prepare the entire
    // candidate successfully before asking to replace the working save.
    return readImportFile(result.filePaths[0]);
  } catch (err) {
    return { ok: false, error: friendlyDialogError(err, `Import failed. That file is not a supported ${PRODUCT_NAME} JSON export.`) };
  }
});

trustedIpc.handle('storage:clearAll', (_event, data) => {
  validateData(data);
  const backup = backupCurrentState(app.getPath('userData'), 'state-before-clear-all');
  const saved = saveStateFile(app.getPath('userData'), data, app.getVersion());
  return { ok: true, backup, path: saved.path };
});


if (!IS_TEST_HARNESS && ownsProfile) {
  app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

}

// Test entry points also use the ordinary quit lifecycle, not app.exit().
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

trustedIpc.handle('storage:commitImport', (_event, data) => {
  try { return commitImportData(app.getPath('userData'), data, app.getVersion()); }
  catch (err) { return { ok: false, error: friendlyDialogError(err, 'Import could not be saved. The existing session remains active; check disk space and folder permissions.') }; }
});

module.exports = { APP_ID, PRODUCT_NAME, createMainWindow, exportFilename, isAllowedExternalUrl };
