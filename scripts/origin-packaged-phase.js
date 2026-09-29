async function originPackagedPhase(mode, expected) {
  await bootStateReady;
  const checks = [], check = (ok, label) => { if (!ok) throw Error(label); checks.push(label); };
  const p = 'hd2_chaos_slot_machine_v1', b = 'hd2_chaos_slot_machine_backup_v1';
  if (mode === 'seed') {
    check(location.protocol === 'file:', 'actual previous EXE uses old file origin');
    const data = { cards: [{ id: 'packaged-origin', seed: 'Old EXE origin fixture', difficulty: 6 }], settings: { rememberedPlayerName: 'Origin Player' } };
    localStorage.setItem(p, JSON.stringify(data)); localStorage.setItem(b, JSON.stringify(data));
    localStorage.setItem('hd2_items_view_mode', 'category');
    const saved = await chaosSlotMachine.saveState({ ...data, cards: [{ ...data.cards[0], id: 'packaged-native' }] });
    check(saved.ok, 'actual previous EXE creates valid native fixture');
    return { checks, source: Object.fromEntries(expected.keys.flatMap(k => localStorage.getItem(k) === null ? [] : [[k, localStorage.getItem(k)]])) };
  }
  check(location.href === 'hd2-slot://app/index.html', 'packaged main uses restricted origin');
  check(!saveHealth.status().blocked, 'packaged migrated save is usable');
  if (mode === 'stage') {
    for (const key of expected.keys) localStorage.removeItem(key);
    localStorage.removeItem('hd2_origin_copy_v1');
    localStorage.setItem(p, expected.source[p]);
    check(localStorage.getItem(b) === null, 'partial destination fixture leaves backup pending');
    return { checks };
  }
  check(state.cards[0]?.id === expected.id, 'packaged save precedence and restart correct');
  check(localStorage.getItem(b) === expected.source[b], 'origin backup copied, including pending-plan completion');
  check(localStorage.getItem('hd2_origin_copy_v1') === '1', 'origin completion marker present');
  if (mode === 'restart') check(localStorage.getItem('hd2_items_view_mode') === 'warbond', 'new preference survives packaged restart');
  else localStorage.setItem('hd2_items_view_mode', 'warbond');
  check((await saveState()) !== false, 'packaged migrated state remains saveable');
  for (const resource of ['electron/main.js','package.json','.test-data/private.json','assets/not-runtime.js']) {
    check((await fetch(resource)).status === 403, 'packaged private resource denied: ' + resource);
  }
  check((await fetch('assets/item-catalog.json')).ok, 'packaged catalog loads through restricted resource route');
  check((await fetch('assets/desktop-window.css')).headers.get('content-type').startsWith('text/css'), 'packaged desktop CSS has correct MIME');
  return { checks };
}
module.exports = { originPackagedPhase };
