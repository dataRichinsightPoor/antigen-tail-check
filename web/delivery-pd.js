import {PD_FIELDS,pdPreset,validatePD,pdCSV} from "./delivery-pd-model.js";
import {PD_WORKER_SOURCE} from "./delivery-pd-worker-source.js";
const $=id=>document.getElementById(id);
const fmt=x=>x===null?"Not defined":x!==0&&(Math.abs(x)<.001||Math.abs(x)>=1e5)?x.toExponential(3):new Intl.NumberFormat("en-US",{maximumFractionDigits:3}).format(x);
export function createDeliveryPD({getReport,save,getIndex,setIndex}){
 let worker=null,url=null,request=0;
 function stop(){worker?.terminate();worker=null;if(url)URL.revokeObjectURL(url);url=null;$("d-pd-run").disabled=false;$("d-pd-cancel").hidden=true;}
 function clear(message="PD inputs changed. Recalculate; no previous PD result is retained."){
  request++;stop();const r=getReport();if(r)r.pharmacodynamics=null;
  $("d-pd-output").hidden=true;$("d-pd-status").textContent=message;
 }
 function settings(){return validatePD(Object.fromEntries(Object.keys(PD_FIELDS).map(k=>{
  const s=$("d-pd-"+k).value;return [k,s.trim()?Number(s):NaN];
 })));}
 function run(){
  clear("Calculating the hypothetical PD layer…");
  try{
   const r=getReport();if(!r)throw Error("Run a delivery comparison first.");
   if(!$("d-pd-assume").checked)throw Error("Acknowledge the one-way free-amount assumption before calculating.");
   const parameters=settings(),id=request;
   $("d-pd-run").disabled=true;$("d-pd-cancel").hidden=false;
   url=URL.createObjectURL(new Blob([PD_WORKER_SOURCE],{type:"application/javascript"}));worker=new Worker(url);
   worker.onmessage=({data})=>{
    if(data.id!==request||r!==getReport())return;stop();
    if(data.error){$("d-pd-status").textContent=data.error;return;}
    r.pharmacodynamics=data.result;$("d-pd-status").textContent="Hypothesis calculated. The delivery trajectories were not changed.";
    $("d-pd-output").hidden=false;render();draw();
   };
   worker.onerror=()=>clear("PD calculation failed; no result retained.");
   worker.postMessage({id,parameters,report:{parameters:r.parameters,calculationRevision:r.calculationRevision,
    profileAudit:{aucRatio:r.profileAudit.aucRatio,A:{peak:r.profileAudit.A.peak},B:{peak:r.profileAudit.B.peak}}}});
  }catch(e){clear(e.message);}
 }
 for(const [k,[label,min,max]]of Object.entries(PD_FIELDS)){
  const wrap=document.createElement("div"),l=document.createElement("label"),input=document.createElement("input");
  l.htmlFor="d-pd-"+k;l.textContent=label;
  Object.assign(input,{id:l.htmlFor,type:"number",min,max,step:"any",value:pdPreset()[k]});
  input.oninput=()=>clear();wrap.append(l,input);$("d-pd-parameters").append(wrap);
 }
 $("d-pd-run").onclick=run;$("d-pd-cancel").onclick=()=>clear("PD calculation cancelled; delivery results remain available.");
 $("d-pd-assume").onchange=()=>clear();
 $("d-pd-load").onclick=()=>{
  const p=pdPreset($("d-pd-preset").value);for(const k of Object.keys(PD_FIELDS))$("d-pd-"+k).value=p[k];
  clear("PD hypothesis loaded. Delivery inputs were preserved; choose Calculate hypothetical PD.");
 };
 function render(){
  const p=getReport().pharmacodynamics,a=p.A,b=p.B,v=p.parameters;
  const ratio=x=>x===null?"undefined":fmt(x)+"×";
  $("d-pd-verdict").textContent=`Exposure AUC B/A ${ratio(p.ratios.exposure)} → instantaneous saturation area ${ratio(p.ratios.equilibriumAUC)} → kinetic engagement area ${ratio(p.ratios.engagementAUC)}. Endpoint signal B/A ${ratio(p.ratios.endpointSignal)} under the selected recovery rate. These are different observables, not interchangeable measures of efficacy.`;
  $("d-pd-contrast").textContent=`Peak signal B/A ${ratio(p.ratios.peakSignal)}, compared with ${ratio(p.ratios.endpointSignal)} at the endpoint. The assay clock and recovery assumption affect what remains at T; an endpoint ratio is not a maximal-effect ratio.`;
  const audit=p.interpretation;
  $("d-pd-factorization").textContent=audit.product===null?"The ratio decomposition is undefined when a required reference or normalization is zero. Inspect absolute values rather than assigning a fold advantage.":
   `${fmt(audit.ratios.exposure)} exposure × ${fmt(audit.ratios.saturation)} saturation × ${fmt(audit.ratios.kinetics)} kinetic-history × ${fmt(audit.ratios.retention)} retention ≈ ${fmt(audit.product)} endpoint B/A (displayed factors rounded). The common formation scale s cancels; changing s alone rescales both signals without changing this ranking.`;
  $("d-pd-factors").replaceChildren(...[["exposure","Exposure Q · payload·h/cell"],["saturation","Saturation C · dimensionless"],["kinetics","Kinetic-history M · dimensionless"],["retention","Retention R · fraction"]].map(([key,label])=>{
   const tr=document.createElement("tr");for(const [i,value]of [label,fmt(audit.A[key]),fmt(audit.B[key]),fmt(audit.ratios[key])].entries()){
    const cell=document.createElement(i?"td":"th");cell.textContent=value;if(!i)cell.scope="row";tr.append(cell);
   }return tr;
  }));
  $("d-pd-accounting").textContent=["A","B"].map(pop=>{
   const q=audit[pop].engagementAccounting;
   return `${pop}: ${fmt(q.exposure)} = ${fmt(q.engagedArea)} + ${fmt(q.terminal)} + ${fmt(q.occupiedTargetOverlap)} payload·h/cell`;
  }).join("; ")+".";
  const crosses=audit.clock.brackets;
  $("d-pd-clock").textContent=crosses.length?
   `${crosses.length} sampled ordering reversal${crosses.length===1?"":"s"} detected. First: larger signal changes from ${crosses[0].from} to ${crosses[0].to} between ${fmt(crosses[0].lowerTime)} and ${fmt(crosses[0].upperTime)} h. Neither delivery nor PD parameters changed; only the reading time did.`:
   "No resolved ordering reversal detected on this reporting grid. This does not establish that the trajectories cannot cross between samples or outside the selected window.";
  $("d-pd-crossover").disabled=!crosses.length;
  $("d-pd-memory").textContent=`At fixed K = ${fmt(v.halfAmount)} payload/cell, b = ${fmt(v.off)} h⁻¹ implies effective association b/K = ${fmt(v.off/v.halfAmount)} (payload/cell)⁻¹h⁻¹. Unforced engagement half-time ${fmt(Math.log(2)/v.off)} h; signal recovery half-time ${v.repair>0?fmt(Math.log(2)/v.repair)+" h":"infinite (no recovery)"}. These are conditional model times, not measured target residence or repair times.`;
  const rows=[
   ["Linear no-recovery control · AU",a.linearNoRecovery,b.linearNoRecovery],
   ["Instantaneous saturation area · h",a.final.equilibriumAUC,b.final.equilibriumAUC],
   ["Kinetic engagement area · h",a.final.engagementAUC,b.final.engagementAUC],
   ["Peak kinetic engagement · fraction",a.peakEngagement,b.peakEngagement],
   ["Endpoint signal: linear drive + recovery · AU",a.final.linearSignal,b.final.linearSignal],
   ["Endpoint signal: instantaneous saturation + recovery · AU",a.final.equilibriumSignal,b.final.equilibriumSignal],
   ["Endpoint signal: kinetic engagement + recovery · AU",a.final.signal,b.final.signal],
   ["Peak kinetic-driven signal · AU",a.peakSignal,b.peakSignal],
   ["Time of peak signal within window · h",a.peakSignalTime,b.peakSignalTime],
   ["Fraction of formed signal retained at T",a.retainedFraction,b.retainedFraction]
  ];
  $("d-pd-values").replaceChildren(...rows.map(([label,a,b])=>{
   const tr=document.createElement("tr");for(const [i,v]of [label,fmt(a),fmt(b)].entries()){const cell=document.createElement(i?"td":"th");cell.textContent=v;if(!i)cell.scope="row";tr.append(cell);}return tr;
  }));
  $("d-pd-ledger").textContent=`Kinetic signal ledger: D(T) + recovered = s∫Odt. A: ${fmt(a.final.signal)} + ${fmt(a.final.recovered)} = ${fmt(a.noRecoverySignal)} AU; B: ${fmt(b.final.signal)} + ${fmt(b.final.recovered)} = ${fmt(b.noRecoverySignal)} AU. Maximum relative residual ${Math.max(a.diagnostics.maxLedgerRelativeResidual,b.diagnostics.maxLedgerRelativeResidual).toExponential(2)}.`;
 }
 function plot(canvas,key,title,w=null){
  const r=getReport()?.pharmacodynamics;if(!r)return;
  const width=w??Math.max(240,canvas.getBoundingClientRect().width),height=285,dpr=devicePixelRatio||1;
  canvas.width=width*dpr;canvas.height=height*dpr;const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);
  const style=getComputedStyle(document.documentElement),c=n=>style.getPropertyValue(n).trim();
  const T=r.deliveryParameters.horizon,max=key==="engagement"?1:Math.max(r.A.peakSignal,r.B.peakSignal,1e-12)*1.08;
  const x=t=>57+t/T*(width-72),y=v=>40+207*(1-v/max);
  ctx.fillStyle=c("--surface");ctx.fillRect(0,0,width,height);ctx.fillStyle=c("--text");ctx.font="12px Switzer, sans-serif";ctx.fillText(title,10,18,width-20);
  for(let i=0;i<=4;i++){
   ctx.strokeStyle=c("--border");ctx.beginPath();ctx.moveTo(57,y(max*i/4));ctx.lineTo(width-15,y(max*i/4));ctx.stroke();
   ctx.fillStyle=c("--muted");ctx.textAlign="right";ctx.fillText(fmt(max*i/4),51,y(max*i/4)+4);
   ctx.textAlign="center";ctx.fillText(fmt(T*i/4),x(T*i/4),267);
  }
  ctx.fillText("Time · h",width/2,283);
  for(const pop of ["A","B"]){
   ctx.strokeStyle=c(pop==="A"?"--a":"--b");ctx.lineWidth=2;ctx.setLineDash(pop==="A"?[]:[7,4]);ctx.beginPath();
   r[pop].rows.forEach((v,i)=>{if(i)ctx.lineTo(x(v.t),y(v[key]));else ctx.moveTo(x(v.t),y(v[key]));});ctx.stroke();
  }
  ctx.lineWidth=1;ctx.setLineDash([2,4]);ctx.strokeStyle=c("--text");ctx.beginPath();ctx.moveTo(x(r.A.rows[getIndex()].t),40);ctx.lineTo(x(r.A.rows[getIndex()].t),247);ctx.stroke();ctx.setLineDash([]);
 }
 function draw(){
  const p=getReport()?.pharmacodynamics;if(!p||$("d-output").hidden||$("d-pd-output").hidden)return;
  plot($("d-pd-engagement"),"engagement","Hypothetical kinetic engagement · fraction");
  plot($("d-pd-signal"),"signal","Hypothetical excess signal · arbitrary units");
  const i=getIndex(),a=p.A.rows[i],b=p.B.rows[i];$("d-pd-node").value=i;
  const c=p.interpretation.clock.classes[i];
  $("d-pd-clock-current").textContent=`At ${fmt(c.t)} h, B − A = ${fmt(c.delta)} AU; ${c.rank==="unresolved"?"ordering is numerically unresolved":c.rank+" has the larger hypothetical signal"}. This is a readout comparison, not an efficacy ranking.`;
  $("d-pd-inspect").textContent=`At ${fmt(a.t)} h: engagement A ${fmt(a.engagement)}, B ${fmt(b.engagement)}; signal A ${fmt(a.signal)}, B ${fmt(b.signal)} AU. Peaks are internal-step maxima; displayed curves use 401 samples. A peak at T is observation-limited.`;
 }
 $("d-pd-node").oninput=()=>setIndex(Number($("d-pd-node").value));
 $("d-pd-crossover").onclick=()=>{
  const crossing=getReport()?.pharmacodynamics?.interpretation.clock.brackets[0];
  if(crossing)setIndex(crossing.upperIndex);
 };
 $("d-pd-json").onclick=()=>{const r=getReport()?.pharmacodynamics;if(r)save("hypothetical-pd.json",JSON.stringify(r,null,2),"application/json");};
 $("d-pd-csv").onclick=()=>{const r=getReport()?.pharmacodynamics;if(r)save("hypothetical-pd.csv",pdCSV(r),"text/csv");};
 $("d-pd-png").onclick=()=>{
  const r=getReport()?.pharmacodynamics;if(!r)return;
  const out=document.createElement("canvas");out.width=1440;out.height=600;const ctx=out.getContext("2d"),s=getComputedStyle(document.documentElement);
  ctx.fillStyle=s.getPropertyValue("--surface");ctx.fillRect(0,0,1440,600);ctx.fillStyle=s.getPropertyValue("--text");
  ctx.font="24px sans-serif";ctx.fillText("Equal exposure is not a pharmacodynamic conclusion",30,38);
  ctx.font="17px sans-serif";ctx.fillText(`HYPOTHETICAL · 0–${fmt(r.deliveryParameters.horizon)} h · exposure AUC B/A ${fmt(r.ratios.exposure)} · A solid teal / B dashed amber`,30,70);
  for(const [i,key,label]of [[0,"engagement","Kinetic engagement · fraction"],[1,"signal","Excess signal · arbitrary units"]]){
   const temp=document.createElement("canvas");plot(temp,key,label,680);ctx.drawImage(temp,25+710*i,95,680,285);
  }
  const p=r.parameters;
  ctx.fillText(`K ${fmt(p.halfAmount)} payload/cell · b ${fmt(p.off)} /h · formation ${fmt(p.formation)} AU/h · recovery ${fmt(p.repair)} /h`,30,420);
  ctx.fillText(`Engagement area B/A ${fmt(r.ratios.engagementAUC)} · endpoint signal B/A ${fmt(r.ratios.endpointSignal)} · ratios are not efficacy.`,30,458);
  ctx.fillText("One-way prescribed free amount; no depletion, cell killing or fitted therapeutic parameters.",30,496);
  ctx.fillText("Finite-window endpoint is recovery-weighted. Retain JSON for exposure inputs and all model assumptions.",30,534);
  ctx.fillText(`Data-Rich, Insight-Poor · hypothetical PD ${r.revision} · ${r.deliveryRevision}`,30,572);
  out.toBlob(blob=>{if(blob)save("hypothetical-pd.png",blob,"image/png");},"image/png");
 };
 return {clear,draw,reset:()=>clear("Optional hypothesis layer. Acknowledge its assumptions, then calculate; nothing is fitted or inferred.")};
}
