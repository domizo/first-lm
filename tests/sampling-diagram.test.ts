import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {LanguageContext} from '../src/lib/i18n';
import SamplingPlayground from '../src/components/SamplingPlayground';
import {distribution,logitsFor,tokenize,validateBundle} from '../src/lib/model';
import {pickProbability} from '../src/lib/diagramMath';
const bundle=validateBundle(JSON.parse(readFileSync(new URL('../public/runs/demo.json',import.meta.url),'utf8')));
describe('real saved-score sampling diagram',()=>{
  for(const language of ['en','ja'] as const)it(`renders measured and illustrative boundaries in ${language}`,()=>{
    const before=JSON.stringify(bundle.checkpoints);
    const html=renderToStaticMarkup(createElement(LanguageContext.Provider,{value:language},createElement(SamplingPlayground,{bundle,checkpoint:3})));
    for(const text of language==='en'?['Scores from saved weights','chosen example draw','not the raw training probabilities','not teach the model']:['保存した重みから計算したスコア','説明用に選ぶ数値','生の学習用確率とは異なります','学習するわけではありません'])expect(html).toContain(text);
    expect(html).toContain('aria-label=');expect(html).toContain('<table>');expect(JSON.stringify(bundle.checkpoints)).toBe(before);
  });
  it('uses normalized generation probabilities and a unchanged score vector',()=>{
    const logits=logitsFor(bundle,bundle.checkpoints[3],[1,...tokenize(bundle,'the ca').ids]),copy=Array.from(logits);
    for(const temperature of [0,.1,.8,1,2])for(const topK of [0,1,8,20]){
      const p=distribution(logits,{temperature,topK,seed:42,maxNewTokens:1});
      expect(p[0]).toBe(0);expect(p[1]).toBe(0);expect(Array.from(p).reduce((a,b)=>a+b,0)).toBeCloseTo(1,12);
      if(topK===1||temperature===0)expect(Array.from(p).filter(x=>x>0)).toHaveLength(1);
      for(const draw of [0,.2,.42,.999])expect(p[pickProbability(p,draw)]).toBeGreaterThan(0);
    }
    expect(Array.from(logits)).toEqual(copy);
  });
});
