import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {runDelivery,deliveryPreset,finiteDeliveryPoint} from "../web/delivery-model.js";
import {runPD,pdPreset,validatePD,pdCSV,simulatePD} from "../web/delivery-pd-model.js";
import {PD_WORKER_SOURCE} from "../web/delivery-pd-worker-source.js";
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const r=runDelivery(deliveryPreset("equalauc")), p=pdPreset(), d=runPD(r,p);
test("PD: equal AUC preserves the linear no-recovery control, not nonlinear summaries",()=>{
 near(d.ratios.exposure,1);near(d.A.linearNoRecovery,20);near(d.B.linearNoRecovery,20);
 near(d.ratios.equilibriumAUC,2.325495779);near(d.ratios.engagementAUC,2.151912577);
 near(d.ratios.endpointSignal,20.21830367);
 for(const pop of ["A","B"])for(const row of d[pop].rows){
  assert.ok(row.engagement>=0&&row.engagement<=1);
  near(row.equilibriumEngagement,row.Pcyt/(p.halfAmount+row.Pcyt));
 }
});
test("PD: endpoint advantage does not imply a peak advantage",()=>{
 assert.ok(d.B.final.signal>d.A.final.signal*20);
 assert.ok(d.B.peakSignal<d.A.peakSignal);near(d.B.peakSignal/d.A.peakSignal,.9946913,1e-5);
 assert.ok(d.B.peakSignalTime>d.A.peakSignalTime*2);
 const fast=runPD(r,pdPreset("fastrepair"));
 assert.ok(fast.ratios.endpointSignal>1e5);
 assert.ok(fast.B.peakSignal<fast.A.peakSignal);
});
test("PD: slow engagement reverses integrated ranking without changing equilibrium scale",()=>{
 const slow=runPD(r,pdPreset("slow"));
 near(slow.ratios.equilibriumAUC,d.ratios.equilibriumAUC);
 near(slow.ratios.engagementAUC,.6575929504);near(slow.ratios.endpointSignal,.9870260148);
 assert.ok(slow.A.peakEngagement<d.A.peakEngagement);
});
test("PD: recovery ledger closes and zero recovery recovers integrated formation",()=>{
 for(const settings of [p,pdPreset("norepair"),pdPreset("fastrepair")]){
  const z=runPD(r,settings);
  for(const pop of ["A","B"]){
   near(z[pop].final.engagementAUC,d[pop].final.engagementAUC);
   for(const row of z[pop].rows)near(row.signal+row.recovered,settings.formation*row.engagementAUC);
   assert.ok(z[pop].diagnostics.maxLedgerRelativeResidual<1e-8);
   if(settings.repair===0){
    near(z[pop].final.signal,z[pop].noRecoverySignal);
    near(z[pop].final.linearSignal,z[pop].linearNoRecovery);
    near(z[pop].retainedFraction,1);
   }
  }
 }
});
test("PD: one-way coupling reproduces independently evaluated transport and leaves inputs unchanged",()=>{
 const before=JSON.stringify(r);
 const z=runPD(r,p);
 assert.equal(JSON.stringify(r),before);assert.equal(r.pharmacodynamics,undefined);
 for(const pop of ["A","B"])for(let i=0;i<401;i+=20){
  const row=z[pop].rows[i],exact=finiteDeliveryPoint(r.parameters[pop],r.parameters,row.t);
  near(row.Pcyt,exact.Pcyt);near(row.auc,exact.auc);
 }
});
test("PD: smaller steps converge for controls, histories, ledger and peaks",()=>{
 const fine=runPD(r,p,{stepFactor:.0125});
 for(const pop of ["A","B"]){
  for(let i=0;i<401;i++)for(const key of Object.keys(d[pop].rows[i]))near(d[pop].rows[i][key],fine[pop].rows[i][key]);
  near(d[pop].peakSignal,fine[pop].peakSignal,1e-5);
  near(d[pop].peakEngagement,fine[pop].peakEngagement,1e-5);
  near(d[pop].peakSignalTime,fine[pop].peakSignalTime,.001);
 }
});
test("PD: downstream endpoint agrees with independent weighted-history quadrature",()=>{
 const z=runPD(r,p,{nodes:2001}),T=r.parameters.horizon;
 for(const pop of ["A","B"]){
  const rows=z[pop].rows;
  for(const [drive,out]of [["engagement","signal"],["equilibriumEngagement","equilibriumSignal"],["Pcyt","linearSignal"]]){
   let sum=0;
   for(let i=1;i<rows.length;i++){
    const f=v=>Math.exp(-p.repair*(T-v.t))*v[drive]*p.formation/(drive==="Pcyt"?p.halfAmount:1);
    sum+=(rows[i].t-rows[i-1].t)*(f(rows[i])+f(rows[i-1]))/2;
   }
   near(sum,z[pop].final[out],2e-6);
  }
 }
});
test("PD: sustained constant input approaches analytical equilibrium and signal steady state",()=>{
 const c=deliveryPreset("routing");c.horizon=168;
 const q=runPD(runDelivery(c),p);
 for(const pop of ["A","B"]){
  const P=q[pop].final.Pcyt,eq=P/(p.halfAmount+P);
  near(q[pop].final.engagement,eq);near(q[pop].final.signal,p.formation*eq/p.repair);
 }
});
test("PD: zero input and zero formation preserve undefined ratios rather than inventing effects",()=>{
 const c=deliveryPreset();c.A.J=c.B.J=0;
 const z=runPD(runDelivery(c),p);
 assert.equal(z.ratios.endpointSignal,null);assert.equal(z.A.retainedFraction,null);
 for(const pop of ["A","B"])for(const row of z[pop].rows)for(const [k,v]of Object.entries(row))if(k!=="t")near(v,0);
 const no=runPD(r,{...p,formation:0});
 assert.equal(no.ratios.endpointSignal,null);assert.equal(no.B.retainedFraction,null);
 near(no.A.final.signal,0);near(no.B.final.signal,0);assert.ok(no.B.final.engagementAUC>0);
 assert.equal(no.A.peakSignalTime,null);
});
test("PD: validation and solver-budget boundaries reject unsupported calculations explicitly",()=>{
 for(const [key,bad]of [["halfAmount",0],["halfAmount",NaN],["off",0],["formation",-1],["repair",Infinity]])
  assert.throws(()=>validatePD({...p,[key]:bad}),/finite value/);
 assert.throws(()=>pdPreset("missing"),/Unknown/);
 assert.throws(()=>runPD(r,p,{nodes:1}),/settings/);
 assert.throws(()=>runPD(r,p,{maxSteps:10}),/budget/);
 assert.throws(()=>simulatePD(r.parameters.A,r.parameters,p,-1),/peak bound/);
});
test("PD: generated worker agrees with direct core and exports preserve assumptions and units",()=>{
 let message;const self={postMessage:x=>message=x};
 vm.runInNewContext(PD_WORKER_SOURCE,{self,structuredClone});
 self.onmessage({data:{id:9,report:r,parameters:p}});
 assert.equal(message.id,9);
 const actual=JSON.parse(JSON.stringify(message.result)),expected=structuredClone(d);
 delete actual.created;delete expected.created;assert.deepEqual(actual,expected);
 const csv=pdCSV(d);
 assert.equal(csv.split("\n").length,806);assert.ok(csv.includes("equilibriumSignal"));
 assert.equal(d.deliveryRevision,"delivery-9");
 assert.ok(d.assumptions.some(x=>x.includes("not occupancy")));
 self.onmessage({data:{id:10,report:r,parameters:{...p,halfAmount:0}}});
 assert.match(message.error,/finite value/);
});
