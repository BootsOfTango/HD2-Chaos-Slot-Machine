(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HD2CardEntry = api;
})(globalThis, function() {
  'use strict';
  const numeric = (key, label, color, extra = {}) => ({key, label, color, type:'number', min:0, max:Number.MAX_SAFE_INTEGER, step:'1', group:'stats', ...extra});
  const base = [
    numeric('kills','KILLS','#ffdb4d'),
    numeric('accuracy','ACCURACY','#7bcfff',{max:100,step:'any',suffix:'%',prompt:'What was your'}),
    numeric('deaths','DEATHS','#ff9292'),
    numeric('stims','STIMS USED','#7be3aa'),
    numeric('bulletCount','SHOTS FIRED','#ffdb4d'),
    numeric('blueSideObjCount','SIDE OBJECTIVES DONE','#7bcfff',{max:100}),
    numeric('stratUses','STRATAGEM USES','#c4a8ff'),
    numeric('distanceKm','DISTANCE TRAVELLED','#7be3aa',{step:'any',suffix:'km',prompt:'What was your'})
  ];
  function steps(solo) {
    return [...base, ...(solo ? [
      numeric('minutes','MISSION TIME','#7bcfff',{group:'soloInputs',min:0.01,max:240,step:'any',suffix:'minutes',prompt:'What was your',hint:'12.5 minutes = 12 min 30 sec.'}),
      numeric('sideAvailable','SIDE OBJECTIVES AVAILABLE','#7bcfff',{group:'soloInputs',max:100,hint:'Enter the total on this mission. None? Enter 0.'}),
      {key:'missionSuccess',group:'soloInputs',label:'MAIN MISSION',color:'#ffdb4d',type:'choice',prompt:'Did you complete the',choices:[[true,'Completed'],[false,'Failed']]}
    ] : [{key:'majorOrderDone',label:'MAJOR ORDER',color:'#ffdb4d',type:'choice',prompt:'Did you complete the',choices:[[true,'Completed'],[false,'Failed']]}]),
      {key:'extractedSafely',label:'EXTRACTION',color:'#7be3aa',type:'choice',prompt:'How did',choices:[[true,'Extracted'],[false,'Not extracted']]},
      {key:'originalNote',label:'RUN NOTE',color:'#c4a8ff',type:'note',prompt:'Add a',hint:'Optional. This note locks when you save. Comments stay available.'}
    ];
  }
  const read=(draft,s)=>s.group ? draft[s.group]?.[s.key] : draft[s.key];
  function validate(s, value) {
    if(s.type==='note') return String(value??'').length<=10000 ? '' : 'Keep your note under 10,000 characters.';
    if(s.type==='choice') return typeof value==='boolean' ? '' : 'Choose one answer.';
    if(value==null || value==='') return 'Enter a number (0 if none).';
    const n=Number(value);
    if(!Number.isFinite(n) || n<s.min || n>s.max || (s.step==='1'&&!Number.isSafeInteger(n))) return s.step==='1' ? `Enter a whole number from ${s.min} to ${s.max}.` : `Enter a number from ${s.min} to ${s.max}.`;
    return '';
  }
  function validateAll(draft, solo) {
    const errors=steps(solo).map(s=>({key:s.key,error:validate(s,read(draft,s))})).filter(v=>v.error);
    if(solo && Number(draft.stats.blueSideObjCount)>Number(draft.soloInputs.sideAvailable)) errors.push({key:'sideAvailable',error:'Available objectives must be at least the number completed.'});
    return errors;
  }
  function mount({card, draft, body, cancel, save, upgrade, details}) {
    const solo=!!card.soloScore, fields=steps(solo);
    // Work only on the transient draft; cancellation never modifies the card.
    draft.soloInputs ||= solo ? structuredClone(card.soloScore.inputs) : {};
    body.querySelectorAll(':scope > *').forEach(el=>el.hidden=true);
    const host=document.createElement('section');host.id='cardEntryWizard';body.prepend(host);
    let index=0, returnToReview=false, busy=false;
    const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;};
    const button=(text,fn,cls='btnGhost')=>{const b=el('button',text,cls);b.type='button';b.onclick=fn;return b;};
    const write=(s,v)=>{if(s.group)draft[s.group][s.key]=v;else draft[s.key]=v;if(s.key==='extractedSafely')draft.stats.extractedSafely=v;};
    function draw() {
      host.replaceChildren();body.closest('.cardModalDialog').scrollTop=0;
      const review=index===fields.length;
      host.append(el('p',review?'Final review':`Step ${index+1} of ${fields.length}`,'entryProgress'));
      if(!solo && index===0 && upgrade) { host.append(el('p','This unfinished card uses Legacy scoring.','entryHint'),button('Use new Solo scoring',upgrade)); }
      if(index===0 && details) { const options=el('details',null,'entryOptions');options.append(el('summary','Card options'),button('View details & comments',details));host.append(options); }
      const title=el('h2');title.id='entryQuestion';title.tabIndex=-1;host.append(title);
      const error=el('p',null,'entryError');error.id='entryError';error.setAttribute('role','alert');
      const footer=el('div',null,'entryActions');
      footer.append(button('Cancel',cancel));
      let control;
      if(review) {
        title.textContent='Check your answers';
        const list=el('div',null,'entryReview');
        fields.forEach((s,i)=>{
          const row=el('div',null,'entryReviewRow');const value=read(draft,s);
          const label=el('span',s.label);label.style.color=s.color;
          const answer=el('strong',s.type==='choice'?(s.choices.find(c=>c[0]===value)?.[1]||'Not entered'):s.type==='note'?(value||'No note'):`${value??'Not entered'}${s.suffix?' '+s.suffix:''}`);
          const edit=button('Edit',()=>{index=i;returnToReview=true;draw();});edit.setAttribute('aria-label','Edit '+s.label);row.append(label,answer,edit);list.append(row);
        });host.append(list);
        const warning=el('p','Saving permanently locks these numbers, outcomes and your run note. You can still add comments.','entryWarning');warning.id='entryLockWarning';host.append(warning);
        const checkLabel=el('label',null,'entryAcknowledge');const check=el('input');check.type='checkbox';check.id='entryAcknowledge';checkLabel.append(check,el('span','I have checked my answers.'));host.append(checkLabel);
        footer.append(button('Back',()=>{index=fields.length-1;draw();}));
        const final=button('Save & lock',()=>{
          if(busy)return;
          const errors=validateAll(draft,solo);
          if(errors.length){error.textContent=errors[0].error;return;}
          if(!check.checked){error.textContent='Check your answers and tick the box before saving.';return;}
          busy=true;final.disabled=true;
          try{save();}finally{busy=false;if(final.isConnected)final.disabled=false;}
        },'btnPrimary');final.id='entrySave';final.setAttribute('aria-describedby','entryLockWarning');footer.append(final);
        const errors=validateAll(draft,solo);if(errors.length)error.textContent=errors[0].error;
      } else {
        const s=fields[index];title.append(document.createTextNode((s.prompt||'How many')+' '));const accent=el('span',s.label);accent.style.color=s.color;title.append(accent,document.createTextNode(s.type==='note'?'':s.key==='extractedSafely'?' go?':'?'));
        if(s.hint){const hint=el('p',s.hint,'entryHint');hint.id='entryHint';host.append(hint);}
        if(s.type==='choice'){
          const choices=el('div',null,'entryChoices');choices.setAttribute('role','group');choices.setAttribute('aria-labelledby',title.id);
          s.choices.forEach(([value,label])=>{const choice=button(label,()=>{write(s,value);draw();});choice.dataset.choice=String(value);choice.setAttribute('aria-pressed',String(read(draft,s)===value));choices.append(choice);});host.append(choices);
        }else{
          control=el(s.type==='note'?'textarea':'input');control.id='entryValue';control.dataset.key=s.key;control.setAttribute('aria-labelledby',title.id);control.setAttribute('aria-describedby','entryError'+(s.hint?' entryHint':''));
          if(s.type==='number'){control.type='number';control.min=s.min;control.max=s.max;control.step=s.step;control.inputMode=s.step==='1'?'numeric':'decimal';}else control.maxLength=10000;
          control.value=read(draft,s)??'';host.append(control);
          if(s.suffix)host.append(el('p',s.suffix,'entryUnit'));
        }
        const advance=()=>{
          const value=control?control.value:read(draft,s);
          const invalid=control?.validity?.badInput?'Enter a valid number.':validate(s,value);
          if(invalid){error.textContent=invalid;control?.focus();return;}
          write(s,s.type==='number'?Number(value):value);
          if(solo&&s.key==='sideAvailable'&&draft.stats.blueSideObjCount>Number(value)){error.textContent='Available objectives must be at least the number completed.';return;}
          index=returnToReview?fields.length:index+1;returnToReview=false;draw();
        };
        if(index>0)footer.append(button('Back',()=>{if(control&&!validate(s,control.value))write(s,s.type==='number'?Number(control.value):control.value);index--;returnToReview=false;draw();}));
        const next=button(returnToReview?'Return to review':index===fields.length-1?'Review':'Next',advance,'btnPrimary');next.id='entryNext';footer.append(next);
        control?.addEventListener('keydown',event=>{if(event.key==='Enter'&&s.type!=='note'){event.preventDefault();advance();}});
      }
      host.append(error,footer);
      if(control){control.focus({preventScroll:true});if(control.tagName==='INPUT')control.select();}else title.focus({preventScroll:true});
    }
    draw();
  }
  function compact(body) {
    const detail=body.querySelector('.resultDetail');if(!detail)return;
    detail.classList.add('compactCardDetail');
    const fold=(label,nodes)=>{const list=nodes.filter(Boolean);if(!list.length)return;const d=document.createElement('details');d.className='cardDetailFold';const s=document.createElement('summary');s.textContent=label;d.append(s);list[0].before(d);list.forEach(n=>d.append(n));return d;};
    const heading=detail.querySelector('.resultSummaryHeading');
    if(heading){detail.prepend(heading);heading.querySelectorAll('.resultDetailMetaLabel').forEach((e,i)=>e.textContent=['Run','Player','Difficulty'][i]);}
    // Keep existing controls/handlers for compatibility, but present immutable values as text.
    fold('Loadout',[detail.querySelector('.modalLoadoutGrid'),detail.querySelector('.modalPlanetWrap')]);
    const recorded=fold('Stats',[detail.querySelector('.soloEntry'),detail.querySelector('.modalStatGrid')]);
    const numbers=document.createElement('div');numbers.className='savedNumbers';
    const names={kills:'Kills',accuracy:'Accuracy %',deaths:'Deaths',stims:'Stims',bulletCount:'Shots',blueSideObjCount:'Objectives done',stratUses:'Stratagems used',distanceKm:'Distance · km'};
    detail.querySelectorAll('.modalStatGrid input').forEach(input=>{const box=document.createElement('div'),label=document.createElement('span'),value=document.createElement('strong');label.textContent=names[input.dataset.k]||input.dataset.k;value.textContent=input.value;box.append(label,value);numbers.append(box);});
    if(recorded){recorded.querySelectorAll('.soloEntry,.modalStatGrid').forEach(e=>e.hidden=true);recorded.append(numbers);}
    detail.querySelectorAll('.modalMajorOrderBlock').forEach(block=>{
      if(block.querySelector('[data-role="extractionButtons"]')) {
        if(detail.querySelector('.soloSummary'))block.hidden=true;
        else {const text=document.createElement('p');const selected=block.querySelector('[data-choice].active');text.textContent=!selected?'Extraction unknown':selected.dataset.choice==='true'?'Extracted':'Not extracted';block.replaceChildren(text);}
      }else if(!block.hidden){const label=block.querySelector('.label');if(label?.textContent.includes('Blue Side'))block.hidden=true;}
    });
    const note=detail.querySelector('textarea[data-k="originalNote"]');if(note){const block=note.closest('.modalNotes');block.querySelector('.label').textContent='Note';const text=document.createElement('p');text.className='savedRunNote';text.textContent=note.value||'No note.';note.hidden=true;block.append(text);if(!note.value)block.hidden=true;}
    const comment=detail.querySelector('[data-k="newCommentText"]');if(comment){comment.placeholder='Add a comment…';comment.setAttribute('aria-label','Add a comment');comment.closest('.modalNotes').querySelector('.label').textContent='Comments';}
    const add=detail.querySelector('[data-act="addCardComment"]');if(add)add.textContent='Post';
    detail.querySelectorAll('.modalCommentList > .tiny').forEach(e=>e.hidden=true);
    const save=detail.querySelector('[data-act="saveCard"]');if(save)save.hidden=true;
    const footer=detail.querySelector('.modalActionRow .tiny');if(footer)footer.textContent='Saved · Values locked';
    detail.querySelectorAll(':scope > .hr').forEach(e=>e.hidden=true);
  }
  return Object.freeze({steps,validate,validateAll,read,mount,compact});
});
