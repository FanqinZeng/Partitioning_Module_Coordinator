import {esc,t,fmt} from './ui.js';
const COLORS=['#80cbb5','#8fb4ec','#e3c77d','#c5a3e8','#f0a5b9','#aed887'];
const PAPER_COLORS=['#0f6b5c','#2f5e9e','#946a17','#6b4c9a','#aa4d73','#527c31'];
export function graphSVG(graph,assignment,{interactive=false,locks=[],focus=[],dark=true,label=''}={}){
 const nodes=graph.nodes.map(n=>typeof n==='string'?{id:n,size:1}:n),n=nodes.length;
 const pos={};nodes.forEach((node,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;pos[node.id]=[260+175*Math.cos(a),190+133*Math.sin(a)];});
 let s=`<svg class="graph-svg" viewBox="0 0 520 390" ${interactive?'':'role="img"'} aria-label="${esc(label||t('加权图：虚线为跨组边，数字表示权重','Weighted graph: dashed edges cross parts; numbers are weights'))}"><title>${esc(t('当前分组与跨组连接','Current grouping and crossing connections'))}</title>`;
 for(const edge of graph.edges){const [u,v,w]=Array.isArray(edge)?edge:[edge.u,edge.v,edge.w],p=pos[u],q=pos[v],cross=assignment[u]!==assignment[v];if(!p||!q)continue;
  const x=(p[0]+q[0])/2,y=(p[1]+q[1])/2;
  s+=`<g class="edge ${cross?'cross':''}"><line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${cross?(dark?'#de8d7f':'#a85144'):dark?'#536e70':'#89988b'}" stroke-width="${Math.min(5,1+Math.sqrt(w))}" ${cross?'stroke-dasharray="6 5"':''}/><rect x="${x-14}" y="${y-12}" width="28" height="23" rx="5" fill="${dark?'#10272c':'#f4f0e7'}"/><text x="${x}" y="${y+5}" text-anchor="middle" fill="${cross?(dark?'#edb3a7':'#943c31'):dark?'#bacbc2':'#53635b'}" class="edge-weight">${fmt(w)}</text></g>`;
 }
 for(const node of nodes){const [x,y]=pos[node.id],group=assignment[node.id]??0,color=(dark?COLORS:PAPER_COLORS)[group%COLORS.length],locked=locks.includes(node.id);
  s+=`<g class="node ${focus.includes(node.id)?'focused':''}" ${interactive?`role="button" tabindex="0" data-node="${esc(node.id)}" aria-label="${esc(t('移动节点','Move vertex')+' '+node.id+' · '+t('当前组','current part')+' '+group)}"`:''}><circle cx="${x}" cy="${y}" r="26" fill="${dark?'#10272c':'#fffdf8'}" stroke="${color}" stroke-width="${focus.includes(node.id)?4:2}"/><text x="${x}" y="${y+6}" text-anchor="middle" fill="${dark?'#f2ede1':'#1b2320'}" class="node-id">${esc(node.id)}</text><text x="${x}" y="${y+46}" text-anchor="middle" fill="${color}" class="node-detail">${esc(t('组','part'))} ${group} · ${fmt(node.size)}${locked?' · 🔒':''}</text></g>`;
 }
 return s+'</svg>';
}
export function graphButtons(host,onNode){
 host.addEventListener('click',e=>{const n=e.target.closest('[data-node]');if(n)onNode(n.dataset.node);});
 host.addEventListener('keydown',e=>{const n=e.target.closest('[data-node]');if(n&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onNode(n.dataset.node);}});
}
