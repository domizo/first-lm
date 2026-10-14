import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {chapters} from '../src/lib/learningContent';
import {chapterIds} from '../src/lib/routes';
import {LanguageContext} from '../src/lib/i18n';
import BeginnerDiagram from '../src/components/BeginnerDiagram';
import QuickCheck,{checks} from '../src/components/QuickCheck';
import LearningGuide from '../src/components/LearningGuide';
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
   for(const language of ['en','ja'] as const){const html=diagram(id,language);expect(html).toContain(`data-chapter="${id}"`);expect(html).toMatch(/<figcaption(?:>| )/);expect(html).toContain(language==='en'?'Explanatory illustration':'説明用の図');expect(html).not.toContain('<img');}
  });
  it(`${id} offers two explained choices without a scored test`,()=>{
   const check=checks[id];expect(check.options).toHaveLength(2);expect([0,1]).toContain(check.correct);
   for(const copy of [check.question,...check.options.flatMap(option=>[option.label,option.heading,option.reason,option.cue])])for(const text of copy)expect(text.length).toBeGreaterThan(5);
   const html=renderToStaticMarkup(createElement(QuickCheck,{chapter:id}));expect(html.match(/aria-pressed="false"/g)).toHaveLength(2);expect(html).toContain('role="status"');
  });
 }
 it('shows the whole-document split before creating prediction examples',()=>{const html=diagram('data','en');expect(html.indexOf('Split whole documents first')).toBeLessThan(html.indexOf('Make questions within each pile'));});
 it('labels made-up embedding numbers and the same-letter/different-position example',()=>{const html=diagram('embeddings','en');expect(html).toContain('Made-up labels and numbers');expect(html).toContain('Two t letters, two positions');});
 it('defines illustrative loss using target probability rather than top-one accuracy',()=>{const html=diagram('loss','en');expect(html).toContain('chosen percentages, not measured');expect(html).toContain('not only which letter ranked first');});
});

describe('LLM introduction',()=>{
 for(const language of ['en','ja'] as const)it(`defines LLM and learning scope before the chapters in ${language}`,()=>{
  const html=renderToStaticMarkup(createElement(LanguageContext.Provider,{value:language},createElement(LearningGuide,{chapterId:'overview',bundle:null,checkpoint:0,onCheckpoint:()=>{},returnStep:2})));
  expect(html).toContain('Large Language Model');expect(html).toContain('62,064');expect(html).toContain('RLHF');expect(html).toContain('guide-map');expect(html).toContain(language==='en'?'Start the eight chapters':'8章の学習を始める');
  expect(html.indexOf('guide-introduction')).toBeLessThan(html.indexOf('learning-toc'));expect(html.indexOf('guide-introduction')).toBeLessThan(html.indexOf('guide-first-chapter'));
  expect(html.match(/data-route-heading="learn"/g)).toHaveLength(1);expect(html.match(/<h1/g)).toHaveLength(1);
 });
 it('keeps every old chapter route and only shows the introduction on overview',()=>{
  for(const chapterId of chapterIds){const html=renderToStaticMarkup(createElement(LearningGuide,{chapterId,bundle:null,checkpoint:0,onCheckpoint:()=>{},returnStep:2}));expect(html.includes('class="guide-introduction"')).toBe(chapterId==='overview');expect(html.match(/data-route-heading="learn"/g)).toHaveLength(1);}
 });
});
