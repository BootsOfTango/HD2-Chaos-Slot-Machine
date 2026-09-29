// Runs inside an isolated packaged renderer. Controlled responses, not live API data.
async function rendererActivitySoak(stage, expected) {
  const assert=(ok,label)=>{if(!ok)throw Error('ACTIVITY SOAK: '+label);checks.push(label);};
  const checks=[];
  if(stage==='restart'){
    const service=HD2ActivityService.createService({storage:localStorage,online:false});
    try{
      assert(service.getState().source==='cache','actual renderer restart restores activity cache');
      assert(service.getState().snapshot?.warTick===expected.tick,'restart keeps the last valid activity tick');
      assert(service.getState().stale,'restart never treats cached activity as live');
      assert(!state.current.loadout&&!state.current.locked&&!state.current.planetConfirmed,'restart resets the unsaved roll without inventing persisted session state');
      assert(JSON.stringify(state.cards)===expected.cards,'restart preserves saved Results');
    }finally{service.dispose();}
    return {checks};
  }
  if(stage==='start'){
    // The workflow ends with a cleared current selection. Populate a synthetic
    // locked run so byte-equality cannot pass vacuously on an empty session.
    const card=state.cards.find(card=>card.planet&&card.faction&&card.missionSelection);
    assert(!!card,'saved fixture supplies a real catalog planet and mission');
    state.current={...state.current,loadout:rollLoadout(null),locked:true,
      difficulty:card.difficulty,difficultySelected:true,faction:card.faction,
      planet:JSON.parse(JSON.stringify(card.planet)),planetLocked:true,planetConfirmed:true,
      mode:card.mode,modeConfirmed:true,missionSelection:JSON.parse(JSON.stringify(card.missionSelection)),spinning:false};
    state.current.loadout.faction=card.faction;
    assert(!!state.current.loadout.primary&&state.current.loadout.stratagems.length===4&&state.current.planetConfirmed,
      'soak begins with populated equipment and a confirmed planet, not an empty run');
    const atlas=HD2GalaxyMap.validateAtlas(await(await fetch('assets/galaxy-atlas-bundled.json')).json());
    const host=document.createElement('div');document.body.append(host);
    host.style.cssText='position:fixed;inset:0;z-index:999999;overflow:auto;background:#08111b';
    const s=window.__activitySoak={started:performance.now(),calls:[],statusCount:0,offset:0,mode:'good',
      current:JSON.stringify(state.current),cards:JSON.stringify(state.cards),host};
    s.service=HD2ActivityService.createService({storage:localStorage,now:()=>Date.now()+s.offset,fetchImpl:async url=>{
      s.calls.push({url,elapsed:performance.now()-s.started});
      if(url===HD2ActivityService.URL)return new Response(JSON.stringify({id:801}));
      s.statusCount++;
      if(s.mode==='bad')return new Response('{}');
      return new Response(JSON.stringify({warId:801,time:100+s.statusCount,planetStatus:[{index:34}],
        planetActiveEffects:[{index:34,galacticEffectId:s.statusCount===1?1308:1202}]}));
    }});
    s.widget=HD2GalaxyView.mount(host,{getInputs:()=>({atlas,activity:s.service.getState(),now:Date.now()+s.offset,online:true})});
    s.off=s.service.subscribe(()=>s.widget.update());
    await s.service.start();s.widget.inspect('id:34');
    assert(s.statusCount===1&&s.calls.length===2,'startup uses one discovery/status transaction');
    assert(host.textContent.includes('Hive Lords'),'startup report visible in actual packaged view');
    return {checks};
  }
  const s=window.__activitySoak;
  if(stage==='poll')return {elapsed:performance.now()-s.started,statusCount:s.statusCount,calls:s.calls.length,
    active:s.service.getState().active,stale:s.service.getState().stale,
    sameCurrent:JSON.stringify(state.current)===s.current,sameCards:JSON.stringify(state.cards)===s.cards};
  if(stage==='finish'){
    try{
      assert(performance.now()-s.started>=300000,'real five-minute renderer timer elapsed without accelerated clock');
      assert(s.statusCount===2&&s.calls.length===4,'exactly one automatic five-minute follow-up transaction');
      assert(!s.service.getState().stale&&s.host.textContent.includes('Jet Brigade'),'automatic refresh replaces activity badge and stays fresh');
      await s.service.setOnline(false);
      assert(s.host.textContent.includes('Cached activity'),'disconnect immediately marks view unconfirmed');
      const count=s.calls.length;
      for(let i=0;i<20;i++)await s.service.refresh();
      assert(s.calls.length===count,'repeated manual refresh cannot fetch offline');
      // Remaining transitions use explicit simulated time offsets, not a real-hour claim.
      s.offset+=360000;s.mode='bad';await s.service.setOnline(true);
      assert(s.service.getState().lastError==='invalid-snapshot','reconnect rejects malformed response');
      assert(s.host.textContent.includes('Jet Brigade')&&s.host.textContent.includes('Cached activity'),'failed reconnect keeps last valid badge labeled unconfirmed');
      s.offset+=60000;s.mode='good';await s.service.refresh();
      assert(!s.service.getState().stale&&s.host.textContent.includes('Reported activity'),'recovery replaces stale warning with a new dated report');
      await s.service.setActive(false);const hidden=s.calls.length;s.offset+=600000;
      assert((await s.service.refresh('background')).reason==='inactive'&&s.calls.length===hidden,'hidden lifecycle pauses automatic requests');
      await s.service.setActive(true);
      assert(s.calls.length===hidden+2&&!s.service.getState().stale,'resume refreshes stale activity once');
      assert(JSON.stringify(state.current)===s.current,'refresh/reconnect/resume preserve confirmed run byte-for-byte');
      assert(JSON.stringify(state.cards)===s.cards,'refresh/reconnect/resume preserve saved Results byte-for-byte');
      const result={checks,current:s.current,cards:s.cards,tick:s.service.getState().snapshot.warTick,
        elapsed:performance.now()-s.started,requests:s.calls,
        scope:'First automatic interval uses real time; reconnect/resume freshness uses simulated offsets. Controlled responses; no game-client comparison.'};
      // Persist a real-time dated equivalent for the next process: the simulated
      // future timestamps must never masquerade as valid real-world cache data.
      const cache=JSON.parse(localStorage.getItem(HD2ActivityService.CACHE_KEY));
      cache.fetchedAt=new Date().toISOString();localStorage.setItem(HD2ActivityService.CACHE_KEY,JSON.stringify(cache));
      return result;
    }finally{s.off();s.service.dispose();s.widget.dispose();s.host.remove();delete window.__activitySoak;}
  }
  throw Error('Unknown activity soak stage');
}
module.exports={rendererActivitySoak};
