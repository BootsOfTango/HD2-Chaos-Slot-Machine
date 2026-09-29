'use strict';
// Explicit read-only developer probe. Not shipped or run automatically at startup.
const map = require('../assets/galaxy-map-model');
const war = require('../assets/war-snapshot');
const assert = require('node:assert/strict');
if (process.argv.length !== 3 || process.argv[2] !== '--live') throw Error('Use --live for two read-only community API requests.');
async function get(endpoint) {
  const response = await fetch('https://api.helldivers2.dev/api/v1/' + endpoint, {
    signal: AbortSignal.timeout(15000), redirect: 'error',
    headers: { 'X-Super-Client': 'HD2-Chaos-Slot-Machine-local-map-review',
      'X-Super-Contact': 'https://github.com/BootsOfTango/Helldivers-2-Roulette', 'Accept-Language': 'en-US' }
  });
  if (!response.ok) throw Error(endpoint + ' HTTP ' + response.status);
  let size = 0; const chunks = [];
  for await (const chunk of response.body) {
    size += chunk.byteLength; if (size > 8 * 1024 * 1024) throw Error('Response exceeds bounded probe size');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
(async () => {
  const rawAtlas = await get('planets'), atlasAt = Date.now();
  const atlas = map.normalizeAtlas(rawAtlas, { now: atlasAt });
  const rawCampaigns = await get('campaigns'), now = Date.now();
  const snapshot = war.normalizeCampaigns(rawCampaigns, { now });
  const model = map.build({ atlas, snapshot, now });
  for (const key of model.selectableKeys) assert.ok(map.selectPlanet(key, { snapshot, now }));
  assert.equal(model.exactMissionAvailability, false);
  const anchorIds = [0,34,64,97,196,260];
  console.log(JSON.stringify({ checkedAt: new Date(now).toISOString(), passed: true,
    atlasPlanets: atlas.planets.length, campaignPlanets: snapshot.planets.length,
    selectable: model.selectableKeys.length, unplaced: model.unplacedKeys.length,
    issues: model.issues, atlasIssues: atlas.issues,
    anchors: model.planets.filter(p => anchorIds.includes(p.id)).map(p => ({id:p.id,name:p.name,position:p.position,screen:p.screen})),
    note: 'One read-only observation. Not exact in-game mission or sector-boundary verification.' },null,2));
})().catch(error => { console.error(error.message); process.exitCode=1; });
