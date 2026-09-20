// Original conceptual schematics. No measured geometry or kinetic parameters.
const esc=s=>String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll('"',"&quot;");
export function pairingSVG(light=false){
 const bg=light?"#ffffff":"#171f24",fg=light?"#172b33":"#e4e7e8",muted=light?"#48606a":"#a9b6bf",x=light?"#126b7f":"#94c9d3",y=light?"#9b5011":"#e4ad75",edge=light?"#becacb":"#526571";
 const cell=(cx,cy,xx,yy)=>`<circle cx="${cx}" cy="${cy}" r="42" fill="none" stroke="${edge}" stroke-width="2"/>
 ${xx?`<circle cx="${cx-24}" cy="${cy-33}" r="9" fill="${x}"/><text x="${cx-38}" y="${cy-49}" fill="${x}" font-size="17">X</text>`:""}
 ${yy?`<rect x="${cx+20}" y="${cy-38}" width="17" height="17" fill="${y}"/><text x="${cx+31}" y="${cy-49}" fill="${y}" font-size="17">Y</text>`:""}
 <text x="${cx}" y="${cy+5}" text-anchor="middle" fill="${fg}" font-size="16">${xx&&yy?"X + Y":xx?"X only":yy?"Y only":"Neither"}</text>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 330" role="img" aria-labelledby="pair-title pair-desc">
 <title id="pair-title">Matched marginals, opposite pairing</title><desc id="pair-desc">Synthetic A has half double-high and half double-low cells. B has half X-only and half Y-only cells. Both have identical X and Y marginals. Fractions are illustrative, not therapeutic response.</desc>
 <rect width="900" height="330" rx="4" fill="${bg}"/><g font-family="sans-serif">
 <text x="25" y="35" fill="${fg}" font-size="22">A · targets together</text><text x="480" y="35" fill="${fg}" font-size="22">B · targets apart</text>
 ${cell(120,139,true,true)}${cell(310,139,false,false)}${cell(570,139,true,false)}${cell(760,139,false,true)}
 <g fill="${muted}" font-size="18" text-anchor="middle"><text x="120" y="211">50% of cells</text><text x="310" y="211">50% of cells</text><text x="570" y="211">50% of cells</text><text x="760" y="211">50% of cells</text></g>
 <path d="M445 20V260" stroke="${edge}" stroke-dasharray="4 5"/><g fill="${fg}" font-size="20"><text x="25" y="259">Double-high: 50%</text><text x="480" y="259">Double-high: 0%</text></g>
 <text x="25" y="305" fill="${muted}" font-size="17">Same single-target histograms. Different same-cell combinations. Synthetic illustration.</text></g></svg>`;
}
export function mechanismSVG(evidence={},light=false){
 const bg=light?"#ffffff":"#171f24",box=light?"#e9eeed":"#1d272e",fg=light?"#172b33":"#e4e7e8",muted=light?"#48606a":"#a9b6bf",edge=light?"#71858e":"#8396a3",accent=light?"#126b7f":"#94c9d3";
 const labels={"not supplied":"Not supplied","user-reported measurement":"Reported measurement","assumption":"Assumption","outside this model":"Outside this model"};
 const node=(id,x,y,title,subtitle)=>`<a href="#evidence-${id}" data-evidence="${id}" aria-label="Record evidence: ${title}"><rect x="${x}" y="${y}" width="205" height="92" rx="4" fill="${box}" stroke="${edge}"/><text x="${x+12}" y="${y+26}" fill="${fg}" font-size="19">${title}</text><text x="${x+12}" y="${y+49}" fill="${muted}" font-size="15">${subtitle}</text><text x="${x+12}" y="${y+75}" fill="${muted}" font-size="15">${esc(labels[evidence[id]?.status]??"Not supplied")}</text></a>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 980 620" role="img" aria-labelledby="mech-title mech-desc">
 <title id="mech-title">From antigen distribution to cell fate</title><desc id="mech-desc">Coexpression is calculated. Local exposure, engagement, uptake, recycling, productive processing, active payload, susceptibility, transfer and toxicity need separate evidence. Solid arrows indicate a possible internalizing route; dashed arrows indicate other or competing routes. This is not an efficacy model. Select a process to record its evidence.</desc>
 <defs><marker id="mech-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${edge}"/></marker></defs>
 <rect width="980" height="620" fill="${bg}"/><g font-family="sans-serif">
 <rect x="20" y="20" width="230" height="90" rx="4" fill="${box}" stroke="${accent}" stroke-width="2"/>
 <text x="34" y="47" fill="${fg}" font-size="20">Coexpression</text><text x="34" y="72" fill="${accent}" font-size="16">Calculated in this audit</text><text x="34" y="96" fill="${muted}" font-size="15">Not co-engagement</text>
 <text x="445" y="43" fill="${fg}" font-size="22">A route map, not a prediction</text><text x="445" y="72" fill="${muted}" font-size="16">Select a process to record its evidence.</text>
 <g fill="none" stroke="${edge}" stroke-width="2" marker-end="url(#mech-arrow)">
 <path d="M225 206H260"/><path d="M465 206H500"/><path d="M705 206H740"/><path d="M842 252V325"/><path d="M740 371H705"/>
 <path d="M250 65H362V160" stroke-dasharray="6 5"/>
 <path d="M580 252V290H362V325" stroke-dasharray="6 5"/>
 <path d="M290 325V252" stroke-dasharray="6 5"/>
 <path d="M842 417V477" stroke-dasharray="6 5"/>
 <path d="M740 523H650V417" stroke-dasharray="6 5"/>
 <path d="M122 252V477" stroke-dasharray="6 5"/>
 </g>
 ${node("exposure",20,160,"Local exposure","Access · duration")}
 ${node("engagement",260,160,"Engagement","Accessible binding")}
 ${node("uptake",500,160,"Uptake","Internalized material")}
 ${node("processing",740,160,"Processing","Productive release")}
 ${node("uptake",260,325,"Recycling","Competing return route")}
 ${node("response",500,325,"Cell fate over time","Growth · death · recovery")}
 ${node("payload",740,325,"Active payload","Escape · target access")}
 ${node("host",20,477,"Host constraints","Exposure / toxicity")}
 ${node("susceptibility",260,477,"Susceptibility","Payload-specific response")}
 ${node("transfer",740,477,"Transfer","Other recipient cells")}
 <path d="M465 523H540V417" fill="none" stroke="${edge}" stroke-width="2" stroke-dasharray="6 5" marker-end="url(#mech-arrow)"/>
 <text x="480" y="601" fill="${muted}" font-size="15" text-anchor="middle">Evidence labels are user-reported. No rate, confidence score or efficacy estimate is calculated.</text>
 </g></svg>`;
}
