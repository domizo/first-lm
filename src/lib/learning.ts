import {logitsFor,tokenize} from './model';
import type {RunBundle} from './types';
/** Raw training distribution: no temperature, top-k, or generation-only masks. */
export function predictionProbe(bundle:RunBundle,checkpoint:number,prompt:string,target:string){
 const tokenized=tokenize(bundle,prompt),ids=[1,...tokenized.ids];
 const logits=logitsFor(bundle,bundle.checkpoints[checkpoint],ids),max=Math.max(...logits);
 const exp=Array.from(logits,x=>Math.exp(x-max)),sum=exp.reduce((a,b)=>a+b,0);
 const probabilities=exp.map(x=>x/sum),targetId=bundle.tokenizer.vocab.indexOf(target);
 const top=probabilities.map((probability,id)=>({id,token:bundle.tokenizer.vocab[id],probability})).sort((a,b)=>b.probability-a.probability).slice(0,5);
 return {targetId,probability:targetId>=0?probabilities[targetId]:null,loss:targetId>=0?Math.log(sum)+max-logits[targetId]:null,top,unknown:tokenized.unknownCount,context:ids.slice(-bundle.model.blockSize)};
}
export function embeddingProbe(bundle:RunBundle,checkpoint:number,id:number,position:number){
 const {embedDim:d,blockSize}=bundle.model;
 if(!Number.isInteger(id)||id<0||id>=bundle.model.vocabSize||!Number.isInteger(position)||position<0||position>=blockSize)throw Error('Invalid embedding coordinates.');
 const w=bundle.checkpoints[checkpoint].weights;
 return Array.from({length:Math.min(4,d)},(_,i)=>{const token=w['token_embedding.weight'].data[id*d+i],pos=w['position_embedding.weight'].data[position*d+i];return {dimension:i+1,token,position:pos,sum:token+pos};});
}
