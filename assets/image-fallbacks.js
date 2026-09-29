/* CSP-safe image fallbacks. Never evaluate an HTML event-handler attribute. */
(() => {
    'use strict';
    document.addEventListener('error', event => {
        const img = event.target;
        if (!(img instanceof HTMLImageElement) ||
            (!img.matches('[data-item-visual="true"]') && !img.dataset.fallbackSrc)) return;
        const fallback = img.dataset.fallbackSrc;
        if (fallback) {
            // Only package-relative fallbacks, never another host or filesystem path.
            if (/^assets\/[a-zA-Z0-9_./-]+$/.test(fallback) && !fallback.split('/').includes('..')) {
                const url = new URL(fallback, document.baseURI).href;
                if (img.src !== url) { img.src = url; return; }
            }
        }
        const slot = img.closest('.slotVisual');
        if (slot) { img.remove(); slot.classList.remove('is-icon'); return; }
        const label = document.createElement('span');
        label.className = 'itemVisualFallback';
        label.textContent = 'N/A';
        img.replaceWith(label);
    }, true);
})();
