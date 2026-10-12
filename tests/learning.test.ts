import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {parseRoute,chapterIds,labHref,learnHref} from '../src/lib/routes';
import {embeddingProbe,predictionProbe} from '../src/lib/learning';
import {validateBundle} from '../src/lib/model';
const bundle=validateBundle(JSON.parse(readFileSync(new URL('../public/runs/demo.json',import.meta.url),'utf8')));
const oracle=JSON.parse(readFileSync(new URL('./fixtures/pytorch-parity.json',import.meta.url),'utf8')) as {logits:{step:number;prompt:string;logits:number[]}[]};
describe('learning routes',()=>{
 it('accepts every chapter and lab step without server routing',()=>{for(const chapter of chapterIds)expect(parseRoute(learnHref(chapter))).toEqual({kind:'learn',chapter});for(const step of [0,1,2,3] as const)expect(parseRoute(labHref(step))).toEqual({kind:'lab',step});});
 it('does not interpret arbitrary hashes as navigation or code',()=>{for(const value of ['', '#main-content','#/learn/nope','#/lab/4','#/learn/<script>','javascript:alert(1)'])expect(parseRoute(value)).toBeNull();});
});
describe('real teaching probes',()=>{
 for(const [i,fixture] of oracle.logits.entries())it(`matches PyTorch single-target loss for fixture ${i}`,()=>{
  const checkpoint=bundle.checkpoints.findIndex(x=>x.step===fixture.step),target='c',id=bundle.tokenizer.vocab.indexOf(target);
  const max=Math.max(...fixture.logits),sum=fixture.logits.reduce((n,x)=>n+Math.exp(x-max),0),expected=Math.log(sum)+max-fixture.logits[id];
  const actual=predictionProbe(bundle,checkpoint,fixture.prompt,target);
  expect(actual.loss).toBeCloseTo(expected,4);expect(actual.probability).toBeCloseTo(Math.exp(-expected),5);expect(actual.top.length).toBe(5);
 });
 it('does not turn an unknown target into a known loss',()=>{const p=predictionProbe(bundle,0,'🦄','🦄');expect(p.targetId).toBe(-1);expect(p.probability).toBeNull();expect(p.loss).toBeNull();expect(p.unknown).toBe(1);});
 it('shows actual token + position entries at every checkpoint',()=>{for(let cp=0;cp<bundle.checkpoints.length;cp++)for(const position of [0,1,4])for(const row of embeddingProbe(bundle,cp,1,position)){const w=bundle.checkpoints[cp].weights;expect(row.token).toBe(w['token_embedding.weight'].data[48+row.dimension-1]);expect(row.position).toBe(w['position_embedding.weight'].data[position*48+row.dimension-1]);expect(row.sum).toBe(row.token+row.position);}});
 it('rejects out-of-range embedding indices',()=>{expect(()=>embeddingProbe(bundle,0,-1,0)).toThrow();expect(()=>embeddingProbe(bundle,0,1,48)).toThrow();});
 it('uses only the last context window',()=>{const p=predictionProbe(bundle,0,'the '.repeat(30),'c');expect(p.context).toHaveLength(48);});
});
