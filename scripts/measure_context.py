"""Paired held-out next-token evaluation: identical positions, different context caps."""
import json,sys,math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'python'))
import numpy as np,torch
from model_lab.data import prepare_dataset
from model_lab.model import TinyTransformer,ModelConfig
root=Path(__file__).resolve().parents[1]
bundle=json.loads((root/'public/runs/demo.json').read_text())
model=TinyTransformer(ModelConfig(**bundle['model']));torch.set_num_threads(2)
weights={name:torch.tensor(w['data']).reshape(w['shape']) for name,w in bundle['checkpoints'][-1]['weights'].items()};model.load_state_dict(weights);model.eval()
ds=prepare_dataset();candidates=[(i,j) for i,doc in enumerate(ds.validation) for j in range(1,len(doc))]
rng=np.random.default_rng(718);positions=[candidates[i] for i in rng.choice(len(candidates),size=512,replace=False)]
result={'runId':bundle['id'],'checkpointStep':bundle['checkpoints'][-1]['step'],'datasetSha256':bundle['dataset']['sha256'],'positionSeed':718,'positions':512,'metric':'mean next-token negative log likelihood, natural logarithm','experiments':[]}
with torch.no_grad():
 for cap in (8,24,48):
  losses=[]
  for d,j in positions:
   doc=ds.validation[d];context=doc[max(0,j-cap):j]
   logits=model(torch.tensor([context]))[0][0,-1]
   losses.append(float(torch.nn.functional.cross_entropy(logits[None],torch.tensor([doc[j]]))))
  result['experiments'].append({'contextCap':cap,'loss':sum(losses)/len(losses)})
(root/'docs/context-experiment.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
