(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./mission-selection'));
  else root.HD2MissionState = factory(root.HD2MissionSelection);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (selection) {
  'use strict';
  if (!selection) throw new Error('Load mission-selection before mission-state');
  const VERSION = 1;
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const own = (v, key) => Object.prototype.hasOwnProperty.call(v, key);
  const text = (v, max = 160) => typeof v === 'string' && v.length > 0 && v.length <= max && v === v.trim() && !/[\u0000-\u001f\u007f]/.test(v);
  const token = v => text(v, 96) && /^[a-z0-9][a-z0-9:._-]*$/.test(v);
  const copy = v => JSON.parse(JSON.stringify(v));
  const conflicts = ['confirmation-required', 'faction', 'difficulty', 'unknown-campaign', 'campaign', 'unverified-event-rule'];
  function fail(message, code) {
    const error = new Error('Mission data: ' + message + ' Existing data must be preserved.');
    error.friendly = true; if (code) error.code = code; throw error;
  }
  function check(ok, message) { if (!ok) fail(message); }
  function keys(v, allowed) { check(object(v) && Object.keys(v).every(k => allowed.includes(k)), 'Invalid record fields.'); }
  function version(v) {
    if (object(v) && typeof v.version === 'number' && v.version > VERSION) fail('A newer app is required.', 'UNSUPPORTED_SAVE_VERSION');
    check(object(v) && v.version === VERSION, 'Unsupported record version.');
  }
  function scope(value) {
    check(text(value, 8192), 'Invalid operation scope.');
    let parts;
    try { parts = JSON.parse(value); } catch (_) { fail('Invalid operation scope JSON.'); }
    check(Array.isArray(parts) && parts.length === 8, 'Invalid operation scope fields.');
    version({ version: parts[0] });
    let context;
    try {
      context = selection.normalizeContext({ planetKey: parts[1], faction: parts[2], difficulty: parts[3], campaign: parts[4],
        campaignIds: parts[5], eventKeys: parts[6], verifiedEventRules: parts[7], active: true, enabled: true });
    } catch (_) { fail('Invalid operation context.'); }
    check(context.planetKey && context.faction && context.difficulty && selection.scopeKey(context) === value, 'Incomplete or noncanonical operation scope.');
    return value;
  }
  function display(v) {
    check(text(v.name) && (v.minutes === null || (Number.isInteger(v.minutes) && v.minutes >= 1 && v.minutes <= 180)), 'Invalid mission name or duration.');
    check(v.scoringFamily === null || selection.SCORING_FAMILIES.includes(v.scoringFamily), 'Invalid legacy scoring family.');
  }
  function validateConfirmation(v) {
    version(v); keys(v, ['version', 'catalogRevision', 'scope', 'missions']);
    check(token(v.catalogRevision), 'Invalid catalog revision.'); scope(v.scope);
    check(Array.isArray(v.missions) && v.missions.length <= 32, 'Invalid shortlist.');
    const ids = new Set();
    for (const row of v.missions) {
      check(object(row) && token(row.id) && !ids.has(row.id), 'Invalid or duplicate shortlist identity.'); ids.add(row.id);
      if (row.kind === 'catalog') {
        keys(row, ['kind', 'id']); check(/^mission:.+/.test(row.id), 'Invalid catalog identity.');
      } else {
        keys(row, ['kind', 'id', 'name', 'minutes', 'scoringFamily']);
        check(row.kind === 'custom' && /^custom:.+/.test(row.id), 'Invalid custom identity.'); display(row);
      }
    }
    // Structural only: removed catalog IDs/old revisions remain recoverable.
    // The eligibility engine must revalidate them against current context.
    return v;
  }
  function defaults() { return { version: VERSION, confirmation: null }; }
  function validate(v) {
    version(v); keys(v, ['version', 'confirmation']);
    if (v.confirmation !== null) validateConfirmation(v.confirmation);
    return v;
  }
  function normalize(v) { return v === undefined ? defaults() : copy(validate(v)); }
  function read(v) {
    try { return { status: v === undefined ? 'missing' : 'valid', value: normalize(v), writable: true }; }
    catch (error) { return { status: error.code === 'UNSUPPORTED_SAVE_VERSION' ? 'unsupported' : 'invalid', value: null, writable: false, error: error.message }; }
  }
  function validateSelection(v) {
    version(v); keys(v, ['version', 'catalogRevision', 'scope', 'id', 'name', 'minutes', 'scoringFamily', 'provenance', 'ruleConflicts']);
    check(token(v.catalogRevision) && token(v.id), 'Invalid selection identity.'); scope(v.scope); display(v);
    check(['suggested', 'player-confirmed', 'player-confirmed-custom'].includes(v.provenance), 'Invalid selection provenance.');
    check(v.provenance === 'player-confirmed-custom' ? /^custom:.+/.test(v.id) : /^mission:.+/.test(v.id), 'Identity/provenance mismatch.');
    check(Array.isArray(v.ruleConflicts) && v.ruleConflicts.length <= conflicts.length && Array.from(v.ruleConflicts).every(x => conflicts.includes(x)) && new Set(v.ruleConflicts).size === v.ruleConflicts.length, 'Invalid rule conflicts.');
    check(v.provenance === 'player-confirmed' || v.ruleConflicts.length === 0, 'Only confirmed catalog overrides can carry conflicts.');
    return v;
  }
  function capture(entry, context, catalogRevision) {
    const record = { ...copy(entry), version: VERSION, catalogRevision, scope: selection.scopeKey(context) };
    return copy(validateSelection(record));
  }
  function validateData(data) {
    if (object(data.settings) && own(data.settings, 'missionPlanner')) validate(data.settings.missionPlanner);
    if (Array.isArray(data.cards)) for (const card of data.cards) {
      if (!object(card) || !own(card, 'missionSelection')) continue;
      validateSelection(card.missionSelection);
      if (card.missionSelection.scoringFamily !== null && own(card, 'mode')) {
        check(card.mode === card.missionSelection.scoringFamily, 'Historical mode and mission scoring family disagree.');
      }
    }
    return data;
  }
  return Object.freeze({ VERSION, defaults, normalize, read, validate, validateConfirmation, validateSelection, validateData, capture });
});
