// Main-app dialog adapter. Background snapshots never mutate the selected run.
(function(root){
  'use strict';
  async function create({warService,getPreferences,canChoose,onChoose,onList}){
    const dialog=document.getElementById('galaxyDialog'),host=document.getElementById('galaxyMapHost');
    let bundle=null;
    try{const response=await fetch('assets/galaxy-atlas-bundled.json');if(!response.ok)throw Error('Missing bundle');bundle=root.HD2GalaxyMap.validateAtlas(await response.json());}
    catch(error){console.warn('[galaxy] Atlas unavailable; campaign positions and list remain usable.',error.message);}
    const atlas=root.HD2GalaxyAtlas.createService({bundledAtlas:bundle,online:navigator.onLine!==false,
      storage:{getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)}});
    const activity=root.HD2ActivityService.createService({online:navigator.onLine!==false,
      storage:{getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)}});
    let opener=null;
    function close(){map.setInspecting?.(false);map.cancelGestures?.();if(dialog.open)dialog.close();if(opener?.isConnected)opener.focus({preventScroll:true});}
    const map=root.HD2GalaxySession.connect(host,{atlasService:atlas,activityService:activity,warService,getPreferences,canChoose,
      onChoose:planet=>{if(!canChoose())return;close();onChoose(planet);}});
    document.getElementById('closeGalaxyMap').addEventListener('click',close);
    document.getElementById('galaxyUseList').addEventListener('click',()=>{close();onList();});
    dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
    // Native modal top layer provides focus trapping/inert background in browser and desktop.
    // Keep map scrolling separate from the desktop's wide page canvas.
    void map.start();
    return Object.freeze({open(selectedKey){if(!canChoose()||dialog.open)return;opener=document.activeElement;map.beginSelection(selectedKey);dialog.showModal();map.setInspecting?.(true);document.getElementById('closeGalaxyMap').focus();},
      close,update(){if(dialog.open)map.update();},refresh:map.refresh,isOpen:()=>dialog.open});
  }
  root.HD2GalaxyApp={create};
})(globalThis);
