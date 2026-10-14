import {useId, useState} from 'react';
import {useI18n} from '../lib/i18n';
import {
  clampToyInput, TOY_INITIAL_LOGITS, TOY_MAX_LEARNING_RATE, TOY_MAX_UPDATES, TOY_TARGET_INDEX,
  toyLogitGradient, toyLogitLoss, toyLogitStep, toyProbabilityLoss, toySoftmax,
} from '../lib/toyLearning';
import './LossPlayground.css';

const LETTERS = ['t', 'a', 'o'];
const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
const signed = (value: number) => `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(3)}`;

function LossCurve({probability}: {probability: number}) {
  const {t} = useI18n();
  const id = useId();
  const x = (value: number) => 48 + value * 326;
  const y = (value: number) => 206 - value / 5 * 176;
  const points = Array.from({length: 100}, (_, index) => {
    const p = (index + 1) / 100;
    return `${x(p)},${y(toyProbabilityLoss(p))}`;
  }).join(' ');
  const loss = toyProbabilityLoss(probability);
  return <figure className="toy-loss-curve">
    <svg viewBox="0 0 400 260" role="img" aria-labelledby={`${id}-title ${id}-description`}>
      <title id={`${id}-title`}>{t('Correct-answer probability and loss','正解の確率と損失')}</title>
      <desc id={`${id}-description`}>{t(
        `Loss is minus the natural logarithm of probability. The curve goes down as probability increases. At ${Math.round(probability * 100)} percent, loss is ${loss.toFixed(4)} nats.`,
        `損失は、確率の自然対数にマイナスを付けた値。確率が上がるほど曲線は下がります。現在の確率 ${Math.round(probability * 100)}% では、損失は ${loss.toFixed(4)} nat です。`,
      )}</desc>
      {[0, 1, 2, 3, 4, 5].map(value => <g key={value}>
        <line x1="48" x2="374" y1={y(value)} y2={y(value)} className="toy-grid-line"/>
        <text x="38" y={y(value) + 4} textAnchor="end">{value}</text>
      </g>)}
      <path d="M48 30 V206 H374" className="toy-axis-line"/>
      {[0, 25, 50, 75, 100].map(value => <g key={value}>
        <line x1={x(value / 100)} x2={x(value / 100)} y1="206" y2="211" className="toy-axis-line"/>
        <text x={x(value / 100)} y="226" textAnchor="middle">{value}%</text>
      </g>)}
      <text x="48" y="17" className="toy-axis-label">{t('Loss (nats)','損失（nat）')}</text>
      <text x="211" y="249" textAnchor="middle" className="toy-axis-label">{t('Probability of the correct letter t','正解 t に付けた確率')}</text>
      <polyline points={points} className="toy-curve-path"/>
      <path d={`M48 ${y(loss)} H${x(probability)} V206`} className="toy-marker-guides"/>
      <circle cx={x(probability)} cy={y(loss)} r="6" className="toy-curve-marker"/>
    </svg>
    <figcaption>{t('The dot follows your slider. Higher probability → lower loss.','つまみを動かすと、点も動きます。正解の確率が高いほど、損失は小さくなります。')}</figcaption>
  </figure>;
}

function ProbabilityLoss() {
  const {t} = useI18n();
  const id = useId();
  const [probabilityPercent, setProbabilityPercent] = useState(20);
  const probability = probabilityPercent / 100;
  const loss = toyProbabilityLoss(probability);
  return <section className="toy-learning" data-toy-mode="loss" aria-labelledby={`${id}-title`}>
    <div className="toy-heading"><span>{t('TRY IT','動かしてみよう')}</span><small>{t('Chosen numbers · explanatory demo','説明用に決めた数値')}</small></div>
    <h3 id={`${id}-title`}>{t('How much chance did the answer get?','正解に、どのくらい確率を付けた？')}</h3>
    <p className="toy-intro">{t('The next letter after “the ca” is t in this example. Move the slider and watch how its probability changes the loss.','この例では「the ca」の次の正解は t。つまみを動かして、正解の確率と損失の関係を見てみましょう。')}</p>
    <div className="toy-loss-layout">
      <div className="toy-loss-controls" id="check-cue-loss" data-check-cue="loss" tabIndex={-1} role="group" aria-label={t('Correct-letter probability and loss','正解の文字の確率と損失')}>
        <label className="toy-slider-label" htmlFor={`${id}-probability`}><span>{t('Chance of the correct letter t','正解 t の確率')}</span><output htmlFor={`${id}-probability`}>{probabilityPercent}%</output></label>
        <input id={`${id}-probability`} type="range" min="1" max="99" step="1" value={probabilityPercent} aria-valuetext={`${probabilityPercent}%`} onChange={event => setProbabilityPercent(clampToyInput(Number(event.target.value), 1, 99, 20))}/>
        <div className="toy-range-ends" aria-hidden="true"><span>1%</span><span>99%</span></div>
        <div className="toy-probability-summary">
          <div className="toy-total-bar" aria-hidden="true"><span style={{width: `${probabilityPercent}%`}}/><i style={{width: `${100 - probabilityPercent}%`}}/></div>
          <div className="toy-total-labels"><span><i className="toy-key target"/>{t('Correct t','正解 t')} <strong>{probabilityPercent}%</strong></span><span><i className="toy-key other"/>{t('All other letters together','ほかの文字の合計')} <strong>{100 - probabilityPercent}%</strong></span></div>
        </div>
        <div className="toy-loss-result" role="status" aria-live="polite" aria-atomic="true"><span>{t('Loss for this one answer','この1文字の損失')}</span><strong>{loss.toFixed(4)} <small>nat</small></strong></div>
        <p className="toy-small-note">{t('We use the chance given to t. Which letter comes first in the ranking is not enough to tell us the loss.','損失を見るには、t に付けた確率が必要です。どの文字が1位だったか、だけでは分かりません。')}</p>
      </div>
      <LossCurve probability={probability}/>
    </div>
    <details className="toy-math-details"><summary>{t('Why this curve? See the calculation','この曲線になるのはなぜ？ 計算を見る')}</summary><div>
      <p>{t('For one correct answer, loss = −ln(p), where p is its probability from 0 to 1. ln means the natural logarithm; its unit here is called a nat.','1つの正解に対する損失は −ln(p)。p は0から1で表した正解の確率です。ln は自然対数のことで、この損失の単位を nat と呼びます。')}</p>
      <p className="toy-equation">−ln({probability.toFixed(2)}) = {loss.toFixed(4)} nat</p>
      <p>{t('At 100%, loss is 0. As the chance approaches 0%, loss keeps increasing without a finite limit. This slider stays between 1% and 99%. The curve is calculated from the formula; displayed numbers are rounded.','確率100%なら損失は0。0%に近づくほど、損失は限りなく大きくなります。このつまみの範囲は1〜99%です。曲線は式から計算し、表示する数値は丸めています。')}</p>
    </div></details>
    <p className="toy-caveat">{t('These probabilities are chosen for explanation, not measured predictions from the loaded model. “All other letters” combines many possibilities; it is not one competing letter.','確率は説明のために決めたもので、読み込んだモデルの実測値ではありません。「ほかの文字」は複数の候補の合計で、1つの文字ではありません。')}</p>
  </section>;
}

interface UpdateState {
  history: number[][];
  lastRate: number | null;
}
const initialUpdateState = (): UpdateState => ({history: [[...TOY_INITIAL_LOGITS]], lastRate: null});

function ScoreUpdate() {
  const {t} = useI18n();
  const id = useId();
  const [learningRate, setLearningRate] = useState(0.5);
  const [state, setState] = useState<UpdateState>(initialUpdateState);
  const count = state.history.length - 1;
  const before = state.history[Math.max(0, count - 1)];
  const after = state.history[count];
  const beforeProbabilities = toySoftmax(before);
  const afterProbabilities = toySoftmax(after);
  const gradient = toyLogitGradient(before, TOY_TARGET_INDEX);
  const beforeLoss = toyLogitLoss(before, TOY_TARGET_INDEX);
  const afterLoss = toyLogitLoss(after, TOY_TARGET_INDEX);
  const step = () => setState(previous => {
    if (previous.history.length - 1 >= TOY_MAX_UPDATES) return previous;
    return {history: [...previous.history, toyLogitStep(previous.history[previous.history.length - 1], TOY_TARGET_INDEX, learningRate)], lastRate: learningRate};
  });
  const reset = () => {setState(initialUpdateState()); setLearningRate(0.5);};
  return <section className="toy-learning" data-toy-mode="update" aria-labelledby={`${id}-title`}>
    <div className="toy-heading"><span>{t('TRY IT','動かしてみよう')}</span><small>{t('Three-score toy · chosen numbers','3つのスコアだけの説明用モデル')}</small></div>
    <h3 id={`${id}-title`}>{t('Adjust the scores, then predict again','スコアを直して、もう一度予測する')}</h3>
    <p className="toy-intro">{t('Keep the same answer, t. Each update raises its score and lowers the other two. Turning these scores into probabilities gives t a bigger share.','正解を t に固定します。1回更新するごとに t のスコアを上げ、ほかの2つを下げます。スコアを確率に変換すると、t の取り分が増えます。')}</p>
    <div className="toy-update-controls">
      <div><label className="toy-slider-label" htmlFor={`${id}-rate`}><span>{t('Next update size (learning rate)','次の更新の大きさ（学習率）')}</span><output htmlFor={`${id}-rate`}>{learningRate.toFixed(1)}</output></label>
        <input id={`${id}-rate`} type="range" min="0.1" max={TOY_MAX_LEARNING_RATE} step="0.1" value={learningRate} aria-valuetext={learningRate.toFixed(1)} onChange={event => setLearningRate(clampToyInput(Number(event.target.value), 0.1, TOY_MAX_LEARNING_RATE, 0.5))}/>
        <div className="toy-range-ends" aria-hidden="true"><span>{t('0.1 · smaller','0.1 · 小さめ')}</span><span>{t('2.0 · bigger','2.0 · 大きめ')}</span></div>
      </div>
      <div className="toy-update-buttons"><button type="button" className="button primary" onClick={step} disabled={count >= TOY_MAX_UPDATES}>{t('Update once','1回更新する')} <span aria-hidden="true">→</span></button><button type="button" className="button secondary" onClick={reset}>{t('Start over','最初に戻す')}</button></div>
    </div>
    <div className="toy-step-readout" role="status" aria-live="polite" aria-atomic="true"><strong>{t(`Updates: ${count} / ${TOY_MAX_UPDATES}`,`更新：${count} / ${TOY_MAX_UPDATES} 回`)}</strong><span>{count === 0 ? t('No update yet. Compare the bars after one click.','まだ更新していません。1回押して棒を比べてみましょう。') : t(`Last step: loss ${beforeLoss.toFixed(4)} → ${afterLoss.toFixed(4)} · rate ${state.lastRate!.toFixed(1)}`,`直前の1回：損失 ${beforeLoss.toFixed(4)} → ${afterLoss.toFixed(4)}・学習率 ${state.lastRate!.toFixed(1)}`)}</span></div>
    <div className="toy-update-cards">
      {LETTERS.map((letter, index) => <div key={letter} className={`toy-score-card ${index === TOY_TARGET_INDEX ? 'is-target' : ''}`}>
        <div className="toy-score-heading"><code>{letter}</code><span>{index === TOY_TARGET_INDEX ? t('Correct answer','正解の文字') : t('Other candidate','ほかの候補')}</span></div>
        <div className="toy-score-motion"><b>{index === TOY_TARGET_INDEX ? '↑' : '↓'}</b><span>{t(count === 0 ? 'Next score direction' : 'Score change',count === 0 ? '次に動かす方向' : 'スコアの変化')}<strong>{before[index].toFixed(2)} {count === 0 ? '' : `→ ${after[index].toFixed(2)}`}</strong></span></div>
        <div className="toy-mini-probability"><span>{t('Before','更新前')}<strong>{percent(beforeProbabilities[index])}</strong></span><div aria-hidden="true"><i style={{width: `${beforeProbabilities[index] * 100}%`}}/></div></div>
        <div className="toy-mini-probability after"><span>{t('After','更新後')}<strong>{percent(afterProbabilities[index])}</strong></span><div aria-hidden="true"><i style={{width: `${afterProbabilities[index] * 100}%`}}/></div></div>
      </div>)}
    </div>
    <p className="toy-small-note">{count >= TOY_MAX_UPDATES ? t('You reached 10 updates. Start over to compare another update size.','10回まで更新しました。「最初に戻す」で、別の更新の大きさも比べられます。') : t('The bars compare the most recent update. Change the size, then update again; the slider alone does not change the scores.','棒は直前の1回の更新を比べます。大きさを変えて、もう一度更新してみましょう。つまみだけでは、スコアは変わりません。')}</p>
    <div className="toy-update-takeaway"><strong>{t('Learning changes numbers','学習で変えるのは数値')}</strong><p>{t('The answer tells us which way to adjust the scores. We change the scores of different candidates, rather than add a stored “question → answer” entry. This tiny example only has one fixed answer; it does not show learning patterns across many sentences.','正解を使って、スコアをどちらに動かすかを計算します。「質問 → 答え」の項目を保存する代わりに、各候補の数値を調整しています。ただし、この小さな例の正解は1つだけ。たくさんの文章からパターンを学ぶ全体までは再現していません。')}</p></div>
    <details className="toy-math-details"><summary>{t('See the gradients and update rule','勾配と、更新の式も見る')}</summary><div>
      <p>{t('A logit is a score before softmax turns all scores into probabilities. Here we change those scores directly. For each letter, the gradient is its probability minus its target value: 1 for t, 0 for a and o.','logit は、softmax で確率に変える前のスコアです。この図では、そのスコアを直接変えます。各文字の勾配は「確率 − 正解の目印」。目印は t だけ1で、a と o は0です。')}</p>
      <p className="toy-equation">p = softmax(z)<br/>gᵢ = pᵢ − yᵢ<br/>zᵢ ← zᵢ − {t('learning rate','学習率')} × gᵢ</p>
      <ul className="toy-gradient-list">{LETTERS.map((letter, index) => <li key={letter}><code>{letter}</code><span>{gradient[index].toFixed(3)} = {beforeProbabilities[index].toFixed(3)} − {index === TOY_TARGET_INDEX ? '1' : '0'}</span><strong>{t('Score adjustment','スコアの調整')} {signed(-(state.lastRate ?? learningRate) * gradient[index])}</strong></li>)}</ul>
      <p>{t(count === 0 ? `These are the next step’s gradients, using rate ${learningRate.toFixed(1)}. A negative gradient makes the score go up because we subtract it.` : `These are the gradients used in the last step, with rate ${state.lastRate!.toFixed(1)}. A negative gradient makes the score go up because we subtract it.`,count === 0 ? `次の更新に使う勾配です。学習率は ${learningRate.toFixed(1)}。勾配がマイナスなら、それを引くのでスコアは上がります。` : `直前の更新で使った勾配です。学習率は ${state.lastRate!.toFixed(1)}。勾配がマイナスなら、それを引くのでスコアは上がります。`)}</p>
      <p>{t('For this one fixed target, any positive direct-logit step lowers its loss. A bigger rate here is not a demonstration of overshooting. A real network uses shared weights and different examples, so every example’s loss need not fall on every update.','この1つの正解だけを使うスコアの直接更新では、学習率が正なら損失は下がります。大きく更新して失敗する様子を示す図ではありません。本物のネットワークは多くの例で重みを共有するため、毎回すべての例の損失が下がるとは限りません。')}</p>
    </div></details>
    <p className="toy-caveat">{t('Illustration only: chosen scores, direct-logit SGD, and just three letters. This is not a full network or a recording of model weights. The actual trainer uses backpropagation, gradient-norm clipping, and AdamW, a different update method.','説明専用：仮のスコアを使い、3文字だけに SGD という単純な方法で直接更新します。ネットワーク全体や実際の重みの記録ではありません。本物の学習器は逆伝播、勾配ノルムの制限、そして別の更新方法である AdamW を使います。')}</p>
  </section>;
}

export default function LossPlayground({mode}: {mode: 'loss' | 'update'}) {
  return mode === 'loss' ? <ProbabilityLoss/> : <ScoreUpdate/>;
}
