/* M1 native-window integration checks. Uses isolated saves and blocked network.
 * Keyboard and pointer checks use Electron sendInputEvent, not DOM dispatch.
 * Page zoom emulates reduced CSS-pixel space; it is NOT a physical OS DPI test.
 */
const fs = require('node:fs');
const path = require('node:path');
const { app, session } = require('electron');
const { installHarnessQuit, writeDurable } = require('./desktop-test-safety');
installHarnessQuit(app);

const root = path.resolve(__dirname, '..');
const runRoot = process.env.HD2CSM_WINDOW_SMOKE_ROOT;
if (!runRoot || !path.isAbsolute(runRoot) || process.env.HD2_ELECTRON_TEST_HARNESS !== '1' ||
    process.env.HD2CSM_USER_DATA_DIR !== path.join(runRoot, 'user-data')) {
  throw new Error('Window smoke requires its runner and an explicitly isolated test profile.');
}
app.setAppPath(root);
app.setPath('userData', path.join(runRoot, 'user-data'));
app.commandLine.appendSwitch('disable-javascript-dialogs');
const { createMainWindow } = require('../electron/main');

const checks = [];
const observations = {};
const errors = [];
const screenshots = [];
let mainWindow;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function bounded(promise, label, timeout = 12000) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_resolve, reject) => { timer = setTimeout(() => reject(new Error(`Window smoke API timeout after ${timeout}ms: ${label}`)), timeout); })
  ]).finally(() => clearTimeout(timer));
}
async function stage(label, action, timeout = 15000) {
  const entry = { label, startedAt: new Date().toISOString() };
  observations.stages ||= [];
  observations.stages.push(entry);
  const persist = () => writeDurable(path.join(runRoot, 'stage-progress.json'), JSON.stringify({ checks: checks.length, stages: observations.stages, browserEvents: observations.browserEvents }, null, 2));
  persist(); console.log(`WINDOW STAGE START: ${label}`);
  try {
    const result = await bounded(Promise.resolve().then(action), label, timeout);
    entry.finishedAt = new Date().toISOString(); persist();
    console.log(`WINDOW STAGE DONE: ${label}`);
    return result;
  } catch (error) { entry.error = error.message; persist(); throw error; }
}
const assert = (condition, label, detail) => {
  if (!condition) throw new Error(`${label}${detail ? `: ${JSON.stringify(detail)}` : ''}`);
  checks.push(label);
  console.log(`WINDOW PASS: ${label}`);
};
const evaluate = expression => bounded(mainWindow.webContents.executeJavaScript(expression, true), `desktop evaluate: ${expression.replace(/\s+/g, ' ').slice(0, 140)}`);
async function waitFor(predicate, label, timeout = 12000) {
  const started = Date.now();
  while (!(await predicate())) {
    if (Date.now() - started > timeout) throw new Error(`Window smoke timeout: ${label}`);
    await delay(50);
  }
}
async function capture(name) {
  await delay(120);
  writeDurable(path.join(runRoot, `${name}.png`), (await bounded(mainWindow.webContents.capturePage(), `capture ${name}`, 8000)).toPNG());
  screenshots.push(`${name}.png`);
}
async function key(keyCode, modifiers = []) {
  mainWindow.focus();
  mainWindow.webContents.focus();
  mainWindow.webContents.sendInputEvent({ type: 'keyDown', keyCode, modifiers });
  // Windows character delivery is separate from keyDown/keyUp. Native button
  // activation by Enter needs the carriage-return char, not a DOM click stub.
  if (keyCode === 'Enter') mainWindow.webContents.sendInputEvent({ type: 'char', keyCode: String.fromCharCode(13), modifiers });
  mainWindow.webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers });
  await delay(120);
}
async function setContentSize(width, height) {
  mainWindow.setContentSize(width, height);
  try {
    await waitFor(() => evaluate(`innerWidth === ${width} && innerHeight === ${height}`), `content ${width}x${height}`);
  } catch(error) {
    writeJson(path.join(runRoot,'resize-failure.json'),{requested:{width,height},
      contentBounds:mainWindow.getContentBounds(),bounds:mainWindow.getBounds(),
      maximized:mainWindow.isMaximized(),fullscreen:mainWindow.isFullScreen(),
      zoom:mainWindow.webContents.getZoomFactor(),renderer:await evaluate(`({width:innerWidth,height:innerHeight})`)});
    throw error;
  }
  await delay(180);
}
async function nativeDrag(from, to, withSpace = true) {
  mainWindow.focus();
  mainWindow.webContents.focus();
  if (withSpace) mainWindow.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Space' });
  mainWindow.webContents.sendInputEvent({ type: 'mouseMove', x: from.x, y: from.y });
  mainWindow.webContents.sendInputEvent({ type: 'mouseDown', x: from.x, y: from.y, button: 'left', clickCount: 1 });
  for (let i = 1; i <= 5; i++) {
    mainWindow.webContents.sendInputEvent({ type: 'mouseMove', x: Math.round(from.x + (to.x - from.x) * i / 5),
      y: Math.round(from.y + (to.y - from.y) * i / 5), modifiers: ['leftButtonDown'] });
    await delay(30);
  }
  mainWindow.webContents.sendInputEvent({ type: 'mouseUp', x: to.x, y: to.y, button: 'left', clickCount: 1 });
  if (withSpace) mainWindow.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Space' });
  await delay(120);
}

function rendererGeometry(tab) {
  switchTab(tab);
  const selectors = {
    spin: ['.spinTopLayout', '.slotGrid', '#tab-spin .panel', '#slotPrimary'],
    results: ['#resultsGrid', '#tab-results .compactSearchRow', '#tab-results .cardGrid'],
    compare: ['#tab-compare .formGrid', '.cmpRadarRow', '#cmpTable'],
    items: ['#tab-items', '.armoryAnalyticsControls', '.armoryAnalyticsChart'],
    rank: ['#rankSplitView', '.rankTierCards', '#rankDetailPanel']
  };
  return Object.fromEntries(selectors[tab].map(selector => {
    const element = document.querySelector(selector);
    if (!element || !element.getClientRects().length) return [selector, null];
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return [selector, { width: rect.width, columns: style.gridTemplateColumns, fontSize: style.fontSize }];
  }));
}

function rendererModalSnapshot(id) {
  const modal = document.getElementById(id);
  const panel = modal.querySelector('.cardModalDialog');
  const rect = panel.getBoundingClientRect();
  const semantic = modal.matches('[role="dialog"],[role="alertdialog"]') ? modal : panel;
  const labelled = semantic.hasAttribute('aria-label') || !!document.getElementById(semantic.getAttribute('aria-labelledby'));
  return {
    hidden: modal.hidden, role: semantic.getAttribute('role'), ariaModal: semantic.getAttribute('aria-modal'), labelled,
    directBody: modal.parentElement === document.body,
    viewport: { width: innerWidth, height: innerHeight },
    panel: { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
    scrollable: panel.scrollHeight > panel.clientHeight,
    focusInside: modal.contains(document.activeElement), canvasInert: !!document.getElementById('appCanvas').closest('[inert]')
  };
}

async function assertModal(id, label) {
  const data = await evaluate(`(${rendererModalSnapshot.toString()})(${JSON.stringify(id)})`);
  assert(!data.hidden && data.directBody, `${label}: viewport-level overlay is visible`, data);
  assert(['dialog', 'alertdialog'].includes(data.role) && data.ariaModal === 'true' && data.labelled,
    `${label}: accessible dialog semantics`, data);
  assert(data.panel.x >= -1 && data.panel.y >= -1 && data.panel.right <= data.viewport.width + 1 &&
    data.panel.bottom <= data.viewport.height + 1, `${label}: fits the actual viewport`, data);
  assert(data.focusInside && data.canvasInert, `${label}: focus is inside and application canvas is inert`, data);
  return data;
}

async function run() {
  await app.whenReady();
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_details, callback) => callback({ cancel: true }));
  mainWindow = createMainWindow({ show: true, automation: true, fullscreen: true });
  mainWindow.webContents.on('console-message', (_event, ...args) => {
    const message = typeof args[0] === 'object' ? args[0].message : args[1];
    if (/Uncaught|\[boot\].*failed|\[storage\].*failed/i.test(String(message))) errors.push(String(message));
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => errors.push(`Renderer exited: ${details.reason}`));
  await bounded(new Promise((resolve, reject) => {
    mainWindow.webContents.once('did-finish-load', resolve);
    mainWindow.webContents.once('did-fail-load', (_event, code, message) => reject(new Error(`Page load ${code}: ${message}`)));
  }), 'initial desktop page load', 25000);
  await evaluate(`(async () => { window.alert = () => {}; window.confirm = () => true; await bootStateReady; })()`);
  await waitFor(() => evaluate(`document.body.classList.contains('desktop-app') && !!document.querySelector('#btnToggleFullscreen')`), 'desktop shell ready');
  assert(mainWindow.isFullScreen(), 'real Electron window starts in true fullscreen');
  assert(app.getPath('userData') === path.join(runRoot, 'user-data'), 'test uses only its isolated profile');
  assert(await evaluate(`(async () => (await chaosSlotMachine.getWindowState()).isFullscreen === true)()`), 'preload reports actual fullscreen state');
  await evaluate(`window.__windowEvents = []; window.__stopWindowEvents = chaosSlotMachine.onWindowStateChanged(value => window.__windowEvents.push(value)); undefined;`);
  await capture('startup-fullscreen');

  await waitFor(()=>evaluate(`!!galaxyApp`),'integrated galaxy ready');
  await evaluate(`window.__galaxyBefore=deepClone(state.current);state.current.loadout=rollLoadout('Galaxy window test');state.current.locked=true;state.current.difficultySelected=true;state.current.modeConfirmed=false;state.current.planetConfirmed=false;state.current.spinning=false;state.current.planet=getPlanetPoolSource()[0];renderSpin();document.getElementById('btnSearchPlanetInline').focus();openGalaxyMap();`);
  assert(await evaluate(`document.getElementById('galaxyDialog').open && document.getElementById('galaxyDialog').contains(document.activeElement)`),'integrated native map dialog opens with focus inside');
  await evaluate(`document.getElementById('btnSpin').focus()`);
  assert(await evaluate(`document.getElementById('galaxyDialog').contains(document.activeElement)`),'native map modal blocks background focus');
  await key('Tab');assert(await evaluate(`document.getElementById('galaxyDialog').contains(document.activeElement)`),'map keyboard navigation stays within modal');
  await capture('galaxy-fullscreen');
  await key('Escape');
  assert(await evaluate(`!document.getElementById('galaxyDialog').open`)&&mainWindow.isFullScreen(),'Escape closes map without leaving fullscreen');
  assert(await evaluate(`document.activeElement.id==='btnSearchPlanetInline'`),'map closing restores opener focus');
  await evaluate(`state.current=window.__galaxyBefore;delete window.__galaxyBefore;renderSpin();`);

  await key('F11');
  await waitFor(() => !mainWindow.isFullScreen(), 'F11 exits fullscreen');
  assert(!mainWindow.isFullScreen(), 'native F11 exits fullscreen exactly once');
  assert(await evaluate(`document.querySelector('#btnToggleFullscreen').getAttribute('aria-pressed') === 'false'`), 'toolbar reflects actual windowed state');
  await key('F11', ['isAutoRepeat']);
  assert(!mainWindow.isFullScreen(), 'held F11 does not repeatedly toggle fullscreen');
  await key('F11');
  await waitFor(() => mainWindow.isFullScreen(), 'F11 enters fullscreen');
  assert(mainWindow.isFullScreen(), 'native F11 reenters fullscreen');
  assert(await evaluate(`document.querySelector('#btnToggleFullscreen').getAttribute('aria-pressed') === 'true'`), 'toolbar reflects actual fullscreen state');
  await key('Escape');
  await waitFor(() => !mainWindow.isFullScreen(), 'Escape exits with no dialog');
  assert(!mainWindow.isFullScreen(), 'native Escape exits fullscreen when no dialog is open');
  await evaluate(`document.querySelector('#btnToggleFullscreen').click()`);
  await waitFor(() => mainWindow.isFullScreen(), 'toolbar enters fullscreen');
  assert(mainWindow.isFullScreen(), 'visible toolbar button toggles fullscreen');
  await evaluate(`chaosSlotMachine.setFullscreen(false)`);
  await waitFor(() => !mainWindow.isFullScreen(), 'bridge exits fullscreen');
  assert(await evaluate(`window.__windowEvents.some(value => value.isFullscreen) && window.__windowEvents.some(value => !value.isFullscreen)`), 'preload publishes both window-state transitions');

  // Controlled records exercise populated layouts without taking a real player's saves.
  await evaluate(`(() => {
    const loadout = rollLoadout('Window test fixture');
    state.cards = [false, true, true].map((locked, index) => normalizeCardRecord({
      ...loadout, id: 'window-card-' + index, createdAt: new Date(1700000000000 + index).toISOString(),
      seed: 'Window test ' + index, playerName: 'Window Test Diver ' + index, difficulty: 7,
      statsLocked: locked, majorOrderDone: true, extractedSafely: true,
      stats: { kills: 250 + index, accuracy: 70, deaths: 2, stims: 4, bulletCount: 1200, stratUses: 18, distanceKm: 4, blueSideObjCount: 2 },
      originalNote: 'Isolated window-test note', planet: { name: 'Window Test Planet', faction: loadout.faction, sector: 'Test Sector', biome: 'Jungle', weather: 'Rain' }
    }));
    recalcGrades(); renderResults(); refreshCompareOptions(); safeRenderRank('window-smoke');
    document.getElementById('soloRank').dataset.legacy = 'true'; safeRenderRank('window-smoke-legacy');
  })()`);
  await setContentSize(1280, 800);
  observations.geometry1280 = {};
  for (const tab of ['spin', 'results', 'compare', 'items', 'rank']) {
    await evaluate(`switchTab('${tab}')`);
    await delay(180);
    observations.geometry1280[tab] = await evaluate(`(${rendererGeometry.toString()})('${tab}')`);
  }
  await setContentSize(640, 480);
  await evaluate(`window.__galaxyBefore=deepClone(state.current);state.current.loadout=rollLoadout('Small galaxy window test');state.current.locked=true;state.current.difficultySelected=true;state.current.modeConfirmed=false;state.current.planetConfirmed=false;state.current.spinning=false;state.current.planet=getPlanetPoolSource()[0];renderSpin();openGalaxyMap();`);
  for(const zoom of [1,2]){
    mainWindow.webContents.setZoomFactor(zoom);await delay(200);
    assert(await evaluate(`(()=>{const d=document.getElementById('galaxyDialog').getBoundingClientRect(),b=document.getElementById('closeGalaxyMap').getBoundingClientRect();return d.left>=0&&d.right<=innerWidth+1&&d.top>=0&&d.bottom<=innerHeight+1&&b.top>=0&&b.bottom<=innerHeight;})()`),`map dialog and sticky close fit640x480 at${zoom*100}% page zoom`);
    await capture(`galaxy-small-${zoom}`);
  }
  mainWindow.webContents.setZoomFactor(1);await evaluate(`galaxyApp.close();state.current=window.__galaxyBefore;delete window.__galaxyBefore;renderSpin();`);
  observations.geometry640 = {};
  for (const tab of ['spin', 'results', 'compare', 'items', 'rank']) {
    await evaluate(`switchTab('${tab}')`);
    await delay(180);
    const actual = await evaluate(`(${rendererGeometry.toString()})('${tab}')`);
    observations.geometry640[tab] = actual;
    const expected = observations.geometry1280[tab];
    const measured = Object.keys(expected).filter(selector => expected[selector] !== null);
    assert(measured.length > 0, `${tab}: desktop baseline contains measurable content`);
    assert(measured.every(selector => actual[selector] && Math.abs(expected[selector].width - actual[selector].width) <= 1 &&
      expected[selector].columns === actual[selector].columns && expected[selector].fontSize === actual[selector].fontSize),
    `${tab}: shrinking to 640 keeps 1280px desktop geometry`, { expected, actual });
    await capture(`${tab}-640x480`);
  }
  assert(await evaluate(`document.querySelector('#appCanvas').getBoundingClientRect().width >= 1280`), 'desktop canvas keeps a 1280 CSS-pixel minimum');
  mainWindow.setSize(640, 480);
  await delay(180);
  observations.minimumWindow = { bounds: mainWindow.getBounds(), content: mainWindow.getContentBounds() };
  assert(mainWindow.getBounds().width === 640 && mainWindow.getBounds().height === 480, 'native window permits the requested 640x480 minimum');
  await evaluate(`switchTab('spin'); openDifficultyModal()`);
  await delay(100);
  await assertModal('difficultyConfirmModal', 'Minimum outer640x480 including Windows frame');
  await key('Escape');
  await setContentSize(640, 480);
  await evaluate(`switchTab('items'); document.querySelector('#appViewport').scrollTo(120, 200); document.activeElement?.blur()`);
  await delay(120);
  assert(await evaluate(`document.querySelector('#appViewport').scrollLeft >= 100 && document.querySelector('#appViewport').scrollTop >= 100`), 'fixed viewport scrolls in both axes');

  const dragPoint = await evaluate(`(() => {
    const viewport = document.querySelector('#appViewport'); viewport.scrollTo(0, 160);
    for (let y = 320; y >= 180; y -= 20) for (let x = 500; x >= 60; x -= 20) {
      const hit = document.elementFromPoint(x,y);
      if (hit && hit.matches('#appCanvas, main, .panel, .row, .col, .slotGrid, .slotCol, .formGrid'))
        return { x,y,tag:hit.tagName,id:hit.id,classes:hit.className };
    }
    return null;
  })()`);
  assert(!!dragPoint, 'Space-pan test finds a real blank application background');
  const scrollBefore = await evaluate(`({x:appViewport.scrollLeft,y:appViewport.scrollTop})`);
  await nativeDrag(dragPoint, { x: dragPoint.x - 80, y: dragPoint.y - 80 });
  const scrollAfter = await evaluate(`({x:appViewport.scrollLeft,y:appViewport.scrollTop})`);
  observations.pan = { dragPoint, scrollBefore, scrollAfter };
  assert(scrollAfter.x > scrollBefore.x + 25 || scrollAfter.y > scrollBefore.y + 25, 'Space plus native background drag pans the viewport', observations.pan);
  await capture('background-panned-640x480');

  // Wheel/trackpad-style deltas must reach the native page scrollport.
  await evaluate(`appViewport.scrollTo(0,160); document.activeElement?.blur()`);
  await delay(200);
  mainWindow.webContents.sendInputEvent({ type: 'mouseMove', x: dragPoint.x, y: dragPoint.y });
  mainWindow.webContents.sendInputEvent({ type: 'mouseWheel', x: dragPoint.x, y: dragPoint.y, deltaX: -80, deltaY: -80 });
  await waitFor(() => evaluate(`appViewport.scrollLeft > 20 && appViewport.scrollTop > 180`), 'native wheel scrolling');
  assert(true, 'native horizontal and vertical wheel deltas scroll the desktop');

  // An interrupted pointer capture must not leave the page dragging afterwards.
  await evaluate(`appViewport.scrollTo(0,160); document.activeElement?.blur(); appViewport.addEventListener('gotpointercapture', event => { window.__panPointer = event.pointerId; }, {once:true})`);
  mainWindow.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Space' });
  mainWindow.webContents.sendInputEvent({ type: 'mouseDown', x: dragPoint.x, y: dragPoint.y, button: 'left', clickCount: 1 });
  mainWindow.webContents.sendInputEvent({ type: 'mouseMove', x: dragPoint.x - 30, y: dragPoint.y - 30, modifiers: ['leftButtonDown'] });
  await delay(100);
  assert(await evaluate(`Number.isInteger(window.__panPointer) && appViewport.hasPointerCapture(window.__panPointer)`), 'interrupted-drag fixture holds actual native pointer capture');
  await evaluate(`appViewport.releasePointerCapture(window.__panPointer)`);
  mainWindow.webContents.sendInputEvent({ type: 'mouseMove', x: dragPoint.x - 40, y: dragPoint.y - 40, modifiers: ['leftButtonDown'] });
  await delay(100);
  const interrupted = await evaluate(`({x:appViewport.scrollLeft,y:appViewport.scrollTop,dragging:appViewport.classList.contains('panning')})`);
  mainWindow.webContents.sendInputEvent({ type: 'mouseMove', x: dragPoint.x - 80, y: dragPoint.y - 80, modifiers: ['leftButtonDown'] });
  await delay(100);
  const afterInterrupted = await evaluate(`({x:appViewport.scrollLeft,y:appViewport.scrollTop,dragging:appViewport.classList.contains('panning')})`);
  mainWindow.webContents.sendInputEvent({ type: 'mouseUp', x: dragPoint.x - 80, y: dragPoint.y - 80, button: 'left', clickCount: 1 });
  mainWindow.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Space' });
  assert(!interrupted.dragging && !afterInterrupted.dragging && interrupted.x === afterInterrupted.x && interrupted.y === afterInterrupted.y,
    'lost pointer capture cancels panning without continuing to move the page', {interrupted, afterInterrupted});

  await evaluate(`switchTab('results'); document.querySelector('#resSearch').scrollIntoView({block:'center'}); document.querySelector('#resSearch').focus()`);
  const searchPoint = await evaluate(`(() => { const rect = document.querySelector('#resSearch').getBoundingClientRect(); return {x:Math.round(Math.max(10,rect.left)+20),y:Math.round(rect.top+10)}; })()`);
  const searchScrollBefore = await evaluate(`({x:appViewport.scrollLeft,y:appViewport.scrollTop})`);
  await nativeDrag(searchPoint, {x:searchPoint.x + 40, y:searchPoint.y + 15});
  assert(await evaluate(`appViewport.scrollLeft === ${searchScrollBefore.x} && appViewport.scrollTop === ${searchScrollBefore.y} && !appViewport.classList.contains('panning')`), 'Space-drag in a normal search field does not pan the page');

  // These are renderer-level checks, but all Tab/Escape input is native Electron input.
  await evaluate(`switchTab('results'); document.querySelector('#appViewport').scrollTo(0,0); document.querySelector('button.resultSummary').focus(); window.__modalOrigin = document.activeElement; openResultCardModal('window-card-0', {guided:false});`);
  await delay(150);
  observations.resultModal = await assertModal('resultCardModal', 'Result at640x480');
  assert(observations.resultModal.scrollable, 'long Result dialog has internal vertical scrolling');
  await capture('result-dialog-640x480');
  await evaluate(`(() => { const panel = document.querySelector('#resultCardModal'); const list = [...panel.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')].filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length); window.__modalFirst = list[0]; window.__modalLast = list.at(-1); window.__modalLast.focus(); })()`);
  await key('Tab');
  assert(await evaluate(`document.activeElement === window.__modalFirst`), 'Tab wraps from last to first dialog control');
  await key('Tab', ['shift']);
  assert(await evaluate(`document.activeElement === window.__modalLast`), 'Shift+Tab wraps from first to last dialog control');
  await key('3');
  assert(await evaluate(`document.querySelector('#tab-results').style.display !== 'none' && !document.querySelector('#resultCardModal').hidden`), 'numeric tab shortcuts cannot switch behind a modal');
  await evaluate(`document.querySelector('#btnCloseResultModal').focus(); openFinalizeStatsModal()`);
  await delay(150);
  await assertModal('finalizeStatsConfirmModal', 'Finalize at640x480');
  assert(await evaluate(`document.querySelector('#resultCardModal').inert || document.querySelector('#resultCardModal .cardModalDialog').inert`), 'lower Result dialog is inert beneath Finalize');
  await capture('nested-finalize-640x480');
  await evaluate(`chaosSlotMachine.setFullscreen(true)`);
  await waitFor(() => mainWindow.isFullScreen(), 'nested dialogs fullscreen');
  await key('Escape');
  assert(await evaluate(`document.querySelector('#finalizeStatsConfirmModal').hidden && !document.querySelector('#resultCardModal').hidden`), 'first Escape closes only topmost Finalize');
  assert(mainWindow.isFullScreen(), 'dialog Escape does not also exit fullscreen');
  assert(await evaluate(`document.querySelector('#resultCardModal').contains(document.activeElement)`), 'closing Finalize returns focus to Result');
  await key('Escape', ['isAutoRepeat']);
  assert(await evaluate(`!document.querySelector('#resultCardModal').hidden`), 'held Escape does not dismiss the next dialog');
  await key('Escape');
  assert(await evaluate(`document.querySelector('#resultCardModal').hidden && document.activeElement === window.__modalOrigin`), 'second Escape closes Result and restores the launching control');
  assert(mainWindow.isFullScreen(), 'second dialog Escape still preserves fullscreen');
  await key('Escape');
  await waitFor(() => !mainWindow.isFullScreen(), 'third Escape fullscreen exit');
  assert(!mainWindow.isFullScreen(), 'next Escape exits fullscreen only after all dialogs close');

  await setContentSize(640, 480);
  await evaluate(`switchTab('spin'); openDifficultyModal()`);
  await delay(150);
  await assertModal('difficultyConfirmModal', 'Difficulty at640x480');
  await capture('difficulty-dialog-640x480');
  await key('Escape');
  assert(await evaluate(`document.querySelector('#difficultyConfirmModal').hidden && !document.querySelector('#appCanvas').inert`), 'closing last dialog releases background inert state');

  // A focused editable field must retain Space without starting page panning.
  await evaluate(`switchTab('results'); openResultCardModal('window-card-0', {guided:false});`);
  await delay(120);
  const fieldPoint = await evaluate(`(() => { const field = document.querySelector('#resultCardModal textarea'); field.scrollIntoView({block:'center'}); field.focus(); const rect = field.getBoundingClientRect(); return {x:Math.round(rect.left+20),y:Math.round(rect.top+12)}; })()`);
  const protectedBefore = await evaluate(`({x:appViewport.scrollLeft,y:appViewport.scrollTop})`);
  await nativeDrag(fieldPoint, { x: fieldPoint.x + 25, y: fieldPoint.y + 20 });
  assert(await evaluate(`appViewport.scrollLeft === ${protectedBefore.x} && appViewport.scrollTop === ${protectedBefore.y}`), 'Space-drag in an editable modal field does not pan the application');
  await key('Escape');

  observations.emulatedPageZoom = [];
  await setContentSize(1280, 900);
  for (const zoom of [1.25, 1.5, 2]) {
    mainWindow.webContents.setZoomFactor(zoom);
    await delay(200);
    await evaluate(`switchTab('spin'); openDifficultyModal()`);
    await delay(100);
    const modal = await assertModal('difficultyConfirmModal', `Emulated ${zoom * 100}% page zoom`);
    const canvasWidth = await evaluate(`document.querySelector('#appCanvas').getBoundingClientRect().width`);
    assert(canvasWidth >= 1280, `Emulated ${zoom * 100}% zoom preserves minimum desktop CSS canvas`);
    observations.emulatedPageZoom.push({ factor: zoom, modal, canvasWidth, method: 'Electron setZoomFactor; not Windows OS display scaling' });
    await capture(`emulated-page-zoom-${zoom * 100}`);
    await key('Escape');
  }
  await stage('reset desktop page zoom', () => mainWindow.webContents.setZoomFactor(1));
  // Worst CSS-space case: the minimum outer window at 200% page zoom.
  // The desktop canvas stays wide; dialogs must adapt to the actual viewport.
  mainWindow.setSize(640, 480);
  mainWindow.webContents.setZoomFactor(2);
  await delay(250);
  for (const [id, open] of [
    ['difficultyConfirmModal', "switchTab('spin'); openDifficultyModal()"],
    ['resultCardModal', "switchTab('results'); openResultCardModal('window-card-0', {guided:false})"],
    ['finalizeStatsConfirmModal', "openResultCardModal('window-card-0', {guided:false}); openFinalizeStatsModal()"]
  ]) {
    await evaluate(open);
    await delay(150);
    await assertModal(id, `${id}: minimum window at 200% zoom`);
    const controls = await evaluate(`(() => {
      const panel = document.querySelector('#${id} .cardModalDialog');
      return [...panel.querySelectorAll('button,input,textarea,select')].filter(el => !el.disabled && el.getClientRects().length).map(el => {
        el.scrollIntoView({block:'center',inline:'nearest'});
        const r = el.getBoundingClientRect();
        return {id:el.id || el.textContent.trim().slice(0,40),left:r.left,right:r.right,top:r.top,bottom:r.bottom, viewportWidth:innerWidth,viewportHeight:innerHeight};
      });
    })()`);
    assert(controls.length > 0 && controls.every(c => c.left >= 0 && c.right <= c.viewportWidth + 1 && c.top >= 0 && c.bottom <= c.viewportHeight + 1),
      `${id}: every enabled form/action control can be scrolled into the minimum viewport`, controls);
    await capture(`${id}-minimum-200-percent`);
    await key('Escape');
    if (id === 'finalizeStatsConfirmModal') await key('Escape');
  }
  mainWindow.webContents.setZoomFactor(1);
  await stage('unsubscribe desktop window-state listener', () => evaluate(`window.__stopWindowEvents(); true;`));
  await stage('prepare mission controls in isolated profile', () => evaluate(`(async () => {
    await missionUIReady;
    switchTab('spin'); resetCurrentSpinState();
    const c = state.current, planet = getPlanetPoolSource()[0];
    c.loadout = rollLoadout('Mission window fixture'); c.locked = true;
    c.planet = planet; c.faction = planet.faction; c.planetLocked = true;
    c.difficulty = 7; c.difficultySelected = true;
    state.settings.missionPlanner = HD2MissionState.defaults(); doUseThisRun();
    return !!missionUI;
  })()`));
  await setContentSize(1280, 1080);
  // Test-only contact sheet: inspect every original symbol at all three UI sizes.
  assert(await evaluate(`(async () => {
    const sheet = document.createElement('div'); sheet.id = 'missionSymbolContactSheet';
    Object.assign(sheet.style, {position:'fixed', inset:'0', zIndex:'999999', background:'#101319',
      color:'#eee', padding:'28px', display:'grid', gridTemplateColumns:'repeat(4,1fr)',
      gap:'16px', font:'16px sans-serif'});
    document.body.append(sheet);
    const names = ['rocket','data','evacuation','eradicate','blitz','defense','ships','crate',
      'tunnels','gateway','fuel','broadcast','flag','bunker','survey','custom','target','hatchery','nursery','airbase','cannon','spire','blossom','camera'];
    for (const name of names) {
      const card = document.createElement('div'); card.style.cssText='border:1px solid #59616b;padding:16px;border-radius:12px';
      const label = document.createElement('div'); label.textContent = name + ' · 32 / 48 / 56'; card.append(label);
      for (const size of [32,48,56]) {
        const img = new Image(size,size); img.src = 'assets/missions/' + name + '.svg';
        img.style.cssText='margin:18px 9px 0 0;vertical-align:middle'; card.append(img); await img.decode();
      }
      sheet.append(card);
    }
    return sheet.querySelectorAll('img').length === 72;
  })()`), 'all redesigned mission symbols decode at checklist, card and hero sizes');
  await capture('mission-symbol-contact-sheet');
  await evaluate(`document.getElementById('missionSymbolContactSheet').remove();`);
  await evaluate(`document.getElementById('planetHero').scrollIntoView({block:'center',inline:'center'});`);
  await waitFor(() => evaluate(`document.getElementById('rolledPlanetImage').complete && document.getElementById('rolledPlanetImage').naturalWidth > 0`), 'rolled planet artwork decoded');
  await capture('planet-roll-1280');
  assert(await evaluate(`document.getElementById('rolledPlanetImage').getBoundingClientRect().width === 104`), 'rolled planet globe has a stable desktop size');
  await evaluate(`switchTab('items'); document.getElementById('apiPlanetsBlock').hidden = false; document.getElementById('apiPlanetsBlock').closest('[data-collapsible]').classList.remove('is-collapsed'); renderWarDataStatus(); document.getElementById('apiPlanetsBlock').scrollIntoView({block:'start',inline:'center'});`);
  await waitFor(() => evaluate(`[...document.querySelectorAll('#apiActivePlanetsList .planetGlobe')].length > 0 && [...document.querySelectorAll('#apiActivePlanetsList .planetGlobe')].every(img => img.complete && img.naturalWidth > 0)`), 'Armory planet artwork decoded');
  await capture('planet-armory-1280');
  assert(await evaluate(`[...document.querySelectorAll('#apiActivePlanetsList .planetGlobe')].every(img => img.getBoundingClientRect().width === 56)`), 'Armory thumbnails remain compact beside planet names and eligibility controls');
  await evaluate(`switchTab('spin');`);
  await evaluate(`document.getElementById('missionPlannerPanel').parentElement.scrollIntoView({block:'center',inline:'center'});`);
  await delay(200); await capture('mission-picker-1280');
  await evaluate(`state.current.difficulty = 1; renderSpin(); missionUI.roll(); document.getElementById('missionPlannerPanel').parentElement.scrollIntoView({block:'center',inline:'center'});`);
  await delay(200);
  assert(await evaluate(`missionUI.validSelection() && document.querySelectorAll('#missionChoices button').length > 0 && [...document.querySelectorAll('#missionChoices img')].every(img => img.complete && img.naturalWidth > 0)`), 'low-level mission cards show the expanded pool and decoded icons');
  await capture('mission-picker-basics-1280');
  const beforeFactionView = await evaluate(`deepClone(state.current)`);
  await evaluate(`const p = getPlanetPoolSource().find(p => normalizeFactionName(p.faction) === 'Automatons'); state.current.planet = p; state.current.faction = 'Automatons'; state.current.difficulty = 3; renderSpin(); missionUI.apply('mission:eliminate-automaton-hulks'); document.getElementById('missionPlannerPanel').scrollIntoView({block:'start',inline:'center'});`);
  await delay(200);
  assert(await evaluate(`missionUI.validSelection() && document.querySelector('#missionChoices [data-choice-id="mission:eliminate-automaton-hulks"] img').naturalWidth > 0`), 'reviewed hunt renders a readable offline target icon in the actual picker');
  await capture('mission-picker-target-hunts');
  await evaluate(`state.current.difficulty = 4; renderSpin(); missionUI.apply('mission:neutralize-orbital-defenses');`);
  await delay(200);
  assert(await evaluate(`missionUI.validSelection() && document.querySelector('#missionChoices [data-choice-id="mission:neutralize-orbital-defenses"] img').naturalWidth > 0 && document.querySelector('#missionChoices [data-choice-id="mission:sabotage-air-base"] img').naturalWidth > 0`), 'sabotage mission icons decode in the compact picker');
  await capture('mission-picker-sabotage');
  await evaluate(`{ const illPlanet = getPlanetPoolSource().find(p => normalizeFactionName(p.faction) === 'Illuminate'); state.current.planet = illPlanet; state.current.faction = 'Illuminate'; state.current.difficulty = 5; renderSpin(); document.getElementById('operationChecklist').open = true; for (const id of ['mission:destroy-gazer-spire','mission:blitz-toxic-pollination','mission:extract-anomalous-material']) document.querySelector('[data-mission-id="'+id+'"]').click(); document.getElementById('confirmOperation').click(); document.getElementById('operationChecklist').open = false; missionUI.apply('mission:destroy-gazer-spire'); }`);
  await delay(200);
  assert(await evaluate(`missionUI.validSelection() && missionUI.info().pool.missions.length === 3 && [...document.querySelectorAll('#missionChoices img')].every(img => img.complete && img.naturalWidth > 0)`), 'confirmed Illuminate choices show all three decoded icons and the scoped operation');
  await capture('mission-picker-illuminate');
  await evaluate(`document.getElementById('useMissionSuggestions').click();`);
  for (const [front, ids, shot] of [
    ['Terminids', ['mission:mobile-e711-extraction','mission:extract-e711','mission:restart-pumps'], 'mission-picker-hive-world'],
    ['Automatons', ['mission:annex-mineral-sites','mission:halt-cyborg-production','mission:blitz-bio-processors'], 'mission-picker-industry'],
    ['Automatons', ['mission:commando-acquire-evidence','mission:commando-extract-intel','mission:commando-secure-black-box'], 'mission-picker-commando'],
    ['Terminids', ['mission:cleanse-infested-district','mission:restore-air-quality','mission:launch-icbm'], 'mission-picker-city']
  ]) {
    await evaluate(`{ const p = getPlanetPoolSource().find(p => normalizeFactionName(p.faction) === ${JSON.stringify(front)}); state.current.planet = p; state.current.faction = ${JSON.stringify(front)}; state.current.difficulty = 7; renderSpin(); document.getElementById('operationChecklist').open = true; for (const id of ${JSON.stringify(ids)}) document.querySelector('[data-mission-id="'+id+'"]').click(); document.getElementById('confirmOperation').click(); document.getElementById('operationChecklist').open = false; missionUI.apply(${JSON.stringify(ids[0])}); }`);
    await delay(200);
    assert(await evaluate(`missionUI.validSelection() && missionUI.info().pool.missions.length === 3 && [...document.querySelectorAll('#missionChoices img')].every(img => img.complete && img.naturalWidth > 0)`), front + ' regional picker has three decoded and scoped choices');
    assert(await evaluate(`document.getElementById('missionAdvice').hidden === ${!ids[0].startsWith('mission:commando-')}`), shot + ' has the correct contextual gear reminder');
    await capture(shot);
    await evaluate(`document.getElementById('useMissionSuggestions').click();`);
  }
  await evaluate(`state.current = ${JSON.stringify(beforeFactionView)}; renderSpin();`);
  await evaluate(`state.current.difficulty = 7; renderSpin(); missionUI.roll();`);
  const firstChoiceId = await evaluate(`document.querySelector('#missionChoices button').id = 'windowMissionChoice'; 'windowMissionChoice';`);
  await evaluate(`document.getElementById('${firstChoiceId}').focus();`);
  await key('Enter');
  assert(await evaluate(`document.activeElement.id === '${firstChoiceId}' && document.activeElement.getAttribute('aria-pressed') === 'true' && missionUI.validSelection()`), 'native Enter selects an icon card and preserves focus');
  assert(await evaluate(`!document.querySelector('#missionPlannerPanel #operationChecklist, #missionPlannerPanel #missionHelp, #missionPlannerPanel #customMissionDetails') && document.getElementById('openMissionTools').hidden`), 'clean Spin panel contains no optional mission sections or unnecessary tools link');
  await evaluate(`document.getElementById('missionPlannerPanel').scrollIntoView({block:'center',inline:'center'});`);
  await capture('mission-clean-spin');
  await evaluate(`document.querySelector('[data-tab="items"]').click(); if(document.getElementById('manualPoolBlock').hidden) document.querySelector('[data-target="manualPoolBlock"]').click(); document.getElementById('operationChecklist').open = true; document.getElementById('customMissionDetails').open = true; document.getElementById('missionHelp').open = true; document.getElementById('missionTextList').open = true; document.getElementById('missionTools').scrollIntoView({block:'start',inline:'center'});`);
  assert(await evaluate(`document.getElementById('manualPoolBlock').contains(document.getElementById('missionTools')) && !document.getElementById('manualPoolBlock').hidden`), 'Armory Advanced contains the working optional mission tools');
  await capture('mission-tools-armory');
  await setContentSize(640, 480);
  for (const zoom of [1, 2]) {
    mainWindow.webContents.setZoomFactor(zoom); await delay(180);
    const controls = await evaluate(`(async () => {
      const result = [];
      for (const id of ['windowMissionChoice','changeMissionPlanet','customMissionName','customMissionMinutes','customMissionScore','addCustomMission','confirmOperation','useMissionSuggestions','manualModeSelect','btnApplyManualMode','btnRerollMode','btnRefreshWarData']) {
        const el = document.getElementById(id); switchTab(el.closest('#missionTools') ? 'items' : 'spin'); el.focus(); el.scrollIntoView({block:'center',inline:'center'});
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const r = el.getBoundingClientRect(), x = Math.min(innerWidth - 2, Math.max(2, (r.left+r.right)/2)), y = Math.min(innerHeight - 2, Math.max(2, (r.top+r.bottom)/2));
        const hit = document.elementFromPoint(x,y);
        result.push({id, enabled:!el.disabled, focused:document.activeElement===el, reachable:hit===el || el.contains(hit), width:r.width, height:r.height, left:r.left, top:r.top, hit:hit?.id || hit?.tagName, scroll:[document.getElementById('appViewport').scrollLeft,document.getElementById('appViewport').scrollTop], viewport:[innerWidth,innerHeight]});
      }
      return result;
    })()`);
    observations['missionControls' + zoom] = controls;
    assert(controls.filter(c => c.id !== 'btnRefreshWarData').every(c => c.enabled && c.focused && c.reachable), `mission controls reachable by scrolling at640x480 and ${zoom * 100}% page zoom`, controls);
    const refresh = controls.find(c => c.id === 'btnRefreshWarData');
    // Refresh can legitimately be disabled during network backoff/cooldown.
    assert(refresh.reachable && (!refresh.enabled || refresh.focused), `planet refresh remains reachable at ${zoom * 100}% page zoom without bypassing cooldown`, refresh);
    await evaluate(`switchTab('items'); document.getElementById('customMissionName').focus(); document.getElementById('customMissionName').scrollIntoView({block:'center',inline:'center'});`);
    await capture('mission-checklist-' + zoom * 100 + '-percent');
  }
  mainWindow.webContents.setZoomFactor(1); await delay(100);
  await evaluate(`document.getElementById('customMissionName').focus(); document.getElementById('customMissionName').value='Keyboard operation'; document.getElementById('customMissionScore').value='Normal (40)';`);
  await key('Tab');
  assert(await evaluate(`document.activeElement.id === 'customMissionMinutes'`), 'native Tab reaches optional mission duration from name');
  await key('Tab');
  assert(await evaluate(`document.activeElement.id === 'customMissionScore'`), 'native Tab reaches required scoring category');
  await key('Tab');
  assert(await evaluate(`document.activeElement.id === 'addCustomMission'`), 'native Tab reaches Add to checklist');
  await key('Enter');
  assert(await evaluate(`!!document.querySelector('[data-mission-id^="custom:"]')`), 'native Enter adds the typed custom mission without page panning');
  await evaluate(`document.getElementById('confirmOperation').focus(); document.getElementById('confirmOperation').scrollIntoView({block:'center',inline:'center'});`);
  await key('Enter');
  assert(await evaluate(`state.settings.missionPlanner.confirmation.missions.some(m => m.name === 'Keyboard operation')`), 'native Enter confirms the operation checklist');
  await evaluate(`document.getElementById('backToMission').focus(); document.getElementById('backToMission').scrollIntoView({block:'center',inline:'center'});`); await key('Enter');
  assert(await evaluate(`document.querySelector('.tabBtn.active').dataset.tab === 'spin' && document.activeElement.id === 'btnRerollMode'`), 'native keyboard returns from Armory tools to the mission roll');
  await key('Enter');
  assert(await evaluate(`state.current.missionSelection.name === 'Keyboard operation'`), 'keyboard roulette uses the exact confirmed shortlist');
  // New solo scoring has its own comparison groups, independent of legacy layout checks.
  await setContentSize(1280, 900);
  await evaluate(`(() => {
    const c=deepClone(state.cards[0]); c.id='solo-window-fixture';c.seed='Solo performance review';
    c.difficulty=7;c.faction='Automatons';c.mode='Normal (40)';
    delete c.missionSelection;delete c.legacyScoreSnapshot;
    c.soloScore=HD2SoloScore.create();c.soloScore.inputs={minutes:20,sideAvailable:4,missionSuccess:true};
    c.stats={...c.stats,kills:400,accuracy:80,deaths:2,blueSideObjCount:3,extractedSafely:true};
    c.statsLocked=true;c.lockedStatsSnapshot=deepClone(c.stats);c.soloScore.result=HD2SoloScore.evaluate(c);
    state.cards.push(c);recalcGrades();document.getElementById('soloRank').dataset.legacy='false';
    switchTab('rank');document.getElementById('soloRank').scrollIntoView({block:'start'});
  })()`);
  await delay(200);await capture('solo-rank-1280');
  assert(await evaluate(`document.querySelectorAll('#soloRankRows .soloRankRow').length===1 && document.querySelector('#soloRankRows .soloRadar').textContent.includes('75')`), 'solo ranking renders objective ratio and six-axis radar separately from legacy');
  await evaluate(`openResultCardModal('solo-window-fixture');document.querySelector('.soloSummary').scrollIntoView({block:'start'});`);
  await delay(150);await capture('solo-result-1280');
  assert(await evaluate(`getComputedStyle(document.getElementById('resultCardModalMoTag')).display==='none'`),'legacy MO badge is not displayed on solo score cards');
  assert(await evaluate(`document.querySelector('.compactCardDetail .soloRadar').getBoundingClientRect().width>=400 && getComputedStyle(document.querySelector('.compactCardDetail [data-act="saveCard"]')).display==='none'`),'saved radar is larger and useless disabled Save is hidden');
  assert(await evaluate(`document.querySelectorAll('.savedOutcome span').length===2 && document.querySelector('[data-role="extractionButtons"]').closest('.modalMajorOrderBlock').hidden`),'saved outcomes appear once without disabled extraction choices');
  await evaluate(`window.__tidyBefore=JSON.stringify(getCardById('solo-window-fixture'));document.querySelector('.cardDetailFold').open=true;document.querySelector('.modalLoadoutGrid').scrollIntoView({block:'start'});`);
  await capture('saved-loadout-large');
  assert(await evaluate(`document.querySelector('.modalLoadoutIcon').getBoundingClientRect().width>=95`),'expanded equipment art has readable large thumbnails');
  await evaluate(`document.querySelectorAll('.cardDetailFold')[1].open=true;document.querySelector('.savedNumbers').scrollIntoView({block:'start'});`);
  await capture('saved-stats-comments');
  assert(await evaluate(`document.querySelectorAll('.savedNumbers strong').length===8 && document.querySelector('[data-k="newCommentText"]').placeholder==='Add a comment…'`),'recorded stats use readable text and comment composer has short copy');
  assert(await evaluate(`JSON.stringify(getCardById('solo-window-fixture'))===window.__tidyBefore`),'tidy view and expanding details never mutate saved card data');
  await evaluate(`(() => {const c=getCardById('solo-window-fixture');c.stats.kills=394;c.lockedStatsSnapshot.kills=394;c.soloScore.inputs.minutes=100;c.soloScore.version=1;c.soloScore.result=HD2SoloScore.evaluate(c);normalizeCardRecord(c);delete state.ui.resultCardDrafts[c.id];openResultCardModal(c.id);document.querySelector('.soloSummary').scrollIntoView({block:'start'});})()`);
  assert(await evaluate(`document.querySelector('#resultCardModal .soloRadar').getAttribute('aria-label').includes('44.4') && getCardById('solo-window-fixture').soloScore.originalResult.axes[0]===19.7`),'adjusted Firepower is rendered on radar with original retained');
  await capture('gentle-firepower-radar');
  await evaluate(`document.querySelector('.soloSummary .soloRules').open=true;document.querySelector('.soloSummary .soloRules').scrollIntoView({block:'start'});`);
  assert(await evaluate(`document.querySelector('.soloSummary .soloRules').textContent.includes('Firepower 19.7')`),'Scoring discloses the original Firepower rating');
  await capture('gentle-firepower-history');
  await evaluate(`closeResultCardModal();const c=getCardById('solo-window-fixture');c.statsLocked=false;c.lockedStatsSnapshot=null;c.soloScore.result=null;delete c.soloScore.originalResult;delete state.ui.resultCardDrafts[c.id];openResultCardModal(c.id);`);
  await setContentSize(640,480);
  await assertModal('resultCardModal','Solo scoring at640x480');
  for(const id of ['entryValue','entryNext','btnCloseResultModal']) {
    assert(await evaluate(`(() => {const e=document.getElementById('${id}');e.scrollIntoView({block:'center',inline:'center'});e.focus();const r=e.getBoundingClientRect();return document.activeElement===e && r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=innerHeight;})()`),'solo scoring control reachable: '+id);
  }
  await capture('solo-entry-640');
  await evaluate(`(() => {for(const s of HD2CardEntry.steps(true)){const field=document.getElementById('entryValue');if(field)field.value=s.key==='originalNote'?'My first solo run':s.key==='minutes'?'20':s.key==='sideAvailable'?'4':s.key==='blueSideObjCount'?'3':'0';else document.querySelector('#cardEntryWizard [data-choice="true"]').click();document.getElementById('entryNext').click();}})()`);
  await capture('card-review-640');
  assert(await evaluate(`!!document.getElementById('entrySave') && document.querySelectorAll('.entryReviewRow').length===13`),'small-window guided entry reaches all thirteen review answers');
  for(const id of ['entrySave','entryAcknowledge','btnCloseResultModal']) {
    assert(await evaluate(`(() => {const e=document.getElementById('${id}');e.scrollIntoView({block:'center'});e.focus();const r=e.getBoundingClientRect();return r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=innerHeight;})()`),'review control reachable: '+id);
  }
  await key('Escape');
  assert(await evaluate(`!state.ui.resultCardDrafts['solo-window-fixture']`),'Escape cancels guided draft without saving it');
  assert(await evaluate(`document.getElementById('resultCardModal').hidden`),'Escape closes the solo Result editor');
  // Same Chromium page, but no desktop preload or personal browser profile.
  const { BrowserWindow } = require('electron');
  const browserWindow = await stage('create isolated browser-mode window', () => new BrowserWindow({ show: false, width: 1280, height: 800, useContentSize: true,
    webPreferences: { partition: 'window-smoke-browser', contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } }));
  try {
    observations.browserEvents = [];
    for (const event of ['did-start-loading', 'dom-ready', 'did-finish-load', 'did-stop-loading', 'did-fail-load', 'render-process-gone']) {
      browserWindow.webContents.on(event, (_event, ...details) => {
        observations.browserEvents.push({ event, at: new Date().toISOString(), details });
        console.log(`WINDOW BROWSER EVENT: ${event}`);
      });
    }
    browserWindow.webContents.session.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_details, callback) => callback({ cancel: true }));
    // A newly created hidden BrowserWindow has no initialized document target.
    // Page.enable can remain pending until navigation creates that renderer.
    // Initialize a harmless blank page before installing the app's pre-load hook.
    await stage('initialize browser protocol target with about:blank', () => browserWindow.loadURL('about:blank'));
    // This case tests browser layout, not a hidden native reminder dialog. Use
    // a pre-document hook so the synchronous first-run alert cannot block load.
    // Keep the page free of any desktop preload/bridge.
    await stage('attach browser diagnostic protocol', () => browserWindow.webContents.debugger.attach('1.3'));
    await stage('enable browser Page protocol', () => browserWindow.webContents.debugger.sendCommand('Page.enable'));
    await stage('stub browser first-run reminder before load', () => browserWindow.webContents.debugger.sendCommand('Page.addScriptToEvaluateOnNewDocument', {
      source: 'window.__layoutTestAlerts = []; window.alert = message => window.__layoutTestAlerts.push(String(message));'
    }));
    await stage('load isolated browser page', () => browserWindow.loadFile(path.join(root, 'index.html')), 25000);
    const browserEval = expression => bounded(browserWindow.webContents.executeJavaScript(expression), `browser evaluate: ${expression.slice(0, 140)}`);
    const wide = await stage('measure wide browser layout', () => browserEval(`({width: appCanvas.getBoundingClientRect().width, columns: getComputedStyle(document.querySelector('.spinTopLayout')).gridTemplateColumns})`));
    browserWindow.setContentSize(640, 480);
    await delay(250);
    const narrow = await stage('measure narrow browser layout', () => browserEval(`({width: appCanvas.getBoundingClientRect().width, columns: getComputedStyle(document.querySelector('.spinTopLayout')).gridTemplateColumns, desktop: document.body.classList.contains('desktop-app'), bridge: typeof window.chaosSlotMachine})`));
    observations.browserMode = { wide, narrow, reminders: await stage('read browser reminder diagnostics', () => browserEval('window.__layoutTestAlerts')), method: 'Chromium BrowserWindow without preload, isolated in-memory partition; first-run alert stubbed before document load; not installed Chrome' };
    assert(!narrow.desktop && narrow.bridge === 'undefined', 'browser mode has no desktop layout or window bridge');
    assert(narrow.width <= 640 && wide.width > narrow.width && wide.columns !== narrow.columns,
      'standalone browser layout remains responsive at640px', observations.browserMode);
  } finally {
    await stage('close isolated browser-mode window gracefully', () => new Promise(resolve => {
      if (browserWindow.isDestroyed()) return resolve();
      browserWindow.once('closed', resolve);
      browserWindow.close();
    }));
  }
  assert(errors.length === 0, 'no uncaught renderer/startup/storage errors during window checks', errors);
  observations.unverified = [
    'Physical Windows display DPI at125%,150%,200% and multi-monitor transitions (page zoom was emulated).',
    'Native OS file-picker, alert and select-popup interaction; existing native behavior was not replaced by this harness.',
    'Manual visual inspection and real touchpad/touch gestures; native injected mouse/keyboard and screenshots were used.'
  ];
  writeDurable(path.join(runRoot, 'report.json'), JSON.stringify({ passed: true, timestamp: new Date().toISOString(),
    processId: process.pid, userData: app.getPath('userData'), checks, observations, screenshots }, null, 2));
  app.quit();
}

run().catch(async error => {
  console.error(error.stack);
  try { if (mainWindow && !mainWindow.isDestroyed()) await capture('failure'); } catch { /* Preserve original error. */ }
  writeDurable(path.join(runRoot, 'report.json'), JSON.stringify({ passed: false, error: error.stack, checks, observations, errors, screenshots }, null, 2));
  app.quit();
});
