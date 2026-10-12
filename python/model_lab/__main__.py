import argparse,json,sys
from pathlib import Path
from .train import TrainConfig,train
from .data import parse_corpus,original_corpus

def main():
    parser=argparse.ArgumentParser(description='first-lm: a real, tiny language model from random initialization')
    sub=parser.add_subparsers(dest='command',required=True)
    fit=sub.add_parser('train');fit.add_argument('--output',type=Path,default=Path('runs/local'));fit.add_argument('--corpus',type=Path);fit.add_argument('--resume',action='store_true')
    for name,field in TrainConfig.__dataclass_fields__.items():
        fit.add_argument('--'+''.join('-'+c.lower() if c.isupper() else c for c in name),dest=name,type=type(field.default),default=field.default)
    serve=sub.add_parser('serve');serve.add_argument('--port',type=int,default=8765)
    corpus=sub.add_parser('corpus');corpus.add_argument('--output',type=Path,default=Path('data/corpus.txt'))
    args=parser.parse_args()
    if args.command=='train':
        config=TrainConfig(**{k:getattr(args,k) for k in TrainConfig.__dataclass_fields__})
        docs=parse_corpus(args.corpus.read_text()) if args.corpus else None
        if args.resume and docs is None:
            import torch
            docs=torch.load(args.output/'checkpoint.pt',map_location='cpu',weights_only=True)['docs']
        def update(bundle):
            m=bundle['metrics'][-1];print(f"step {m['step']:4d} train {m['trainLoss']:.4f} validation {m['validationLoss']:.4f} time {m['elapsedSeconds']:.1f}s",flush=True)
        result=train(config,args.output,docs,on_update=update,resume=args.resume)
        print(json.dumps({'status':result['status'],'parameters':result['parameterCount'],'bundle':str(args.output/'bundle.json')}))
    elif args.command=='serve':
        import uvicorn
        from .server import app
        uvicorn.run(app,host='127.0.0.1',port=args.port)
    else:
        args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text('\n'.join(original_corpus()));print(args.output)
if __name__=='__main__':main()
