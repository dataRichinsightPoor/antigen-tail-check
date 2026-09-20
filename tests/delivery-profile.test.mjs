import test from "node:test";
import assert from "node:assert/strict";
import {deliveryPreset,runDelivery,finiteDeliveryPoint,finiteDeliveryAUC,matchDeliveryAUC,profileThresholdAudit,deliveryProfileCSV,simulateDelivery} from "../web/delivery-model.js";
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test("profiles: equal finite AUC does not imply equal peaks, timing or lifetime exposure",()=>{
 const p=deliveryPreset("equalauc"),r=runDelivery(p),a=r.profileAudit.A,b=r.profileAudit.B;
 near(p.B.J,30.8052257698288);near(r.ratios.auc,1);
 assert.ok(r.profileAudit.matched);
 near(a.peak,3.384615042676459);near(b.peak,.6411800934367448);
 assert.ok(b.q50>a.q50*3);assert.ok(b.central80Duration>a.central80Duration*4);
 assert.ok(b.lateQuarterFraction>.18&&a.lateQuarterFraction<1e-6);
 assert.ok(r.exposureAudit.B.eventualAUC>r.exposureAudit.A.eventualAUC*1.5);
 assert.ok(r.B.diagnostics.maxMassRelativeResidual<1e-8);
});
test("profiles: matching changes entry amplitude only and preserves normalized shape",()=>{
 const p=deliveryPreset("slow");p.mode="pulse";
 const prior=structuredClone(p),before=runDelivery(p).profileAudit.B,m=matchDeliveryAUC(p);
 assert.deepEqual(p,prior);assert.equal(m.status,"ready");p.B.J=m.entry;
 const after=runDelivery(p).profileAudit.B;
 for(const k of ["q10","q50","q90","centroid","central80Duration","lateQuarterFraction","peakTime"])near(before[k],after[k]);
 near(after.peak/before.peak,p.B.J/prior.B.J);near(after.auc,finiteDeliveryAUC(p.A,p));
});
test("profiles: window changes destroy an imposed match unless explicitly recalibrated",()=>{
 const p=deliveryPreset("equalauc");p.horizon=72;
 const r=runDelivery(p);assert.ok(!r.profileAudit.matched&&r.ratios.auc>1.4);
 assert.notEqual(r.profileAudit.match.entry,p.B.J);
 p.B.J=r.profileAudit.match.entry;near(runDelivery(p).ratios.auc,1);
});
test("profiles: exact states and quantile roots agree with independent RK4 trajectories",()=>{
 for(const id of ["routing","pulse","equalauc","competing"]){
  const p=deliveryPreset(id),r=runDelivery(p);
  for(const pop of ["A","B"]){
   for(const i of [0,1,17,129,300,400]){
    const v=finiteDeliveryPoint(p[pop],p,r[pop].rows[i].t);
    // The exact propagator is compared with finite-step RK4, not another
    // exact calculation; retain the solver's established mixed tolerance.
    for(const k of ["Pcyt","activeFlux","auc"])near(v[k],r[pop].rows[i][k],1e-7);
   }
   const s=r.profileAudit[pop];
   for(const [key,f]of [["q10",.1],["q50",.5],["q90",.9]])near(finiteDeliveryPoint(p[pop],p,s[key]).auc/s.auc,f);
   assert.ok(s.q10<s.q50&&s.q50<s.q90);
   const v=finiteDeliveryPoint(p[pop],p,s.peakTime);
   if(!s.peakAtWindowEnd)near(v.activeFlux-p[pop].lossC*v.Pcyt,0);
   for(const node of s.points)assert.ok(node.Pcyt<=s.peak*(1+1e-8));
  }
 }
});
test("profiles: repeated-rate pulse peak has a closed-form solution and narrow peaks are not lost between nodes",()=>{
 const p=deliveryPreset("pulse");p.pulse=.01;p.horizon=168;
 p.A={J:100,lys:5,rec:5,proc:10,lossIntact:0,esc:5,lossL:5,lossC:10};p.B={...p.A};
 const r=runDelivery(p),s=r.profileAudit.A;
 near(s.peakTime,p.pulse/(1-Math.exp(-10*p.pulse/3)));
 assert.ok(s.peak>Math.max(...r.A.rows.map(v=>v.Pcyt))*1.1);
 assert.ok(s.points.some(v=>v.t===s.peakTime));
 assert.ok(!s.peakAtWindowEnd);
});
test("profiles: exposure centroid agrees with independent quadrature and is not t50",()=>{
 const p=deliveryPreset("equalauc"),r=runDelivery(p);
 for(const pop of ["A","B"]){
  const dense=simulateDelivery(p[pop],p,{nodes:2001}),dt=p.horizon/2000;
  let integral=0;
  for(let i=0;i<=2000;i++){const v=dense.rows[i];integral+=(i===0||i===2000?1:i%2?4:2)*v.t*v.Pcyt;}
  near(r.profileAudit[pop].centroid,integral*dt/3/dense.final.auc,1e-7);
  assert.ok(Math.abs(r.profileAudit[pop].centroid-r.profileAudit[pop].q50)>.1);
 }
});
test("profiles: descriptive cutoff rankings reverse without changing either AUC",()=>{
 const r=runDelivery(deliveryPreset("equalauc")),p=r.profileAudit;
 const high=profileThresholdAudit(r.parameters,p,1),low=profileThresholdAudit(r.parameters,p,.5);
 near(high.A.duration,3.693223727963315);assert.equal(high.B.duration,0);
 assert.ok(low.B.duration>low.A.duration);
 for(const pop of ["A","B"])for(const key of ["firstCrossing","lastCrossing"])
  near(finiteDeliveryPoint(r.parameters[pop],r.parameters,low[pop][key]).Pcyt,.5);
 assert.ok(profileThresholdAudit(r.parameters,p,.1).B.truncatedAtWindowEnd);
 for(const bad of [-1,NaN,Infinity,1e13])assert.throws(()=>profileThresholdAudit(r.parameters,p,bad));
 near(profileThresholdAudit(r.parameters,p,0).B.duration,24);
 near(profileThresholdAudit(r.parameters,p,p.B.peak).B.duration,0);
});
test("profiles: zero reference, blocked route, unsupported match and boundary peaks are explicit",()=>{
 let p=deliveryPreset();p.A.J=0;assert.equal(matchDeliveryAUC(p).status,"zero-reference");
 let r=runDelivery(p);assert.equal(r.profileAudit.A.q50,null);assert.equal(r.profileAudit.A.peakTime,null);assert.equal(r.profileAudit.A.centroid,null);
 assert.equal(r.profileAudit.A.points[0].cumulativeFraction,null);assert.equal(r.profileAudit.cutoff.A.duration,0);
 p=deliveryPreset();p.B.esc=0;assert.equal(matchDeliveryAUC(p).status,"blocked");
 p=deliveryPreset();p.A.J=1e6;p.B.lys=1e-8;assert.equal(matchDeliveryAUC(p).status,"out-of-range");
 p=deliveryPreset();r=runDelivery(p);assert.equal(r.profileAudit.A.peakAtWindowEnd,true);near(r.profileAudit.A.peakTime,24);
 assert.throws(()=>finiteDeliveryPoint(p.A,p,-1));assert.throws(()=>finiteDeliveryPoint(p.A,p,25));
});
test("profiles: CSV and JSON preserve the comparison's normalization and timing provenance",()=>{
 const r=runDelivery(deliveryPreset("equalauc")),p=r.profileAudit,csv=deliveryProfileCSV(p);
 assert.equal(csv.split("\n").length,p.A.points.length+p.B.points.length+4);
 assert.ok(csv.includes("areaNormalized=1/h"));
 assert.ok(csv.includes("numerical_match=true"));
 assert.equal(r.units.firstMoment,"payload*h^2/cell");
 near(p.B.points.at(-1).cumulativeFraction,1);
 assert.ok(p.scope.includes("window")&&p.match.scope.includes("entry only")&&p.cutoff.scope.includes("not a biological"));
 assert.ok(p.method.includes("bisection"));
});
