from __future__ import annotations
from dataclasses import dataclass,asdict
from datetime import datetime,timezone
import json, os, platform, time
from pathlib import Path
from threading import Event
import numpy as np
import torch
from .data import prepare_dataset,batch,bigram_baseline
from .model import ModelConfig,TinyTransformer

@dataclass
class TrainConfig:
    steps:int=600
    batchSize:int=16
    learningRate:float=.003
    seed:int=42
    blockSize:int=48
    embedDim:int=48
    heads:int=4
    layers:int=2
    evalEvery:int=50
    def validate(self):
        for k in ('steps','batchSize','seed','blockSize','embedDim','heads','layers','evalEvery'):
            if type(getattr(self,k)) is not int: raise ValueError(f'{k} must be an integer')
        if not 1<=self.steps<=1000: raise ValueError('steps must be 1–1000')
        if not 1<=self.batchSize<=32: raise ValueError('batchSize must be 1–32')
        if not 8<=self.blockSize<=96: raise ValueError('blockSize must be 8–96')
        if self.embedDim not in (16,32,48,64): raise ValueError('embedDim must be 16, 32, 48 or 64')
        if self.heads not in (1,2,4,8) or self.embedDim%self.heads: raise ValueError('heads must divide embedDim')
        if not 1<=self.layers<=3: raise ValueError('layers must be 1–3')
        if not isinstance(self.learningRate,(int,float)) or not .0001<=self.learningRate<=.02: raise ValueError('learningRate must be .0001–.02')
        if not 0<=self.seed<=4294967295: raise ValueError('seed must be 0–4294967295')
        if not 1<=self.evalEvery<=100: raise ValueError('evalEvery must be 1–100')
        return self


def atomic_json(path,value):
    temp=path.with_suffix('.tmp'); temp.write_text(json.dumps(value,ensure_ascii=False,separators=(',',':'),allow_nan=False)); temp.replace(path)


def train(config:TrainConfig,output_dir:Path,docs=None,cancel:Event|None=None,on_update=None,resume=False):
    config.validate(); output_dir=Path(output_dir); output_dir.mkdir(parents=True,exist_ok=True)
    torch.set_num_threads(2); torch.use_deterministic_algorithms(True); torch.manual_seed(config.seed)
    dataset=prepare_dataset(docs)
    mc=ModelConfig(len(dataset.vocab),config.blockSize,config.embedDim,config.heads,config.layers)
    model=TinyTransformer(mc); optimizer=torch.optim.AdamW(model.parameters(),lr=config.learningRate,weight_decay=.01)
    rng=np.random.default_rng(config.seed); eval_rng=np.random.default_rng(2025)
    eval_batches={name:[batch(ds,16,config.blockSize,eval_rng) for _ in range(8)] for name,ds in [('train',dataset.train),('validation',dataset.validation)]}
    started=time.monotonic(); elapsed_prior=0.; first_step=0
    bundle=dict(schemaVersion=1,id=output_dir.name,createdAt=datetime.now(timezone.utc).isoformat(),status='running',origin='pytorch',
        model=asdict(mc),training=asdict(config),parameterCount=model.parameter_count,
        tokenizer={'type':'character','vocab':dataset.vocab,'special':{'unk':0,'bos':1,'eos':2},'learnedFrom':'train_only'},
        dataset=dataset.metadata,environment={'python':platform.python_version(),'torch':str(torch.__version__),'device':'cpu','threads':2,'platform':platform.platform()},
        metrics=[],checkpoints=[],baseline=bigram_baseline(dataset,eval_batches))
    if resume:
        state=torch.load(output_dir/'checkpoint.pt',map_location='cpu',weights_only=True)
        old=state['config']
        if any(old[k]!=asdict(config)[k] for k in old if k not in ('steps','evalEvery')): raise ValueError('Resume preserves all settings except target steps and evaluation interval.')
        if state['datasetHash']!=dataset.metadata['sha256']: raise ValueError('Cannot resume with a different corpus.')
        first_step=state['step']
        if config.steps<=first_step: raise ValueError(f'Target steps must exceed the saved step ({first_step}).')
        model.load_state_dict(state['model']); optimizer.load_state_dict(state['optimizer']); torch.set_rng_state(state['torchRng'])
        rng.bit_generator.state=json.loads(state['numpyRng'])
        bundle=json.loads((output_dir/'bundle.json').read_text()); bundle['status']='running'; bundle['training']=asdict(config)
        elapsed_prior=bundle['metrics'][-1]['elapsedSeconds']
    snapshots={0,config.steps//3,2*config.steps//3,config.steps}
    @torch.no_grad()
    def evaluate():
        model.eval(); losses={}
        for name,batches in eval_batches.items():
            total=0.;count=0
            for x,y in batches:
                yy=torch.from_numpy(y); _,loss=model(torch.from_numpy(x),yy); n=int((yy!=-100).sum())
                total+=float(loss)*n;count+=n
            losses[name]=total/count
        return losses
    def record(step,snapshot=False):
        values=evaluate()
        if not np.isfinite(list(values.values())).all(): raise ValueError('Training became non-finite; reduce learning rate.')
        metric={'step':step,'trainLoss':values['train'],'validationLoss':values['validation'],'elapsedSeconds':round(elapsed_prior+time.monotonic()-started,3)}
        if bundle['metrics'] and bundle['metrics'][-1]['step']==step: bundle['metrics'][-1]=metric
        else: bundle['metrics'].append(metric)
        if snapshot and not any(x['step']==step for x in bundle['checkpoints']):
            opts={'temperature':.8,'topK':12,'seed':7,'maxNewTokens':70}
            samples=[{'prompt':p,'output':model.generate(dataset.vocab,p,temperature=opts['temperature'],top_k=opts['topK'],seed=opts['seed'],max_new_tokens=opts['maxNewTokens']),'options':opts} for p in ('the cat','ねこは')]
            bundle['checkpoints'].append({'step':step,'weights':model.export_weights(),'samples':samples})
            # Keep random initialization and the latest seven real snapshots.
            if len(bundle['checkpoints'])>8: bundle['checkpoints']=[bundle['checkpoints'][0]]+bundle['checkpoints'][-7:]
        if on_update and bundle['status']=='running': on_update(bundle)
    def save(step):
        state={'model':model.state_dict(),'optimizer':optimizer.state_dict(),'step':step,'config':asdict(config),'datasetHash':dataset.metadata['sha256'],'torchRng':torch.get_rng_state(),'numpyRng':json.dumps(rng.bit_generator.state),'docs':dataset.docs}
        temp=output_dir/'checkpoint.tmp';torch.save(state,temp);temp.replace(output_dir/'checkpoint.pt')
        atomic_json(output_dir/'bundle.json',bundle)
    if not resume: record(0,True);save(0)
    step=first_step
    try:
        for step in range(first_step+1,config.steps+1):
            if (cancel and cancel.is_set()) or time.monotonic()-started>900:
                step-=1;bundle['status']='cancelled';break
            model.train(); x,y=batch(dataset.train,config.batchSize,config.blockSize,rng)
            _,loss=model(torch.from_numpy(x),torch.from_numpy(y));optimizer.zero_grad(set_to_none=True);loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(),1.0);optimizer.step()
            if step%config.evalEvery==0 or step in snapshots:
                record(step,step in snapshots);save(step)
        else: bundle['status']='completed'
        record(step,True);save(step)
    except BaseException:
        # Keep the most recent valid checkpoint. Never overwrite it with corrupt tensors.
        raise
    if on_update:on_update(bundle)
    return bundle
