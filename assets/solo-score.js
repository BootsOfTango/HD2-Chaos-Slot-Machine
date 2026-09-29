(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HD2SoloScore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const VERSION = 2;
  const AXES = Object.freeze(['Firepower','Precision','Survivability','Speed','Utility','Mission']);
  const clamp = n => Math.max(0, Math.min(100, n));
  const round = n => Math.round(n * 100) / 100;
  const number = (n, min = 0, max = Infinity) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
  const isSolo = card => card?.soloScore != null;
  const create = () => ({ version: VERSION, inputs: { minutes: null, sideAvailable: null, missionSuccess: null }, result: null });
  function duration(card) {
    const minutes = card?.missionSelection?.minutes;
    if (number(minutes, 1, 240)) return minutes;
    const fallback = { 'Normal (40)':40, 'Eradication (15)':15, 'Blitz (12)':12, 'Rapid Acquisition (15)':15, 'Defense (20)':20 };
    return Object.prototype.hasOwnProperty.call(fallback, card?.mode) ? fallback[card.mode] : null;
  }
  function evaluate(card, inputs = card?.soloScore?.inputs, stats = card?.lockedStatsSnapshot || card?.stats, version = card?.soloScore?.version ?? VERSION) {
    if (![1, VERSION].includes(version)) { const error = new Error('Unsupported solo scoring version. Update the app before opening this save.'); error.code='UNSUPPORTED_SAVE_VERSION'; throw error; }
    inputs ||= {}; stats ||= {};
    const errors = [], missing = [];
    const minutes = inputs.minutes, total = inputs.sideAvailable, won = inputs.missionSuccess;
    const kills = stats.kills, accuracy = stats.accuracy, deaths = stats.deaths, done = stats.blueSideObjCount;
    if (minutes == null) missing.push('Mission time');
    else if (!number(minutes, 0.01, 240)) errors.push('Mission time must be greater than 0 and at most 240 minutes.');
    if (total == null) missing.push('Available side objectives');
    else if (!number(total, 0, 100) || !Number.isInteger(total)) errors.push('Available side objectives must be a whole number from 0 to 100.');
    if (!number(done, 0, 100) || !Number.isInteger(done)) errors.push('Completed side objectives must be a whole number from 0 to 100.');
    if (number(total) && number(done) && done > total) errors.push('Completed side objectives cannot exceed available objectives.');
    if (won == null) missing.push('Main mission outcome');
    else if (typeof won !== 'boolean') errors.push('Choose Completed or Failed for the main mission.');
    if (!number(kills) || !Number.isSafeInteger(kills)) errors.push('Kills must be a non-negative safe whole number.');
    if (!number(deaths) || !Number.isSafeInteger(deaths)) errors.push('Deaths must be a non-negative safe whole number.');
    if (!number(accuracy, 0, 100)) errors.push('Accuracy must be between 0 and 100.');
    const budget = duration(card);
    if (budget == null) missing.push('Mission time limit');
    const difficulty = card?.difficulty, faction = card?.faction;
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 10) missing.push('Difficulty');
    if (!['Automatons','Terminids','Illuminate'].includes(faction)) missing.push('Enemy faction');
    const mission = card?.missionSelection?.id || card?.mode;
    if (typeof mission !== 'string' || !mission) missing.push('Mission identity');
    const timed = number(minutes, 0.01, 240);
    const kpm = timed && number(kills) ? kills / minutes : null;
    const deathsPer10 = timed && number(deaths) ? deaths * 10 / minutes : null;
    const axes = [
      kpm == null ? null : version === 1 ? clamp(kpm / 20 * 100) : 100 * Math.sqrt(clamp(kpm / 20 * 100) / 100),
      number(accuracy,0,100) ? accuracy : null,
      deathsPer10 == null ? null : clamp(100 - 25 * deathsPer10),
      typeof won !== 'boolean' || !timed || !budget ? null : won ? clamp(100 * (1 - minutes / budget)) : 0,
      number(total,1,100) && Number.isInteger(total) && number(done,0,total) && Number.isInteger(done) ? done / total * 100 : null,
      typeof won === 'boolean' ? (won ? 100 : 0) : null
    ].map(n => n == null ? null : round(n));
    const eligible = errors.length === 0 && missing.length === 0;
    const applicable = axes.filter(n => n != null);
    return { version, eligible, errors, missing, axes,
      rating: eligible ? round(applicable.reduce((a,b)=>a+b,0) / applicable.length) : null,
      killsPerMinute:kpm == null ? null : round(kpm), deathsPer10:deathsPer10 == null ? null : round(deathsPer10),
      minutes: timed ? minutes : null, timeLimit:budget, sideDone:done ?? null, sideAvailable:total ?? null,
      missionSuccess: typeof won === 'boolean' ? won : null,
      context: { difficulty:difficulty ?? null, faction:faction ?? null, mission:mission ?? null,
        missionName:card?.missionSelection?.name || card?.mode || '', sideAvailable:total ?? null, timeLimit:budget }
    };
  }
  function result(card) { return card?.statsLocked && card?.soloScore?.result ? card.soloScore.result : evaluate(card); }
  function groupKey(card) {
    const r = result(card), c = r.context;
    return JSON.stringify([r.version, c.difficulty, c.faction, c.mission, c.missionName, c.timeLimit, c.sideAvailable]);
  }
  function compare(a,b) {
    const ra=result(a), rb=result(b);
    return Number(rb.missionSuccess)-Number(ra.missionSuccess) || rb.rating-ra.rating || String(a.id).localeCompare(String(b.id));
  }
  function groups(cards) {
    const map = new Map();
    for (const card of cards.filter(c => isSolo(c) && c.statsLocked && result(c).eligible)) {
      const key=groupKey(card); if (!map.has(key)) map.set(key, []); map.get(key).push(card);
    }
    return [...map.entries()].map(([key, rows])=>({key, cards:rows.sort(compare)}));
  }
  function validateCard(card) {
    if (!isSolo(card)) return;
    const s=card.soloScore;
    if (![1, VERSION].includes(s.version)) { const error = new Error('Unsupported solo scoring version. Update the app before opening this save.'); error.code='UNSUPPORTED_SAVE_VERSION'; throw error; }
    if (!s.inputs || typeof s.inputs !== 'object' || Array.isArray(s.inputs)) throw new Error('Solo score inputs must be an object.');
    const keys=Object.keys(s.inputs).sort().join(',');
    if (keys !== 'minutes,missionSuccess,sideAvailable') throw new Error('Unexpected solo score input fields.');
    const r=evaluate(card);
    if (r.errors.length) throw new Error(r.errors.join(' '));
    if (card.statsLocked) {
      if (!s.result || JSON.stringify(s.result) !== JSON.stringify(r)) throw new Error('Solo score snapshot does not match its locked inputs.');
    } else if (s.result != null) throw new Error('An unfinished card cannot contain a finalized solo score.');
    if (s.originalResult != null && (s.version !== VERSION || !card.statsLocked || JSON.stringify(s.originalResult) !== JSON.stringify(evaluate(card, s.inputs, card.lockedStatsSnapshot || card.stats, 1)))) throw new Error('Original solo score snapshot does not match its locked inputs.');
  }
  function upgrade(card) {
    if (!isSolo(card) || card.soloScore.version !== 1) return false;
    validateCard(card);
    const s=card.soloScore;
    const original=s.result == null ? null : JSON.parse(JSON.stringify(s.result));
    const updated=card.statsLocked ? evaluate(card,s.inputs,card.lockedStatsSnapshot || card.stats,VERSION) : null;
    s.version=VERSION;
    if(original)s.originalResult=original;
    s.result=updated;
    if(card.statsLocked){card.grade=card.scoreRaw=card.scoreRawBase=updated.eligible?updated.rating:0;}
    return true;
  }
  function validateData(data) { for (const card of data?.cards || []) validateCard(card); }
  const LEGACY_KEYS = ['scoreRaw','scoreRawBase','scoreRawBonusPercent','scoreDifficultyBonusPercent','scoreExtractionBonusPercent','scoreBlueSideObjBonusPercent','scoreMajorOrderMultiplier','scoreKillTarget','grade'];
  function preserveLegacy(card) {
    if (!card || isSolo(card) || !card.statsLocked || card.legacyScoreSnapshot) return;
    if (!number(card.scoreRaw) || !number(card.grade,0,100)) return;
    card.legacyScoreSnapshot = {};
    for (const key of LEGACY_KEYS) if (number(card[key], -Infinity)) card.legacyScoreSnapshot[key]=card[key];
  }
  function restoreLegacy(card) {
    if (isSolo(card) || !card?.statsLocked || !card.legacyScoreSnapshot) return;
    for (const key of LEGACY_KEYS) if (number(card.legacyScoreSnapshot[key], -Infinity)) card[key]=card.legacyScoreSnapshot[key];
  }
  return Object.freeze({VERSION,AXES,create,isSolo,duration,evaluate,result,groupKey,compare,groups,validateCard,validateData,upgrade,preserveLegacy,restoreLegacy});
});
