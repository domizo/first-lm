import {useEffect,useState} from 'react';
export const steps=['data','tokens','train','generate'] as const;
export const chapterIds=['overview','data','embeddings','attention','loss','optimization','evaluation','generation'] as const;
export type ChapterId=typeof chapterIds[number];
export type Step=0|1|2|3;
export type Route={kind:'lab';step:Step}|{kind:'learn';chapter:ChapterId};
export function parseRoute(hash:string):Route|null {
 const match=/^#\/(lab|learn)\/([a-z]+)$/.exec(hash);
 if(!match)return null;
 if(match[1]==='lab') {const i=steps.indexOf(match[2] as typeof steps[number]);return i<0?null:{kind:'lab',step:i as Step};}
 return chapterIds.includes(match[2] as ChapterId)?{kind:'learn',chapter:match[2] as ChapterId}:null;
}
export const labHref=(step:Step)=>`#/lab/${steps[step]}`;
export const learnHref=(chapter:ChapterId='overview')=>`#/learn/${chapter}`;
export function useRoute(){
 const [route,setRoute]=useState<Route>(()=>parseRoute(location.hash)??{kind:'lab',step:2});
 useEffect(()=>{const changed=()=>{const next=parseRoute(location.hash);if(next)setRoute(next);else if(!location.hash)setRoute({kind:'lab',step:2});};window.addEventListener('hashchange',changed);return()=>window.removeEventListener('hashchange',changed);},[]);
 const go=(next:Route)=>{const href=next.kind==='lab'?labHref(next.step):learnHref(next.chapter);if(location.hash===href)setRoute(next);else location.hash=href;};
 return {route,go};
}
