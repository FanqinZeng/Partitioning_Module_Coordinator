const norm=value=>String(value??'').trim().toLowerCase();
export function matchesCourse(course,filters={}){
 if(filters.track&&filters.track!==course.id)return false;
 if(filters.delivery&&filters.delivery!==(course.external?'external':'local'))return false;
 if(filters.status&&filters.status!==course.status)return false;
 if(filters.language&&!course.languages.includes(filters.language))return false;
 const words=norm(filters.q).split(/\s+/).filter(Boolean);
 const haystack=norm([course.title,course.subtitle,course.description,course.topics,course.keywords,course.outline?.map(x=>[x.title,x.keywords])].flat(Infinity).filter(x=>typeof x==='string').join(' '));
 return words.every(word=>haystack.includes(word));
}
export function summarizeCourse(course,state){
 if(course.progress?.provider!=='partitioning')return null;
 const ids=course.progress.lessonIds||[];let done=0,lessons=0;
 for(const id of ids){const m=state.modules?.[id]||{};const count=[m.read,m.lab,m.code].filter(x=>x===true).length+Object.values(m.answers||{}).filter(x=>x===true).length;done+=Math.min(10,count);if(count>=10)lessons++;}
 const total=ids.length*10;
 return {done,total,lessons,percent:total?Math.round(done/total*100):0,last:ids.includes(state.last)?state.last:null};
}

export function matchesLesson(unit,query){
 const haystack=norm([unit.title,unit.keywords].flat(Infinity).filter(x=>typeof x==='string').join(' '));
 const words=norm(query).split(/\s+/).filter(Boolean);return words.length>0&&words.every(word=>haystack.includes(word));
}
