// Run the real packaged EXE through its Chromium debugging protocol. This file
// is not included in the app. It never reads or modifies the user's normal save.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { acquireDesktopTestLock, observeExit, writeDurable, writeJson } = require('./desktop-test-safety');
const { resolvePackagedTestTarget } = require('./packaged-test-target');
const { rendererWritePhase, rendererVerifyPhase, rendererNetworkPhase, rendererWarCacheVerify, rendererMissionLifecyclePhase } = require('./electron-smoke-phase');
const { rendererGearPhase, rendererGearVerify } = require('./gear-smoke-phase');
const { rendererSourceAuditPhase, rendererSourceAuditVerify } = require('./source-audit-smoke-phase');
const { rendererDedupPhase, rendererDedupVerify, rendererDedupSeed, rendererDedupUpgradeVerify } = require('./dedup-smoke-phase');
const { rendererWarbondPhase, rendererWarbondVerify } = require('./warbond-smoke-phase');
const { rendererTransferPhase, rendererTransferVerify } = require('./transfer-smoke-phase');
const { rendererCardRulesPhase, rendererCardRulesVerify } = require('./card-rules-smoke-phase');
const { rendererSecurityPhase } = require('./renderer-security-phase');
const { rendererActivitySoak } = require('./activity-soak-phase');
const { originPackagedPhase } = require('./origin-packaged-phase');
const identityReview = require('../assets/catalog-reviews/2026-09-14-identity-merges.json');
const root = path.resolve(__dirname, '..');
const gearOnly = process.argv.includes('--gear');
const sourceOnly = process.argv.includes('--sources');
const dedupOnly = process.argv.includes('--dedup');
const acquisitionOnly = process.argv.includes('--acquisition');
const acquisitionBatchOption = process.argv.find(value => value.startsWith('--acquisition-batch='));
const acquisitionBatch = acquisitionBatchOption?.split('=')[1] || 'support-weapon';
if (!['orbital-eagle', 'defensive', 'backpack-vehicle', 'support-weapon'].includes(acquisitionBatch) || (acquisitionBatchOption && !acquisitionOnly)) throw new Error('--acquisition-batch=orbital-eagle|defensive|backpack-vehicle|support-weapon is supported only with --acquisition.');
if (acquisitionOnly && process.argv.includes('--warbonds')) throw new Error('Choose either --acquisition or --warbonds.');
const warbondOnly = process.argv.includes('--warbonds') || acquisitionOnly;
const transferOnly = process.argv.includes('--transfer');
const cardRulesOnly = process.argv.includes('--card-rules');
const securityOnly = process.argv.includes('--security');
const activitySoakOnly = process.argv.includes('--activity-soak');
const originOnly = process.argv.includes('--origin');
const warbondBatchOption = process.argv.find(value => value.startsWith('--warbond-batch='));
const warbondBatch = warbondBatchOption?.split('=')[1] || '8';
if (!['2', '3', '4', '5', '6', '7', '8'].includes(warbondBatch) || (warbondBatchOption && (!warbondOnly || acquisitionOnly))) throw new Error('--warbond-batch=2|3|4|5|6|7|8 is supported only with --warbonds.');
const reviewFile = acquisitionOnly ? `2026-09-15-${acquisitionBatch}.json` : warbondBatch === '8' ? '2026-09-15-warbonds-8.json' : warbondBatch === '2' ? '2026-09-14-warbonds.json' : `2026-09-14-warbonds-${warbondBatch}.json`;
const warbondReview = warbondOnly ? require(`../assets/catalog-reviews/${reviewFile}`) : null;
if ([gearOnly, sourceOnly, dedupOnly, warbondOnly, transferOnly, securityOnly, originOnly, activitySoakOnly].filter(Boolean).length > 1) throw new Error('Choose only one focused smoke mode.');
const executable = resolvePackagedTestTarget(process.argv.slice(2));
const expectedElectron = process.argv.find(arg => arg.startsWith('--expected-electron='))?.split('=')[1];
if (expectedElectron !== undefined && !/^\d+\.\d+\.\d+$/.test(expectedElectron)) throw new Error('Expected Electron must be an exact stable version.');
const runRoot = path.join(root, '.test-data', `${activitySoakOnly ? 'packaged-activity-soak' : securityOnly ? 'packaged-security' : acquisitionOnly ? 'packaged-acquisition' : transferOnly ? 'packaged-transfer' : warbondOnly ? 'packaged-warbonds' : dedupOnly ? 'packaged-dedup' : sourceOnly ? 'packaged-sources' : gearOnly ? 'packaged-gear' : 'packaged-smoke'}-${Date.now()}`);
const userData = path.join(runRoot, 'user-data');
fs.mkdirSync(runRoot, { recursive: true });

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let desktopLock;
async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.close(); reject(new Error('CDP connection timed out.')); }, 10000);
    socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener('error', error => { clearTimeout(timer); reject(error); }, { once: true });
  });
  let id = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject, timer } = pending.get(message.id);
      clearTimeout(timer);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled') {
      const text = message.params.args.map(arg => arg.value || arg.description || '').join(' ');
      if (/^(SMOKE|GEAR SMOKE|GEAR RESTART) PASS:/.test(text) || (process.argv.includes('--verbose') && /^SOURCE AUDIT (SMOKE|RESTART) PASS:/.test(text))) console.log(text);
    }
  });
  socket.addEventListener('close', () => {
    for (const entry of pending.values()) { clearTimeout(entry.timer); entry.reject(new Error('CDP connection closed')); }
    pending.clear();
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`CDP timeout: ${method}`)); }, 120000);
    pending.set(requestId, { resolve, reject, timer });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
  return { send, errors, close: () => socket.close(), evaluate: async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  } };
}

async function phase(name, expected, launch = {}) {
  const phaseUserData = launch.userData || userData;
  const phaseExecutable = launch.executable || executable;
  const env = { ...process.env, HD2CSM_USER_DATA_DIR: phaseUserData, HD2CSM_AUTOMATION: '1' };
  if (name === 'normal-startup') delete env.HD2CSM_AUTOMATION;
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.HD2_ELECTRON_TEST_HARNESS;
  // Also protect preserved older EXEs used by migration checks.
  const args = ['--disable-gpu', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', '--autoplay-policy=no-user-gesture-required'];
  // An app-local unreachable proxy blocks network from the very first request.
  if (name !== 'network') args.push('--proxy-server=http://127.0.0.1:9');
  desktopLock.prepareLaunch();
  const child = spawn(phaseExecutable, args, { cwd: path.dirname(phaseExecutable), env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const exit = observeExit(child);
  desktopLock.track(child);
  let output = '';
  child.stdout.on('data', chunk => { output += chunk.toString(); });
  child.stderr.on('data', chunk => { output += chunk.toString(); });
  child.on('error', error => { output += error.stack; });
  let client;
  let phaseResult;
  try {
    // Cold packaged startup can include origin migration and first-run scanning.
    // Keep this bounded, but do not confuse the old 20-second budget with an app crash.
    const deadline = Date.now() + 60000;
    let port;
    while (Date.now() < deadline && !port) {
      const match = output.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/);
      if (match) port = match[1];
      if (!port) await delay(100);
    }
    if (!port) throw new Error(`No packaged debug endpoint appeared. ${output}`);
    let target;
    while (Date.now() < deadline && !target) {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = targets.find(item => item.type === 'page' && (item.url === 'hd2-slot://app/index.html' || (item.url.startsWith('file:') && /\/index\.html$/.test(item.url))));
      if (!target) await delay(100);
    }
    if (!target) throw new Error('Packaged renderer did not load its local HTML.');
    client = await connect(target.webSocketDebuggerUrl);
    const runtimeVersion = await client.send('Browser.getVersion');
    writeJson(path.join(runRoot, name + '-runtime.json'), runtimeVersion);
    if (expectedElectron && phaseExecutable === executable &&
        !runtimeVersion.userAgent.includes('Electron/' + expectedElectron + ' ')) {
      throw new Error('Candidate Electron version mismatch: ' + runtimeVersion.userAgent);
    }
    await client.send('Runtime.enable');
    await client.send('Page.enable');
    await client.evaluate(`(async () => { while (typeof bootStateReady === 'undefined') await new Promise(r => setTimeout(r, 50)); await bootStateReady; })()`);
    if (name !== 'dedup-seed') {
      const info = await client.evaluate('chaosSlotMachine.getAppInfo()');
      if (info.renderingMode !== 'software' || info.hardwareAccelerationDisabled !== true ||
          !String(info.gpuFeatureStatus?.gpu_compositing).startsWith('disabled')) {
        throw new Error('This EXE did not verify software rendering. Do not run further desktop tests.');
      }
    }
    const result = name === 'card-rules-write'
      ? await client.evaluate(`(${rendererCardRulesPhase.toString()})(${JSON.stringify(require('../test/fixtures/card-compatibility.json'))})`)
      : name === 'card-rules-verify'
      ? await client.evaluate(`(${rendererCardRulesVerify.toString()})(${JSON.stringify(expected)})`)
      : name.startsWith('origin-')
      ? await client.evaluate(`(${originPackagedPhase.toString()})(${JSON.stringify(launch.originMode)}, ${JSON.stringify(expected)})`)
      : name.startsWith('activity-')
      ? await client.evaluate(`(${rendererActivitySoak.toString()})(${JSON.stringify(name==='activity-soak'?'start':'restart')}, ${JSON.stringify(expected)})`)
      : name === 'war-soak'
      ? await client.evaluate(`(async () => {
          await bootStateReady; await loadAndRenderApiActivePlanets({manual:false}); warService.stop();
          window.__warSoak = { calls:0, started:performance.now(), cards:JSON.stringify(state.cards) };
          warService = HD2WarRefresh.createService({ bundledPlanets:DEFAULTS.items.planets, bundleVersion:'soak',
            fetchImpl:async () => { window.__warSoak.calls++; return {ok:true,json:async () => [{id:7000,faction:'Humans',
              planet:{index:7000,name:'Soak Planet',currentOwner:'Terminids',event:null}}]}; } });
          warService.subscribe(() => renderWarDataStatus());
          await warService.start();
          state.current.loadout = rollLoadout(null); state.current.locked = true;
          state.current.planet = rollAvailablePlanet(); state.current.planetConfirmed = true;
          window.__warSoak.current = JSON.stringify(state.current);
          switchTab('spin'); renderSpin();
          return { checks:[] };
        })()`)
      : name === 'security'
      ? await client.evaluate(`(${rendererSecurityPhase.toString()})()`)
      : name === 'transfer-write'
      ? await client.evaluate(`(${rendererTransferPhase.toString()})()`)
      : name === 'transfer-verify'
        ? await client.evaluate(`(${rendererTransferVerify.toString()})(${JSON.stringify(expected)})`)
      : name === 'warbond-write'
      ? await client.evaluate(`(${rendererWarbondPhase.toString()})(${JSON.stringify(warbondReview)})`)
      : name === 'warbond-verify'
        ? await client.evaluate(`(${rendererWarbondVerify.toString()})(${JSON.stringify(expected)})`)
      : name === 'dedup-seed'
      ? await client.evaluate(`(${rendererDedupSeed.toString()})(${JSON.stringify(expected)})`)
      : name === 'dedup-upgrade'
        ? await client.evaluate(`(${rendererDedupUpgradeVerify.toString()})(${JSON.stringify(expected)}, ${JSON.stringify(require('../package.json').version)})`)
      : name === 'dedup-write'
      ? await client.evaluate(`(${rendererDedupPhase.toString()})()`)
      : name === 'dedup-verify'
        ? await client.evaluate(`(${rendererDedupVerify.toString()})(${JSON.stringify(expected)})`)
      : name === 'source-write'
      ? await client.evaluate(`(${rendererSourceAuditPhase.toString()})(${JSON.stringify(require('../assets/catalog-reviews/2026-09-14.json'))}, ${JSON.stringify(identityReview)})`)
      : name === 'source-verify'
        ? await client.evaluate(`(${rendererSourceAuditVerify.toString()})(${JSON.stringify(expected)})`)
      : name === 'gear-write'
      ? await client.evaluate(`(${rendererGearPhase.toString()})(${JSON.stringify(identityReview)})`)
      : name === 'gear-verify'
        ? await client.evaluate(`(${rendererGearVerify.toString()})(${JSON.stringify(expected)})`)
      : name === 'normal-startup'
      ? await client.evaluate(`(async () => {
          const checks = [];
          const assert = (ok, label) => { if (!ok) throw new Error(label); checks.push(label); };
          assert(!chaosSlotMachine.isTestHarness, 'packaged normal launch has automation mode disabled');
          assert(!document.querySelector('#fanNotice').hidden, 'normal packaged launch shows the session-only fan credit');
          assert((await chaosSlotMachine.getWindowState()).isFullscreen, 'packaged normal launch starts in true fullscreen');
          assert(document.querySelector('#appCanvas').getBoundingClientRect().width >= 1280, 'packaged desktop canvas is at least1280 CSS pixels');
          await chaosSlotMachine.setFullscreen(false);
          await new Promise(r => setTimeout(r, 300));
          assert(!(await chaosSlotMachine.getWindowState()).isFullscreen, 'packaged window can exit fullscreen');
          assert(document.querySelector('#btnToggleFullscreen').getAttribute('aria-pressed') === 'false', 'packaged toolbar reflects windowed state');
          document.querySelector('#btnToggleFullscreen').click();
          await new Promise(r => setTimeout(r, 300));
          assert((await chaosSlotMachine.getWindowState()).isFullscreen, 'packaged toolbar reenters fullscreen');
          assert(state.cards.length > 0, 'normal packaged launch retains isolated saved Results');
          return { checks };
        })()`)
      : name === 'write'
      ? await client.evaluate(`(async () => { const missionLifecycle = await (${rendererMissionLifecyclePhase.toString()})(); const result = await (${rendererWritePhase.toString()})({skipNativeDialogs:true}); return {...result, missionLifecycle}; })()`)
      : name === 'verify'
        ? await client.evaluate(`(${rendererVerifyPhase.toString()})(${JSON.stringify(expected)})`)
        : name === 'war-cache-verify' ? await client.evaluate(`(${rendererWarCacheVerify.toString()})()`)
        : await client.evaluate(`(${rendererNetworkPhase.toString()})()`);
    if (name === 'card-rules-write') {
      const shot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
      writeDurable(path.join(runRoot,'card-rules.png'),Buffer.from(shot.data,'base64'));
      await client.evaluate(`document.querySelector('#cardRulesDialog button').click()`);
    }
    if (name === 'activity-soak') {
      const deadline=Date.now()+335000;let observed,lastLog=0;
      do {
        await delay(5000);
        observed=await client.evaluate(`(${rendererActivitySoak.toString()})('poll')`);
        if(Date.now()-lastLog>45000){console.log('ACTIVITY SOAK: '+JSON.stringify(observed));lastLog=Date.now();}
        if(!observed.sameCurrent||!observed.sameCards)throw Error('Activity soak changed saved run data');
      }while(observed.statusCount<2&&Date.now()<deadline);
      const finished=await client.evaluate(`(${rendererActivitySoak.toString()})('finish')`);
      const initialChecks=result.checks;Object.assign(result,finished);result.checks=[...initialChecks,...finished.checks];
    }
    if (name === 'transfer-write') {
      await client.evaluate(`switchTab('results'); renderResults(); document.querySelector('.resultSummary').scrollIntoView({block:'center'});`);
      await delay(350);
      const missionResult = await client.send('Page.captureScreenshot', {format:'png',captureBeyondViewport:false});
      writeDurable(path.join(runRoot,'mission-result.png'),Buffer.from(missionResult.data,'base64'));
      await client.evaluate(`openResultCardModal(state.cards[0].id);`);
      await delay(350);
      const missionDetail = await client.send('Page.captureScreenshot', {format:'png',captureBeyondViewport:false});
      writeDurable(path.join(runRoot,'mission-detail.png'),Buffer.from(missionDetail.data,'base64'));
      await client.evaluate(`document.getElementById('btnCloseResultModal').click();`);
    }
    if (name === 'war-soak') {
      const deadline = Date.now() + 330000;
      let lastLog = 0, observed;
      do {
        await delay(1000);
        observed = await client.evaluate(`({calls:window.__warSoak.calls,elapsed:performance.now()-window.__warSoak.started,
          active:warService.getState().active,fresh:warService.getState().status.state,
          sameCurrent:JSON.stringify(state.current)===window.__warSoak.current,
          sameCards:JSON.stringify(state.cards)===window.__warSoak.cards})`);
        if (Date.now() - lastLog > 55000) { console.log('WAR SOAK: ' + JSON.stringify(observed)); lastLog = Date.now(); }
      } while (observed.calls < 2 && Date.now() < deadline);
      if (observed.calls !== 2 || observed.elapsed < 300000 || !observed.active || observed.fresh !== 'fresh' || !observed.sameCurrent || !observed.sameCards) {
        throw Error('Five-minute packaged soak failed: ' + JSON.stringify(observed));
      }
      result.checks.push('real five-minute timer fires in packaged renderer', 'exactly one automatic follow-up fetch',
        'visible service remains active', 'refreshed status is fresh', 'confirmed run remains byte-identical', 'Results remain byte-identical');
      result.observed = observed;
      const screenshot = await client.send('Page.captureScreenshot', {format:'png',captureBeyondViewport:false});
      writeDurable(path.join(runRoot,'war-soak.png'),Buffer.from(screenshot.data,'base64'));
      await client.evaluate('warService.stop()');
    }
    if (name === 'security') {
      result.runtime = await client.send('Browser.getVersion');
      const expectedRuntime = require('../package.json').devDependencies.electron;
      if (!result.runtime.userAgent.includes(`Electron/${expectedRuntime}`)) throw Error('Unexpected packaged Electron runtime');
      result.checks.push(`packaged runtime reports Electron ${expectedRuntime}`);
    }
    if (name === 'write') {
      // Isolated screenshot fixture; restore selection and planner before saving/restart checks.
      await client.evaluate(`window.__missionArtReview={current:deepClone(state.current),planner:deepClone(state.settings.missionPlanner)};
        switchTab('spin');state.current.loadout=rollLoadout('Mission icon review');state.current.loadout.stratagems[0]='40-K Meltagun';state.current.locked=true;
        state.current.difficultySelected=true;state.current.difficulty=5;state.current.modeConfirmed=false;
        state.current.planetLocked=true;state.current.planetConfirmed=true;state.current.spinning=false;
        state.current.planet=getPlanetPoolSource().find(p=>normalizeFactionName(p.faction)==='Automatons');
        state.current.faction='Automatons';state.current.missionSelection=null;
        state.settings.missionPlanner={version:1,confirmation:null};renderSpin();
        missionUI.apply('mission:launch-icbm');document.querySelector('#missionPlannerPanel').scrollIntoView({block:'center'});`);
      await delay(300);
      const missionArt = await client.evaluate(`(()=>{const hero=document.querySelector('.missionHero img');return {src:hero.getAttribute('src'),title:hero.title,decoded:hero.complete&&hero.naturalWidth>0};})()`);
      if(missionArt.src!=='assets/missions/game-icons/launch-icbm.png'||!missionArt.decoded||!missionArt.title.includes('screenshot crop'))throw Error('Packaged mission art mismatch: '+JSON.stringify(missionArt));
      result.checks.push('packaged selected mission displays its decoded exact game screenshot crop');
      const missionArtShot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
      writeDurable(path.join(runRoot,'mission-game-icons.png'),Buffer.from(missionArtShot.data,'base64'));
      for (const [faction, ids, shot, difficulty = 5] of [
        ['Illuminate',['defend-evacuation-site','repel-invasion-fleet'],'final-defense-game-icons'],
        ['Illuminate',['blitz-illuminate-gateways','democratize-the-void','infiltrate-illuminate-lair','blitz-toxic-pollination'],'final-void-game-icons',10],
        ['Automatons',['rapid-acquisition'],'final-acquisition-game-icon'],
        ['Illuminate',['destroy-harvesters'],'harvester-game-icon',3],
        ['Terminids',['nuke-nursery','chart-terminid-tunnels'],'nursery-tunnels-game-icons'],
        ['Automatons',['eradicate-automatons','evacuate-high-value-assets'],'defense-game-icons'],
        ['Terminids',['eradicate-terminids'],'terminid-eradicate-game-icon'],
        ['Automatons',['commando-acquire-evidence','commando-extract-intel','commando-secure-black-box'],'commando-game-icons'],
        ['Illuminate',['evacuate-colonists','take-down-overship','free-colony','extract-anomalous-material','destroy-exospire','destroy-gazer-spire'],'illuminate-game-icons']
      ]) {
        await client.evaluate(`(async()=>{state.current.planet=getPlanetPoolSource().find(p=>normalizeFactionName(p.faction)===${JSON.stringify(faction)});
          state.current.faction=${JSON.stringify(faction)};state.current.difficulty=${JSON.stringify(difficulty)};state.current.missionSelection=null;state.settings.missionPlanner={version:1,confirmation:null};renderSpin();
          const catalog=await(await fetch('assets/mission-catalog.json')).json();
          const choices=${JSON.stringify(ids)}.map(id=>({kind:'catalog',id:'mission:'+id}));
          state.settings.missionPlanner.confirmation=HD2MissionSelection.createEngine(catalog).confirm(missionUI.info().context,choices);
          renderSpin();missionUI.apply(choices[0].id);document.querySelector('#missionPlannerPanel').scrollIntoView({block:'center'});
          await Promise.all([...document.querySelectorAll('#missionChoices img')].map(img=>img.decode()));})()`);
        const visible=await client.evaluate(`([...document.querySelectorAll('#missionChoices button')].map(b=>({id:b.dataset.choiceId,src:b.querySelector('img').getAttribute('src'),width:b.querySelector('img').naturalWidth})))`);
        if(visible.length!==ids.length||visible.some(row=>!ids.includes(row.id.slice(8))||row.src!=='assets/missions/game-icons/'+row.id.slice(8)+'.png'||!row.width))throw Error('New mission artwork fixture mismatch: '+JSON.stringify(visible));
        result.checks.push(shot+': exact in-game crops render for all confirmed mission choices');
        const newArtShot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        writeDurable(path.join(runRoot,shot+'.png'),Buffer.from(newArtShot.data,'base64'));
      }
      await client.evaluate(`state.current=window.__missionArtReview.current;state.settings.missionPlanner=window.__missionArtReview.planner;delete window.__missionArtReview;renderSpin();`);
      if(await client.evaluate(`typeof galaxyApp !== 'undefined' && !!galaxyApp`)){
        await client.evaluate(`window.__packagedGalaxyCurrent=deepClone(state.current);switchTab('spin');state.current.loadout=rollLoadout('Packaged map review');state.current.locked=true;state.current.difficultySelected=true;state.current.modeConfirmed=false;state.current.planetConfirmed=false;state.current.spinning=false;state.current.planet=getPlanetPoolSource()[0];renderSpin();openGalaxyMap();`);
        // Prior workflow deliberately searches a single planet; clear only view
        // filters before asserting/capturing the complete offline atlas.
        await client.evaluate(`(()=>{const search=document.querySelector('#galaxyMapHost .gm-search');search.value='';search.dispatchEvent(new Event('input'));const sector=document.querySelector('#galaxyMapHost .gm-sector-select');sector.value='';sector.dispatchEvent(new Event('change'));const eligible=document.querySelector('#galaxyMapHost .gm-eligible-filter input');eligible.checked=false;eligible.dispatchEvent(new Event('change'));})()`);
        const mapState=await client.evaluate(`({open:document.getElementById('galaxyDialog').open,markers:document.querySelectorAll('#galaxyMapHost .gm-marker').length,sectors:document.querySelectorAll('#galaxyMapHost .gm-sector-select option').length-1,count:document.querySelector('#galaxyMapHost .gm-count').textContent})`);
        if(!mapState.open||mapState.markers!==273||mapState.sectors!==56||!mapState.count.includes('274'))throw Error('Packaged offline atlas mismatch: '+JSON.stringify(mapState));
        await delay(400);
        const mapShot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        writeDurable(path.join(runRoot,'galaxy-map.png'),Buffer.from(mapShot.data,'base64'));
        result.galaxyMap=mapState;
        await client.evaluate(`galaxyApp.close();state.current=window.__packagedGalaxyCurrent;delete window.__packagedGalaxyCurrent;renderSpin();`);
      }
      if (result.guidedId) {
        await client.evaluate(`openResultCardModal(${JSON.stringify(result.guidedId)});`);
        await delay(350);
        await client.evaluate(`document.querySelector('.cardPlanetVisual')?.scrollIntoView({block:'center'});`);
        await delay(200);
        const cardShot = await client.send('Page.captureScreenshot', {format:'png',captureBeyondViewport:false});
        writeDurable(path.join(runRoot,'saved-card-planet.png'),Buffer.from(cardShot.data,'base64'));
        await client.send('Emulation.setDeviceMetricsOverride',{width:640,height:480,deviceScaleFactor:1,mobile:false});
        await client.evaluate(`document.querySelector('.cardPlanetVisual').scrollIntoView({block:'center'});`);
        await delay(250);
        const smallPlanet = await client.evaluate(`(()=>{const el=document.querySelector('.cardPlanetVisual'),r=el.getBoundingClientRect();return {visible:r.left>=0&&r.right<=innerWidth,overflow:el.scrollWidth>el.clientWidth,columns:getComputedStyle(el).gridTemplateColumns.split(' ').length};})()`);
        if(!smallPlanet.visible || smallPlanet.overflow || smallPlanet.columns!==1)throw Error('Saved planet narrow viewport layout: '+JSON.stringify(smallPlanet));
        result.checks.push('saved planet panel stacks without horizontal overflow at emulated 640x480');
        const smallShot = await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        writeDurable(path.join(runRoot,'saved-card-planet-small.png'),Buffer.from(smallShot.data,'base64'));
        await client.send('Emulation.clearDeviceMetricsOverride');
        await client.evaluate('closeResultCardModal();');
        const miniBounds = await client.evaluate(`(async()=>{
          const before=JSON.stringify(state.cards),fixture=document.createElement('div');
          fixture.id='miniMapReviewFixture';fixture.style.cssText='position:fixed;left:20px;top:50px;width:760px;padding:16px;background:#090e13;z-index:999999';
          const anchor=document.createElement('div');anchor.className='modalLoadoutGrid';fixture.append(anchor);document.body.append(fixture);
          HD2CardPlanet.mount(fixture,{planet:{name:'GENESIS PRIME',sector:'Rictus',biome:'Ionic Jungle'},faction:'Illuminate'});
          for(let i=0;i<100&&!fixture.querySelector('.cardPlanetRoute');i++)await new Promise(r=>setTimeout(r,30));
          if(!fixture.querySelector('.cardPlanetSector')||!fixture.querySelector('.cardPlanetRoute')||!fixture.querySelector('.cardPlanetSectorName').textContent.includes('RICTUS'))throw Error('Reported Genesis Prime locator lacks sector detail');
          if(JSON.stringify(state.cards)!==before)throw Error('Locator fixture mutated history');
          const r=fixture.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1};
        })()`);
        const miniShot=await client.send('Page.captureScreenshot',{format:'png',clip:miniBounds});
        writeDurable(path.join(runRoot,'genesis-sector-detail.png'),Buffer.from(miniShot.data,'base64'));
        await client.evaluate("document.getElementById('miniMapReviewFixture').remove()");
        result.checks.push('reported Genesis Prime locator renders sector shading, reference routes and label without editing cards');
      }
      // Only this isolated profile: the normal-startup check skips the one-time
      // informational alert, not the application's normal startup/window path.
      await client.evaluate(`localStorage.setItem(FIRST_BACKUP_WARNING_KEY, '1')`);
      for (const tab of ['spin', 'results', 'compare', 'items', 'rank']) {
        await client.evaluate(`switchTab('${tab}'); document.querySelector('#appViewport').scrollTo(0,0);`);
        await delay(350);
        const screenshot = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        writeDurable(path.join(runRoot, `${tab}.png`), Buffer.from(screenshot.data, 'base64'));
      }
      // Reproduce the user's reported images using real slot rendering, without
      // editing saved cards or the normal user's profile.
      await client.evaluate(`(async () => {
        switchTab('spin');
        const samples = [['slotPrimary','BR-14 Adjudicator','primary'], ['slotSidearm','CQC-19 Machete','sidearm'], ['slotThrowable','G-31 Arc','throwable'], ['slotBooster','Increased Reinforcement Budget','booster']];
        for (const [id,name,category] of samples) {
          setSlotVisualState(document.getElementById(id), name, category);
          const img = document.querySelector('#' + id + ' img');
          img.loading = 'eager';
          await img.decode();
          if (!img.naturalWidth || !img.src.includes('-wiki.')) throw new Error('Reported artwork is not loaded: ' + name);
        }
        document.getElementById('slotGrid').scrollIntoView({block:'center'});
      })()`);
      const artworkScreenshot = await client.send('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
      writeDurable(path.join(runRoot, 'reported-artwork.png'), Buffer.from(artworkScreenshot.data, 'base64'));
      result.checks.push('all four user-reported slot images render from bundled source artwork offline');
      await client.evaluate('renderSpin()');
      if (result.armoryPreferences) {
        await client.evaluate(`switchTab('items'); document.querySelector('#itemSearch').value=''; setArmoryPreferences({viewMode:'category',typeFilter:'stratagem',ownershipFilter:'all',expandedGroups:['stratagems','role:eagle']}); renderItems(); document.querySelector('#appViewport').scrollTo(0,0);`);
        await delay(350);
        const roles = await client.send('Page.captureScreenshot', {format:'png',captureBeyondViewport:false});
        writeDurable(path.join(runRoot, 'armory-stratagems.png'), Buffer.from(roles.data,'base64'));
        const coverCount = await client.evaluate(`(async () => {
          setArmoryPreferences({viewMode:'warbond',typeFilter:'all',ownershipFilter:'all'}); renderItems();
          const images=[...document.querySelectorAll('#listItemsByWarbond .warbondHeader img')];
          if(!images.length) throw Error('No Warbond covers');
          await Promise.all(images.map(async image => { image.loading='eager'; await image.decode(); if(!image.naturalWidth || /^https?:/.test(image.src)) throw Error('Nonlocal or empty Warbond cover'); }));
          document.querySelector('#itemSearch').value="Castellan's Creed"; renderItems(); document.querySelector('#appViewport').scrollTo(0,0);
          return images.length;
        })()`);
        result.checks.push(`all ${coverCount} rendered Warbond covers decode from local packaged assets`);
        await delay(350);
        const cover = await client.send('Page.captureScreenshot', {format:'png',captureBeyondViewport:false});
        writeDurable(path.join(runRoot, 'armory-warbond.png'), Buffer.from(cover.data,'base64'));
        await client.evaluate(`document.querySelector('#itemSearch').value=''; setArmoryPreferences(${JSON.stringify(result.armoryPreferences)}); renderItems(); saveHealth.flush();`);
      }
    }
    if (name === 'normal-startup') {
      const screenshot = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      writeDurable(path.join(runRoot, 'normal-startup-fullscreen.png'), Buffer.from(screenshot.data, 'base64'));
      await client.send('Emulation.setDeviceMetricsOverride', {width:640,height:480,deviceScaleFactor:1,mobile:false});
      await client.evaluate(`document.querySelector('#fanNotice').scrollIntoView({block:'start'});`);
      await delay(200);
      await client.evaluate(`(() => {
        const b=document.querySelector('#dismissFanNotice').getBoundingClientRect();
        if(b.left<0 || b.right>innerWidth || b.top<38 || b.bottom>innerHeight) throw new Error('Notice button unreachable at640x480');
      })()`);
      result.checks.push('fan notice dismissal fits the actual640x480 viewport');
      const small = await client.send('Page.captureScreenshot', {format:'png',captureBeyondViewport:false});
      writeDurable(path.join(runRoot,'fan-notice-small.png'),Buffer.from(small.data,'base64'));
      await client.send('Emulation.clearDeviceMetricsOverride');
    }
    if (name === 'gear-write') {
      await client.evaluate(`switchTab('items'); document.querySelector('#newGearPanel').open = true; document.querySelector('#newGearPanel').scrollIntoView({block:'start'});`);
      await delay(200);
      const screenshot = await client.send('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
      writeDurable(path.join(runRoot, 'new-gear.png'), Buffer.from(screenshot.data, 'base64'));
      await client.evaluate(`document.querySelector('#appViewport').scrollBy(0,400)`);
      const lower = await client.send('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
      writeDurable(path.join(runRoot, 'new-gear-controls.png'), Buffer.from(lower.data, 'base64'));
      await client.evaluate(`(async()=>{const img=document.querySelector('#newGearContent img[src="assets/new-gear/40-k-meltagun-stratagem.svg"]');if(!img)throw Error('Meltagun icon absent from New gear');await img.decode();img.scrollIntoView({block:'center'});})()`);
      const meltaShot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
      writeDurable(path.join(runRoot,'meltagun-stratagem.png'),Buffer.from(meltaShot.data,'base64'));
      result.checks.push('New gear displays the decoded cyan Meltagun support-stratagem icon');
      await client.evaluate(`if (document.querySelector('#manualPoolBlock')?.hidden) document.querySelector('[data-target="manualPoolBlock"]')?.click(); localStorage.setItem(ITEMS_VIEW_MODE_KEY,'warbond'); localStorage.setItem(ITEMS_TYPE_FILTER_KEY,'all'); if(typeof setArmoryPreferences==='function') setArmoryPreferences({viewMode:'warbond',typeFilter:'all',ownershipFilter:'all'}); document.querySelector('#itemSearch').value='Righteous Revenants'; renderItems(); document.querySelector('[data-warbond-id="warbond:righteous-revenants"]').scrollIntoView({block:'start'});`);
      await delay(200);
      const revenants = await client.send('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
      writeDurable(path.join(runRoot, 'righteous-revenants.png'), Buffer.from(revenants.data, 'base64'));
      await client.evaluate(`document.querySelector('#itemSearch').value='Ironclad Democracy'; renderItems(); const g=document.querySelector('[data-warbond-id="warbond:ironclad-democracy"]'); g.open=true; g.scrollIntoView({block:'start'});`);
      await delay(200);
      const ironclad = await client.send('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
      writeDurable(path.join(runRoot, 'ironclad-armory.png'), Buffer.from(ironclad.data, 'base64'));
      await client.evaluate(`document.querySelector('#appViewport').scrollBy(0,500)`);
      await delay(150);
      const ironcladLower = await client.send('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
      writeDurable(path.join(runRoot, 'ironclad-armory-lower.png'), Buffer.from(ironcladLower.data, 'base64'));
      await client.evaluate(`document.querySelector('#itemSearch').value=''; localStorage.setItem(ITEMS_VIEW_MODE_KEY,'category'); if(typeof setArmoryPreferences==='function') setArmoryPreferences({viewMode:'category'}); renderItems();`);
    }
    if (name === 'dedup-write') {
      await client.evaluate(`switchTab('items'); document.querySelector('#catalogMergeNotice').open=true; document.querySelector('#catalogMergeNotice').scrollIntoView({block:'center'});`);
      await delay(150);
      const screenshot = await client.send('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
      writeDurable(path.join(runRoot, 'duplicate-recovery.png'), Buffer.from(screenshot.data, 'base64'));
    }
    if (name === 'source-write' || name === 'warbond-write') {
      await client.evaluate(`switchTab('items'); document.querySelector('#catalogAuditPanel').open = true; document.querySelector('#catalogAuditPanel').scrollIntoView({block:'center'});`);
      await delay(150);
      const screenshot = await client.send('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
      writeDurable(path.join(runRoot, 'source-audit.png'), Buffer.from(screenshot.data, 'base64'));
      await client.evaluate(`if(document.querySelector('#manualPoolBlock').hidden) document.querySelector('[data-target="manualPoolBlock"]').click();`);
      const captureSources = name === 'warbond-write' ? warbondReview.warbonds.map(bond => bond.name) : ["Freedom's Flame", 'Chemical Agents', 'Urban Legends'];
      for (const source of captureSources) {
        await client.evaluate(`(async () => {
          localStorage.setItem(ITEMS_VIEW_MODE_KEY,'warbond'); localStorage.setItem(ITEMS_TYPE_FILTER_KEY,'all');
          if(typeof setArmoryPreferences==='function') setArmoryPreferences({viewMode:'warbond',typeFilter:'all',ownershipFilter:'all'});
          document.querySelector('#itemSearch').value=${JSON.stringify(source)}; renderItems();
          const group = [...document.querySelectorAll('#listItemsByWarbond .warbondGroup')].find(group => (group.dataset.sourceName || group.querySelector('.warbondHeader')?.textContent.trim()) === ${JSON.stringify(source)});
          if (!group || !group.getBoundingClientRect().height) throw new Error('Source group is not visible: ' + ${JSON.stringify(source)});
          group.scrollIntoView({block:'start'}); document.querySelector('#appViewport').scrollBy(0,-150);
          const cover = group.querySelector('.warbondHeader img');
          if(!cover || cover.getAttribute('src') !== WARBOND_ART[${JSON.stringify(source)}]) throw new Error('Missing or mismatched source group cover');
          cover.loading='eager'; await cover.decode();
        })()`);
        await delay(200);
        const cover = await client.send('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
        writeDurable(path.join(runRoot, source.replace(/[^a-z0-9]+/gi,'-') + '.png'), Buffer.from(cover.data,'base64'));
      }
    }
    if (client.errors.length) throw new Error(client.errors.join('\n'));
    phaseResult = result;
    writeJson(path.join(runRoot, `${name}-checks.json`), { checksPassed: true, shutdownVerified: false, executable: phaseExecutable, processId: child.pid, userData: phaseUserData, result });
    return result;
  } catch (error) {
    writeJson(path.join(runRoot, `${name}-phase-failure.json`), { error: error.stack, processId: child.pid, hadClient: !!client, output });
    throw error;
  } finally {
    try {
      if (client && child.exitCode === null) {
        // Chromium window.close() can bypass BrowserWindow's native close event.
        // Explicitly prepare this renderer-driven test path as well. This also
        // protects old migration fixtures which predate the native close guard.
        const closePreparation = await client.evaluate(`(async () => {
          const wasFullscreen = (await chaosSlotMachine.getWindowState()).isFullscreen;
          await chaosSlotMachine.setFullscreen(false);
          const deadline = Date.now() + 5000;
          while ((await chaosSlotMachine.getWindowState()).isFullscreen) {
            if (Date.now() > deadline) throw new Error('Fullscreen exit timed out; app left open.');
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          await new Promise(resolve => setTimeout(resolve, 250));
          const isFullscreen = (await chaosSlotMachine.getWindowState()).isFullscreen;
          if (isFullscreen) throw new Error('Fullscreen changed during shutdown; app left open.');
          return { wasFullscreen, isFullscreen, preparedAt: new Date().toISOString() };
        })()`);
        writeJson(path.join(runRoot, `${name}-close-preparation.json`), closePreparation);
        client.evaluate('window.close()').catch(() => {});
      }
      let shutdown;
      try { shutdown = await exit.wait(30000); }
      catch (error) { desktopLock.retain(error.message); throw error; }
      if (shutdown.error || shutdown.code !== 0) throw new Error(`Unsuccessful packaged shutdown: ${JSON.stringify(shutdown)}`);
      if (name !== 'dedup-seed') {
        const diagnostics = JSON.parse(fs.readFileSync(path.join(phaseUserData, 'desktop-diagnostics.json'), 'utf8'));
        if (diagnostics.pid !== child.pid || !diagnostics.events.some(event => event.event === 'will-quit')) throw new Error('Missing matching graceful quit evidence.');
        writeJson(path.join(runRoot, `${name}-shutdown.json`), diagnostics);
      }
      if (phaseResult) {
        writeJson(path.join(runRoot, `${name}.json`), { passed: true, gracefulExit: true, executable: phaseExecutable, processId: child.pid, userData: phaseUserData, result: phaseResult });
        console.log(`PASS packaged ${name}: ${phaseResult.checks.length} checks and graceful shutdown`);
      }
    } catch (error) {
      if (child.exitCode === null && child.signalCode === null) desktopLock.retain(error.message);
      throw error;
    } finally {
      if (client) client.close();
      writeDurable(path.join(runRoot, `${name}-process.log`), output);
      if (child.exitCode === null && child.signalCode === null) {
        child.unref(); child.stdout.destroy(); child.stderr.destroy();
      }
    }
  }
}

(async () => {
  desktopLock = acquireDesktopTestLock(runRoot);
  if(cardRulesOnly) {
    const written=await phase('card-rules-write');
    const verified=await phase('card-rules-verify',written);
    const assert=require('node:assert/strict');
    const tx=require('../electron/card-recalibration');
    const sets=fs.readdirSync(path.join(userData,'card-upgrades'));assert.equal(sets.length,1);
    const recovery=path.join(userData,'card-upgrades',sets[0]);
    const manifest=JSON.parse(fs.readFileSync(path.join(recovery,'manifest.json')));
    const original=fs.readFileSync(path.join(recovery,'before.json'));
    assert.equal(tx.hash(original),manifest.beforeSha256);
    const restored=require('../electron/storage').parseSave(original.toString());
    assert.equal(restored.cards.length,3);assert.equal(restored.cards[0].soloScore.version,1);
    assert(restored.cards[0].commentNotes.some(c=>c.id==='later-comment'));
    writeJson(path.join(runRoot,'report.json'),{passed:true,executable,userData,written,verified,backupVerified:true,isolated:true});
    console.log('PASS packaged card rules: '+runRoot);return;
  }
  if(activitySoakOnly){
    const written=await phase('write');
    const soak=await phase('activity-soak');
    const restarted=await phase('activity-restart',soak);
    const verified=await phase('verify',written);
    writeJson(path.join(runRoot,'report.json'),{passed:true,executable,userData,written,soak,restarted,verified,isolated:true});
    console.log(`PASS packaged activity soak and restart. Evidence: ${runRoot}`);return;
  }
  if (originOnly) {
    const assert = require('node:assert/strict');
    const migration = require('../assets/origin-storage');
    const oldExecutable = resolvePackagedTestTarget([path.join(root, '.test-data/desktop-cleanup-2026-09-16/superseded-runtime-security-candidate/runtime-security-review/win-unpacked/Helldivers 2 Chaos Slot Machine.exe')]);
    const reports = [];
    for (const scenario of ['fallback','native','interrupted']) {
      const profile = path.join(runRoot, scenario, 'profile');
      const seeded = await phase(`origin-${scenario}-seed`, { keys: migration.KEYS }, { executable: oldExecutable, userData: profile, originMode: 'seed' });
      const expected = { keys: migration.KEYS, source: seeded.source, id: scenario === 'native' ? 'packaged-native' : 'packaged-origin' };
      const preserveNative = suffix => {
        // Exact synthetic-profile targets only; no personal paths, no deletion.
        assert.equal(path.dirname(profile), path.join(runRoot, scenario));
        const archive = path.join(runRoot, scenario, suffix); fs.mkdirSync(archive);
        for (const name of ['state.json','backups']) {
          const target = path.join(profile, name);
          if (fs.existsSync(target)) fs.renameSync(target, path.join(archive, name));
        }
      };
      if (scenario !== 'native') preserveNative('old-exe-native-preserved');
      if (scenario === 'interrupted') {
        await phase('origin-interrupted-stage', expected, { userData: profile, originMode: 'stage' });
        preserveNative('pre-interruption-native-preserved');
        const journal = { version: 1, status: 'pending', source: seeded.source, before: {}, writes: migration.makePlan(seeded.source, {}) };
        writeJson(path.join(profile, 'recovery/origin-copy-v1.json'), journal);
      }
      const migrated = await phase(`origin-${scenario}-migrate`, expected, { userData: profile, originMode: 'migrate' });
      const journal = JSON.parse(fs.readFileSync(path.join(profile, 'recovery/origin-copy-v1.json')));
      assert.equal(journal.status, 'complete'); assert.deepEqual(journal.source, seeded.source);
      assert.equal(JSON.parse(fs.readFileSync(path.join(profile, 'state.json'))).data.cards[0].id, expected.id);
      const restarted = await phase(`origin-${scenario}-restart`, expected, { userData: profile, originMode: 'restart' });
      reports.push({ scenario, seeded, migrated, restarted, journalSourceMatches: true });
    }
    writeJson(path.join(runRoot, 'report.json'), { passed: true, executable, oldExecutable, reports, isolated: true });
    console.log(`PASS actual old-EXE origin upgrades: ${runRoot}`); return;
  }
  if (securityOnly) {
    const security = await phase('security');
    writeJson(path.join(runRoot, 'report.json'), { passed: true, executable, userData, security, isolated: true });
    console.log(`PASS packaged renderer security. Evidence: ${runRoot}`);
    return;
  }
  if (gearOnly || sourceOnly || dedupOnly || warbondOnly || transferOnly) {
    const prefix = transferOnly ? 'transfer' : warbondOnly ? 'warbond' : dedupOnly ? 'dedup' : sourceOnly ? 'source' : 'gear';
    const written = await phase(`${prefix}-write`);
    const verified = await phase(`${prefix}-verify`, written);
    // Additional file-level backend coverage, without a native dialog or any
    // personal profile. Use the exact payload emitted by the packaged renderer.
    const assert = require('node:assert/strict');
    const storage = require('../electron/storage');
    const exportPath = path.join(runRoot, `${prefix}-export.json`);
    storage.exportStateFile(exportPath, written.exportData);
    const envelope = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    assert.equal(envelope.applicationVersion, require('../package.json').version);
    assert.deepEqual(envelope.data, written.exportData);
    const importedProfile = path.join(runRoot, 'file-import-profile');
    storage.importStateFile(importedProfile, exportPath);
    assert.deepEqual(storage.loadStateFile(importedProfile).data, written.exportData);
    const fileRoundtrip = {passed:true, checks:3, exportPath, importedProfile, coverage:'Real storage backend export/import/load with packaged-renderer payload; native file picker not exercised.'};
    let upgrade;
    if (dedupOnly) {
      const oldExecutable = path.join(root, '.test-data', 'legacy-runtimes', 'v1.1.3', 'Helldivers 2 Chaos Slot Machine.exe');
      if (!fs.existsSync(oldExecutable)) throw new Error('Real 1.1.3 upgrade coverage needs the preserved .test-data/legacy-runtimes/v1.1.3 runtime.');
      const upgradeProfile = path.join(runRoot, 'upgrade-user-data');
      const seeded = await phase('dedup-seed', written, {executable:oldExecutable, userData:upgradeProfile});
      const originalBytes = fs.readFileSync(seeded.savePath);
      assert.equal(JSON.parse(originalBytes).applicationVersion, '1.1.3');
      writeDurable(path.join(runRoot, 'original-v1.1.3-state.json'), originalBytes);
      const upgraded = await phase('dedup-upgrade', seeded, {userData:upgradeProfile});
      assert.equal(JSON.parse(fs.readFileSync(upgraded.savePath)).applicationVersion, require('../package.json').version);
      const backupDir = path.join(upgradeProfile, 'backups');
      assert(fs.readdirSync(backupDir).some(name => fs.readFileSync(path.join(backupDir,name)).equals(originalBytes)), 'Original v1.1.3 save must remain byte-for-byte in an automatic backup');
      upgrade = {seeded, upgraded, checks:3, oldExecutable, upgradeProfile, originalBackupPreserved:true, coverage:'Actual old packaged EXE save -> new EXE first boot. No installer or personal profile involved.'};
    }
    writeDurable(path.join(runRoot, 'report.json'), JSON.stringify({passed:true,executable,userData,reviewFile:warbondOnly ? reviewFile : undefined,warbondBatch:warbondOnly && !acquisitionOnly ? warbondBatch : undefined,written,verified,fileRoundtrip,upgrade},null,2));
    console.log(`PASS packaged ${prefix} catalog and restart${upgrade ? ', including old-EXE save upgrade' : ''}. Evidence: ${runRoot}`);
    return;
  }
  const written = await phase('write');
  const verified = await phase('verify', written);
  const normalStartup = await phase('normal-startup');
  const network = await phase('network');
  const warCache = await phase('war-cache-verify');
  const warSoak = process.argv.includes('--war-soak') ? await phase('war-soak') : null;
  writeDurable(path.join(runRoot, 'report.json'), JSON.stringify({ passed: true, executable, userData, written, verified, normalStartup, network, warCache, warSoak, nativeDialogs: 'Storage IPC used real development handlers with stubbed file-picker responses. Packaged native file-picker interaction excluded; informational first-save alert pre-acknowledged only in isolated normal-startup profile.' }, null, 2));
  console.log(`PASS packaged application. Evidence: ${runRoot}`);
})().catch(error => {
  writeDurable(path.join(runRoot, 'failure.json'), JSON.stringify({ passed: false, executable, error: error.stack }, null, 2));
  console.error(error.stack);
  console.error(`Packaged evidence: ${runRoot}`);
  process.exitCode = 1;
}).finally(() => { desktopLock?.release(); });
