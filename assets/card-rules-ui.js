(function(root) {
  'use strict';
  function mount(api) {
    const R=root.HD2CardRules;
    let active=false,browserConflict=false;
    if(!api.desktop)root.addEventListener('storage',event=>{
      if(event.storageArea===localStorage && (event.key===api.browserKey||event.key===null))browserConflict=true;
    });
    api.button.addEventListener('click',async()=>{
      if(active||!api.ready())return;
      active=true;
      const dialog=document.createElement('dialog');dialog.className='cardRulesDialog';dialog.id='cardRulesDialog';
      const title=document.createElement('h2');title.textContent='Update card ratings';dialog.append(title);
      const status=document.createElement('p');status.setAttribute('role','status');dialog.append(status);
      const list=document.createElement('div');list.className='cardRulesList';dialog.append(list);
      const warning=document.createElement('p');warning.textContent='Incomplete finalized cards will leave your active history. A full recovery copy is kept first. Pending cards, entered stats, notes and comments stay unchanged.';dialog.append(warning);
      const footer=document.createElement('div');footer.className='cardRulesActions';
      const later=document.createElement('button');later.textContent='Later';later.type='button';
      const apply=document.createElement('button');apply.textContent='Back up & apply';apply.type='button';apply.disabled=true;
      footer.append(later,apply);dialog.append(footer);document.body.append(dialog);
      let committing=false,preview,signature,browserRevision;
      const close=()=>{if(committing)return;dialog.close();dialog.remove();active=false;api.button.focus();};
      later.onclick=close;
      dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
      dialog.showModal();
      try {
        status.textContent='Checking saved cards…';
        if(browserConflict)throw Error('Another tab changed this save. Reload before reviewing cards.');
        if(!await api.save()||!await api.flush())throw Error('Save your latest changes before reviewing cards.');
        signature=R.stable(api.getData());
        if(!api.desktop)browserRevision=localStorage.getItem(api.browserKey);
        preview=api.desktop?await api.desktop.previewCardRules():{ok:true,...R.preview(api.getData())};
        if(!preview?.ok)throw Error(preview?.error||'Cards could not be reviewed.');
        const c=preview.counts;
        status.textContent=`Solo v${R.CURRENT} · Update ${c.update} · Remove ${c.incomplete} · Keep ${c.current+c.pending} · Blocked ${c.blocked+c.unsupported}`;
        const labels={update:'Update',incomplete:'Remove',current:'Current',pending:'Pending — keep',blocked:'Blocked',unsupported:'Needs newer app'};
        for(const row of preview.rows) {
          const item=document.createElement('p');
          item.textContent=labels[row.status]+' · '+row.name+(row.status==='update'?` · ${row.before??'Unranked'} → ${row.after}/100`:'')+(row.reasons.length?' · '+row.reasons.join('; '):'');
          list.append(item);
        }
        if(!preview.rows.length)list.textContent='No saved cards yet.';
        if(c.blocked+c.unsupported)warning.textContent='Nothing can change while a card is invalid or unsupported. Keep your files and use a compatible app; no cards will be removed.';
        else if(!preview.canApply)warning.textContent='Your cards are already current. No changes needed.';
        apply.disabled=!preview.canApply;
      } catch(error) {status.textContent=error.message;}
      apply.onclick=async()=>{
        if(committing||apply.disabled)return;
        committing=true;api.busy(true);apply.disabled=true;later.disabled=true;
        let committed=false;
        try {
          if(!await api.flush()||R.stable(api.getData())!==signature)throw Error('Cards changed. Close this review and try again.');
          let result;
          if(api.desktop)result=await api.desktop.applyCardRules(preview.token);
          else {
            const previous=localStorage.getItem(api.browserKey);
            if(browserConflict||previous!==browserRevision){browserConflict=true;throw Error('Another tab changed this save. Close this review and reload before trying again.');}
            const data=R.apply(api.getData());
            const payload=JSON.stringify(R.envelope(data));
            const key=api.browserKey+':card-upgrade:'+crypto.randomUUID();
            if(!previous)throw Error('Existing save not found. Nothing changed.');
            localStorage.setItem(key,previous);
            if(localStorage.getItem(key)!==previous)throw Error('Backup verification failed.');
            if(localStorage.getItem(api.browserKey)!==previous)throw Error('Save changed. Review again.');
            localStorage.setItem(api.browserKey,payload);
            result={ok:true,data,backup:'Browser recovery storage (also export a JSON copy)'};
          }
          if(!result?.ok)throw Error(result?.error||'Update not saved.');
          committed=true;
          api.publish(result.data);
          status.textContent='Done. Card ratings updated.';
          list.replaceChildren();warning.textContent='Recovery copy: '+result.backup+' · Restore only after reviewing newer dives/comments; restoring a whole save replaces them.';
          apply.hidden=true;later.textContent='Close';
        } catch(error) {status.textContent=(committed?'Saved, but the view could not refresh. Restart the app. ':'Nothing applied. ')+error.message;}
        finally {committing=false;api.busy(false);later.disabled=false;}
      };
    });
    // A quiet, non-destructive indicator; never a startup removal or automatic update.
    root.setInterval(()=>{
      if(active||!api.ready())return;
      try {const p=R.preview(api.getData());const n=p.counts.update+p.counts.incomplete;
        api.button.textContent=n?'REVIEW CARD RULES ('+n+')':'REVIEW CARD RULES';
      }catch(_){api.button.textContent='REVIEW CARD RULES';}
    },5000);
  }
  root.HD2CardRulesUI=Object.freeze({mount});
})(globalThis);
