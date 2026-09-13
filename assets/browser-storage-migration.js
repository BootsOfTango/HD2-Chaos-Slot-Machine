(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HD2CSMStorageMigration = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const legacyPrefix = 'hd2_chaos_roulette';
  const currentPrefix = 'hd2_chaos_slot_machine';

  function isValidState(raw) {
    try {
      const parsed = JSON.parse(raw);
      const data = parsed?.saveFormatVersion != null ? parsed.data : parsed;
      if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
      if (!data.items && !data.cards && !data.settings) return false;
      if (data.items != null && (typeof data.items !== 'object' || Array.isArray(data.items))) return false;
      if (data.cards != null && !Array.isArray(data.cards)) return false;
      if (data.settings != null && (typeof data.settings !== 'object' || Array.isArray(data.settings))) return false;
      return true;
    } catch { return false; }
  }

  function migrateBrowserStorage(storage) {
    const current = `${currentPrefix}_v1`;
    // An existing destination, including a damaged one, belongs to the user.
    // Recovery is handled by the normal loader; migration must not replace it.
    if (storage.getItem(current) !== null) return { migrated: false, reason: 'destination-exists' };
    const legacy = storage.getItem(`${legacyPrefix}_v1`);
    const backup = storage.getItem(`${legacyPrefix}_backup_v1`);
    const source = isValidState(legacy) ? legacy : isValidState(backup) ? backup : null;
    if (source === null) return { migrated: false, reason: 'no-valid-legacy-state' };
    storage.setItem(current, source);
    for (const suffix of ['_backup_v1', '_corrupt_v1', '_locked_stats_audit_v1']) {
      const destination = `${currentPrefix}${suffix}`;
      const oldValue = storage.getItem(`${legacyPrefix}${suffix}`);
      if (storage.getItem(destination) === null && oldValue !== null) storage.setItem(destination, oldValue);
    }
    if (storage.getItem(`${currentPrefix}_backup_v1`) === null) storage.setItem(`${currentPrefix}_backup_v1`, source);
    return { migrated: true, recoveredFromBackup: source !== legacy };
  }

  return { migrateBrowserStorage, isValidState };
});
