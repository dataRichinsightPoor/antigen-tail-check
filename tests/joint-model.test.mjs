import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {analyzeJoint,parsePaired,parseMarginal,quadrants,pairedGrid,jointScores,overlapBounds,jointCSV,safeCSV,EVIDENCE_STEPS} from "../web/joint-model.js";
import {JOINT_WORKER_SOURCE} from "../web/joint-worker-source.js";
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
const A="x,y,count\n0,0,500\n100000,100000,500",B="x,y,count\n0,100000,500\n100000,0,500";
const cfg={tx:10000,ty:10000,scenarios:false,kx:10000,ky:10000,hx:2,hy:2};
const meta=()=>({origin:"synthetic",units:{XA:"abc",XB:"abc",YA:"abc",YB:"abc"},pairing:true,compatible:true,resolved:true,notes:"Synthetic test",targetX:"X",targetY:"Y"});
const req=(changes={})=>({mode:"paired",inputs:{A,B},config:{...cfg},metadata:meta(),...changes});
test("canonical matched marginals and opposite pairing",()=>{
 const r=analyzeJoint(req());
 near(r.axes.X.meanA,50000);near(r.axes.Y.meanB,50000);near(r.axes.X.cdfDistance,0);near(r.axes.Y.cdfDistance,0);
 assert.deepEqual(r.comparison.a,{LL:.5,HL:0,LH:0,HH:.5,q:.5,e:.5});
 assert.deepEqual(r.comparison.b,{LL:0,HL:.5,LH:.5,HH:0,q:0,e:1});
 near(r.comparison.quadrantTV,1);near(r.comparison.delta.q,-.5);near(r.comparison.delta.e,.5);
 assert.equal(r.comparison.scores,null);assert.equal(r.comparison.scoreStatus,"not_requested");
});
test("scores, covariance identities and mean-only comparator",()=>{
 const r=analyzeJoint(req({config:{...cfg,scenarios:true}})),a=r.comparison.scores.a,b=r.comparison.scores.b;
 near(a.joint,5000/10201);near(b.joint,0);near(a.either,5100/10201);near(b.either,100/101);
 near(a.independentJoint,2500/10201);near(a.independentEither,7600/10201);
 near(a.meanOnlyJoint,625/676);near(a.meanOnlyEither,675/676);
 for(const s of [a,b]){near(s.joint-s.independentJoint,s.covariance);near(s.either-s.independentEither,-s.covariance);}
});
test("inclusive ties, zeros and absent target",()=>{
 const p=parsePaired("x\ty\n10\t10\n10\t11\n11\t10\n11\t11");
 const q=quadrants(p,10,10);for(const k of ["LL","HL","LH","HH"])near(q[k],.25);
 near(quadrants(parsePaired("x,y\n0,0"),0,0).LL,1);
 const scores=jointScores(parsePaired("x,y\n0,10\n0,20"),{kx:10,ky:10,hx:2,hy:2});near(scores.joint,0);assert.ok(scores.either>0);
});
test("strict parsers preserve physical line numbers and exact multiplicities",()=>{
 const p=parsePaired("\n x,y,count\n0,1,2\n\n0,1,3\n0,2,1");
 assert.equal(p.sourceRows.length,3);assert.equal(p.rows.length,2);assert.equal(p.n,6);assert.equal(p.rows[0].count,5);
 assert.throws(()=>parsePaired("x,y\n\n1,\n","A"),/A, line 3/);
 for(const bad of ["","x,z\n1,2","x,y\n1,2,3","x,y\n1\t2","x,y\n-1,2","x,y\n<1,2","x,y\nNaN,2","x,y\n1e999,2","x,y,count\n1,2,0","x,y,count\n1,2,1.5","x,y,count\n1,2,1000000001","x,y\n1000000000001,2"])assert.throws(()=>parsePaired(bad),bad);
 assert.throws(()=>parsePaired("x,y,count\n"+"0,0,1000000000\n".repeat(1001)),/total/);
 assert.throws(()=>parsePaired("x,y\n"+"0,0\n".repeat(100001)),/100,000/);
 assert.throws(()=>parsePaired(" ".repeat(5000001)),/5 MB/);
 assert.equal(parseMarginal("value\tcount\n0\t2\n10\t1").n,3);
});
test("bounds from marginals, no paired score and signed feasible differences",()=>{
 const input="value,count\n0,500\n100000,500";
 const r=analyzeJoint(req({mode:"marginal_bounds",inputs:{AX:input,AY:input,BX:input,BY:input},config:{...cfg,scenarios:true}}));
 assert.deepEqual(r.comparison.a.q,[0,.5]);assert.deepEqual(r.comparison.a.e,[.5,1]);assert.deepEqual(r.comparison.delta.q,[-.5,.5]);
 assert.equal(r.comparison.scores,null);assert.equal(r.config.scenarios,false);assert.equal(r.comparison.jointStatus,"not_identified_from_marginals");
 assert.deepEqual(overlapBounds(.9,.8).q,[.7000000000000002,.8]);
 assert.throws(()=>overlapBounds(-.1,.5));
});
test("grid exactness against brute-force at every node, including ties and out-of-grid observations",()=>{
 let seed=31;const rng=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32);
 const p=parsePaired("x,y,count\n"+Array.from({length:180},()=>`${Math.floor(rng()*20)},${Math.floor(rng()*20)},${1+Math.floor(rng()*4)}`).join("\n"));
 const xs=[0,1,5,7,10,15],ys=[0,2,5,10,15],g=pairedGrid(p,xs,ys);
 for(let i=0;i<g.length;i++){const brute=quadrants(p,xs[i%xs.length],ys[Math.floor(i/xs.length)]);for(const k of Object.keys(brute))near(g[i][k],brute[k]);}
 const r=analyzeJoint(req());assert.equal(r.grid.nodes.length,2601);
 for(const n of r.grid.nodes)for(const pop of ["a","b"]){const brute=quadrants(r.populations[pop.toUpperCase()],n.x,n.y);for(const k of Object.keys(brute))near(n[pop][k],brute[k]);}
});
test("population reversal, row order and exact-count replication invariance",()=>{
 const r=analyzeJoint(req()),rev=analyzeJoint(req({inputs:{A:B,B:A}}));
 for(const k of ["LL","HL","LH","HH","q","e"])near(rev.comparison.delta[k],-r.comparison.delta[k]);
 const reorder=parsePaired("x,y,count\n100000,100000,5\n0,0,5");
 assert.deepEqual(quadrants(reorder,10000,10000),r.comparison.a);
 near(rev.comparison.quadrantTV,r.comparison.quadrantTV);
});
test("axis swap and independent positive scaling leave corresponding results invariant",()=>{
 const p=parsePaired("x,y,count\n2,11,1\n3,5,2"),sw=parsePaired("x,y,count\n11,2,1\n5,3,2"),scaled=parsePaired("x,y,count\n20,1100,1\n30,500,2");
 const q=quadrants(p,2,6),s=quadrants(sw,6,2);near(q.HL,s.LH);near(q.LH,s.HL);near(q.HH,s.HH);
 const settings={kx:2,ky:6,hx:2,hy:3};
 near(jointScores(p,settings).joint,jointScores(scaled,{kx:20,ky:600,hx:2,hy:3}).joint);
});
test("quadrant TV is not an arbitrary smooth-response bound",()=>{
 const a=parsePaired("x,y\n20000,20000"),b=parsePaired("x,y\n100000,100000");
 assert.deepEqual(quadrants(a,10000,10000),quadrants(b,10000,10000));
 assert.notEqual(jointScores(a,cfg).joint,jointScores(b,cfg).joint);
});
test("metadata validation, axis units, pairing, measurement declarations and empirical notes",()=>{
 for(const field of ["pairing","compatible","resolved"])assert.throws(()=>analyzeJoint(req({metadata:{...meta(),[field]:false}})));
 assert.throws(()=>analyzeJoint(req({metadata:{...meta(),origin:"empirical",notes:""}})));
 assert.throws(()=>analyzeJoint(req({metadata:{...meta(),units:{...meta().units,XB:"mesf"}}})));
 assert.doesNotThrow(()=>analyzeJoint(req({metadata:{...meta(),units:{XA:"abc",XB:"abc",YA:"mesf",YB:"mesf"}}})));
});
test("evidence never changes numbers, survives report round-trip, no aggregate score",()=>{
 const m=meta();m.evidence=Object.fromEntries(EVIDENCE_STEPS.map(([id])=>[id,{status:"user-reported measurement",assay:"Synthetic QA",context:"No biological claim",note:"<script>not executable</script>"}]));
 const first=analyzeJoint(req()),second=analyzeJoint(req({metadata:m}));assert.deepEqual(first.comparison,second.comparison);
 assert.deepEqual(first.grid,second.grid);
 const round=JSON.parse(JSON.stringify(second));assert.equal(round.metadata.evidence.payload.note,m.evidence.payload.note);
 assert.equal(round.efficacy,undefined);assert.equal(round.confidence,undefined);
 const reproduced=analyzeJoint(req({inputs:Object.fromEntries(Object.entries(round.populations).map(([k,p])=>[k,"x,y,count\n"+p.sourceRows.map(r=>`${r.x},${r.y},${r.count}`).join("\n")]))}));
 assert.deepEqual(first.comparison,reproduced.comparison);
});
test("invalid settings, stable extrema and safe CSV",()=>{
 for(const config of [{...cfg,tx:NaN},{...cfg,ty:-1},{...cfg,scenarios:true,kx:0},{...cfg,scenarios:true,hx:21}])assert.throws(()=>analyzeJoint(req({config})));
 const r=analyzeJoint(req({config:{...cfg,scenarios:true,kx:1e-6,ky:1e12,hx:20,hy:.1}}));
 for(const score of Object.values(r.comparison.scores.a))assert.ok(Number.isFinite(score));
 const csv=jointCSV(r);assert.equal(csv.split("\n").length,2602);assert.match(csv,/cutoff_x/);
 assert.equal(safeCSV("=SUM(1)"),'"\'=SUM(1)"');assert.equal(safeCSV(-.5),'"-0.5"');
});
test("generated joint worker equals tested core and rejects unknown mode",()=>{
 let reply;const self={postMessage:r=>{reply=r;}};vm.runInNewContext(JOINT_WORKER_SOURCE,{self,TextEncoder});
 self.onmessage({data:{...req(),requestId:4}});assert.equal(reply.requestId,4);assert.equal(reply.error,undefined);near(reply.report.comparison.a.q,.5);
 self.onmessage({data:{...req(),mode:"invented",requestId:5}});assert.match(reply.error,/Choose paired/);
});
test("100,000 rows per population remain bounded and exact",()=>{
 const input="x,y\n"+Array.from({length:100000},(_,i)=>`${i},${99999-i}`).join("\n");
 const start=performance.now(),r=analyzeJoint(req({inputs:{A:input,B:input}}));
 near(r.comparison.quadrantTV,0);near(r.axes.X.cdfDistance,0);assert.equal(r.populations.A.n,100000);assert.equal(r.grid.nodes.length,2601);
 console.log(`100k paired rows per population: ${(performance.now()-start).toFixed(0)} ms (Node reference run).`);
});
