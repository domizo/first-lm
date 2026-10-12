"""Loopback-only companion. Serves the built lab and one bounded training job."""
from __future__ import annotations
import json, threading, uuid, re
from pathlib import Path
from dataclasses import asdict
from urllib.parse import urlparse
from fastapi import FastAPI,Request,HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from .train import TrainConfig,train,atomic_json
from .data import parse_corpus,original_corpus,prepare_dataset

ROOT=Path(__file__).resolve().parents[2]
RUNS=ROOT/'runs'; RUNS.mkdir(exist_ok=True)
app=FastAPI(title='first-lm loopback companion',docs_url=None,redoc_url=None)
lock=threading.Lock();cancel_event=threading.Event()
state={'status':'idle','metrics':[]}
current_dir=None
job_thread=None
# Only resume app-created paths, never an imported browser artifact or caller path.
latest=RUNS/'latest.json'
if latest.exists():
    try:
        pointer=json.loads(latest.read_text());name=pointer['runId']
        if not re.fullmatch(r'run-[a-f0-9]{12}',name):raise ValueError('Invalid saved run ID')
        directory=RUNS/name
        if (directory/'checkpoint.pt').is_file() and (directory/'bundle.json').is_file():
            saved_bundle=json.loads((directory/'bundle.json').read_text())
            current_dir=directory
            if saved_bundle['status']=='running':saved_bundle['status']='cancelled'
            state.update(status=saved_bundle['status'],runId=name,metrics=saved_bundle['metrics'],bundle=saved_bundle,config=saved_bundle['training'])
    except (ValueError,KeyError,OSError):pass

@app.on_event('shutdown')
def shutdown():
    cancel_event.set()
    if job_thread is not None:job_thread.join(timeout=15)

@app.middleware('http')
async def local_only(request:Request,call_next):
    host=request.headers.get('host','').split(':')[0]
    if host not in ('127.0.0.1','localhost'): return JSONResponse({'detail':'Loopback hosts only.'},status_code=403)
    origin=request.headers.get('origin')
    if origin:
        try:
            parsed=urlparse(origin)
            allowed=parsed.scheme=='http' and parsed.hostname in ('127.0.0.1','localhost') and (parsed.netloc==request.headers.get('host') or parsed.port==5173)
        except ValueError:allowed=False
        if not allowed:return JSONResponse({'detail':'Cross-origin requests are not allowed.'},status_code=403)
    if request.url.path.startswith('/api/') and request.method=='POST':
        if request.headers.get('content-type','').split(';')[0]!='application/json': return JSONResponse({'detail':'application/json required.'},status_code=415)
        try:
            if int(request.headers.get('content-length','0'))>110_000: return JSONResponse({'detail':'Request too large.'},status_code=413)
        except ValueError:return JSONResponse({'detail':'Invalid content length.'},status_code=400)
        chunks=[];size=0
        async for chunk in request.stream():
            size+=len(chunk)
            if size>110_000:return JSONResponse({'detail':'Request too large.'},status_code=413)
            chunks.append(chunk)
        request._body=b''.join(chunks)
    response=await call_next(request)
    response.headers['X-Content-Type-Options']='nosniff'
    response.headers['Referrer-Policy']='no-referrer'
    response.headers['Content-Security-Policy']="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; object-src 'none'"
    return response

@app.get('/api/health')
def health(): return {'status':'ok','engine':'pytorch','device':'cpu','version':1}

@app.get('/api/dataset')
def dataset():
    with lock:directory=current_dir
    if directory is not None and (directory/'checkpoint.pt').is_file():
        import torch
        saved=torch.load(directory/'checkpoint.pt',map_location='cpu',weights_only=True)
        return {'text':'\n'.join(saved['docs'])}
    return {'text':'\n'.join(original_corpus())}

@app.get('/api/status')
def status():
    with lock: return dict(state,metrics=list(state['metrics']))

@app.get('/api/bundle')
def bundle():
    with lock:
        if state['status']=='running': raise HTTPException(409,'Wait for this run to finish or cancel.')
        if 'bundle' not in state: raise HTTPException(404,'No completed run yet.')
        return state['bundle']

@app.post('/api/cancel')
def cancel():
    with lock:
        if state['status']!='running': raise HTTPException(409,'There is no active run.')
        cancel_event.set()
    return {'status':'cancelling'}

@app.post('/api/train',status_code=202)
async def start(request:Request):
    global current_dir,job_thread
    try:
        payload=await request.json()
        if not isinstance(payload,dict):raise ValueError('Expected a JSON object.')
        if set(payload)-set(TrainConfig.__dataclass_fields__)-{'corpus','resume'}:raise ValueError('Unexpected training option.')
        resume=payload.pop('resume',False)
        if type(resume) is not bool:raise ValueError('resume must be boolean.')
        corpus=payload.pop('corpus',None)
        docs=parse_corpus(corpus) if corpus is not None else None
        config=TrainConfig(**payload).validate()
        if docs is not None:prepare_dataset(docs)
    except (ValueError,TypeError,json.JSONDecodeError) as exc:raise HTTPException(422,str(exc)) from exc
    with lock:
        if state['status']=='running':raise HTTPException(409,'A training run is already active.')
        if resume:
            if current_dir is None or not (current_dir/'checkpoint.pt').exists():raise HTTPException(409,'No local checkpoint available to resume.')
            import torch
            saved=torch.load(current_dir/'checkpoint.pt',map_location='cpu',weights_only=True)
            if docs is None:docs=saved['docs']
            old=saved['config']
            if any(old[k]!=getattr(config,k) for k in old if k not in ('steps','evalEvery')):raise HTTPException(422,'Resume preserves all settings except target steps and evaluation interval.')
            if config.steps<=saved['step']:raise HTTPException(422,f"Target steps must exceed saved step {saved['step']}.")
        else:current_dir=RUNS/('run-'+uuid.uuid4().hex[:12])
        out=current_dir
        state.clear();state.update(status='running',runId=out.name,metrics=[],config=asdict(config))
        cancel_event.clear()
    def update(result):
        with lock:
            if state.get('runId')!=out.name:return
            if (out/'checkpoint.pt').is_file() and (out/'bundle.json').is_file():atomic_json(latest,{'runId':out.name})
            state['metrics']=list(result['metrics'])
            if result['status']!='running':state.update(status=result['status'],bundle=result)
    def work():
        try:train(config,out,docs,cancel=cancel_event,on_update=update,resume=resume)
        except Exception as exc:
            with lock:
                if state.get('runId')==out.name:state.update(status='failed',error=str(exc))
    job_thread=threading.Thread(target=work,name='first-lm-trainer',daemon=True)
    job_thread.start()
    return {'status':'running','runId':out.name}

if (ROOT/'dist').exists():app.mount('/',StaticFiles(directory=ROOT/'dist',html=True),name='lab')
