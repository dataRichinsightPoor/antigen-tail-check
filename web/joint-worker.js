import {analyzeJoint} from "./joint-model.js";
self.onmessage=({data})=>{
 try {self.postMessage({requestId:data.requestId,report:analyzeJoint(data)});}
 catch(error){self.postMessage({requestId:data.requestId,error:error.message});}
};
