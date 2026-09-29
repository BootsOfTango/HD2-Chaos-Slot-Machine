// Read-only saved-run locator. Bundled geography is reference, never historical territory.
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./galaxy-map-model'),require('./galaxy-identities'),require('./galaxy-map-view'));
  else root.HD2CardPlanet=factory(root.HD2GalaxyMap,root.HD2GalaxyIdentities,root.HD2GalaxyView);
})(typeof globalThis!=='undefined'?globalThis:this,function(galaxy,identities,view){
  'use strict';
  const text=v=>typeof v==='string'?v.trim().slice(0,160):'';
  const sectorKey=v=>text(v).toLowerCase().replace(/[’‘]/g,"'").replace(/ sector$/,'');
  const colors=Object.freeze({Automatons:'#ff6874',Terminids:'#ffda42',Illuminate:'#ba89ff'});
  function model(card,atlas){
    const planet=card?.planet;
    if(!planet||typeof planet!=='object'||Array.isArray(planet))return null;
    const name=text(planet.name)||'Unknown planet',sector=text(planet.sector),faction=text(card.faction);
    const rows=Array.isArray(atlas?.planets)?atlas.planets:[];
    const matches=Number.isSafeInteger(planet.id)&&planet.id>=0?rows.filter(p=>p.id===planet.id):[];
    const match=planet.id==null?identities.resolve(planet,atlas):matches.length===1?matches[0]:null;
    const recorded=galaxy.project(planet.position),target=recorded||galaxy.project(match?.position);
    // Sector membership is reference geography only; do not replace the recorded label.
    const sameSector=match&&(!sector||sectorKey(sector)===sectorKey(match.sector));
    const neighbors=target&&sameSector?rows.filter(p=>p.id!==match.id&&p.sector===match.sector)
      .map(p=>({id:p.id,name:text(p.name),point:galaxy.project(p.position)})).filter(p=>p.point).slice(0,64):[];
    const points=target?[target,...neighbors.map(p=>p.point)]:[];
    const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
    const span=points.length?Math.max(80,Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)):80;
    const cx=points.length?(Math.max(...xs)+Math.min(...xs))/2:0,cy=points.length?(Math.max(...ys)+Math.min(...ys))/2:0;
    // Fit the sector to a compact landscape viewport, preserving the shared X-right/Y-up projection.
    const scale=140/span,place=p=>({x:180+(p.x-cx)*scale,y:118+(p.y-cy)*scale});
    const placed=neighbors.map(p=>({...p,point:place(p.point)})),selected=target?place(target):null;
    const members=sameSector&&selected?[{id:match.id,point:selected},...placed]:[];
    const byId=new Map(members.map(p=>[p.id,p.point])),edges=new Map();
    // Only documented intra-sector reference routes; never connect dots by proximity.
    for(const row of rows)if(byId.has(row.id))for(const id of Array.isArray(row.waypoints)?row.waypoints:[]){
      if(id===row.id||!byId.has(id))continue;
      const key=[row.id,id].sort((a,b)=>a-b).join(':');
      if(!edges.has(key))edges.set(key,{key,from:byId.get(Math.min(row.id,id)),to:byId.get(Math.max(row.id,id)),selected:row.id===match.id||id===match.id});
    }
    // Approximate sector outline, tinted by this run's enemy. It is NOT ownership.
    const region=members.length?view.sectorRegions(members.map(p=>({sector:'reference',screen:p.point})), 'reference',14)[0]?.points||[]:[];
    return {name,sector:sector||'Sector unknown',faction:faction||'Faction unknown',color:colors[faction]||'#b8c7d3',
      biome:text(card.planetBiome)||text(planet.biome?.name)||text(planet.biome),
      target:selected,neighbors:placed,region,connections:[...edges.values()].sort((a,b)=>a.key.localeCompare(b.key,'en')),
      positionSource:recorded?'recorded':target?'bundled-reference':'unavailable',atlasAt:text(atlas?.observedAt)};
  }
  let bundlePromise;
  function bundle(){
    // Local application asset only. No community API, storage writes or per-card polling.
    return bundlePromise ||= fetch('assets/galaxy-atlas-bundled.json').then(r=>{
      if(!r.ok)throw Error('Atlas missing');return r.json();
    }).then(raw=>galaxy.validateAtlas(raw)).catch(()=>null);
  }
  function render(host,value){
    const doc=host.ownerDocument,el=(tag,content,cls)=>{const node=doc.createElement(tag);if(content)node.textContent=content;if(cls)node.className=cls;return node;};
    host.replaceChildren();host.dataset.positionSource=value.positionSource;
    const visual=el('div',null,'cardPlanetMap');
    if(value.target){
      const svg=(tag,attrs={})=>{const n=doc.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));return n;};
      const map=svg('svg',{viewBox:'0 0 360 240',role:'img','aria-label':`Sector locator for ${value.name}, ${value.sector}. Approximate outline in recorded ${value.faction} color. Reference geography and routes, not historical territory.`});
      const title=svg('title');title.textContent=`${value.sector} · bundled reference${value.atlasAt?' · '+value.atlasAt.slice(0,10):''}. Shading marks the sector cluster in this run's enemy color, not neighbor ownership or exact borders. Routes are bundled reference links, not historical or live supply status.`;map.append(title);
      for(let x=20;x<360;x+=32)map.append(svg('path',{d:`M${x} 30V204`,stroke:'#233746','stroke-width':.6}));
      for(let y=44;y<204;y+=32)map.append(svg('path',{d:`M14 ${y}H346`,stroke:'#233746','stroke-width':.6}));
      if(value.region.length)map.append(svg('polygon',{class:'cardPlanetSector',points:value.region.map(p=>`${p.x},${p.y}`).join(' '),fill:value.color,'fill-opacity':.16,stroke:value.color,'stroke-opacity':.7,'stroke-width':1.3,'stroke-dasharray':'5 3','stroke-linejoin':'round'}));
      for(const edge of value.connections)map.append(svg('path',{class:'cardPlanetRoute',d:`M${edge.from.x} ${edge.from.y}L${edge.to.x} ${edge.to.y}`,fill:'none',stroke:edge.selected?value.color:'#9bb4c4','stroke-opacity':edge.selected?.9:.5,'stroke-width':edge.selected?2:1.2}));
      for(const p of value.neighbors){const dot=svg('circle',{cx:p.point.x,cy:p.point.y,r:3.7,fill:'#b6c8d4',stroke:'#0c141b','stroke-width':1});const hint=svg('title');hint.textContent=p.name;dot.append(hint);map.append(dot);}
      const {x,y}=value.target;
      map.append(svg('circle',{cx:x,cy:y,r:18,fill:value.color,opacity:.1}),svg('circle',{cx:x,cy:y,r:10,fill:'none',stroke:value.color,'stroke-width':1.4}),svg('circle',{cx:x,cy:y,r:4.5,fill:value.color}),
        svg('path',{d:`M${x-18} ${y-8}v-10h10 M${x+8} ${y-18}h10v10 M${x+18} ${y+8}v10h-10 M${x-8} ${y+18}h-10v-10`,fill:'none',stroke:value.color,'stroke-width':1.2}));
      const label=(content,attrs)=>{const n=svg('text',attrs);n.textContent=content;map.append(n);return n;};
      const short=(s,n)=>s.length>n?s.slice(0,n-1)+'…':s;
      label(short(value.sector.replace(/ sector$/i,'').toUpperCase()+' SECTOR',30),{x:16,y:21,class:'cardPlanetSectorName',fill:value.color,'font-size':15,'font-weight':800,'letter-spacing':1});
      map.append(svg('path',{d:`M${x} ${y+19}V210H20`,fill:'none',stroke:value.color,'stroke-width':.8,'stroke-opacity':.7}));
      label(short(value.name.toUpperCase(),32),{x:16,y:229,class:'cardPlanetTargetName',fill:'#f1f6fa','font-size':13,'font-weight':700});
      visual.append(map);
    }else visual.append(el('span','Location unavailable','cardPlanetMissing'));
    visual.append(el('span',value.target?(value.region.length?'Approx. sector · ':'')+(value.connections.length?'Reference routes':'Routes unavailable'):'No reliable coordinates','cardPlanetCaption'));
    const info=el('div',null,'cardPlanetInfo');
    const image=globalThis.HD2PlanetArt.createImage({biome:value.biome},true);
    const labels=el('div',null,'cardPlanetLabels');labels.append(el('strong',value.name),el('span',value.sector),el('span',value.faction,'cardPlanetFaction'));
    labels.lastChild.style.color=value.color;labels.lastChild.textContent=value.faction+' · saved run';
    if(value.biome)labels.append(el('span',value.biome,'cardPlanetBiome'));
    info.append(image,labels);host.append(visual,info);
    host.title='Recorded run details. Illustrative globe; locator uses recorded coordinates or bundled reference geography, not live or historical faction territory.';
  }
  function mount(body,card){
    const value=model(card,null);if(!value)return;
    const anchor=body.querySelector('.modalLoadoutGrid');if(!anchor)return;
    const host=body.ownerDocument.createElement('section');host.className='cardPlanetVisual';host.setAttribute('aria-label','Run planet');anchor.before(host);
    render(host,value);
    void bundle().then(atlas=>{if(host.isConnected)render(host,model(card,atlas));});
    return host;
  }
  return Object.freeze({model,mount});
});
