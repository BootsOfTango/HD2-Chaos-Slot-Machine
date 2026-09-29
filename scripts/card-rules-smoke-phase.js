async function rendererCardRulesPhase(fixture) {
  const checks=[];
  const assert=(ok,label)=>{if(!ok)throw Error('CARD RULES: '+label);checks.push(label);};
  const wait=async predicate=>{const end=Date.now()+15000;while(!predicate()){if(Date.now()>end)throw Error('Card rules UI timed out: '+document.querySelector('#cardRulesDialog')?.textContent);await new Promise(r=>setTimeout(r,30));}};
  window.alert=()=>{};
  await bootStateReady;await saveHealth.flush();
  const initial={cards:[fixture.soloV1,fixture.legacy,{id:'pending-rules',statsLocked:false}],settings:{rememberedPlayerName:'Rules test'}};
  const candidate=prepareImportedData(initial);
  assert(candidate.cards[0].soloScore.version===1,'import preparation does not upgrade v1');
  publishPreparedState(candidate);await saveState();await saveHealth.flush();switchTab('results');renderResults();
  const before=JSON.stringify(state.cards);
  const open=async()=>{document.getElementById('btnCardRules').click();await wait(()=>document.querySelector('#cardRulesDialog [role=status]')?.textContent.includes('Update 1'));};
  const close=()=>document.querySelector('#cardRulesDialog button').click();
  await open();
  assert(document.querySelector('#cardRulesDialog').textContent.includes('Remove 1'),'review explicitly lists incomplete removal');
  assert(document.querySelector('#cardRulesDialog').textContent.includes('67.5 → 71.67'),'review shows old and new rating');
  close();assert(JSON.stringify(state.cards)===before,'Later preserves all old cards and ratings');
  await open();
  state.cards[0].commentNotes.push({id:'later-comment',text:'Keep the new comment',createdAt:new Date().toISOString()});await saveState();
  document.querySelector('#cardRulesDialog button:last-child').click();
  await wait(()=>document.querySelector('#cardRulesDialog [role=status]').textContent.includes('Nothing applied.'));
  assert(state.cards.length===3&&state.cards[0].soloScore.version===1,'changed collection invalidates review without deleting');
  close();await open();
  document.querySelector('#cardRulesDialog button:last-child').click();
  await wait(()=>document.querySelector('#cardRulesDialog [role=status]').textContent.includes('Done.'));
  assert(state.cards.length===2,'only reviewed incomplete finalized card removed');
  assert(state.cards.some(c=>c.id==='pending-rules'&&!c.statsLocked),'pending card retained');
  const card=state.cards.find(c=>c.id===fixture.soloV1.id);
  assert(card.soloScore.version===2&&card.soloScore.result.rating===71.67,'new rating uses fixed target rules');
  assert(card.cardHistory.source.soloScore.result.rating===67.5&&card.cardHistory.revisions.length===1,'original and one revision retained');
  assert(card.commentNotes.some(c=>c.id==='later-comment'),'later comment survives confirmed update');
  assert(card.originalNote===fixture.soloV1.originalNote&&card.stats.kills===100,'locked note and kills preserved');
  const backupText=document.querySelector('#cardRulesDialog').textContent;
  assert(backupText.includes('card-upgrades')&&backupText.includes('before.json'),'recovery location displayed');
  close();
  const disk=(await desktopStorage.loadState()).data;
  assert(JSON.stringify(disk.cards)===JSON.stringify(state.cards),'published collection matches committed disk state');
  const again=await desktopStorage.previewCardRules();assert(!again.canApply,'already updated cards are not offered twice');
  const rejected=await desktopStorage.applyCardRules(again.token);assert(!rejected.ok,'empty/repeated operation refused');
  const roundtrip=HD2CSMTransfer.parse(HD2CSMTransfer.serialize(buildPersistedStatePayload()));
  assert(JSON.stringify(roundtrip.cards)===JSON.stringify(state.cards),'export/reimport preserves rating history and pending record');
  assert(JSON.parse(HD2CSMTransfer.serialize(roundtrip)).saveFormatVersion===2,'history transfer explicitly uses save format2');
  const later=deepClone(fixture.soloV1);later.id='later-old-import';
  assert(HD2CardRules.preview({cards:[...state.cards,later]}).counts.update===1,'later old import is noticed after previous calibration');
  openResultCardModal(card.id);
  assert(document.querySelector('#resultCardModal').textContent.includes('Rating history'),'saved-card detail exposes rating history');
  closeResultCardModal();
  document.getElementById('btnCardRules').click();await wait(()=>document.querySelector('#cardRulesDialog [role=status]')?.textContent.includes('Update 0'));
  assert(document.querySelector('#cardRulesDialog button:last-child').disabled,'current review cannot accidentally reapply');
  close();
  // Browser branch, using a synthetic storage key and isolated in-memory cards.
  // The native profile/current collection is never replaced by these checks.
  const browserKey='test:card-rules-browser';let browserData=deepClone(initial),browserBusy=false;
  let browserButton=document.createElement('button');document.body.append(browserButton);
  HD2CardRulesUI.mount({button:browserButton,desktop:null,getData:()=>browserData,ready:()=>!browserBusy,
    save:async()=>{localStorage.setItem(browserKey,JSON.stringify(browserData));return true;},flush:async()=>true,
    busy:v=>browserBusy=v,publish:d=>browserData=d,browserKey});
  browserButton.click();await wait(()=>document.querySelector('#cardRulesDialog [role=status]')?.textContent.includes('Update 1'));
  const foreign=JSON.stringify({...browserData,settings:{rememberedPlayerName:'Another tab'}});localStorage.setItem(browserKey,foreign);
  document.querySelector('#cardRulesDialog button:last-child').click();await wait(()=>document.querySelector('#cardRulesDialog [role=status]').textContent.includes('Nothing applied.'));
  assert(localStorage.getItem(browserKey)===foreign&&browserData.cards.length===3,'browser review refuses a changed cross-tab save');
  close();browserButton.click();await wait(()=>document.querySelector('#cardRulesDialog [role=status]')?.textContent.includes('Reload'));
  assert(localStorage.getItem(browserKey)===foreign,'retry cannot overwrite another tab before preview');
  close();browserButton.remove();browserData=HD2CSMTransfer.parse(foreign);
  browserButton=document.createElement('button');document.body.append(browserButton);
  HD2CardRulesUI.mount({button:browserButton,desktop:null,getData:()=>browserData,ready:()=>!browserBusy,
    save:async()=>{localStorage.setItem(browserKey,JSON.stringify(browserData));return true;},flush:async()=>true,
    busy:v=>browserBusy=v,publish:d=>browserData=d,browserKey});
  browserButton.click();await wait(()=>document.querySelector('#cardRulesDialog [role=status]')?.textContent.includes('Update 1'));
  const browserBefore=localStorage.getItem(browserKey);
  document.querySelector('#cardRulesDialog button:last-child').click();await wait(()=>document.querySelector('#cardRulesDialog [role=status]').textContent.includes('Done.'));
  assert(browserData.cards.length===2&&browserData.cards[0].soloScore.version===2,'browser confirmation publishes complete target state');
  const browserBackups=Object.keys(localStorage).filter(k=>k.startsWith(browserKey+':card-upgrade:'));
  assert(browserBackups.length===1&&localStorage.getItem(browserBackups[0])===browserBefore,'browser safety copy retains exact previous data');
  assert(JSON.parse(localStorage.getItem(browserKey)).saveFormatVersion===2,'browser commit uses downgrade-protected envelope');
  close();browserButton.remove();
  document.getElementById('btnCardRules').click();await wait(()=>document.querySelector('#cardRulesDialog [role=status]')?.textContent.includes('Update 0'));
  return {checks,exportData:deepClone(buildPersistedStatePayload()),backupText};
}
async function rendererCardRulesVerify(expected) {
  const checks=[],assert=(ok,label)=>{if(!ok)throw Error('CARD RULES RESTART: '+label);checks.push(label);};
  window.alert=()=>{};await bootStateReady;await saveHealth.flush();
  assert(JSON.stringify(state.cards)===JSON.stringify(expected.exportData.cards),'complete recalibrated card collection survives restart');
  assert(state.cards[0].soloScore.result.rating===71.67,'new rating unchanged after restart');
  assert(state.cards[0].cardHistory.source.soloScore.result.rating===67.5,'original rating retained after restart');
  assert(state.cards[0].cardHistory.revisions.length===1,'restart does not duplicate revision');
  assert(state.cards[0].commentNotes.some(c=>c.id==='later-comment'),'comment survives restart');
  assert(!(await desktopStorage.previewCardRules()).canApply,'restart offers no repeated calibration');
  return {checks};
}
module.exports={rendererCardRulesPhase,rendererCardRulesVerify};
