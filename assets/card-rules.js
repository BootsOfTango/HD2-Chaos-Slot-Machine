(function(root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./solo-score') : root.HD2SoloScore);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HD2CardRules = api;
})(globalThis, function(S) {
  'use strict';
  const CURRENT = 2, RECORD_VERSION = 1;
  const RULES = Object.freeze([1,2].map(version => Object.freeze({version, id:'solo-v'+version,
    required:Object.freeze(['kills','accuracy','deaths','blueSideObjCount','minutes','sideAvailable','missionSuccess','difficulty','faction','mission','timeLimit'])})));
  const clone = v => JSON.parse(JSON.stringify(v));
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  function stable(v) {
    if (Array.isArray(v)) return '['+v.map(stable).join(',')+']';
    if (object(v)) return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';
    return JSON.stringify(v);
  }
  function fail(message, future=false) {
    const e=new Error(message); e.friendly=true; if(future)e.code='UNSUPPORTED_SAVE_VERSION'; throw e;
  }
  // This is an exact comparison key, not a cryptographic authenticity claim.
  function inputKey(c) {
    const s=c.lockedStatsSnapshot||c.stats||{};
    return stable({stats:[s.kills??null,s.accuracy??null,s.deaths??null,s.blueSideObjCount??null],
      inputs:c.soloScore?.inputs??null,difficulty:c.difficulty??null,faction:c.faction??null,
      mission:c.missionSelection?.id||c.mode||null,name:c.missionSelection?.name||c.mode||'',minutes:S.duration(c)});
  }
  function capture(card) {
    if (card?.statsLocked === true && !Object.hasOwn(card,'cardHistory')) {
      card.cardHistory={version:RECORD_VERSION,source:clone(card),revisions:[]};
    }
    return card;
  }
  function validateHistory(card) {
    if (!Object.hasOwn(card,'cardHistory')) return;
    const h=card.cardHistory;
    if (!object(h) || h.version!==RECORD_VERSION) fail('Unsupported card history version. Update the app.',true);
    if (!object(h.source)||Object.hasOwn(h.source,'cardHistory')||h.source.statsLocked!==true||card.statsLocked!==true||!Array.isArray(h.revisions)) fail('Invalid original card record. Nothing was removed.');
    validateData({cards:[h.source]});
    S.validateCard(h.source);
    if(Boolean(h.source.soloScore)!==Boolean(card.soloScore))fail('Original and current card types disagree.');
    if (h.source.soloScore && inputKey(h.source)!==inputKey(card)) fail('Recorded scoring inputs changed. Nothing was removed.');
    let previous=h.source.soloScore?.version||0;
    for(const revision of h.revisions) {
      if(!object(revision)||!RULES.some(r=>r.id===revision.ruleId)) fail('Unsupported rating revision. Update the app.',true);
      const version=RULES.find(r=>r.id===revision.ruleId).version;
      if(version<=previous||!Number.isFinite(Date.parse(revision.evaluatedAt))||revision.inputKey!==inputKey(h.source)||stable(revision.result)!==stable(S.evaluate(h.source,undefined,undefined,version))) fail('Invalid rating history. Nothing was removed.');
      previous=version;
    }
    if(h.revisions.length) {
      const last=h.revisions[h.revisions.length-1];
      if(card.soloScore?.version!==previous||stable(card.soloScore.result)!==stable(last.result)) fail('Current rating does not match its recorded revision.');
    } else if(h.source.soloScore && card.soloScore?.version!==h.source.soloScore.version) fail('A rating changed without a confirmed revision.');
  }
  function validateData(data) {
    if(!object(data)||!Array.isArray(data.cards??[]))fail('Invalid card collection.');
    const ids=new Set();
    for(const c of data.cards||[]) {
      if(!object(c))fail('Invalid card record.');
      if(c.statsLocked!=null && typeof c.statsLocked!=='boolean')fail('Unknown finalized/pending status.');
      if(c.id!=null) {const id=String(c.id);if(ids.has(id)||['__proto__','constructor','prototype'].includes(id))fail('Duplicate or reserved card identity.');ids.add(id);}
      if(c.cardRecordVersion!=null && c.cardRecordVersion!==1)fail('Unsupported card record version.',true);
      validateHistory(c);
    }
    return data;
  }
  function assess(card) {
    const row={id:card?.id,name:String(card?.seed||'Unnamed run'),status:'blocked',reasons:[],before:null,after:null};
    try {
      validateData({cards:[card]});
      if(card.statsLocked!==true) {
        if(card.statsLocked!=null && card.statsLocked!==false)fail('Unknown finalized/pending status.');
        S.validateCard(card); return {...row,status:'pending'};
      }
      if(!['string','number'].includes(typeof card.id)||!String(card.id))fail('Missing stable card identity.');
      const source=card.cardHistory?.source||card;
      if(!object(source.stats)||!object(source.lockedStatsSnapshot??source.stats))fail('Missing or malformed original stats.');
      S.validateCard(source); S.validateCard(card);
      if(source.soloScore) {
        const evaluated=S.evaluate(source,undefined,undefined,CURRENT);
        row.before=card.soloScore?.result?.rating??null;
        if(evaluated.errors.length)fail(evaluated.errors.join(' '));
        // Unknown context/aliases are not evidence that a measurement was absent.
        if(evaluated.missing.some(v=>['Mission time limit','Difficulty','Enemy faction','Mission identity'].includes(v))) fail('Historical scoring context needs a supported adapter; no removal proposed.');
        if(evaluated.missing.length)return {...row,status:'incomplete',reasons:evaluated.missing};
        row.after=evaluated.rating;
        return {...row,status:card.soloScore.version===CURRENT?'current':'update'};
      }
      // Known pre-Solo records never recorded these three required inputs.
      // Do not infer mission success from extraction or Major Order completion.
      if(!Number.isFinite(source.scoreRaw)||!Number.isFinite(source.grade)||
        !Number.isInteger(source.difficulty)||source.difficulty<1||source.difficulty>10||
        !['Automatons','Terminids','Illuminate'].includes(source.faction)||
        (S.duration(source)==null && source.mode!=='Defense (20min)')) fail('Unrecognized legacy scoring context; a supported adapter is needed. No removal proposed.');
      for(const stats of [source.stats,source.lockedStatsSnapshot||source.stats]) {
        for(const key of ['kills','accuracy','deaths','blueSideObjCount']) {
          if(stats[key]!=null && (typeof stats[key]!=='number'||!Number.isFinite(stats[key])||stats[key]<0||(['kills','deaths','blueSideObjCount'].includes(key)&&!Number.isSafeInteger(stats[key]))||(key==='accuracy'&&stats[key]>100)))fail('Invalid original '+key+'; no removal proposed.');
        }
      }
      return {...row,status:'incomplete',reasons:['No recorded Solo mission time, outcome or available objective count']};
    } catch(e) { return {...row,status:e.code==='UNSUPPORTED_SAVE_VERSION'?'unsupported':'blocked',reasons:[e.message]}; }
  }
  function preview(data) {
    validateData(data);
    const rows=(data.cards||[]).map(assess);
    const counts={update:0,incomplete:0,current:0,pending:0,blocked:0,unsupported:0};
    rows.forEach(r=>counts[r.status]++);
    return {ruleId:'solo-v'+CURRENT,rows,counts,canApply:!counts.blocked&&!counts.unsupported&&(counts.update+counts.incomplete)>0};
  }
  function apply(data,date=new Date().toISOString()) {
    const p=preview(data);
    if(p.counts.blocked||p.counts.unsupported)fail('Recalibration blocked. Resolve unsupported or invalid cards first.');
    const candidate=clone(data);
    candidate.cards=candidate.cards.filter((c,i)=>p.rows[i].status!=='incomplete').map(c=>{
      if(assess(c).status!=='update')return c;
      capture(c);
      const source=c.cardHistory.source;
      const result=S.evaluate(source,undefined,undefined,CURRENT);
      c.cardHistory.revisions.push({ruleId:'solo-v'+CURRENT,inputKey:inputKey(source),evaluatedAt:date,result:clone(result)});
      c.soloScore={...c.soloScore,version:CURRENT,result,originalResult:clone(source.soloScore.originalResult||source.soloScore.result)};
      c.grade=c.scoreRaw=c.scoreRawBase=result.rating;
      return c;
    });
    validateData(candidate); S.validateData(candidate);
    return candidate;
  }
  function envelope(data) {
    return (data.cards||[]).some(c=>c.cardHistory)?{saveFormatVersion:2,applicationVersion:'1.0-local',savedAt:new Date().toISOString(),data}:data;
  }
  return Object.freeze({CURRENT,RECORD_VERSION,RULES,stable,inputKey,capture,validateHistory,validateData,assess,preview,apply,envelope});
});
