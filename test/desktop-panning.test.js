const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../assets/desktop-window.js'), 'utf8');

function fixture(pointer = 1) {
  const classes = new Set(['panning', 'pan-ready']);
  let captured = pointer, releases = 0, controls;
  const viewport = {
    classList: { remove: name => classes.delete(name) },
    hasPointerCapture: id => captured === id,
    releasePointerCapture: id => { assert.equal(id, captured); captured = null; releases++; controls.clearPan(); }
  };
  const start = source.indexOf('    function stopDrag()');
  const end = source.indexOf("    document.addEventListener('keydown'", start);
  assert.ok(start > 0 && end > start);
  controls = vm.runInNewContext(`let space = true, drag = {pointer: ${pointer}}; ${source.slice(start, end)}; ({clearPan, stopDrag, state: () => ({space, drag})})`, { viewport });
  return { controls, classes, releases: () => releases };
}

test('pan cancellation releases capture once even if release synchronously signals loss', () => {
  const f = fixture();
  f.controls.clearPan();
  assert.equal(f.releases(), 1);
  assert.equal(f.controls.state().drag, null);
  assert.equal(f.controls.state().space, false);
  assert.equal(f.classes.size, 0);
  f.controls.clearPan();
  assert.equal(f.releases(), 1);
});

test('pointer zero is a valid capture ID when cancelling a pan', () => {
  const f = fixture(0);
  f.controls.stopDrag();
  assert.equal(f.releases(), 1);
  assert.equal(f.controls.state().drag, null);
});

test('desktop panning registers interruption cleanup and dialog activation cancels it', () => {
  for (const event of ['lostpointercapture', 'pointercancel', 'blur', 'resize']) {
    assert.ok(source.includes(`addEventListener('${event}', clearPan)`), event);
  }
  assert.ok(source.includes('if (next.length) clearPan();'));
  assert.ok(source.includes('if (document.hidden) clearPan();'));
});
