import test from "node:test";
import assert from "node:assert/strict";
import {deliveryPreset,finiteDeliveryAUC,simulateDelivery,processingLossMap,aucLossMap,aucLossPoint,aucLossCSV} from "../web/delivery-model.js";
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1e-20,Math.abs(b)),`${a} != ${b}`);
test("AUC map: matrix exponential matches independently integrated trajectories across presets",()=>{
 for(const id of ["routing","matched","slow","pulse","ambiguity","competing"]){
  const p=deliveryPreset(id);
  for(const pop of ["A","B"])near(finiteDeliveryAUC(p[pop],p),simulateDelivery(p[pop],p,{stepFactor:.0125}).final.auc);
 }
});
test("AUC map: repeated poles agree with closed-form four-stage Erlang response",()=>{
 const p=deliveryPreset(),q={J:1,lys:1,rec:0,proc:1,lossIntact:0,esc:1,lossL:0,lossC:1};
 const g=t=>t-4+Math.exp(-t)*(4+3*t+t*t+t*t*t/6);
 for(const t of [2,24]){
  p.horizon=t;near(finiteDeliveryAUC(q,p),g(t),1e-11);
  p.mode="pulse";p.pulse=.731;near(finiteDeliveryAUC(q,p),g(t)-g(t-.731),1e-11);p.mode="continuous";
 }
});
test("AUC map: extreme rates, short windows and non-grid pulse switches match RK4",()=>{
 for(const rates of [[.001,.001,.001,.001],[10,20,20,10],[1,.002,2,.001],[.02,1,.02,1]]){
  for(const mode of ["continuous","pulse"]){
   const p=deliveryPreset();p.horizon=mode==="pulse"?168:.25;p.mode=mode;p.pulse=.0137;p.nu=4;
   const q={J:100,lys:rates[0],rec:0,proc:rates[1]/2,lossIntact:rates[1]/2,esc:rates[2]/2,lossL:rates[2]/2,lossC:rates[3]};
   near(finiteDeliveryAUC(q,p),simulateDelivery(q,p,{stepFactor:.0125}).final.auc,2e-7);
  }
 }
});
test("AUC map: grid caching preserves exact inspected calculations and selected samples agree with RK4",()=>{
 const p=deliveryPreset("competing"),m=aucLossMap(p);
 for(let i=0;i<m.cells.length;i+=127){
  const cell=m.cells[i];if(!cell.valid)continue;
  const point=aucLossPoint(m,cell.proc,cell.lossIntact);near(cell.auc,point.auc,1e-11);
  if(i%508===0)near(cell.auc,simulateDelivery({...p.B,proc:cell.proc,lossIntact:cell.lossIntact},p).final.auc,1e-7);
 }
 assert.equal(m.cells.length,6561);assert.ok(m.contours.length>0);
 assert.ok(m.contours.flat().every(p=>p.u>=0&&p.u<=1&&p.v>=0&&p.v<=1));
});
test("AUC map: a steady advantage can fail within the selected window",()=>{
 const p=deliveryPreset("slow"),m=aucLossMap(p),x=m.current;
 assert.equal(x.steadyRatio,2.5);assert.ok(x.ratio<1);assert.equal(x.lateAdvantage,true);
 assert.equal(x.lowerEntryAdvantage,false);
 const slow=x.auc;p.horizon=168;const longer=aucLossMap(p);
 assert.ok(longer.current.auc>slow);assert.ok(longer.current.ratio>1);
 assert.equal(longer.current.lateAdvantage,false);
});
test("AUC map: pulse is the actual finite input, not the continuous counterfactual",()=>{
 const p=deliveryPreset(),continuous=aucLossMap(p);p.mode="pulse";p.pulse=2;const pulse=aucLossMap(p);
 near(pulse.current.auc,25,1e-8);assert.ok(continuous.current.auc>10*pulse.current.auc);
 near(pulse.referenceAUC,10,1e-8);assert.match(pulse.interpretation,/2 h prescribed-entry pulse/);
 assert.equal(pulse.current.steadyRatio,continuous.current.steadyRatio);
 p.pulse=p.horizon;near(aucLossMap(p).current.auc,continuous.current.auc,1e-11);
});
test("AUC map: invalid points, zeros, blocked routes and equal inputs cannot invent an advantage",()=>{
 const p=deliveryPreset();p.A.J=0;let m=aucLossMap(p);
 assert.equal(m.current.ratio,null);assert.equal(m.current.lowerEntryAdvantage,false);
 p.B.J=0;m=aucLossMap(p);assert.equal(m.regime,"all-tie");assert.equal(m.current.auc,0);
 for(const [a,b]of [[0,0],[-1,1],[11,1],[NaN,1]])assert.equal(aucLossPoint(m,a,b).valid,false);
 const q=deliveryPreset();q.B.esc=0;m=aucLossMap(q);assert.equal(m.current.auc,0);
 q.B.esc=1;q.B.J=q.A.J;m=aucLossMap(q);assert.equal(m.current.classification,"above");assert.equal(m.current.lowerEntryAdvantage,false);
 assert.equal(aucLossPoint(m,0,.1).auc,0);
});
test("AUC map: yield scaling, removal sensitivity and metadata distinguish AUC from delivery",()=>{
 const p=deliveryPreset(),base=aucLossMap(p);p.nu=4;const scaled=aucLossMap(p);
 near(scaled.referenceAUC,4*base.referenceAUC);near(scaled.current.auc,4*base.current.auc);near(scaled.current.ratio,base.current.ratio);
 p.B.lossC=.1;const retained=aucLossMap(p);
 assert.ok(retained.current.auc>scaled.current.auc);near(retained.current.steadyRatio,scaled.current.steadyRatio);
 assert.equal(retained.fixed.B.lossC,.1);assert.equal(retained.config.horizon,24);
 assert.match(retained.method,/matrix exponential/);assert.match(retained.boundaryMethod,/approximate/);
 const csv=aucLossCSV(retained).split("\n");assert.equal(csv.length,6565);assert.match(csv[3],/lateAdvantage/);
});
