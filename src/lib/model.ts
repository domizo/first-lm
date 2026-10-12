import type { RunBundle, ModelConfig, Checkpoint, Probability, GenerationOptions } from './types'

const integer = (x: unknown, min: number, max: number): x is number => Number.isInteger(x) && Number(x) >= min && Number(x) <= max
const finite = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
const object = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)

export function expectedShapes(c: ModelConfig): Record<string, number[]> {
  const d = c.embedDim
  const shapes: Record<string, number[]> = {
    'token_embedding.weight': [c.vocabSize,d], 'position_embedding.weight': [c.blockSize,d],
    'final_norm.weight':[d], 'final_norm.bias':[d],
  }
  for(let l=0;l<c.layers;l++) {
    const p=`blocks.${l}.`
    for(const n of ['ln1','ln2']) {shapes[p+n+'.weight']=[d];shapes[p+n+'.bias']=[d]}
    for(const [n,rows,cols] of [['attn.qkv',3*d,d],['attn.proj',d,d],['fc',4*d,d],['proj',d,4*d]] as const) {
      shapes[p+n+'.weight']=[rows,cols];shapes[p+n+'.bias']=[rows]
    }
  }
  return shapes
}

/** Strict data-only parser. Imported bundles never evaluate code or load pickle. */
export function validateBundle(value: unknown): RunBundle {
  if(!object(value)||value.schemaVersion!==1||value.origin!=='pytorch') throw Error('Expected a version 1 PyTorch run bundle.')
  const c=value.model
  if(!object(c)||!integer(c.vocabSize,4,512)||!integer(c.blockSize,8,96)||(!integer(c.embedDim,16,64)||![16,32,48,64].includes(c.embedDim))||!integer(c.heads,1,8)||![1,2,4,8].includes(c.heads)||Number(c.embedDim)%Number(c.heads)!==0||!integer(c.layers,1,3)) throw Error('Unsupported model dimensions.')
  if(!object(value.tokenizer)||!Array.isArray(value.tokenizer.vocab)||value.tokenizer.vocab.length!==c.vocabSize||value.tokenizer.type!=='character'||value.tokenizer.learnedFrom!=='train_only') throw Error('Invalid tokenizer.')
  const vocab=value.tokenizer.vocab
  if(vocab.slice(0,3).join('|')!=='<unk>|<bos>|<eos>'||vocab.slice(3).some(x=>typeof x!=='string'||Array.from(x).length!==1)||new Set(vocab).size!==vocab.length) throw Error('Invalid character vocabulary.')
  if(!Array.isArray(value.checkpoints)||value.checkpoints.length<1||value.checkpoints.length>8) throw Error('Expected 1–8 checkpoints.')
  const shapes=expectedShapes(c as ModelConfig);let count=0
  const parameters=Object.values(shapes).reduce((n,s)=>n+s.reduce((a,b)=>a*b,1),0)
  if(value.parameterCount!==parameters) throw Error('Parameter count does not match weights.')
  let previous=-1
  for(const cp of value.checkpoints) {
    if(!object(cp)||!integer(cp.step,0,1000)||cp.step<=previous||!object(cp.weights)) throw Error('Invalid checkpoint order.')
    if(previous===-1&&cp.step!==0) throw Error('The first checkpoint must be random initialization at step 0.')
    previous=cp.step
    if(Object.keys(cp.weights).length!==Object.keys(shapes).length) throw Error('Unexpected weight keys.')
    for(const [name,shape] of Object.entries(shapes)) {
      const w=cp.weights[name]
      if(!object(w)||!Array.isArray(w.shape)||w.shape.length!==shape.length||w.shape.some((n,i)=>n!==shape[i])||!Array.isArray(w.data)||w.data.length!==shape.reduce((a,b)=>a*b,1)||w.data.some(x=>!finite(x)||Math.abs(x)>1e4)) throw Error(`Invalid weights: ${name}`)
      count+=w.data.length
      if(count>2_000_000) throw Error('Bundle is too large.')
    }
    if(!Array.isArray(cp.samples)||cp.samples.length>10) throw Error('Invalid sample list.')
    for(const s of cp.samples) if(!object(s)||typeof s.prompt!=='string'||s.prompt.length>2000||typeof s.output!=='string'||s.output.length>4000||!validOptions(s.options)) throw Error('Invalid generation sample.')
  }
  if(!Array.isArray(value.metrics)||value.metrics.length<1||value.metrics.length>1002) throw Error('Invalid metrics.')
  previous=-1
  for(const m of value.metrics) {
    if(!object(m)||!integer(m.step,0,1000)||m.step<=previous||!finite(m.trainLoss)||m.trainLoss<0||!finite(m.validationLoss)||m.validationLoss<0||!finite(m.elapsedSeconds)||m.elapsedSeconds<0) throw Error('Invalid metric values.')
    previous=m.step
  }
  for(const key of ['id','createdAt','status']) if(typeof value[key]!=='string'||(value[key] as string).length>200) throw Error(`Invalid ${key}.`)
  if(!['completed','cancelled','running'].includes(String(value.status))) throw Error('Invalid run status.')
  if(!object(value.dataset)||!object(value.training)||!object(value.environment)||!object(value.baseline)) throw Error('Missing run metadata.')
  for(const key of ['name','license','provenance','sha256','splitMethod','trainPreview','validationPreview','limitations']) if(typeof value.dataset[key]!=='string'||(value.dataset[key] as string).length>20000) throw Error('Invalid dataset metadata.')
  for(const key of ['trainDocuments','validationDocuments','trainTokens','validationTokens','unknownValidationTokens','splitSeed']) if(!integer(value.dataset[key],0,20_000_000)) throw Error('Invalid dataset counts.')
  for(const key of ['python','torch','device','platform']) if(typeof value.environment[key]!=='string'||(value.environment[key] as string).length>1000) throw Error('Invalid environment metadata.')
  const tc=value.training
  if(!integer(tc.steps,1,1000)||!integer(tc.batchSize,1,32)||!integer(tc.seed,0,4294967295)||!integer(tc.evalEvery,1,100)||!finite(tc.learningRate)||tc.learningRate<.0001||tc.learningRate>.02) throw Error('Invalid training config.')
  for(const key of ['blockSize','embedDim','heads','layers']) if(tc[key]!==c[key]) throw Error('Training config does not match model.')
  if(previous>tc.steps) throw Error('Metrics exceed target steps.')
  if(Number((value.checkpoints[value.checkpoints.length-1] as Record<string,unknown>).step)>previous) throw Error('Checkpoint exceeds the measured steps.')
  if(value.baseline.type!=='bigram'||!finite(value.baseline.trainLoss)||!finite(value.baseline.validationLoss)||!finite(value.baseline.smoothing)) throw Error('Invalid baseline.')
  return value as unknown as RunBundle
}

function validOptions(x:unknown):x is GenerationOptions {
  return object(x)&&finite(x.temperature)&&x.temperature>=0&&x.temperature<=2&&integer(x.topK,0,512)&&integer(x.seed,0,4294967295)&&integer(x.maxNewTokens,1,160)
}
export function tokenize(bundle: RunBundle,text:string) {
  const map=new Map(bundle.tokenizer.vocab.map((t,i)=>[t,i]))
  const tokens=Array.from(text).map(text=>({text,id:map.get(text)??0,unknown:!map.has(text)}))
  return {tokens,ids:tokens.map(t=>t.id),unknownCount:tokens.filter(t=>t.unknown).length}
}
function linear(x:Float64Array,rows:number,cols:number,w:number[],b?:number[]):Float64Array {
  const y=new Float64Array(rows)
  for(let r=0;r<rows;r++) {let n=b?.[r]??0;for(let k=0;k<cols;k++) n+=x[k]*w[r*cols+k];y[r]=n}
  return y
}
function norm(x:Float64Array,w:number[],b:number[]):Float64Array {
  let mean=0;for(const v of x)mean+=v;mean/=x.length
  let variance=0;for(const v of x)variance+=(v-mean)**2;variance/=x.length
  return Float64Array.from(x,(v,i)=>(v-mean)/Math.sqrt(variance+1e-5)*w[i]+b[i])
}
function softmax(x:Float64Array):Float64Array {
  const max=Math.max(...x); const p=Float64Array.from(x,v=>Math.exp(v-max));let total=0;for(const v of p)total+=v
  return p.map(v=>v/total)
}
/** Exact same architecture as Python. No remote API and no model download. */
export function logitsFor(bundle:RunBundle,checkpoint:Checkpoint,ids:number[]):Float64Array {
  const c=bundle.model,d=c.embedDim,headDim=d/c.heads,context=ids.slice(-c.blockSize),t=context.length,w=checkpoint.weights
  if(t===0||context.some(i=>!integer(i,0,c.vocabSize-1)))throw Error('Invalid context tokens.')
  let x=context.map((id,pos)=>Float64Array.from({length:d},(_,i)=>w['token_embedding.weight'].data[id*d+i]+w['position_embedding.weight'].data[pos*d+i]))
  for(let l=0;l<c.layers;l++) {
    const p=`blocks.${l}.`
    const qkv=x.map(row=>linear(norm(row,w[p+'ln1.weight'].data,w[p+'ln1.bias'].data),3*d,d,w[p+'attn.qkv.weight'].data,w[p+'attn.qkv.bias'].data))
    const attended=x.map((_,i)=>{
      const cat=new Float64Array(d)
      for(let h=0;h<c.heads;h++) {
        const scores=new Float64Array(i+1)
        for(let j=0;j<=i;j++) {let s=0;for(let k=0;k<headDim;k++) s+=qkv[i][h*headDim+k]*qkv[j][d+h*headDim+k];scores[j]=s/Math.sqrt(headDim)}
        const probs=softmax(scores)
        for(let k=0;k<headDim;k++)for(let j=0;j<=i;j++)cat[h*headDim+k]+=probs[j]*qkv[j][2*d+h*headDim+k]
      }
      return linear(cat,d,d,w[p+'attn.proj.weight'].data,w[p+'attn.proj.bias'].data)
    })
    x=x.map((row,i)=>Float64Array.from(row,(v,k)=>v+attended[i][k]))
    x=x.map(row=>{
      const hidden=linear(norm(row,w[p+'ln2.weight'].data,w[p+'ln2.bias'].data),4*d,d,w[p+'fc.weight'].data,w[p+'fc.bias'].data)
      const gelu=hidden.map(v=>.5*v*(1+Math.tanh(Math.sqrt(2/Math.PI)*(v+.044715*v**3))))
      const out=linear(gelu,d,4*d,w[p+'proj.weight'].data,w[p+'proj.bias'].data)
      return Float64Array.from(row,(v,i)=>v+out[i])
    })
  }
  return linear(norm(x[t-1],w['final_norm.weight'].data,w['final_norm.bias'].data),c.vocabSize,d,w['token_embedding.weight'].data)
}
function mulberry32(seed:number) {return ()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
export function distribution(logits:Float64Array,options:GenerationOptions):Float64Array {
  const x=logits.slice();x[0]=x[1]=-Infinity
  if(options.temperature===0){const p=new Float64Array(x.length);p[x.indexOf(Math.max(...x))]=1;return p}
  for(let i=0;i<x.length;i++)x[i]/=options.temperature
  if(options.topK>0) {
    const order=Array.from(x,(_,i)=>i).sort((a,b)=>x[b]-x[a]||a-b)
    for(const id of order.slice(options.topK))x[id]=-Infinity
  }
  return softmax(x)
}
export async function generate(bundle:RunBundle,checkpointIndex:number,prompt:string,options:GenerationOptions) {
  if(!validOptions(options))throw Error('Invalid generation settings.')
  if(Array.from(prompt).length>500)throw Error('Prompt is limited to 500 characters.')
  const checkpoint=bundle.checkpoints[checkpointIndex];if(!checkpoint)throw Error('Checkpoint does not exist.')
  const {ids}=tokenize(bundle,prompt),tokenIds=[1,...ids],random=mulberry32(options.seed)
  let output=prompt;let probabilities:Probability[]=[]
  for(let n=0;n<options.maxNewTokens;n++) {
    const probs=distribution(logitsFor(bundle,checkpoint,tokenIds),options)
    if(n===0) probabilities=Array.from(probs,(probability,id)=>({id,token:bundle.tokenizer.vocab[id],probability})).sort((a,b)=>b.probability-a.probability).slice(0,12)
    let roll=random(),id=probs.length-1
    for(let i=0;i<probs.length;i++){roll-=probs[i];if(roll<0){id=i;break}}
    tokenIds.push(id);if(id===2)break;output+=bundle.tokenizer.vocab[id]
    if(n%4===0)await new Promise(resolve=>setTimeout(resolve,0))
  }
  return {output,probabilities,tokenIds}
}
