// Checks for derived examples in the reading guide.
// This algebra is also exercised dynamically by the separate delivery companion.
import test from "node:test";
import assert from "node:assert/strict";
import {parsePaired,jointScores} from "../web/joint-model.js";
import {hill} from "../web/model.js";
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);

test("rationale: matched marginals tie for additive scores but permit opposite interacting rankings",()=>{
 const a=parsePaired("x,y,count\n0,0,500\n100000,100000,500");
 const b=parsePaired("x,y,count\n0,100000,500\n100000,0,500");
 const settings={kx:10000,ky:20000,hx:2,hy:3};
 const additive=p=>p.rows.reduce((s,r)=>s+r.count/p.n*(hill(r.x,settings.kx,settings.hx)+hill(r.y,settings.ky,settings.hy)),0);
 near(additive(a),additive(b));
 const sa=jointScores(a,settings),sb=jointScores(b,settings);
 assert.ok(sa.joint>sb.joint);
 assert.ok(sa.either<sb.either);
 for(const s of [sa,sb]){
  near(s.joint-s.meanOnlyJoint,s.covariance+(s.independentJoint-s.meanOnlyJoint));
 }
});

test("rationale: restricted steady-state balances and invented routing example",()=>{
 // Exogenous fixed Jin; no rebinding feedback, growth, saturation or target binding.
 function steady({J,nu,lys,rec,proc,esc,lossL,lossC}){
  const E=J/(lys+rec),L=lys*E/proc,Plys=nu*proc*L/(esc+lossL),Pcyt=esc*Plys/lossC;
  near(J-(lys+rec)*E,0);
  near(lys*E-proc*L,0);
  near(nu*proc*L-(esc+lossL)*Plys,0);
  near(esc*Plys-lossC*Pcyt,0);
  near(Pcyt,nu*J/lossC*lys/(lys+rec)*esc/(esc+lossL));
  return {E,L,Plys,Pcyt,processingFlux:proc*L};
 }
 const base={J:100,nu:1,lys:1,rec:9,proc:2,esc:1,lossL:1,lossC:1};
 const a=steady(base),b=steady({...base,J:50,rec:1});
 near(a.processingFlux,10);near(b.processingFlux,25);near(b.Pcyt/a.Pcyt,2.5);
 const slow=steady({...base,proc:.02});
 near(slow.Pcyt,a.Pcyt);near(slow.L/a.L,100);
});
