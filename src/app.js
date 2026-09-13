(function(){
 'use strict';
 const C=ShelfCore,$=id=>document.getElementById(id),KEY='vil.snippet-shelf.v1';
 let items=[],selected=null,query='',language='All',favorites=false,sort='updated',editingId=null,editorInitial='',lastDeleted=null,expected=null,storage=null,mode='local',generation=0;
 const colors={'JavaScript':'#e1ce83','TypeScript':'#8dbcc7','PHP':'#b5a8d3','C#':'#c5acda','CSS':'#8bb9de','SQL':'#dcba85','Python':'#bfc57e'};
 const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
 const btn=(text,className,action)=>{const b=el('button',className,text);b.type='button';b.addEventListener('click',action);return b;};
 function notice(text,kind='',undo=false){$('notice-text').textContent=text;$('notice').className='notice'+(kind?' '+kind:'');$('undo').hidden=!undo;}
 function download(text,name,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type}));const a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
 function seed(){return ShelfExamples.map(s=>({...s,tags:[...s.tags]}));}
 function initialize(){
  try{storage=window.localStorage;expected=storage.getItem(KEY);}catch{mode='session';storage=null;}
  if(mode==='session')items=seed();else if(expected===null)items=seed();else try{items=C.decode(expected);}catch{mode='corrupt';items=[];}
  selected=items[0]?.id??null;render();
  if(mode==='corrupt')notice('Saved data could not be read. Open “How storage works” to download a recovery copy. Nothing was overwritten.','error');
  else if(mode==='session')notice('Session-only mode: browser storage is unavailable. Export before closing this tab.','warning');
  else notice(expected===null?'Six editable examples to get you started. Your first change saves the shelf in this browser.':'Your shelf is ready. Saved locally, not synced to GitHub.');
 }
 function commit(next,message){
  if(mode==='corrupt'){notice('Recover or reset unreadable data before saving.','error');return false;}
  try{if(mode==='local')expected=C.persist(storage,KEY,next,expected);else C.encode(next);}
  catch(error){notice(error.message.includes('another tab')?error.message:'Could not save: '+error.message+' Export a backup; the existing shelf was kept.','error');return false;}
  items=next;generation++;lastDeleted=null;render();notice(message+(mode==='session'?' (This session only.)':''));return true;
 }
 function render(){
  $('all-count').textContent=items.length;$('fav-count').textContent=items.filter(s=>s.favorite).length;
  $('all').classList.toggle('active',!favorites&&language==='All');$('all').setAttribute('aria-pressed',String(!favorites&&language==='All'));
  $('favorites').classList.toggle('active',favorites);$('favorites').setAttribute('aria-pressed',String(favorites));
  $('storage-state').textContent=mode==='local'?'● Saved in this browser':mode==='session'?'○ Session only':'! Recovery needed';
  $('new').disabled=mode==='corrupt';$('import').disabled=mode==='corrupt';$('export').disabled=mode==='corrupt';
  $('recover').hidden=mode!=='corrupt';$('reset-storage').hidden=mode!=='corrupt';
  const langs=$('languages');langs.replaceChildren();
  for(const lang of C.LANGUAGES){const count=items.filter(s=>s.language===lang).length;if(!count)continue;const b=btn('','nav-item'+(language===lang?' active':''),()=>{language=lang;render();});b.setAttribute('aria-pressed',String(language===lang));const label=el('span');label.append(el('i','language-dot'),document.createTextNode(lang));b.append(label,el('span','count',count));langs.append(b);}
  const visible=C.filter(items,{query,language,favorites,sort});if(!visible.some(s=>s.id===selected))selected=visible[0]?.id??null;
  $('view-title').textContent=(favorites?'Favorites':language==='All'?'All snippets':language)+(favorites&&language!=='All'?' / '+language:'');
  $('result-count').textContent=`${visible.length} ${visible.length===1?'snippet':'snippets'}`;
  const list=$('list');list.replaceChildren();
  for(const s of visible){const card=el('article','snippet-card'+(s.id===selected?' selected':''));
   const select=btn('','select-card',()=>{selected=s.id;render();});select.setAttribute('aria-label','View '+s.title);select.setAttribute('aria-pressed',String(s.id===selected));
   const top=el('div','card-top');top.append(el('span','language-badge',s.language),el('span','',`${s.code.split('\n').length} lines`));
   select.append(top,el('h3','',s.title),el('p','',s.description||'No description yet.'),tags(s.tags));
   const star=btn(s.favorite?'★':'☆','favorite-button'+(s.favorite?' on':''),()=>toggleFavorite(s.id));star.setAttribute('aria-label',(s.favorite?'Unfavorite ':'Favorite ')+s.title);star.setAttribute('aria-pressed',String(s.favorite));
   card.append(select,star);list.append(card);
  }
  if(!visible.length){const empty=el('div','empty');empty.append(el('div','empty-symbol','{ }'),el('h3','',items.length?'No matching snippets.':'Your shelf starts here.'),el('p','',items.length?'Try a different search or clear the filters.':'Add a piece of code you want to keep.'));if(items.length)empty.append(btn('Clear filters','subtle',()=>{query='';language='All';favorites=false;$('search').value='';render();}));else if(mode!=='corrupt')empty.append(btn('Create a snippet','primary',()=>openEditor()));list.append(empty);}
  renderDetail();
 }
 function tags(values){const container=el('div','tags');values.forEach(t=>container.append(el('span','tag','#'+t)));return container;}
 function renderDetail(){const panel=$('detail');panel.replaceChildren();const s=items.find(x=>x.id===selected);
  if(!s){const empty=el('div','empty');empty.append(el('div','empty-symbol','</>'),el('h3','','Room for your next idea.'),el('p','','Choose a snippet to read, edit or copy it.'));panel.append(empty);return;}
  const top=el('div','detail-top'),meta=el('div','detail-meta');const date=el('time','',new Date(s.updatedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}));date.dateTime=s.updatedAt;meta.append(el('span','language-badge',s.language),date);
  top.append(meta,el('h2','',s.title),el('p','',s.description||'Add a description to give this code some context.'),tags(s.tags));
  const actions=el('div','detail-actions');actions.append(btn('Copy code','primary',()=>copy(s.code)),btn('Edit snippet','subtle',()=>openEditor(s.id)),btn('Duplicate','subtle',()=>duplicate(s.id)));top.append(actions);
  const toolbar=el('div','code-toolbar');toolbar.append(el('span','',filename(s)),el('span','',s.code.split('\n').length+' lines · Plain text'));
  const wrap=el('div','code-wrap'),numbers=el('pre','line-numbers',Array.from({length:Math.min(s.code.split('\n').length,5000)},(_,i)=>i+1).join('\n'));numbers.setAttribute('aria-hidden','true');
  const pre=el('pre','code',s.code);pre.id='selected-code';pre.tabIndex=0;pre.setAttribute('aria-label','Snippet code');wrap.append(numbers,pre);
  const bottom=el('div','detail-bottom');bottom.append(el('span','','Never executed · Local text'),btn('Delete snippet','delete-button',()=>remove(s.id)));panel.append(top,toolbar,wrap,bottom);
 }
 function filename(s){const exts={'JavaScript':'js','TypeScript':'ts','PHP':'php','C#':'cs','Python':'py','HTML':'html','CSS':'css','SQL':'sql','Bash':'sh','JSON':'json','Plain text':'txt'};return (s.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'snippet')+'.'+exts[s.language];}
 function toggleFavorite(id){const s=items.find(x=>x.id===id);if(!s)return;commit(items.map(x=>x.id===id?{...x,favorite:!x.favorite}:x),s.favorite?'Removed from favorites.':'Added to favorites.');}
 function duplicate(id){const s=items.find(x=>x.id===id);if(!s)return;try{const clone=C.create({...s,title:(s.title+' (copy)').slice(0,100),favorite:false});selected=clone.id;query='';language='All';favorites=false;$('search').value='';commit([clone,...items],'Snippet duplicated.');}catch(e){notice(e.message,'error');}}
 function remove(id){const s=items.find(x=>x.id===id);if(!s||!confirm(`Delete “${s.title}”? You can undo until the next change.`))return;
  if(commit(items.filter(x=>x.id!==id),'Snippet deleted.')){lastDeleted=s;notice('Snippet deleted. You can undo until the next change.','',true);}}
 $('undo').addEventListener('click',()=>{if(!lastDeleted)return;const restore=lastDeleted;selected=restore.id;commit([restore,...items],'Snippet restored.');});
 function formState(){return JSON.stringify(['edit-title','edit-language','edit-description','edit-tags','edit-code'].map(id=>$(id).value));}
 function openEditor(id){editingId=id??null;const s=items.find(x=>x.id===id);$('editor-title').textContent=s?'Edit snippet':'New snippet';$('edit-title').value=s?.title??'';$('edit-language').value=s?.language??'JavaScript';$('edit-description').value=s?.description??'';$('edit-tags').value=s?.tags.join(', ')??'';$('edit-code').value=s?.code??'';$('editor-error').textContent='';editorInitial=formState();$('editor').showModal();$('edit-title').focus();}
 function closeEditor(){if(formState()!==editorInitial&&!confirm('Discard your unsaved changes?'))return;$('editor').close();}
 $('close-editor').addEventListener('click',closeEditor);$('cancel-editor').addEventListener('click',closeEditor);$('editor').addEventListener('cancel',e=>{e.preventDefault();closeEditor();});
 $('editor').addEventListener('click',e=>{const rect=$('editor').getBoundingClientRect();if(e.target===$('editor')&&(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom))closeEditor();});
 $('editor-form').addEventListener('submit',e=>{e.preventDefault();try{const previous=items.find(s=>s.id===editingId);const s=C.create({title:$('edit-title').value,description:$('edit-description').value,language:$('edit-language').value,tags:$('edit-tags').value.split(',').map(t=>t.trim()).filter(Boolean),code:$('edit-code').value,favorite:previous?.favorite??false},previous);
   const next=previous?items.map(x=>x.id===previous.id?s:x):[s,...items];selected=s.id;
   if(commit(next,'Snippet saved.')){query='';language='All';favorites=false;$('search').value='';selected=s.id;render();$('editor').close();}else $('editor-error').textContent=$('notice-text').textContent;
  }catch(error){$('editor-error').textContent=error.message;}});
 async function copy(code){try{if(!navigator.clipboard?.writeText)throw new Error();await navigator.clipboard.writeText(code);notice('Code copied to clipboard.');}catch{const node=$('selected-code');if(node){const range=document.createRange();range.selectNodeContents(node);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);}notice('Clipboard unavailable. Code selected: press Ctrl+C or ⌘C.','warning');}}
 $('search').addEventListener('input',()=>{query=$('search').value;render();});$('sort').addEventListener('change',()=>{sort=$('sort').value;render();});$('all').addEventListener('click',()=>{language='All';favorites=false;render();});$('favorites').addEventListener('click',()=>{favorites=true;language='All';render();});$('new').addEventListener('click',()=>openEditor());
 $('export').addEventListener('click',()=>{try{download(C.encode(items),'snippet-shelf-backup.json');notice('Backup prepared. Keep it somewhere safe.');}catch(e){notice(e.message,'error');}});
 $('import').addEventListener('click',()=>$('import-file').click());$('import-file').addEventListener('change',async()=>{const file=$('import-file').files[0];$('import-file').value='';if(!file)return;if(file.size>C.MAX_BYTES){notice('Choose a backup no larger than 2 MiB.','error');return;}const started=generation;
  try{const imported=C.decode(await file.text());if(started!==generation){notice('Shelf changed while reading the backup. Please import again.','warning');return;}const merged=C.merge(items,imported);
   if(!merged.added){notice(`No new snippets. ${merged.skipped} identical entries skipped.`);return;}
   if(!confirm(`Add ${merged.added} snippets? ${merged.skipped} identical entries will be skipped. Your existing snippets will be kept.`))return;
   commit(merged.items,`Imported ${merged.added} snippets. ${merged.skipped} identical entries skipped.`);
  }catch(e){notice('Import stopped: '+e.message+' Existing snippets were kept.','error');}});
 const openInfo=()=>$('info').showModal();$('storage-info').addEventListener('click',openInfo);$('close-info').addEventListener('click',()=>$('info').close());$('info-ok').addEventListener('click',()=>$('info').close());
 $('recover').addEventListener('click',()=>download(expected??'','snippet-shelf-recovery.txt','text/plain'));
 $('reset-storage').addEventListener('click',()=>{if(!confirm('Reset unreadable saved data? Download the recovery copy first if you need it.'))return;try{if(storage.getItem(KEY)!==expected)throw new Error('Data changed in another tab. Reload first.');storage.removeItem(KEY);expected=null;items=[];mode='local';generation++;render();$('info').close();notice('Storage reset. You can create a new shelf.');}catch(e){notice(e.message,'error');}});
 window.addEventListener('storage',e=>{if(mode!=='local'||(e.key!==KEY&&e.key!==null))return;generation++;lastDeleted=null;
  if($('editor').open){notice('Another tab changed the shelf. Copy unsaved editor text, then reload before saving.','warning');return;}
  try{const raw=storage.getItem(KEY);items=raw===null?[]:C.decode(raw);expected=raw;render();notice('Shelf updated from another tab.');}catch{mode='corrupt';expected=storage.getItem(KEY);items=[];render();notice('Another tab supplied unreadable data. Use the recovery options.','error');}});
 document.addEventListener('keydown',e=>{if(e.key==='/'&&!$('editor').open&&!$('info').open&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();$('search').focus();}});
 C.LANGUAGES.forEach(lang=>{const option=el('option','',lang);option.value=lang;$('edit-language').append(option);});initialize();
})();
