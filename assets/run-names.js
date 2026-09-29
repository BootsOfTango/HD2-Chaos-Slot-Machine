// Qualitative operation codenames, NOT combat scores or replayable random seeds.
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./run-name-lexicon'):root.HD2RunLexicon);if(typeof module==='object'&&module.exports)module.exports=api;else root.HD2RunNames=api;})(typeof globalThis!=='undefined'?globalThis:this,function(lex){
  'use strict';
  const VERSION=1;
  const normalize=s=>String(s||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
  const nameKey=s=>normalize(s).replace(/^(?:seed:\s*)+/,'');
  const unique=values=>[...new Set(values)];
  const bank=(group,key)=>Object.prototype.hasOwnProperty.call(group,key)?group[key]:[];
  const weights=Object.freeze({primary:4,sidearm:2,throwable:1,stratagem:2,booster:1});
  // Explicit identity-based theme assignments. Unlisted/custom items are neutral
  // or use a broad reviewed catalog role. Never classify from an arbitrary name.
  const profiles={};
  function assign(theme,level,ids){for(const id of ids.split(' ')){profiles[id]||={};profiles[id][theme]=level;}}
  assign('fire',1,'throwable:g-8-immolation');
  assign('explosive',1,'sidearm:p-34-breacher throwable:g-60-anti-tank-seeker');
  assign('defense',1,'booster:integrated-extinguishers');
  assign('support',1,'booster:surplus-eat-allocation');
  assign('fire',1,'primary:flam-66-torcher sidearm:p-72-crisper throwable:g-10-incendiary throwable:g-13-incendiary-impact stratagem:flam-40-flamethrower stratagem:flame-sentry stratagem:orbital-napalm-barrage stratagem:eagle-napalm-airstrike stratagem:incendiary-mines booster:firebomb-hellpods');
  assign('fire',.5,'primary:sg-451-cookout primary:sg-225ie-breaker-incendiary throwable:g-123-thermite');
  assign('fire',1,'stratagem:cremator stratagem:hot-dog stratagem:expendable-napalm');
  assign('fire',.5,'primary:stoker primary:ar-2-coyote');
  assign('gas',1,'throwable:g-4-gas stratagem:sterilizer stratagem:ax-tx-13-dog-breath stratagem:orbital-gas-strike stratagem:eagle-gas-airstrike stratagem:gas-mines stratagem:gas-mortar');
  assign('gas',.5,'stratagem:speargun');
  assign('explosive',1,'throwable:giga-grenade throwable:g-7-pineapple stratagem:solo-silo');
  assign('arc',1,'primary:arc-12-blitzer stratagem:arc-3-arc-thrower stratagem:tesla-tower throwable:g-31-arc stratagem:ax-arc-3-k-9');
  assign('energy',1,'sidearm:las-7-dagger sidearm:las-58-talon sidearm:plas-15-loyalist stratagem:las-98-laser-cannon stratagem:las-99-quasar-cannon stratagem:orbital-laser stratagem:laser-sentry stratagem:guard-dog-rover');
  assign('explosive',1,'sidearm:gp-31-grenade-pistol sidearm:gp-20-ultimatum throwable:g-12-high-explosive throwable:g-16-impact throwable:g-6-frag throwable:ted-63-dynamite stratagem:orbital-120mm-he-barrage stratagem:orbital-380mm-he-barrage stratagem:orbital-walking-barrage stratagem:orbital-precision-strike stratagem:eagle-500kg-bomb stratagem:eagle-airstrike stratagem:eagle-cluster-bomb stratagem:eagle-110mm-rocket-pods stratagem:gl-21-grenade-launcher stratagem:gr-8-recoilless-rifle stratagem:eat-17-expendable-anti-tank stratagem:mls-4x-commando stratagem:rocket-sentry stratagem:mortar-sentry stratagem:portable-hellbomb');
  assign('mobility',1,'stratagem:jump-pack stratagem:hover-pack stratagem:warp-pack booster:stamina-enhancement booster:dead-sprint');
  assign('defense',1,'stratagem:ballistic-shield-backpack stratagem:directional-shield stratagem:shield-generator-pack stratagem:shield-generator-relay');
  assign('support',1,'stratagem:supply-pack sidearm:p-11-stim-pistol booster:hellpod-space-optimization booster:vitality-enhancement booster:experimental-infusion booster:expert-extraction-pilot booster:uav-recon-booster booster:sample-scanner booster:sample-extractor');
  for(const p of Object.values(profiles))Object.freeze(p);Object.freeze(profiles);
  const roleFor=Object.freeze({'assault-rifle':'ballistic',smg:'ballistic',shotgun:'ballistic',pistol:'ballistic','marksman-rifle':'precision',defensive:'defense',explosive:'explosive',energy:'energy'});
  function hash(text){let h=2166136261;for(const c of text){h^=c.codePointAt(0);h=Math.imul(h,16777619)>>>0;}return h;}
  function tier(score){return score>=70?3:score>=45?2:score>=20?1:0;}
  function create(catalogGroups){
    const indices={};
    for(const [group,type] of Object.entries({primaries:'primary',sidearms:'sidearm',throwables:'throwable',stratagems:'stratagem',boosters:'booster'})){
      const index=new Map();indices[type]=index;
      for(const item of catalogGroups?.[group]||[]){
        if(!item?.id?.startsWith(type+':'))continue;
        for(const key of unique([item.id,item.name,...(item.aliases||[]),...(item.legacyIds||[])].filter(v=>typeof v==='string').map(normalize))){
          // Ambiguous names/aliases resolve to no identity instead of guessing.
          if(index.has(key)&&index.get(key)?.id!==item.id)index.set(key,null);else if(!index.has(key))index.set(key,item);
        }
      }
    }
    function analyze(run={}){
      const load=run.loadout||{},scores=Object.fromEntries([...Object.keys(lex.themes),...Object.keys(lex.roles)].map(k=>[k,0])),resolved=[];
      const slots=[['primary',load.primary],['sidearm',load.sidearm],['throwable',load.throwable],
        ...(Array.isArray(load.stratagems)?load.stratagems.slice(0,4):[]).map(v=>['stratagem',v]),['booster',load.booster]];
      const seen=new Set();
      for(const [slot,value] of slots){
        const item=indices[slot].get(normalize(typeof value==='string'?value:value?.id||value?.name));
        resolved.push([slot,item?.id||String(value||'')]);
        if(!item||seen.has(item.id))continue;seen.add(item.id);
        const p=profiles[item.id]||{},role=roleFor[item.subgroup];
        for(const [theme,strength] of Object.entries(p))scores[theme]+=weights[slot]*strength/16*100;
        // Explicit elemental identity overrides generic catalog roles (Blitzer != laser).
        if(!Object.keys(p).length&&role)scores[role]+=weights[slot]/16*100;
      }
      const ranked=keys=>keys.filter(k=>scores[k]>0).sort((a,b)=>scores[b]-scores[a]||a.localeCompare(b));
      const elements=ranked(Object.keys(lex.themes)),roles=ranked(Object.keys(lex.roles));
      const theme=elements[0]||roles[0]||'mixed',strength=scores[theme],level=tier(strength);
      const planet=run.planet||{},faction=run.faction||load.faction||'';
      // Only recorded biome/weather metadata; never parse the planet's name or
      // unverified special activity. This is narrative context, not a live claim.
      const text=normalize([run.planetBiome,typeof planet.biome==='string'?planet.biome:planet.biome?.name,
        planet.weatherText,planet.weather,...(Array.isArray(planet.hazards)?planet.hazards.map(h=>typeof h==='string'?h:h?.name):[])].filter(v=>typeof v==='string').join(' '));
      const environments=[];
      if(/\b(magma|lava|volcanic|fire tornado|fire tornadoes|intense heat|scorched)\b/.test(text))environments.push('heat');
      if(/\b(ice|icy|frozen|tundra|snow|blizzard|blizzards|extreme cold)\b/.test(text))environments.push('cold');
      if(/\b(desert|dunes|sandstorm|sandstorms)\b/.test(text))environments.push('desert');
      if(/\b(swamp|rain|rainstorms|marsh|wetland|torrential)\b/.test(text))environments.push('wet');
      if(/\b(forest|jungle|woodland)\b/.test(text))environments.push('forest');
      if(/\b(acid|acidic)\b/.test(text))environments.push('acid');
      if(/\b(fog|mist|haze)\b/.test(text))environments.push('fog');
      if(/\b(ion storm|ion storms|thunderstorm|thunderstorms)\b/.test(text))environments.push('storm');
      if(/\b(urban|city)\b/.test(text))environments.push('urban');
      const missionId=String(run.missionSelection?.id||'');
      const mission=missionId.startsWith('mission:')?missionId.slice(8):'';
      let missionTheme=null;
      // Curated IDs only: custom mission labels cannot fabricate live context.
      if(['evacuate-high-value-assets','defend-evacuation-site'].includes(mission))missionTheme='defense';
      else if(['emergency-evacuation','evacuate-colonists','rescue-science-teams','retrieve-essential-personnel'].includes(mission))missionTheme='evacuation';
      else if(['blitz-terminids','blitz-automatons','blitz-illuminate-ships','blitz-illuminate-gateways','blitz-toxic-pollination','blitz-bio-processors'].includes(mission))missionTheme='blitz';
      else if(['eradicate-terminids','eradicate-automatons'].includes(mission))missionTheme='eradicate';
      else if(['retrieve-valuable-data','upload-escape-pod-data','terminate-illegal-broadcast'].includes(mission))missionTheme='data';
      else if(['launch-icbm','conduct-geological-survey','enable-oil-extraction','start-fuel-pumps','activate-oil-pumps','spread-democracy','sabotage-air-base'].includes(mission))missionTheme='objective';
      const context=unique([...bank(lex.factions,faction),...environments.flatMap(k=>lex.environments[k]),...bank(lex.missions,missionTheme)]);
      if(!context.length)context.push(...lex.general);
      const secondary=elements[1];
      if(secondary&&scores[secondary]>=strength*.6)context.push(...lex.themes[secondary][tier(scores[secondary])]);
      const signature=JSON.stringify([VERSION,resolved.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),faction,
        planet.id??planet.index??'',planet.name||'',planet.sector||'',text,mission,run.mode||load.mode||'',run.difficulty??'']);
      return {theme,strength,tier:level,scores,secondary:secondary&&scores[secondary]>=strength*.6?secondary:null,environments,missionTheme,
        signature,prefixes:lex.themes[theme]?.[level]||lex.roles[theme],contexts:unique(context),endings:lex.endings};
    }
    function generate(run,existing=[]){
      const a=analyze(run),used=new Set(Array.from(existing,v=>nameKey(typeof v==='string'?v:v?.seed))),
        count=a.prefixes.length*a.contexts.length*a.endings.length,start=hash(a.signature)%count;
      const gcd=(x,y)=>y?gcd(y,x%y):x;
      let step=1+hash(a.signature+'|stride')%Math.max(1,count-1);while(gcd(step,count)!==1)step++;
      function phrase(at){const end=at%a.endings.length;at=Math.floor(at/a.endings.length);const mid=at%a.contexts.length;const first=Math.floor(at/a.contexts.length);return [a.prefixes[first],a.contexts[mid],a.endings[end]];}
      // Coprime traversal tries each combination once. No random retry loop.
      for(let i=0;i<count;i++){
        const parts=phrase((start+i*step)%count);if(new Set(parts.map(normalize)).size!==parts.length)continue;
        const name=parts.join(' ');if(!used.has(nameKey(name)))return {name,theme:a.theme,strength:a.strength,tier:a.tier,capacity:count};
      }
      // Only if a fitting finite bank is exhausted. Still unique among currently
      // saved names; deleting data removes that history. No worldwide guarantee.
      const base=phrase(start).join(' ');let serial=2;while(used.has(nameKey(`${base} ${serial}`)))serial++;
      return {name:`${base} ${serial}`,theme:a.theme,strength:a.strength,tier:a.tier,capacity:count};
    }
    return Object.freeze({analyze,generate});
  }
  function vocabularyStats(){
    const entries=[...Object.values(lex.themes).flat(2),...Object.values(lex.roles).flat(),...Object.values(lex.factions).flat(),...Object.values(lex.environments).flat(),...Object.values(lex.missions).flat(),...lex.general,...lex.endings];
    return {entries:entries.length,uniqueWords:new Set(entries.map(normalize)).size};
  }
  return Object.freeze({VERSION,create,weights,profiles,tier,nameKey,vocabularyStats});
});
