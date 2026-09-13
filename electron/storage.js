const fs = require('node:fs');
const path = require('node:path');

const SAVE_FORMAT_VERSION = 1;
const MAX_SUPPORTED_SAVE_FORMAT_VERSION = 1;
const MAX_BACKUPS = 20;
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const STATE_FILE = 'state.json';
const BACKUP_DIR = 'backups';
const RECOVERY_DIR = 'recovery';

function safePackageVersion() {
  try { return require('../package.json').version || '0.0.0'; } catch { return '0.0.0'; }
}

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function stamp(date = new Date()) { return date.toISOString().replace(/[:.]/g, '-'); }
function statePath(userDataPath) { return path.join(userDataPath, STATE_FILE); }
function backupPath(userDataPath, prefix = 'state', date = new Date()) { return path.join(userDataPath, BACKUP_DIR, `${prefix}-${stamp(date)}.json`); }
function recoveryPath(userDataPath, prefix = 'state', date = new Date()) { return path.join(userDataPath, RECOVERY_DIR, `${prefix}-${stamp(date)}.json`); }
function friendlyError(message) { const err = new Error(message); err.friendly = true; return err; }

function assertPlainObject(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw friendlyError(message);
}

function validateData(data) {
  assertPlainObject(data, 'State data must be a JSON object.');
  if (data.items != null) assertPlainObject(data.items, 'Items must be a JSON object.');
  if (data.cards != null && !Array.isArray(data.cards)) throw friendlyError('Cards must be a list.');
  if (data.settings != null) assertPlainObject(data.settings, 'Settings must be a JSON object.');
  if (data.items) {
    for (const [key, value] of Object.entries(data.items)) {
      if (!Array.isArray(value)) throw friendlyError(`Item group "${key}" must be a list.`);
      value.forEach((item, index) => assertPlainObject(item, `Item ${key}[${index}] must be an object.`));
    }
  }
  if (data.cards) data.cards.forEach((card, index) => assertPlainObject(card, `Card ${index + 1} must be an object.`));
  if (data.settings && data.settings.rememberedPlayerName != null && typeof data.settings.rememberedPlayerName !== 'string') {
    throw friendlyError('Remembered player name must be text.');
  }
  return true;
}

function validatePayload(payload) {
  assertPlainObject(payload, 'Save file must be a JSON object.');
  const version = Number(payload.saveFormatVersion);
  if (!Number.isInteger(version) || version < 1) throw friendlyError('Save format version is missing or invalid.');
  if (version > MAX_SUPPORTED_SAVE_FORMAT_VERSION) throw friendlyError(`This file uses save format ${version}, which is newer than this app supports. Please update the desktop app before importing it.`);
  if (typeof payload.applicationVersion !== 'string' || !payload.applicationVersion.trim()) throw friendlyError('Application version is missing.');
  if (Number.isNaN(Date.parse(payload.savedAt || payload.exportedAt))) throw friendlyError('Export date is missing or invalid.');
  assertPlainObject(payload.data, 'Save data is missing.');
  validateData(payload.data);
  return true;
}

function validateImportData(data) {
  validateData(data);
  if (!data.items && !data.cards && !data.settings) throw friendlyError('That JSON does not contain supported Chaos Slot Machine data.');
  return true;
}

function wrapData(data, appVersion = safePackageVersion(), date = new Date()) {
  validateData(data);
  const iso = date.toISOString();
  return { saveFormatVersion: SAVE_FORMAT_VERSION, applicationVersion: String(appVersion), savedAt: iso, exportedAt: iso, data };
}

function unwrapPayload(payload) { validatePayload(payload); return payload.data; }
function parseSave(raw) { return unwrapPayload(JSON.parse(raw)); }

function parseImport(raw) {
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw friendlyError('That file is not valid JSON.'); }
  const data = parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.data && parsed.saveFormatVersion != null ? unwrapPayload(parsed) : parsed;
  validateImportData(data);
  return data;
}

function preserveDamagedSave(userDataPath, sourcePath, prefix = 'state') {
  ensureDir(path.join(userDataPath, RECOVERY_DIR));
  const target = recoveryPath(userDataPath, prefix);
  fs.copyFileSync(sourcePath, target);
  return target;
}

function rotateBackups(userDataPath, maxBackups = MAX_BACKUPS) {
  const dir = path.join(userDataPath, BACKUP_DIR);
  ensureDir(dir);
  const files = fs.readdirSync(dir).filter(f => /^state-.*\.json$/.test(f)).map(f => ({ f, p: path.join(dir, f), t: fs.statSync(path.join(dir, f)).mtimeMs })).sort((a,b) => b.t - a.t);
  files.slice(maxBackups).forEach(x => fs.rmSync(x.p, { force: true }));
}

function backupCurrentState(userDataPath, prefix = 'state') {
  ensureDir(userDataPath); ensureDir(path.join(userDataPath, BACKUP_DIR));
  const file = statePath(userDataPath);
  if (!fs.existsSync(file)) return null;
  const target = backupPath(userDataPath, prefix);
  fs.copyFileSync(file, target);
  rotateBackups(userDataPath);
  return target;
}

function saveStateFile(userDataPath, data, appVersion = safePackageVersion()) {
  ensureDir(userDataPath); ensureDir(path.join(userDataPath, BACKUP_DIR)); ensureDir(path.join(userDataPath, RECOVERY_DIR));
  const file = statePath(userDataPath);
  const tmp = path.join(userDataPath, `.${STATE_FILE}.${process.pid}.${Date.now()}.tmp`);
  const payload = JSON.stringify(wrapData(data, appVersion), null, 2);
  fs.writeFileSync(tmp, payload, 'utf8');
  if (!fs.existsSync(tmp)) throw new Error('Temporary save file was not created.');
  if (fs.existsSync(file)) fs.copyFileSync(file, backupPath(userDataPath));
  fs.renameSync(tmp, file);
  rotateBackups(userDataPath);
  return { ok: true, path: file };
}

function loadStateFile(userDataPath) {
  ensureDir(userDataPath); ensureDir(path.join(userDataPath, BACKUP_DIR)); ensureDir(path.join(userDataPath, RECOVERY_DIR));
  const file = statePath(userDataPath);
  if (fs.existsSync(file)) {
    try { return { data: parseSave(fs.readFileSync(file, 'utf8')), recovered: false, path: file }; }
    catch (err) { preserveDamagedSave(userDataPath, file, 'state-damaged'); fs.rmSync(file, { force: true }); }
  }
  const dir = path.join(userDataPath, BACKUP_DIR);
  const backups = fs.readdirSync(dir).filter(f => /^state-.*\.json$/.test(f)).map(f => ({ f, p: path.join(dir, f), t: fs.statSync(path.join(dir, f)).mtimeMs })).sort((a,b) => b.t - a.t);
  for (const b of backups) {
    try { return { data: parseSave(fs.readFileSync(b.p, 'utf8')), recovered: true, path: b.p }; }
    catch { preserveDamagedSave(userDataPath, b.p, 'backup-damaged'); }
  }
  return { data: null, recovered: false, path: null };
}

function importStateFile(userDataPath, importFilePath, appVersion = safePackageVersion()) {
  const stat = fs.statSync(importFilePath);
  if (!stat.isFile()) throw friendlyError('Please choose a JSON file.');
  if (stat.size > MAX_IMPORT_BYTES) throw friendlyError('That import file is too large. Please choose a Chaos Slot Machine JSON export under 5 MB.');
  const data = parseImport(fs.readFileSync(importFilePath, 'utf8'));
  const backup = backupCurrentState(userDataPath, 'state-before-import');
  const saved = saveStateFile(userDataPath, data, appVersion);
  return { ok: true, data, backup, path: saved.path };
}

function exportStateFile(targetPath, data, appVersion = safePackageVersion()) {
  fs.writeFileSync(targetPath, JSON.stringify(wrapData(data, appVersion), null, 2), 'utf8');
  return { ok: true, path: targetPath };
}

module.exports = { SAVE_FORMAT_VERSION, MAX_SUPPORTED_SAVE_FORMAT_VERSION, MAX_BACKUPS, MAX_IMPORT_BYTES, STATE_FILE, BACKUP_DIR, RECOVERY_DIR, validateData, validatePayload, validateImportData, wrapData, parseSave, parseImport, saveStateFile, loadStateFile, rotateBackups, backupCurrentState, importStateFile, exportStateFile };
