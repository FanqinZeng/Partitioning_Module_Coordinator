export const STORAGE_KEY='learning-partitioning:v1';
const IDS=['02','03','04','05','06','07','08'];
export const CHALLENGE_KEYS={
 '02':['cut','good','ratio','imbalance','capacity','rename','lower-bound'],
 '03':['first','cut','target','greedy','seed','tie','optimal'],
 '04':['d','gain','prefix','negative','correction','area','stop'],
 '05':['first','blocked','after-d','prefix','strict','fs','complexity'],
 '06':['diagonal','rowsum','prefix','cut','sign','disconnected','optimal'],
 '07':['splits','choose','internal','added','cut','power','capacity'],
 '08':['rr','recursive','oracle','changed','swap','preserve','local']
};
export const emptyState=()=>({version:1,last:null,modules:{}});
export function validateState(x){
 if(!x||x.version!==1||!x.modules||typeof x.modules!=='object'||Array.isArray(x.modules))throw Error('Unsupported progress file');
 if(x.last!==null&&!IDS.includes(x.last))throw Error('Unknown last lesson');
 const out=emptyState();out.last=x.last;
 for(const [id,m]of Object.entries(x.modules)){
  if(!IDS.includes(id)||!m||typeof m!=='object'||Array.isArray(m))throw Error('Unknown lesson or malformed record');
  const record={};
  for(const key of ['read','lab','code']){if(key in m&&typeof m[key]!=='boolean')throw Error('Completion flags must be boolean');record[key]=m[key]===true;}
  if(m.draft!==undefined&&(typeof m.draft!=='string'||m.draft.length>100000))throw Error('Invalid code draft');
  record.draft=m.draft||'';record.answers={};
  if(m.answers!==undefined&&(!m.answers||typeof m.answers!=='object'||Array.isArray(m.answers)))throw Error('Invalid challenge record');
  for(const [q,done]of Object.entries(m.answers||{})){
   if(!CHALLENGE_KEYS[id].includes(q)||typeof done!=='boolean')throw Error('Invalid challenge result');
   record.answers[q]=done;
  }
  out.modules[id]=record;
 }
 return out;
}
let memory;
export function readState(){
 if(memory)return memory;
 try{const raw=localStorage.getItem(STORAGE_KEY);memory=raw?validateState(JSON.parse(raw)):emptyState();}
 catch(e){memory=emptyState();queueMicrotask(()=>window.dispatchEvent(new CustomEvent('storage-error',{detail:e.message})));}
 return memory;
}
export function saveState(state){
 memory=validateState(state);
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(memory));}
 catch(e){window.dispatchEvent(new CustomEvent('storage-error',{detail:e.message}));}
 window.dispatchEvent(new Event('progress-changed'));return memory;
}
export function updateLesson(id,fn){const s=structuredClone(readState());s.modules[id]||={read:false,lab:false,code:false,draft:'',answers:{}};fn(s.modules[id]);return saveState(s);}
export function visit(id){const s=structuredClone(readState());s.last=id;return saveState(s);}
export function download(name,body,type='application/json'){
 const url=URL.createObjectURL(new Blob([body],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
