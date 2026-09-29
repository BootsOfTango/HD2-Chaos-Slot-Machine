const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { writeDurable } = require('./durable-file');
const transfer = require('../assets/transfer-validation');

const SAVE_FORMAT_VERSION = 1;
const MAX_SUPPORTED_SAVE_FORMAT_VERSION = 2;
const MAX_BACKUPS = 20;
const MAX_IMPORT_BYTES = transfer.MAX_BYTES;
const STATE_FILE = 'state.json';
const BACKUP_DIR = 'backups';
const RECOVERY_DIR = 'recovery';

function safePackageVersion() {
  try { return require('../package.json').version || '0.0.0'; } catch { return '0.0.0'; }
}

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function stamp(date = new Date()) { return date.toISOString().replace(/[:.]/g, '-'); }
function statePath(userDataPath) { return path.join(userDataPath, STATE_FILE); }
function backupPath(userDataPath, prefix = 'state', date = new Date()) { return path.join(userDataPath, BACKUP_DIR, `${prefix}-${stamp(date)}-${randomUUID()}.json`); }
function recoveryPath(userDataPath, prefix = 'state', date = new Date()) { return path.join(userDataPath, RECOVERY_DIR, `${prefix}-${stamp(date)}-${randomUUID()}.json`); }
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
  if (data.settings && Object.hasOwn(data.settings, 'armoryBrowser')) require('../assets/armory-preferences').validate(data.settings.armoryBrowser);
  require('../assets/mission-state').validateData(data);
  require('../assets/card-rules').validateData(data);
  return true;
}

function validatePayload(payload) {
  assertPlainObject(payload, 'Save file must be a JSON object.');
  const version = Number(payload.saveFormatVersion);
  if (!Number.isInteger(version) || version < 1) throw friendlyError('Save format version is missing or invalid.');
  if (version > MAX_SUPPORTED_SAVE_FORMAT_VERSION) {
    const error = friendlyError(`This file uses save format ${version}, which is newer than this app supports. Please update the desktop app before opening or importing it.`);
    error.code = 'UNSUPPORTED_SAVE_VERSION';
    throw error;
  }
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
  const version = data.cards?.some(card => card.cardHistory) ? 2 : SAVE_FORMAT_VERSION;
  return { saveFormatVersion: version, applicationVersion: String(appVersion), savedAt: iso, exportedAt: iso, data };
}

function unwrapPayload(payload) { validatePayload(payload); return payload.data; }
function parseSave(raw) { return unwrapPayload(JSON.parse(raw)); }

function parseImport(raw) {
  const data = transfer.parse(raw);
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
  // Never let an older app, failed read, or damaged current file be overwritten
  // merely because the renderer subsequently sends defaults or an import.
  const raw = fs.readFileSync(file, 'utf8');
  parseSave(raw);
  const target = backupPath(userDataPath, prefix);
  writeDurable(target, raw);
  rotateBackups(userDataPath);
  return target;
}

function saveStateFile(userDataPath, data, appVersion = safePackageVersion()) {
  ensureDir(userDataPath); ensureDir(path.join(userDataPath, BACKUP_DIR)); ensureDir(path.join(userDataPath, RECOVERY_DIR));
  const file = statePath(userDataPath);
  const payload = JSON.stringify(wrapData(data, appVersion), null, 2);
  if (fs.existsSync(file)) backupCurrentState(userDataPath);
  writeDurable(file, payload);
  rotateBackups(userDataPath);
  return { ok: true, path: file };
}

function loadStateFile(userDataPath) {
  ensureDir(userDataPath); ensureDir(path.join(userDataPath, BACKUP_DIR)); ensureDir(path.join(userDataPath, RECOVERY_DIR));
  const file = statePath(userDataPath);
  if (fs.existsSync(file)) {
    // Read failures are not corrupt JSON. Leave the original in place and fail
    // closed, rather than deleting it and falling back to an older snapshot.
    const raw = fs.readFileSync(file, 'utf8');
    try { return { data: parseSave(raw), recovered: false, path: file }; }
    catch (err) {
      if (err.code === 'UNSUPPORTED_SAVE_VERSION') throw err;
      preserveDamagedSave(userDataPath, file, 'state-damaged'); fs.rmSync(file, { force: true });
    }
  }
  const dir = path.join(userDataPath, BACKUP_DIR);
  const backups = fs.readdirSync(dir).filter(f => /^state-.*\.json$/.test(f)).map(f => ({ f, p: path.join(dir, f), t: fs.statSync(path.join(dir, f)).mtimeMs })).sort((a,b) => b.t - a.t);
  for (const b of backups) {
    const raw = fs.readFileSync(b.p, 'utf8');
    try { return { data: parseSave(raw), recovered: true, path: b.p }; }
    catch (err) {
      if (err.code === 'UNSUPPORTED_SAVE_VERSION') throw err;
      preserveDamagedSave(userDataPath, b.p, 'backup-damaged');
    }
  }
  if (backups.length || fs.readdirSync(path.join(userDataPath, RECOVERY_DIR)).some(name => /^(state-damaged|backup-damaged)/.test(name))) {
    throw friendlyError('No valid native save could be recovered. Damaged files are preserved in the recovery folder; restore a valid backup before continuing.');
  }
  return { data: null, recovered: false, path: null };
}

function readImportFile(importFilePath) {
  const fd = fs.openSync(importFilePath, 'r');
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile()) throw friendlyError('Please choose a JSON file.');
    const tooLarge = () => friendlyError('That import file is too large. JSON transfers support up to 32 MiB. No data was replaced.');
    if (stat.size > MAX_IMPORT_BYTES) throw tooLarge();
    // The file may grow after fstat. Read at most the limit plus one byte.
    const chunks = [], buffer = Buffer.alloc(64 * 1024);
    let total = 0;
    for (;;) {
      const count = fs.readSync(fd, buffer, 0, Math.min(buffer.length, MAX_IMPORT_BYTES + 1 - total), null);
      if (!count) break;
      total += count;
      if (total > MAX_IMPORT_BYTES) throw tooLarge();
      chunks.push(Buffer.from(buffer.subarray(0, count)));
    }
    return { ok: true, data: parseImport(Buffer.concat(chunks).toString('utf8')) };
  } finally { fs.closeSync(fd); }
}

function commitImportData(userDataPath, data, appVersion = safePackageVersion()) {
  // Recheck the prepared payload and its final envelope before any backup/write.
  const payload = transfer.serialize(data, wrapData(data, appVersion));
  const backup = backupCurrentState(userDataPath, 'state-before-import');
  const file = statePath(userDataPath);
  // Backup rotation is already finished. Nothing fallible runs after replacement
  // that could report "not saved" when the new file was actually committed.
  writeDurable(file, payload);
  return { ok: true, data, backup, path: file };
}

function importStateFile(userDataPath, importFilePath, appVersion = safePackageVersion()) {
  return commitImportData(userDataPath, readImportFile(importFilePath).data, appVersion);
}

function exportStateFile(targetPath, data, appVersion = safePackageVersion()) {
  writeDurable(targetPath, transfer.serialize(data, wrapData(data, appVersion)));
  return { ok: true, path: targetPath };
}

module.exports = { SAVE_FORMAT_VERSION, MAX_SUPPORTED_SAVE_FORMAT_VERSION, MAX_BACKUPS, MAX_IMPORT_BYTES, STATE_FILE, BACKUP_DIR, RECOVERY_DIR, validateData, validatePayload, validateImportData, wrapData, parseSave, parseImport, saveStateFile, loadStateFile, rotateBackups, backupCurrentState, readImportFile, commitImportData, importStateFile, exportStateFile };
