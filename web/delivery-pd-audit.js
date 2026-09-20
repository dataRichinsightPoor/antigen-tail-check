// Original algebraic diagnostics of the declared one-way PD hypothesis.
// These are conditional accounting terms, not independently identified causes.
export function pdInterpretation(A,B,p){
 const divide=(a,b)=>b>0?a/b:null;
 const one=x=>{
  const z=x.final,Q=z.auc,Ieq=z.equilibriumAUC,I=z.engagementAUC;
  const saturation=divide(p.halfAmount*Ieq,Q),kinetics=divide(I,Ieq);
  const retention=divide(z.signal,p.formation*I);
  // Integrating O' = b[P/K - PO/K - O] gives this nonnegative
  // overlap term without adding another state. It is a derived remainder,
  // not an independently measured or independently integrated quantity.
  const terminal=p.halfAmount*z.engagement/p.off;
  const unavailable=Q-p.halfAmount*I-terminal;
  return {exposure:Q,saturation,kinetics,retention,
   reconstructedSignal:[saturation,kinetics,retention].every(v=>v!==null)?p.formation*Q/p.halfAmount*saturation*kinetics*retention:null,
   engagementAccounting:{exposure:Q,engagedArea:p.halfAmount*I,terminal,occupiedTargetOverlap:unavailable,
    scope:"Q = K∫Odt + (K/b)O(T) + ∫POdt. Overlap is inferred by subtraction, not an independent conservation test."}};
 };
 const a=one(A),b=one(B),keys=["exposure","saturation","kinetics","retention"];
 const ratios=Object.fromEntries(keys.map(k=>[k,a[k]!==null&&b[k]!==null?divide(b[k],a[k]):null]));
 const product=Object.values(ratios).every(v=>v!==null)?Object.values(ratios).reduce((x,y)=>x*y,1):null;
 const maxSignal=Math.max(A.peakSignal,B.peakSignal),tolerance=1e-8*maxSignal;
 let previous=null;const brackets=[];
 const classes=A.rows.map((a,i)=>{
  const delta=B.rows[i].signal-a.signal,rank=delta>tolerance?"B":delta< -tolerance?"A":"unresolved";
  if(rank!=="unresolved"){
   if(previous&&previous.rank!==rank)brackets.push({from:previous.rank,to:rank,
    lowerTime:previous.time,upperTime:a.t,lowerIndex:previous.index,upperIndex:i});
   previous={rank,time:a.t,index:i};
  }
  return {t:a.t,delta,rank};
 });
 return {revision:"pd-audit-1",A:a,B:b,ratios,product,
  identity:"D(T) = (s/K) Q × [K∫Oeq/Q] × [∫O/∫Oeq] × [D/(s∫O)]",
  scope:"Exact accounting within the shared-parameter model, not causal attribution or evidence of identifiability. Terms are dependent. Undefined normalizations remain null.",
  clock:{tolerance,classes,brackets,
   scope:"Sign changes bracketed between 401 reporting nodes, not refined roots or a complete search. Tolerance is 1e-8 times the larger within-window signal peak, not a biological or assay threshold. Short reversals may be missed."}};
}
