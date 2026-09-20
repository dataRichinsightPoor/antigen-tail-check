import {validateDelivery,finiteDeliveryAUC} from "./delivery-model.js";
import {pdInterpretation} from "./delivery-pd-audit.js";
// Original hypothetical PD overlay. No fitted target, payload or efficacy mapping.
export const PD_REVISION="pd-2";
export const PD_FIELDS={
 halfAmount:["Effective half-engagement amount K · payload/cell",.01,1e6],
 off:["Effective disengagement b · h⁻¹",.001,10],
 formation:["Signal formation s · arbitrary units/h",0,10],
 repair:["Signal recovery r · h⁻¹",0,10]
};
export function pdPreset(id="default"){
 const p={halfAmount:.5,off:1,formation:1,repair:.2};
 if(id==="slow")p.off=.02;
 else if(id==="norepair")p.repair=0;
 else if(id==="fastrepair")p.repair=1;
 else if(id!=="default")throw Error("Unknown PD hypothesis.");
 return p;
}
export function validatePD(raw){
 const p={};
 for(const [k,[name,lo,hi]]of Object.entries(PD_FIELDS)){
  const v=raw?.[k];if(!Number.isFinite(v)||v<lo||v>hi)throw Error(`${name}: use a finite value from ${lo} to ${hi}.`);
  p[k]=v;
 }
 return p;
}
// y = E,L,Plys,Pcyt,O,integral(O),integral(Oeq),D,Dlinear,Deq,recovered,Q.
function pdDerivative(y,p,c,pd,J){
 const [E,L,Pl,P,O]=y,q=P/pd.halfAmount,eq=q/(1+q);
 return [J-(p.lys+p.rec)*E,p.lys*E-(p.proc+p.lossIntact)*L,
  c.nu*p.proc*L-(p.esc+p.lossL)*Pl,p.esc*Pl-p.lossC*P,
  pd.off*(q*(1-O)-O),O,eq,
  pd.formation*O-pd.repair*y[7],
  pd.formation*q-pd.repair*y[8],
  pd.formation*eq-pd.repair*y[9],pd.repair*y[7],P];
}
function pdRK4(y,dt,p,c,pd,J){
 const f=z=>pdDerivative(z,p,c,pd,J),a=f(y),b=f(y.map((v,i)=>v+dt*a[i]/2)),
  d=f(y.map((v,i)=>v+dt*b[i]/2)),e=f(y.map((v,i)=>v+dt*d[i]));
 return y.map((v,i)=>v+dt*(a[i]+2*b[i]+2*d[i]+e[i])/6);
}
export function simulatePD(p,config,pd,peakBound,{stepFactor=.025,nodes=401,maxSteps=500000}={}){
 if(!(stepFactor>0&&stepFactor<=.05)||!Number.isInteger(nodes)||nodes<2||nodes>2001)throw Error("Unsupported PD solver settings.");
 if(!Number.isFinite(peakBound)||peakBound<0)throw Error("A finite nonnegative exposure peak bound is required.");
 const fastest=Math.max(p.lys+p.rec,p.proc+p.lossIntact,p.esc+p.lossL,p.lossC,pd.repair,pd.off*(1+peakBound/pd.halfAmount));
 const dtMax=Math.min(config.horizon/(nodes-1),stepFactor/fastest);
 if(Math.ceil(config.horizon/dtMax)+nodes>maxSteps)throw Error("PD rate/exposure combination exceeds the supported solver budget. Increase K, reduce disengagement speed, or shorten the window; no approximate result was substituted.");
 let y=Array(12).fill(0),t=0,steps=0,peakO=0,peakD=0,peakTimeD=null,maxResidual=0;
 const rows=[];
 for(let i=0;i<nodes;i++){
  const target=config.horizon*i/(nodes-1);
  while(t<target-1e-12){
   const on=config.mode==="continuous"||t<config.pulse-1e-12;
   const dt=Math.min(dtMax,target-t,config.mode==="pulse"&&on?config.pulse-t:Infinity);
   y=pdRK4(y,dt,p,config,pd,on?p.J:0);t+=dt;steps++;
   if(steps>maxSteps)throw Error("PD solver budget exceeded.");
   if(y.some(v=>!Number.isFinite(v)||v< -1e-9)||y[4]>1+1e-9)throw Error("PD numerical integrity check failed.");
   if(y[4]>peakO)peakO=y[4];
   if(y[7]>peakD){peakD=y[7];peakTimeD=t;}
  }
  const [E,L,Pl,P,O,engagementAUC,equilibriumAUC,D,Dlinear,Deq,recovered,Q]=y;
  const residual=Math.abs(D+recovered-pd.formation*engagementAUC)/Math.max(1,pd.formation*engagementAUC);
  maxResidual=Math.max(maxResidual,residual);
  rows.push({t:target,Pcyt:P,engagement:O,equilibriumEngagement:P/(pd.halfAmount+P),
   engagementAUC,equilibriumAUC,signal:D,linearSignal:Dlinear,equilibriumSignal:Deq,recovered,auc:Q});
 }
 if(maxResidual>1e-8)throw Error("PD formation/recovery ledger did not close.");
 const last=rows.at(-1);
 return {rows,final:last,peakEngagement:peakO,peakSignal:peakD,peakSignalTime:peakTimeD,
  linearNoRecovery:pd.formation*finiteDeliveryAUC(p,config)/pd.halfAmount,
  noRecoverySignal:pd.formation*last.engagementAUC,
  retainedFraction:pd.formation*last.engagementAUC>0?last.signal/(pd.formation*last.engagementAUC):null,
  diagnostics:{steps,dtMax,maxLedgerRelativeResidual:maxResidual}};
}
export function runPD(report,raw,options={}){
 const parameters=validatePD(raw),deliveryParameters=validateDelivery(report.parameters);
 const A=simulatePD(deliveryParameters.A,deliveryParameters,parameters,report.profileAudit.A.peak,options);
 const B=simulatePD(deliveryParameters.B,deliveryParameters,parameters,report.profileAudit.B.peak,options);
 const ratio=(b,a)=>a>0?b/a:null;
 return {schema:"hypothetical-pd/0.1",revision:PD_REVISION,created:new Date().toISOString(),
  deliveryRevision:report.calculationRevision,deliveryParameters,parameters,A,B,
  interpretation:pdInterpretation(A,B,parameters),
  ratios:{exposure:report.profileAudit.aucRatio,linearNoRecovery:ratio(B.linearNoRecovery,A.linearNoRecovery),
   equilibriumAUC:ratio(B.final.equilibriumAUC,A.final.equilibriumAUC),
   engagementAUC:ratio(B.final.engagementAUC,A.final.engagementAUC),endpointSignal:ratio(B.final.signal,A.final.signal),
   peakSignal:ratio(B.peakSignal,A.peakSignal)},
  units:{t:"h",Pcyt:"payload/cell",engagement:"fraction",equilibriumEngagement:"fraction",
   engagementAUC:"h",equilibriumAUC:"h",signal:"arbitrary units",linearSignal:"arbitrary units",
   equilibriumSignal:"arbitrary units",recovered:"arbitrary units",auc:"payload*h/cell"},
  parameterUnits:{halfAmount:"payload/cell",off:"1/h",formation:"arbitrary units/h",repair:"1/h"},
  method:"Coupled RK4 on the four transport states and PD states, with exact input-switch splitting. No interpolation of the 401-point exposure trace. Peak signal is resolved on internal steps, not analytically optimized.",
  assumptions:[
   "Both cases share the same hypothetical PD parameters and begin with zero engagement and zero excess signal.",
   "Pcyt is prescribed free, target-accessible payload amount. Binding does not deplete or alter it; target sequestration and feedback are neglected.",
   "K is an effective amount scale, not a molar Kd or fitted EC50. Connecting it to affinity requires validated species and volume mapping.",
   "O'=b[(P/K)(1-O)-O] describes saturable engagement of a fixed target pool; b is effective disengagement. At fixed K, changing b changes both effective association b/K and disengagement, not affinity alone.",
   "D'=sO-rD is an arbitrary excess downstream signal with linear formation and recovery. D is not occupancy, DNA damage counts, viability, tumor response or clinical efficacy.",
   "Target turnover is not separately estimated. Interpreting b as including replacement requires a constant pool replenished unengaged. Spatial effects, stochastic molecule counts, repair saturation and cell-state dependence are absent."
  ]};
}
export function pdCSV(r){
 const keys=Object.keys(r.A.rows[0]);
 return [`# Hypothetical PD ${r.revision}; retain full JSON for all inputs and limitations`,
  `# K=${r.parameters.halfAmount} payload/cell; b=${r.parameters.off} /h; s=${r.parameters.formation} AU/h; r=${r.parameters.repair} /h; T=${r.deliveryParameters.horizon} h`,
  "# t=h; engagement/equilibriumEngagement=fraction; engagementAUC/equilibriumAUC=h; signal/linearSignal/equilibriumSignal/recovered=arbitrary units; Pcyt=payload/cell; auc=payload*h/cell",
  "case,"+keys.join(","),...["A","B"].flatMap(pop=>r[pop].rows.map(v=>pop+","+keys.map(k=>v[k]).join(",")))].join("\n");
}
