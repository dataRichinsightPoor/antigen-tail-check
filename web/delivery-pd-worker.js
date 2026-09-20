import {runPD} from "./delivery-pd-model.js";
self.onmessage=({data})=>{
 try{self.postMessage({id:data.id,result:runPD(data.report,data.parameters)});}
 catch(e){self.postMessage({id:data.id,error:e.message});}
};
