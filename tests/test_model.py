import json,sys,tempfile,threading,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'python'))
import numpy as np
import torch
from model_lab.data import prepare_dataset,batch,parse_corpus
from model_lab.model import TinyTransformer,ModelConfig
from model_lab.train import train,TrainConfig

class ModelTests(unittest.TestCase):
    def setUp(self):torch.set_num_threads(2)
    def test_split_and_train_only_vocabulary(self):
        docs=[f'common text {i}'+chr(0x400+i) for i in range(20)]
        ds=prepare_dataset(docs)
        self.assertFalse(set(ds.train_docs)&set(ds.validation_docs))
        heldout_only=set(''.join(ds.validation_docs))-set(''.join(ds.train_docs))
        self.assertTrue(heldout_only);self.assertTrue(all(c not in ds.vocab for c in heldout_only));self.assertGreater(ds.metadata['unknownValidationTokens'],0)
    def test_no_future_attention(self):
        torch.manual_seed(1);m=TinyTransformer(ModelConfig(20,16,16,2,1));a=torch.tensor([[1,3,4,5,6]]);b=torch.tensor([[1,3,4,12,13]])
        torch.testing.assert_close(m(a)[0][:,:3],m(b)[0][:,:3],rtol=0,atol=0)
    def test_parameter_export_count(self):
        m=TinyTransformer(ModelConfig(20,16,16,2,1));self.assertEqual(sum(len(x['data']) for x in m.export_weights().values()),m.parameter_count)
    def test_config_bounded(self):
        for kwargs in ({'steps':1001},{'layers':8},{'embedDim':2048},{'heads':3},{'learningRate':float('nan')},{'steps':True}):
            with self.assertRaises(ValueError):TrainConfig(**kwargs).validate()
    def test_corpus_limits(self):
        with self.assertRaises(ValueError):parse_corpus('a'*100001)
        with self.assertRaises(ValueError):parse_corpus('only one document')
    def test_training_cancel_resume_matches_uninterrupted(self):
        config=dict(steps=8,evalEvery=2,embedDim=16,heads=2,layers=1,blockSize=16,batchSize=4)
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);stop=threading.Event()
            def update(b):
                if b['metrics'][-1]['step']>=4:stop.set()
            part=train(TrainConfig(**config),root/'part',cancel=stop,on_update=update)
            self.assertEqual(part['status'],'cancelled');self.assertEqual(part['metrics'][-1]['step'],4)
            resumed=train(TrainConfig(**config),root/'part',resume=True)
            full=train(TrainConfig(**config),root/'full')
            self.assertEqual(resumed['status'],'completed')
            self.assertEqual(resumed['checkpoints'][-1]['weights'],full['checkpoints'][-1]['weights'])
    def test_seed_reproducibility(self):
        torch.manual_seed(7);a=TinyTransformer(ModelConfig(20,16,16,2,1));torch.manual_seed(7);b=TinyTransformer(ModelConfig(20,16,16,2,1))
        self.assertEqual(a.export_weights(),b.export_weights())

if __name__=='__main__':unittest.main()
