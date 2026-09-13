const fs = require('node:fs');
const path = require('node:path');
const { MAX_IMPORT_BYTES, STATE_FILE, BACKUP_DIR, RECOVERY_DIR, parseSave, validateImportData } = require('./storage');

const PRODUCT_NAME = 'Helldivers 2 Chaos Slot Machine';
const APP_ID = 'com.bootsoftango.helldivers2chaosslotmachine';
// These names are retained exclusively to recover profiles from previous releases.
const LEGACY_PROFILE_NAMES = ['Helldivers 2 Chaos Roulette', 'helldivers-2-chaos-roulette'];
const MIGRATION_MARKER = 'legacy-migration.json';
const MIGRATION_ARCHIVE = 'legacy-migration';

function resolveProfile(appDataPath, env = process.env) {
  const override = env.HD2CSM_USER_DATA_DIR;
  if (override != null && (!override.trim() || !path.isAbsolute(override))) {
    throw new Error('HD2CSM_USER_DATA_DIR must be an absolute directory path.');
  }
  return {
    directory: override ? path.resolve(override) : path.join(appDataPath, PRODUCT_NAME),
    isolated: !!override
  };
}

function regularFile(file) {
  try { return fs.lstatSync(file).isFile(); } catch { return false; }
}

function listJsonFiles(directory) {
  try {
    return fs.readdirSync(directory).filter(name => name.endsWith('.json'))
      .map(name => path.join(directory, name)).filter(regularFile);
  } catch { return []; }
}

function readValidState(file) {
  if (!regularFile(file)) return null;
  try {
    if (fs.statSync(file).size > MAX_IMPORT_BYTES) return null;
    const raw = fs.readFileSync(file, 'utf8');
    validateImportData(parseSave(raw));
    return raw;
  } catch { return null; }
}

function writeMarker(directory, result) {
  try {
    fs.writeFileSync(path.join(directory, MIGRATION_MARKER), JSON.stringify({
      migrationVersion: 1,
      checkedAt: new Date().toISOString(),
      ...result
    }, null, 2), { encoding: 'utf8', flag: 'wx' });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
  return result;
}

/** Copy old data without invoking recovery/rotation, which could modify its source. */
function migrateLegacyProfile({ destination, appDataPath }) {
  fs.mkdirSync(destination, { recursive: true });
  if (fs.existsSync(path.join(destination, MIGRATION_MARKER))) {
    return { migrated: false, reason: 'already-checked' };
  }
  const target = path.join(destination, STATE_FILE);
  if (fs.existsSync(target) || listJsonFiles(path.join(destination, BACKUP_DIR)).length || listJsonFiles(path.join(destination, RECOVERY_DIR)).length) {
    return writeMarker(destination, { migrated: false, reason: 'existing-profile' });
  }

  let selected = null;
  const sources = [];
  for (const name of LEGACY_PROFILE_NAMES) {
    const directory = path.join(appDataPath, name);
    if (path.resolve(directory).toLowerCase() === path.resolve(destination).toLowerCase()) continue;
    const current = path.join(directory, STATE_FILE);
    const backups = listJsonFiles(path.join(directory, BACKUP_DIR))
      .filter(file => /^state-.*\.json$/.test(path.basename(file)))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs || b.localeCompare(a));
    const files = [current, ...listJsonFiles(path.join(directory, BACKUP_DIR)), ...listJsonFiles(path.join(directory, RECOVERY_DIR))].filter(regularFile);
    if (files.length) sources.push({ name, directory, files });
    if (!selected) {
      for (const file of [current, ...backups]) {
        const raw = readValidState(file);
        if (raw !== null) {
          selected = { path: file, raw, fromBackup: file !== current };
          break;
        }
      }
    }
  }

  const warnings = [];
  for (const source of sources) {
    for (const file of source.files) {
      const copy = path.join(destination, MIGRATION_ARCHIVE, source.name, path.relative(source.directory, file));
      try {
        fs.mkdirSync(path.dirname(copy), { recursive: true });
        fs.copyFileSync(file, copy, fs.constants.COPYFILE_EXCL);
      } catch (err) {
        if (err.code !== 'EEXIST') warnings.push(`Could not archive ${path.basename(file)}: ${err.code || err.message}`);
      }
    }
  }

  if (!selected) return writeMarker(destination, { migrated: false, reason: 'no-valid-legacy-save', warnings });
  try {
    // Write the exact validated snapshot; exclusive creation prevents overwriting a
    // save produced by a second instance while this migration was inspecting data.
    fs.writeFileSync(target, selected.raw, { encoding: 'utf8', flag: 'wx' });
  } catch (err) {
    if (err.code === 'EEXIST') return writeMarker(destination, { migrated: false, reason: 'existing-profile', warnings });
    throw err;
  }
  return writeMarker(destination, {
    migrated: true,
    source: selected.path,
    fromBackup: selected.fromBackup,
    archiveDirectory: path.join(destination, MIGRATION_ARCHIVE),
    warnings
  });
}

module.exports = { PRODUCT_NAME, APP_ID, LEGACY_PROFILE_NAMES, MIGRATION_MARKER, MIGRATION_ARCHIVE, resolveProfile, migrateLegacyProfile };
