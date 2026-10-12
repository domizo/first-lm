import {createContext,useContext} from 'react';
export type Language='en'|'ja';
export const LanguageContext=createContext<Language>('en');
export function useI18n(){const language=useContext(LanguageContext);return {language,t:(en:string,ja:string)=>language==='ja'?ja:en};}
export function formatNumber(value:number){return new Intl.NumberFormat('en-US').format(value);}
