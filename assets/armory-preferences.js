(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HD2ArmoryPreferences = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const types = ['all', 'primary', 'sidearm', 'throwable', 'stratagem', 'booster'];
  const ownership = ['all', 'owned', 'unowned', 'enabled', 'excluded'];
  const roles = Object.freeze({ orbital: 'Orbital strikes', eagle: 'Eagle airstrikes', support: 'Support weapons / vehicles', backpack: 'Backpacks', defensive: 'Defenses', other: 'Other / custom' });
  const validGroup = key => typeof key === 'string' && key.length <= 160 && !/[\x00-\x1f\x7f]/.test(key) &&
    (['weapons', 'stratagems', 'boosters'].includes(key) || /^source:.+/.test(key) || (key.startsWith('role:') && Object.hasOwn(roles, key.slice(5))));
  function defaults() { return { version: 1, viewMode: 'category', typeFilter: 'all', ownershipFilter: 'all', expandedGroups: [] }; }
  function validate(value) {
    if (value && typeof value.version === 'number' && value.version > 1) {
      const error = new Error('Armory browsing preferences require a newer app. Existing data is preserved.');
      error.code = 'UNSUPPORTED_SAVE_VERSION'; error.friendly = true; throw error;
    }
    const fail = () => { const error = new Error('Armory browsing preferences are invalid or newer than this app supports. No data was replaced.'); error.friendly = true; throw error; };
    if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1 ||
        !['category', 'warbond'].includes(value.viewMode) || !types.includes(value.typeFilter) || !ownership.includes(value.ownershipFilter) ||
        !Array.isArray(value.expandedGroups) || value.expandedGroups.length > 200 || !value.expandedGroups.every(validGroup) ||
        Object.keys(value).some(key => !['version', 'viewMode', 'typeFilter', 'ownershipFilter', 'expandedGroups'].includes(key))) fail();
    return value;
  }
  function normalize(value, legacy = {}) {
    if (value !== undefined && value !== null) {
      validate(value);
      return { version: 1, viewMode: value.viewMode, typeFilter: value.typeFilter, ownershipFilter: value.ownershipFilter, expandedGroups: [...new Set(value.expandedGroups)] };
    }
    const result = defaults();
    if (['category', 'warbond'].includes(legacy.viewMode)) result.viewMode = legacy.viewMode;
    if (types.includes(legacy.typeFilter)) result.typeFilter = legacy.typeFilter;
    return result;
  }
  function role(item) { return Object.hasOwn(roles, item?.subgroup) ? item.subgroup : 'other'; }
  return Object.freeze({ defaults, validate, normalize, role, roles, validGroup });
});
