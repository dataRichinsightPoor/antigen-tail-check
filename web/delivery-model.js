/**
 * Original, synthetic linear-compartment worked example.
 * This is not a fitted ADC model or an efficacy predictor.
 */
export const DELIVERY_VERSION="0.2.6-example";
export const DELIVERY_REVISION="delivery-9";
export const DELIVERY_KEYS=["J","lys","rec","proc","lossIntact","esc","lossL","lossC"];
export const DELIVERY_LABELS={
 J:"Entry flux J · ADC/cell/h",lys:"Endosome → lysosome · h⁻¹",rec:"Recycling / return · h⁻¹",
 proc:"Productive payload processing · h⁻¹",lossIntact:"Competing intact-ADC loss · h⁻¹",
 esc:"Cytosolic escape · h⁻¹",lossL:"Released lysosomal payload loss · h⁻¹",lossC:"Cytosolic removal · h⁻¹"
};
const defaults=()=>({A:{J:100,lys:1,rec:9,proc:2,lossIntact:0,esc:1,lossL:1,lossC:1},B:{J:50,lys:1,rec:1,proc:2,lossIntact:0,esc:1,lossL:1,lossC:1},nu:1,mode:"continuous",pulse:2,horizon:24});
export function deliveryPreset(id="routing"){
 const p=defaults();
 if(id==="matched")p.B.rec=9;
 else if(id==="slow")p.B.proc=.02;
 else if(id==="pulse")p.mode="pulse";
 else if(id==="ambiguity")p.B={...p.A,lys:2,rec:8,esc:.5,lossL:1.5};
 else if(id==="competing"){p.B.proc=.02;p.A.lossIntact=.2;p.B.lossIntact=.2;}
 else if(id==="equalauc"){p.mode="pulse";p.B.proc=.05;p.B.J=matchDeliveryAUC(p).entry;}
 else if(id!=="routing")throw Error("Unknown worked example.");
 return p;
}
export function validateDelivery(raw){
 const p=structuredClone(raw);
 if(!["continuous","pulse"].includes(p.mode))throw Error("Choose continuous or pulse input.");
 const check=(v,lo,hi,name)=>{if(!Number.isFinite(v)||v<lo||v>hi)throw Error(`${name}: enter a finite value from ${lo} to ${hi}.`);};
 check(p.nu,1,16,"Payload yield");check(p.horizon,.25,168,"Observation duration");
 check(p.pulse,.01,168,"Pulse duration");
 if(p.mode==="pulse"&&p.pulse>p.horizon)throw Error("Pulse duration cannot exceed observation duration.");
 for(const pop of ["A","B"]){
  if(!p[pop])throw Error(`Missing case ${pop}.`);
  check(p[pop].J,0,1000000,`${pop}: entry flux`);
  for(const k of ["lys","rec","proc","lossIntact","esc","lossL"])check(p[pop][k],0,10,`${pop}: ${k}`);
  check(p[pop].lossC,.001,10,`${pop}: lossC`);
  if(p[pop].proc+p[pop].lossIntact<.001)throw Error(`${pop}: intact lysosomal exit rates must sum to at least 0.001 h⁻¹.`);
  if(p[pop].lys+p[pop].rec===0)throw Error(`${pop}: endosomal exit rates cannot both be zero.`);
  if(p[pop].esc+p[pop].lossL===0)throw Error(`${pop}: lysosomal payload exit rates cannot both be zero.`);
 }
 return p;
}
export function deliverySteady(p,nu){
 const fRoute=p.lys/(p.lys+p.rec),fProcess=p.proc/(p.proc+p.lossIntact),fEscape=p.esc/(p.esc+p.lossL);
 const E=p.J/(p.lys+p.rec),L=p.lys*E/(p.proc+p.lossIntact),Plys=nu*p.proc*L/(p.esc+p.lossL);
 const activeFlux=p.esc*Plys,Pcyt=activeFlux/p.lossC;
 return {E,L,Plys,Pcyt,fRoute,fProcess,fEscape,processingFlux:p.proc*L,intactLossFlux:p.lossIntact*L,activeFlux,
  lysosomalResidence:1/(p.proc+p.lossIntact),productiveFraction:fRoute*fProcess*fEscape,retainedIntact:E+L};
}
// E,L: intact ADC/cell. Plys,Pcyt: payload/cell.
// R: returned ADC/cell. DL,DC: removed payload/cell.
// U: cumulative input ADC/cell. Q: cytosolic payload AUC.
// DI: cumulative nonproductive diversion out of intact L, ADC equivalents/cell.
// H: time integral of Q; T*Q-H is the first temporal moment of Pcyt.
function derivative(y,p,nu,J){
 const [E,L,Plys,Pcyt]=y;
 return [J-(p.lys+p.rec)*E,p.lys*E-(p.proc+p.lossIntact)*L,
  nu*p.proc*L-(p.esc+p.lossL)*Plys,p.esc*Plys-p.lossC*Pcyt,
  p.rec*E,p.lossL*Plys,p.lossC*Pcyt,J,Pcyt,p.lossIntact*L,y[8]];
}
function rk4(y,dt,p,nu,J){
 const k1=derivative(y,p,nu,J);
 const k2=derivative(y.map((x,i)=>x+dt*k1[i]/2),p,nu,J);
 const k3=derivative(y.map((x,i)=>x+dt*k2[i]/2),p,nu,J);
 const k4=derivative(y.map((x,i)=>x+dt*k3[i]),p,nu,J);
 return y.map((x,i)=>x+dt*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);
}
export function simulateDelivery(p,config,{stepFactor=.025,nodes=401}={}){
 if(!(stepFactor>0&&stepFactor<=.1)||!Number.isInteger(nodes)||nodes<2||nodes>2001)throw Error("Invalid numerical settings.");
 const {nu,horizon,mode,pulse}=config;
 const fastest=Math.max(p.lys+p.rec,p.proc+p.lossIntact,p.esc+p.lossL,p.lossC);
 const dtMax=Math.min(horizon/(nodes-1),stepFactor/fastest);
 let y=Array(11).fill(0),t=0,steps=0,maxMassResidual=0,minState=0;
 const rows=[];
 for(let i=0;i<nodes;i++){
  const target=horizon*i/(nodes-1);
  while(t<target-1e-12){
   const on=mode==="continuous"||t<pulse-1e-12;
   const dt=Math.min(dtMax,target-t,mode==="pulse"&&on?pulse-t:Infinity);
   y=rk4(y,dt,p,nu,on?p.J:0);t+=dt;steps++;
  }
  const [E,L,Plys,Pcyt,R,DL,DC,U,Q,DI,H]=y;
  const massResidual=nu*(E+L+R+DI)+Plys+Pcyt+DL+DC-nu*U;
  const massRelative=Math.abs(massResidual)/Math.max(1,nu*U);
  maxMassResidual=Math.max(maxMassResidual,massRelative);
  minState=Math.min(minState,...y);
  rows.push({t:target,E,L,Plys,Pcyt,recycled:R,lysosomalLoss:DL,cytosolicLoss:DC,
   uptake:U,auc:Q,firstMoment:target*Q-H,retainedIntact:E+L,activeFlux:p.esc*Plys,
   activeArrivals:Pcyt+DC,intactLoss:DI,intactLossFlux:p.lossIntact*L,processingFlux:p.proc*L,massResidual});
 }
 if(rows.some(r=>Object.values(r).some(x=>!Number.isFinite(x)))||minState< -1e-8||maxMassResidual>1e-8)throw Error("Numerical integrity check failed; no result is reported.");
 return {rows,steady:deliverySteady(p,nu),final:rows.at(-1),diagnostics:{steps,dtMax,maxMassRelativeResidual:maxMassResidual,minState}};
}
export function deliveryRatio(b,a){return a>0?b/a:null;}
// Coordinate transform includes exact zero without pretending it is on a log axis.
export const lossMapRate=u=>.001*Math.expm1(u*Math.log1p(10000));
export const lossMapPosition=k=>Math.log1p(k/.001)/Math.log1p(10000);
export function processingLossPoint(map,proc,lossIntact){
 const valid=Number.isFinite(proc)&&Number.isFinite(lossIntact)&&proc>=0&&lossIntact>=0&&proc<=10&&lossIntact<=10&&proc+lossIntact>=.001;
 if(!valid)return {proc,lossIntact,valid:false,classification:"unsupported",activeFlux:null,ratio:null,lowerEntryAdvantage:false};
 const fProcess=proc/(proc+lossIntact),activeFlux=map.bCeiling*fProcess;
 const delta=activeFlux-map.referenceFlux,tol=1e-12*Math.max(Math.abs(activeFlux),Math.abs(map.referenceFlux));
 const classification=Math.abs(delta)<=tol?"tie":delta>0?"above":"below";
 return {proc,lossIntact,valid:true,fProcess,activeFlux,ratio:deliveryRatio(activeFlux,map.referenceFlux),classification,
  lowerEntryAdvantage:map.lowerEntry&&classification==="above"};
}
export function processingLossMap(parameters,nodes=81){
 if(!Number.isInteger(nodes)||nodes<2||nodes>201)throw Error("Map nodes must be an integer from 2 to 201.");
 const {A:a,B:b,nu,mode}=parameters,as=deliverySteady(a,nu),bs=deliverySteady(b,nu);
 const bCeiling=nu*b.J*bs.fRoute*bs.fEscape,referenceFlux=as.activeFlux;
 const ceilingRatio=deliveryRatio(bCeiling,referenceFlux);
 const regime=referenceFlux===0?(bCeiling>0?"zero-reference":"all-zero"):
  bCeiling>referenceFlux?"boundary":bCeiling===referenceFlux?"ceiling-tie":"no-advantage";
 const map={referenceFlux,bCeiling,ceilingRatio,lowerEntry:b.J<a.J,regime,
  boundarySlope:regime==="boundary"?ceilingRatio-1:null,
  domain:{min:0,max:10,minTotalExit:.001,nodes,axisTransform:"log10(1 + rate / 0.001)",rateUnits:"h^-1"},
  fixed:{A:{...a},B:{J:b.J,lys:b.lys,rec:b.rec,esc:b.esc,lossL:b.lossL,lossC:b.lossC},nu},
  interpretation:mode==="pulse"?"Continuous-input counterfactual only; not a pulse endpoint or pulse AUC map.":"Continuous-input steady arrival only; not finite-time exposure or efficacy.",
  comparisonTolerance:"Relative flux tolerance 1e-12 for numerical tie classification; not a biological equivalence margin."};
 map.current=processingLossPoint(map,b.proc,b.lossIntact);
 const rates=Array.from({length:nodes},(_,i)=>i===nodes-1?10:lossMapRate(i/(nodes-1)));
 map.rates=rates;
 map.cells=rates.flatMap(loss=>rates.map(proc=>processingLossPoint(map,proc,loss)));
 return map;
}
export function processingLossCSV(map){
 const keys=["proc","lossIntact","valid","classification","fProcess","activeFlux","ratio","lowerEntryAdvantage"];
 return ["# Processing and loss in h^-1; activeFlux in payload/cell/h",
  `# Fixed A steady arrival=${map.referenceFlux}; B ceiling=${map.bCeiling}; lower entry=${map.lowerEntry}`,
  "# Constant-input steady calculation; retain full JSON for fixed parameters",
  keys.join(","),...map.cells.map(p=>keys.map(k=>p[k]??"").join(","))].join("\n");
}
// Normalized four-filter cascade + AUC integrator + constant input.
// Scaling/squaring Taylor exponential avoids distinct-rate partial fractions.
function matrixProduct(a,b){
 const out=new Float64Array(36);
 for(let i=0;i<6;i++)for(let k=0;k<6;k++)if(a[i*6+k]!==0)
  for(let j=0;j<6;j++)out[i*6+j]+=a[i*6+k]*b[k*6+j];
 return out;
}
function cascadeExponential(rates,time,on){
 const m=new Float64Array(36);
 for(let i=0;i<4;i++){m[i*6+i]=-rates[i];m[i*6+(i===0?5:i-1)]=i===0&&!on?0:rates[i];}
 m[4*6+3]=1;
 const norm=Math.max(...Array.from({length:6},(_,i)=>m.slice(i*6,i*6+6).reduce((s,x)=>s+Math.abs(x),0)))*time;
 const scale=Math.max(0,Math.ceil(Math.log2(Math.max(1,norm/.5))));
 const factor=time/2**scale;
 for(let i=0;i<36;i++)m[i]*=factor;
 let sum=new Float64Array(36),term=new Float64Array(36);
 for(let i=0;i<6;i++)sum[i*6+i]=term[i*6+i]=1;
 // With ||M|| <= 0.5, the 18-term tail is below double precision.
 for(let k=1;k<=18;k++){
  term=matrixProduct(term,m);
  for(let i=0;i<36;i++){term[i]/=k;sum[i]+=term[i];}
 }
 for(let i=0;i<scale;i++)sum=matrixProduct(sum,sum);
 return sum;
}
export function finiteDeliveryPoint(p,config,time=config.horizon){
 if(!Number.isFinite(time)||time<0||time>config.horizon)throw Error("Inspection time must lie within the observation window.");
 const s=deliverySteady(p,config.nu);
 if(s.activeFlux===0)return {t:time,Pcyt:0,activeFlux:0,auc:0};
 const rates=[p.lys+p.rec,p.proc+p.lossIntact,p.esc+p.lossL,p.lossC];
 const onTime=config.mode==="pulse"?Math.min(config.pulse,time):time;
 const on=cascadeExponential(rates,onTime,true);
 let state=Array.from({length:6},(_,i)=>on[i*6+5]);
 if(config.mode==="pulse"&&time>onTime){
  const off=cascadeExponential(rates,time-onTime,false);
  state=state.map((_,i)=>state.reduce((sum,x,k)=>sum+off[i*6+k]*x,0));
 }
 const point={t:time,Pcyt:s.activeFlux/p.lossC*state[3],activeFlux:s.activeFlux*state[2],auc:s.activeFlux/p.lossC*state[4]};
 if(Object.values(point).some(x=>!Number.isFinite(x)||x<0))throw Error("Finite-time calculation failed.");
 return point;
}
export function finiteDeliveryAUC(p,config){return finiteDeliveryPoint(p,config).auc;}
export function matchDeliveryAUC(parameters){
 const p=validateDelivery(parameters),target=finiteDeliveryAUC(p.A,p);
 const perUnit=finiteDeliveryAUC({...p.B,J:1},p);
 const entry=perUnit>0?target/perUnit:null;
 const status=target===0?"zero-reference":perUnit===0?"blocked":!Number.isFinite(entry)||entry>1e6?"out-of-range":"ready";
 return {status,entry:status==="ready"?entry:null,targetAUC:target,unitEntryAUC:perUnit,
  horizon:p.horizon,mode:p.mode,pulse:p.pulse,
  scope:"Adjust B entry only to equal A's finite-window AUC. This is a linear-model normalization, not an experimentally validated dose or an equal-efficacy comparison."};
}
// Positive serial first-order cascades driven by one rectangular pulse are
// unimodal in cytosolic stock. Bisection refines the post-pulse maximum.
function profilePeak(p,config){
 const end=finiteDeliveryPoint(p,config),T=config.horizon;
 if(end.auc===0)return {peak:0,peakTime:null,peakAtWindowEnd:false};
 let time=T;
 if(config.mode==="pulse"&&config.pulse<T&&end.activeFlux-p.lossC*end.Pcyt<=0){
  let lo=config.pulse,hi=T;
  for(let i=0;i<55;i++){
   const mid=(lo+hi)/2,v=finiteDeliveryPoint(p,config,mid);
   if(v.activeFlux-p.lossC*v.Pcyt>0)lo=mid;else hi=mid;
  }
  time=(lo+hi)/2;
 }
 return {peak:finiteDeliveryPoint(p,config,time).Pcyt,peakTime:time,peakAtWindowEnd:time===T};
}
export function profileThresholdAudit(parameters,profile,cutoff){
 if(!Number.isFinite(cutoff)||cutoff<0||cutoff>1e12)throw Error("Use a finite descriptive cutoff from 0 to 10¹² payload/cell.");
 const T=parameters.horizon;
 function one(pop){
  const s=profile[pop],p=parameters[pop];
  if(s.auc===0||s.peak<=cutoff)return {duration:0,firstCrossing:null,lastCrossing:null,truncatedAtWindowEnd:false};
  if(cutoff===0)return {duration:T,firstCrossing:0,lastCrossing:T,truncatedAtWindowEnd:true};
  let lo=0,hi=s.peakTime;
  for(let i=0;i<55;i++){const mid=(lo+hi)/2;if(finiteDeliveryPoint(p,parameters,mid).Pcyt>cutoff)hi=mid;else lo=mid;}
  const start=(lo+hi)/2;
  const truncated=finiteDeliveryPoint(p,parameters,T).Pcyt>cutoff;
  let end=T;
  if(!truncated){
   lo=s.peakTime;hi=T;
   for(let i=0;i<55;i++){const mid=(lo+hi)/2;if(finiteDeliveryPoint(p,parameters,mid).Pcyt>cutoff)lo=mid;else hi=mid;}
   end=(lo+hi)/2;
  }
  return {duration:end-start,firstCrossing:start,lastCrossing:end,truncatedAtWindowEnd:truncated};
 }
 return {value:cutoff,units:"payload/cell",A:one("A"),B:one("B"),
  scope:"Time strictly above an arbitrary descriptive amount cutoff within 0–T, not a biological activity or efficacy threshold. Crossings at the observation boundary are truncated."};
}
export function deliveryProfileAudit(parameters,A,B){
 const T=parameters.horizon;
 function one(p,trace){
  const auc=finiteDeliveryAUC(p,parameters),peak=profilePeak(p,parameters);
  function quantile(f){
   if(auc===0)return null;let lo=0,hi=T;
   for(let i=0;i<50;i++){const mid=(lo+hi)/2;if(finiteDeliveryPoint(p,parameters,mid).auc<f*auc)lo=mid;else hi=mid;}
   return (lo+hi)/2;
  }
  const q10=quantile(.1),q50=quantile(.5),q90=quantile(.9);
  const times=[...trace.rows.map(r=>r.t),parameters.mode==="pulse"?parameters.pulse:0,q10,q50,q90,
   ...[.25,.5,.75,1,1.25,1.5,2].map(k=>peak.peakTime===null?null:k*peak.peakTime)]
   .filter(t=>t!==null&&t>=0&&t<=T);
  const points=[...new Set(times)].sort((a,b)=>a-b).map(t=>{
   const v=finiteDeliveryPoint(p,parameters,t);return {...v,cumulativeFraction:auc>0?v.auc/auc:null,areaNormalized:auc>0?v.Pcyt/auc:null};
  });
  return {auc,...peak,q10,q50,q90,central80Duration:auc>0?q90-q10:null,
   centroid:auc>0?trace.final.firstMoment/trace.final.auc:null,
   lateQuarterFraction:auc>0?(auc-finiteDeliveryPoint(p,parameters,.75*T).auc)/auc:null,points};
 }
 const a=one(parameters.A,A),b=one(parameters.B,B),ratio=deliveryRatio(b.auc,a.auc);
 const profile={A:a,B:b,aucRatio:ratio,matched:ratio!==null&&Math.abs(ratio-1)<=1e-8,matchTolerance:1e-8,
  match:matchDeliveryAUC(parameters),
  units:{peak:"payload/cell",auc:"payload*h/cell",times:"h",areaNormalized:"1/h",cumulativeFraction:"dimensionless"},
  scope:"All descriptors refer to the selected 0–T window. Matching is numerical, not experimental equivalence. Quantiles describe accumulated AUC, not fractional instantaneous response. A boundary peak is not evidence of the global peak. This exposure audit contains no pharmacodynamics; an optional PD hypothesis is exported separately.",
  method:"Matrix-exponential states; bisection of post-pulse peak and AUC quantiles. Centroid from RK4 first temporal moment. Plot samples include reported nodes, quantiles and refined peak."};
 profile.cutoff=profileThresholdAudit(parameters,profile,1);
 return profile;
}
export function deliveryProfileCSV(profile){
 const keys=["t","Pcyt","activeFlux","auc","cumulativeFraction","areaNormalized"];
 return ["# Cytosolic time profiles; retain full JSON for kinetic parameters and descriptors",
  "# t=h; Pcyt=payload/cell; activeFlux=payload/cell/h; auc=payload*h/cell; cumulativeFraction=dimensionless; areaNormalized=1/h",
  `# AUC B/A=${profile.aucRatio??"undefined"}; numerical_match=${profile.matched}; descriptive_cutoff=${profile.cutoff?.value??"not set"} payload/cell`,
  "case,"+keys.join(","),...["A","B"].flatMap(pop=>profile[pop].points.map(v=>pop+","+keys.map(k=>v[k]??"").join(",")))].join("\n");
}
export function aucLossPoint(map,proc,lossIntact){
 const steady=processingLossPoint(map.steadyMap,proc,lossIntact);
 if(!steady.valid)return {...steady,auc:null,steadyRatio:null,steadyClassification:null,lateAdvantage:false};
 const p={...map.fixed.B,proc,lossIntact};
 const auc=finiteDeliveryAUC(p,map.config);
 const delta=auc-map.referenceAUC,tol=1e-10*Math.max(auc,map.referenceAUC);
 const classification=Math.abs(delta)<=tol?"tie":delta>0?"above":"below";
 return {proc,lossIntact,valid:true,fProcess:steady.fProcess,auc,ratio:deliveryRatio(auc,map.referenceAUC),classification,
  lowerEntryAdvantage:map.lowerEntry&&classification==="above",
  steadyRatio:steady.ratio,steadyClassification:steady.classification,
  lateAdvantage:steady.lowerEntryAdvantage&&classification==="below"};
}
export function aucLossMap(parameters,steadyMap=processingLossMap(parameters)){
 const map={referenceAUC:finiteDeliveryAUC(parameters.A,parameters),lowerEntry:steadyMap.lowerEntry,
  fixed:steadyMap.fixed,domain:steadyMap.domain,rates:steadyMap.rates,
  config:{nu:parameters.nu,horizon:parameters.horizon,mode:parameters.mode,pulse:parameters.pulse},
  steadyMap:{referenceFlux:steadyMap.referenceFlux,bCeiling:steadyMap.bCeiling,lowerEntry:steadyMap.lowerEntry},
  units:"payload*h/cell",method:"Normalized cascade matrix exponential; scaling and squaring with 18 Taylor terms at infinity norm <= 0.5; pulse input split into on/off propagation.",
  comparisonTolerance:"Relative AUC tolerance 1e-10 for numerical tie classification; not biological equivalence.",
  interpretation:`Cytosolic payload AUC from 0 to ${parameters.horizon} h under ${parameters.mode==="pulse"?`a ${parameters.pulse} h prescribed-entry pulse`:"continuous prescribed entry"}. This is finite-time molecular exposure, not efficacy.`,
  boundaryMethod:"Marching-square edge interpolation in transformed grid coordinates; approximate AUC equality contour, not an analytical boundary."};
 // Shared exit-rate sums have identical normalized time dependence; cache within this map only.
 const cache=new Map();
 map.cells=steadyMap.cells.map(s=>{
  if(!s.valid)return {...s,auc:null,steadyRatio:null,steadyClassification:null,lateAdvantage:false};
  const total=s.proc+s.lossIntact;
  let kernel=cache.get(total);
  if(kernel===undefined){
   // Unit processing-success fraction isolates normalized temporal response.
   kernel=finiteDeliveryAUC({...map.fixed.B,proc:total,lossIntact:0},map.config);
   cache.set(total,kernel);
  }
  const auc=kernel*s.fProcess,delta=auc-map.referenceAUC,tol=1e-10*Math.max(auc,map.referenceAUC);
  const classification=Math.abs(delta)<=tol?"tie":delta>0?"above":"below";
  return {proc:s.proc,lossIntact:s.lossIntact,valid:true,fProcess:s.fProcess,auc,ratio:deliveryRatio(auc,map.referenceAUC),
   classification,lowerEntryAdvantage:map.lowerEntry&&classification==="above",
   steadyRatio:s.ratio,steadyClassification:s.classification,lateAdvantage:s.lowerEntryAdvantage&&classification==="below"};
 });
 map.current=aucLossPoint(map,parameters.B.proc,parameters.B.lossIntact);
 map.contours=[];
 const n=map.rates.length;
 if(map.referenceAUC>0)for(let j=0;j<n-1;j++)for(let i=0;i<n-1;i++){
  const corners=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]];
  const cells=corners.map(([x,y])=>map.cells[y*n+x]);
  if(cells.some(c=>!c.valid))continue;
  const hits=[];
  for(let k=0;k<4;k++){
   const q=(k+1)%4,a=cells[k].auc-map.referenceAUC,b=cells[q].auc-map.referenceAUC;
   if((a<0&&b>=0)||(a>=0&&b<0)){
    const t=a/(a-b),[x,y]=corners[k],[xx,yy]=corners[q];
    hits.push({u:(x+t*(xx-x))/(n-1),v:(y+t*(yy-y))/(n-1)});
   }
  }
  if(hits.length===2)map.contours.push(hits);
 }
 map.regime=map.cells.some(c=>c.valid&&c.classification==="above")
  ?map.cells.some(c=>c.valid&&c.classification==="below")?"mixed":"above-with-possible-ties"
  :map.cells.some(c=>c.valid&&c.classification==="below")?"below-with-possible-ties":"all-tie";
 return map;
}
export function aucLossCSV(map){
 const keys=["proc","lossIntact","valid","classification","auc","ratio","lowerEntryAdvantage","steadyRatio","steadyClassification","lateAdvantage"];
 return ["# Rates in h^-1; cytosolic AUC in payload*h/cell",
  `# Horizon=${map.config.horizon} h; mode=${map.config.mode}; pulse=${map.config.pulse} h; fixed A AUC=${map.referenceAUC}`,
  "# Retain full JSON for all fixed parameters; steady comparisons are counterfactual in pulse mode",
  keys.join(","),...map.cells.map(p=>keys.map(k=>p[k]??"").join(","))].join("\n");
}
export function deliveryReasoning(parameters,A,B){
 const {nu}=parameters,a=parameters.A,b=parameters.B;
 const factors={entry:deliveryRatio(b.J,a.J),routing:deliveryRatio(B.steady.fRoute,A.steady.fRoute),
  processing:deliveryRatio(B.steady.fProcess,A.steady.fProcess),
  escape:deliveryRatio(B.steady.fEscape,A.steady.fEscape),retention:a.lossC/b.lossC};
 const bEfficiency=nu*B.steady.productiveFraction;
 const entryTie=bEfficiency>0?A.steady.activeFlux/bEfficiency:null;
 const boundary={entryTie,units:"ADC/cell/h",bEfficiency,lowerEntryWindow:entryTie!==null&&entryTie<a.J,
  status:bEfficiency===0?"blocked":A.steady.activeFlux===0?"zero-reference":"finite",
  interpretation:"Vary only B entry; hold A and both cases' rates and yield fixed. Equality ties constant-input steady arrival, not finite-time exposure."};
 // A sufficient structural match, not a general identifiability or equivalence test.
 const signature=p=>({endosomalExit:p.lys+p.rec,intactLysosomalExit:p.proc+p.lossIntact,payloadExit:p.esc+p.lossL,cytosolicExit:p.lossC,
  numerator:nu*p.lys*p.proc*p.esc});
 const sa=signature(a),sb=signature(b);
 const matched=Object.keys(sa).every(k=>sa[k]===sb[k])&&a.J===b.J&&sa.numerator>0&&a.J>0;
 const distinct=DELIVERY_KEYS.some(k=>a[k]!==b[k]);
 return {factors,boundary,observability:{signatureA:sa,signatureB:sb,matchedTransferAndInput:matched,
  distinctParameters:distinct,hiddenMechanismMatch:matched&&distinct,
  scope:"Exact matching of named exit rates, transfer numerator and input amplitude is sufficient here. Failure to match does not prove parameters identifiable. Shared input schedule and zero initial states are assumed."}};
}
export function deliveryExposureAudit(parameters,A,B){
 const duration=parameters.mode==="pulse"?parameters.pulse:parameters.horizon;
 function one(p,trace){
  const s=trace.steady,r=trace.final;
  const eventualAUC=s.activeFlux*duration/p.lossC;
  const auc=finiteDeliveryAUC(p,parameters);
  // Prospective AUC of material present at T, assuming no additional entry.
  const remainingByState={
   E:parameters.nu*s.productiveFraction*r.E/p.lossC,
   L:parameters.nu*s.fProcess*s.fEscape*r.L/p.lossC,
   Plys:s.fEscape*r.Plys/p.lossC,
   Pcyt:r.Pcyt/p.lossC
  };
  const remainingAUC=Object.values(remainingByState).reduce((x,y)=>x+y,0);
  const routeExists=s.productiveFraction>0;
  return {entered:p.J*duration,eventualAUC,auc,
   windowFraction:eventualAUC>0?auc/eventualAUC:null,
   remainingAUC,remainingByState,
   ledgerRelativeResidual:Math.abs(auc+remainingAUC-eventualAUC)/Math.max(1,eventualAUC),
   conditionalArrivalMean:routeExists?1/(p.lys+p.rec)+1/(p.proc+p.lossIntact)+1/(p.esc+p.lossL):null,
   cytosolicResidence:1/p.lossC,
   processingElasticity:s.activeFlux>0?p.lossIntact/(p.proc+p.lossIntact):null};
 }
 const a=one(parameters.A,A),b=one(parameters.B,B);
 const f=deliveryReasoning(parameters,A,B).factors;
 const windowFactor=a.windowFraction!==null&&b.windowFraction!==null?deliveryRatio(b.windowFraction,a.windowFraction):null;
 const factors={...f,window:windowFactor};
 const factorizedRatio=Object.values(factors).every(x=>x!==null)?Object.values(factors).reduce((x,y)=>x*y,1):null;
 return {A:a,B:b,inputDuration:duration,factors,factorizedRatio,
  cohortPotentialRatio:deliveryRatio(b.eventualAUC,a.eventualAUC),
  aucRatio:deliveryRatio(b.auc,a.auc),
  units:{auc:"payload*h/cell",time:"h",entered:"ADC/cell",windowFraction:"dimensionless",processingElasticity:"dimensionless"},
  scope:"Current simulated cases, not transient map inspections. Eventual AUC concerns only material entered by T, with zero subsequent entry and unchanged rates. Window fraction is realized AUC / that eventual AUC, not fraction delivered or target engagement. Conditional arrival mean concerns successful trajectories after entry, not a crossover time. Elasticity is local steady arrival sensitivity to processing alone, not finite-time AUC sensitivity."};
}
export function runDelivery(raw,options={}){
 const parameters=validateDelivery(raw);
 const A=simulateDelivery(parameters.A,parameters,options),B=simulateDelivery(parameters.B,parameters,options);
 const ratios={entry:deliveryRatio(parameters.B.J,parameters.A.J),activeSteady:deliveryRatio(B.steady.activeFlux,A.steady.activeFlux),
  activeAtEnd:deliveryRatio(B.final.activeFlux,A.final.activeFlux),auc:deliveryRatio(B.final.auc,A.final.auc),
  cytosolicAtEnd:deliveryRatio(B.final.Pcyt,A.final.Pcyt)};
 const isReversal=parameters.B.J<parameters.A.J&&B.steady.activeFlux>A.steady.activeFlux;
 const steadyMap=processingLossMap(parameters);
 return {schema:"productive-delivery/0.2",version:DELIVERY_VERSION,calculationRevision:DELIVERY_REVISION,created:new Date().toISOString(),
  parameters,A,B,ratios,isSteadyReversal:isReversal,reasoning:deliveryReasoning(parameters,A,B),
  exposureAudit:deliveryExposureAudit(parameters,A,B),
  profileAudit:deliveryProfileAudit(parameters,A,B),
  processingLossMap:steadyMap,aucLossMap:aucLossMap(parameters,steadyMap),
  units:{t:"h",E:"ADC/cell",L:"ADC/cell",retainedIntact:"ADC/cell",Plys:"payload/cell",Pcyt:"payload/cell",
   activeFlux:"payload/cell/h",auc:"payload*h/cell",uptake:"ADC/cell",recycled:"ADC/cell",
   lysosomalLoss:"payload/cell",cytosolicLoss:"payload/cell",activeArrivals:"payload/cell",massResidual:"payload/cell",
   intactLoss:"ADC equivalents/cell",intactLossFlux:"ADC equivalents/cell/h",processingFlux:"ADC/cell/h",lysosomalResidence:"h",firstMoment:"payload*h^2/cell"},
  steadyInterpretation:parameters.mode==="pulse"?"Counterfactual continuous-input reference, not the steady state of this pulse experiment.":"Constant-input steady reference; finite-time values may not have reached it.",
  solver:{method:"RK4",stepFactor:options.stepFactor??.025,nodes:options.nodes??401,pulseBoundary:"Exact split at input cessation",initialState:"All compartments and cumulative quantities zero"},
  limitations:[
   "Entirely synthetic parameters; not fitted or validated against a therapeutic dataset.",
   "Entry flux is prescribed internalized ADC, not administered dose, affinity, receptor abundance or fluorescence.",
   "Returned material exits this accounting domain; no rebinding or reinternalization is modeled.",
   "Linear first-order transport; no saturation, cell division, target binding, spatial transfer, resistance, PK or cell killing.",
   "The transport core assumes Pcyt is active unbound cytosolic payload and computes no target occupancy or efficacy. A separate optional PD hypothesis may be attached; it is not an efficacy prediction.",
   "Competing intact-lysosomal loss is an irreversible nonproductive sink in ADC equivalents, not active-payload release. Downstream sink products are not modeled; setting this rate to zero recovers the sole-processing-exit model.",
   "Two synthetic cases need not represent different constructs; they can represent different cellular processing environments.",
   "Per-cell molecular stocks, input fluxes, cumulative delivery and AUC are distinct quantities; stocks here are not molar concentrations."
  ]};
}
export function deliveryCSV(report){
 const keys=Object.keys(report.A.rows[0]);
 return ["case,"+keys.join(","),...["A","B"].flatMap(pop=>report[pop].rows.map(r=>pop+","+keys.map(k=>r[k]).join(",")))].join("\n");
}
