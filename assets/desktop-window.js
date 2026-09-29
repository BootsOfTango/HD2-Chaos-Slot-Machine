(() => {
    'use strict';
    const bridge = window.chaosSlotMachine;
    if (!bridge?.getWindowState || !bridge?.setFullscreen) return;
    document.body.classList.add('desktop-app');
    const viewport = document.getElementById('appViewport');
    const canvas = document.getElementById('appCanvas');
    const toolbar = document.createElement('div');
    toolbar.className = 'desktopWindowToolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'Desktop window controls');
    toolbar.innerHTML = '<span class="desktopWindowHint">F11: fullscreen · Esc: close dialog / exit fullscreen · Space + drag background: pan</span><button id="btnToggleFullscreen" type="button" aria-pressed="false">Fullscreen (F11)</button>';
    document.body.append(toolbar);
    const toggle = document.getElementById('btnToggleFullscreen');
    const renderState = ({ isFullscreen }) => {
        toggle.textContent = isFullscreen ? 'Exit fullscreen (F11)' : 'Fullscreen (F11)';
        toggle.setAttribute('aria-pressed', String(isFullscreen));
    };
    const reportError = error => {
        console.error('Desktop window controls:', error);
        toggle.title = 'Window action failed. Try F11.';
    };
    // Native fullscreen transitions are asynchronous. Their events, not the
    // command's immediate return snapshot, own the toolbar state.
    let receivedStateEvent = false;
    toggle.addEventListener('click', () => bridge.toggleFullscreen().catch(reportError));
    const unsubscribe = bridge.onWindowStateChanged(state => {
        receivedStateEvent = true;
        renderState(state);
    });
    bridge.getWindowState().then(state => { if (!receivedStateEvent) renderState(state); }).catch(reportError);
    window.addEventListener('pagehide', unsubscribe, { once: true });

    let space = false;
    let drag = null;
    // Outside the canvas so a narrow/panned window never clips a dialog.
    const modals = [...document.querySelectorAll('.cardModal')];
    const previousFocus = new Map();
    let visible = [];
    let lastFocused = document.activeElement;
    document.addEventListener('focusin', event => {
        const entering = event.target.closest?.('.cardModal');
        // Some existing dialogs focus their select synchronously on opening,
        // before the observer runs. Remember the opener before that happens.
        if (entering && !visible.includes(entering) && !previousFocus.has(entering)) {
            previousFocus.set(entering, lastFocused);
        }
        lastFocused = event.target;
    }, true);
    const focusable = modal => [...modal.querySelectorAll('button, input, select, textarea, a[href], [tabindex]')]
        .filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length && !el.closest('[hidden], [inert]'));
    const panel = modal => modal.querySelector('.cardModalDialog');
    for (const modal of modals) {
        document.body.append(modal);
        const dialog = panel(modal);
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.tabIndex = -1;
        const heading = dialog.querySelector('.label');
        if (heading) {
            heading.id ||= `${modal.id}Title`;
            dialog.setAttribute('aria-labelledby', heading.id);
        }
    }
    function syncModals() {
        const next = modals.filter(modal => !modal.hidden);
        const oldTop = visible.at(-1);
        const newTop = next.at(-1);
        for (const modal of next) {
            if (!visible.includes(modal) && !previousFocus.has(modal)) previousFocus.set(modal, document.activeElement);
        }
        canvas.inert = next.length > 0;
        toolbar.inert = next.length > 0;
        modals.forEach((modal, index) => {
            modal.inert = !modal.hidden && modal !== newTop;
            modal.style.zIndex = String(12000 + index);
        });
        visible = next;
        if (next.length) clearPan();
        if (newTop && !newTop.contains(document.activeElement)) {
            const restore = oldTop && previousFocus.get(oldTop);
            (restore && newTop.contains(restore) && restore.isConnected ? restore : focusable(newTop)[0] || panel(newTop)).focus();
        } else if (!newTop && oldTop) {
            const restore = previousFocus.get(oldTop);
            (restore?.isConnected && !restore.closest('[hidden], [inert]') ? restore : toggle).focus({ preventScroll: true });
        }
        for (const modal of modals) if (modal.hidden) previousFocus.delete(modal);
    }
    const observer = new MutationObserver(syncModals);
    modals.forEach(modal => observer.observe(modal, { attributes: true, attributeFilter: ['hidden'] }));
    syncModals();
    document.addEventListener('keydown', event => {
        const top = visible.at(-1);
        if (event.key !== 'Tab' || !top) return;
        const controls = focusable(top);
        const first = controls[0] || panel(top);
        const last = controls.at(-1) || first;
        if (!top.contains(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last) || !controls.length) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
        }
    }, true);

    // Native scrolling is unchanged. Only empty backgrounds allow drag panning.
    const interactive = 'button, a, input, select, textarea, label, summary, [contenteditable], [tabindex], [role="button"], [draggable="true"], .tabBtn, .card, svg, canvas, img, [data-no-pan]';
    function isBackground(target) {
        if (!(target instanceof Element) || !viewport.contains(target) || target.closest(interactive) || visible.length) return false;
        if ([...target.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim())) return false;
        if (window.getSelection()?.toString()) return false;
        for (let el = target; el && el !== viewport; el = el.parentElement) {
            const style = getComputedStyle(el);
            if ((/auto|scroll/.test(style.overflowY) && el.scrollHeight > el.clientHeight) ||
                (/auto|scroll/.test(style.overflowX) && el.scrollWidth > el.clientWidth)) return false;
        }
        return true;
    }
    function stopDrag() {
        const pointer = drag?.pointer;
        drag = null;
        viewport.classList.remove('panning');
        if (pointer !== undefined && viewport.hasPointerCapture(pointer)) viewport.releasePointerCapture(pointer);
    }
    function clearPan() {
        space = false;
        stopDrag();
        viewport.classList.remove('pan-ready');
    }
    document.addEventListener('keydown', event => {
        if (event.code !== 'Space' || event.altKey || event.ctrlKey || event.metaKey || visible.length) return;
        const target = event.target;
        if (target instanceof Element && target.closest(interactive)) return;
        if (window.getSelection()?.toString()) return;
        space = true;
        viewport.classList.add('pan-ready');
        event.preventDefault();
    });
    document.addEventListener('keyup', event => { if (event.code === 'Space') clearPan(); });
    window.addEventListener('blur', clearPan);
    window.addEventListener('resize', clearPan);
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearPan(); });
    document.addEventListener('focusin', event => {
        if (event.target instanceof Element && event.target.closest(interactive)) clearPan();
    });
    viewport.addEventListener('pointerdown', event => {
        if (!space || event.button !== 0 || !isBackground(event.target)) return;
        drag = { pointer: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
        viewport.setPointerCapture(event.pointerId);
        event.preventDefault();
    });
    viewport.addEventListener('pointermove', event => {
        if (!drag || event.pointerId !== drag.pointer) return;
        const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
        if (Math.hypot(dx, dy) < 4 && !viewport.classList.contains('panning')) return;
        viewport.classList.add('panning');
        viewport.scrollTo(drag.left - dx, drag.top - dy);
    });
    viewport.addEventListener('pointerup', stopDrag);
    viewport.addEventListener('pointercancel', clearPan);
    viewport.addEventListener('lostpointercapture', clearPan);
})();
