import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {deliveryPreset,validateDelivery,deliverySteady,runDelivery,deliveryCSV,simulateDelivery} from "../web/delivery-model.js";
import {DELIVERY_WORKER_SOURCE} from "../web/delivery-worker-source.js";
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} differs from ${b}`);

test("delivery: analytic steady balances and lower-entry reversal",()=>{
 const p=deliveryPreset(),r=runDelivery(p);
 near(r.A.steady.activeFlux,5);near(r.B.steady.activeFlux,12.5);near(r.ratios.activeSteady,2.5);
 near(r.A.steady.retainedIntact,15);near(r.B.steady.retainedIntact,37.5);
 assert.equal(r.isSteadyReversal,true);
 for(const pop of ["A","B"]){
  const x=p[pop],s=r[pop].steady;
  near(x.J-(x.lys+x.rec)*s.E,0);near(x.lys*s.E-(x.proc+x.lossIntact)*s.L,0);
  near(p.nu*x.proc*s.L-(x.esc+x.lossL)*s.Plys,0);near(x.esc*s.Plys-x.lossC*s.Pcyt,0);
  for(const k of ["E","L","Plys","Pcyt","activeFlux"])near(r[pop].final[k],s[k],1e-7);
 }
});
test("delivery: all presets conserve payload equivalents with nonnegative finite states",()=>{
 for(const id of ["routing","matched","slow","pulse","ambiguity","competing"]){
  const p=deliveryPreset(id);p.nu=4;
  const r=runDelivery(p);
  for(const pop of ["A","B"]){
   assert.ok(r[pop].diagnostics.maxMassRelativeResidual<1e-10);
   for(const row of r[pop].rows){
    assert.ok(Object.values(row).every(Number.isFinite));
    for(const [k,v]of Object.entries(row))if(k!=="massResidual")assert.ok(v>=-1e-10);
    near(row.activeArrivals,row.Pcyt+row.cytosolicLoss);
   }
  }
 }
});
test("delivery: matched-routing control scales every state and flux at every time",()=>{
 const r=runDelivery(deliveryPreset("matched"));
 for(let i=0;i<r.A.rows.length;i++)for(const k of Object.keys(r.A.rows[i]))
  if(!["t","massResidual"].includes(k))near(r.B.rows[i][k],.5*r.A.rows[i][k]);
 near(r.ratios.auc,.5);assert.equal(r.isSteadyReversal,false);
});
test("delivery: slow processing reverses finite-time ranking, not steady throughput",()=>{
 const r=runDelivery(deliveryPreset("slow"));
 near(r.ratios.activeSteady,2.5);
 assert.ok(r.ratios.activeAtEnd<1);assert.ok(r.ratios.auc<1);
 assert.ok(r.B.final.retainedIntact>r.A.final.retainedIntact);
});
test("delivery: processing changes inventory but cancels from flux with zero intact loss",()=>{
 const p=deliveryPreset(),base=deliverySteady(p.B,p.nu),slow=deliverySteady({...p.B,proc:.02},p.nu);
 near(slow.L,100*base.L);near(slow.activeFlux,base.activeFlux);near(slow.Pcyt,base.Pcyt);
});
test("delivery: non-grid pulse cessation integrates the exact prescribed input",()=>{
 const p=deliveryPreset("pulse");p.pulse=1.337;p.horizon=24;
 const r=runDelivery(p);
 for(const pop of ["A","B"]){
  near(r[pop].final.uptake,p[pop].J*p.pulse,1e-10);
  assert.ok(r[pop].final.Pcyt<1e-7);
  near(r[pop].final.activeArrivals,r[pop].steady.activeFlux*p.pulse,1e-7);
 }
 assert.match(r.steadyInterpretation,/Counterfactual/);
});
test("delivery: zero input has zero states and undefined rather than infinite ratios",()=>{
 const p=deliveryPreset();p.A.J=0;p.B.J=0;const r=runDelivery(p);
 for(const pop of ["A","B"])for(const row of r[pop].rows)for(const[k,v]of Object.entries(row))if(k!=="t")near(v,0);
 for(const v of Object.values(r.ratios))assert.equal(v,null);
});
test("delivery: blocked escape and blocked routing do not invent delivery",()=>{
 for(const key of ["esc","lys"]){
  const p=deliveryPreset();p.A[key]=0;p.B[key]=0;const r=runDelivery(p);
  for(const pop of ["A","B"]){near(r[pop].final.Pcyt,0);near(r[pop].final.auc,0);near(r[pop].steady.activeFlux,0);}
 }
});
test("delivery: yield scales payload but not ADC bookkeeping",()=>{
 const p=deliveryPreset("competing"),base=runDelivery(p);p.nu=4;const high=runDelivery(p);
 for(const pop of ["A","B"])for(let i=0;i<401;i++){
  for(const key of ["E","L","retainedIntact","uptake","recycled","intactLoss","intactLossFlux","processingFlux"])near(high[pop].rows[i][key],base[pop].rows[i][key]);
  for(const key of ["Plys","Pcyt","activeFlux","activeArrivals","auc","lysosomalLoss","cytosolicLoss"])near(high[pop].rows[i][key],4*base[pop].rows[i][key]);
 }
});
test("delivery: halving solver step agrees throughout all six trajectories",()=>{
 for(const id of ["routing","matched","slow","pulse","ambiguity","competing"]){
  const p=deliveryPreset(id),a=runDelivery(p),b=runDelivery(p,{stepFactor:.0125});
  for(const pop of ["A","B"])for(let i=0;i<401;i++)for(const key of ["E","L","Plys","Pcyt","auc","activeFlux","intactLoss"])
   near(a[pop].rows[i][key],b[pop].rows[i][key],1e-7);
 }
});
test("delivery: identical cytosolic time courses conceal distinct routes under continuous and pulse input",()=>{
 for(const mode of ["continuous","pulse"]){
  const p=deliveryPreset("ambiguity");p.mode=mode;p.pulse=1.337;
  const r=runDelivery(p);assert.equal(r.reasoning.observability.hiddenMechanismMatch,true);
  for(let i=0;i<401;i++){
   const a=r.A.rows[i],b=r.B.rows[i];
   for(const key of ["Pcyt","activeFlux","auc","activeArrivals","E"])near(a[key],b[key],1e-10);
   near(b.L,2*a.L,1e-10);near(b.Plys,2*a.Plys,1e-10);near(b.recycled,8*a.recycled/9,1e-10);
  }
  near(r.ratios.activeSteady,1);near(r.ratios.auc,1);
 }
});
test("delivery: arrival and stock factorization do not conflate retention with delivery",()=>{
 const p=deliveryPreset();p.B.lossC=.2;const r=runDelivery(p),f=r.reasoning.factors;
 near(f.entry*f.routing*f.processing*f.escape,r.ratios.activeSteady);near(f.retention,5);
 near(r.B.steady.Pcyt/r.A.steady.Pcyt,r.ratios.activeSteady*f.retention);
 near(r.ratios.activeSteady,2.5);
});
test("delivery: break-even input ties steady arrival and brackets the lower-entry interval",()=>{
 const p=deliveryPreset(),r=runDelivery(p);near(r.reasoning.boundary.entryTie,20);
 assert.equal(r.reasoning.boundary.lowerEntryWindow,true);
 for(const [J,sign]of [[19,-1],[20,0],[21,1]]){
  p.B.J=J;const s=runDelivery(p);near(Math.sign(s.B.steady.activeFlux-s.A.steady.activeFlux),sign);
 }
 const matched=runDelivery(deliveryPreset("matched"));
 near(matched.reasoning.boundary.entryTie,100);assert.equal(matched.reasoning.boundary.lowerEntryWindow,false);
 const pulse=deliveryPreset("pulse");near(runDelivery(pulse).reasoning.boundary.entryTie,20);
});
test("delivery: reasoning reports blocked routes and zero references without invented thresholds",()=>{
 const p=deliveryPreset();p.B.esc=0;let r=runDelivery(p);
 assert.equal(r.reasoning.boundary.status,"blocked");assert.equal(r.reasoning.boundary.entryTie,null);
 p.B.esc=1;p.A.J=0;r=runDelivery(p);
 assert.equal(r.reasoning.boundary.status,"zero-reference");near(r.reasoning.boundary.entryTie,0);
 assert.equal(r.reasoning.factors.entry,null);assert.equal(r.reasoning.observability.hiddenMechanismMatch,false);
});
test("delivery: structural match is a sufficient condition, not a generic identifiability verdict",()=>{
 const p=deliveryPreset("ambiguity");p.B.esc=.6;let r=runDelivery(p);
 assert.equal(r.reasoning.observability.matchedTransferAndInput,false);
 assert.match(r.reasoning.observability.scope,/does not prove parameters identifiable/);
 p.B={...p.A};r=runDelivery(p);
 assert.equal(r.reasoning.observability.matchedTransferAndInput,true);
 assert.equal(r.reasoning.observability.distinctParameters,false);
 assert.equal(r.reasoning.observability.hiddenMechanismMatch,false);
 p.A.J=p.B.J=0;r=runDelivery(p);
 assert.equal(r.reasoning.observability.matchedTransferAndInput,false);
});
test("delivery: input validation rejects invalid numbers, rates, modes and pulses",()=>{
 const edits=[
  p=>p.mode="washout",p=>p.nu=NaN,p=>p.nu=0,p=>p.horizon=Infinity,p=>p.horizon=169,
  p=>p.A.J=-1,p=>p.B.J="50",p=>p.A.proc=0,p=>p.B.lossC=0,p=>p.A.rec=11,
  p=>{p.A.lys=0;p.A.rec=0;},p=>{p.B.esc=0;p.B.lossL=0;},
  p=>{p.mode="pulse";p.pulse=25;},p=>p.pulse=0,p=>delete p.B,
  p=>p.A.lossIntact=-1,p=>p.A.lossIntact=11,p=>p.A.lossIntact=NaN,p=>delete p.A.lossIntact,
  p=>{p.A.proc=0;p.A.lossIntact=.0009;}
 ];
 for(const edit of edits){const p=deliveryPreset();edit(p);assert.throws(()=>validateDelivery(p));}
 assert.throws(()=>deliveryPreset("unknown"));
 const p=deliveryPreset();assert.throws(()=>simulateDelivery(p.A,p,{stepFactor:0}));
 assert.throws(()=>simulateDelivery(p.A,p,{nodes:1}));
 const q=validateDelivery(p);q.A.J=1;assert.equal(p.A.J,100);
});
test("delivery: CSV, units, provenance and generated worker match the tested core",()=>{
 const p=deliveryPreset("competing"),expected=runDelivery(p),csv=deliveryCSV(expected);
 assert.equal(csv.split("\n").length,803);assert.ok(csv.startsWith("case,t,E,L,"));
 assert.equal(expected.units.Pcyt,"payload/cell");assert.equal(expected.units.auc,"payload*h/cell");
 assert.equal(expected.schema,"productive-delivery/0.2");
 assert.equal(expected.units.intactLoss,"ADC equivalents/cell");
 assert.equal(expected.units.intactLossFlux,"ADC equivalents/cell/h");
 assert.ok(csv.split("\n")[0].includes("intactLoss,intactLossFlux,processingFlux"));
 let message;
 const self={postMessage:x=>message=x};
 vm.runInNewContext(DELIVERY_WORKER_SOURCE,{self,structuredClone});
 self.onmessage({data:{id:7,parameters:p}});
 assert.equal(message.id,7);assert.ok(message.report);
 const actual=JSON.parse(JSON.stringify(message.report));delete actual.created;delete expected.created;
 assert.deepEqual(actual,expected);
 self.onmessage({data:{id:8,parameters:{...p,nu:0}}});assert.match(message.error,/Payload yield/);
});
test("delivery: supported high-rate, long-duration and minimum-rate stress cases remain sound",()=>{
 for(const fast of [true,false]){
  const p=deliveryPreset();p.horizon=168;p.nu=16;
  for(const pop of ["A","B"]){p[pop].J=1e6;for(const key of ["lys","rec","proc","lossIntact","esc","lossL","lossC"])p[pop][key]=fast?10:.001;}
  const r=runDelivery(p);
  for(const pop of ["A","B"]){assert.ok(r[pop].diagnostics.maxMassRelativeResidual<1e-8);assert.ok(r[pop].final.Pcyt>0);}
 }
});
test("delivery: competing loss overturns the steady reversal with exact branch accounting",()=>{
 const p=deliveryPreset("competing"),r=runDelivery(p),f=r.reasoning.factors;
 near(r.A.steady.fProcess,10/11);near(r.B.steady.fProcess,1/11);
 near(r.A.steady.activeFlux,50/11);near(r.B.steady.activeFlux,12.5/11);
 near(r.ratios.activeSteady,.25);near(f.entry*f.routing*f.processing*f.escape,.25);
 near(r.reasoning.boundary.entryTie,200);assert.equal(r.reasoning.boundary.lowerEntryWindow,false);
 assert.equal(r.isSteadyReversal,false);
 for(const pop of ["A","B"]){
  const s=r[pop].steady,x=p[pop];near(s.processingFlux+s.intactLossFlux,x.lys*s.E);
  near(s.lysosomalResidence,1/(x.proc+x.lossIntact));
  for(const row of r[pop].rows){
   near(p.nu*row.uptake,p.nu*(row.E+row.L+row.recycled+row.intactLoss)+row.Plys+row.Pcyt+row.lysosomalLoss+row.cytosolicLoss);
   near(row.processingFlux,x.proc*row.L);near(row.intactLossFlux,x.lossIntact*row.L);
  }
 }
});
test("delivery: removing competing loss exactly recovers the legacy slow trajectory",()=>{
 const p=deliveryPreset("competing");p.A.lossIntact=p.B.lossIntact=0;
 const a=runDelivery(p),b=runDelivery(deliveryPreset("slow"));
 assert.deepEqual(a.A.rows,b.A.rows);assert.deepEqual(a.B.rows,b.B.rows);
 near(a.ratios.activeSteady,2.5);near(a.B.final.auc/a.A.final.auc,.480775,1e-6);
});
test("delivery: faster processing rescues yield only when a competing sink exists",()=>{
 const p=deliveryPreset("competing"),base=deliverySteady(p.B,1);
 const faster=deliverySteady({...p.B,proc:2},1),lossier=deliverySteady({...p.B,lossIntact:1},1);
 assert.ok(faster.activeFlux>base.activeFlux);assert.ok(faster.L<base.L);
 assert.ok(lossier.activeFlux<base.activeFlux);assert.ok(lossier.lysosomalResidence<base.lysosomalResidence);
 const eps=1e-5,plus=deliverySteady({...p.B,proc:p.B.proc*Math.exp(eps)},1);
 near(Math.log(plus.activeFlux/base.activeFlux)/eps,p.B.lossIntact/(p.B.proc+p.B.lossIntact),1e-6);
});
test("delivery: zero processing with an intact sink is valid but produces no active payload",()=>{
 const p=deliveryPreset("competing");p.B.proc=0;const r=runDelivery(p);
 near(r.B.steady.fProcess,0);near(r.B.steady.activeFlux,0);
 assert.equal(r.reasoning.boundary.status,"blocked");
 assert.ok(r.B.final.intactLoss>0);
 for(const row of r.B.rows)for(const key of ["Plys","Pcyt","activeArrivals","processingFlux","auc"])near(row[key],0);
});
test("delivery: pulse total deliveries include processing competition and loss ledger",()=>{
 const p=deliveryPreset("competing");p.mode="pulse";p.pulse=1.337;p.horizon=168;p.nu=4;
 const r=runDelivery(p);
 for(const pop of ["A","B"]){
  const s=r[pop].steady,x=p[pop],z=r[pop].final,total=x.J*p.pulse;
  near(z.activeArrivals,p.nu*total*s.productiveFraction,1e-8);
  near(z.intactLoss,total*s.fRoute*(1-s.fProcess),1e-8);
  near(z.E+z.L+z.Plys+z.Pcyt,0,1e-8);
 }
});
test("delivery: solver step and transfer signature include the competing exit",()=>{
 const p=deliveryPreset("competing");p.A.proc=p.A.lossIntact=10;const r=runDelivery(p);
 near(r.A.diagnostics.dtMax,.025/20);
 near(r.reasoning.observability.signatureA.intactLysosomalExit,20);
});
