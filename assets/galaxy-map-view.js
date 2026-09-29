// Original SVG navigation view. No network, storage, scores or game-control side effects.
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./galaxy-map-model'));
  else root.HD2GalaxyView=factory(root.HD2GalaxyMap);
})(typeof globalThis!=='undefined'?globalThis:this,function(model){
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  let instanceId=0;
  const COLORS=Object.freeze({'Super Earth':'#80b9dd',Automatons:'#fa6475',Terminids:'#ffe04b',Illuminate:'#b17cff'});
  function camera(value={x:0,y:0,size:1000}){
    if(!value||![value.x,value.y,value.size].every(Number.isFinite))throw TypeError('Invalid camera');
    const size=Math.min(1000,Math.max(180,value.size));
    return {x:Math.min(1000-size,Math.max(0,value.x)),y:Math.min(1000-size,Math.max(0,value.y)),size};
  }
  function zoom(value,factor,anchor={x:.5,y:.5}){
    if(!Number.isFinite(factor)||factor<=0||![anchor.x,anchor.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1))throw TypeError('Invalid zoom');
    const c=camera(value),size=camera({...c,size:c.size/factor}).size;
    return camera({x:c.x+(c.size-size)*anchor.x,y:c.y+(c.size-size)*anchor.y,size});
  }
  function matches(p,query){
    // Search convenience only; never used to join identities or grant eligibility.
    const folded=value=>String(value||'').normalize('NFKC').replace(/[‘’]/g,"'").trim().toLocaleLowerCase('en');
    return [p.name,p.sector,p.enemyFaction,p.owner].some(v=>folded(v).includes(folded(query)));
  }
  function gestureCamera(value,start,end){
    if(!Array.isArray(start)||!Array.isArray(end)||![1,2].includes(start.length)||start.length!==end.length||
      ![...start,...end].every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)))throw TypeError('Invalid map gesture');
    const c=camera(value),mid=points=>({x:points.reduce((s,p)=>s+p.x,0)/points.length,y:points.reduce((s,p)=>s+p.y,0)/points.length});
    const a=mid(start),b=mid(end),distance=points=>Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y);
    const before=start.length===2?distance(start):0,after=end.length===2?distance(end):0;
    const size=before>0&&after>0?camera({...c,size:c.size*before/after}).size:c.size;
    return camera({size,x:c.x+a.x*c.size-b.x*size,y:c.y+a.y*c.size-b.y*size});
  }
  function nearestPlanet(planets,point,radius=15){
    if(!Array.isArray(planets)||!point||![point.x,point.y,radius].every(Number.isFinite)||radius<0)throw TypeError('Invalid hit test');
    let best=null,distance=radius;
    for(const p of planets){
      if(!p.screen)continue;
      const d=Math.hypot(p.screen.x-point.x,p.screen.y-point.y);
      if(d<distance||d===distance&&(!best||String(p.key)<String(best.key))){best=p;distance=d;}
    }
    return best;
  }
  // Original, approximate cluster shading, NOT a reconstruction of game borders.
  // Separate each recorded faction in mixed sectors instead of inventing an owner.
  function sectorRegions(planets,sector,padding=24){
    const radius=Number.isFinite(padding)?Math.max(1,Math.min(48,padding)):24;
    const groups=new Map();
    for(const p of planets){
      if(!sector||p.sector!==sector||!p.screen)continue;
      const faction=p.enemyFaction||p.owner||'Unknown';
      if(!groups.has(faction))groups.set(faction,[]);
      for(let i=0;i<8;i++){const a=i*Math.PI/4;groups.get(faction).push({x:p.screen.x+radius*Math.cos(a),y:p.screen.y+radius*Math.sin(a)});}
    }
    return [...groups].map(([faction,points])=>{
      points.sort((a,b)=>a.x-b.x||a.y-b.y);
      const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),half=rows=>{const h=[];for(const p of rows){while(h.length>1&&cross(h[h.length-2],h[h.length-1],p)<=0)h.pop();h.push(p);}return h;};
      const lower=half(points),upper=half([...points].reverse());
      return {faction,points:[...lower.slice(0,-1),...upper.slice(0,-1)]};
    });
  }
  // Icons categorize source labels for presentation only; labels are not replaced.
  function conditionIcon(label){
    const s=String(label).toLowerCase();
    if(/snow|blizzard|cold|ice|frozen/.test(s))return 'cold';
    if(/fire|heat|hot|magma|volcan/.test(s))return 'heat';
    if(/storm|lightning|ion/.test(s))return 'storm';
    if(/rain|wet|swamp/.test(s))return 'rain';
    if(/fog|sand|dust|mist/.test(s))return 'fog';
    return 'planet';
  }
  function environmentSummary(p){
    const env=p.environment||{},hazards=(env.hazards||[]).filter(h=>!['none','unknown','—','n/a'].includes(h.toLowerCase()));
    return {biome:env.biome&&!['none','unknown','—','n/a'].includes(env.biome.toLowerCase())?env.biome:'Environment unavailable',
      hazards,weatherUnknown:hazards.length===0,
      stamp:env.observedAt ? `${env.recent?'Retrieved':'Cached / unconfirmed'} ${env.observedAt.replace('T',' ').slice(0,16)} UTC` : 'Bundled / unavailable · Check in-game'};
  }
  function mount(host,{getInputs,onChoose=()=>{},canChoose=()=>true,onRefresh=null,getSyncState=()=>null}={}){
    if(!host?.ownerDocument||typeof getInputs!=='function'||typeof onChoose!=='function'||typeof canChoose!=='function'||typeof getSyncState!=='function'||(onRefresh!==null&&typeof onRefresh!=='function'))throw TypeError('Map host and callbacks required');
    const doc=host.ownerDocument,events=[];
    let current=null,focused=null,view=camera(),drag=null,disposed=false;
    const touches=new Map();let touchBase=null,touchMoved=false,suppressClickUntil=0,hovered=null;
    function el(tag,cls,text,parent){const e=doc.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;if(parent)parent.append(e);return e;}
    function svgEl(tag,attrs,parent){const e=doc.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));parent.append(e);return e;}
    function listen(e,name,fn,opts){e.addEventListener(name,fn,opts);events.push(()=>e.removeEventListener(name,fn,opts));}
    function button(label,parent,fn){const b=el('button','gm-button',label,parent);b.type='button';listen(b,'click',fn);return b;}
    const shell=el('section','gm-shell','',host);shell.setAttribute('aria-label','Galaxy map');
    const header=el('header','gm-header','',shell);
    const heading=el('div','gm-heading','',header);
    el('span','gm-eyebrow','ORBITAL NAVIGATION',heading);
    el('h2','','GALACTIC WAR',heading);const status=el('p','gm-status','',header);status.setAttribute('role','status');
    let refreshButton=null;
    if(onRefresh)refreshButton=button('Refresh war data',header,async()=>{try{await onRefresh();}catch(_){status.textContent='Refresh unavailable. Previous map retained.';}finally{update();}});
    const body=el('div','gm-body','',shell),stage=el('div','gm-stage','',body);
    const svg=svgEl('svg',{viewBox:'0 0 1000 1000',class:'gm-svg',role:'group','aria-label':'Galaxy. Select a planet to inspect it.',tabindex:0},stage);
    const title=svgEl('title',{},svg);title.textContent='Galaxy navigation';
    // Original atmospheric illustration: no game textures, sector or territory data.
    const gradientId=`gm-dust-${++instanceId}`,defs=svgEl('defs',{},svg);
    const glow=svgEl('radialGradient',{id:gradientId},defs);
    svgEl('stop',{offset:0,'stop-color':'#568fac','stop-opacity':.24},glow);
    svgEl('stop',{offset:.48,'stop-color':'#315d86','stop-opacity':.12},glow);
    svgEl('stop',{offset:1,'stop-color':'#152342','stop-opacity':0},glow);
    const atmosphere=svgEl('g',{'aria-hidden':'true',class:'gm-atmosphere'},svg);
    for(const [cx,cy,rx,ry,angle] of [[480,510,480,150,-36],[520,480,270,95,27],[420,570,260,95,-58]])
      svgEl('ellipse',{cx,cy,rx,ry,transform:`rotate(${angle} ${cx} ${cy})`,fill:`url(#${gradientId})`},atmosphere);
    for(let i=0;i<230;i++){
      const a=i*2.39996323,r=26+Math.sqrt(i/230)*430;
      svgEl('circle',{cx:500+Math.cos(a)*r,cy:500+Math.sin(a)*r*.56,r:i%7===0?1.6:.8,opacity:.15+(i%5)*.07},atmosphere);
    }
    const grid=svgEl('g',{'aria-hidden':'true',class:'gm-grid'},svg);
    for(let radius=92;radius<=460;radius+=92)svgEl('circle',{cx:500,cy:500,r:radius},grid);
    for(let angle=0;angle<360;angle+=30){const a=angle*Math.PI/180;svgEl('line',{x1:500,y1:500,x2:500+460*Math.cos(a),y2:500+460*Math.sin(a)},grid);}
    const bearings=svgEl('g',{'aria-hidden':'true',class:'gm-bearings'},svg);
    svgEl('circle',{cx:500,cy:500,r:478,class:'gm-outer-orbit'},bearings);
    for(let degree=0;degree<360;degree+=3){const a=(degree-90)*Math.PI/180,major=degree%30===0,r=major?463:471;
      svgEl('line',{x1:500+r*Math.cos(a),y1:500+r*Math.sin(a),x2:500+478*Math.cos(a),y2:500+478*Math.sin(a),class:major?'gm-major-tick':'gm-minor-tick'},bearings);
      if(major){const label=svgEl('text',{x:500+490*Math.cos(a),y:500+490*Math.sin(a),'text-anchor':'middle','dominant-baseline':'central'},bearings);label.textContent=String(degree).padStart(3,'0');}
    }
    // Deterministic decorative stars; they are not map records or selectable planets.
    const stars=svgEl('g',{'aria-hidden':'true',class:'gm-stars'},svg);
    for(let i=0;i<85;i++)svgEl('circle',{cx:35+(i*137%930),cy:35+(i*251%930),r:i%4===0?1.3:.65},stars);
    const connections=svgEl('g',{class:'gm-connections','aria-hidden':'true'},svg);
    const shades=svgEl('g',{class:'gm-sector-shades','aria-hidden':'true'},svg);
    const sectorLabels=svgEl('g',{class:'gm-sector-labels','aria-hidden':'true'},svg);
    const markers=svgEl('g',{},svg);
    const controls=el('div','gm-controls','',stage);
    button('+',controls,()=>setCamera(zoom(view,1.4))).setAttribute('aria-label','Zoom in');
    button('−',controls,()=>setCamera(zoom(view,1/1.4))).setAttribute('aria-label','Zoom out');
    button('Reset',controls,()=>setCamera(camera()));
    const tooltip=el('section','gm-tooltip','',stage);tooltip.hidden=true;tooltip.id=`gm-tip-${instanceId}`;tooltip.setAttribute('role','tooltip');
    const aside=el('aside','gm-aside','',body);
    const label=el('label','gm-search-label','Find planet or sector',aside);
    const search=el('input','gm-search','',label);search.type='search';search.placeholder='Search galaxy';search.maxLength=160;
    const sectorLabel=el('label','gm-search-label','Sector',aside),sectorSelect=el('select','gm-sector-select','',sectorLabel);
    const layerControls=el('div','gm-layer-controls','',aside);
    const linksLabel=el('label','gm-filter','',layerControls),linksToggle=el('input','','',linksLabel);linksToggle.type='checkbox';linksToggle.checked=true;linksLabel.append(doc.createTextNode('Supply lines'));
    const namesLabel=el('label','gm-filter','',layerControls),namesToggle=el('input','','',namesLabel);namesToggle.type='checkbox';namesToggle.checked=true;namesLabel.append(doc.createTextNode('Sector names'));
    const filterLabel=el('label','gm-filter gm-eligible-filter','',aside),filter=el('input','','',filterLabel);filter.type='checkbox';filter.checked=true;filterLabel.append(doc.createTextNode('Eligible only'));
    const detail=el('section','gm-detail','',aside);detail.setAttribute('aria-label','Planet details');
    const emblem=el('div','gm-planet-emblem','',detail);emblem.setAttribute('aria-hidden','true');
    el('div','gm-emblem-orbit','',emblem);el('div','gm-emblem-sphere','',emblem);
    const detailName=el('h3','','Select a planet',detail),detailText=el('p','','Inspect a marker or use the list.',detail);
    const detailConditions=el('div','gm-conditions','',detail);
    const choose=button('Choose planet',detail,()=>{
      if(!canChoose()){update();return;}
      const key=focused,inputs=getInputs();
      const planet=key&&model.selectPlanet(key,inputs);
      update();
      if(planet)onChoose(planet);
      else detailText.textContent='No longer eligible. Choose another planet.';
    });choose.disabled=true;
    const count=el('p','gm-count','',aside),list=el('div','gm-list','',aside);list.setAttribute('aria-label','Planet search results');
    const footer=el('footer','gm-footer','',shell);
    const legend=el('div','gm-legend','',footer);
    Object.entries(COLORS).forEach(([name,color])=>{const item=el('span','','',legend),dot=el('i','','',item);dot.style.backgroundColor=color;item.append(doc.createTextNode(name));});
    const mapNote=el('p','','',footer);
    function hideTip(){hovered=null;tooltip.hidden=true;for(const e of shell.querySelectorAll('[aria-describedby]'))e.removeAttribute('aria-describedby');}
    const ICONS={planet:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M3 12h18 M12 3c-5 5-5 13 0 18 M12 3c5 5 5 13 0 18',
      cold:'M12 2v20 M3 7l18 10 M3 17L21 7 M8 4l4 4 4-4 M8 20l4-4 4 4',
      heat:'M12 2c2 6 8 8 8 13a8 8 0 0 1-16 0c0-3 2-6 4-8 0 5 3 5 4-5Z',
      storm:'M7 11a4 4 0 1 1 1-8 5 5 0 0 1 9 2 3 3 0 0 1 0 6 M13 10l-5 7h5l-2 5 7-9h-5Z',
      rain:'M5 12a4 4 0 1 1 2-8 5 5 0 0 1 9 1 4 4 0 0 1 1 7H5 M7 16l-2 4 M13 16l-2 4 M19 16l-2 4',
      fog:'M3 6h13 M7 10h14 M3 14h15 M7 18h14',activity:'M12 3l10 18H2L12 3Z M12 9v5 M12 17v1',
      jet:'M5 14V5h5v9H5Z M14 14V5h5v9h-5Z M7 17v4 M16 17v4 M10 8h4',
      worm:'M4 21V11c0-10 16-10 16 0v3h-5v-3c0-4-6-4-6 0v10 M5 6l3 3 M19 6l-3 3 M5 15h3 M5 18h3',
      support:'M12 2l9 4v6c0 5-5 8-9 10-4-2-9-5-9-10V6l9-4Z M12 7v9 M8 11h8',
      spore:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',
      surge:'M4 17l8-11 8 11 M4 22l8-11 8 11 M12 2v1'};
    function chip(parent,label,kind=conditionIcon(label)){
      const row=el('span','gm-condition','',parent),icon=svgEl('svg',{viewBox:'0 0 24 24','aria-hidden':'true'},row);
      svgEl('path',{d:ICONS[kind]||ICONS.planet},icon);el('span','',label,row);
    }
    function showConditions(parent,p,compact=false){
      parent.replaceChildren();const info=environmentSummary(p);
      chip(parent,info.biome);
      for(const h of info.hazards.slice(0,compact?4:32))chip(parent,h);
      if(compact&&info.hazards.length>4)el('small','',`+${info.hazards.length-4} hazards · Click for details`,parent);
      if(info.weatherUnknown)el('small','','Weather not specified',parent);
      const report=p.activity,box=el('div','gm-activity','',parent);box.dataset.state=report?.state||'unavailable';
      if(report?.state&&report.state!=='unavailable'){
        el('small','gm-activity-heading',report.state==='recent-report'?'Reported activity':'Cached activity · Unconfirmed',box);
        const badges=report.badges||[];
        for(const badge of badges.slice(0,compact?4:15))chip(box,badge.label,
          badge.key==='jet-brigade'?'jet':badge.key==='hive-lords'?'worm':badge.key==='seaf'?'support':badge.key.includes('spore')?'spore':badge.key==='incineration'?'heat':'surge');
        if(!badges.length)chip(box,'Special activity: not reported','activity');
        if(compact&&badges.length>4)el('small','',`+${badges.length-4} · Click for details`,box);
        if(report.unreviewedIds?.length)el('small','',`${report.unreviewedIds.length} other modifier code(s) unreviewed`,box);
        if(report.fetchedAt)el('small','gm-activity-date',`Report ${report.fetchedAt.replace('T',' ').slice(0,16)} UTC`,box);
      }else chip(box,'Special activity: not reported','activity');
      box.title='Community-reported effects, not guaranteed encounters. Missing or unreviewed codes do not mean absent. Unchanged server counters do not refresh report age.';
      const note=el('small','gm-condition-source',info.stamp,parent);
      note.title='Environment metadata from the community API, not a live in-mission weather sensor. Activity has its own report date. Missing data does not mean absent.';
    }
    function showTip(key){
      if(drag||touches.size)return;
      // Refresh freshness labels at interaction time without issuing network calls.
      const p=model.build(getInputs()).planets.find(p=>p.key===key);
      if(!p){hideTip();return;}hovered=key;tooltip.replaceChildren();
      el('strong','',p.name,tooltip);el('small','',`${p.sector||'Unknown sector'} · ${p.enemyFaction||p.owner||'Unknown faction'}`,tooltip);
      const content=el('div','gm-conditions','',tooltip);showConditions(content,p,true);tooltip.hidden=false;
    }
    function setCamera(value){hideTip();view=camera(value);svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.size} ${view.size}`);shell.dataset.zoomed=String(view.size<650);}
    function inspect(key,move=false,reveal=false,keepEligibility=false){
      const p=current.planets.find(p=>p.key===key);
      // Reveal a reopened planet; retain filters already including it. Refresh
      // does not use this path or change the camera/selected run.
      if(reveal&&p){
        if(!matches(p,search.value))search.value='';
        if(sectorSelect.value&&sectorSelect.value!==p.sector)sectorSelect.value='';
        if(filter.checked&&!p.selectable&&!keepEligibility)filter.checked=false;
      }
      focused=key;render();
      if(move&&p?.screen){const size=Math.min(view.size,450);setCamera({size,x:p.screen.x-size/2,y:p.screen.y-size/2});}
    }
    function render(){
      if(disposed)return;
      const restoreKey=doc.activeElement?.closest('.gm-row')?.dataset.key;
      const previousSector=sectorSelect.value;sectorSelect.replaceChildren();
      const all=el('option','',`All sectors (${current.sectors.length})`,sectorSelect);all.value='';
      current.sectors.forEach(s=>{const opt=el('option','',s.name,sectorSelect);opt.value=s.name;});
      sectorSelect.value=current.sectors.some(s=>s.name===previousSector)?previousSector:'';
      const q=search.value,sector=sectorSelect.value;
      const inView=p=>matches(p,q)&&(!filter.checked||p.selectable)&&(!sector||p.sector===sector);
      const rows=current.planets.filter(inView).sort((a,b)=>a.name.localeCompare(b.name,'en'));
      hideTip();connections.replaceChildren();sectorLabels.replaceChildren();shades.replaceChildren();
      const byKey=new Map(current.planets.map(p=>[p.key,p]));
      if(linksToggle.checked)for(const link of current.connections){
        const a=byKey.get(link.from),b=byKey.get(link.to),focusedLink=link.from===focused||link.to===focused;
        svgEl('line',{x1:link.fromScreen.x,y1:link.fromScreen.y,x2:link.toScreen.x,y2:link.toScreen.y,
          'data-link':link.key,class:`gm-supply-line${focusedLink?' gm-supply-focused':''}${inView(a)||inView(b)?'':' gm-muted'}`},connections);
      }
      const focusedSector=byKey.get(focused)?.sector;
      for(const region of sectorRegions(current.planets,sector||focusedSector))svgEl('polygon',{
        points:region.points.map(p=>`${p.x},${p.y}`).join(' '),fill:COLORS[region.faction]||'#87909e',stroke:COLORS[region.faction]||'#87909e',
        'data-faction':region.faction},shades);
      if(namesToggle.checked)for(const s of current.sectors){if(!s.labelPosition||sector&&s.name!==sector)continue;
        const label=svgEl('text',{x:s.labelPosition.x,y:s.labelPosition.y-20,'text-anchor':'middle',class:s.name===(sector||focusedSector)?'gm-sector-focused':''},sectorLabels);label.textContent=s.name.toUpperCase();
      }
      markers.replaceChildren();list.replaceChildren();
      for(const p of current.planets){
        if(!p.screen)continue;
        const g=svgEl('g',{transform:`translate(${p.screen.x} ${p.screen.y})`,class:`gm-marker${p.id===0?' gm-home':''}${p.selectable?' gm-eligible':''}${p.key===focused?' gm-focused':''}${inView(p)?'':' gm-muted'}`,
          'data-key':p.key,role:'button',tabindex:-1,'aria-label':`${p.name}, ${p.selectable?'eligible':'context only'}`},markers);
        const tip=svgEl('title',{},g);tip.textContent=`${p.name} · ${p.sector||'Unknown sector'}`;
        svgEl('circle',{r:15,class:'gm-hit'},g);
        const color=COLORS[p.enemyFaction||p.owner]||'#87909e';
        svgEl('circle',{r:p.id===0?18:12,fill:color,class:'gm-aura'},g);
        svgEl('circle',{r:9,class:'gm-ring'},g);
        svgEl('circle',{r:p.id===0?7:4.5,fill:color,class:'gm-planet-dot'},g);
        svgEl('circle',{cx:-1.2,cy:-1.4,r:1.3,class:'gm-planet-glint'},g);
        if(p.key===focused)svgEl('path',{d:'M-15,-8 v-7 h7 M8,-15 h7 v7 M15,8 v7 h-7 M-8,15 h-7 v-7',class:'gm-target'},g);
        const text=svgEl('text',{x:14,y:4,class:'gm-marker-label'},g);text.textContent=p.name;
      }
      const fragment=doc.createDocumentFragment();
      for(const p of rows){
        const b=el('button','gm-row'+(p.key===focused?' gm-row-selected':''),'',fragment);b.type='button';b.dataset.key=p.key;
        b.style.borderLeftColor=COLORS[p.enemyFaction||p.owner]||'#87909e';
        b.setAttribute('aria-pressed',String(p.key===focused));
        el('strong','',p.name,b);el('span','',`${p.sector||'Unknown sector'} · ${!p.screen?'List only':p.selectable?'Eligible':'Context only'}`,b);
      }
      list.append(fragment);count.textContent=`${rows.length} planets${rows.length?'':' · No matches'}`;
      if(restoreKey){const restored=Array.from(list.children).find(b=>b.dataset.key===restoreKey);restored?.focus({preventScroll:true});}
      const p=current.planets.find(p=>p.key===focused);
      choose.disabled=!p?.selectable||!canChoose();
      if(p){
        showConditions(detailConditions,p);
        emblem.style.setProperty('--planet-accent',COLORS[p.enemyFaction||p.owner]||'#87909e');
        detailName.textContent=p.name;
        detailText.textContent=[p.sector,p.enemyFaction||p.owner||'Unknown ownership',p.campaignContext==='defense'?'Defense':p.campaignContext==='liberation'?'Liberation':null,
          p.selectable?'Eligible in this snapshot':'Not in the eligible list',!p.screen?'Position unavailable':null].filter(Boolean).join(' · ');
      }else{detailConditions.replaceChildren();focused=null;emblem.style.setProperty('--planet-accent','#80b9dd');detailName.textContent='Select a planet';detailText.textContent='Inspect a marker or use the list.';}
      const war=current.warStatus,atlas=current.atlasStatus;
      const sync=getSyncState();
      if(refreshButton){refreshButton.disabled=!!sync?.refreshing;refreshButton.textContent=sync?.refreshing?'Refreshing…':'Refresh war data';}
      status.textContent=(war.confirmedCurrentlyPlayable?'Live campaigns':'Offline / unconfirmed campaigns')+
        (atlas.observedAt?` · Atlas ${atlas.observedAt.replace('T',' ').slice(0,16)} UTC`:' · Atlas unavailable')+
        (sync?.lastError?' · Update failed; previous data':sync?.running&&sync?.online?sync.inspectionPolling?' · Auto: 1 min while map open':' · Auto: 5 min':'');
      mapNote.textContent=(current.connectionsAvailable?`${current.connections.length} API supply links`:'Supply-link data unavailable')+' · Shading shows approximate sector clusters, not exact borders. Community snapshots may lag the game; verify before diving.';
    }
    function update(){if(disposed)return;current=model.build(getInputs());render();}
    // Each manual chooser opening starts focused on playable-in-this-snapshot
    // candidates. A stale current planet must not silently turn the filter off.
    // Ordinary refreshes preserve the user's checkbox choice while browsing.
    function beginSelection(key){if(disposed)return;filter.checked=true;update();if(key)inspect(key,false,true,true);}
    listen(search,'input',render);listen(filter,'change',render);listen(sectorSelect,'change',render);listen(linksToggle,'change',render);listen(namesToggle,'change',render);
    listen(list,'click',e=>{const b=e.target.closest('[data-key]');if(b&&list.contains(b))inspect(b.dataset.key,true);});
    listen(list,'focusin',e=>{const b=e.target.closest('[data-key]');if(b){showTip(b.dataset.key);b.setAttribute('aria-describedby',tooltip.id);}});
    listen(list,'focusout',hideTip);
    function hitKey(e){
      const target=e.target.closest('[data-key]')?.dataset.key;
      // Keyboard/programmatic activation has no meaningful pointer coordinates.
      if(e.type==='click'&&e.detail===0)return target;
      const point=touchPoint(e);
      return (point&&nearestPlanet(current.planets,{x:view.x+point.x*view.size,y:view.y+point.y*view.size})?.key)||target;
    }
    listen(markers,'click',e=>{const key=hitKey(e);if(key)inspect(key);});
    listen(svg,'pointerleave',hideTip);
    listen(svg,'click',e=>{if(Date.now()<suppressClickUntil){e.preventDefault();e.stopPropagation();}},{capture:true});
    listen(svg,'keydown',e=>{
      if(e.key==='Escape'&&!tooltip.hidden){hideTip();e.preventDefault();e.stopPropagation();return;}
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','0'].includes(e.key)){
        e.preventDefault();e.stopPropagation();
        if(['+','=','-'].includes(e.key))setCamera(zoom(view,e.key==='-'?1/1.4:1.4));
        else if(e.key==='0')setCamera(camera());
        else setCamera({...view,x:view.x+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0)*view.size*.1,y:view.y+(e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0)*view.size*.1});
      }
    });
    listen(svg,'wheel',e=>{
      e.preventDefault();e.stopPropagation();
      // Horizontal-only trackpad motion is not a request to zoom out.
      if(touches.size||!Number.isFinite(e.deltaY)||e.deltaY===0)return;
      const rect=svg.getBoundingClientRect(),extent=Math.min(rect.width,rect.height);
      if(!Number.isFinite(extent)||extent<=0)return;
      const x=(e.clientX-rect.left-(rect.width-extent)/2)/extent,y=(e.clientY-rect.top-(rect.height-extent)/2)/extent;
      if(x>=0&&x<=1&&y>=0&&y<=1)setCamera(zoom(view,e.ctrlKey?Math.exp(-Math.max(-100,Math.min(100,e.deltaY))*.01):e.deltaY<0?1.15:1/1.15,{x,y}));
    },{passive:false});
    function touchPoint(e){
      const r=svg.getBoundingClientRect(),extent=Math.min(r.width,r.height);
      return extent>0?{x:(e.clientX-r.left-(r.width-extent)/2)/extent,y:(e.clientY-r.top-(r.height-extent)/2)/extent}:null;
    }
    function rebaseTouch(){touchBase=touches.size?{view:{...view},points:[...touches.values()].map(p=>({x:p.x,y:p.y}))}:null;}
    listen(svg,'pointerdown',e=>{
      e.stopPropagation();if(e.button!==0)return;
      hideTip();
      if(e.pointerType==='touch'){
        const p=touchPoint(e);if(!p||touches.size>=2)return;
        drag=null;
        if(!touches.size)touchMoved=false;else touchMoved=true;
        touches.set(e.pointerId,{...p,key:hitKey(e)});rebaseTouch();svg.setPointerCapture(e.pointerId);return;
      }
      if(touches.size)return;
      const rect=svg.getBoundingClientRect(),extent=Math.min(rect.width,rect.height);if(extent<=0)return;
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,view:{...view},extent,key:hitKey(e),moved:false};
      svg.setPointerCapture(e.pointerId);
    });
    listen(svg,'pointermove',e=>{
      if(touches.has(e.pointerId)){
        const p=touchPoint(e);if(!p)return;
        touches.set(e.pointerId,{...touches.get(e.pointerId),...p});const points=[...touches.values()];
        if(points.some((p,i)=>Math.hypot(p.x-touchBase.points[i].x,p.y-touchBase.points[i].y)>.008))touchMoved=true;
        if(touchMoved)setCamera(gestureCamera(touchBase.view,touchBase.points,points));return;
      }
      if(drag&&drag.id===e.pointerId){
        if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5)drag.moved=true;
        if(drag.moved)setCamera({...drag.view,x:drag.view.x-(e.clientX-drag.x)*drag.view.size/drag.extent,y:drag.view.y-(e.clientY-drag.y)*drag.view.size/drag.extent});
      }else if(!touches.size&&e.pointerType!=='touch'){
        const key=hitKey(e);if(key&&hovered!==key)showTip(key);else if(!key)hideTip();
      }
    });
    const end=e=>{
      if(touches.has(e.pointerId)){
        const p=touches.get(e.pointerId);suppressClickUntil=Date.now()+500;
        if(e.type==='pointerup'&&touches.size===1&&!touchMoved&&p.key)inspect(p.key);
        touches.delete(e.pointerId);rebaseTouch();
      }
      if(drag?.id===e.pointerId){
        const ended=drag;drag=null;suppressClickUntil=Date.now()+500;
        // Pointer capture retargets the browser click to SVG. Resolve an actual
        // click here, but never let a drag/cancel select or finalize a planet.
        if(e.type==='pointerup'&&!ended.moved&&ended.key)inspect(ended.key);
      }
      if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);
    };
    listen(svg,'pointerup',end);listen(svg,'pointercancel',end);listen(svg,'lostpointercapture',end);
    function cancelGestures(){
      hideTip();
      const ids=[...touches.keys(),...(drag?[drag.id]:[])];
      touches.clear();touchBase=null;drag=null;
      if(ids.length)suppressClickUntil=Date.now()+500;
      for(const id of ids)if(svg.hasPointerCapture(id))svg.releasePointerCapture(id);
    }
    listen(doc.defaultView,'blur',cancelGestures);
    listen(doc,'visibilitychange',()=>{if(doc.hidden)cancelGestures();});
    update();
    return Object.freeze({update,inspect,beginSelection,cancelGestures,getCamera:()=>({...view}),dispose:()=>{cancelGestures();disposed=true;events.forEach(off=>off());shell.remove();}});
  }
  return Object.freeze({COLORS,camera,zoom,gestureCamera,nearestPlanet,matches,sectorRegions,conditionIcon,environmentSummary,mount});
});
