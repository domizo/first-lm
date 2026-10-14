import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {checks} from '../src/lib/checkContent';
import {chapterIds} from '../src/lib/routes';
import {LanguageContext} from '../src/lib/i18n';
import BeginnerDiagram from '../src/components/BeginnerDiagram';
import QuickCheck from '../src/components/QuickCheck';
describe('explain the selected idea rather than swap generic verdicts',()=>{
  for(const chapter of chapterIds)for(const language of ['en','ja'] as const)it(`${chapter} has two different causal explanations and a real cue in ${language}`,()=>{
    const q=checks[chapter],lang=language==='en'?0:1;
    expect(q.options[0].heading[lang]).not.toBe(q.options[1].heading[lang]);
    expect(q.options[0].reason[lang]).not.toBe(q.options[1].reason[lang]);
    for(const option of q.options){expect(option.heading[lang].length).toBeGreaterThan(8);expect(option.reason[lang].length).toBeGreaterThan(35);expect(option.cue[lang].length).toBeGreaterThan(20);}
    const html=renderToStaticMarkup(createElement(LanguageContext.Provider,{value:language},createElement(BeginnerDiagram,{chapter})));
    expect(html.split(`id="${q.targetId}"`)).toHaveLength(2);expect(html).toContain(`data-check-cue="${chapter}"`);
    const check=renderToStaticMarkup(createElement(LanguageContext.Provider,{value:language},createElement(QuickCheck,{chapter})));
    expect(check).toContain('aria-live="polite"');expect(check).toContain('aria-atomic="true"');expect(check).toContain('check-purpose');
    expect(check).not.toContain(language==='en'?'That fits the diagram.':'図と合っています。');
  });
  it('retains one independently identified answer per chapter without a score or gate',()=>{for(const q of Object.values(checks))expect([0,1]).toContain(q.correct);});
});
