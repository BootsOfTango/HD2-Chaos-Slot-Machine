const fs = require('node:fs');
const path = require('node:path');
const migration = require('../assets/origin-storage');
const { writeJson } = require('./durable-file');

// Journal is private profile recovery data, never a packaged asset or IPC result.
async function coordinateMigration({ directory, readDestination, readSource, apply, flush }) {
  const file = path.join(directory, 'recovery', 'origin-copy-v1.json');
  let journal;
  if (fs.existsSync(file)) {
    if (fs.statSync(file).size > 6 * migration.MAX_TOTAL_BYTES) throw Error('Origin recovery journal exceeds safe limits');
    journal = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (journal.version !== 1 || !['pending', 'complete'].includes(journal.status)) throw Error('Unsupported origin recovery journal');
    migration.validateSnapshot(journal.source); migration.validateSnapshot(journal.before); migration.validateSnapshot(journal.writes);
    const expected = migration.makePlan(journal.source, journal.before);
    if (JSON.stringify(expected) !== JSON.stringify(journal.writes)) throw Error('Origin recovery plan is inconsistent');
  }
  const destination = await readDestination();
  if (destination.marker !== null && destination.marker !== '1') throw Error('Unrecognized origin migration marker');
  if (journal?.status === 'complete' || destination.marker === '1') {
    // A completed journal also prevents resurrection if Chromium loses its marker.
    if (destination.marker !== '1') { await apply({}); await flush(); }
    if (journal?.status === 'pending') { journal.status = 'complete'; writeJson(file, journal); }
    return { reason: 'already-migrated' };
  }
  if (!journal) {
    const source = migration.validateSnapshot(await readSource());
    const before = migration.validateSnapshot(destination.values);
    journal = { version: 1, status: 'pending', source, before, writes: migration.makePlan(source, before) };
    writeJson(file, journal); // Must succeed before any destination mutation.
  }
  const result = await apply(journal.writes);
  await flush();
  journal.status = 'complete'; writeJson(file, journal);
  return result;
}

async function migrateOrigin({ BrowserWindow, session, root, directory }) {
  const window = new BrowserWindow({ show: false, webPreferences: {
    session, nodeIntegration: false, contextIsolation: true, sandbox: true,
    webviewTag: false, webSecurity: true, disableDialogs: true, devTools: false
  } });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  const script = fs.readFileSync(path.join(root, 'assets/origin-storage.js'), 'utf8');
  const evaluate = async code => {
    const result = await window.webContents.executeJavaScript(`(() => { try { return { ok: true, value: (${code}) }; }
      catch (error) { return { ok: false, error: String(error.name) + ': ' + String(error.message) }; } })()`);
    if (!result.ok) throw Error('Origin storage operation failed: ' + result.error);
    return result.value;
  };
  const destination = async () => {
    await window.loadURL('hd2-slot://app/assets/origin-bootstrap.html');
    await window.webContents.executeJavaScript(script);
  };
  try {
    return await coordinateMigration({ directory,
      readDestination: async () => {
        await destination();
        return evaluate('({marker:localStorage.getItem(HD2OriginStorage.MARKER),values:HD2OriginStorage.snapshot(localStorage)})');
      },
      readSource: async () => {
        await window.loadFile(path.join(root, 'assets/origin-bootstrap.html')); await window.webContents.executeJavaScript(script);
        return evaluate('HD2OriginStorage.snapshot(localStorage)');
      },
      apply: async writes => {
        await destination();
        return evaluate(`HD2OriginStorage.resumePlan(localStorage, ${JSON.stringify(writes)})`);
      },
      flush: () => session.flushStorageData()
    });
  } finally { if (!window.isDestroyed()) window.close(); }
}
module.exports = { coordinateMigration, migrateOrigin };
