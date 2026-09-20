import {deliveryPreset,DELIVERY_KEYS,DELIVERY_LABELS,deliveryCSV} from "./delivery-model.js";
import {DELIVERY_WORKER_SOURCE} from "./delivery-worker-source.js";
import {createDeliveryMap} from "./delivery-map.js";
import {createDeliveryProfile} from "./delivery-profile.js";
import {createDeliveryPD} from "./delivery-pd.js";
const $=id=>document.getElementById(id);
const fmt=x=>x!==0&&Math.abs(x)<.001?x.toExponential(2):new Intl.NumberFormat("en-US",{maximumFractionDigits:3}).format(x);
const ratio=x=>x===null?"Not defined":`${fmt(x)}×`;
let report=null,worker=null,workerURL=null,request=0;
const pdView=createDeliveryPD({getReport:()=>report,save,getIndex:()=>Number($("d-node").value),
 setIndex:i=>{$("d-node").value=i;table();}});
const profileView=createDeliveryProfile({getReport:()=>report,save,getIndex:()=>Number($("d-node").value),
 setIndex:i=>{$("d-node").value=i;table();},
 match:entry=>{$("d-B-J").value=entry;run();},
 preset:()=>{$("d-preset").value="equalauc";load("equalauc");}});
const mapView=createDeliveryMap({getReport:()=>report,save,applyRates:(proc,loss)=>{
 $("d-B-proc").value=proc;$("d-B-lossIntact").value=loss;run();
}});
const aucMapView=createDeliveryMap({kind:"auc",getReport:()=>report,save,applyRates:(proc,loss)=>{
 $("d-B-proc").value=proc;$("d-B-lossIntact").value=loss;run();
}});
function stop(){
 worker?.terminate();worker=null;if(workerURL)URL.revokeObjectURL(workerURL);workerURL=null;
 $("d-run").disabled=false;$("d-run").textContent="Run example";$("d-cancel").hidden=true;
}
function invalidate(message="Settings changed. Run again; the previous result is hidden."){
 pdView.clear();request++;stop();report=null;$("d-output").hidden=true;$("d-status").textContent=message;
}
for(const pop of ["A","B"]){
 const d=document.createElement("details");d.open=true;
 const s=document.createElement("summary");s.textContent=`Case ${pop} · processing parameters`;s.className=pop==="A"?"popA":"popB";d.append(s);
 for(const key of DELIVERY_KEYS){
  const label=document.createElement("label");label.htmlFor=`d-${pop}-${key}`;label.textContent=DELIVERY_LABELS[key];
  const input=document.createElement("input");Object.assign(input,{id:label.htmlFor,type:"number",step:"any",min:key==="lossC"?".001":"0",max:key==="J"?"1000000":"10"});
  input.addEventListener("input",()=>invalidate());d.append(label,input);
 }
 $("d-parameters").append(d);
}
function load(id){
 invalidate();const p=deliveryPreset(id);
 for(const pop of ["A","B"])for(const key of DELIVERY_KEYS)$(`d-${pop}-${key}`).value=p[pop][key];
 for(const k of ["nu","horizon","pulse","mode"])$(`d-${k}`).value=p[k];
 $("d-pulse").disabled=p.mode==="continuous";$("d-node").value=400;run();
}
function value(id){
 const s=$(id).value;if(!s.trim())throw Error("Every active model parameter requires a value.");
 return Number(s);
}
function run(){
 try{
  const parameters={mode:$("d-mode").value,nu:value("d-nu"),horizon:value("d-horizon"),
   pulse:$("d-mode").value==="pulse"?value("d-pulse"):2};
  for(const pop of ["A","B"])parameters[pop]=Object.fromEntries(DELIVERY_KEYS.map(k=>[k,value(`d-${pop}-${k}`)]));
  invalidate("Calculating the two synthetic trajectories…");
  $("d-run").disabled=true;$("d-run").textContent="Calculating…";$("d-cancel").hidden=false;
  const id=request;workerURL=URL.createObjectURL(new Blob([DELIVERY_WORKER_SOURCE],{type:"application/javascript"}));worker=new Worker(workerURL);
  worker.onmessage=({data})=>{
   if(data.id!==request)return;stop();
   if(data.error){$("d-status").textContent=data.error;return;}
   report=data.report;$("d-status").textContent="";$("d-output").hidden=false;render();
  };
  worker.onerror=()=>{invalidate("The calculation could not complete. Reload the page and try again.");};
  worker.postMessage({id,parameters});
 }catch(e){invalidate(e.message);}
}
function render(){
 const p=report.parameters;
 $("d-headline").textContent=report.isSteadyReversal?"Less entry. More eventual cytosolic delivery.":"The lower-entry reversal is not supported by these settings.";
 $("d-interpretation").textContent=`A routes ${fmt(100*report.A.steady.fRoute)}% of each entry episode to the intact lysosomal compartment; B routes ${fmt(100*report.B.steady.fRoute)}%. Of that material, ${fmt(100*report.A.steady.fProcess)}% and ${fmt(100*report.B.steady.fProcess)}% proceeds through productive processing. Their released-payload escape fractions are ${fmt(100*report.A.steady.fEscape)}% and ${fmt(100*report.B.steady.fEscape)}%. Continuous steady arrival B/A = ${ratio(report.ratios.activeSteady)}.`;
 $("d-input").textContent=`${fmt(p.A.J)} / ${fmt(p.B.J)}`;
 $("d-steady").textContent=`${fmt(report.A.steady.activeFlux)} / ${fmt(report.B.steady.activeFlux)}`;
 $("d-steady-label").textContent=p.mode==="pulse"?"If input continued · A / B":"Continuous steady arrival · A / B";
 if(p.mode==="pulse")$("d-headline").textContent="After input stops, delivery and removal continue.";
 if(report.profileAudit.matched)$("d-headline").textContent="Equal AUC does not establish equal exposure histories.";
 if(report.reasoning.observability.hiddenMechanismMatch)$("d-headline").textContent="Same payload trace. Different intracellular routes.";
 $("d-auc").textContent=ratio(report.ratios.auc);
 $("d-auc-window").textContent=`Integrated from 0 to ${fmt(p.horizon)} h; not efficacy.`;
 $("d-time-note").textContent=p.mode==="pulse"
  ?`The input ends at ${fmt(p.pulse)} h. Steady-reference values assume it never stopped; this pulse instead approaches zero stocks and zero arrival flux.`
  :`At ${fmt(p.horizon)} h, active arrival B/A = ${ratio(report.ratios.activeAtEnd)} and cytosolic stock B/A = ${ratio(report.ratios.cytosolicAtEnd)}. A steady-state advantage need not be present within this observation window.`;
 const residual=Math.max(report.A.diagnostics.maxMassRelativeResidual,report.B.diagnostics.maxMassRelativeResidual);
 $("d-integrity").textContent=`Mass-balance relative residual ≤ ${residual.toExponential(2)}. RK4 with exact input-switch alignment; ${report.A.rows.length} reported points per case. JSON includes parameters, units, limitations and both continuous steady references.`;
 reasoning();exposure();profileView.reset();pdView.reset();mapView.reset();aucMapView.reset();draw();table();
}
function exposure(){
 const e=report.exposureAudit,p=report.parameters,f=e.factors;
 const state=e.cohortPotentialRatio===null?"A has zero eventual cohort AUC; fold attribution is undefined."
  :e.cohortPotentialRatio>1&&e.aucRatio<1?"B has greater eventual cohort AUC, but timing reverses the ranking within this window."
  :e.cohortPotentialRatio<1&&e.aucRatio>1?"B leads within this window despite lower eventual cohort AUC. An early ranking need not survive a complete chase."
  :e.aucRatio>1?"B has higher AUC within this window. The factors below separate delivery, retention and timing."
  :e.aucRatio<1?"B has lower AUC within this window. The factors below locate the mathematical penalties, not experimentally proven causes."
  :"The cases tie in finite-window AUC; this does not establish equivalent intracellular mechanisms.";
 $("d-exposure-verdict").textContent=state+" These values describe the simulated cases, not unapplied map inspections.";
 $("d-exposure-factors").textContent=Object.entries(f).map(([k,v])=>`${k==="window"?"finite-window":k} ${v===null?"undefined":fmt(v)}`).join(" × ")+` = AUC B/A ${ratio(e.factorizedRatio)}`;
 const rows=[
  ["Eventual AUC of material entered by T · payload·h/cell","eventualAUC"],
  ["AUC realized by T · payload·h/cell","auc"],
  ["Fraction of eventual cohort AUC realized · %","windowFraction",100],
  ["Remaining AUC after entry stops at T · payload·h/cell","remainingAUC"],
  ["Mean entry-to-cytosol time, conditional on success · h","conditionalArrivalMean"],
  ["Mean cytosolic residence · h","cytosolicResidence"]
 ];
 $("d-exposure-values").replaceChildren(...rows.map(([label,key,mult=1])=>{
  const tr=document.createElement("tr");
  for(const [i,value]of [label,...["A","B"].map(pop=>e[pop][key]===null?"Not defined":fmt(e[pop][key]*mult))].entries()){
   const cell=document.createElement(i===0?"th":"td");cell.textContent=value;if(i===0)cell.scope="row";tr.append(cell);
  }return tr;
 }));
 $("d-exposure-ledger").textContent=`Cohort accounting: realized AUC + remaining AUC = eventual cohort AUC. Entry is stopped at ${fmt(p.horizon)} h for this accounting${p.mode==="pulse"?", or remains off after the earlier pulse":""}; rates are unchanged. Relative numerical closure residual ≤ ${Math.max(e.A.ledgerRelativeResidual,e.B.ledgerRelativeResidual).toExponential(2)}. JSON includes the remaining contribution from E, L, released lysosomal payload and cytosolic payload.`;
 $("d-exposure-timing").textContent=`Successful-path mean transit: A ${e.A.conditionalArrivalMean===null?"undefined":fmt(e.A.conditionalArrivalMean)+" h"}; B ${e.B.conditionalArrivalMean===null?"undefined":fmt(e.B.conditionalArrivalMean)+" h"}. This sum of three competing-exit residence times excludes input timing and subsequent cytosolic residence. It is not a median, assay washout time or A/B crossover time. A blocked route has no successful-path mean.`;
 $("d-exposure-elasticity").textContent=`Local processing elasticity of steady arrival: A ${e.A.processingElasticity===null?"undefined":fmt(e.A.processingElasticity)}; B ${e.B.processingElasticity===null?"undefined":fmt(e.B.processingElasticity)}. For a small processing-rate change with everything else fixed, 1% more processing changes steady arrival by approximately this many percent. With no intact loss the elasticity is zero, yet finite-time AUC can still improve as processing accelerates. This is not an AUC sensitivity or a ranking of all rate-control mechanisms.`;
}
function reasoning(){
 const {factors:f,boundary:b,observability:o}=report.reasoning,p=report.parameters;
 const factor=x=>x===null?"undefined":fmt(x);
 $("d-factor-line").textContent=`Entry ${factor(f.entry)} × routing ${factor(f.routing)} × processing ${factor(f.processing)} × escape ${factor(f.escape)} = steady arrival ${factor(report.ratios.activeSteady)} · B/A`;
 $("d-competition").textContent=["A","B"].map(pop=>{
  const s=report[pop].steady;
  return `${pop}: ${fmt(100*s.fProcess)}% productive processing versus ${fmt(100*(1-s.fProcess))}% nonproductive diversion after entry into L.`;
 }).join(" ")+" These are competing-exit fractions under constant first-order rates, not measured biological efficiencies.";
 $("d-residence").textContent=`Mean residence in L before either exit: A ${fmt(report.A.steady.lysosomalResidence)} h; B ${fmt(report.B.steady.lysosomalResidence)} h. A shorter residence can reflect faster loss, not better delivery. Both loss rates at zero recover the original model when processing is positive.`;
 $("d-no-loss").disabled=p.A.proc<.001||p.B.proc<.001;
 $("d-retention-line").textContent=`Steady cytosolic stock adds a retention factor of ${ratio(f.retention)} (kremoval,A / kremoval,B). Finite-time AUC additionally requires the finite-window factor calculated below. Undefined factors mean a required denominator or cohort normalization is zero.`;
 $("d-boundary").textContent=b.status==="blocked"
  ?"B has no productive route to cytosolic arrival under these rates. Increasing entry alone cannot create one."
  :b.status==="zero-reference"
  ?"A has zero steady arrival. With B’s current productive route, any positive B input exceeds that zero reference; a fold advantage is not defined."
  :`B ties A’s steady cytosolic arrival at J_B = ${fmt(b.entryTie)} ADC/cell/h. Above this input B exceeds A; below it B falls behind. ${b.lowerEntryWindow?`The lower-entry advantage exists only for ${fmt(b.entryTie)} < J_B < ${fmt(p.A.J)} ADC/cell/h.`:"There is no lower-entry interval with higher steady arrival under these fixed rates."}`;
 $("d-boundary-scope").textContent=p.mode==="pulse"
  ?"For this pulse, this is only a continuous-input counterfactual. The boundary is not a prediction about pulse AUC or a finite-time endpoint."
  :"This boundary concerns continuous-input steady arrival. Slow processing can still defeat the advantage within the chosen observation window; the threshold is not a fitted biological constant.";
 $("d-observation-summary").textContent=o.hiddenMechanismMatch
  ?"These settings preserve the entire cytosolic payload response, not merely its plateau, despite different internal rates. A cytosolic time course alone cannot distinguish this pair in this model."
  :"Use the counterexample to test what a payload trace leaves unresolved. Agreement in one output does not establish agreement in the routes that generated it.";
}
const observations={
 Pcyt:{title:"Cytosolic payload · payload/cell",units:"payload/cell",note:"This readout is identical in the counterexample. More time points or a shared pulse input do not separate the two mechanisms."},
 L:{title:"Intact lysosomal ADC · ADC/cell",units:"ADC/cell",note:"In the counterexample, B has twice the lysosomal intact ADC at every positive time. A compartment-specific intact-conjugate measurement could challenge the ambiguity."},
 Plys:{title:"Lysosomal payload · payload/cell",units:"payload/cell",note:"In the counterexample, B has twice the released lysosomal payload but half the escape rate. Those changes cancel at the cytosolic output."},
 recycled:{title:"Returned ADC · ADC/cell",units:"ADC/cell",note:"In the counterexample, B returns 8/9 as much intact ADC. This is cumulative return out of the modeled domain, not a simulated extracellular concentration."},
 E:{title:"Endosomal ADC · ADC/cell",units:"ADC/cell",note:"This readout is also identical in the counterexample: input and total endosomal exit are unchanged. Adding an observable is useful only if it distinguishes the competing explanations."},
 intactLoss:{title:"Nonproductive diversion · ADC equivalents/cell",units:"ADC equivalents/cell",note:"This is the cumulative modeled exit from intact lysosomal ADC before productive release. It is a bookkeeping sink, not an assay signal or an assertion that the diverted material remains chemically intact."}
};
function observation(){
 if(!report)return;
 const key=$("d-observable").value,info=observations[key],i=Number($("d-node").value),a=report.A.rows[i],b=report.B.rows[i];
 plot($("d-chart-observation"),key,info.title);
 $("d-observation-values").textContent=`At the inspected time ${fmt(a.t)} h · A: ${fmt(a[key])} · B: ${fmt(b[key])} ${info.units} · B/A: ${ratio(a[key]>0?b[key]/a[key]:null)}. All time sliders inspect the same node.`;
 $("d-observation-note").textContent=info.note+(key==="intactLoss"||report.reasoning.observability.hiddenMechanismMatch?"":" These statements describe the built-in counterexample, not a conclusion about the current edited settings.");
}
const tableItems=[
 ["Cumulative entry · ADC/cell","uptake"],["Endosomal intact ADC E · ADC/cell","E"],["Lysosomal intact ADC L · ADC/cell","L"],
 ["Retained intact ADC E + L · ADC/cell","retainedIntact"],["Released lysosomal payload Plys · payload/cell","Plys"],
 ["Cytosolic arrival flux · payload/cell/h","activeFlux"],["Active cytosolic stock Pcyt · payload/cell","Pcyt"],
 ["Cumulative cytosolic arrivals · payload/cell","activeArrivals"],["Cytosolic AUC · payload·h/cell","auc"],
 ["Returned intact ADC · ADC/cell","recycled"],["Removed lysosomal payload · payload/cell","lysosomalLoss"],
 ["Removed cytosolic payload · payload/cell","cytosolicLoss"],
 ["Nonproductive intact-ADC diversion · ADC equivalents/cell","intactLoss"],
 ["Nonproductive intact-ADC exit flux · ADC equivalents/cell/h","intactLossFlux"],
 ["Productive processing flux · ADC/cell/h","processingFlux"]
];
function table(){
 if(!report)return;const i=Number($("d-node").value),a=report.A.rows[i],b=report.B.rows[i];
 $("d-observe-node").value=i;
 $("d-time").textContent=`t = ${fmt(a.t)} h · exact reported node ${i} of 400`;
 $("d-values").replaceChildren(...tableItems.map(([label,key])=>{
  const tr=document.createElement("tr");
  for(const [j,text]of [label,fmt(a[key]),fmt(b[key])].entries()){const td=document.createElement(j===0?"th":"td");td.textContent=text;if(j===0)td.scope="row";tr.append(td);}return tr;
 }));
 observation();
 profileView.draw();pdView.draw();
}
const charts=[["d-chart-intact","retainedIntact","Retained ADC · ADC/cell"],["d-chart-flux","activeFlux","Cytosolic arrival · payload/cell/h"],["d-chart-cyt","Pcyt","Active cytosolic payload · payload/cell"],["d-chart-auc","auc","Cytosolic AUC · payload·h/cell"]];
function plot(canvas,key,title){
 const rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1,w=Math.max(rect.width,220),h=270;
 canvas.width=Math.round(w*dpr);canvas.height=h*dpr;
 const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);
 const c=getComputedStyle(document.documentElement),color=name=>c.getPropertyValue(name).trim();
 ctx.fillStyle=color("--surface");ctx.fillRect(0,0,w,h);
 const left=w<340?53:65,right=14,top=52,bottom=38,pw=w-left-right,ph=h-top-bottom;
 const max=Math.max(...report.A.rows.map(r=>r[key]),...report.B.rows.map(r=>r[key]),1e-10);
 const x=t=>left+pw*t/report.parameters.horizon,y=v=>top+ph*(1-v/max);
 const tick=v=>v===0?"0":v>=10000||v<.001?v.toExponential(1):new Intl.NumberFormat("en-US",{maximumSignificantDigits:3}).format(v);
 ctx.font="12px Switzer, sans-serif";ctx.fillStyle=color("--text");ctx.fillText(title,10,17,w-20);
 for(let n=0;n<=4;n++){
  const yy=top+ph*n/4;ctx.strokeStyle=color("--border");ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(w-right,yy);ctx.stroke();
  ctx.fillStyle=color("--muted");ctx.textAlign="right";ctx.fillText(tick(max*(1-n/4)),left-7,yy+4);
 }
 ctx.textAlign="center";
 for(let n=0;n<=4;n++)ctx.fillText(fmt(report.parameters.horizon*n/4),left+pw*n/4,h-20);
 ctx.fillText("Time · h",left+pw/2,h-2);
 for(const pop of ["A","B"]){
  ctx.strokeStyle=color(pop==="A"?"--a":"--b");ctx.lineWidth=2;ctx.setLineDash(pop==="A"?[]:[7,4]);ctx.beginPath();
  report[pop].rows.forEach((r,i)=>{if(i===0)ctx.moveTo(x(r.t),y(r[key]));else ctx.lineTo(x(r.t),y(r[key]));});ctx.stroke();
 }
 ctx.setLineDash([]);
 if(report.parameters.mode==="pulse"){
  const xx=x(report.parameters.pulse);ctx.strokeStyle=color("--muted");ctx.setLineDash([2,4]);ctx.beginPath();ctx.moveTo(xx,top);ctx.lineTo(xx,top+ph);ctx.stroke();ctx.setLineDash([]);
 }
 ctx.textAlign="right";ctx.fillStyle=color("--a");ctx.fillText("A solid",w-right-68,36);ctx.fillStyle=color("--b");ctx.fillText("B dashed",w-right,36);
}
function draw(){if(report&&!$("d-output").hidden){for(const [id,key,title]of charts)plot($(id),key,title);observation();mapView.draw();aucMapView.draw();profileView.draw();pdView.draw();}}
function schematic(){
 const c=getComputedStyle(document.documentElement),v=k=>c.getPropertyValue(k).trim();
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 340" role="img" aria-labelledby="title desc">
 <title id="title">Synthetic productive-delivery compartment model</title>
 <desc id="desc">Prescribed entry flows into endosomal ADC E, then lysosomal ADC L, released lysosomal payload Plys and active cytosolic payload Pcyt. L has competing productive processing and nonproductive intact-ADC loss. This separate sink releases no modeled active payload. Recycling and released-payload removals also exit the modeled domain. Processing multiplies yield by nu. No rebinding, target binding or killing.</desc>
 <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="${v("--muted")}"/></marker></defs>
 <rect width="1080" height="340" fill="${v("--surface")}"/>
 <g fill="none" stroke="${v("--muted")}" stroke-width="2" marker-end="url(#arrow)">
 <path d="M20 105H85"/><path d="M260 105H340"/><path d="M515 105H595"/><path d="M770 105H850"/>
 <path d="M170 145V240"/><path d="M425 145V240"/><path d="M680 145V240"/><path d="M935 145V240"/>
 </g>
 <g fill="${v("--surface2")}" stroke="${v("--border")}">
 <rect x="85" y="65" width="175" height="80" rx="4"/><rect x="340" y="65" width="175" height="80" rx="4"/>
 <rect x="595" y="65" width="175" height="80" rx="4"/><rect x="850" y="65" width="175" height="80" rx="4"/>
 </g>
 <g fill="${v("--text")}" font-family="sans-serif" text-anchor="middle" font-size="18">
 <text x="170" y="97">E · endosomal</text><text x="425" y="97">L · lysosomal</text><text x="680" y="97">Plys · released</text><text x="935" y="97">Pcyt · cytosolic</text>
 </g><g fill="${v("--muted")}" font-family="sans-serif" text-anchor="middle" font-size="15">
 <text x="170" y="125">Intact ADC</text><text x="425" y="125">Intact ADC</text><text x="680" y="125">Payload</text><text x="935" y="125">Assumed active payload</text>
 <text x="35" y="84">J</text><text x="300" y="84">klys</text><text x="555" y="84">ν × kproc</text><text x="810" y="84">kesc</text>
 <text x="207" y="198">krec</text><text x="477" y="198">kloss,I</text><text x="731" y="198">kloss,L</text><text x="995" y="198">kloss,C</text>
 <text x="170" y="267">Returned ADC</text><text x="170" y="289">No modeled re-entry</text>
 <text x="425" y="267">Nonproductive diversion</text><text x="425" y="289">ADC-equivalent sink</text>
 <text x="680" y="267">Released-payload loss</text><text x="935" y="267">Cytosolic removal</text>
 <text x="540" y="325">Original schematic · synthetic rate model · arrows do not establish therapeutic efficacy</text></g></svg>`;
}
function refreshSchematic(){$("d-schematic").innerHTML=schematic();}
function save(name,text,type){
 const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$("d-load").onclick=()=>load($("d-preset").value);
$("d-reset").onclick=()=>{$("d-preset").value="routing";load("routing");};
$("d-run").onclick=run;
$("d-cancel").onclick=()=>invalidate("Calculation cancelled. No result retained.");
for(const k of ["nu","horizon","pulse"])$(`d-${k}`).addEventListener("input",()=>invalidate());
$("d-mode").onchange=()=>{$("d-pulse").disabled=$("d-mode").value==="continuous";invalidate();};
$("d-node").oninput=table;
$("d-observe-node").oninput=()=>{$("d-node").value=$("d-observe-node").value;table();};
$("d-observable").onchange=observation;
$("d-ambiguity").onclick=()=>{$("d-preset").value="ambiguity";$("d-observable").value="Pcyt";load("ambiguity");};
$("d-competing").onclick=()=>{$("d-preset").value="competing";load("competing");};
$("d-no-loss").onclick=()=>{
 if(!report||report.parameters.A.proc<.001||report.parameters.B.proc<.001)return;
 for(const pop of ["A","B"])$(`d-${pop}-lossIntact`).value=0;
 run();
};
$("d-json").onclick=()=>{if(report)save("productive-delivery-report.json",JSON.stringify(report,null,2),"application/json");};
$("d-csv").onclick=()=>{if(report)save("productive-delivery-trajectories.csv",deliveryCSV(report),"text/csv");};
$("d-svg").onclick=()=>save("productive-delivery-pathway.svg",schematic(),"image/svg+xml");
$("d-png").onclick=()=>{
 if(!report)return;const out=document.createElement("canvas");out.width=1440;out.height=930;const ctx=out.getContext("2d");
 const c=getComputedStyle(document.documentElement);ctx.fillStyle=c.getPropertyValue("--bg");ctx.fillRect(0,0,out.width,out.height);
 ctx.fillStyle=c.getPropertyValue("--text");ctx.font="24px sans-serif";ctx.fillText("Synthetic productive-delivery worked example",35,42);
 ctx.font="17px sans-serif";ctx.fillText(`No experimental data or efficacy inference · ${report.parameters.mode} input · ${report.parameters.horizon} h`,35,75);
 charts.forEach(([id],i)=>ctx.drawImage($(id),30+(i%2)*710,100+Math.floor(i/2)*380,680,350));
 ctx.font="15px sans-serif";ctx.fillText("Data-Rich, Insight-Poor · Parameter provenance is in the accompanying JSON report.",35,910);
 out.toBlob(blob=>{if(blob)save("productive-delivery-charts.png",blob,"image/png");},"image/png");
};
$("d-theme").onclick=()=>{
 const light=document.documentElement.dataset.theme!=="light";document.documentElement.dataset.theme=light?"light":"dark";
 $("d-theme").textContent=light?"Dark mode":"Light mode";refreshSchematic();draw();
};
new ResizeObserver(draw).observe($("d-controls").parentElement);
refreshSchematic();load("routing");
