import {processingLossPoint,processingLossCSV,aucLossPoint,aucLossCSV,lossMapRate,lossMapPosition} from "./delivery-model.js";
const fmt=x=>x===null?"undefined":x!==0&&Math.abs(x)<.001?x.toExponential(2):new Intl.NumberFormat("en-US",{maximumSignificantDigits:5}).format(x);
export function createDeliveryMap({getReport,applyRates,save,kind="steady"}){
 const auc=kind==="auc",$=id=>document.getElementById(auc?id.replace("d-map","d-auc-map"):id);
 const data=r=>auc?r.aucLossMap:r.processingLossMap;
 const evaluate=auc?aucLossPoint:processingLossPoint;
 let point=null,geometry=null;
 function inspect(){
  const report=getReport();if(!report)return;
  const a=$("d-map-proc").value,b=$("d-map-loss").value;
  point=evaluate(data(report),a.trim()?Number(a):NaN,b.trim()?Number(b):NaN);
  $("d-map-apply").disabled=!point.valid;
  $("d-map-point").textContent=!point.valid
   ?"Unsupported point: use finite rates from 0 to 10 h⁻¹ with processing + loss ≥ 0.001 h⁻¹."
   :`Inspected B: processing ${fmt(point.proc)} h⁻¹; intact loss ${fmt(point.lossIntact)} h⁻¹. Productive fraction ${fmt(100*point.fProcess)}%; ${auc?`cytosolic AUC ${fmt(point.auc)} payload·h/cell`:`steady arrival ${fmt(point.activeFlux)} payload/cell/h`}; B/A ${point.ratio===null?"undefined (A = 0)":fmt(point.ratio)+"×"}. ${point.classification==="tie"?"Ties A.":point.classification==="above"?"Exceeds A.":"Falls below A."} ${point.lowerEntryAdvantage?"Lower-entry advantage survives.":!data(report).lowerEntry?"B does not have lower entry; this is not a lower-entry advantage.":"No strict lower-entry advantage at this point."}${auc?` Continuous-input steady arrival B/A: ${point.steadyRatio===null?"undefined":fmt(point.steadyRatio)+"×"}.${point.lateAdvantage?" Steady advantage, but lower AUC within this window.":""}`:""}`;
  draw();
 }
 function current(){
  const r=getReport();if(!r)return;
  $("d-map-proc").value=r.parameters.B.proc;$("d-map-loss").value=r.parameters.B.lossIntact;inspect();
 }
 function reset(){
  const r=getReport();if(!r)return;const m=data(r);
  if(auc){
   $("d-map-summary").textContent=`A’s cytosolic AUC remains fixed at ${fmt(m.referenceAUC)} payload·h/cell over 0–${fmt(m.config.horizon)} h. Input: ${m.config.mode==="pulse"?`${fmt(m.config.pulse)} h pulse, then zero entry`:"continuous entry"}. Vary only B’s processing and intact-loss rates. ${m.lowerEntry?"B has lower entry than A.":"B does not have lower entry than A; colors compare AUC only."}`;
   $("d-map-boundary").textContent=m.regime==="mixed"
    ?"Both rankings occur within the displayed domain. The solid contour approximates equal finite-time AUC; inspect exact rates to calculate their comparison directly."
    :m.regime==="all-tie"?"All supported grid samples tie in AUC. There is no strict advantage in this map."
    :m.regime==="above-with-possible-ties"?"Sampled AUC values are above A or tied; no below-reference sample occurs in this domain."
    :"Sampled AUC values are below A or tied; no above-reference sample occurs in this domain.";
   $("d-map-scope").textContent=m.interpretation+" The contour is interpolated from grid samples, not an exact analytical boundary. In pulse mode, only the separate steady comparison is counterfactual.";
   current();return;
  }
  $("d-map-summary").textContent=`A remains fixed at ${fmt(m.referenceFlux)} payload/cell/h. Hold B’s entry, routing, escape and all other inputs fixed; vary only its processing and competing intact-loss rates. ${m.lowerEntry?"B has lower entry than A.":"B does not have lower entry than A; the colors compare steady delivery only."}`;
  $("d-map-boundary").textContent=m.regime==="boundary"
   ?`B exceeds A when k_loss,I,B < ${fmt(m.boundarySlope)} × k_proc,B, within the supported domain. Equality is a tie.`
   :m.regime==="zero-reference"?"A’s reference is zero. B exceeds A wherever productive processing is positive; fold ratios are undefined."
   :m.regime==="all-zero"?"Both steady arrivals are zero throughout this map. No advantage exists."
   :m.regime==="ceiling-tie"?"B can only tie A at zero intact loss and positive processing. No strict advantage exists."
   :"Even loss-free processing cannot make B exceed A under these fixed inputs.";
  $("d-map-scope").textContent=m.interpretation+" Slowing both rates together can preserve the steady ranking while delaying delivery. No uncertainty distribution or efficacy model is included.";
  current();
 }
 function draw(canvas=$("d-map"),width=null){
  const report=getReport();if(!report||$("d-output").hidden)return;
  const w=width??Math.max(240,canvas.getBoundingClientRect().width),h=420,dpr=devicePixelRatio||1;
  canvas.width=Math.round(w*dpr);canvas.height=h*dpr;
  const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);
  const style=getComputedStyle(document.documentElement),c=n=>style.getPropertyValue(n).trim();
  const channels=hex=>{let s=hex.replace("#","");if(s.length===3)s=[...s].map(x=>x+x).join("");return [0,2,4].map(i=>parseInt(s.slice(i,i+2),16));};
  const tint=name=>{const a=channels(c(name)),b=channels(c("--surface"));return `rgb(${a.map((v,i)=>Math.round(.23*v+.77*b[i])).join(",")})`;};
  const aboveColor=tint("--a"),belowColor=tint("--b"),neutralColor=c("--surface2");
  const g={left:58,top:37,width:w-75,height:310};if(canvas===$("d-map"))geometry=g;
  const x=k=>g.left+lossMapPosition(k)*g.width,y=k=>g.top+g.height-lossMapPosition(k)*g.height;
  const m=data(report),n=m.rates.length;
  ctx.fillStyle=c("--surface");ctx.fillRect(0,0,w,h);
  ctx.fillStyle=c("--text");ctx.font="12px Switzer, sans-serif";ctx.fillText("B intact-lysosomal loss · h⁻¹",g.left,17);
  // Raster cells: analytical steady boundary or grid-interpolated AUC contour.
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
   const p=m.cells[j*n+i],x0=g.left+Math.max(0,i-.5)/(n-1)*g.width,x1=g.left+Math.min(n-1,i+.5)/(n-1)*g.width;
   const y0=g.top+g.height-Math.min(n-1,j+.5)/(n-1)*g.height,y1=g.top+g.height-Math.max(0,j-.5)/(n-1)*g.height;
   ctx.fillStyle=p.classification==="above"?aboveColor:p.classification==="below"?belowColor:neutralColor;ctx.fillRect(x0,y0,x1-x0+.5,y1-y0+.5);
   if(!p.valid){ctx.strokeStyle=c("--muted");ctx.beginPath();ctx.moveTo(x0,y1);ctx.lineTo(x1,y0);ctx.stroke();}
  }
  ctx.font="12px Switzer, sans-serif";
  for(const k of [0,.001,.01,.1,1,10]){
   ctx.strokeStyle=c("--border");ctx.lineWidth=.6;
   ctx.beginPath();ctx.moveTo(x(k),g.top);ctx.lineTo(x(k),g.top+g.height);ctx.moveTo(g.left,y(k));ctx.lineTo(g.left+g.width,y(k));ctx.stroke();
   ctx.fillStyle=c("--muted");ctx.textAlign="center";ctx.fillText(fmt(k),x(k),g.top+g.height+20+(w<380&&k===.001?15:0));
   ctx.textAlign="right";ctx.fillText(fmt(k),g.left-8,y(k)+4);
  }
  ctx.textAlign="center";ctx.fillStyle=c("--text");ctx.fillText("B productive processing · h⁻¹",g.left+g.width/2,h-17);
  ctx.save();ctx.beginPath();ctx.rect(g.left,g.top,g.width,g.height);ctx.clip();
  ctx.strokeStyle=c("--text");ctx.lineWidth=2;ctx.setLineDash([5,4]);
  if(auc){
   ctx.setLineDash([]);
   ctx.beginPath();
   for(const [a,b]of m.contours){ctx.moveTo(g.left+a.u*g.width,g.top+g.height-a.v*g.height);ctx.lineTo(g.left+b.u*g.width,g.top+g.height-b.v*g.height);}
   ctx.stroke();
   if(m.referenceAUC===0&&m.steadyMap.bCeiling>0){
    ctx.beginPath();ctx.moveTo(x(0),y(.001));ctx.lineTo(x(0),y(10));ctx.stroke();
   }
  }else if(m.regime==="boundary"){
   const lo=.001/(1+m.boundarySlope),hi=Math.min(10,10/m.boundarySlope);
   ctx.beginPath();
   for(let i=0;i<=300;i++){
    const proc=lo*Math.pow(hi/lo,i/300);if(i===0)ctx.moveTo(x(proc),y(proc*m.boundarySlope));else ctx.lineTo(x(proc),y(proc*m.boundarySlope));
   }ctx.stroke();
  }else if(m.regime==="ceiling-tie"){
   ctx.beginPath();ctx.moveTo(x(.001),y(0));ctx.lineTo(x(10),y(0));ctx.stroke();
  }else if(m.regime==="zero-reference"){
   ctx.beginPath();ctx.moveTo(x(0),y(.001));ctx.lineTo(x(0),y(10));ctx.stroke();
  }
  ctx.restore();ctx.setLineDash([]);
  function marker(p,diamond){
   if(!p?.valid)return;const xx=x(p.proc),yy=y(p.lossIntact);
   ctx.beginPath();if(diamond){ctx.moveTo(xx,yy-8);ctx.lineTo(xx+8,yy);ctx.lineTo(xx,yy+8);ctx.lineTo(xx-8,yy);ctx.closePath();}else ctx.arc(xx,yy,4,0,Math.PI*2);
   if(!diamond){ctx.fillStyle=c("--surface");ctx.fill();}ctx.strokeStyle=c("--text");ctx.lineWidth=2;ctx.stroke();
  }
  marker(m.current,false);marker(point,true);
 }
 $("d-map-proc").oninput=inspect;$("d-map-loss").oninput=inspect;
 $("d-map-current").onclick=current;
 $("d-map-apply").onclick=()=>{if(point?.valid)applyRates(point.proc,point.lossIntact);};
 $("d-map").onclick=event=>{
  if(!geometry||!getReport())return;const box=event.currentTarget.getBoundingClientRect(),g=geometry;
  const u=(event.clientX-box.left-g.left)/g.width,v=1-(event.clientY-box.top-g.top)/g.height;
  if(u<0||u>1||v<0||v>1)return;
  $("d-map-proc").value=Number(Math.min(10,lossMapRate(u)).toPrecision(7));
  $("d-map-loss").value=Number(Math.min(10,lossMapRate(v)).toPrecision(7));inspect();
 };
 $("d-map-csv").onclick=()=>{const r=getReport();if(r)save(auc?"processing-loss-auc-map.csv":"processing-loss-map.csv",(auc?aucLossCSV:processingLossCSV)(data(r)),"text/csv");};
 $("d-map-png").onclick=()=>{
  const r=getReport();if(!r)return;
  const source=document.createElement("canvas");draw(source,1360);
  const out=document.createElement("canvas");out.width=1400;out.height=630;
  const ctx=out.getContext("2d"),s=getComputedStyle(document.documentElement);
  ctx.fillStyle=s.getPropertyValue("--surface");ctx.fillRect(0,0,1400,630);ctx.fillStyle=s.getPropertyValue("--text");ctx.font="24px sans-serif";
  ctx.fillText(auc?"Processing versus competing loss in B · finite-time cytosolic AUC":"Processing versus competing loss in B · synthetic steady-arrival comparison",30,38);
  ctx.drawImage(source,20,55,1360,420);
  const m=data(r);
  ctx.font="17px sans-serif";ctx.fillText(auc?`A AUC: ${fmt(m.referenceAUC)} payload·h/cell · 0–${fmt(m.config.horizon)} h · ${m.config.mode} input${m.config.mode==="pulse"?` (${fmt(m.config.pulse)} h pulse)`:""} · B lower entry: ${m.lowerEntry}`:`Fixed A arrival: ${fmt(m.referenceFlux)} payload/cell/h · B lower entry: ${m.lowerEntry}`,30,511);
  ctx.fillText(`Teal: B above A · amber: B below A · ${auc?"solid: approximate AUC tie":"dashed: tie"} · circle: current · diamond: inspected`,30,541);
  ctx.fillText(auc?"Shifted-log axes; hatched = unsupported. Finite molecular exposure, not efficacy. Retain JSON for parameters.":"Shifted-log axes; hatched = unsupported. Not finite-time exposure or efficacy. Retain JSON for parameters.",30,571);
  ctx.fillText(`Revision ${r.calculationRevision} · inspected rates: ${point?.valid?fmt(point.proc)+" / "+fmt(point.lossIntact)+" h⁻¹":"unsupported"}`,30,601);
  out.toBlob(blob=>{if(blob)save(auc?"processing-loss-auc-map.png":"processing-loss-map.png",blob,"image/png");},"image/png");
 };
 return {reset,draw};
}
