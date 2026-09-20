import test from "node:test";
import assert from "node:assert/strict";
import {deliveryPreset,runDelivery,deliverySteady,finiteDeliveryAUC} from "../web/delivery-model.js";
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test("exposure: six factors reproduce finite AUC, including unequal retention and pulse input",()=>{
 for(const id of ["routing","matched","slow","pulse","ambiguity","competing"]){
  const p=deliveryPreset(id);
  for(const removal of [1,4]){
   p.B.lossC=removal;const r=runDelivery(p),e=r.exposureAudit;
   near(e.factorizedRatio,r.ratios.auc);
   near(e.factorizedRatio,e.cohortPotentialRatio*e.factors.window);
   for(const pop of ["A","B"])assert.ok(e[pop].windowFraction>0&&e[pop].windowFraction<=1+1e-10);
  }
 }
});
test("exposure: future compartment credits close the cohort AUC ledger",()=>{
 for(const id of ["routing","slow","pulse","competing","ambiguity"]){
  const r=runDelivery(deliveryPreset(id)),e=r.exposureAudit;
  for(const pop of ["A","B"]){
   const x=e[pop];
   near(x.auc+x.remainingAUC,x.eventualAUC);
   near(x.auc,r[pop].final.cytosolicLoss/r.parameters[pop].lossC);
   near(x.remainingAUC,Object.values(x.remainingByState).reduce((a,b)=>a+b,0));
   assert.ok(x.ledgerRelativeResidual<1e-8);
   assert.ok(Object.values(x.remainingByState).every(v=>v>=0));
  }
 }
});
test("exposure: faster competing loss shortens successful transit but worsens productive yield",()=>{
 const p=deliveryPreset("slow"),r=runDelivery(p);
 near(r.exposureAudit.B.conditionalArrivalMean,51);
 p.B.lossIntact=.2;const b=runDelivery(p);
 near(b.exposureAudit.B.conditionalArrivalMean,.5+1/.22+.5);
 assert.ok(b.B.steady.productiveFraction<r.B.steady.productiveFraction);
 assert.ok(b.exposureAudit.B.conditionalArrivalMean<r.exposureAudit.B.conditionalArrivalMean);
 assert.ok(b.exposureAudit.B.eventualAUC<r.exposureAudit.B.eventualAUC);
});
test("exposure: local steady processing elasticity agrees with a log finite difference",()=>{
 const p=deliveryPreset("competing"),e=runDelivery(p).exposureAudit.B,h=1e-5;
 const plus=deliverySteady({...p.B,proc:p.B.proc*Math.exp(h)},p.nu).activeFlux;
 const minus=deliverySteady({...p.B,proc:p.B.proc*Math.exp(-h)},p.nu).activeFlux;
 near((Math.log(plus)-Math.log(minus))/(2*h),e.processingElasticity);
 p.B.lossIntact=0;
 near(runDelivery(p).exposureAudit.B.processingElasticity,0);
 assert.ok(finiteDeliveryAUC({...p.B,proc:.04},p)>finiteDeliveryAUC(p.B,p));
});
test("exposure: window fraction is invariant to input and yield scaling, not an arrival fraction",()=>{
 const p=deliveryPreset("slow"),a=runDelivery(p);p.B.J*=3;p.nu=4;const b=runDelivery(p);
 near(a.exposureAudit.B.windowFraction,b.exposureAudit.B.windowFraction);
 near(b.exposureAudit.B.eventualAUC/a.exposureAudit.B.eventualAUC,12);
 const x=a.exposureAudit.B,arrivalFraction=a.B.final.activeArrivals/(x.eventualAUC*p.B.lossC);
 assert.ok(Math.abs(arrivalFraction-x.windowFraction)>.01);
 near(a.exposureAudit.A.windowFraction,.9125);
 near(a.exposureAudit.B.windowFraction,.175482995553,1e-9);
});
test("exposure: zero input and blocked routes retain zero amounts without invented ratios",()=>{
 const p=deliveryPreset();p.A.J=0;let r=runDelivery(p);
 assert.equal(r.exposureAudit.factorizedRatio,null);
 assert.equal(r.exposureAudit.A.windowFraction,null);
 assert.equal(r.exposureAudit.A.processingElasticity,null);
 assert.ok(r.exposureAudit.A.conditionalArrivalMean>0); // Tagged-unit route still exists.
 p.B.esc=0;r=runDelivery(p);
 assert.equal(r.exposureAudit.B.conditionalArrivalMean,null);
 assert.equal(r.exposureAudit.B.remainingAUC,0);
 assert.equal(r.exposureAudit.B.windowFraction,null);
 assert.equal(r.exposureAudit.B.processingElasticity,null);
});
test("exposure: extending a fixed pulse chase realizes more of the same cohort potential",()=>{
 const p=deliveryPreset("slow");p.mode="pulse";const a=runDelivery(p).exposureAudit;
 p.horizon=168;const b=runDelivery(p).exposureAudit;
 near(a.B.eventualAUC,b.B.eventualAUC);
 assert.ok(b.B.windowFraction>a.B.windowFraction);
 assert.ok(b.B.remainingAUC<a.B.remainingAUC);
 assert.ok(a.B.remainingByState.L>a.B.remainingByState.Pcyt);
});
