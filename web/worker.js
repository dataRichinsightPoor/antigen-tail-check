import {parsePopulation,compare,sweep} from "./model.js";
self.onmessage=({data})=>{
 try {
  const a=parsePopulation(data.a),b=parsePopulation(data.b),c=data.config;
  const r=compare(a,b,c);
  self.postMessage({a,b,c,r,series:sweep(a,b,c)});
 } catch(error) {
  self.postMessage({error:error.message});
 }
};
