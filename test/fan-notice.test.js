'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'assets/fan-notice.js'), 'utf8');
function page(focused = false, missing = false) {
    let click, focusCalls = 0;
    const button = { addEventListener(type, handler) { assert.equal(type, 'click'); click = handler; } };
    const notice = { hidden: false, contains: el => el === button };
    const tab = { focus(options) { assert.equal(options.preventScroll, true); focusCalls++; } };
    const document = { activeElement: focused ? button : null, getElementById: id => missing ? null : id === 'fanNotice' ? notice : button, querySelector: () => tab };
    vm.runInNewContext(script, { document });
    return { notice, tab, dismiss: () => click(), focusCalls: () => focusCalls };
}
test('credit starts visible without grabbing focus; dismissal hides it', () => {
    const p = page(); assert.equal(p.notice.hidden, false); assert.equal(p.focusCalls(), 0);
    p.dismiss(); assert.equal(p.notice.hidden, true); assert.equal(p.focusCalls(), 0);
});
test('keyboard dismissal returns focus to the current tab without scrolling', () => {
    const p = page(true); p.dismiss(); assert.equal(p.focusCalls(), 1); assert.equal(p.tab.tabIndex, -1);
});
test('a new document shows the notice again, with no persistence API required', () => {
    const first = page(); first.dismiss(); assert.equal(page().notice.hidden, false);
    assert.doesNotMatch(script, /localStorage|sessionStorage|fetch\(|chaosSlotMachine/);
});
test('missing markup safely does nothing', () => { assert.doesNotThrow(() => page(false, true)); });
test('notice is non-modal, locally styled and credits game and community ownership', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const notice = html.match(/<aside id="fanNotice"[\s\S]*?<\/aside>/)[0];
    for (const phrase of ['Sony Interactive Entertainment', 'Arrowhead Game Studios', 'respective rights holders', 'community artwork', 'Not affiliated with or endorsed']) assert.ok(notice.includes(phrase));
    assert.doesNotMatch(notice, /aria-modal|autofocus|role="alert"|hidden/);
    assert.match(html, /src="assets\/fan-notice.js"/);
    const css = fs.readFileSync(path.join(root, 'assets/fan-notice.css'), 'utf8');
    assert.match(css, /\.fanNotice\[hidden\]\s*\{ display: none; \}/);
});
