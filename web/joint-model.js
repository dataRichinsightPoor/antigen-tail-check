/**
 * Coexpression audit. General probability mathematics; synthetic defaults.
 * No binding, trafficking, payload or efficacy model is inferred.
 */
import {hill} from "./model.js";
export const JOINT_VERSION="0.2.0-alpha";
export const JOINT_REVISION="coexpression-1";
export const EVIDENCE_STEPS=[
 ["exposure","Local exposure","What reached the cells, where and for how long?"],
 ["engagement","Accessible engagement","Measured abundance is not simultaneous therapeutic engagement."],
 ["uptake","Uptake and recycling","Internalized material may return to the surface."],
 ["processing","Productive processing","Accumulation does not establish productive catabolism."],
 ["payload","Active intracellular payload","Released species and cytosolic active species are distinct."],
 ["susceptibility","Payload susceptibility","Equal delivery does not establish equal downstream response."],
 ["transfer","Spatial transfer","Recipient identity, distance and susceptibility matter."],
 ["response","Time-dependent response","Growth inhibition, death and regrowth are different endpoints."],
 ["host","Host exposure / toxicity","No therapeutic-index inference is made."]
];
export const EVIDENCE_STATUSES=["not supplied","user-reported measurement","assumption","outside this model"];
const jNumeric=/^[+]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
function jRead(text,paired,label){
 if(typeof text!=="string"||new TextEncoder().encode(text).length>5000000)throw Error(`${label}: maximum 5 MB of text.`);
 const lines=text.replace(/^\uFEFF/,"").split(/\r?\n/);
 const sourceRows=[];let header=false,delimiter=null,total=0,columns=null;
 for(let i=0;i<lines.length;i++){
  const line=lines[i].trim();if(!line)continue;
  const fail=message=>{throw Error(`${label}, line ${i+1}: ${message}`);};
  if(!header){
   delimiter=line.includes("\t")?"\t":",";
   const h=line.toLowerCase().split(delimiter).map(s=>s.trim()).join(",");
   if(paired){
    if(h!=="x,y"&&h!=="x,y,count")fail("required header is x,y or x,y,count (CSV or TSV).");
    columns=h.split(",").length;header=true;continue;
   }
   header=true;
   if(["value","antigen","value,count","antigen,count"].includes(h)){columns=h.split(",").length;continue;}
  }
  if((delimiter==="\t"&&line.includes(","))||(delimiter===","&&line.includes("\t")))fail("inconsistent delimiters; no thousands separators.");
  const parts=line.split(delimiter).map(s=>s.trim());
  if(columns===null)columns=parts.length;
  if(parts.length!==columns||(!paired&&![1,2].includes(columns)))fail("inconsistent column count.");
  if(!parts.every(s=>jNumeric.test(s)))fail("use nonnegative finite numeric values; no blanks, censoring, negative or transformed values.");
  const x=Number(parts[0]),y=paired?Number(parts[1]):null;
  const count=Number(parts[paired?2:1]??1);
  if(!Number.isFinite(x)||x>1e12||(paired&&(!Number.isFinite(y)||y>1e12)))fail("coordinates must be between 0 and 10¹².");
  if(!Number.isSafeInteger(count)||count<1||count>1e9)fail("count must be an integer from 1 to 10⁹.");
  total+=count;if(total>1e12)fail("total represented count cannot exceed 10¹².");
  sourceRows.push(paired?{x,y,count}:{x,count});
  if(sourceRows.length>100000)fail("maximum 100,000 data rows.");
 }
 if(!sourceRows.length)throw Error(`${label}: enter at least one data row.`);
 return sourceRows;
}
function jMarginal(rows,axis="x"){
 const sorted=rows.map(r=>({x:r[axis],count:r.count})).sort((a,b)=>a.x-b.x),merged=[];
 let n=0,mean=0,cum=0;
 for(const r of sorted){n+=r.count;if(merged.length&&merged.at(-1).x===r.x)merged.at(-1).count+=r.count;else merged.push({...r});}
 for(const r of merged){cum+=r.count;r.cdf=cum/n;mean+=r.x*(r.count/n);}
 return {rows:merged,n,mean};
}
export function parsePaired(text,label="Population"){
 const sourceRows=jRead(text,true,label),map=new Map();
 for(const r of sourceRows){const key=`${r.x},${r.y}`;if(map.has(key))map.get(key).count+=r.count;else map.set(key,{...r});}
 const rows=[...map.values()].sort((a,b)=>a.x-b.x||a.y-b.y);
 const x=jMarginal(rows),y=jMarginal(rows,"y");
 return {sourceRows,rows,n:x.n,x,y};
}
export function parseMarginal(text,label="Marginal"){
 const sourceRows=jRead(text,false,label);
 return {...jMarginal(sourceRows),sourceRows};
}
function jCount(p,t){let lo=0,hi=p.rows.length;while(lo<hi){const m=(lo+hi)>>1;if(p.rows[m].x<=t)lo=m+1;else hi=m;}return lo?p.rows[lo-1].cdf*p.n:0;}
export function quadrants(p,tx,ty){
 const c={LL:0,HL:0,LH:0,HH:0};
 for(const r of p.rows)c[(r.x<=tx?"L":"H")+(r.y<=ty?"L":"H")]+=r.count;
 return jFractions(c,p.n);
}
function jFractions(c,n){const r={};for(const key of ["LL","HL","LH","HH"])r[key]=c[key]/n;r.q=r.HH;r.e=(n-c.LL)/n;return r;}
export function overlapBounds(px,py){
 if(![px,py].every(x=>Number.isFinite(x)&&x>=0&&x<=1))throw Error("Marginal high fractions must be in [0,1].");
 return {q:[Math.max(0,px+py-1),Math.min(px,py)],e:[Math.max(px,py),Math.min(1,px+py)]};
}
function jBounds(x,y,tx,ty){const px=1-jCount(x,tx)/x.n,py=1-jCount(y,ty)/y.n;const b=overlapBounds(px,py);return {...b,LL:[1-b.e[1],1-b.e[0]],px,py};}
export function jointScores(p,{kx,ky,hx,hy}){
 let ubar=0,vbar=0,joint=0,either=0;
 for(const r of p.rows){const u=hill(r.x,kx,hx),v=hill(r.y,ky,hy),w=r.count/p.n;ubar+=w*u;vbar+=w*v;joint+=w*u*v;either+=w*(u+v-u*v);}
 const um=hill(p.x.mean,kx,hx),vm=hill(p.y.mean,ky,hy);
 return {joint,either,independentJoint:ubar*vbar,independentEither:ubar+vbar-ubar*vbar,meanOnlyJoint:um*vm,meanOnlyEither:um+vm-um*vm,covariance:joint-ubar*vbar};
}
function jCDFDistance(a,b){
 let i=0,j=0,ca=0,cb=0,d=0;
 while(i<a.rows.length||j<b.rows.length){
  const x=Math.min(a.rows[i]?.x??Infinity,b.rows[j]?.x??Infinity);
  while(i<a.rows.length&&a.rows[i].x===x)ca=a.rows[i++].cdf;
  while(j<b.rows.length&&b.rows[j].x===x)cb=b.rows[j++].cdf;
  d=Math.max(d,Math.abs(ca-cb));
 }return d;
}
function jGridAxis(max){return Array.from({length:51},(_,i)=>i===0?0:i===50?max:Math.expm1(Math.log1p(max)*i/50));}
function jLowerBound(a,x){let l=0,h=a.length;while(l<h){const m=(l+h)>>1;if(a[m]<x)l=m+1;else h=m;}return l;}
export function pairedGrid(p,xs,ys){
 // Rows are counted in the first cutoff bin >= their coordinate, then prefix-summed.
 const nx=xs.length,ny=ys.length,m=Array.from({length:ny},()=>new Float64Array(nx));
 for(const r of p.rows){const ix=jLowerBound(xs,r.x),iy=jLowerBound(ys,r.y);if(ix<nx&&iy<ny)m[iy][ix]+=r.count;}
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++)m[y][x]+=(x?m[y][x-1]:0)+(y?m[y-1][x]:0)-(x&&y?m[y-1][x-1]:0);
 const xc=xs.map(t=>Math.round(jCount(p.x,t))),yc=ys.map(t=>Math.round(jCount(p.y,t)));
 return ys.flatMap((ty,y)=>xs.map((tx,x)=>{
  const LL=m[y][x],HL=yc[y]-LL,LH=xc[x]-LL,HH=p.n-xc[x]-yc[y]+LL;
  return jFractions({LL,HL,LH,HH},p.n);
 }));
}
export function validateJointMetadata(mode,m){
 if(!m||!["synthetic","empirical"].includes(m.origin))throw Error("Declare synthetic or empirical provenance.");
 for(const axis of ["X","Y"]){
  const a=m.units?.[`${axis}A`],b=m.units?.[`${axis}B`];
  if(!["abc","mesf","relative"].includes(a)||a!==b)throw Error(`${axis} scales differ or are missing. Harmonize externally; no scale conversion is performed.`);
 }
 if(!m.compatible)throw Error("Confirm compatible corresponding-axis measurement mappings, staining and gates.");
 if(!m.resolved)throw Error("Confirm quantitative resolution; unresolved, clipped or censored ranges cannot be inferred.");
 if(!m.pairing)throw Error(mode==="paired"?"Confirm same-cell X/Y pairing; separate files must not be paired by rank or row.":"Confirm each pair of marginals describes the same intended population and condition.");
 if(m.origin==="empirical"&&!m.notes?.trim())throw Error("Empirical inputs require provenance, calibration, gating and replicate notes.");
 const evidence={};
 for(const [id] of EVIDENCE_STEPS){
  const row=m.evidence?.[id]??{status:"not supplied"};
  if(!EVIDENCE_STATUSES.includes(row.status))throw Error(`Invalid evidence status for ${id}.`);
  evidence[id]={status:row.status};
  for(const key of ["assay","context","note"]){
   const value=row[key]??"";if(typeof value!=="string"||value.length>2000)throw Error(`Evidence ${id}: ${key} exceeds 2,000 characters.`);
   evidence[id][key]=value;
  }
 }
 return {...m,evidence};
}
export function analyzeJoint({mode,inputs,config,metadata}){
 if(!["paired","marginal_bounds"].includes(mode))throw Error("Choose paired or marginal-only mode.");
 const meta=validateJointMetadata(mode,metadata),c={...config};
 for(const k of ["tx","ty"])if(!Number.isFinite(c[k])||c[k]<0||c[k]>1e12)throw Error("Cutoffs must be between 0 and 10¹².");
 c.scenarios=mode==="paired"&&c.scenarios===true;
 if(c.scenarios){
  for(const k of ["kx","ky"])if(!Number.isFinite(c[k])||c[k]<1e-6||c[k]>1e12)throw Error("Score midpoints must be between 10⁻⁶ and 10¹².");
  for(const k of ["hx","hy"])if(!Number.isFinite(c[k])||c[k]<.1||c[k]>20)throw Error("Score slopes must be between 0.1 and 20.");
 }else for(const k of ["kx","ky","hx","hy"])delete c[k];
 const paired=mode==="paired";
 let a,b,ax,ay,bx,by;
 if(paired){a=parsePaired(inputs.A,"Population A");b=parsePaired(inputs.B,"Population B");ax=a.x;ay=a.y;bx=b.x;by=b.y;}
 else {ax=parseMarginal(inputs.AX,"A-X");ay=parseMarginal(inputs.AY,"A-Y");bx=parseMarginal(inputs.BX,"B-X");by=parseMarginal(inputs.BY,"B-Y");}
 const axes={X:{meanA:ax.mean,meanB:bx.mean,cdfDistance:jCDFDistance(ax,bx)},Y:{meanA:ay.mean,meanB:by.mean,cdfDistance:jCDFDistance(ay,by)}};
 const xs=jGridAxis(Math.max(1,c.tx,ax.rows.at(-1).x,bx.rows.at(-1).x)),ys=jGridAxis(Math.max(1,c.ty,ay.rows.at(-1).x,by.rows.at(-1).x));
 let comparison,ga,gb;
 const delta=(a,b)=>Object.fromEntries(["LL","HL","LH","HH","q","e"].map(k=>[k,b[k]-a[k]]));
 const boundDelta=(a,b)=>Object.fromEntries(["q","e","LL"].map(k=>[k,[b[k][0]-a[k][1],b[k][1]-a[k][0]]]));
 if(paired){
  const qa=quadrants(a,c.tx,c.ty),qb=quadrants(b,c.tx,c.ty);
  comparison={a:qa,b:qb,delta:delta(qa,qb),quadrantTV:.5*["LL","HL","LH","HH"].reduce((s,k)=>s+Math.abs(qb[k]-qa[k]),0),
   scores:c.scenarios?{a:jointScores(a,c),b:jointScores(b,c)}:null,scoreStatus:c.scenarios?"hypothetical":"not_requested"};
  ga=pairedGrid(a,xs,ys);gb=pairedGrid(b,xs,ys);
 }else{
  const ba=jBounds(ax,ay,c.tx,c.ty),bb=jBounds(bx,by,c.tx,c.ty);
  comparison={a:ba,b:bb,delta:boundDelta(ba,bb),jointStatus:"not_identified_from_marginals",scores:null,scoreStatus:"not_identified_from_marginals"};
  ga=ys.flatMap(y=>xs.map(x=>jBounds(ax,ay,x,y)));gb=ys.flatMap(y=>xs.map(x=>jBounds(bx,by,x,y)));
 }
 const grid={x:xs,y:ys,spacing:"log1p cutoffs; exact calculations at 51 × 51 nodes",nodes:ga.map((v,i)=>({x:xs[i%51],y:ys[Math.floor(i/51)],a:v,b:gb[i],delta:paired?delta(v,gb[i]):boundDelta(v,gb[i])}))};
 return {schema:"antigen-tail-check/0.2",version:JOINT_VERSION,calculationRevision:JOINT_REVISION,mode,
  created:new Date().toISOString(),metadata:meta,config:c,axes,comparison,grid,
  populations:paired?{A:a,B:b}:{AX:ax,AY:ay,BX:bx,BY:by},
  limitations:[
   "Descriptive supplied-data audit, not biological equivalence, efficacy, internalization or cell killing.",
   "Pairing and measurement quality are user-declared, not independently verified.",
   "Scenario midpoints are separate from positivity cutoffs; scenarios are not measured mechanisms.",
   "Marginal-only bounds are pointwise feasible ranges, not confidence intervals; no cell pairing is reconstructed.",
   "Quadrant TV bounds only common quadrant-constant [0,1] scores, not arbitrary smooth two-dimensional responses.",
   "Mechanism evidence is user-reported metadata and does not alter numerical outputs or form an efficacy score.",
   "No spatial transport, trafficking, active payload, time dynamics, uncertainty or clinical inference is calculated.",
   "Exports contain user-supplied observations and notes. Do not share confidential data."
  ]};
}
export function safeCSV(value){
 const str=String(value??"");const safe=/^\s*[=+\-@\t\r]/.test(str)&&typeof value!=="number"?"'"+str:str;
 return '"'+safe.replaceAll('"','""')+'"';
}
export function jointCSV(report){
 const paired=report.mode==="paired",metrics=paired?["LL","HL","LH","HH","q","e"]:["q","e","LL"];
 const keys=metrics.flatMap(k=>["a","b","delta"].flatMap(p=>paired?[`${p}_${k}`]:[`${p}_${k}_lower`,`${p}_${k}_upper`]));
 const header=["mode","cutoff_x","cutoff_y","unit_x","unit_y","target_x","target_y",...keys,"version"];
 return [header,...report.grid.nodes.map(n=>[
  report.mode,n.x,n.y,report.metadata.units.XA,report.metadata.units.YA,report.metadata.targetX,report.metadata.targetY,
  ...metrics.flatMap(k=>["a","b","delta"].flatMap(p=>n[p][k])),report.version
 ])].map(row=>row.map(safeCSV).join(",")).join("\n");
}
