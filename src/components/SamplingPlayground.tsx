import {useMemo,useState} from 'react';
import {useI18n} from '../lib/i18n';
import {distribution,logitsFor,tokenize} from '../lib/model';
import {pickProbability} from '../lib/diagramMath';
import type {RunBundle} from '../lib/types';
import {displayToken} from './TokenizeView';
import './InteractiveDiagrams.css';

export default function SamplingPlayground({bundle,checkpoint}:{bundle:RunBundle;checkpoint:number}) {
  const {t} = useI18n();
  const [prompt,setPrompt] = useState('the ca'), [temperature,setTemperature] = useState(.8), [topK,setTopK] = useState(0), [draw,setDraw] = useState(420);
  const input = useMemo(()=>tokenize(bundle,prompt),[bundle,prompt]);
  const scores = useMemo(()=>logitsFor(bundle,bundle.checkpoints[checkpoint],[1,...input.ids]),[bundle,checkpoint,input]);
  const baseline = useMemo(()=>distribution(scores,{temperature:1,topK:0,seed:0,maxNewTokens:1}),[scores]);
  const effectiveK = Math.min(topK,bundle.model.vocabSize-2);
  const probabilities = useMemo(()=>distribution(scores,{temperature,topK:effectiveK,seed:0,maxNewTokens:1}),[scores,temperature,effectiveK]);
  const order = useMemo(()=>Array.from(scores,(_,id)=>id).filter(id=>id>1).sort((a,b)=>scores[b]-scores[a]||a-b),[scores]);
  const shown = order.slice(0,8), shownMass = shown.reduce((sum,id)=>sum+probabilities[id],0), chosen = pickProbability(probabilities,draw/1000);
  const intervals = useMemo(()=>{let start=0;return Array.from(probabilities,(probability,id)=>{const interval={id,start,probability};start+=probability;return interval;});},[probabilities]);
  const options = Array.from(new Set([0,1,3,8,20].map(k=>Math.min(k,bundle.model.vocabSize-2))));
  return <section className="sampling-playground interactive-diagram" aria-labelledby="sampling-playground-title">
    <span className="evidence-label">{t('Scores from saved weights · adjustable selection','保存した重みから計算したスコア · 選び方を操作')}</span>
    <h3 id="sampling-playground-title">{t('Same scores. Different chances.','スコアは同じ。確率はどう変わる？')}</h3>
    <p>{t('The model assigns a score to every next character. Keep the input and saved step fixed, then move temperature: only the way those scores become probabilities changes. Top-k keeps just the k highest-scoring candidates.','モデルは次の文字それぞれにスコアを付けます。入力と保存ステップをそのままにして、温度を動かしてみましょう。変わるのはスコアから確率を作る方法です。top-k は、スコアが高い k 個の候補だけを残します。')}</p>
    <div className="diagram-controls">
      <label htmlFor="sampling-prompt">{t('Input for this probability chart','この確率グラフの入力')}<input aria-label={t('Input for this probability chart','この確率グラフの入力')} id="sampling-prompt" value={prompt} maxLength={80} onChange={e=>setPrompt(e.target.value)}/></label>
      <label htmlFor="sampling-temperature">{t('Chart temperature','グラフの温度')} <output>{temperature.toFixed(1)}</output><input aria-label={t('Chart temperature','グラフの温度')} id="sampling-temperature" type="range" min="0" max="2" step="0.1" value={temperature} onChange={e=>setTemperature(Number(e.target.value))}/></label>
      <label htmlFor="sampling-topk">{t('Chart top-k','グラフの top-k')}<select aria-label={t('Chart top-k','グラフの top-k')} id="sampling-topk" value={effectiveK} onChange={e=>setTopK(Number(e.target.value))}>{options.map(k=><option key={k} value={k}>{k===0?t('All candidates (0)','すべての候補（0）'):k}</option>)}</select></label>
    </div>
    {input.unknownCount>0&&<p className="notice warm">{t(`${input.unknownCount} input characters are outside this vocabulary and use <unk>.`,`${input.unknownCount} 文字が語彙にないため、<unk> を使います。`)}</p>}
    <div className="sampling-legend"><span className="baseline-key"/>{t('Outline: temperature 1, all candidates','枠線：温度1、すべての候補')}<span className="current-key"/>{t('Fill: your current settings','塗り：今の設定')}</div>
    <ul className="sampling-bars" aria-label={t('Next-character probabilities, up to eight highest scores','次の文字の確率：スコア上位8個まで')}>
      {shown.map(id=><li key={id} className={chosen===id?'chosen':''}><code>{displayToken(bundle.tokenizer.vocab[id])}</code><span className="sampling-bar" aria-hidden="true"><i className="sampling-baseline" style={{width:`${100*baseline[id]}%`}}/><i className="sampling-current" style={{width:`${100*probabilities[id]}%`}}/></span><span><b>{(100*probabilities[id]).toFixed(1)}%</b><small>{t('base','基準')} {(100*baseline[id]).toFixed(1)}%</small></span></li>)}
    </ul>
    <p className="fine-print">{t(`Other candidates together: ${(100*Math.max(0,1-shownMass)).toFixed(1)}%. All bars share a 0–100% scale.`, `表示していない候補の合計：${(100*Math.max(0,1-shownMass)).toFixed(1)}%。棒の目盛りはすべて0〜100%です。`)}</p>
    <p className="diagram-result" aria-live="polite">{temperature===0?t('Temperature 0 chooses the highest-scoring eligible token. No random choice is needed.','温度0では、使える候補のうちスコアが最高のものを選びます。ランダムに選ぶ必要はありません。'):t(`Step ${bundle.checkpoints[checkpoint].step}: ${Array.from(probabilities).filter(p=>p>0).length} candidates have positive probability. Higher temperature spreads chances within the retained set; it does not teach the model anything.`,`${bundle.checkpoints[checkpoint].step} ステップのモデル：確率が0より大きい候補は ${Array.from(probabilities).filter(p=>p>0).length} 個です。温度を上げると残した候補の確率が分散しますが、新しいことを学習するわけではありません。`)}</p>
    <details className="sampling-draw"><summary>{t('How does one character get picked?','この確率から、どう1文字を選ぶ？')}</summary>
      <p>{t('Imagine a ribbon from 0 to 1. Each character gets a length equal to its probability, in vocabulary-ID order. A uniform random number lands somewhere on the ribbon. Here, move that number yourself to inspect the rule; this is a chosen example draw, not an observed random sample.','0から1までの帯を想像してください。語彙の番号順に、確率に応じた長さを各文字へ配ります。均等な乱数が帯のどこかに落ち、その文字を選びます。ここでは数値を自分で動かして仕組みを確かめます。実際の乱数の記録ではなく、説明用に選ぶ数値です。')}</p>
      <label htmlFor="sampling-draw">{t('Example draw position','説明用に選ぶ位置')} <output>{(draw/1000).toFixed(3)}</output><input aria-label={t('Example draw position','説明用に選ぶ位置')} id="sampling-draw" aria-valuetext={(draw/1000).toFixed(3)} type="range" min="0" max="999" value={draw} onChange={e=>setDraw(Number(e.target.value))}/></label>
      <div className="probability-ribbon" aria-hidden="true">{intervals.map(({id,start,probability:p})=>p>0?<span key={id} className={chosen===id?'chosen':''} style={{left:`${start*100}%`,width:`${p*100}%`}} title={`${displayToken(bundle.tokenizer.vocab[id])}: ${(p*100).toFixed(2)}%`}>{p>.07?displayToken(bundle.tokenizer.vocab[id]):''}</span>:null)}<i style={{left:`${draw/10}%`}}/></div>
      <p className="diagram-result" aria-live="polite">{t('This position selects:','この位置が選ぶのは：')} <code>{displayToken(bundle.tokenizer.vocab[chosen])}</code>{chosen===2?t(' — stop at the end token.','：文書の終了トークンなので止まります。'):t(' — one next character.','：次の1文字です。')}</p>
      <p className="fine-print">{t('Keeping this number fixed can still select a different character when the intervals change. The generator uses a seed to make a repeatable sequence of uniform draws. This diagram does not append text or change weights.','同じ数値のままでも、帯の区切りが動くと選ばれる文字は変わることがあります。生成器ではシードによって、同じ乱数の並びを再現できます。この図では文字を付け足さず、重みも変えません。')}</p>
    </details>
    <details className="sampling-table"><summary>{t('All candidates as numbers','全候補を数値で見る')}</summary><div className="table-scroll"><table><caption>{t('Fixed scores and probabilities after the selection rules','固定したスコアと、選択ルール適用後の確率')}</caption><thead><tr><th>{t('Token','トークン')}</th><th>{t('Score','スコア')}</th><th>{t('Baseline','基準')}</th><th>{t('Current','現在')}</th></tr></thead><tbody>{order.map(id=><tr key={id}><th scope="row">{displayToken(bundle.tokenizer.vocab[id])}</th><td>{scores[id].toFixed(3)}</td><td>{(100*baseline[id]).toFixed(2)}%</td><td>{(100*probabilities[id]).toFixed(2)}%</td></tr>)}</tbody></table></div></details>
    <p className="fine-print">{t('Computed in this browser from the selected saved checkpoint. Both distributions exclude <bos> and <unk>, but include <eos>. These are generation probabilities, not the raw training probabilities used for loss. Only the last context-window tokens are read. Changing the prompt or saved step recalculates scores; temperature/top-k/draw never change the model weights.','選んだチェックポイントから、このブラウザーで計算しています。どちらの分布も <bos> と <unk> は選ばず、<eos> は候補に含めます。これは生成時の確率で、損失計算に使う生の学習用確率とは異なります。読む入力は文脈窓の末尾側だけ。入力や保存ステップを変えるとスコアを計算し直しますが、温度・top-k・選ぶ位置で重みは変わりません。')}</p>
  </section>;
}
