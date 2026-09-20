import {profileThresholdAudit,deliveryProfileCSV} from "./delivery-model.js";
const $=id=>document.getElementById(id);
const fmt=x=>x===null?"Not defined":x!==0&&(Math.abs(x)<.001||Math.abs(x)>=1e6)?x.toExponential(3):new Intl.NumberFormat("en-US",{maximumFractionDigits:3}).format(x);
export function createDeliveryProfile({getReport,save,match,preset,getIndex,setIndex}){
 function reset(){
  const r=getReport();if(!r)return;const p=r.profileAudit;
  $("d-profile-verdict").textContent=p.aucRatio===null?"A has zero AUC. No fold comparison or positive-AUC match is defined."
   :p.matched?`A and B have numerically equal 0–${fmt(r.parameters.horizon)} h cytosolic AUC (${fmt(p.A.auc)} payload·h/cell each). Equality of area alone says nothing about equality of the time profiles.`
   :`Current AUC B/A = ${fmt(p.aucRatio)}. These are not equal-AUC profiles. Use the explicit match to isolate shape at equal area within 0–${fmt(r.parameters.horizon)} h.`;
  $("d-profile-match").disabled=p.match.status!=="ready";
  $("d-profile-match-note").textContent=p.match.status==="ready"
   ?`Holding every other input fixed, B entry = ${fmt(p.match.entry)} ADC/cell/h matches A’s AUC in this window. Equality is imposed by linear scaling, not independently demonstrated.`
   :p.match.status==="zero-reference"?"Cannot construct a meaningful positive-AUC comparison against a zero-AUC reference."
   :p.match.status==="blocked"?"B has no productive cytosolic route. Scaling entry cannot create one."
   :"The required B entry exceeds the supported input range; no clipped or approximate match is applied.";
  const rows=[
   ["Cytosolic AUC · payload·h/cell","auc"],
   ["Peak cytosolic amount within window · payload/cell","peak"],
   ["Time of observed peak · h","peakTime"],
   ["t10 of finite-window AUC · h","q10"],["t50 of finite-window AUC · h","q50"],["t90 of finite-window AUC · h","q90"],
   ["Central 80% exposure interval · h","central80Duration"],["Exposure-weighted mean clock time · h","centroid"],
   ["AUC accumulated in final quarter of window · %","lateQuarterFraction",100]
  ];
  $("d-profile-values").replaceChildren(...rows.map(([label,key,mult=1])=>{
   const tr=document.createElement("tr");
   const values=["A","B"].map(pop=>fmt(p[pop][key]===null?null:p[pop][key]*mult)+(key==="peakTime"&&p[pop].peakAtWindowEnd?" (window end)":""));
   for(const [i,text]of [label,...values].entries()){const td=document.createElement(i===0?"th":"td");td.textContent=text;if(i===0)td.scope="row";tr.append(td);}return tr;
  }));
  $("d-profile-cutoff").value=p.cutoff?.value??1;cutoff();draw();
 }
 function cutoff(){
  const r=getReport();if(!r)return;
  try{
   const value=$("d-profile-cutoff").value;
   if(!value.trim())throw Error("Enter a nonnegative descriptive cutoff.");
   const c=profileThresholdAudit(r.parameters,r.profileAudit,Number(value));
   r.profileAudit.cutoff=c;
   $("d-profile-cutoff-note").textContent=`Time strictly above ${fmt(c.value)} payload/cell: A ${fmt(c.A.duration)} h; B ${fmt(c.B.duration)} h.${c.A.truncatedAtWindowEnd||c.B.truncatedAtWindowEnd?" An above-cutoff interval reaches the observation boundary; its full duration is not established.":""} This is a descriptive comparison, not an activity threshold.`;
   $("d-profile-csv").disabled=false;$("d-profile-png").disabled=false;
  }catch(e){
   r.profileAudit.cutoff=null;$("d-profile-cutoff-note").textContent=e.message+" No cutoff result is retained.";
   $("d-profile-csv").disabled=true;$("d-profile-png").disabled=true;
  }
  draw();
 }
 function plot(canvas,key,title,width=null){
  const r=getReport();if(!r)return;
  const w=width??Math.max(240,canvas.getBoundingClientRect().width),h=285,dpr=devicePixelRatio||1;
  canvas.width=Math.round(w*dpr);canvas.height=h*dpr;const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);
  const styles=getComputedStyle(document.documentElement),c=n=>styles.getPropertyValue(n).trim(),p=r.profileAudit,T=r.parameters.horizon;
  const left=57,right=14,top=40,bottom=38,pw=w-left-right,ph=h-top-bottom;
  const max=key==="cumulativeFraction"?1:Math.max(p.A.peak,p.B.peak,1e-12)*1.08;
  const x=t=>left+t/T*pw,y=v=>top+ph*(1-v/max);
  ctx.fillStyle=c("--surface");ctx.fillRect(0,0,w,h);
  ctx.fillStyle=c("--text");ctx.font="12px Switzer, sans-serif";ctx.fillText(title,10,18,w-20);
  for(let i=0;i<=4;i++){
   const v=max*i/4;ctx.strokeStyle=c("--border");ctx.beginPath();ctx.moveTo(left,y(v));ctx.lineTo(w-right,y(v));ctx.stroke();
   ctx.textAlign="right";ctx.fillStyle=c("--muted");ctx.fillText(fmt(v),left-6,y(v)+4);
   ctx.textAlign="center";ctx.fillText(fmt(T*i/4),x(T*i/4),h-19);
  }
  ctx.fillText("Time · h",left+pw/2,h-2);
  if(key==="Pcyt"&&p.cutoff&&p.cutoff.value<=max){
   ctx.strokeStyle=c("--muted");ctx.setLineDash([2,4]);ctx.beginPath();ctx.moveTo(left,y(p.cutoff.value));ctx.lineTo(w-right,y(p.cutoff.value));ctx.stroke();ctx.setLineDash([]);
  }
  for(const pop of ["A","B"]){
   ctx.strokeStyle=c(pop==="A"?"--a":"--b");ctx.lineWidth=2;ctx.setLineDash(pop==="A"?[]:[7,4]);ctx.beginPath();let first=true;
   for(const v of p[pop].points){if(v[key]===null)continue;if(first){ctx.moveTo(x(v.t),y(v[key]));first=false;}else ctx.lineTo(x(v.t),y(v[key]));}ctx.stroke();ctx.setLineDash([]);
   if(key==="Pcyt"&&p[pop].peakTime!==null){
    ctx.beginPath();ctx.arc(x(p[pop].peakTime),y(p[pop].peak),3,0,2*Math.PI);ctx.fillStyle=c(pop==="A"?"--a":"--b");ctx.fill();
   }
  }
  ctx.lineWidth=1;ctx.strokeStyle=c("--text");ctx.setLineDash([2,4]);ctx.beginPath();
  ctx.moveTo(x(r.A.rows[getIndex()].t),top);ctx.lineTo(x(r.A.rows[getIndex()].t),h-bottom);ctx.stroke();ctx.setLineDash([]);
 }
 function draw(){
  const r=getReport();if(!r||$("d-output").hidden)return;
  plot($("d-profile-stock"),"Pcyt","Cytosolic payload · payload/cell");
  plot($("d-profile-cumulative"),"cumulativeFraction","Accumulated fraction of each case’s AUC");
  const i=getIndex(),a=r.A.rows[i],b=r.B.rows[i],p=r.profileAudit;
  $("d-profile-node").value=i;
  $("d-profile-inspection").textContent=`At ${fmt(a.t)} h: cytosolic amount A ${fmt(a.Pcyt)}, B ${fmt(b.Pcyt)} payload/cell; accumulated finite-window AUC fraction A ${p.A.auc>0?fmt(100*a.auc/p.A.auc)+"%":"undefined"}, B ${p.B.auc>0?fmt(100*b.auc/p.B.auc)+"%":"undefined"}. This slider shares the other trajectory inspectors. Peak dots and the dotted descriptive cutoff are shown on the amount plot.`;
 }
 $("d-profile-match").onclick=()=>{const p=getReport()?.profileAudit;if(p?.match.status==="ready")match(p.match.entry);};
 $("d-profile-preset").onclick=preset;
 $("d-profile-node").oninput=()=>setIndex(Number($("d-profile-node").value));
 $("d-profile-cutoff").oninput=cutoff;
 $("d-profile-csv").onclick=()=>{const r=getReport();if(r)save("cytosolic-time-profiles.csv",deliveryProfileCSV(r.profileAudit),"text/csv");};
 $("d-profile-png").onclick=()=>{
  const r=getReport();if(!r)return;const out=document.createElement("canvas");out.width=1440;out.height=600;
  const ctx=out.getContext("2d"),style=getComputedStyle(document.documentElement);
  ctx.fillStyle=style.getPropertyValue("--surface");ctx.fillRect(0,0,out.width,out.height);
  ctx.fillStyle=style.getPropertyValue("--text");ctx.font="24px sans-serif";ctx.fillText("Cytosolic exposure: total area is not its time history",30,38);
  ctx.font="17px sans-serif";ctx.fillText(`Synthetic · ${r.parameters.mode} input · 0–${fmt(r.parameters.horizon)} h · AUC B/A ${fmt(r.profileAudit.aucRatio)} · matched: ${r.profileAudit.matched}`,30,70);
  for(const [i,key,title]of [[0,"Pcyt","Cytosolic payload · payload/cell"],[1,"cumulativeFraction","Accumulated fraction of each case’s AUC"]]){
   const temp=document.createElement("canvas");plot(temp,key,title,680);ctx.drawImage(temp,25+i*710,95,680,285);
  }
  ctx.fillText("A solid teal · B dashed amber · right plot is normalized independently, even when areas differ.",30,418);
  const c=r.profileAudit.cutoff;
  ctx.fillText(`Descriptive cutoff ${fmt(c?.value??null)} payload/cell · duration above: A ${fmt(c?.A.duration??null)} h; B ${fmt(c?.B.duration??null)} h. Not efficacy.`,30,454);
  ctx.fillText(`Peak: A ${fmt(r.profileAudit.A.peak)}; B ${fmt(r.profileAudit.B.peak)} payload/cell · t50 of AUC: A ${fmt(r.profileAudit.A.q50)}; B ${fmt(r.profileAudit.B.q50)} h.`,30,490);
  ctx.fillText("Matching adjusts B entry only. Window-dependent descriptors; retain full JSON for parameters and scope.",30,526);
  ctx.fillText(`Data-Rich, Insight-Poor · ${r.calculationRevision} · Synthetic research model`,30,562);
  out.toBlob(blob=>{if(blob)save("cytosolic-time-profiles.png",blob,"image/png");},"image/png");
 };
 return {reset,draw};
}
