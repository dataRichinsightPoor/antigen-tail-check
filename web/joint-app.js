import {JOINT_VERSION,EVIDENCE_STEPS,EVIDENCE_STATUSES,jointCSV} from "./joint-model.js";
import {JOINT_WORKER_SOURCE} from "./joint-worker-source.js";
import {pairingSVG,mechanismSVG} from "./schematics.js";
const j$=id=>document.getElementById(id);
const jNum=x=>new Intl.NumberFormat("en-US",{maximumFractionDigits:3}).format(x);
const jPct=x=>`${(100*x).toFixed(2)}%`;
const jVal=x=>Array.isArray(x)?`[${jPct(x[0])}, ${jPct(x[1])}]`:jPct(x);
const jDiff=x=>Array.isArray(x)?`[${(x[0]*100).toFixed(2)}, ${(x[1]*100).toFixed(2)}] pp`:`${(x*100).toFixed(2)} pp`;
let jReport=null,jWorker=null,jURL=null,jRequest=0,jBusyFiles=0;
const jFiles={},jFileTokens={};
const jInputKeys=()=>j$("j-mode").value==="paired"?["A","B"]:["AX","AY","BX","BY"];
const jElement=(tag,text,props={})=>Object.assign(document.createElement(tag),{textContent:text,...props});
function jTable(id,rows){
 j$(id).replaceChildren(...rows.map(row=>{const tr=document.createElement("tr");row.forEach((s,i)=>{const el=jElement(i?"td":"th",s);if(!i)el.scope="row";tr.append(el);});return tr;}));
}
function jStop(){
 jWorker?.terminate();jWorker=null;if(jURL)URL.revokeObjectURL(jURL);jURL=null;
 j$("j-run").disabled=false;j$("j-run").textContent="Run audit";j$("j-cancel").hidden=true;
}
function jInvalidate(message="Inputs or evidence changed. Run the audit again; previous results are hidden."){
 jRequest++;jStop();jReport=null;j$("j-output").hidden=true;j$("j-status").textContent=message;
}
function jClearDeclarations(){for(const id of ["j-pairing","j-compatible","j-resolved"])j$(id).checked=false;}
for(const axis of ["X","Y"])for(const pop of ["A","B"]){
 const id=`j-unit-${axis}${pop}`,div=document.createElement("div"),label=jElement("label",`${pop} · ${axis} scale`,{htmlFor:id}),select=jElement("select","",{id});
 for(const [value,text]of [["abc","ABC"],["mesf","MESF"],["relative","Linear relative fluorescence"]])select.append(jElement("option",text,{value}));
 div.append(label,select);j$("j-units").append(div);
 select.addEventListener("change",()=>{j$("j-compatible").checked=false;jInvalidate();});
}
function jInputWidgets(){
 j$("j-inputs").replaceChildren();
 for(const key of jInputKeys()){
  const area=jElement("textarea","",{id:`j-data-${key}`,rows:4,maxLength:20000,spellcheck:false});
  const label=jElement("label",`Population ${key.length===1?key:key[0]+" · "+key[1]}`,{htmlFor:area.id});
  const file=jElement("input","",{id:`j-file-${key}`,type:"file",accept:".csv,.tsv,.txt,text/csv,text/plain"});
  const fileLabel=jElement("label",`Import ${key} locally`,{htmlFor:file.id});
  const info=jElement("p","",{id:`j-info-${key}`,className:"help file-info"});
  const clear=jElement("button",`Clear ${key} file`,{id:`j-clear-${key}`,type:"button",hidden:true});
  j$("j-inputs").append(label,area,fileLabel,file,info,clear);
  area.addEventListener("input",()=>{jClearDeclarations();jInvalidate("Input changed. Reconfirm pairing, compatible measurements and resolution.");});
  area.addEventListener("paste",e=>{
   const text=e.clipboardData.getData("text");
   if(text.length+area.value.length-(area.selectionEnd-area.selectionStart)>20000){e.preventDefault();jInvalidate("Large lists must be imported as a local file; the editor is limited to 20,000 characters.");}
  });
  const clearFile=()=>{
   jFileTokens[key]=(jFileTokens[key]??0)+1;delete jFiles[key];file.value="";area.disabled=false;info.textContent="";clear.hidden=true;jClearDeclarations();
  };
  file.addEventListener("change",async()=>{
   const picked=file.files[0];if(!picked)return;clearFile();const token=jFileTokens[key];
   jInvalidate("Reading local file; no upload occurs.");jClearDeclarations();j$("j-origin").value="empirical";
   if(picked.size>5000000){jInvalidate(`${key}: file exceeds 5 MB.`);return;}
   jBusyFiles++;j$("j-run").disabled=true;
   try{
    const text=await picked.text();if(jFileTokens[key]!==token||!area.isConnected)return;
    jFiles[key]={text,name:picked.name};area.disabled=true;clear.hidden=false;
    info.textContent=`${picked.name} · ${(picked.size/1024).toFixed(1)} KB. File replaces the editor.`;
    j$("j-notes").value="";jInvalidate("File loaded. Confirm measurement declarations and enter empirical provenance notes.");
   }catch{if(jFileTokens[key]===token)jInvalidate("Local file could not be read. Use plain UTF-8 CSV or TSV.");}
   finally{jBusyFiles--;if(!jWorker)j$("j-run").disabled=jBusyFiles>0;}
  });
  clear.addEventListener("click",()=>{clearFile();jInvalidate("File cleared. Editor values apply; reconfirm measurement declarations.");});
 }
}
for(const [id,title,description] of EVIDENCE_STEPS){
 const details=jElement("details","",{className:"evidence-step",id:`evidence-${id}`});
 const summary=document.createElement("summary");summary.append(jElement("span",title),jElement("span","Not supplied",{id:`j-evidence-status-${id}`}));
 const select=jElement("select","",{id:`j-evidence-${id}`});
 for(const status of EVIDENCE_STATUSES)select.append(jElement("option",status,{value:status}));
 details.append(summary,jElement("p",description,{className:"help"}),jElement("label","Evidence status",{htmlFor:select.id}),select);
 for(const [key,label]of [["assay","Measurement / assay"],["context","Dose, time, population and experimental context"],["note","Evidence note / reference"]]){
  const input=jElement("textarea","",{id:`j-evidence-${id}-${key}`,rows:2,maxLength:2000});
  details.append(jElement("label",label,{htmlFor:input.id}),input);
  input.addEventListener("input",()=>jInvalidate());
 }
 select.addEventListener("change",()=>{j$(`j-evidence-status-${id}`).textContent=select.value;jInvalidate();jSchematics();});
 j$("j-evidence").append(details);
}
function jEvidence(){return Object.fromEntries(EVIDENCE_STEPS.map(([id])=>[id,{status:j$(`j-evidence-${id}`).value,...Object.fromEntries(["assay","context","note"].map(k=>[k,j$(`j-evidence-${id}-${k}`).value]))}]));}
function jSchematics(){
 const light=document.documentElement.dataset.theme==="light";
 j$("j-pairing-svg").innerHTML=pairingSVG(light);
 j$("j-mechanism-svg").innerHTML=mechanismSVG(jEvidence(),light);
 j$("j-mechanism-svg").querySelectorAll("[data-evidence]").forEach(el=>el.addEventListener("click",event=>{
  event.preventDefault();j$("j-evidence-panel").open=true;
  const id=el.dataset.evidence,details=j$(`evidence-${id}`);details.open=true;details.scrollIntoView({block:"center",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});j$(`j-evidence-${id}`).focus({preventScroll:true});
 }));
}
const pairedCases={
 opposite:{A:"x,y,count\n0,0,500\n100000,100000,500",B:"x,y,count\n0,100000,500\n100000,0,500",t:10000},
 identical:{A:"x,y,count\n0,0,500\n100000,100000,500",B:"x,y,count\n0,0,500\n100000,100000,500",t:10000},
 ties:{A:"x,y\n10,10\n10,11\n11,10\n11,11",B:"x,y,count\n10,10,2\n11,11,2",t:10},
 zero:{A:"x,y\n0,0",B:"x,y\n0,0",t:0}
};
function jLoad(){
 jInvalidate();for(const k of Object.keys(jFileTokens))jFileTokens[k]++;
 for(const k of Object.keys(jFiles))delete jFiles[k];
 jInputWidgets();const preset=pairedCases[j$("j-preset").value];
 if(j$("j-mode").value==="paired"){j$("j-data-A").value=preset.A;j$("j-data-B").value=preset.B;}
 else for(const key of jInputKeys()){
  const rows=preset[key[0]].split("\n").slice(1).map(l=>{const p=l.split(",");return p[key[1]==="X"?0:1]+","+(p[2]??1);});
  j$(`j-data-${key}`).value="value,count\n"+rows.join("\n");
 }
 j$("j-origin").value="synthetic";for(const id of ["j-pairing","j-compatible","j-resolved"])j$(id).checked=true;
 for(const axis of ["X","Y"])for(const pop of ["A","B"])j$(`j-unit-${axis}${pop}`).value="abc";
 j$("j-targetX").value="Antigen X";j$("j-targetY").value="Antigen Y";j$("j-tx").value=preset.t;j$("j-ty").value=preset.t;
 j$("j-notes").value="Invented mathematical example. No measured cells or therapeutic parameter estimates.";
 j$("j-scenarios").checked=false;j$("j-score-inputs").hidden=true;
 for(const id of ["kx","ky"])j$(`j-${id}`).value=10000;for(const id of ["hx","hy"])j$(`j-${id}`).value=2;
 for(const [id]of EVIDENCE_STEPS){j$(`j-evidence-${id}`).value="not supplied";j$(`j-evidence-status-${id}`).textContent="Not supplied";for(const k of ["assay","context","note"])j$(`j-evidence-${id}-${k}`).value="";}
 jModeCopy();jSchematics();jRun();
}
function jModeCopy(){
 const paired=j$("j-mode").value==="paired";
 j$("j-scenarios").disabled=!paired;if(!paired){j$("j-scenarios").checked=false;j$("j-score-inputs").hidden=true;}
 j$("j-format").textContent=paired?"Required header: x,y or x,y,count (CSV or TSV). One same-cell pair per row. Counts are exact positive integer multiplicities. No negative-value clipping, raw FCS, inequalities or bin centers.":"One value per line or exact value,count rows. Optional value,count or antigen,count header. Each axis describes the same intended population, but rows are not paired across files.";
 j$("j-pairing-label").textContent=paired?"X and Y in each row were measured on the same cell/event, or are exact paired-event multiplicities. Separate files were not paired by row, rank or sorting.":"X and Y marginals describe the same intended population definition and biological condition within A, and likewise within B. They do not establish same-cell pairing.";
}
function jReadNumber(id){const s=j$(`j-${id}`).value;if(!s.trim())throw Error(`${id} is required.`);return Number(s);}
function jRun(){
 if(jBusyFiles){jInvalidate("Wait for local file reading to finish.");return;}
 try{
  const mode=j$("j-mode").value,config={tx:jReadNumber("tx"),ty:jReadNumber("ty"),scenarios:j$("j-scenarios").checked};
  if(config.scenarios)for(const k of ["kx","ky","hx","hy"])config[k]=jReadNumber(k);
  const inputs=Object.fromEntries(jInputKeys().map(k=>[k,jFiles[k]?.text??j$(`j-data-${k}`).value]));
  const metadata={origin:j$("j-origin").value,targetX:j$("j-targetX").value,targetY:j$("j-targetY").value,units:Object.fromEntries(["XA","XB","YA","YB"].map(k=>[k,j$(`j-unit-${k}`).value])),
   compatible:j$("j-compatible").checked,resolved:j$("j-resolved").checked,pairing:j$("j-pairing").checked,notes:j$("j-notes").value,evidence:jEvidence(),inputSources:Object.fromEntries(jInputKeys().map(k=>[k,jFiles[k]?.name??"text editor"]))};
  jInvalidate("Calculating exact supplied-data quantities…");j$("j-run").disabled=true;j$("j-run").textContent="Calculating…";j$("j-cancel").hidden=false;
  const requestId=jRequest;jURL=URL.createObjectURL(new Blob([JOINT_WORKER_SOURCE],{type:"application/javascript"}));jWorker=new Worker(jURL);
  jWorker.onmessage=({data})=>{
   if(data.requestId!==jRequest)return;jStop();
   if(data.error){jInvalidate(data.error);return;}
   jReport=data.report;jRender();
  };
  jWorker.onerror=()=>jInvalidate("Calculation worker failed. Reload the served preview; opening an HTML file directly is unsupported.");
  jWorker.postMessage({requestId,mode,inputs,config,metadata});
 }catch(e){jInvalidate(e.message);}
}
function jRender(){
 const r=jReport,c=r.comparison,p=r.mode==="paired";j$("j-output").hidden=false;
 j$("j-status").textContent=r.metadata.origin==="empirical"?"Pairing, measurement quality and evidence are user-reported, not verified. Results describe supplied observations only.":"";
 j$("j-provenance").textContent=`${r.metadata.origin.toUpperCase()} · ${p?"PAIRED SAME-CELL AUDIT":"MARGINAL-ONLY BOUNDS"} · ${JOINT_VERSION}`;
 const matched=r.axes.X.cdfDistance<1e-12&&r.axes.Y.cdfDistance<1e-12;
 j$("j-headline").textContent=!p?"The overlap was not measured. Keep the range.":matched&&c.quadrantTV>1e-12?"Matched marginals. Different same-cell combinations.":c.quadrantTV<1e-12?"Same selected quadrant fractions. Not proof of equal biology.":"The same-cell combinations differ at these cutoffs.";
 j$("j-interpretation").textContent=p?"Observed coexpression is not demonstrated co-engagement, productive delivery or killing. Change cutoffs to inspect what this comparison retains.":"Separate histograms cannot recover cell pairing. These are sharp pointwise feasible overlap bounds, not confidence intervals. An interval containing zero does not establish equality.";
 j$("j-double").textContent=`${jVal(c.a.q)} / ${jVal(c.b.q)}`;j$("j-either").textContent=`${jVal(c.a.e)} / ${jVal(c.b.e)}`;
 j$("j-distance-label").textContent=p?"Quadrant separation DQ":"Double-high difference · B − A";
 j$("j-distance").textContent=p?jPct(c.quadrantTV):jDiff(c.delta.q);
 j$("j-distance-note").textContent=p?"Limited to this four-category partition":"Feasible interval, not uncertainty";
 jTable("j-marginal-table",["X","Y"].map(k=>[`${k} arithmetic mean · ${r.metadata.units[k+"A"].toUpperCase()}`,jNum(r.axes[k].meanA),jNum(r.axes[k].meanB),jPct(r.axes[k].cdfDistance)]));
 const labels=p?[["LL","X-low / Y-low"],["HL","X-high / Y-low"],["LH","X-low / Y-high"],["HH","X-high / Y-high"],["e","Either-high"]]:[["q","Double-high feasible range"],["e","Either-high feasible range"],["LL","Double-low feasible range"]];
 jTable("j-quadrants",labels.map(([k,label])=>[label,jVal(c.a[k]),jVal(c.b[k]),jDiff(c.delta[k])]));
 j$("j-bound-note").textContent=p?"DQ bounds differences only for a common [0,1] score constant within each of these four quadrants. It does not bound arbitrary smooth two-dimensional response functions.":"Feasible bounds apply separately at each cutoff pair. Independently choosing every endpoint need not yield one globally consistent joint distribution. No paired scores are computed.";
 j$("j-paired-plots").hidden=!p;j$("j-grid-bound-wrap").hidden=p;
 j$("j-score-results").hidden=!c.scores;
 if(c.scores){
  const cfg=r.config;j$("j-score-formula").textContent=`u = Hill(X; Kx=${jNum(cfg.kx)} ${r.metadata.units.XA}, hx=${cfg.hx}); v = Hill(Y; Ky=${jNum(cfg.ky)} ${r.metadata.units.YA}, hy=${cfg.hy}). Product = uv; either-route = u + v − uv. Cutoffs are not these midpoints.`;
  jTable("j-scores",[["joint","Product · paired"],["either","Either-route · paired"],["independentJoint","Product · marginal independence"],["independentEither","Either-route · marginal independence"],["meanOnlyJoint","Product · mean-only"],["meanOnlyEither","Either-route · mean-only"],["covariance","Cov(u,v) · pairing effect on product"]].map(([key,label])=>[label,c.scores.a[key].toFixed(6),c.scores.b[key].toFixed(6)]));
 }
 jDraw();
}
function jCanvas(id){
 const canvas=j$(id),w=canvas.getBoundingClientRect().width,h=canvas.getBoundingClientRect().height;if(!w)return null;
 const dpr=window.devicePixelRatio||1;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);ctx.font="12px Switzer, sans-serif";
 const css=getComputedStyle(document.documentElement),color=k=>css.getPropertyValue(k).trim();return {canvas,ctx,w,h,color};
}
function jPlot(key){
 const chart=jCanvas(`j-plot${key}`);if(!chart)return;const {ctx,w,h,color}=chart,p=jReport.populations[key],cfg=jReport.config;
 const xMax=Math.max(1,jReport.grid.x.at(-1)),yMax=Math.max(1,jReport.grid.y.at(-1));
 const left=54,right=22,top=15,bottom=50,pw=w-left-right,ph=h-top-bottom;
 const tx=v=>Math.log1p(v)/Math.log1p(xMax),ty=v=>Math.log1p(v)/Math.log1p(yMax),X=v=>left+tx(v)*pw,Y=v=>top+(1-ty(v))*ph;
 ctx.strokeStyle=color("--border");ctx.strokeRect(left,top,pw,ph);ctx.fillStyle=color("--muted");
 for(const [x,label]of [[0,"0"],[xMax,jNum(xMax)]]){ctx.textAlign=x===0?"left":"right";ctx.fillText(label,X(x),h-29);}
 for(const [y,label]of [[0,"0"],[yMax,jNum(yMax)]]){ctx.textAlign="right";ctx.fillText(label,left-6,Y(y)+4);}
 ctx.textAlign="center";ctx.fillText(`X · ${jReport.metadata.units.XA.toUpperCase()}`,left+pw/2,h-7);
 ctx.save();ctx.translate(13,top+ph/2);ctx.rotate(-Math.PI/2);ctx.fillText(`Y · ${jReport.metadata.units.YA.toUpperCase()}`,0,0);ctx.restore();
 const bins=new Map();for(const r of p.rows){const ix=Math.min(47,Math.floor(tx(r.x)*48)),iy=Math.min(47,Math.floor(ty(r.y)*48)),k=ix+","+iy;const bin=bins.get(k)??{n:0,sx:0,sy:0};bin.n+=r.count;bin.sx+=tx(r.x)*r.count;bin.sy+=ty(r.y)*r.count;bins.set(k,bin);}
 ctx.fillStyle=color(key==="A"?"--a":"--b");
 for(const b of bins.values()){const x=left+b.sx/b.n*pw,y=top+(1-b.sy/b.n)*ph,radius=Math.max(2,Math.min(12,Math.sqrt(b.n/p.n)*17));if(key==="A"){ctx.beginPath();ctx.arc(x,y,radius,0,2*Math.PI);ctx.fill();}else ctx.fillRect(x-radius,y-radius,2*radius,2*radius);}
 ctx.strokeStyle=color("--text");ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(X(cfg.tx),top);ctx.lineTo(X(cfg.tx),top+ph);ctx.moveTo(left,Y(cfg.ty));ctx.lineTo(left+pw,Y(cfg.ty));ctx.stroke();ctx.setLineDash([]);
}
function jGrid(){
 if(!jReport)return;const chart=jCanvas("j-grid");if(!chart)return;const {ctx,w,h,color}=chart;
 const metric=j$("j-grid-metric").value,view=j$("j-grid-view").value,bound=Number(j$("j-grid-bound").value),paired=jReport.mode==="paired";
 const values=jReport.grid.nodes.map(n=>paired?n[view][metric]:n[view][metric][bound]);
 const left=56,top=12,pw=w-left-24,ph=h-top-50,cw=pw/51,ch=ph/51;
 const light=document.documentElement.dataset.theme==="light";
 for(let i=0;i<values.length;i++){const v=values[i],intensity=view==="delta"?Math.abs(v):v;ctx.fillStyle=light?"#e9eeed":"#1d272e";ctx.fillRect(left+(i%51)*cw,top+(50-Math.floor(i/51))*ch,cw+1,ch+1);ctx.globalAlpha=.08+.92*intensity;ctx.fillStyle=color(view==="delta"&&v<0?"--b":"--a");ctx.fillRect(left+(i%51)*cw,top+(50-Math.floor(i/51))*ch,cw+1,ch+1);ctx.globalAlpha=1;}
 const ix=Number(j$("j-grid-x").value),iy=Number(j$("j-grid-y").value),n=jReport.grid.nodes[iy*51+ix];
 ctx.strokeStyle=color("--text");ctx.lineWidth=2;ctx.strokeRect(left+ix*cw,top+(50-iy)*ch,cw,ch);
 ctx.fillStyle=color("--muted");ctx.textAlign="left";ctx.fillText("0",left,h-30);ctx.textAlign="right";ctx.fillText(jNum(jReport.grid.x.at(-1)),left+pw,h-30);
 ctx.textAlign="right";ctx.fillText("0",left-6,top+ph);ctx.fillText(jNum(jReport.grid.y.at(-1)),left-6,top+10);
 ctx.textAlign="center";ctx.fillText(`X cutoff · ${jReport.metadata.units.XA.toUpperCase()} · log₁₀(value + 1)`,left+pw/2,h-7);
 ctx.save();ctx.translate(13,top+ph/2);ctx.rotate(-Math.PI/2);ctx.fillText(`Y cutoff · ${jReport.metadata.units.YA.toUpperCase()}`,0,0);ctx.restore();
 const max=values.reduce((v,x)=>Math.max(v,Math.abs(x)),0);
 j$("j-grid-summary").textContent=paired?(view==="delta"?`Largest absolute difference on this grid: ${(max*100).toFixed(2)} pp. Teal: B > A; amber: B < A; faint: zero. Color intensity spans 0–100 pp.`:"Color intensity spans fractions 0–100%. Numerical values are below and in the CSV."):"Displaying one endpoint of each pointwise feasible interval, not a reconstructed pairing. Intensity spans 0–100% (or 0–100 pp for a difference); teal is positive and amber negative. The full interval is below.";
 j$("j-node").textContent=`Node (${ix}, ${iy}): X cutoff ${jNum(n.x)}, Y cutoff ${jNum(n.y)}. A: ${jVal(n.a[metric])}; B: ${jVal(n.b[metric])}; B − A: ${jDiff(n.delta[metric])}.`;
}
function jDraw(){if(!jReport)return;if(jReport.mode==="paired"){jPlot("A");jPlot("B");}jGrid();}
function jDownload(content,type,name){const url=URL.createObjectURL(new Blob([content],{type})),a=jElement("a","",{href:url,download:name});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
j$("j-mode").addEventListener("change",()=>{
 jInvalidate("Analysis mode changed. Load a synthetic case or enter new observations and confirm declarations.");
 for(const k of Object.keys(jFileTokens))jFileTokens[k]++;
 for(const k of Object.keys(jFiles))delete jFiles[k];jInputWidgets();jClearDeclarations();jModeCopy();
});
j$("j-load").onclick=jLoad;j$("j-reset").onclick=()=>{j$("j-preset").value="opposite";jLoad();};
j$("j-run").onclick=jRun;j$("j-cancel").onclick=()=>jInvalidate("Calculation cancelled. No partial or previous result is retained.");
for(const id of ["j-tx","j-ty","j-kx","j-ky","j-hx","j-hy","j-targetX","j-targetY","j-notes","j-pairing","j-compatible","j-resolved"])j$(id).addEventListener("input",()=>jInvalidate());
j$("j-origin").addEventListener("change",()=>{jClearDeclarations();j$("j-notes").value="";jInvalidate();});
j$("j-scenarios").addEventListener("change",()=>{j$("j-score-inputs").hidden=!j$("j-scenarios").checked;jInvalidate();});
for(const id of ["j-grid-view","j-grid-metric","j-grid-bound","j-grid-x","j-grid-y"])j$(id).addEventListener("input",jGrid);
j$("j-theme").onclick=()=>{const light=document.documentElement.dataset.theme!=="light";document.documentElement.dataset.theme=light?"light":"dark";j$("j-theme").textContent=light?"Dark mode":"Light mode";jDraw();jSchematics();};
j$("j-json").onclick=()=>{if(jReport)jDownload(JSON.stringify(jReport,null,2),"application/json","coexpression-report.json");};
j$("j-csv").onclick=()=>{if(jReport)jDownload(jointCSV(jReport),"text/csv","coexpression-threshold-grid.csv");};
j$("j-download-pairing").onclick=()=>jDownload(pairingSVG(document.documentElement.dataset.theme==="light"),"image/svg+xml","coexpression-pairing-schematic.svg");
j$("j-download-mechanism").onclick=()=>jDownload(mechanismSVG(jEvidence(),document.documentElement.dataset.theme==="light"),"image/svg+xml","adc-mechanism-evidence-schematic.svg");
new ResizeObserver(jDraw).observe(j$("j-output"));
jLoad();
