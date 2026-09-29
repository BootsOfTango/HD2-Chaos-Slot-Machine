/* Acquisition provenance comes from bundled catalog facts, never a save's claims. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HD2CSMCatalogSources = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const labels = Object.freeze({ warbond: 'Warbond', superstore: 'Superstore', 'base-game': 'Base game',
    'edition-bonus': 'Edition bonus', 'campaign-reward': 'Campaign reward', 'commemorative-gift': 'Commemorative gift',
    requisition: 'Requisition unlock', unverified: 'Source not reviewed', custom: 'Player-defined source' });
  function createIndex(catalogItems) {
    const facts = new Map(catalogItems.map(item => [item.id, item]));
    function describe(item) {
      const fact = facts.get(item?.id);
      if (!fact) return { kind: 'custom', label: labels.custom, group: item?.warbond || 'Unassigned / Custom', reviewed: false, verification: 'custom', sourceUrl: '', verifiedAt: '' };
      const source = fact.acquisition || {};
      const kind = Object.hasOwn(labels, source.kind) ? source.kind : 'unverified';
      const verification = source.verification || (source.verifiedAt && source.sourceUrl ? 'primary-source' : 'unreviewed');
      let url = '';
      try { const parsed = new URL(source.sourceUrl); if (parsed.protocol === 'https:') url = parsed.href; } catch (_) { /* No verified link. */ }
      const reviewed = ['primary-source', 'community-source'].includes(verification) && !!url && /^\d{4}-\d{2}-\d{2}$/.test(source.verifiedAt || '');
      return { kind, label: labels[kind], group: fact.warbond || 'Unassigned / Custom', reviewed,
        verification: reviewed ? verification : 'unreviewed', sourceUrl: reviewed ? url : '',
        verifiedAt: reviewed ? source.verifiedAt : '', detail: source.label || fact.source || '', notes: source.notes || '' };
    }
    function summary() {
      const rows = catalogItems.map(describe);
      return { total: rows.length, primary: rows.filter(row => row.reviewed && row.verification === 'primary-source').length,
        community: rows.filter(row => row.reviewed && row.verification === 'community-source').length,
        pending: rows.filter(row => !row.reviewed).length };
    }
    return Object.freeze({ describe, summary });
  }
  return Object.freeze({ createIndex, labels });
});
