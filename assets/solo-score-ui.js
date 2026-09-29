(function(root) {
  'use strict';
  const S=root.HD2SoloScore;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>n==null?'N/A':String(Math.round(n*10)/10);
  const summary=card=>{const r=S.result(card);return !card.statsLocked ? 'Solo · not finalized' : r.eligible ? 'Solo rating '+fmt(r.rating)+'/100' : 'Solo · unranked';};
  function radar(card) {
    const r=S.result(card), values=r.axes;
    const point=(i,n)=>[180+Math.cos(-Math.PI/2+i*Math.PI/3)*n,150+Math.sin(-Math.PI/2+i*Math.PI/3)*n];
    const points=f=>values.map((_,i)=>point(i,85*f).join(',')).join(' ');
    let svg='<svg class="soloRadar" viewBox="0 0 360 300" role="img" aria-label="'+esc(S.AXES.map((a,i)=>a+' '+fmt(values[i])).join(', '))+'"><title>Solo performance · fixed preview benchmarks</title>';
    for (const f of [.25,.5,.75,1]) svg+='<polygon points="'+points(f)+'" class="soloRadarGrid"/>';
    values.forEach((v,i)=>{const p=point(i,85);svg+='<path d="M180 150L'+p.join(' ')+'" class="soloRadarGrid"/>';});
    if(values.every(v=>v!=null)) svg+='<polygon points="'+values.map((v,i)=>point(i,85*v/100).join(',')).join(' ')+'" class="soloRadarFill"/>';
    values.forEach((v,i)=>{
      const next=values[(i+1)%6];
      if(v!=null&&next!=null) svg+='<path d="M'+point(i,85*v/100).join(' ')+'L'+point((i+1)%6,85*next/100).join(' ')+'" class="soloRadarEdge"/>';
      if(v!=null){const p=point(i,85*v/100);svg+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3" class="soloRadarDot"/>';}
      const p=point(i,112),anchor=i===0||i===3?'middle':i<3?'start':'end';
      const name=i===2?'Survival':S.AXES[i];
      svg+='<text x="'+p[0]+'" y="'+(p[1]-3)+'" text-anchor="'+anchor+'">'+name+'<tspan x="'+p[0]+'" dy="17">'+fmt(v)+'</tspan></text>';
    });
    return svg+'</svg>';
  }
  const rules='<details class="soloRules"><summary>Scoring · Solo v2 preview</summary><p>Provisional benchmarks, not official game ratings. Firepower: 100 × √min(kills/min ÷ 20, 1). This gentler curve boosts low/mid kill rates; zero stays zero and 20+ kills/min reaches 100. Precision: entered accuracy %. Survival: 100 − 25 × deaths per 10 minutes. Speed: 100 × remaining fraction of the mission time limit after a successful finish; failed mission = 0. Each axis is capped at 0–100.</p><p>Utility = completed / available side objectives × 100. Zero available = N/A, excluded from the average. Unknown inputs leave the run unranked. Mission = 100 for completed, 0 for failed. Rating = equal-weight average of applicable axes. Extraction is separate; stims, Major Orders, distance, shots and stratagem counts add no bonus or penalty. Accuracy and kills cannot measure damage absorbed, heavy kills or weapon-specific effectiveness.</p><p>Results → Review card rules previews an optional update. Back up & apply requires confirmation; Later retains old ratings in separate rule-version groups. Entered numbers, notes and the other five axes do not change. Rank groups match difficulty, faction, mission identity/time limit and available objective count. Successful missions first, then rating. Ratings do not move when other cards change. Legacy scores are frozen separately. This is a run-performance profile, not proof of a loadout’s causal effectiveness.</p></details>';
  function detail(card) {
    const r=S.result(card);
    const outcome=r.missionSuccess==null?'Outcome unknown':r.missionSuccess?'Mission complete':'Mission failed';
    const extraction=card.stats?.extractedSafely===true?'Extracted':card.stats?.extractedSafely===false?'Not extracted':'Extraction unknown';
    return '<section class="soloSummary"><div class="savedScoreHeading"><h3>'+esc(r.eligible?fmt(r.rating)+' / 100':'Unranked')+'</h3><span>Solo v'+r.version+' · preview</span></div>'+
      '<div class="savedOutcome"><span>'+esc(outcome)+'</span><span>'+esc(extraction)+'</span></div>'+
      '<div class="savedPerformance">'+radar(card)+'<div class="soloMetrics">'+[
        ['Time',fmt(r.minutes)+' / '+fmt(r.timeLimit)+' min'],['Objectives',fmt(r.sideDone)+' / '+fmt(r.sideAvailable)]
      ].map(([a,b])=>'<div><span>'+a+'</span><strong>'+esc(b)+'</strong></div>').join('')+'</div></div>'+
      (!r.eligible?'<p>Missing: '+esc([...r.errors,...r.missing].join(' · '))+'</p>':'')+
      rulesFor(card).replace(/<summary>.*?<\/summary>/,'<summary>Scoring</summary><p>'+esc(fmt(r.killsPerMinute)+' kills/min · '+fmt(r.deathsPer10)+' deaths/10 min')+'</p>'+(card.soloScore.originalResult?'<p>Original: '+esc(fmt(card.soloScore.originalResult.rating))+'/100 · Firepower '+esc(fmt(card.soloScore.originalResult.axes[0]))+'. Original rating retained in exports.</p>':''))+
      (card.cardHistory?.revisions.length?'<details><summary>Rating history</summary>'+card.cardHistory.revisions.map(v=>'<p>'+esc(v.ruleId+' · '+fmt(v.result.rating)+'/100 · '+v.evaluatedAt)+'</p>').join('')+'</details>':'')+'</section>';
  }
  function rulesFor(card) {
    if(card.soloScore.version!==1)return rules;
    return rules.replace('Scoring · Solo v2 preview','Scoring · Solo v1 preview').replace('100 × √min(kills/min ÷ 20, 1). This gentler curve boosts low/mid kill rates; zero stays zero and 20+ kills/min reaches 100.','min(kills/min ÷ 20, 1) × 100. This retained v1 rating has not been recalibrated.');
  }
  function editor(card,draft,body) {
    if (!S.isSolo(card)) return;
    const locked=!!card.statsLocked;
    draft.soloInputs ||= JSON.parse(JSON.stringify(card.soloScore.inputs));
    const i=draft.soloInputs;
    const panel=document.createElement('section');panel.className='soloEntry';panel.id='soloEntry';
    panel.innerHTML='<h3>Solo performance</h3><p>Copy your end-of-mission stats. Leave unknown entries blank; the card will be unranked.</p><div class="soloEntryGrid">'+
      '<label>Mission time (minutes)<input id="soloMinutes" type="number" min="0.01" max="240" step="any" placeholder="12.5 = 12m 30s" value="'+esc(i.minutes)+'" '+(locked?'disabled':'')+'></label>'+
      '<label>Available side objectives<input id="soloAvailable" type="number" min="0" max="100" step="1" value="'+esc(i.sideAvailable)+'" '+(locked?'disabled':'')+'></label>'+
      '<label>Main mission<select id="soloOutcome" '+(locked?'disabled':'')+'><option value="">Unknown</option><option value="true">Completed</option><option value="false">Failed</option></select></label></div><p id="soloEntryStatus" aria-live="polite"></p>'+rulesFor(card);
    body.querySelector('.modalStatGrid').before(panel);
    panel.querySelector('#soloOutcome').value=i.missionSuccess==null?'':String(i.missionSuccess);
    const update=()=>{
      if(!locked){
        const minutes=panel.querySelector('#soloMinutes'), available=panel.querySelector('#soloAvailable');
        i.minutes=minutes.validity.badInput?NaN:minutes.value===''?null:Number(minutes.value);
        i.sideAvailable=available.validity.badInput?NaN:available.value===''?null:Number(available.value);
        const outcome=panel.querySelector('#soloOutcome').value;i.missionSuccess=outcome===''?null:outcome==='true';
      }
      const r=S.evaluate(card,i,draft.stats);
      panel.querySelector('#soloEntryStatus').textContent=r.errors.length?r.errors.join(' '):r.eligible?'Preview rating: '+fmt(r.rating)+'/100':'Unranked until supplied: '+r.missing.join(', ');
    };
    panel.addEventListener('input',update);panel.addEventListener('change',update);
    body.querySelectorAll('[data-k]').forEach(el=>{el.addEventListener('change',update);});update();
    const mo=body.querySelector('[data-role="moButtons"]');if(mo)mo.closest('.modalMajorOrderBlock').hidden=true;
    if(locked) body.querySelector('.resultDetail').prepend(Object.assign(document.createElement('div'),{innerHTML:detail(card)}));
  }
  function mountRank(cards,openCard) {
    const tab=document.getElementById('tab-rank');if(!tab)return;
    let host=document.getElementById('soloRank');
    if(!host){host=document.createElement('section');host.id='soloRank';tab.prepend(host);}
    const oldChoice=host.querySelector('#soloRankGroup')?.value;
    const legacy=document.getElementById('rankFocusPanel');
    const showLegacy=host.dataset.legacy==='true';
    const groups=S.groups(cards), unfinished=cards.filter(c=>S.isSolo(c)&&c.statsLocked&&!S.result(c).eligible).length;
    host.innerHTML='<div class="soloRankHeading"><h2>Solo performance · v2 preview</h2><button type="button" id="soloLegacyToggle">'+(showLegacy?'Show Solo ranking':'Show Legacy ranking')+'</button></div><div id="soloRankContent">'+
      '<p>Successful missions first · equal-weight rating · comparable solo runs only</p><label for="soloRankGroup">Comparison group</label><select id="soloRankGroup"></select><div id="soloRankRows"></div><p>'+unfinished+' finalized card(s) unranked due to unknown inputs. Legacy cards stay separate.</p>'+rules+'</div>';
    const show=()=>{legacy.hidden=host.dataset.legacy!=='true';host.querySelector('#soloRankContent').hidden=!legacy.hidden;host.querySelector('#soloLegacyToggle').textContent=legacy.hidden?'Show Legacy ranking':'Show Solo ranking';};
    host.querySelector('#soloLegacyToggle').onclick=()=>{host.dataset.legacy=String(host.dataset.legacy!=='true');show();};show();
    const select=host.querySelector('#soloRankGroup');
    groups.forEach(g=>{const r=S.result(g.cards[0]),c=r.context;select.add(new Option('Solo v'+r.version+' · D'+c.difficulty+' · '+c.faction+' · '+c.missionName+' · '+c.timeLimit+' min · '+c.sideAvailable+' side objectives',g.key));});
    if(groups.some(g=>g.key===oldChoice))select.value=oldChoice;
    const render=()=>{
      const rows=host.querySelector('#soloRankRows');rows.replaceChildren();
      const group=groups.find(g=>g.key===select.value);
      if(!group){rows.textContent='No ranked solo cards yet. Create a Result and enter its mission time, outcome and objective counts.';return;}
      group.cards.slice(0,100).forEach((card,index)=>{
        const r=S.result(card), row=document.createElement('article');row.className='soloRankRow';
        const title=document.createElement('h3');title.textContent='#'+(index+1)+' · '+(card.seed||'Run')+' · '+fmt(r.rating)+'/100';row.append(title);
        const status=document.createElement('p');status.textContent=(r.missionSuccess?'Completed':'Failed')+' · '+(card.stats.extractedSafely?'Extracted':'Not extracted')+' · Side objectives '+r.sideDone+'/'+r.sideAvailable;row.append(status);
        const graph=document.createElement('div');graph.innerHTML=radar(card);row.append(graph);
        const key=c=>JSON.stringify([c.primary,c.sidearm,c.throwable,c.booster,c.stratagems]);
        const peers=group.cards.filter(c=>key(c)===key(card)),wins=peers.filter(c=>S.result(c).missionSuccess).length;
        const history=document.createElement('p');history.textContent='This loadout in this group: '+wins+'/'+peers.length+' successful ('+fmt(wins/peers.length*100)+'%).';row.append(history);
        const button=document.createElement('button');button.type='button';button.textContent='View card / comments';button.onclick=()=>openCard(card.id);row.append(button);rows.append(row);
      });
      if(group.cards.length>100)rows.append(document.createTextNode('Showing the first 100 ranked runs in this group.'));
    };
    select.onchange=render;render();
  }
  root.HD2SoloScoreUI=Object.freeze({radar,detail,editor,mountRank,summary});
})(globalThis);
