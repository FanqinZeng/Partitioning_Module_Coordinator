// Half-open intervals prevent two passages being current at a shared boundary.
export function passageAt(cues, time) {
 if (!Number.isFinite(time) || time < 0) return -1;
 const index=cues.findIndex(cue=>cue.start<=time && time<cue.end);
 if(index>=0)return index;
 return cues.length && time===cues.at(-1).end ? cues.length-1 : -1;
}

export function matchesPassage(text, query) {
 const normalize=value=>value.normalize('NFKC').trim().toLocaleLowerCase();
 return normalize(text).includes(normalize(query));
}

export function findFilmPassages(films, query, language) {
 if(!query.trim())return [];
 const primary=language==='en'?2:1;
 const other=primary===1?2:1;
 const local=[],translated=[];
 for(const {id,title,captions} of films){
  for(const cue of captions){
   const match=[primary,other].find(i=>matchesPassage(cue[i],query));
   if(match===undefined)continue;
   const target=match===primary ? local : translated;
   target.push({id,title,time:cue[0],text:cue[match],language:match===1?'zh':'en'});
  }
 }
 return [...local,...translated];
}

export function filmClock(seconds) {
 return [Math.floor(seconds/60),Math.floor(seconds%60)].map(n=>String(n).padStart(2,'0')).join(':');
}

export function linkedFilmTime(hash, starts) {
 const match=/^#film-(0|[1-9]\d*)$/.exec(hash);
 const time=match ? Number(match[1]) : NaN;
 return starts.has(time) ? time : null;
}
