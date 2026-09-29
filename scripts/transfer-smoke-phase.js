async function rendererTransferPhase() {
  const checks = [], alerts = [];
  const assert = (ok, label) => { if (!ok) throw new Error(`TRANSFER: ${label}`); checks.push(label); };
  window.alert = message => alerts.push(String(message));
  await bootStateReady; await missionUIReady; await saveHealth.flush();
  assert(!!desktopStorage?.commitImport, 'packaged transactional commit bridge exists');
  state.cards = [{ id: 'original-transfer', seed: 'original' }];
  state.settings.rememberedPlayerName = 'Original Diver';
  await saveState();
  const before = JSON.stringify(buildPersistedStatePayload());
  const diskBefore = JSON.stringify((await desktopStorage.loadState()).data);
  const submit = data => importJSONFile(new File([JSON.stringify(data)], 'transfer.json', { type: 'application/json' }));
  for (const [index, data] of [
    { items: { primaries: [{}] } },
    { items: { primaries: [{ id: 'primary:unknown-without-name' }] } },
    { cards: [{ id: 'bad', stats: [] }] },
    { cards: [{ id: 'bad', mode: { toString: null } }] },
    JSON.parse('{"items":{"__proto__":[{"name":"bad"}]},"cards":[]}'),
    { saveFormatVersion: 1, data: null, cards: [] }
  ].entries()) {
    assert(await submit(data) === false, `malformed import ${index + 1} rejected`);
    assert(JSON.stringify(buildPersistedStatePayload()) === before, `malformed import ${index + 1} preserves session`);
    assert(JSON.stringify((await desktopStorage.loadState()).data) === diskBefore, `malformed import ${index + 1} preserves working save`);
  }
  const accepted = { items: { primaries: [{ name: 'Transfer Metadata', owned: true, enabled: false, retainedMetadata: 'x'.repeat(6 * 1024 * 1024) }] }, cards: [{ id: 'accepted-transfer', seed: 'transfer', planet: 'Legacy Planet' }], settings: { rememberedPlayerName: 'Transfer Diver' } };
  const missionCatalog = await (await fetch('assets/mission-catalog.json')).json();
  const missionEngine = HD2MissionSelection.createEngine(missionCatalog);
  const missionContext = { planetKey: 'id:7', faction: 'Automatons', difficulty: 7, campaign: 'liberation', active: true };
  const customMission = { kind: 'custom', id: 'custom:transfer-observed', name: '<Observed> operation', minutes: 40, scoringFamily: 'Blitz (12)' };
  const confirmation = missionEngine.confirm(missionContext, [customMission]);
  accepted.settings.missionPlanner = { version: 1, confirmation };
  accepted.cards[0].mode = 'Blitz (12)';
  accepted.cards[0].missionSelection = HD2MissionState.capture(missionEngine.select(missionContext, customMission.id, { confirmation }), missionContext, missionCatalog.revision);
  const soloTransfer = { id:'solo-transfer', seed:'Solo transfer', difficulty:7, faction:'Automatons', mode:'Normal (40)', statsLocked:true,
    originalNote:'Keep the original note',
    stats:{kills:394,accuracy:80,deaths:2,blueSideObjCount:3,extractedSafely:true},
    soloScore:{...HD2SoloScore.create(),version:1,inputs:{minutes:100,sideAvailable:4,missionSuccess:true}} };
  soloTransfer.lockedStatsSnapshot=JSON.parse(JSON.stringify(soloTransfer.stats));
  soloTransfer.soloScore.result=HD2SoloScore.evaluate(soloTransfer);
  accepted.cards.push(soloTransfer);
  assert(await submit(accepted) === true, 'packaged import above former 5 MiB limit succeeds');
  assert(JSON.stringify(state.settings.missionPlanner) === JSON.stringify(accepted.settings.missionPlanner), 'packaged import preserves confirmed custom operation');
  assert(JSON.stringify(state.cards[0].missionSelection) === JSON.stringify(accepted.cards[0].missionSelection), 'packaged import preserves historical mission identity and independent score category');
  assert(state.cards[0].planet.name === 'Legacy Planet', 'legacy planet text normalized');
  assert(state.cards[0].scoreRawBonusPercent === 0, 'pending card retains explicit zero bonus');
  assert(state.cards[1].soloScore.version===1 && JSON.stringify(state.cards[1].soloScore.result)===JSON.stringify(soloTransfer.soloScore.result), 'transactional import keeps v1 ratings until explicit recalibration');
  assert(state.cards[1].soloScore.result.axes[0]===19.7 && JSON.stringify(state.cards[1].soloScore.result.axes.slice(1))===JSON.stringify(soloTransfer.soloScore.result.axes.slice(1)), 'v1 import preserves every axis until recalibration is confirmed');
  assert(state.cards[1].stats.kills===394 && state.cards[1].soloScore.inputs.minutes===100 && state.cards[1].originalNote===soloTransfer.originalNote, 'imported entered numbers and original note survive rebalancing');
  const exportData = buildPersistedStatePayload();
  assert(JSON.stringify((await desktopStorage.loadState()).data) === JSON.stringify(exportData), 'committed disk payload equals published session');
  assert(HD2CSMTransfer.parse(HD2CSMTransfer.serialize(exportData)).items.primaries.some(row => row.retainedMetadata?.length === 6 * 1024 * 1024), 'large metadata survives matching export/import rules');
  assert(!importInProgress && !document.getElementById('appCanvas').inert, 'controls restored after transfer');
  assert(alerts.some(message => message.includes('Import stopped')) && alerts.some(message => message.includes('Import complete')), 'failure and success are explained');
  return { checks, exportData };
}
async function rendererTransferVerify(expected) {
  const checks = [];
  const assert = (ok, label) => { if (!ok) throw new Error(`TRANSFER RESTART: ${label}`); checks.push(label); };
  window.alert = () => {};
  await bootStateReady; await saveHealth.flush();
  assert(JSON.stringify(buildPersistedStatePayload()) === JSON.stringify(expected.exportData), 'exact prepared import survives process restart');
  assert(state.cards[0].scoreRawBonusPercent === 0, 'zero bonus survives restart');
  assert(state.cards[1].soloScore.version===1 && state.cards[1].soloScore.result.axes[4]===75 && state.cards[1].soloScore.result.axes[0]===19.7, 'deferred v1 rating and utility survive imported save restart without automatic upgrade');
  assert(state.items.primaries.some(row => row.retainedMetadata?.length === 6 * 1024 * 1024 && row.owned && !row.enabled), 'large custom metadata and independent ownership survive restart');
  assert(state.settings.rememberedPlayerName === 'Transfer Diver', 'imported player setting restored');
  assert(state.settings.missionPlanner.confirmation.missions[0].name === '<Observed> operation', 'custom operation name survives packaged restart');
  assert(state.cards[0].missionSelection.minutes === 40 && state.cards[0].mode === 'Blitz (12)', 'mission duration does not rewrite historical score category after restart');
  return { checks };
}
module.exports = { rendererTransferPhase, rendererTransferVerify };
