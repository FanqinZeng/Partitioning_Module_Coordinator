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
