/* Reviewed catalog UI. Uses the same state.items objects as the legacy Armory. */
(() => {
    'use strict';
    const release = 'ironclad-democracy';
    const groups = { primaries: 'Primary', sidearms: 'Sidearm', throwables: 'Throwable', stratagems: 'Stratagem', boosters: 'Booster' };
    const metadata = { primaries: 'primary', sidearms: 'sidearm', throwables: 'throwable', stratagems: 'stratagem', boosters: 'booster' };
    const ownership = window.HD2CSMCatalogState;
    // Layout/filter preferences travel with saves. Search text is never persisted.
    window.getArmoryPreferences = () => {
        const legacy = {};
        if (state.settings.armoryBrowser == null) {
            try { legacy.viewMode = localStorage.getItem('hd2_items_view_mode'); legacy.typeFilter = localStorage.getItem('hd2_items_type_filter'); } catch (_) { /* Storage may be unavailable. */ }
        }
        return window.HD2ArmoryPreferences.normalize(state.settings.armoryBrowser, legacy);
    };
    window.setArmoryPreferences = patch => {
        state.settings.armoryBrowser = window.HD2ArmoryPreferences.normalize({ ...getArmoryPreferences(), ...patch });
        saveState();
    };
    window.armoryGroupOpen = (key, searching) => searching || getArmoryPreferences().expandedGroups.includes(key);
    window.rememberArmoryGroup = (key, open) => {
        // Imported custom source labels may be too long/contain control characters.
        // They can still be browsed, but must not create invalid saved preferences.
        if (!window.HD2ArmoryPreferences.validGroup(key)) return;
        if (document.getElementById('itemSearch').value.trim()) return;
        const expanded = getArmoryPreferences().expandedGroups.filter(group => group !== key);
        if (open && expanded.length < 200) expanded.push(key);
        setArmoryPreferences({ expandedGroups: expanded });
    };
    window.matchesArmoryOwnership = item => {
        const filter = document.getElementById('itemsOwnershipFilter')?.value || 'all';
        if (filter === 'owned') return item.owned !== false;
        if (filter === 'unowned') return item.owned === false;
        if (filter === 'enabled') return ownership.isEligible(item);
        if (filter === 'excluded') return !ownership.isEligible(item);
        return true;
    };
    function mountArmoryBrowser() {
        const tab = document.getElementById('tab-items');
        const browser = document.createElement('section');
        browser.id = 'armoryBrowser'; browser.setAttribute('aria-label', 'Equipment browser');
        const heading = document.createElement('h2'); heading.textContent = 'YOUR ARMORY';
        const help = document.createElement('p'); help.className = 'tiny';
        help.textContent = 'Choose what you own and include in rolls. This does not unlock equipment in the game.';
        browser.append(heading, help);
        const searchRow = tab.querySelector('.itemSearchRow');
        const search = document.getElementById('itemSearch');
        search.type = 'search'; search.setAttribute('aria-label', 'Search equipment, aliases, roles or Warbonds');
        search.placeholder = 'Search equipment, aliases, roles or Warbonds…';
        browser.append(searchRow);
        const controls = tab.querySelector('.itemsViewModeRow');
        controls.querySelector('.label').textContent = 'Browse equipment';
        controls.querySelector('.tiny').textContent = 'Filters affect browsing only, never your saved roll choices.';
        const mode = document.getElementById('itemsViewMode');
        mode.setAttribute('aria-label', 'Browse by');
        mode.options[0].textContent = 'Warbonds & sources'; mode.options[1].textContent = 'Equipment categories';
        document.getElementById('itemsTypeFilter').setAttribute('aria-label', 'Equipment type');
        const filter = document.createElement('select'); filter.id = 'itemsOwnershipFilter';
        filter.setAttribute('aria-label', 'Ownership and roll eligibility');
        for (const [value, label] of [['all', 'All ownership'], ['owned', 'Owned'], ['unowned', 'Not owned'], ['enabled', 'Included in rolls'], ['excluded', 'Excluded from rolls']]) {
            filter.add(new Option(label, value));
        }
        filter.addEventListener('change', () => { setArmoryPreferences({ ownershipFilter: filter.value }); renderItems(); });
        const clear = document.createElement('button'); clear.id = 'btnClearArmoryFilters';
        clear.className = 'btnGhost'; clear.textContent = 'CLEAR FILTERS';
        clear.addEventListener('click', () => {
            search.value = ''; filter.value = 'all';
            setArmoryPreferences({ ownershipFilter: 'all', typeFilter: 'all' });
            const type = document.getElementById('itemsTypeFilter'); type.value = 'all';
            type.dispatchEvent(new Event('change', { bubbles: true })); search.focus();
        });
        controls.querySelector('.miniRow').append(filter, clear); browser.append(controls);
        const status = document.createElement('p'); status.id = 'armoryBrowseStatus'; status.className = 'tiny';
        status.setAttribute('role', 'status'); browser.append(status);
        browser.append(document.getElementById('itemsWarbondView'), document.getElementById('itemsCategoryView'));
        tab.prepend(browser);

        const categories = document.getElementById('itemsCategoryView');
        const advanced = document.getElementById('manualPoolBlock');
        for (const [key, label, ids] of [
            ['weapons', 'Weapons', ['listPrimaries', 'listSidearms', 'listThrowables']],
            ['stratagems', 'Stratagems', ['listStrats']], ['boosters', 'Boosters', ['listBoosters']]
        ]) {
            const section = document.createElement('details'); section.className = 'armoryBrowseSection';
            section.dataset.armorySection = key; section.dataset.armoryLabel = label;
            const summary = document.createElement('summary'); summary.textContent = label; section.append(summary);
            for (const id of ids) {
                const column = document.getElementById(id).closest('.col');
                const editor = column.querySelector('.miniRow');
                if (editor) advanced.append(editor);
                section.append(column);
            }
            summary.addEventListener('click', () => rememberArmoryGroup(key, !section.open));
            categories.append(section);
        }
        // Empty original layout rows, not the item containers now in sections.
        categories.querySelectorAll(':scope > .row').forEach(row => row.remove());
        const statistics = document.createElement('details'); statistics.id = 'armoryStatistics';
        statistics.className = 'armoryBrowseSection';
        const title = document.createElement('summary'); title.textContent = 'Usage statistics';
        statistics.append(title, tab.querySelector('.armoryAnalyticsControls'), document.getElementById('armoryAnalyticsList'));
        tab.append(statistics);
        advanced.closest('[data-collapsible]').querySelector('button').textContent = '▶ Advanced — equipment, missions & reset';
    }
    window.updateArmoryBrowseStatus = () => {
        const query = normalizeText(document.getElementById('itemSearch').value);
        let total = 0, shown = 0;
        for (const meta of ITEM_LIST_METADATA) {
            const list = state.items[meta.key] || []; total += list.length;
            if (shouldShowItemCategory(meta.visualCategory)) shown += list.filter(item => matchesArmoryOwnership(item) && matchesItemSearch(item, meta.label, query)).length;
        }
        document.getElementById('armoryBrowseStatus').textContent = shown
            ? `${shown} of ${total} equipment entries match. Expand a section to change ownership or roll eligibility.`
            : 'No equipment matches these filters. Clear filters or try another name, alias or Warbond.';
        document.querySelectorAll('[data-armory-section]').forEach(section => {
            const count = [...section.querySelectorAll('.col')].filter(col => col.style.display !== 'none')
                .reduce((sum, col) => sum + col.querySelectorAll('.rankOuter').length, 0);
            section.querySelector('summary').textContent = `${section.dataset.armoryLabel} · ${count}`;
            section.open = armoryGroupOpen(section.dataset.armorySection, !!query && count > 0);
        });
    };
    mountArmoryBrowser();
    window.appendStratagemRoleGroups = (container, entries, makeRow, searching) => {
        for (const [key, label] of Object.entries(window.HD2ArmoryPreferences.roles)) {
            const matching = entries.filter(item => window.HD2ArmoryPreferences.role(item) === key);
            if (!matching.length) continue;
            const group = document.createElement('details'); group.className = 'armoryRoleGroup'; group.dataset.armoryRole = key;
            group.open = armoryGroupOpen(`role:${key}`, searching);
            const summary = document.createElement('summary'); summary.textContent = `${label} · ${matching.length}`;
            summary.addEventListener('click', () => rememberArmoryGroup(`role:${key}`, !group.open));
            group.append(summary);
            matching.forEach(item => group.append(makeRow(item)));
            container.append(group);
        }
    };
    const newItems = () => Object.entries(groups).flatMap(([key, label]) => (state.items[key] || [])
        .filter(item => ['1.1.2', 'hyena-revenants', release].includes(item.introducedIn)).map(item => ({ item, key, label })));

    window.getEmptyGearSlots = () => Object.entries(groups).filter(([key]) => !(state.items[key] || []).some(ownership.isEligible)).map(([,label]) => label);
    window.toggleGearEligibility = item => {
        ownership.setEnabled(item, !ownership.isEligible(item));
        saveState(); renderItems(); renderSpin();
    };
    window.renderNewGearNotice = () => {
        const notice = document.getElementById('newGearNotice');
        if (notice) {
            notice.hidden = state.settings?.catalogReviewVersion === release;
            notice.querySelector('span').textContent = `${newItems().length} opt-in gear additions — review what you own; saved choices stay unchanged.`;
        }
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
            { title: 'Ironclad Democracy', kind: 'warbond', id: 'warbond:ironclad-democracy', control: 'enable-ironclad-democracy', note: '7 items · confirm each unlock.', cover: 'assets/catalog-additions/ironclad/cover.jpg' },
            { title: 'Superstore — Ironclad Democracy', kind: 'superstore', id: 'superstore:ironclad-democracy', note: 'LAS-12 Sai · separate purchase. Not unlocked by the Warbond.' },
            { title: "Castellan's Creed", kind: 'warbond', id: 'warbond:castellans-creed', control: 'enable-castellans-creed', note: 'Legendary Warbond · four rollable items · no booster. Bulk enable only if you have unlocked all four.', cover: 'assets/new-gear/castellans-creed-cover.png' },
            { title: 'Campaign rewards', kind: 'campaign-reward', note: 'R-4 Hyena: Celestial Fence participation, June 30–July 13, 2026. Eagle Gas Airstrike: Counterdissident Hammer, August 25–September 7, 2026. Mark owned only if received in game. Orbital Gas Strike remains separate.' }
        ];
        for (const definition of definitions) {
            const section = document.createElement('section');
            section.className = 'newGearGroup';
            const heading = document.createElement('h3');
            heading.textContent = definition.title;
            section.append(heading);
            if (definition.cover) {
                const image = document.createElement('img');
                image.className = 'newGearCover'; image.src = definition.cover; image.alt = definition.title + ' catalog cover';
                section.append(image);
            }
            const note = document.createElement('p'); note.className = 'tiny'; note.textContent = definition.note; section.append(note);
            const matching = entries.filter(({item}) => item.acquisition?.kind === definition.kind && (!definition.id || item.acquisition?.id === definition.id));
            if (definition.kind === 'warbond') {
                const bulk = document.createElement('button');
                bulk.className = 'btnPrimary'; bulk.dataset.gearControl = definition.control;
                bulk.textContent = 'I HAVE UNLOCKED ALL ' + matching.length + ' — ENABLE';
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
