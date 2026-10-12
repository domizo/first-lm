import {useEffect,useRef,useState} from 'react';
import {LanguageContext,useI18n} from './lib/i18n';
import type {Language} from './lib/i18n';
import {useLab} from './hooks/useLab';
import DatasetView from './components/DatasetView';
import TokenizeView from './components/TokenizeView';
import TrainView from './components/TrainView';
import GenerateView from './components/GenerateView';
import LearningGuide from './components/LearningGuide';
import LearningContext from './components/LearningContext';
import {useRoute,learnHref} from './lib/routes';
import type {Step} from './lib/routes';
import type {Lab} from './hooks/useLab';
const titles=[['It all begins with the data.','すべては、データから。'],['See what the model sees.','モデルの見ている世界。'],['Watch a model learn.','モデルが学ぶ様子を見る。'],['Let the next character unfold.','次の文字を、選んでみよう。']];
const subtitles=[['A deliberately small corpus. A split you can inspect.','小さなデータと、確かめられる学習・検証の分割。'],['Characters, tokens, and the numbers in between.','文字とトークン、その間にある数字。'],['A small network. Real gradients. One character at a time.','小さなネットワーク。実際の勾配。1 文字ずつ。'],['The same small network, now making its own predictions.','同じ小さなモデルで、今度は予測を作ってみる。']];
function StatusBand({lab}:{lab:Lab}){const {t}=useI18n();const running=lab.status.status==='running';return <div className="status-band" role="status"><span className="status-label"><span className={`dot ${running?'live-dot':''}`}/>{running?t('Live local training','ローカルで学習中'):lab.source==='local'?t('Local training run','ローカル学習の記録'):lab.source==='imported'?t('Imported training run','読み込んだ学習記録'):t('Recorded training run','記録済みの学習実行')}</span><span className="status-description">{running?t('Real PyTorch updates. Loss appears only after each evaluation.','PyTorch が実際に更新中。各評価後に損失を表示します。'):lab.connected?t('Local trainer connected. Explore this run or train your own.','ローカルサーバー接続済み。この記録を調べるか、新しく学習できます。'):t('Explore a saved run, or connect the local trainer to run your own.','保存済みの実行を調べるか、ローカルサーバーにつないで自分で学習。')}</span>{!running&&<button className="text-button connection-check" onClick={()=>void lab.checkConnection()} disabled={lab.checking}>{lab.checking?t('Checking…','確認中…'):lab.connected?t('Connected','接続済み'):t('Check connection','接続を確認')}</button>}</div>;}
function LabApp({language,setLanguage}:{language:Language;setLanguage:(lang:Language)=>void}){
 const {t}=useI18n(),{route,go}=useRoute(),lab=useLab();
 const fileInput=useRef<HTMLInputElement>(null),lastStep=useRef<Step>(2),initial=useRef(true);
 const learning=route.kind==='learn';if(route.kind==='lab')lastStep.current=route.step;const step=lastStep.current;
 const running=lab.status.status==='running';
 useEffect(()=>{document.documentElement.lang=language;},[language]);
 useEffect(()=>{document.title=learning?t('Learning guide · first-lm','学習ガイド · first-lm'):'first-lm';if(initial.current){initial.current=false;return;}window.scrollTo({top:0,behavior:'instant'});document.querySelector<HTMLElement>(`[data-route-heading="${route.kind}"]`)?.focus({preventScroll:true});},[route,learning,language]);
 const nav=(s:Step)=>go({kind:'lab',step:s});
 return <div className="app-shell"><a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault();document.getElementById('main-content')?.focus();}}>{t('Skip to content','本文へ')}</a><header className="app-header"><button className="brand" onClick={()=>nav(2)} aria-label={t('first-lm home','first-lm ホーム')}>first-lm<span className="brand-cursor" aria-hidden="true"/></button><div className="header-actions"><a className="guide-link" href={learnHref()} aria-current={learning?'page':undefined}>{t('Guide','ガイド')}</a><div className="language-toggle" aria-label={t('Interface language','表示言語')}><button onClick={()=>setLanguage('en')} aria-pressed={language==='en'}>EN</button><span>/</span><button onClick={()=>setLanguage('ja')} aria-pressed={language==='ja'}>JA</button></div></div></header>
 <nav className="workflow-nav" aria-label={t('Learning workflow','学習の流れ')}>{[['Dataset','データ'],['Tokenize','トークン化'],['Train','学習'],['Generate','生成']].map((labels,index)=><button key={index} onClick={()=>nav(index as Step)} className={!learning&&step===index?'active':''} aria-current={!learning&&step===index?'step':undefined}><span className="step-number">0{index+1}</span><span>{t(labels[0],labels[1])}</span></button>)}</nav>
 <main id="main-content" tabIndex={-1}>
 <div hidden={learning}>
 <div className="page-heading"><h1 tabIndex={-1} data-route-heading="lab">{t(titles[step][0],titles[step][1])}</h1><p>{t(subtitles[step][0],subtitles[step][1])}</p></div>
 <div className="learning-invitation"><div><strong>{t('New to language models? Start with the why.','言語モデルは初めて？まず「なぜ」から。')}</strong><p>{t('Learn why text becomes numbers, how errors change weights, and how fixed weights produce a sentence. Then try the real model.','文字が数字になる理由、誤差から重みが変わる仕組み、学習後に文章ができる流れをたどり、実際のモデルで試せます。')}</p></div><a className="lesson-link" href={learnHref()}>{t('Start the learning path','仕組みを学ぶ')} →</a></div>
 <StatusBand lab={lab}/>
 </div>
 {lab.source==='imported'&&<p className="import-notice">{t('Imported file: metadata and training provenance are self-reported and are not authenticated. The file is validated as bounded, data-only JSON.','読み込んだファイルのメタデータと学習の出自は自己申告であり、認証されていません。上限のあるデータ専用 JSON として検証しています。')}</p>}
 {lab.error&&<div className="error-banner" role="alert"><span>{lab.error}</span><button onClick={()=>lab.setError('')} aria-label={t('Dismiss error','エラーを閉じる')}>×</button></div>}
 <div hidden={learning}>{lab.loading?<div className="loading-state">{t('Loading a genuine training run…','実際の学習記録を読み込み中…')}</div>:!lab.bundle?<div className="loading-state"><h2>{t('The saved run is unavailable','保存済みの実行を読み込めません')}</h2><p>{t('You can import a valid first-lm JSON run below.','下のボタンから有効な first-lm の JSON 記録を読み込めます。')}</p></div>:<>
 <section hidden={step!==0} aria-label={t('Dataset experiment','データの実験')}><LearningContext step={0}/><DatasetView lab={lab} onNext={()=>nav(1)}/></section>
 <section hidden={step!==1} aria-label={t('Tokenization experiment','トークン化の実験')}><LearningContext step={1}/><TokenizeView bundle={lab.bundle} onNext={()=>nav(2)}/></section>
 <section hidden={step!==2} aria-label={t('Training experiment','学習の実験')}><LearningContext step={2}/><TrainView lab={lab} onGuide={()=>go({kind:'learn',chapter:'evaluation'})}/></section>
 <section hidden={step!==3} aria-label={t('Generation experiment','生成の実験')}><LearningContext step={3}/><GenerateView bundle={lab.bundle} checkpoint={lab.checkpoint} onCheckpoint={lab.setCheckpoint}/></section>
 </>}</div>
 <section hidden={!learning} aria-label={t('Learning guide','学習ガイド')}><LearningGuide chapterId={route.kind==='learn'?route.chapter:'overview'} bundle={lab.bundle} checkpoint={lab.checkpoint} onCheckpoint={lab.setCheckpoint} returnStep={step}/></section>
 </main>
 <footer className="app-footer"><div><span>first-lm</span><p>{t('Small enough to understand. Real enough to learn from.','理解できる小ささ。本物だから、学べる。')}</p>{lab.bundle&&<small>PyTorch {lab.bundle.environment.torch} · {lab.bundle.environment.device.toUpperCase()} · {new Date(lab.bundle.createdAt).toLocaleDateString(language==='ja'?'ja-JP':'en-GB',{year:'numeric',month:'short',day:'numeric'})}</small>}</div><div className="run-actions"><button className="text-button" onClick={lab.download} disabled={!lab.bundle}>{t('Download run','実行を保存')}</button><button className="text-button" onClick={()=>fileInput.current?.click()} disabled={running}>{t('Import run','実行を読み込む')}</button><input className="sr-only" type="file" ref={fileInput} accept="application/json,.json" onChange={async e=>{const file=e.target.files?.[0];if(file){try{await lab.importRun(file);}catch(err){lab.setError(err instanceof Error?err.message:'Import failed.');}}e.target.value='';}} aria-label={t('Import run JSON','実行 JSON を読み込む')}/></div></footer>
 </div>;
}
export default function App(){const [language,setLanguage]=useState<Language>(()=>{try{return localStorage.getItem('first-lm-language')==='ja'?'ja':'en';}catch{return 'en';}});function changeLanguage(lang:Language){setLanguage(lang);try{localStorage.setItem('first-lm-language',lang);}catch{/* language still changes for this session */}}return <LanguageContext.Provider value={language}><LabApp language={language} setLanguage={changeLanguage}/></LanguageContext.Provider>;}
