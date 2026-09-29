// UI adapter. Eligibility and saved-record validation stay in the shared modules.
(function (root) {
  'use strict';
  // Presentation only: never use display labels/icons to determine eligibility or scoring.
  const visuals = Object.freeze({
    'mission:launch-icbm': ['rocket', 'Launch ICBM'],
    'mission:eradicate-automatons': ['eradicate', 'Eradicate Automatons'],
    'mission:eradicate-terminids': ['eradicate', 'Eradicate Terminids'],
    'mission:evacuate-high-value-assets': ['defense', 'Defend assets'],
    'mission:defend-evacuation-site': ['defense', 'Defend evacuation'],
    'mission:retrieve-valuable-data': ['data', 'Retrieve data'],
    'mission:emergency-evacuation': ['evacuation', 'Emergency evacuation'],
    'mission:evacuate-colonists': ['evacuation', 'Evacuate colonists'],
    'mission:blitz-terminids': ['blitz', 'Blitz: destroy nests'],
    'mission:blitz-automatons': ['blitz', 'Blitz: destroy bases'],
    'mission:blitz-illuminate-ships': ['ships', 'Blitz: destroy ships'],
    'mission:rapid-acquisition': ['crate', 'Rapid acquisition'],
    'mission:chart-terminid-tunnels': ['tunnels', 'Chart tunnels'],
    'mission:blitz-illuminate-gateways': ['gateway', 'Blitz: destroy gateways'],
    'mission:upload-escape-pod-data': ['data', 'Upload pod data'],
    'mission:start-fuel-pumps': ['fuel', 'Start fuel pumps'],
    'mission:terminate-illegal-broadcast': ['broadcast', 'Stop broadcast'],
    'mission:spread-democracy': ['flag', 'Spread democracy'],
    'mission:activate-oil-pumps': ['fuel', 'Activate oil pumps'],
    'mission:enable-oil-extraction': ['fuel', 'Extract oil'],
    'mission:destroy-command-bunkers': ['bunker', 'Destroy bunkers'],
    'mission:conduct-geological-survey': ['survey', 'Geological survey'],
    'mission:eliminate-brood-commanders': ['target', 'Hunt Brood Commanders'],
    'mission:eliminate-chargers': ['target', 'Hunt Chargers'],
    'mission:eliminate-bile-titans': ['target', 'Hunt Bile Titans'],
    'mission:eliminate-impaler': ['target', 'Hunt Impaler'],
    'mission:eliminate-devastators': ['target', 'Hunt Devastators'],
    'mission:eliminate-automaton-hulks': ['target', 'Hunt Hulks'],
    'mission:eliminate-factory-strider': ['target', 'Hunt Factory Strider'],
    'mission:destroy-harvesters': ['target', 'Destroy Harvesters'],
    'mission:destroy-transmission-network': ['broadcast', 'Destroy transmitters'],
    'mission:purge-hatcheries': ['hatchery', 'Purge hatcheries'],
    'mission:nuke-nursery': ['nursery', 'Nuke nursery'],
    'mission:sabotage-air-base': ['airbase', 'Sabotage air base'],
    'mission:neutralize-orbital-defenses': ['cannon', 'Destroy orbital cannons'],
    'mission:sabotage-supply-bases': ['crate', 'Sabotage supply bases'],
    'mission:retrieve-recon-craft-intel': ['data', 'Retrieve recon intel'],
    'mission:extract-anomalous-material': ['fuel', 'Extract anomalous material'],
    'mission:free-colony': ['flag', 'Free colony'],
    'mission:democratize-the-void': ['flag', 'Democratize the Void'],
    'mission:take-down-overship': ['ships', 'Take down Overship'],
    'mission:infiltrate-illuminate-lair': ['tunnels', 'Infiltrate lair'],
    'mission:repel-invasion-fleet': ['defense', 'Repel invasion fleet'],
    'mission:destroy-exospire': ['spire', 'Destroy Exospire'],
    'mission:destroy-gazer-spire': ['spire', 'Destroy Gazer Spire'],
    'mission:blitz-toxic-pollination': ['blossom', 'Blitz: purge blossoms'],
    'mission:mobile-e711-extraction': ['fuel', 'Mobile E-711 extraction'],
    'mission:extract-e711': ['fuel', 'Extract E-711'],
    'mission:restart-pumps': ['fuel', 'Restart pumps'],
    'mission:seize-industrial-complex': ['bunker', 'Seize industrial complex'],
    'mission:annex-mineral-sites': ['survey', 'Annex mineral sites'],
    'mission:halt-cyborg-production': ['bunker', 'Halt Cyborg production'],
    'mission:blitz-bio-processors': ['blitz', 'Blitz: destroy processors'],
    'mission:sabotage-orgo-plasma': ['fuel', 'Sabotage plasma synthesis'],
    'mission:commando-acquire-evidence': ['camera', 'Commando: record evidence'],
    'mission:commando-extract-intel': ['data', 'Commando: extract intel'],
    'mission:commando-secure-black-box': ['crate', 'Commando: recover black box'],
    'mission:cleanse-infested-district': ['spire', 'Cleanse infested district'],
    'mission:restore-air-quality': ['blossom', 'Restore air quality'],
    'mission:confiscate-assets': ['crate', 'Confiscate assets']
  });
  // Verified screenshot identities only; never infer artwork from a similar mission name.
  const gameIcons = new Set(["mission:launch-icbm","mission:retrieve-valuable-data","mission:emergency-evacuation","mission:blitz-automatons","mission:blitz-terminids","mission:conduct-geological-survey","mission:destroy-command-bunkers","mission:destroy-transmission-network","mission:eliminate-automaton-hulks","mission:eliminate-bile-titans","mission:eliminate-brood-commanders","mission:eliminate-chargers","mission:eliminate-devastators","mission:activate-oil-pumps","mission:enable-oil-extraction","mission:start-fuel-pumps","mission:purge-hatcheries","mission:neutralize-orbital-defenses","mission:sabotage-air-base","mission:sabotage-supply-bases","mission:spread-democracy","mission:terminate-illegal-broadcast","mission:upload-escape-pod-data","mission:retrieve-recon-craft-intel","mission:mobile-e711-extraction","mission:extract-e711","mission:restart-pumps","mission:restore-air-quality","mission:cleanse-infested-district","mission:eliminate-impaler","mission:commando-acquire-evidence","mission:confiscate-assets","mission:commando-extract-intel","mission:commando-secure-black-box","mission:sabotage-orgo-plasma","mission:seize-industrial-complex","mission:annex-mineral-sites","mission:halt-cyborg-production","mission:eliminate-factory-strider","mission:blitz-bio-processors","mission:blitz-illuminate-ships","mission:evacuate-colonists","mission:take-down-overship","mission:free-colony","mission:extract-anomalous-material","mission:destroy-exospire","mission:destroy-gazer-spire"]);
  ['mission:eradicate-automatons', 'mission:eradicate-terminids', 'mission:evacuate-high-value-assets'].forEach(id => gameIcons.add(id));
  ['mission:destroy-harvesters', 'mission:nuke-nursery', 'mission:chart-terminid-tunnels'].forEach(id => gameIcons.add(id));
  ['mission:defend-evacuation-site', 'mission:rapid-acquisition', 'mission:blitz-illuminate-gateways', 'mission:democratize-the-void', 'mission:infiltrate-illuminate-lair', 'mission:repel-invasion-fleet', 'mission:blitz-toxic-pollination'].forEach(id => gameIcons.add(id));
  function visualFor(row) {
    const entry = row && Object.hasOwn(visuals, row.id) ? visuals[row.id] : null;
    const game = !!entry && gameIcons.has(row.id);
    return { src: game ? 'assets/missions/game-icons/' + row.id.slice(8) + '.png' : 'assets/missions/' + (entry ? entry[0] : 'custom') + '.svg',
      title: game ? 'In-game mission icon · screenshot crop' : 'Original placeholder mission symbol',
      label: entry ? entry[1] : String(row?.name || 'Choose a mission') };
  }
  function adviceFor(row) {
    return ['mission:commando-acquire-evidence', 'mission:commando-extract-intel', 'mission:commando-secure-black-box'].includes(row?.id)
      ? 'Commando: check gear & stratagem limits in-game.' : '';
  }
  function create({ catalog, getRun, getContext, getPlanner, setPlanner, save, changed, onChangePlanet=()=>{} }) {
    const engine = root.HD2MissionSelection.createEngine(catalog);
    const doc = document, node = id => doc.getElementById(id);
    const make = (tag, text, parent) => { const el = doc.createElement(tag); if (text != null) el.textContent = text; if (parent) parent.append(el); return el; };
    let timer = null, draftKey = null, draft = [], listKey = null;
    const icon = (row, parent) => {
      const img = make('img', null, parent); img.src = visualFor(row).src;
      img.alt = ''; img.title = visualFor(row).title; img.width = 48; img.height = 48; img.className = 'missionIcon';
      return img;
    };
    const canEdit = () => { const c = getRun(); return !!(c.loadout && c.locked && c.planetLocked && c.planetConfirmed && !c.modeConfirmed && !c.spinning); };
    const info = () => {
      const adapter = getContext();
      return { adapter, context: adapter.context, pool: engine.getPool(adapter.context, getPlanner().confirmation) };
    };
    function clearSelection() {
      const c = getRun(); c.missionSelection = null; c.mode = null; c.manualModeDraft = null; c.modeApplied = false;
      if (c.loadout) c.loadout.mode = null;
    }
    function validSelection() {
      const c = getRun();
      if (!c.missionSelection) return false;
      const { context } = info();
      const entry = engine.select(context, c.missionSelection.id, { confirmation: getPlanner().confirmation });
      return !!(entry && entry.scoringFamily && c.missionSelection.scope === root.HD2MissionSelection.scopeKey(context) &&
        c.mode === entry.scoringFamily && JSON.stringify(c.missionSelection) === JSON.stringify(root.HD2MissionState.capture(entry, context, catalog.revision)));
    }
    function sync() {
      const c = getRun();
      // A finalized recommendation is historical, not a live operation claim.
      if (c.modeConfirmed) return;
      if (c.missionSelection && (!c.planetConfirmed || !validSelection())) clearSelection();
    }
    function apply(id) {
      if (!canEdit()) return false;
      const { context } = info(), entry = engine.select(context, id, { confirmation: getPlanner().confirmation });
      if (!entry || !entry.scoringFamily) return false;
      const c = getRun(); c.missionSelection = root.HD2MissionState.capture(entry, context, catalog.revision);
      c.faction = context.faction;
      c.mode = entry.scoringFamily; c.manualModeDraft = entry.id; c.modeApplied = true;
      if (c.loadout) { c.loadout.mode = entry.scoringFamily; c.loadout.faction = context.faction; }
      changed(); return true;
    }
    function roll() {
      if (!canEdit()) return false;
      const { context } = info();
      const entry = engine.roll(context, { confirmation: getPlanner().confirmation, currentId: getRun().missionSelection?.id });
      if (!entry || !entry.scoringFamily) { clearSelection(); changed(); return false; }
      return apply(entry.id);
    }
    const panel = node('missionPlannerPanel');
    const hero = make('div'); hero.className = 'missionHero';
    const mode = node('spinMode'); mode.before(hero);
    const heroIcon = icon(null, hero); hero.append(mode);
    const heroDuration = make('span', '', hero); heroDuration.className = 'missionDuration';
    const status = make('p', '', panel); status.id = 'missionAvailability'; status.setAttribute('role', 'status');
    const freshness = make('p', '', panel); freshness.id = 'missionFreshness';
    const advice = make('p', '', panel); advice.id = 'missionAdvice'; advice.hidden = true; advice.setAttribute('role', 'note');
    const choices = make('div', null, panel); choices.id = 'missionChoices';
    choices.setAttribute('role', 'group'); choices.setAttribute('aria-label', 'Choose a mission');
    // Retain the existing select/event path for compatibility, with a text-list alternative.
    const actions = node('manualModeWrap'); panel.append(actions);
    const textList = make('details', null, panel); textList.id = 'missionTextList';
    make('summary', 'Text list', textList); textList.append(node('manualModeSelect'));
    const changePlanet = make('button', 'Change planet', panel); changePlanet.id = 'changeMissionPlanet'; changePlanet.type = 'button';
    changePlanet.addEventListener('click', () => { if (!canEdit()) return; getRun().planetConfirmed = false; clearSelection(); changed(); onChangePlanet(); });
    const toolsLink = make('button', 'Edit mission list in Armory', panel); toolsLink.type = 'button'; toolsLink.id = 'openMissionTools'; toolsLink.hidden = true;
    const toolsHost = make('section', null, node('manualPoolBlock')); toolsHost.id = 'missionTools';
    toolsHost.setAttribute('aria-labelledby', 'missionToolsTitle');
    node('manualPoolBlock').prepend(toolsHost);
    const toolsTitle = make('h3', 'Mission tools', toolsHost); toolsTitle.id = 'missionToolsTitle';
    const toolsContext = make('p', '', toolsHost); toolsContext.id = 'missionToolsContext';
    const back = make('button', 'Back to mission', toolsHost); back.type = 'button'; back.id = 'backToMission';
    back.addEventListener('click', () => {
      root.switchTab('spin');
      const target = !node('btnRerollMode').disabled ? node('btnRerollMode') :
        getRun().planetConfirmed ? node('spinMode') : node('btnSpin');
      if (target === mode || target.disabled) target.tabIndex = -1;
      target.scrollIntoView({block:'center', inline:'center'}); target.focus();
    });
    toolsLink.addEventListener('click', () => {
      root.switchTab('items');
      const toggle = doc.querySelector('[data-target="manualPoolBlock"]');
      if (node('manualPoolBlock').hidden) toggle.click();
      details.open = true;
      const summary = details.querySelector('summary');
      summary.scrollIntoView({block:'center', inline:'center'}); summary.focus();
    });
    const details = make('details', null, toolsHost); details.id = 'operationChecklist';
    make('summary', 'My operation', details);
    make('p', 'Check the missions you see in-game.', details);
    const rows = make('div', null, details); rows.id = 'operationMissionRows';
    const customDetails = make('details', null, details); customDetails.id = 'customMissionDetails';
    make('summary', 'Add missing mission', customDetails);
    const custom = make('fieldset', null, customDetails); make('legend', 'Custom mission', custom);
    const labelInput = (label, id, type) => { const l = make('label', label, custom); const e = make('input', null, l); e.id = id; e.type = type; return e; };
    const name = labelInput('Mission name ', 'customMissionName', 'text'); name.maxLength = 160;
    const duration = labelInput('Minutes (optional) ', 'customMissionMinutes', 'number'); duration.min = '1'; duration.max = '180';
    const scoreLabel = make('label', 'Scoring category (required) ', custom);
    const score = make('select', null, scoreLabel); score.id = 'customMissionScore';
    function scoreOptions(select, value) {
      const empty = make('option', 'Choose scoring category…', select); empty.value = '';
      root.HD2MissionSelection.SCORING_FAMILIES.forEach(family => { const opt = make('option', family, select); opt.value = family; });
      select.value = value || '';
    }
    scoreOptions(score);
    const add = make('button', 'Add to checklist', custom); add.type = 'button'; add.id = 'addCustomMission';
    make('p', 'Choose how this mission scores. Time alone does not set its score.', custom);
    const commit = make('button', 'Use selected', details); commit.type = 'button'; commit.id = 'confirmOperation';
    const suggested = make('button', 'Reset to suggestions', details); suggested.type = 'button'; suggested.id = 'useMissionSuggestions';
    const feedback = make('p', '', details); feedback.id = 'operationFeedback'; feedback.setAttribute('role', 'status');
    const help = make('details', null, toolsHost); help.id = 'missionHelp';
    make('summary', 'About missions', help);
    make('p', 'Suggestions use a partial catalog, not your live in-game operation. Check availability in-game, or use My operation to limit rolls to your own list.', help);
    const contextHelp = make('p', '', help); contextHelp.id = 'missionContextHelp';
    make('p', 'Play this confirms your choice here; it does not launch the game. Create a Result to save it. Scoring categories stay unchanged. Icons are original app symbols, not official game icons.', help);
    help.append(textList);
    function persistPlanner() {
      Promise.resolve().then(save).then(ok => { if (!ok) feedback.textContent = 'Operation changed in memory but could not be saved. Check the save warning before closing.'; })
        .catch(() => { feedback.textContent = 'Operation could not be saved. Check the save warning before closing.'; });
    }
    function renderDraft() {
      rows.replaceChildren();
      for (const item of draft) {
        const label = make('label', null, rows), checkbox = make('input', null, label);
        label.className = 'missionChecklistRow'; checkbox.type = 'checkbox'; checkbox.checked = item.checked; checkbox.dataset.missionId = item.choice.id;
        checkbox.addEventListener('change', () => { item.checked = checkbox.checked; });
        icon({ id: item.choice.id, name: item.name }, label);
        const copy = make('span', null, label); make('span', item.name, copy);
        if (item.warning) { const warning = make('small', 'Check in-game', copy); warning.title = item.warning; }
        if (item.choice.kind === 'custom') {
          const scoreSelect = make('select', null, rows); scoreSelect.setAttribute('aria-label', 'Scoring category for ' + item.name);
          scoreOptions(scoreSelect, item.choice.scoringFamily);
          scoreSelect.addEventListener('change', () => { item.choice.scoringFamily = scoreSelect.value || null; });
        }
      }
    }
    function prepareDraft(context, pool) {
      const key = root.HD2MissionSelection.scopeKey(context) + JSON.stringify(getPlanner().confirmation);
      if (key === draftKey) return;
      if (draftKey !== null && details.open) feedback.textContent = 'Planet, difficulty or saved operation changed. Review the checklist again.';
      draftKey = key;
      const confirmed = pool.provenance === 'player-confirmed' && ['confirmed', 'empty-confirmed'].includes(pool.status) ? getPlanner().confirmation.missions : [];
      const ids = new Set(confirmed.map(row => row.id)), suggestedIds = new Set(engine.getPool(context).missions.map(row => row.id));
      draft = catalog.missions.filter(row => row.factions.includes(context.faction) || ids.has(row.id)).map(row => ({
        choice: { kind: 'catalog', id: row.id }, name: row.name, checked: ids.has(row.id),
        warning: suggestedIds.has(row.id) ? '' : 'outside suggestions; confirm only if visible in-game'
      }));
      for (const choice of confirmed.filter(row => row.kind === 'custom')) draft.push({ choice: structuredClone(choice), name: choice.name, checked: true });
      renderDraft();
    }
    add.addEventListener('click', () => {
      if (!canEdit()) return;
      const currentKey = root.HD2MissionSelection.scopeKey(info().context) + JSON.stringify(getPlanner().confirmation);
      if (currentKey !== draftKey) { changed(); return; }
      const title = name.value.trim(), minutes = duration.value === '' ? null : Number(duration.value);
      if (!title || !score.value || (minutes !== null && (!Number.isInteger(minutes) || minutes < 1 || minutes > 180))) {
        feedback.textContent = 'Enter a name, a scoring category, and either no duration or 1–180 whole minutes.'; return;
      }
      if (draft.filter(row => row.choice.kind === 'custom').length >= 32) { feedback.textContent = 'At most 32 custom entries per checklist.'; return; }
      draft.push({ name: title, checked: true, choice: { kind: 'custom', id: 'custom:' + crypto.randomUUID(), name: title, minutes, scoringFamily: score.value } });
      name.value = ''; duration.value = ''; feedback.textContent = 'Added. Choose Use selected to save.'; renderDraft();
    });
    commit.addEventListener('click', () => {
      if (!canEdit()) return;
      const { context } = info();
      if (root.HD2MissionSelection.scopeKey(context) + JSON.stringify(getPlanner().confirmation) !== draftKey) { changed(); return; }
      const choices = draft.filter(row => row.checked).map(row => row.choice);
      if (choices.some(row => row.kind === 'custom' && !row.scoringFamily)) { feedback.textContent = 'Choose a scoring category for every checked custom mission.'; return; }
      try {
        setPlanner({ version: 1, confirmation: engine.confirm(context, choices) }); clearSelection();
        persistPlanner(); feedback.textContent = choices.length ? 'Saved. Pick a mission or roll.' : 'Nothing selected. Check a mission or reset to suggestions.';
        draftKey = null; changed();
      } catch (error) { feedback.textContent = error.message; }
    });
    suggested.addEventListener('click', () => {
      if (!canEdit()) return;
      setPlanner(root.HD2MissionState.defaults()); clearSelection(); persistPlanner(); draftKey = null;
      feedback.textContent = 'Suggestions restored. Check in-game.'; changed();
    });
    function render() {
      const c = getRun(), { adapter, context, pool } = info();
      clearTimeout(timer);
      if (adapter.nextRecheckAt) timer = setTimeout(changed, Math.min(2147483647, Math.max(50, Date.parse(adapter.nextRecheckAt) - Date.now())));
      const editable = canEdit();
      changePlanet.disabled = !editable;
      toolsLink.hidden = !editable || (pool.status === 'suggested');
      toolsContext.textContent = editable ? 'For the planet and difficulty selected in Spin.' :
        c.modeConfirmed ? 'Mission already chosen. Start another roll to edit its list.' : 'Choose and confirm a planet in Spin first.';
      panel.hidden = !c.planetConfirmed;
      const date = adapter.warStatus.lastSuccessfulAt;
      status.textContent = c.modeConfirmed ? 'Mission chosen · Check in-game' :
        pool.status === 'needs-context' ? 'Planet data missing · Change planet or refresh' :
        pool.status === 'needs-confirmation' ? 'Review saved list in Armory' :
        !pool.missions.length ? 'No missions · Edit list in Armory' :
        pool.provenance === 'player-confirmed' ? 'Saved list · ' + pool.missions.length + (pool.missions.length === 1 ? ' mission' : ' missions') : 'Suggestions · Check in-game';
      freshness.hidden = adapter.warStatus.confirmedCurrentlyPlayable;
      freshness.textContent = (date ? 'Cached ' + new Date(date).toLocaleString() : 'Offline') + ' · Availability unconfirmed';
      contextHelp.textContent = (adapter.warStatus.confirmedCurrentlyPlayable ? 'Live campaign context. ' :
        (date ? 'Cached context from ' + new Date(date).toLocaleString() : 'Bundled/offline context') + '; not confirmed currently playable. ') +
        (context.campaign === 'unknown' ? 'Campaign type is unknown; restricted suggestions are omitted. ' : '') +
        'Changing planet or difficulty may require a new operation checklist. Change planet keeps your equipment.';
      const selected = c.missionSelection;
      advice.textContent = adviceFor(selected); advice.hidden = !c.planetConfirmed || !advice.textContent;
      if (c.locked) mode.textContent = selected ? visualFor(selected).label : 'Choose a mission';
      mode.title = selected?.name || ''; heroIcon.src = visualFor(selected).src; heroIcon.title = visualFor(selected).title;
      hero.hidden = !c.planetConfirmed;
      heroDuration.textContent = selected?.minutes ? selected.minutes + ' min' : '';
      const select = node('manualModeSelect'), key = JSON.stringify(pool.missions);
      select.setAttribute('aria-label', 'Mission recommendation');
      if (key !== listKey) {
        select.replaceChildren(); const opt = make('option', 'Choose mission…', select); opt.value = '';
        pool.missions.forEach(row => { const option = make('option', row.name + (row.scoringFamily ? '' : ' — choose scoring in checklist'), select); option.value = row.id; option.disabled = !row.scoringFamily; });
        choices.replaceChildren();
        pool.missions.forEach(row => {
          const button = make('button', null, choices); button.type = 'button'; button.className = 'missionChoice';
          button.dataset.choiceId = row.id; button.title = row.name;
          button.setAttribute('aria-label', row.name + (row.minutes ? ', ' + row.minutes + ' minutes' : '') + (!row.scoringFamily ? ', choose scoring in My operation' : ''));
          icon(row, button);
          const label = make('span', visualFor(row).label, button); label.className = 'missionChoiceName';
          make('small', row.minutes ? row.minutes + ' min' : 'Custom', button);
          const tick = make('span', '✓', button); tick.className = 'missionChoiceTick'; tick.setAttribute('aria-hidden', 'true');
          button.addEventListener('click', () => apply(row.id));
        });
        listKey = key;
      }
      choices.hidden = c.modeConfirmed;
      textList.hidden = c.modeConfirmed || !pool.missions.length;
      choices.querySelectorAll('button').forEach((button, i) => {
        button.disabled = !editable || !pool.missions[i].scoringFamily;
        button.setAttribute('aria-pressed', String(button.dataset.choiceId === selected?.id));
      });
      select.value = selected?.id || ''; select.disabled = !editable;
      node('btnApplyManualMode').textContent = 'Play this'; node('btnApplyManualMode').disabled = !editable || !validSelection();
      node('btnRerollMode').textContent = 'Roll mission'; node('btnRerollMode').disabled = !editable || !pool.missions.length;
      prepareDraft(context, pool);
      details.querySelectorAll('input,select,button').forEach(el => { el.disabled = !editable; });
      node('manualModeWrap').style.display = c.planetConfirmed && !c.modeConfirmed ? '' : 'none';
    }
    return Object.freeze({ apply, roll, sync, render, validSelection, info, stop: () => clearTimeout(timer) });
  }
  root.HD2MissionUI = Object.freeze({ create, visualFor, adviceFor });
})(globalThis);
