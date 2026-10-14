import {useState} from 'react';
import {useI18n} from '../lib/i18n';
import {contextWindow} from '../lib/diagramMath';
import './InteractiveDiagrams.css';

const tokens = ['<bos>', ...Array.from('the cat sat.')];
const show = (x:string) => x === ' ' ? '␣' : x;

export default function ContextExplorer() {
  const {t} = useI18n();
  const [boundary,setBoundary] = useState(6), [size,setSize] = useState(5);
  const cells = contextWindow(tokens,boundary,size), visible = cells.filter(x=>x.state==='visible');
  return <section className="context-explorer" aria-labelledby="context-explorer-title">
    <h3 id="context-explorer-title">{t('Move the boundary. Which letters can help?','境界を動かすと、使える文字は？')}</h3>
    <p>{t('Imagine covering the next letter in “the cat sat.” Move how far we have read, then change how many tokens fit in this small example window.','「the cat sat.」の次の文字を隠してみましょう。読んだ位置と、この小さな例で使える文字の数を動かせます。')}</p>
    <div className="diagram-controls">
      <label htmlFor="context-boundary">{t('Last input position in the whole text','文章全体で、最後に見せる位置')} <output>{boundary}</output>
        <input aria-label={t('Last input position in the whole text','文章全体で、最後に見せる位置')} id="context-boundary" type="range" min="0" max={tokens.length-2} value={boundary} onChange={e=>setBoundary(Number(e.target.value))}/>
      </label>
      <label htmlFor="context-size">{t('Example window size (tokens)','説明用の窓の大きさ（トークン）')} <output>{size}</output>
        <input aria-label={t('Example window size (tokens)','説明用の窓の大きさ（トークン）')} id="context-size" type="range" min="3" max="8" value={size} onChange={e=>setSize(Number(e.target.value))}/>
      </label>
    </div>
    <div className="context-legend"><span>● {t('Inside window','窓の中')}</span><span>○ {t('Too old for this window','窓より前')}</span><span>× {t('Not yet visible','まだ見えない')}</span></div>
    <ol className="context-token-track" aria-label={t('Positions in the whole example','例の文章全体の位置')}>
      {cells.map(x=><li key={x.position} className={`context-cell ${x.state} ${x.target?'target':''}`}>
        <small>{x.position}</small><code>{show(x.token)}</code><span>{x.state==='visible'?'●':x.state==='older'?'○':'×'}</span>
        <span className="sr-only">{x.state==='visible'?t('inside window','窓の中'):x.state==='older'?t('outside window','窓より前'):t('hidden future','未来のため見えない')}{x.target?t(', next-letter answer','、次の文字の答え'):''}</span>
      </li>)}
    </ol>
    <p className="context-target" id="check-cue-attention" data-check-cue="attention" tabIndex={-1}>{t('Next-letter answer, kept hidden from this prediction:','この予測には見せない、次の文字の答え：')} <code>{show(tokens[boundary+1])}</code></p>
    <div className="context-crop"><strong>{t('Only these tokens enter this prediction','この予測の計算に入るのは、ここだけ')}</strong>
      <ol>{visible.map(x=><li key={x.position}><code>{show(x.token)}</code><small>{t('Window position','窓の中の位置')} {x.windowPosition}</small></li>)}</ol>
    </div>
    <p className="diagram-result" aria-live="polite">{t(`Whole-text positions ${visible[0].position}–${boundary} are used. Within this window they become positions 0–${visible.length-1}.`, `文章全体の位置 ${visible[0].position}〜${boundary} を使います。窓の中では、位置 0〜${visible.length-1} として計算します。`)}</p>
    <p className="fine-print">{t('Chosen example, not measured attention. The model cannot use future letters. Older input can also fall outside its context window. Here <bos> marks the document start; it leaves the window too. The actual reference model has a fixed 48-token window. These controls change only this drawing, not the model. Window positions restart at 0, as in first-lm’s generator.','説明用の例で、実測の注意重みではありません。未来の文字は使えず、古い入力も文脈の窓から外れることがあります。<bos> は文書の先頭を表し、これも窓から外れます。標準モデルの窓は48トークンで固定です。この操作が変えるのは図だけ。first-lmの生成と同じように、窓の中の位置は0から数え直します。')}</p>
  </section>;
}
