import {loadPyodide} from '../vendor/pyodide/pyodide.mjs';
let runtime;
async function initialize(){
 if(!runtime){
  postMessage({type:'status',message:'loading'});
  runtime=await loadPyodide({indexURL:new URL('../vendor/pyodide/',import.meta.url).href,stdout:s=>postMessage({type:'stdout',text:s}),stderr:s=>postMessage({type:'stdout',text:s})});
  const response=await fetch(new URL('../python/checker.py',import.meta.url));
  if(!response.ok)throw Error('Python checker could not be loaded');
  runtime.globals.set('__name__','partitioning_browser_checker');
  runtime.runPython(await response.text());
 }
 return runtime;
}
onmessage=async({data})=>{
 try{
  const py=await initialize();postMessage({type:'status',message:'running'});
  py.globals.set('student_source',data.source);py.globals.set('lesson_id',data.lesson);
  const json=await py.runPythonAsync('json.dumps(check_lab(lesson_id, student_source))');
  postMessage({type:'result',result:JSON.parse(json)});
 }catch(e){postMessage({type:'error',message:String(e.message||e)});}
};
