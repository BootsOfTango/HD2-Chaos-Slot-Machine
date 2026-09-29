// Lifecycle glue: reuse campaign authority, own only the supplied atlas lifecycle by default.
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./galaxy-map-view'));
  else root.HD2GalaxySession=factory(root.HD2GalaxyView);
})(typeof globalThis!=='undefined'?globalThis:this,function(view){
  'use strict';
  function connect(host,{atlasService,warService=null,activityService=null,ownWarLifecycle=false,getPreferences=()=>[],onChoose=()=>{},canChoose=()=>true,now=Date.now,
    isActive=()=>!host.ownerDocument.hidden,setTimer=setTimeout,clearTimer=clearTimeout}={}){
    if(!atlasService)throw TypeError('Atlas service required');
    const doc=host.ownerDocument,win=doc.defaultView;let disposed=false,started=false,inspecting=false,inspectionTimer=null;
    const inputs=()=>{const a=atlasService.getState(),w=warService?.getState();return {atlas:a.atlas,snapshot:w?.snapshot||null,activity:activityService?.getState()||null,editable:getPreferences(),now:now(),online:a.online&&w?.online!==false,refreshFailed:!!w?.lastError,atlasRefreshFailed:!!a.lastError};};
    const sync=()=>{const a=atlasService.getState(),w=warService?.getState();return {...a,inspectionPolling:inspecting&&started&&isActive(),refreshing:a.refreshing||!!w?.refreshing||!!activityService?.getState().refreshing,lastError:a.lastError||w?.lastError||null};};
    const refresh=()=>Promise.allSettled([atlasService.refresh('manual'),warService?.refresh('manual'),activityService?.refresh('manual')]);
    const widget=view.mount(host,{getInputs:inputs,getSyncState:sync,onChoose,canChoose,onRefresh:refresh});
    const off=[atlasService.subscribe(()=>widget.update())];if(warService)off.push(warService.subscribe(()=>widget.update()));
    if(activityService)off.push(activityService.subscribe(()=>widget.update()));
    function listen(target,event,fn){target.addEventListener(event,fn);off.push(()=>target.removeEventListener(event,fn));}
    function clearInspection(){if(inspectionTimer!==null)clearTimer(inspectionTimer);inspectionTimer=null;}
    function scheduleInspection(){
      clearInspection();if(disposed||!started||!inspecting||!isActive()||!atlasService.getState().online)return;
      inspectionTimer=setTimer(()=>{inspectionTimer=null;void refreshInspection();scheduleInspection();},60000);
    }
    async function refreshInspection(){
      if(disposed||!started||!inspecting||!isActive())return;
      const a=atlasService.getState(),w=warService?.getState();
      // Existing services still enforce anonymous requests, deduplication,
      // cooldown and server Retry-After. Hovering never issues a request.
      const old=stamp=>!stamp||now()-Date.parse(stamp)>=60000;
      await Promise.allSettled([a.online&&old(a.observedAt)?atlasService.refresh('manual'):undefined,
        w?.online&&old(w.snapshot?.fetchedAt)?warService.refresh('manual'):undefined,
        activityService?.getState().online&&old(activityService.getState().lastCheckedAt)?activityService.refresh('manual'):undefined]);
      if(!disposed)widget.update();
    }
    function setInspecting(value){inspecting=!!value;scheduleInspection();void refreshInspection();widget.update();}
    function active(){if(!started)return;void atlasService.setActive(isActive());void activityService?.setActive(isActive());if(ownWarLifecycle)void warService?.setActive(isActive());scheduleInspection();void refreshInspection();}
    function online(){void atlasService.setOnline(win.navigator.onLine);void activityService?.setOnline(win.navigator.onLine);if(ownWarLifecycle)void warService?.setOnline(win.navigator.onLine);scheduleInspection();void refreshInspection();}
    function stop(){started=false;clearInspection();atlasService.stop();activityService?.stop();if(ownWarLifecycle)warService?.stop();}
    function start(){if(disposed||started)return Promise.resolve([]);started=true;active();return Promise.allSettled([atlasService.start(),activityService?.start(),ownWarLifecycle?warService?.start():undefined]);}
    listen(doc,'visibilitychange',active);listen(win,'focus',()=>{active();if(started&&isActive())void atlasService.refresh('resume');});
    listen(win,'online',online);listen(win,'offline',online);listen(win,'pagehide',stop);listen(win,'pageshow',()=>{void start();});
    return Object.freeze({start,stop,refresh,setInspecting,update:widget.update,inspect:widget.inspect,beginSelection:widget.beginSelection,cancelGestures:widget.cancelGestures,getCamera:widget.getCamera,
      dispose(){if(disposed)return;disposed=true;off.forEach(f=>f());stop();widget.dispose();}});
  }
  return {connect};
});
