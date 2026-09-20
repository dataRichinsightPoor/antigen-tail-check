import test from "node:test";
import assert from "node:assert/strict";
import {runDelivery,deliveryPreset} from "../web/delivery-model.js";
import {runPD,pdPreset} from "../web/delivery-pd-model.js";
import {pdInterpretation} from "../web/delivery-pd-audit.js";
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const report=runDelivery(deliveryPreset("equalauc")),p=pdPreset(),d=runPD(report,p);
test("PD interpretation: exact factorization recovers endpoint under every hypothesis",()=>{
 for(const preset of ["default","slow","norepair","fastrepair"]){
  const r=runPD(report,pdPreset(preset)),x=r.interpretation;
  near(x.product,r.ratios.endpointSignal);
  for(const pop of ["A","B"]){
   near(x[pop].reconstructedSignal,r[pop].final.signal);
   assert.ok(x[pop].saturation>=0&&x[pop].saturation<=1);
   assert.ok(x[pop].retention>=0&&x[pop].retention<=1+1e-10);
  }
 }
 near(d.interpretation.ratios.saturation,2.325495779);
 assert.ok(d.interpretation.ratios.kinetics<1);
 assert.ok(d.interpretation.ratios.retention>9);
});
test("PD interpretation: integrated engagement accounting agrees with independent overlap quadrature",()=>{
 const r=runPD(report,p,{nodes:2001});
 for(const pop of ["A","B"]){
  const x=r.interpretation[pop].engagementAccounting,rows=r[pop].rows;
  let overlap=0;
  for(let i=1;i<rows.length;i++){
   const a=rows[i-1],b=rows[i];overlap+=(b.t-a.t)*(a.Pcyt*a.engagement+b.Pcyt*b.engagement)/2;
  }
  near(x.occupiedTargetOverlap,overlap,2e-5);
  near(x.exposure,x.engagedArea+x.terminal+x.occupiedTargetOverlap);
  assert.ok(x.engagedArea<=x.exposure+1e-8);assert.ok(x.terminal>=0);
 }
 assert.ok(d.interpretation.A.kinetics>1); // not bounded "efficiency"
 assert.ok(d.interpretation.A.saturation*d.interpretation.A.kinetics<=1);
});
test("PD interpretation: default readout reversal is sampled, not mislabeled as an exact root",()=>{
 const c=d.interpretation.clock;assert.equal(c.brackets.length,1);
 const x=c.brackets[0];near(x.lowerTime,8.7);near(x.upperTime,8.76);
 assert.equal(x.from,"A");assert.equal(x.to,"B");
 assert.equal(c.classes[0].rank,"unresolved");assert.equal(c.classes[400].rank,"B");
 assert.ok(c.classes[x.lowerIndex].delta<0&&c.classes[x.upperIndex].delta>0);
 assert.match(c.scope,/not refined roots/);
});
test("PD interpretation: zero exposure or zero formation cannot manufacture normalized advantages",()=>{
 const z=runPD(report,{...p,formation:0});
 assert.equal(z.interpretation.product,null);assert.equal(z.interpretation.A.retention,null);
 assert.equal(z.interpretation.clock.brackets.length,0);
 assert.ok(z.interpretation.clock.classes.every(x=>x.rank==="unresolved"));
 const c=deliveryPreset();c.A.J=c.B.J=0;
 const q=runPD(runDelivery(c),p);
 assert.equal(q.interpretation.A.saturation,null);assert.equal(q.interpretation.B.kinetics,null);
 assert.equal(q.interpretation.product,null);
});
test("PD interpretation: common signal formation rescales amounts, not decomposition or ranking",()=>{
 const z=runPD(report,{...p,formation:3});
 for(const key of Object.keys(d.interpretation.ratios))near(z.interpretation.ratios[key],d.interpretation.ratios[key]);
 near(z.A.final.signal,3*d.A.final.signal);
 assert.deepEqual(z.interpretation.clock.brackets,d.interpretation.clock.brackets);
});
test("PD interpretation: clock scanner retains unresolved gaps and multiple transitions honestly",()=>{
 const synthetic=values=>({final:{auc:1,equilibriumAUC:1,engagementAUC:1,engagement:0,signal:1},
  peakSignal:3,rows:values.map((signal,t)=>({t,signal}))});
 const A=synthetic([0,2,2,2,2,2]),B=synthetic([0,1,2,3,2,1]);
 const c=pdInterpretation(A,B,p).clock;
 assert.deepEqual(c.brackets.map(x=>[x.lowerTime,x.upperTime,x.from,x.to]),[[1,3,"A","B"],[3,5,"B","A"]]);
 assert.equal(c.classes[2].rank,"unresolved");assert.equal(c.classes[4].rank,"unresolved");
});
