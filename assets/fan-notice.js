/* Session-only: no save changes, stored acknowledgement, or startup focus trap. */
(() => {
    'use strict';
    const notice = document.getElementById('fanNotice');
    const button = document.getElementById('dismissFanNotice');
    if (!notice || !button) return;
    button.addEventListener('click', () => {
        const returnFocus = notice.contains(document.activeElement);
        notice.hidden = true;
        if (returnFocus) {
            const tab = document.querySelector('.tabBtn.active');
            if (tab) {
                tab.tabIndex = -1;
                tab.focus({ preventScroll: true });
            }
        }
    });
})();
