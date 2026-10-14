import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import EmbeddingComparison from '../src/components/EmbeddingComparison';
import {LanguageContext} from '../src/lib/i18n';
import type {Language} from '../src/lib/i18n';
import {embeddingProbe} from '../src/lib/learning';
import {validateBundle} from '../src/lib/model';
import type {RunBundle} from '../src/lib/types';

const bundle = validateBundle(JSON.parse(readFileSync(new URL('../public/runs/demo.json', import.meta.url), 'utf8')));
const render = (run: RunBundle, checkpoint: number, language: Language = 'en') => renderToStaticMarkup(
  createElement(LanguageContext.Provider, {value: language}, createElement(EmbeddingComparison, {bundle: run, checkpoint})),
);

describe('signed embedding comparison', () => {
  it('uses the actual first four coordinates at both positions and every saved step', () => {
    const id = bundle.tokenizer.vocab.indexOf('t');
    for (const [checkpoint, saved] of bundle.checkpoints.entries()) {
      const html = render(bundle, checkpoint);
      expect(html).toContain(`data-checkpoint-step="${saved.step}"`);
      expect(html.match(/class="embedding-comparison-value /g)).toHaveLength(24);
      for (const position of [1, 7]) for (const row of embeddingProbe(bundle, checkpoint, id, position)) {
        for (const kind of ['token', 'position', 'sum'] as const) {
          expect(html).toContain(`data-position="${position}" data-dimension="${row.dimension}" data-value="${row[kind]}"`);
        }
      }
    }
  });

  it('keeps token vectors identical, adds actual position rows, and does not mutate the bundle', () => {
    const before = JSON.stringify(bundle);
    const id = bundle.tokenizer.vocab.indexOf('t');
    for (let checkpoint = 0; checkpoint < bundle.checkpoints.length; checkpoint++) {
      render(bundle, checkpoint);
      const first = embeddingProbe(bundle, checkpoint, id, 1);
      const last = embeddingProbe(bundle, checkpoint, id, 7);
      expect(first.map(row => row.token)).toEqual(last.map(row => row.token));
      for (const row of [...first, ...last]) expect(row.sum).toBe(row.token + row.position);
    }
    expect(JSON.stringify(bundle)).toBe(before);
  });

  it('provides signed numeric text, position labels, and pre-attention caveats in EN/JA', () => {
    for (const language of ['en', 'ja'] as const) {
      const html = render(bundle, 0, language);
      expect(html).toContain('<figcaption>');
      expect(html).toMatch(/class="embedding-comparison-number">[+−]/);
      expect(html).toContain(language === 'en' ? 'Position 1' : '位置 1');
      expect(html).toContain(language === 'en' ? 'Position 7' : '位置 7');
      expect(html).toContain(language === 'en' ? 'before attention' : '注意計算の前');
      expect(html).toContain(language === 'en' ? 'contextual hidden states' : '文脈を反映した隠れ状態');
    }
  });

  it('labels an imported vocabulary without t candidly and displays the unknown-token row', () => {
    const imported = structuredClone(bundle);
    imported.tokenizer.vocab[imported.tokenizer.vocab.indexOf('t')] = '🦊';
    for (const language of ['en', 'ja'] as const) {
      const html = render(imported, 0, language);
      expect(html).toContain(language === 'en' ? 'unknown-token vector' : '未知トークンのベクトル');
      expect(html).toContain('&lt;unk&gt;');
      for (const row of embeddingProbe(imported, 0, 0, 7)) expect(html).toContain(`data-value="${row.token}"`);
    }
  });

  it('renders an accepted bundle without optional tokenizer special metadata', () => {
    const imported = JSON.parse(JSON.stringify(bundle));
    delete imported.tokenizer.special;
    imported.tokenizer.vocab[imported.tokenizer.vocab.indexOf('t')] = '🦊';
    const accepted = validateBundle(imported);
    expect(render(accepted, 0)).toContain('unknown-token vector');
    expect(render(accepted, 0, 'ja')).toContain('未知トークンのベクトル');
  });

  it('handles all-zero values without invalid bar coordinates or invented differences', () => {
    const zero = structuredClone(bundle);
    for (const name of ['token_embedding.weight', 'position_embedding.weight']) zero.checkpoints[0].weights[name].data.fill(0);
    const html = render(zero, 0);
    expect(html).not.toMatch(/NaN|Infinity/);
    expect(html).toContain('DIFFERENT position rows');
    expect(html.match(/class="embedding-comparison-number">0.0000/g)).toHaveLength(24);
  });
});
