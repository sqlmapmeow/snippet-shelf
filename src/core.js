(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ShelfCore=api;})(globalThis,function(){
 'use strict';
 const LANGUAGES=['JavaScript','TypeScript','PHP','C#','Python','HTML','CSS','SQL','Bash','JSON','Plain text'];
 const MAX_ITEMS=500, MAX_CODE=50000, MAX_BYTES=2*1024*1024;
 const bytes=s=>new TextEncoder().encode(s).length;
 function id(){return globalThis.crypto?.randomUUID?.() || 's-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}
 function text(value,name,max,required=false){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw new Error(`${name}: ${required?'required, ':''}maximum ${max} characters.`);return value;}
 function normalize(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Each snippet must be an object.');
  const title=text(value.title,'Title',100,true).trim();const code=text(value.code,'Code',MAX_CODE,true);
  if(!LANGUAGES.includes(value.language))throw new Error('Choose a supported language.');
  if(!Array.isArray(value.tags)||value.tags.length>8||value.tags.some(t=>typeof t!=='string'||!t.trim()||t.length>24))throw new Error('Use up to 8 tags, each 1–24 characters.');
  if(typeof value.favorite!=='boolean')throw new Error('Favorite must be true or false.');
  const snippetId=text(value.id,'ID',100,true);
  for(const field of ['createdAt','updatedAt'])if(typeof value[field]!=='string'||!Number.isFinite(Date.parse(value[field])))throw new Error('Invalid snippet date.');
  return {id:snippetId,title,description:text(value.description??'','Description',500),language:value.language,code,tags:[...new Set(value.tags.map(t=>t.trim().toLowerCase()))],favorite:value.favorite,createdAt:value.createdAt,updatedAt:value.updatedAt};
 }
 function documentOf(items){
  if(!Array.isArray(items)||items.length>MAX_ITEMS)throw new Error(`A shelf supports up to ${MAX_ITEMS} snippets.`);
  const clean=items.map(normalize);if(new Set(clean.map(s=>s.id)).size!==clean.length)throw new Error('Duplicate snippet IDs in backup.');
  const doc={app:'snippet-shelf',version:1,snippets:clean};const serialized=JSON.stringify(doc);
  if(bytes(serialized)>MAX_BYTES)throw new Error('Shelf exceeds the 2 MiB data limit.');
  return doc;
 }
 function decode(raw){
  if(typeof raw!=='string'||bytes(raw)>MAX_BYTES)throw new Error('Backup exceeds the 2 MiB limit.');
  let doc;try{doc=JSON.parse(raw);}catch{throw new Error('This file is not valid JSON.');}
  if(!doc||doc.app!=='snippet-shelf'||doc.version!==1)throw new Error('Choose a Snippet Shelf v1 backup.');
  return documentOf(doc.snippets).snippets;
 }
 function encode(items){return JSON.stringify(documentOf(items));}
 function create(fields,previous){const now=new Date().toISOString();return normalize({...fields,id:previous?.id??id(),createdAt:previous?.createdAt??now,updatedAt:now});}
 function contentKey(s){return JSON.stringify([s.title,s.description,s.language,s.code,s.tags,s.favorite]);}
 function merge(existing,incoming,newId=id){
  const result=existing.map(normalize);const known=new Set(result.map(contentKey));const ids=new Set(result.map(s=>s.id));let skipped=0;
  for(const original of incoming){const s=normalize(original), key=contentKey(s);if(known.has(key)){skipped++;continue;}
   if(ids.has(s.id)){let candidate;let attempts=0;do{candidate=newId();if(++attempts>50)throw new Error('Could not create a unique ID.');}while(ids.has(candidate));s.id=candidate;}
   ids.add(s.id);known.add(key);result.push(s);
  }
  documentOf(result);return {items:result,added:result.length-existing.length,skipped};
 }
 function filter(items,{query='',language='All',favorites=false,sort='updated'}={}){
  const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return items.filter(s=>(language==='All'||s.language===language)&&(!favorites||s.favorite)&&terms.every(t=>[s.title,s.description,s.language,...s.tags,s.code].join('\n').toLowerCase().includes(t))).sort((a,b)=>sort==='title'?a.title.localeCompare(b.title):Date.parse(b.updatedAt)-Date.parse(a.updatedAt)||a.title.localeCompare(b.title));
 }
 // Commit first; update UI only after success. Expected text protects other tabs.
 function persist(storage,key,items,expected){const raw=encode(items);if(storage.getItem(key)!==expected)throw new Error('Shelf changed in another tab. Reload before saving; your editor text is still here.');storage.setItem(key,raw);return raw;}
 return {LANGUAGES,MAX_ITEMS,MAX_CODE,MAX_BYTES,id,normalize,create,encode,decode,merge,filter,persist};
});
