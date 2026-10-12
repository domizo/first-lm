"""Regenerate independent float32 PyTorch oracle for the checked-in demo weights.

Run from the project root with PYTHONPATH=python .venv/bin/python
 tests/generate_parity_fixtures.py. This does not train or download a model.
"""
import json
from pathlib import Path
import torch
from model_lab.model import ModelConfig, TinyTransformer

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'public/runs/demo.json'
if not source.exists():
    source = ROOT / 'runs/demo/bundle.json'
bundle = json.loads(source.read_text())
torch.set_num_threads(2)
config = ModelConfig(**bundle['model'])
vocab = bundle['tokenizer']['vocab']
lookup = {c: i for i, c in enumerate(vocab)}
fixture = {'description': 'PyTorch float32 forward and explicit seeded sampling oracle. Browser float64 forward uses the same architecture; tolerance accounts for floating point arithmetic.', 'model': bundle['model'], 'logits': [], 'samples': []}
with torch.no_grad():
    for cp in bundle['checkpoints']:
        model = TinyTransformer(config)
        model.load_state_dict({name: torch.tensor(weight['data'], dtype=torch.float32).reshape(weight['shape']) for name, weight in cp['weights'].items()})
        model.eval()
        for prompt in ['', 'the cat', 'ねこは', 'the fox is in the forest. the fox sees a blue flower.', '未知🙂', 'the cat is in the garden. ' * 5]:
            ids = [1] + [lookup.get(c, 0) for c in prompt]
            logits = model(torch.tensor([ids[-config.blockSize:]], dtype=torch.long))[0][0, -1].tolist()
            fixture['logits'].append({'step': cp['step'], 'prompt': prompt, 'ids': ids, 'logits': logits})
        for prompt in ['the cat', 'ねこは']:
            for temp, top_k, seed in [(0, 12, 7), (.8, 12, 7), (1.2, 0, 4294967295)]:
                output = model.generate(vocab, prompt, temperature=temp, top_k=top_k, seed=seed, max_new_tokens=32)
                fixture['samples'].append({'step': cp['step'], 'prompt': prompt, 'options': {'temperature': temp, 'topK': top_k, 'seed': seed, 'maxNewTokens': 32}, 'output': output})
(ROOT / 'tests/fixtures/pytorch-parity.json').write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + '\n')
print('Wrote', len(fixture['logits']), 'logit cases and', len(fixture['samples']), 'sampling cases')
