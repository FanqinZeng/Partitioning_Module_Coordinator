export const EN=document.documentElement.lang.startsWith('en');
export const t=(x,en)=>Array.isArray(x)?x[EN?1:0]:(EN&&en!==undefined?en:x);
export const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const fmt=x=>typeof x==='number'?(Number.isInteger(x)?String(x):Number(x.toPrecision(5)).toString()):String(x??'—');
export const root=document.body.dataset.root||'./';
export const languageRoot=root+(EN?'en/':'');
export const moduleURL=m=>languageRoot+`modules/${m.id}-${m.slug}/index.html`;
export function notice(message,host=document.querySelector('#notice')){if(host){host.textContent=message;host.hidden=false;}}
export function table(headers,rows){return `<div class="table-scroll"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
