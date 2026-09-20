import test from "node:test";
import assert from "node:assert/strict";
import {deliveryPreset,deliverySteady,runDelivery,processingLossMap,processingLossPoint,processingLossCSV,lossMapPosition,lossMapRate} from "../web/delivery-model.js";
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test("map: default and competing-loss boundaries have exact analytical slopes",()=>{
 for(const [id,slope]of [["routing",1.5],["competing",1.75]]){
  const m=processingLossMap(deliveryPreset(id));near(m.boundarySlope,slope);assert.equal(m.lowerEntry,true);
  for(const proc of [.001,.02,.1,1]){
   assert.equal(processingLossPoint(m,proc,slope*proc).classification,"tie");
   assert.equal(processingLossPoint(m,proc,.99*slope*proc).lowerEntryAdvantage,true);
   assert.equal(processingLossPoint(m,proc,1.01*slope*proc).classification,"below");
  }
 }
});
test("map: every valid grid node agrees with direct steady-state calculation",()=>{
 for(const id of ["routing","competing","matched","ambiguity","pulse"]){
  const p=deliveryPreset(id),m=processingLossMap(p);
  assert.equal(m.cells.length,81*81);assert.equal(m.rates[0],0);assert.equal(m.rates.at(-1),10);
  for(const cell of m.cells)if(cell.valid){
   const s=deliverySteady({...p.B,proc:cell.proc,lossIntact:cell.lossIntact},p.nu);
   near(cell.activeFlux,s.activeFlux);
   if(m.referenceFlux>0)near(cell.ratio,s.activeFlux/m.referenceFlux);
  }
 }
});
test("map: coordinate transform round trips zero and the supported domain",()=>{
 for(const k of [0,.0002,.001,.02,.2,2,10])near(lossMapRate(lossMapPosition(k)),k);
 const m=processingLossMap(deliveryPreset());
 for(const [a,b]of [[0,0],[.0004,.0004],[-1,1],[11,1],[NaN,1],[1,Infinity]])assert.equal(processingLossPoint(m,a,b).valid,false);
 assert.equal(processingLossPoint(m,0,.001).valid,true);assert.equal(processingLossPoint(m,.001,0).valid,true);
 assert.throws(()=>processingLossMap(deliveryPreset(),1));
});
test("map: zero references, blocked ceilings and no strict advantage are explicit",()=>{
 const p=deliveryPreset();p.A.J=0;let m=processingLossMap(p);
 assert.equal(m.regime,"zero-reference");assert.equal(m.current.ratio,null);
 assert.equal(m.current.classification,"above");assert.equal(m.lowerEntry,false);
 p.B.J=0;m=processingLossMap(p);assert.equal(m.regime,"all-zero");assert.equal(m.current.classification,"tie");
 const q=deliveryPreset();q.B.esc=0;m=processingLossMap(q);assert.equal(m.regime,"no-advantage");
 assert.ok(m.cells.every(c=>!c.valid||c.classification==="below"));
 const z=deliveryPreset("matched");z.B.J=z.A.J;m=processingLossMap(z);
 assert.equal(m.regime,"ceiling-tie");assert.equal(processingLossPoint(m,1,0).classification,"tie");
 assert.equal(processingLossPoint(m,1,.1).classification,"below");
});
test("map: above-reference classification never implies lower entry when B entry is equal or higher",()=>{
 const p=deliveryPreset();p.B.J=100;let m=processingLossMap(p);
 assert.equal(m.current.classification,"above");assert.equal(m.current.lowerEntryAdvantage,false);
 p.B.J=200;m=processingLossMap(p);assert.equal(m.lowerEntry,false);assert.equal(m.current.lowerEntryAdvantage,false);
});
test("map: common rate scaling preserves steady arrival but not finite-time trajectories",()=>{
 const p=deliveryPreset("competing"),m=processingLossMap(p);
 near(processingLossPoint(m,.02,.2).ratio,processingLossPoint(m,.2,2).ratio);
 const a=runDelivery(p);p.B.proc=.2;p.B.lossIntact=2;const b=runDelivery(p);
 near(a.B.steady.activeFlux,b.B.steady.activeFlux);assert.ok(b.B.final.auc>a.B.final.auc);
});
test("map: export grid has complete fixed-input provenance and counterfactual labeling",()=>{
 const p=deliveryPreset("pulse"),r=runDelivery(p),m=r.processingLossMap;
 assert.match(m.interpretation,/counterfactual/);assert.deepEqual(m.fixed.A,p.A);
 assert.equal(m.fixed.B.J,p.B.J);assert.equal(m.fixed.nu,p.nu);
 const csv=processingLossCSV(m).split("\n");assert.equal(csv.length,6565);
 assert.match(csv[3],/classification/);assert.match(csv[4],/unsupported/);
 near(m.current.activeFlux,r.B.steady.activeFlux);near(m.current.ratio,r.ratios.activeSteady);
});
