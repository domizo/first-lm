import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {LanguageContext} from '../src/lib/i18n';
import LossPlayground from '../src/components/LossPlayground';
import {
  clampToyInput, TOY_INITIAL_LOGITS, TOY_MAX_LEARNING_RATE, TOY_MAX_UPDATES, TOY_TARGET_INDEX,
  toyLogitGradient, toyLogitLoss, toyLogitStep, toyProbabilityLoss, toySoftmax,
} from '../src/lib/toyLearning';

describe('isolated illustrative learning calculations', () => {
  it('normalizes softmax and matches independently calculated probabilities', () => {
    const denominator = 1 + Math.exp(1) + Math.exp(-0.5);
    const expected = [1 / denominator, Math.exp(1) / denominator, Math.exp(-0.5) / denominator];
    const actual = toySoftmax(TOY_INITIAL_LOGITS);
    expected.forEach((value, index) => expect(actual[index]).toBeCloseTo(value, 14));
    expect(actual.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 14);
    actual.forEach(value => expect(value).toBeGreaterThan(0));
  });

  it('is stable for large logits and unchanged by a shared offset', () => {
    expect(toySoftmax([10000, 10000, 10000])).toEqual([1 / 3, 1 / 3, 1 / 3]);
    const shifted = toySoftmax(TOY_INITIAL_LOGITS.map(value => value + 10000));
    const original = toySoftmax(TOY_INITIAL_LOGITS);
    shifted.forEach((value, index) => expect(value).toBeCloseTo(original[index], 14));
    expect(toySoftmax([10000, -10000])).toEqual([1, 0]);
    expect(toyLogitLoss([10000, -10000], 1)).toBe(20000);
  });

  it('computes known natural-log losses and agrees with logit-based loss', () => {
    expect(toyProbabilityLoss(1)).toBe(0);
    expect(toyProbabilityLoss(0.5)).toBeCloseTo(Math.LN2, 14);
    expect(toyProbabilityLoss(0.25)).toBeCloseTo(2 * Math.LN2, 14);
    expect(toyProbabilityLoss(0.01)).toBeCloseTo(4.605170185988091, 14);
    expect(toyProbabilityLoss(0.99)).toBeCloseTo(0.01005033585350145, 14);
    expect(toyLogitLoss(TOY_INITIAL_LOGITS, 0)).toBeCloseTo(toyProbabilityLoss(toySoftmax(TOY_INITIAL_LOGITS)[0]), 14);
  });

  it('calculates p minus the one-hot target and updates each logit exactly', () => {
    const probabilities = toySoftmax(TOY_INITIAL_LOGITS);
    const expected = [probabilities[0] - 1, probabilities[1], probabilities[2]];
    const gradient = toyLogitGradient(TOY_INITIAL_LOGITS, TOY_TARGET_INDEX);
    expect(gradient).toEqual(expected);
    expect(gradient.reduce((sum, value) => sum + value, 0)).toBeCloseTo(0, 14);
    const actual = toyLogitStep(TOY_INITIAL_LOGITS, TOY_TARGET_INDEX, 0.5);
    expected.forEach((value, index) => expect(actual[index]).toBe(TOY_INITIAL_LOGITS[index] - 0.5 * value));
    expect(actual[0]).toBeGreaterThan(TOY_INITIAL_LOGITS[0]);
    expect(actual[1]).toBeLessThan(TOY_INITIAL_LOGITS[1]);
    expect(actual[2]).toBeLessThan(TOY_INITIAL_LOGITS[2]);
  });

  it('can target any score and preserves the input values', () => {
    const input = [0, 0, 0];
    const gradient = toyLogitGradient(input, 2);
    expect(gradient[0]).toBeCloseTo(1 / 3, 14);
    expect(gradient[2]).toBeCloseTo(-2 / 3, 14);
    toyLogitStep(input, 2, 1);
    expect(input).toEqual([0, 0, 0]);
    expect(TOY_INITIAL_LOGITS).toEqual([0, 1, -0.5]);
  });

  it('keeps logits identical at a zero learning rate', () => {
    expect(toyLogitStep(TOY_INITIAL_LOGITS, TOY_TARGET_INDEX, 0)).toEqual(TOY_INITIAL_LOGITS);
  });

  it('lowers fixed-target loss on all ten updates at every slider learning rate', () => {
    for (let tick = 1; tick <= TOY_MAX_LEARNING_RATE * 10; tick++) {
      let logits = [...TOY_INITIAL_LOGITS];
      for (let step = 0; step < TOY_MAX_UPDATES; step++) {
        const next = toyLogitStep(logits, TOY_TARGET_INDEX, tick / 10);
        expect(toyLogitLoss(next, TOY_TARGET_INDEX)).toBeLessThan(toyLogitLoss(logits, TOY_TARGET_INDEX));
        expect(toySoftmax(next)[0]).toBeGreaterThan(toySoftmax(logits)[0]);
        next.forEach(value => expect(Number.isFinite(value)).toBe(true));
        logits = next;
      }
    }
  });

  it('bounds UI inputs and uses a finite fallback', () => {
    expect(clampToyInput(-50, 1, 99, 20)).toBe(1);
    expect(clampToyInput(150, 1, 99, 20)).toBe(99);
    expect(clampToyInput(75, 1, 99, 20)).toBe(75);
    expect(clampToyInput(NaN, 1, 99, 20)).toBe(20);
    expect(clampToyInput(Infinity, 0.1, 2, 0.5)).toBe(0.5);
  });

  it('rejects inputs outside the numerical helpers’ supported domain', () => {
    for (const logits of [[], [NaN], [Infinity], [-Infinity], [1e7]]) {
      expect(() => toySoftmax(logits)).toThrow(RangeError);
    }
    for (const probability of [0, -0.1, 1.1, NaN, Infinity]) {
      expect(() => toyProbabilityLoss(probability)).toThrow(RangeError);
    }
    for (const target of [-1, 3, 0.5, NaN]) {
      expect(() => toyLogitGradient(TOY_INITIAL_LOGITS, target)).toThrow(RangeError);
      expect(() => toyLogitLoss(TOY_INITIAL_LOGITS, target)).toThrow(RangeError);
    }
    for (const rate of [-1, 2.1, NaN, Infinity]) {
      expect(() => toyLogitStep(TOY_INITIAL_LOGITS, 0, rate)).toThrow(RangeError);
    }
  });
});

describe('bilingual interactive learning diagrams', () => {
  for (const language of ['en', 'ja'] as const) {
    const render = (mode: 'loss' | 'update') => renderToStaticMarkup(createElement(LanguageContext.Provider, {value: language}, createElement(LossPlayground, {mode})));
    it(`labels the loss graph, slider, aggregation and rounded numeric result in ${language}`, () => {
      const html = render('loss');
      expect(html).toContain('data-toy-mode="loss"');
      expect(html).toContain('type="range"');
      expect(html).toContain('min="1" max="99"');
      expect(html).toContain('aria-valuetext="20%"');
      expect(html).toContain('role="img"');
      expect(html).toContain('<desc');
      expect(html).toContain('1.6094');
      expect(html).toContain(language === 'en' ? 'All other letters together' : 'ほかの文字の合計');
      expect(html).toContain(language === 'en' ? 'Which letter comes first in the ranking is not enough' : 'どの文字が1位だったか、だけでは分かりません');
      expect(html).toContain(language === 'en' ? 'not measured predictions' : '実測値ではありません');
      expect(html).toContain('<details');
      expect(html).not.toMatch(/NaN|Infinity/);
    });

    it(`labels the update controls, gradients and real-trainer caveat in ${language}`, () => {
      const html = render('update');
      expect(html).toContain('data-toy-mode="update"');
      expect(html).toContain('min="0.1" max="2"');
      expect(html).toContain('aria-valuetext="0.5"');
      expect(html).toContain('role="status"');
      expect(html).toContain(language === 'en' ? 'Update once' : '1回更新する');
      expect(html).toContain(language === 'en' ? 'Start over' : '最初に戻す');
      expect(html).toContain('23.1%');
      expect(html).toContain('SGD');
      expect(html).toContain('AdamW');
      expect(html).toContain(language === 'en' ? 'gradient-norm clipping' : '勾配ノルムの制限');
      expect(html).toContain(language === 'en' ? 'not a full network' : 'ネットワーク全体や実際の重みの記録ではありません');
      expect(html).toContain(language === 'en' ? 'not a demonstration of overshooting' : '大きく更新して失敗する様子を示す図ではありません');
      expect(html).not.toMatch(/NaN|Infinity/);
    });
  }
});
