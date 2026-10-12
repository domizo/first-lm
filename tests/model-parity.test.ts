import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generate, logitsFor, tokenize, validateBundle } from '../src/lib/model';
import type { GenerationOptions } from '../src/lib/types';

const raw = JSON.parse(readFileSync(new URL('../public/runs/demo.json', import.meta.url), 'utf8'));
const bundle = validateBundle(raw);
const oracle = JSON.parse(readFileSync(new URL('./fixtures/pytorch-parity.json', import.meta.url), 'utf8')) as {
  model: unknown;
  logits: {step:number;prompt:string;ids:number[];logits:number[]}[];
  samples: {step:number;prompt:string;options:GenerationOptions;output:string}[];
};

describe('independent PyTorch float32 / browser float64 parity', () => {
  it('uses the same recorded model dimensions', () => expect(bundle.model).toEqual(oracle.model));
  for (const [i, fixture] of oracle.logits.entries()) {
    it(`matches every next-token logit for case ${i} at step ${fixture.step}`, () => {
      const cp = bundle.checkpoints.find(c => c.step === fixture.step)!;
      const ids = [1, ...tokenize(bundle, fixture.prompt).ids];
      expect(ids).toEqual(fixture.ids);
      const actual = logitsFor(bundle, cp, ids);
      expect(actual.length).toBe(fixture.logits.length);
      const maxError = Math.max(...Array.from(actual, (v, index) => Math.abs(v - fixture.logits[index])));
      expect(maxError).toBeLessThan(2e-5);
    });
  }
  for (const [i, fixture] of oracle.samples.entries()) {
    it(`matches seeded greedy/top-k/full sampling case ${i} at step ${fixture.step}`, async () => {
      const index = bundle.checkpoints.findIndex(c => c.step === fixture.step);
      const actual = await generate(bundle, index, fixture.prompt, fixture.options);
      expect(actual.output).toBe(fixture.output);
    });
  }
});

describe('untrusted JSON bundles', () => {
  function changed(mutate:(x:any)=>void) {const b=structuredClone(raw);mutate(b);return b;}
  it('rejects code-like, invalid, and non-finite model weights', () => {
    for (const v of [NaN, Infinity, 'process.exit()', null, 10001]) {
      expect(() => validateBundle(changed(b=>{b.checkpoints[0].weights['token_embedding.weight'].data[0]=v;}))).toThrow();
    }
  });
  it('rejects unsupported model sizes and string dimensions', () => {
    for (const [key, value] of [['embedDim','48'],['embedDim',4096],['blockSize',1000000],['layers',100],['vocabSize',1000000]]) {
      expect(() => validateBundle(changed(b=>{b.model[key as string]=value;}))).toThrow();
    }
  });
  it('rejects malformed tensors, checkpoints, and vocabularies', () => {
    const mutations=[
      (b:any)=>{b.checkpoints[0].weights['token_embedding.weight'].shape=[1];},
      (b:any)=>{b.checkpoints[0].weights['token_embedding.weight'].data.pop();},
      (b:any)=>{b.checkpoints.push(b.checkpoints[0]);},
      (b:any)=>{b.tokenizer.vocab[3]=b.tokenizer.vocab[4];},
      (b:any)=>{b.tokenizer.vocab[3]='not a character';},
      (b:any)=>{b.origin='remote-api';},
      (b:any)=>{b.metrics[0].trainLoss=NaN;},
      (b:any)=>{b.checkpoints[0].samples[0].options.maxNewTokens=1000000;},
    ];
    for (const mutate of mutations) expect(() => validateBundle(changed(mutate))).toThrow();
  });
  it('rejects inconsistent training metadata and missing initialization', () => {
    const mutations=[
      (b:any)=>{b.checkpoints[0].step=1;},
      (b:any)=>{b.training.steps=1001;},
      (b:any)=>{b.training.steps=1;},
      (b:any)=>{b.training.batchSize=1.5;},
      (b:any)=>{b.training.seed=-1;},
      (b:any)=>{b.training.learningRate=.2;},
      (b:any)=>{b.training.embedDim=16;},
      (b:any)=>{b.metrics.pop();},
    ];
    for (const mutate of mutations) expect(() => validateBundle(changed(mutate))).toThrow();
  });
});
