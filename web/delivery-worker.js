import {runDelivery} from "./delivery-model.js";
self.onmessage=({data})=>{
 try{self.postMessage({id:data.id,report:runDelivery(data.parameters)});}
 catch(e){self.postMessage({id:data.id,error:e.message});}
};
