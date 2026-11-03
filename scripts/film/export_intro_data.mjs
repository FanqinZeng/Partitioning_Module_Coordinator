// The film reads these exact solver outputs, rather than independent invented numbers.
import {writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {run,G01,BAD,GOOD,metrics,exact,clone} from '../../site/engines/course.js';
const g=clone(G01),area=clone(g);area.nodes[0].size=4;
const facts={schema:1,graph:g,bad:BAD,good:GOOD,badMetrics:metrics(g,BAD),goodMetrics:metrics(g,GOOD),areaMetrics:metrics(area,GOOD,2,4),
 allOneMetrics:metrics(g,Object.fromEntries(g.nodes.map(n=>[n.id,0])),2,3),
 initial:run('initial',g),initialRandom:run('initial',g,{strategy:'random',seed:7}),initialGreedy:run('initial',g,{strategy:'greedy'}),kl:run('kl',g),fm:run('fm',g),spectral:run('spectral',g),recursive:run('recursive',g,{k:3}),
 roundRobin:run('multiway',g,{k:3,capacity:2,strategy:'round-robin'}),refined:run('multiway',g,{k:3,capacity:2}),oracle:exact(g,{k:3,capacity:2}),
 counts:{unlabeled5:String(2n**4n-1n),balanced5:'10',unlabeled100:String(2n**99n-1n)}};
facts.graphDigest=createHash('sha256').update(JSON.stringify(g)).digest('hex');
mkdirSync(new URL('../../video/home/',import.meta.url),{recursive:true});
writeFileSync(new URL('../../video/home/data.json',import.meta.url),JSON.stringify(facts,null,2)+'\n');
console.log('Verified film data exported from the live course engines.');
