import test from "node:test";
import assert from "node:assert/strict";
import {parsePopulation as p,population,cdf,hill,residual,compare,sweep,PRESETS} from "../web/model.js";
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
test("exact equal-mean tail example",()=>{
  const a=p(PRESETS.tail.a),b=p(PRESETS.tail.b),r=compare(a,b);
  near(a.mean,50000);near(b.mean,50000);near(r.tailA,0);near(r.tailB,.2);
  near(r.dGlobal,.8);near(r.residualA,1/626);
  near(r.residualB,.2/(1+.1**4)+.8/(1+6.225**4));
  assert.match(r.order,/cross/);
});
test("threshold crossing reverses direction",()=>{
  const a=p(PRESETS.tail.a),b=p(PRESETS.tail.b);
  assert.ok(compare(a,b,{threshold:10000}).tailGap>0);
  assert.ok(compare(a,b,{threshold:60000}).tailGap<0);
});
test("counts, ties, quantiles, zero and inclusive boundary",()=>{
  const a=p("value,count\n0,2\n2,1\n2,1\n8,1");
  near(a.mean,2.4);near(cdf(a,0),.4);near(cdf(a,2),.8);near(cdf(a,-1),0);near(cdf(a,20),1);
  assert.equal(a.n,5);assert.equal(a.median,2);assert.equal(a.q05,0);assert.equal(a.q95,8);assert.equal(a.rows.length,3);
  near(hill(0,1,4),0);near(residual(p("0\n0"),1,4),1);
  assert.equal(p("0").cv,null);
});
test("identical distributions and scale invariance",()=>{
  const a=p("0\n1\n3\n5"),b=p("0,2\n1,2\n3,2\n5,2");
  const r=compare(a,b);near(r.dGlobal,0);near(r.residualA,r.residualB);
  const scaled=population(a.rows.map(x=>({x:100*x.x,count:x.count})));
  near(residual(a,2,3),residual(scaled,200,3));
});
test("empirical first-order stochastic dominance",()=>{
  const r=compare(p("2\n3"),p("0\n1"));
  assert.match(r.order,/A stochastically/);
  near(r.dGlobal,1);
});
test("band endpoints and interior jumps are included exactly",()=>{
  const a=p("1\n5"),b=p("2\n6");
  near(compare(a,b,{lower:1,upper:1.5}).dBand,.5);
  near(compare(a,b,{lower:2,upper:4}).dBand,0);
  near(compare(a,b,{lower:0,upper:6}).dBand,.5);
});
test("invalid inputs fail rather than being silently coerced",()=>{
  for(const x of ["","antigen,count","-1","NaN","Infinity","1,","1,0","1,1.2","1,2,3","<10","1e999","1000000000001","1\nfoo"])assert.throws(()=>p(x),x);
  const a=p("1");
  for(const config of [{threshold:0},{slope:0},{lower:10,upper:2},{tailMargin:101},{threshold:NaN}])assert.throws(()=>compare(a,a,config));
});
test("smooth response difference bounded by global CDF distance",()=>{
  let seed=17;const rng=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32);
  for(let j=0;j<100;j++){
    const a=population(Array.from({length:12},()=>({x:rng()*100,count:1})));
    const b=population(Array.from({length:12},()=>({x:rng()*100,count:1})));
    const r=compare(a,b,{threshold:1+rng()*100,slope:.1+19*rng()});
    assert.ok(Math.abs(r.residualA-r.residualB)<=r.dGlobal+1e-12);
    near(compare(b,a).dGlobal,r.dGlobal);
  }
});
test("stable extreme ratios and sweep boundaries",()=>{
  near(hill(1e12,1e-12,20),1);near(hill(1e-12,1e12,20),0);near(hill(5,5,4),.5);
  const a=p("0\n1"),s=sweep(a,a,{lower:0,upper:100,slope:4});
  assert.equal(s.length,101);assert.ok(s.every(r=>Number.isFinite(r.residualA)));
  near(s[0].threshold,0);near(s[0].residualA,.5);
  near(s.at(-1).threshold,100);
});
test("large empirical inputs do not exceed argument limit",()=>{
  const a=population(Array.from({length:100000},(_,i)=>({x:i,count:1})));
  const r=compare(a,a,{lower:0,upper:100000});
  near(r.dGlobal,0);near(r.dBand,0);
});
