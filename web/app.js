import {VERSION,PRESETS} from "./model.js";
import {WORKER_SOURCE} from "./worker-source.js";
const $=id=>document.getElementById(id);
const num=x=>new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(x);
const pct=x=>`${(100*x).toFixed(2)}%`;
const pp=x=>`${(100*x).toFixed(2)} pp`;
const controls=["dataA","dataB","origin","unitsA","unitsB","compatible","resolved","notes","threshold","slope","lower","upper","meanMargin","tailMargin"];
let result=null,worker=null,workerURL=null;
const imported={A:null,B:null};
function invalidate(message="Inputs changed. Run the comparison again; previous results are hidden.") {
 if(worker){worker.terminate();worker=null;}
 if(workerURL){URL.revokeObjectURL(workerURL);workerURL=null;}
 $("run").disabled=false;$("run").textContent="Run comparison";
 result=null;$("output").hidden=true;$("status").textContent=message;
}
controls.forEach(id=>$(id).addEventListener("input",()=>invalidate()));
function clearFile(which){
 imported[which]=null;$("file"+which).value="";$("fileInfo"+which).textContent="";
 $("clear"+which).hidden=true;$("data"+which).disabled=false;
}
function resetAttestations(){
 $("compatible").checked=false;$("resolved").checked=false;$("notes").value="";
}
for(const which of ["A","B"]){
 $("data"+which).addEventListener("paste",event=>{
  const text=event.clipboardData.getData("text");
  const editor=$("data"+which),remaining=editor.value.length-(editor.selectionEnd-editor.selectionStart);
  if(text.length+remaining>20000||text.split("\n").length>2000){
   event.preventDefault();invalidate("Large lists must be imported as a local CSV/TXT file. The text editor is reserved for smaller examples.");
  }
 });
 $("file"+which).addEventListener("change",async event=>{
  const file=event.target.files[0];if(!file)return;
  invalidate("Reading the local file; no upload occurs.");
  if(file.size>5000000){clearFile(which);invalidate("File too large. Use a CSV/TXT file of at most 5 MB.");return;}
  try{
   const text=await file.text();
   if($("file"+which).files[0]!==file)return;
   imported[which]={text,name:file.name};
   $("data"+which).disabled=true;
   $("fileInfo"+which).textContent=`${file.name} · ${(file.size/1024).toFixed(1)} KB loaded locally. File values replace the disabled editor when you run.`;
   $("clear"+which).hidden=false;$("origin").value="empirical";resetAttestations();
   invalidate("File loaded locally. Confirm provenance, shared measurement mapping and tail resolution before running.");
  }catch(e){clearFile(which);invalidate("The local file could not be read. Try a plain CSV/TXT file.");}
 });
 $("clear"+which).onclick=()=>{clearFile(which);invalidate("File removed. The editor values will be used on the next run.");};
}
$("origin").addEventListener("change",()=>{
 if($("origin").value==="empirical")resetAttestations();
 invalidate();
});
for(const id of ["unitsA","unitsB"])$(id).addEventListener("change",()=>{$("compatible").checked=false;invalidate();});
function config(){const c={};for(const key of ["threshold","slope","lower","upper","meanMargin","tailMargin"]){if($(key).value.trim()==="")throw Error(`${key} is required.`);c[key]=Number($(key).value);}return c;}
function run(){
 try{
  if($("unitsA").value!==$("unitsB").value)throw Error("Comparison blocked: measurement scales differ. This tool cannot convert MESF, ABC or relative fluorescence.");
  if(!$("compatible").checked)throw Error("Comparison blocked: confirm a shared measurement mapping, staining definition and population gates.");
  if(!$("resolved").checked)throw Error("Comparison blocked: the antigen tail must be quantitatively resolved. This preview cannot infer censored, clipped or unresolved expression.");
  if($("origin").value==="empirical"&&!$("notes").value.trim())throw Error("Empirical inputs require calibration, gating and biological-replicate notes. The tool does not verify these assertions.");
  const c=config();
  const metadata={origin:$("origin").value,units:$("unitsA").value,measurementComparabilityAttested:true,tailResolutionAttested:true,notes:$("notes").value,inputA:imported.A?.name??"text editor",inputB:imported.B?.name??"text editor"};
  invalidate("Calculating the distributions and response sweep…");
  $("run").disabled=true;$("run").textContent="Calculating…";
  workerURL=URL.createObjectURL(new Blob([WORKER_SOURCE],{type:"application/javascript"}));
  worker=new Worker(workerURL);
  const currentWorker=worker;
  worker.onmessage=({data})=>{
   if(worker!==currentWorker)return;
   worker.terminate();worker=null;URL.revokeObjectURL(workerURL);workerURL=null;$("run").disabled=false;$("run").textContent="Run comparison";
   if(data.error){invalidate(data.error);return;}
   result={...data,metadata};render();
  };
  worker.onerror=()=>invalidate("Calculation worker failed to load. Reload the page from its served preview; opening the HTML file directly is not supported.");
  worker.postMessage({a:imported.A?.text??$("dataA").value,b:imported.B?.text??$("dataB").value,config:c});
 }catch(e){invalidate(e.message);}
}
function render(){
  const {a,b,c,r,metadata}=result;
  $("output").hidden=false;
  $("status").textContent=metadata.origin==="empirical"?"Measurement comparability is user-attested, not verified. Results describe the supplied observations; no biological equivalence inference is made.":"";
  if(c.threshold<c.lower||c.threshold>c.upper)$("status").textContent+=" Selected T is outside the sweep; point results are valid but its marker is outside the sensitivity plot.";
  $("provenance").textContent=`${metadata.origin==="synthetic"?"SYNTHETIC CASE":"EMPIRICAL INPUT"} · ${$("unitsA").selectedOptions[0].textContent}`;
  $("headline").textContent=r.dGlobal<1e-12?"Same supplied distribution. Still not proof of equal biology.":r.meansWithinMargin?"Matched means. Different distributions.":"The means differ. So do the distributions.";
  $("interpretation").textContent=`At T = ${num(c.threshold)}, ${pct(r.tailA)} of A and ${pct(r.tailB)} of B are at or below the cutoff. This is a distributional fact about these inputs, not a fraction proven to survive treatment.`;
  $("means").textContent=`${num(a.mean)} / ${num(b.mean)}`;
  $("meanGap").textContent=`${num(r.meanGap)}% symmetric mismatch · tolerance ${num(c.meanMargin)}%`;
  $("tails").textContent=`${pct(r.tailA)} / ${pct(r.tailB)}`;
  $("tailGap").textContent=`B − A: ${pp(r.tailGap)}`;
  $("bandGap").textContent=pp(r.dBand);
  $("bandConclusion").textContent=r.withinTailMargin?"Within descriptive margin; not equivalence.":"Exceeds selected descriptive margin.";
  $("order").textContent=`${r.order}. Cutoffs include tied values (A ≤ T). The x-axis uses log₁₀(expression + 1) to display genuine zeros; the calculations use untransformed values.`;
  const rows=[
   ["Represented events / synthetic counts",num(a.n),num(b.n)],
   ["5th percentile",num(a.q05),num(b.q05)],["Median",num(a.median),num(b.median)],["95th percentile",num(a.q95),num(b.q95)],
   ["Coefficient of variation",a.cv===null?"Undefined (zero mean)":num(a.cv),b.cv===null?"Undefined (zero mean)":num(b.cv)],
   ["At or below T · descriptive",pct(r.tailA),pct(r.tailB)],
   ["Unresponsive share · Hill scenario",pct(r.residualA),pct(r.residualB)],
   ["Unresponsive share · mean-only baseline",pct(r.meanOnlyA),pct(r.meanOnlyB)]
  ];
  $("stats").replaceChildren(...rows.map(row=>{const tr=document.createElement("tr");row.forEach((s,i)=>{const td=document.createElement(i?"td":"th");if(!i)td.scope="row";td.textContent=s;tr.append(td);});return tr;}));
  $("bound").textContent=`Global D = ${pp(r.dGlobal)}. Under any shared, nondecreasing response in [0, 1], the difference in mean response cannot exceed this bound for these supplied distributions. It is not an uncertainty interval, and it does not apply when the response mapping differs between populations.`;
  draw();
}
function load(key) {
 clearFile("A");clearFile("B");
 const p=PRESETS[key];
 $("dataA").value=p.a;$("dataB").value=p.b;
 for(const k of ["threshold","slope","lower","upper"])$(k).value=p[k];
 $("meanMargin").value=5;$("tailMargin").value=5;$("origin").value="synthetic";
 $("unitsA").value="abc";$("unitsB").value="abc";$("compatible").checked=true;$("resolved").checked=true;
 $("notes").value="Invented discrete population distributions; ABC used as an illustrative axis label. No measured cells or therapeutic parameter estimates.";
 run();
}
$("load").onclick=()=>load($("preset").value);
$("reset").onclick=()=>{$("preset").value="tail";load("tail");};
$("run").onclick=run;
$("theme").onclick=()=>{const dark=document.documentElement.dataset.theme==="dark";document.documentElement.dataset.theme=dark?"light":"dark";$("theme").textContent=dark?"Dark mode":"Light mode";draw();};
function chart(canvas,kind) {
 const {a,b,c,r,series}=result;
 const width=canvas.getBoundingClientRect().width,height=canvas.getBoundingClientRect().height;
 if(width<=0)return;
 const dpr=window.devicePixelRatio||1;canvas.width=width*dpr;canvas.height=height*dpr;
 const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);
 const css=getComputedStyle(document.documentElement),color=k=>css.getPropertyValue(k).trim();
 const left=48,right=18,top=22,bottom=48,w=width-left-right,h=height-top-bottom;
 const max=kind==="cdf"?Math.max(a.rows.at(-1).x,b.rows.at(-1).x,c.threshold,c.upper)*1.12:c.upper;
 const min=kind==="cdf"?0:c.lower;
 const z0=Math.log10(min+1),z1=Math.log10(max+1);
 const X=x=>left+(Math.log10(x+1)-z0)/(z1-z0)*w;
 const Y=y=>top+(1-y)*h;
 ctx.font="12px Switzer, sans-serif";ctx.lineWidth=1;
 for(const v of [0,.25,.5,.75,1]){
  ctx.strokeStyle=color("--border");ctx.beginPath();ctx.moveTo(left,Y(v));ctx.lineTo(width-right,Y(v));ctx.stroke();
  ctx.fillStyle=color("--muted");ctx.textAlign="right";ctx.fillText(`${v*100}%`,left-8,Y(v)+4);
 }
 const tickCandidates=[min,...[1,10,100,1000,10000,100000,1000000,1e7,1e8,1e9,1e10,1e11,1e12].filter(x=>x>min&&x<max),max];
 let last=-100;
 ctx.textAlign="center";ctx.fillStyle=color("--muted");
 for(const x of tickCandidates){const xx=X(x);if(xx-last<Math.max(44,w/7))continue;last=xx;ctx.fillText(x===0?"0":x>=1000?`${num(x/1000)}k`:num(x),xx,height-28);}
 ctx.fillText(kind==="cdf"?"Expression cutoff · log₁₀(value + 1)":"Assumed half-response T · log₁₀(T + 1)",left+w/2,height-5);
 const xt=X(c.threshold);
 if(xt>=left&&xt<=width-right){ctx.setLineDash([3,5]);ctx.strokeStyle=color("--muted");ctx.beginPath();ctx.moveTo(xt,top);ctx.lineTo(xt,top+h);ctx.stroke();ctx.setLineDash([]);ctx.textAlign=xt>width-90?"right":"left";ctx.fillText(`T ${num(c.threshold)}`,xt+(xt>width-90?-5:5),14);}
 ctx.save();ctx.beginPath();ctx.rect(left,top,w,h);ctx.clip();
 for(const [p,field,col,dash] of [[a,"residualA","--a",[]],[b,"residualB","--b",[7,5]]]){
  ctx.strokeStyle=color(col);ctx.lineWidth=2.5;ctx.setLineDash(dash);ctx.beginPath();
  if(kind==="cdf"){
   let y=0;ctx.moveTo(X(0),Y(0));
   for(const row of p.rows){ctx.lineTo(X(row.x),Y(y));y=row.cdf;ctx.lineTo(X(row.x),Y(y));}
   ctx.lineTo(X(max),Y(1));
  }else{
   series.forEach((s,i)=>{if(!i)ctx.moveTo(X(s.threshold),Y(s[field]));else ctx.lineTo(X(s.threshold),Y(s[field]));});
  }ctx.stroke();
 }
 ctx.restore();ctx.setLineDash([]);
}
function draw(){if(result){chart($("cdfPlot"),"cdf");chart($("responsePlot"),"response");}}
new ResizeObserver(()=>draw()).observe($("output"));
function download(content,type,name){
 const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const limitations=[
 "Descriptive empirical-distribution comparison, not biological equivalence.",
 "Hill curve is a hypothetical common mapping; it is not fitted or a survival prediction.",
 "No calibration conversion, censoring inference, raw FCS processing, replicate uncertainty, spatial effects, bystander effects or time dynamics.",
 "Event counts are not biological replicate counts."
];
$("exportJSON").onclick=()=>{
 if(!result)return;const {a,b,c,r,metadata,series}=result;
 download(JSON.stringify({tool:"Antigen-tail Check",version:VERSION,created:new Date().toISOString(),metadata,config:c,populationA:a,populationB:b,comparison:r,sweep:series,limitations},null,2),"application/json","antigen-tail-report.json");
};
$("exportCSV").onclick=()=>{
 if(!result)return;const {series,c,metadata}=result;
 const header="threshold,cdf_A,cdf_B,hypothetical_unresponsive_A,hypothetical_unresponsive_B,hill_slope,units,origin,tool_version";
 download([header,...series.map(s=>[s.threshold,s.cdfA,s.cdfB,s.residualA,s.residualB,c.slope,metadata.units,metadata.origin,VERSION].join(","))].join("\n"),"text/csv","antigen-tail-sweep.csv");
};
load("tail");
