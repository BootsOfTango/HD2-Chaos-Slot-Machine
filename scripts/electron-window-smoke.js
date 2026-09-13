/* M1 native-window integration checks. Uses isolated saves and blocked network.
 * Keyboard and pointer checks use Electron sendInputEvent, not DOM dispatch.
 * Page zoom emulates reduced CSS-pixel space; it is NOT a physical OS DPI test.
 */
const fs = require('node:fs');
const path = require('node:path');
const { app, session } = require('electron');

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
  const persist = () => fs.writeFileSync(path.join(runRoot, 'stage-progress.json'), JSON.stringify({ checks: checks.length, stages: observations.stages, browserEvents: observations.browserEvents }, null, 2));
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
  fs.writeFileSync(path.join(runRoot, `${name}.png`), (await bounded(mainWindow.webContents.capturePage(), `capture ${name}`, 8000)).toPNG());
  screenshots.push(`${name}.png`);
}
async function key(keyCode, modifiers = []) {
  mainWindow.focus();
  mainWindow.webContents.focus();
  mainWindow.webContents.sendInputEvent({ type: 'keyDown', keyCode, modifiers });
  mainWindow.webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers });
  await delay(120);
}
async function setContentSize(width, height) {
  mainWindow.setContentSize(width, height);
  await waitFor(() => evaluate(`innerWidth === ${width} && innerHeight === ${height}`), `content ${width}x${height}`);
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
  })()`);
  await setContentSize(1280, 800);
  observations.geometry1280 = {};
  for (const tab of ['spin', 'results', 'compare', 'items', 'rank']) {
    await evaluate(`switchTab('${tab}')`);
    await delay(180);
    observations.geometry1280[tab] = await evaluate(`(${rendererGeometry.toString()})('${tab}')`);
  }
  await setContentSize(640, 480);
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

  await evaluate(`switchTab('results'); document.querySelector('#resSearch').scrollIntoView({block:'center'}); document.querySelector('#resSearch').focus()`);
  const searchPoint = await evaluate(`(() => { const rect = document.querySelector('#resSearch').getBoundingClientRect(); return {x:Math.round(Math.max(10,rect.left)+20),y:Math.round(rect.top+10)}; })()`);
  const searchScrollBefore = await evaluate(`({x:appViewport.scrollLeft,y:appViewport.scrollTop})`);
  await nativeDrag(searchPoint, {x:searchPoint.x + 40, y:searchPoint.y + 15});
  assert(await evaluate(`appViewport.scrollLeft === ${searchScrollBefore.x} && appViewport.scrollTop === ${searchScrollBefore.y} && !appViewport.classList.contains('panning')`), 'Space-drag in a normal search field does not pan the page');

  // These are renderer-level checks, but all Tab/Escape input is native Electron input.
  await evaluate(`switchTab('results'); document.querySelector('#appViewport').scrollTo(0,0); document.querySelector('button.resultSummary').focus(); window.__modalOrigin = document.activeElement; openResultCardModal('window-card-0');`);
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
  await evaluate(`switchTab('results'); openResultCardModal('window-card-0');`);
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
  await stage('unsubscribe desktop window-state listener', () => evaluate(`window.__stopWindowEvents(); true;`));
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
  } finally { await stage('destroy isolated browser-mode window', () => browserWindow.destroy()); }
  assert(errors.length === 0, 'no uncaught renderer/startup/storage errors during window checks', errors);
  observations.unverified = [
    'Physical Windows display DPI at125%,150%,200% and multi-monitor transitions (page zoom was emulated).',
    'Native OS file-picker, alert and select-popup interaction; existing native behavior was not replaced by this harness.',
    'Manual visual inspection and real touchpad/touch gestures; native injected mouse/keyboard and screenshots were used.'
  ];
  fs.writeFileSync(path.join(runRoot, 'report.json'), JSON.stringify({ passed: true, timestamp: new Date().toISOString(),
    processId: process.pid, userData: app.getPath('userData'), checks, observations, screenshots }, null, 2));
  app.exit(0);
}

run().catch(async error => {
  console.error(error.stack);
  try { if (mainWindow && !mainWindow.isDestroyed()) await capture('failure'); } catch { /* Preserve original error. */ }
  fs.writeFileSync(path.join(runRoot, 'report.json'), JSON.stringify({ passed: false, error: error.stack, checks, observations, errors, screenshots }, null, 2));
  app.exit(1);
});
