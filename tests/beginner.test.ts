import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {chapters} from '../src/lib/learningContent';
import {chapterIds} from '../src/lib/routes';
import {LanguageContext} from '../src/lib/i18n';
import BeginnerDiagram from '../src/components/BeginnerDiagram';
import QuickCheck,{checks} from '../src/components/QuickCheck';
import type {ChapterId} from '../src/lib/routes';
import type {Language} from '../src/lib/i18n';
const diagram=(chapter:ChapterId,language:Language)=>renderToStaticMarkup(createElement(LanguageContext.Provider,{value:language},createElement(BeginnerDiagram,{chapter})));
describe('beginner learning path',()=>{
 it('keeps every existing deep-linked chapter in order',()=>expect(chapters.map(x=>x.id)).toEqual(chapterIds));
 for(const id of chapterIds){
  it(`${id} has complete plain-language EN/JA content and optional depth`,()=>{
   const chapter=chapters.find(x=>x.id===id)!;
   const fields=[chapter.title,chapter.question,chapter.why,chapter.takeaway,chapter.observe,...chapter.plain,...chapter.mechanism,...chapter.math,...chapter.glossary!.flatMap(x=>[x.term,x.meaning])];
   expect(chapter.plain.length).toBeGreaterThanOrEqual(2);expect(chapter.glossary!.length).toBeGreaterThanOrEqual(2);
   for(const field of fields)for(const language of ['en','ja'] as const)expect(field[language].trim().length).toBeGreaterThan(0);
   expect(chapter.codePath).toMatch(/^(python|src)\//);
  });
  it(`${id} labels its explanatory diagram in both languages`,()=>{
   for(const language of ['en','ja'] as const){const html=diagram(id,language);expect(html).toContain(`data-chapter="${id}"`);expect(html).toContain('<figcaption>');expect(html).toContain(language==='en'?'Explanatory illustration':'説明用の図');expect(html).not.toContain('<img');}
  });
  it(`${id} offers two explained choices without a scored test`,()=>{
   const check=checks[id];expect(check.choices).toHaveLength(2);expect([0,1]).toContain(check.correct);
   for(const copy of [check.question,...check.choices,check.explanation])for(const text of copy)expect(text.length).toBeGreaterThan(5);
   const html=renderToStaticMarkup(createElement(QuickCheck,{chapter:id}));expect(html.match(/aria-pressed="false"/g)).toHaveLength(2);expect(html).toContain('role="status"');
  });
 }
 it('shows the whole-document split before creating prediction examples',()=>{const html=diagram('data','en');expect(html.indexOf('Split whole documents first')).toBeLessThan(html.indexOf('Make questions within each pile'));});
 it('labels made-up embedding numbers and the same-letter/different-position example',()=>{const html=diagram('embeddings','en');expect(html).toContain('Made-up labels and numbers');expect(html).toContain('Two t letters, two positions');});
 it('defines illustrative loss using target probability rather than top-one accuracy',()=>{const html=diagram('loss','en');expect(html).toContain('chosen percentages, not measured');expect(html).toContain('not only which letter ranked first');});
});
