/* Reviewed catalog UI. Uses the same state.items objects as the legacy Armory. */
(() => {
    'use strict';
    const release = '1.1.2';
    const groups = { primaries: 'Primary', sidearms: 'Sidearm', throwables: 'Throwable', stratagems: 'Stratagem', boosters: 'Booster' };
    const metadata = { primaries: 'primary', sidearms: 'sidearm', throwables: 'throwable', stratagems: 'stratagem', boosters: 'booster' };
    const ownership = window.HD2CSMCatalogState;
    const newItems = () => Object.entries(groups).flatMap(([key, label]) => (state.items[key] || [])
        .filter(item => item.introducedIn === release).map(item => ({ item, key, label })));

    window.getEmptyGearSlots = () => Object.entries(groups).filter(([key]) => !(state.items[key] || []).some(ownership.isEligible)).map(([,label]) => label);
    window.toggleGearEligibility = item => {
        ownership.setEnabled(item, !ownership.isEligible(item));
        saveState(); renderItems(); renderSpin();
    };
    window.renderNewGearNotice = () => {
        const notice = document.getElementById('newGearNotice');
        if (notice) notice.hidden = state.settings?.catalogReviewVersion === release;
        const warning = document.getElementById('gearPoolWarning');
        const empty = getEmptyGearSlots();
        if (warning) {
            warning.hidden = !empty.length;
            warning.textContent = `No owned and enabled gear: ${empty.join(', ')}. Choose equipment in Armory before spinning. Disabled items are never used as a fallback.`;
        }
    };
    function reviewDone() {
        state.settings.catalogReviewVersion = release;
        saveState(); renderNewGearNotice();
    }
    window.renderNewGearCatalog = () => {
        const container = document.getElementById('newGearContent');
        if (!container) return;
        const focusKey = document.activeElement?.dataset.gearControl;
        const entries = newItems();
        container.replaceChildren();
        const columns = document.createElement('div');
        columns.className = 'newGearGroups';
        const definitions = [
            { title: "Castellan's Creed", kind: 'warbond', note: 'Legendary Warbond · four rollable items · no booster. Bulk enable only if you have unlocked all four.', cover: 'assets/new-gear/castellans-creed-cover.png' },
            { title: 'Campaign rewards', kind: 'campaign-reward', note: 'Eagle Gas Airstrike: Counterdissident Hammer participation, August 25–September 7, 2026. Not granted to every player. Orbital Gas Strike remains separate.' }
        ];
        for (const definition of definitions) {
            const section = document.createElement('section');
            section.className = 'newGearGroup';
            const heading = document.createElement('h3');
            heading.textContent = definition.title;
            section.append(heading);
            if (definition.cover) {
                const image = document.createElement('img');
                image.className = 'newGearCover'; image.src = definition.cover; image.alt = "Castellan's Creed Legendary Warbond cover";
                section.append(image);
            }
            const note = document.createElement('p'); note.className = 'tiny'; note.textContent = definition.note; section.append(note);
            const matching = entries.filter(({item}) => item.acquisition?.kind === definition.kind);
            if (definition.kind === 'warbond') {
                const bulk = document.createElement('button');
                bulk.className = 'btnPrimary'; bulk.dataset.gearControl = 'enable-castellans-creed';
                bulk.textContent = 'I HAVE UNLOCKED ALL 4 — ENABLE';
                bulk.addEventListener('click', () => {
                    matching.forEach(({item}) => { ownership.setOwned(item, true); ownership.setEnabled(item, true); });
                    saveState(); renderItems(); renderSpin();
                });
                section.append(bulk);
            }
            for (const { item, key, label } of matching) {
                const row = document.createElement('div'); row.className = 'newGearRow'; row.dataset.gearId = item.id;
                const image = document.createElement('img');
                attachItemVisualToImage(image, getItemVisual(item.name, metadata[key]), { loading: 'eager' });
                image.alt = item.name; row.append(image);
                const body = document.createElement('div');
                const name = document.createElement('strong'); name.textContent = item.name;
                const type = document.createElement('div'); type.className = 'tiny'; type.textContent = `${label} · ${item.subgroup}`;
                body.append(name, type);
                const choices = document.createElement('div'); choices.className = 'newGearChoices';
                for (const [property, text] of [['owned', 'Owned'], ['enabled', 'Include in rolls']]) {
                    const control = document.createElement('label'); control.className = 'gearOwnershipControl';
                    const checkbox = document.createElement('input'); checkbox.type = 'checkbox';
                    checkbox.checked = item[property] === true;
                    checkbox.disabled = property === 'enabled' && item.owned === false;
                    checkbox.dataset.gearControl = `${item.id}:${property}`;
                    checkbox.setAttribute('aria-label', `${text}: ${item.name}`);
                    checkbox.addEventListener('change', () => {
                        if (property === 'owned') ownership.setOwned(item, checkbox.checked);
                        else ownership.setEnabled(item, checkbox.checked);
                        saveState(); renderItems(); renderSpin();
                    });
                    control.append(checkbox, document.createTextNode(text)); choices.append(control);
                }
                body.append(choices); row.append(body); section.append(row);
            }
            columns.append(section);
        }
        container.append(columns);
        const done = document.createElement('button'); done.className = 'btnGhost'; done.textContent = 'DONE — HIDE STARTUP NOTICE';
        done.addEventListener('click', reviewDone); container.append(done);
        if (focusKey) [...container.querySelectorAll('[data-gear-control]')].find(el => el.dataset.gearControl === focusKey)?.focus({preventScroll:true});
        renderNewGearNotice();
    };
    document.getElementById('btnReviewNewGear').addEventListener('click', () => {
        switchTab('items');
        const panel = document.getElementById('newGearPanel'); panel.open = true;
        panel.scrollIntoView({ block: 'start' }); panel.querySelector('summary').focus();
    });
    document.getElementById('btnDismissNewGear').addEventListener('click', reviewDone);
})();
