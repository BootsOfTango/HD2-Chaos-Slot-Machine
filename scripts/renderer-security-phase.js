/* Benign injection probes in an isolated profile; no external payload executes. */
async function rendererSecurityPhase() {
  await bootStateReady;
  const checks = [], violations = [];
  const check = (condition, label) => { if (!condition) throw Error(label); checks.push(label); };
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const wait = async (predicate, label) => {
    const limit = Date.now() + 5000;
    while (!predicate()) { if (Date.now() > limit) throw Error(label); await pause(25); }
  };
  const listener = event => violations.push({ directive: event.effectiveDirective, blocked: event.blockedURI });
  document.addEventListener('securitypolicyviolation', listener);
  const nodes = [], add = node => { nodes.push(node); document.body.append(node); return node; };
  try {
    check(state.items.primaries.length > 0, 'hash-authorized main script boots with equipment');
    check(document.querySelectorAll('[onclick],[onerror],[onload]').length === 0, 'no inline HTML handlers shipped');
    window.__securityProbe = 0;
    const inline = document.createElement('script'); inline.textContent = 'window.__securityProbe += 1'; add(inline);
    const button = document.createElement('button'); button.setAttribute('onclick', 'window.__securityProbe += 2'); add(button); button.click();
    const remoteScript = document.createElement('script'); remoteScript.src = 'https://example.invalid/blocked-probe.js'; add(remoteScript);
    const remoteImage = new Image(); remoteImage.src = 'https://example.invalid/blocked-probe.png'; add(remoteImage);
    const frame = document.createElement('iframe'); frame.src = 'https://example.invalid/blocked-frame'; add(frame);
    await wait(() => violations.some(v => v.directive === 'script-src-attr') && violations.some(v => v.directive === 'img-src') && violations.some(v => v.directive === 'frame-src'), 'CSP violation reports missing');
    check(window.__securityProbe === 0, 'injected inline script and event handler never execute');
    check(violations.some(v => v.directive === 'script-src-elem' && v.blocked === 'inline'), 'CSP blocks unapproved inline script');
    check(violations.some(v => v.directive === 'script-src-elem' && v.blocked.includes('example.invalid')), 'CSP blocks remote script');
    check(violations.some(v => v.directive === 'img-src'), 'CSP blocks remote image');
    check(violations.some(v => v.directive === 'frame-src'), 'CSP blocks embedded frame');

    // Exercise the real import/normalization and Results sinks, not just a
    // synthetic string escape. Keep every write inside this runner's profile.
    const original = buildPersistedStatePayload(), originalAlert = window.alert;
    window.alert = () => {};
    const submit = data => importJSONFile(new File([JSON.stringify(data)], 'security-fixture.json', { type: 'application/json' }));
    const hostileId = 'card" data-security-injected="yes';
    try {
      check(await submit({ cards: [{ id: hostileId, seed: '<img data-security-injected="yes">', difficulty: 6 }] }) === true, 'hostile-looking legacy ID remains compatible through actual import');
      check(document.querySelector('.resultSummary')?.dataset.id === hostileId, 'Results retains the literal ID in one attribute');
      check(!document.querySelector('[data-security-injected]'), 'imported ID and seed cannot inject markup into Results');
      openResultCardModal(hostileId);
      const fields = [...document.querySelectorAll('#resultCardModalBody [data-id]')];
      check(fields.length >= 10 && fields.every(field => field.dataset.id === hostileId), 'modal controls retain the exact escaped ID');
      check(!document.querySelector('[data-security-injected]'), 'imported ID cannot inject modal attributes');
      const modal = document.querySelector('#resultCardModalBody');
      let legacySelectorRejected = false;
      try { modal.querySelectorAll(`[data-id="${hostileId}"][data-k]`); }
      catch (error) { legacySelectorRejected = error.name === 'SyntaxError'; }
      check(legacySelectorRejected, 'fixture reproduces the previous raw-ID selector SyntaxError');
      const kills = modal.querySelector('[data-k="kills"]'); kills.value = '123';
      check(syncCardFromResultInputs(hostileId, modal)?.stats.kills === 123, 'quoted ID supports exact-ID stat synchronization');
      const comment = modal.querySelector('[data-k="newCommentText"]');
      const commentText = '<img data-security-injected="yes"> literal comment';
      comment.value = commentText;
      await onCardAction({ target: modal.querySelector('[data-act="addCardComment"]') });
      check(getCardById(hostileId).commentNotes[0].text === commentText, 'quoted ID supports adding a literal comment');
      check(!document.querySelector('[data-security-injected]'), 'comment text cannot inject markup');
      const draft = getMissionStatsDraft(hostileId);
      draft.majorOrderDone = true; draft.extractedSafely = true;
      await onCardAction({ target: document.querySelector('#resultCardModalBody [data-act="saveCard"]') });
      check(state.ui.finalizeStatsModalOpen === true, 'quoted ID passes required-stat checks and opens finalization');
      confirmFinalizeActiveCardStats();
      check(getCardById(hostileId).statsLocked === true, 'quoted ID supports finalizing its own Results record');
      closeResultCardModal();

      const marker = '<img data-security-injected="yes"><svg onload="window.__securityProbe=99"></svg> & "text"';
      const stats = { kills: 123, accuracy: 85, deaths: 1, stims: 2, bulletCount: 600, stratUses: 12, distanceKm: 3, blueSideObjCount: 1, extractedSafely: true };
      const card = { id: 'markup-a', difficulty: 6, seed: marker, playerName: marker, primary: marker, sidearm: marker,
        throwable: marker, booster: marker, stratagems: [marker], mode: marker, faction: marker,
        originalNote: marker, commentNotes: [{ text: marker }], majorOrderDone: true,
        statsLocked: true, stats, lockedStatsSnapshot: stats,
        planet: { name: marker, sector: marker, biome: marker, weather: marker } };
      check(await submit({ cards: [card, { ...card, id: 'markup-b' }] }) === true, 'markup-like saved fields import as ordinary data');
      const a = getCardById('markup-a'), b = getCardById('markup-b');
      const noMarkup = label => check(!document.querySelector('[data-security-injected], svg[onload]'), label);
      check(a.seed === marker && a.originalNote === marker && a.primary === marker, 'import preserves literal names and notes rather than deleting text');
      noMarkup('Results escapes imported text across loadout and metadata');
      openResultCardModal(a.id);
      check(document.querySelector('#resultCardModalBody [data-k="originalNote"]').value === marker, 'modal textarea preserves the literal original note');
      noMarkup('modal loadout, environment and comments remain text'); closeResultCardModal();
      renderRankDetailPanel(a, 1, getRadarMaxes(state.cards)); renderRankFallbackList(state.cards); renderItemInsights(state.cards);
      noMarkup('Rank detail, rows and item insights escape imported text');
      buildCompareRadar(a, b); buildOverlayRadar();
      const tooltip = add(document.createElement('div')); tooltip.innerHTML = buildCompareCardHoverTipHtml(a);
      noMarkup('Compare radar, overlay and hover markup escape imported text');
      const exportPreview = add(document.createElement('div')); exportPreview.innerHTML = discordCardMarkup(a);
      noMarkup('image-export markup escapes imported text');
      check(exportPreview.textContent.includes(marker), 'image-export markup retains literal text');
      renderApiActivePlanetsRows([{ name: marker, faction: marker, sector: marker, biome: marker }]);
      noMarkup('live-planet row names and metadata cannot inject markup');
      check(document.querySelector('#apiActivePlanetsList').textContent.includes(marker), 'live planet text remains readable literally');
      check(window.__securityProbe === 0, 'all data-rendering probes leave script sentinel unchanged');
    } finally {
      await submit(original); window.alert = originalAlert;
    }

    const fallback = add(new Image());
    fallback.dataset.fallbackSrc = 'assets/placeholders/rank-tiers/cadet-placeholder.svg';
    fallback.src = 'assets/missing-security-probe.png';
    await wait(() => fallback.complete && fallback.naturalWidth > 0, 'rank fallback did not load');
    check(fallback.src.endsWith('/cadet-placeholder.svg'), 'packaged rank fallback loads without inline handler');
    const broken = add(new Image()); broken.dataset.itemVisual = 'true'; broken.src = 'assets/missing-item-security-probe.png';
    await wait(() => !broken.isConnected, 'broken item did not settle');
    check(document.querySelector('.itemVisualFallback')?.textContent === 'N/A', 'broken item settles to safe text');
    const invalid = add(new Image()); invalid.dataset.fallbackSrc = 'https://example.invalid/disallowed-fallback.png'; invalid.src = 'assets/missing-fallback-probe.png';
    await wait(() => !invalid.isConnected, 'remote fallback did not settle');
    check(!invalid.isConnected, 'remote fallback is refused rather than retried');

    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 2;
    const data = add(new Image()); data.src = canvas.toDataURL('image/png');
    await wait(() => data.naturalWidth === 2, 'data image blocked');
    check(data.naturalWidth === 2, 'local data images still decode');
    const blob = await new Promise(resolve => canvas.toBlob(resolve));
    const objectUrl = URL.createObjectURL(blob);
    try {
      const image = add(new Image()); image.src = objectUrl;
      await wait(() => image.naturalWidth === 2, 'blob image blocked');
      check(image.naturalWidth === 2, 'local blob images still decode');
    } finally { URL.revokeObjectURL(objectUrl); }
    await preloadItemVisuals();
    for (const [slot, type] of [['primaries','primary'], ['sidearms','sidearm'], ['throwables','throwable'], ['boosters','booster']]) {
      const visual = getItemVisual(state.items[slot][0].name, type);
      check(visual.src.startsWith('assets/') && !visual.fallbackSrc, `${type} uses local artwork with no remote fallback`);
      const img = add(new Image()); img.src = visual.src;
      await wait(() => img.complete && img.naturalWidth > 0, `${type} image failed`);
      check(img.naturalWidth > 0, `${type} bundled image decodes`);
    }
    return { checks, violations };
  } catch (error) {
    // DOMExceptions may lose their properties across Electron's execution bridge.
    throw new Error(`${error?.name || 'Error'}: ${error?.message || String(error)}`);
  } finally {
    nodes.forEach(node => node.remove());
    document.removeEventListener('securitypolicyviolation', listener);
    delete window.__securityProbe;
  }
}
module.exports = { rendererSecurityPhase };
