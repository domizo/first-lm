"""Check the supported Python runtime against the immutable recorded-run oracle."""
import json,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'python'))
import torch
from model_lab.model import ModelConfig,TinyTransformer

ROOT=Path(__file__).resolve().parents[1]
class RecordedParityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        torch.set_num_threads(2)
        cls.bundle=json.loads((ROOT/'public/runs/demo.json').read_text())
        cls.oracle=json.loads((ROOT/'tests/fixtures/pytorch-parity.json').read_text())
        cls.models={}
        for cp in cls.bundle['checkpoints']:
            model=TinyTransformer(ModelConfig(**cls.bundle['model']))
            model.load_state_dict({name:torch.tensor(w['data'],dtype=torch.float32).reshape(w['shape']) for name,w in cp['weights'].items()})
            model.eval();cls.models[cp['step']]=model
    def test_saved_checkpoint_logits_match_recorded_float32_oracle(self):
        with torch.no_grad():
            for case in self.oracle['logits']:
                with self.subTest(step=case['step'],prompt=case['prompt']):
                    ids=case['ids'][-self.bundle['model']['blockSize']:]
                    logits=self.models[case['step']](torch.tensor([ids],dtype=torch.long))[0][0,-1]
                    torch.testing.assert_close(logits,torch.tensor(case['logits']),rtol=0,atol=2e-5)
    def test_seeded_sampling_matches_recorded_oracle(self):
        for case in self.oracle['samples']:
            o=case['options']
            with self.subTest(step=case['step'],prompt=case['prompt'],options=o):
                actual=self.models[case['step']].generate(self.bundle['tokenizer']['vocab'],case['prompt'],temperature=o['temperature'],top_k=o['topK'],seed=o['seed'],max_new_tokens=o['maxNewTokens'])
                self.assertEqual(actual,case['output'])
