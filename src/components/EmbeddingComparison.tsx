import {useId} from 'react';
import {useI18n} from '../lib/i18n';
import {embeddingProbe} from '../lib/learning';
import {tokenize} from '../lib/model';
import type {RunBundle} from '../lib/types';
import './EmbeddingComparison.css';

type Coordinate = ReturnType<typeof embeddingProbe>[number];
type CoordinateKind = 'token' | 'position' | 'sum';
const positions = [1, 7] as const;

function signed(value: number) {
  if (value === 0) return '0.0000';
  const magnitude = Math.abs(value);
  const digits = magnitude < 0.00005 || magnitude >= 1000
    ? magnitude.toExponential(2)
    : magnitude.toFixed(4);
  return `${value < 0 ? '−' : '+'}${digits}`;
}

function CoordinatePanel({kind, rows, limit}: {
  kind: CoordinateKind;
  rows: Coordinate[][];
  limit: number;
}) {
  const {t} = useI18n();
  const title = kind === 'token'
    ? t('Token embedding', 'トークン埋め込み')
    : kind === 'position'
      ? t('Position embedding', '位置埋め込み')
      : t('Input representation', '入力の表現');
  const detail = kind === 'token'
    ? t('SAME token row', '同じトークンの行')
    : kind === 'position'
      ? t('DIFFERENT position rows', '異なる位置の行')
      : t('SUM before attention', '注意計算の前の合計');
  return <section className={`embedding-comparison-panel embedding-comparison-${kind}`} aria-label={title}>
    <div className="embedding-comparison-panel-heading">
      <span className="embedding-comparison-operator" aria-hidden="true">{kind === 'token' ? '①' : kind === 'position' ? '+' : '='}</span>
      <div><h4>{title}</h4><p>{detail}</p></div>
    </div>
    <div className="embedding-comparison-axis" aria-hidden="true">
      <span>{signed(-limit)}</span><span>0</span><span>{signed(limit)}</span>
    </div>
    <ol className="embedding-comparison-coordinates">
      {rows[0].map((coordinate, dimensionIndex) => <li key={coordinate.dimension}>
        <span className="embedding-comparison-dimension">{t('Dimension', '次元')} {coordinate.dimension}</span>
        {positions.map((position, rowIndex) => {
          const value = rows[rowIndex][dimensionIndex][kind];
          const width = Math.abs(value) / limit * 50;
          return <div className={`embedding-comparison-value embedding-comparison-position-${position}`} key={position}
            data-position={position} data-dimension={coordinate.dimension} data-value={value}>
            <span className="embedding-comparison-position-label" aria-label={t(`Position ${position}`, `位置 ${position}`)}>{position}</span>
            <span className="embedding-comparison-track" aria-hidden="true">
              <span className="embedding-comparison-bar" style={{left: `${value < 0 ? 50 - width : 50}%`, width: `${width}%`}}/>
              <span className="embedding-comparison-point" style={{left: `${50 + value / limit * 50}%`}}/>
            </span>
            <span className="embedding-comparison-number">{signed(value)}</span>
          </div>;
        })}
      </li>)}
    </ol>
  </section>;
}

/** A read-only view of the exported vectors. It does not run attention or alter weights. */
export default function EmbeddingComparison({bundle, checkpoint}: {bundle: RunBundle; checkpoint: number}) {
  const {t} = useI18n();
  const id = useId();
  const tokenized = tokenize(bundle, 'the cat');
  const tokenId = tokenized.ids[0];
  // The parser guarantees the reserved IDs, but does not require special metadata.
  const unknown = tokenId === 0;
  const rows = positions.map(position => embeddingProbe(bundle, checkpoint, tokenId, position));
  const maximum = Math.max(...rows.flatMap(coordinates => coordinates.flatMap(row => [Math.abs(row.token), Math.abs(row.position), Math.abs(row.sum)])));
  // A zero-centered shared scale: never normalize the two positions separately.
  const unit = maximum > 0 ? 10 ** (Math.floor(Math.log10(maximum)) - 1) : 1;
  const limit = maximum > 0 ? (unit > 0 ? Math.ceil(maximum / unit) * unit : maximum) : 1;
  const step = bundle.checkpoints[checkpoint].step;
  const tokens = ['<bos>', ...Array.from('the cat')];

  return <figure className="embedding-comparison" aria-labelledby={`${id}-title`} data-checkpoint-step={step}>
    <figcaption>
      <span className="embedding-comparison-evidence">{t('Actual saved coordinates', '保存した実際の座標値')}</span>
      <h3 id={`${id}-title`}>{t('Two “t” letters: what stays the same?', '2 つの「t」、何が同じ？')}</h3>
      <p>{t('The same token vector is reused. A separate position vector is added for each location, coordinate by coordinate.', '同じトークンのベクトルを再利用し、各位置のベクトルを座標ごとに足します。')}</p>
    </figcaption>

    <ol className="embedding-comparison-sequence" aria-label={t('BOS and “the cat”, positions 0 through 7', 'BOS と「the cat」、位置 0 から 7')}>
      {tokens.map((token, position) => <li key={position} className={positions.some(value => value === position) ? 'is-compared' : ''}>
        <code>{token === ' ' ? '␣' : token === '<bos>' ? 'BOS' : token}</code><span>{position}</span>
      </li>)}
    </ol>
    <p className="embedding-comparison-sequence-note">{t('Numbers below the tokens are positions. BOS is the beginning-of-document token; ␣ is a space.', '下の数字は位置です。BOS は文書先頭のトークン、␣ は空白です。')}</p>

    {unknown && <p className="embedding-comparison-warning">{t('“t” is outside this imported vocabulary. Both highlighted letters use <unk> (ID 0), so the chart shows the unknown-token vector, not a learned “t” vector.', '読み込んだ語彙には「t」がありません。強調した 2 文字はどちらも <unk>（ID 0）になるため、図は「t」のベクトルではなく未知トークンのベクトルを示します。')}</p>}
    {tokenized.unknownCount > (unknown ? 2 : 0) && <p className="embedding-comparison-sequence-note">{t('Some other letters in this example are also outside the loaded vocabulary. The chart only compares the two highlighted positions.', 'この例には、ほかにも読み込んだ語彙にない文字があります。図で比較するのは強調した 2 つの位置だけです。')}</p>}

    <div className="embedding-comparison-meta">
      <span>{t(`Saved step ${step}`, `保存ステップ ${step}`)}</span>
      <span>{t(`First ${rows[0].length} of ${bundle.model.embedDim} coordinates`, `${bundle.model.embedDim} 次元のうち先頭 ${rows[0].length} 次元`)}</span>
      <span>{t('Token ID', 'トークン ID')} {tokenId}</span>
    </div>
    <div className="embedding-comparison-legend" aria-label={t('Position legend', '位置の凡例')}>
      <span><i className="embedding-comparison-key first" aria-hidden="true"/>{t('Position 1', '位置 1')}</span>
      <span><i className="embedding-comparison-key last" aria-hidden="true"/>{t('Position 7', '位置 7')}</span>
    </div>
    <p className="embedding-comparison-scale-note">{t('← Negative · 0 · Positive →. All three panels share one scale at this saved step. The scale updates when you change the step.', '← 負の値・0・正の値 →。3 つの図はこの保存ステップで共通の目盛りを使います。ステップを変えると目盛りも変わります。')}</p>

    <div className="embedding-comparison-panels">
      {(['token', 'position', 'sum'] as const).map(kind => <CoordinatePanel key={kind} kind={kind} rows={rows} limit={limit}/>)}
    </div>
    <p className="embedding-comparison-rounding">{t('Values are rounded for display; the sum is calculated before rounding. These coordinates have no assigned meaning such as “animal” or “color”.', '表示値は丸めています。合計は丸める前に計算します。各座標に「動物」「色」といった意味は割り当てられていません。')}</p>
    <div className="embedding-comparison-boundary">
      <strong>{t('This is the starting input, before attention.', 'ここに示すのは、注意計算の前の入力です。')}</strong>
      <p>{t('The Transformer then mixes information from allowed earlier positions and the current position. Its contextual hidden states are later representations, not the sums shown here.', 'この後、Transformer が参照可能な過去の位置と現在の位置の情報を組み合わせます。文脈を反映した隠れ状態はその後の表現であり、ここで示した合計とは別です。')}</p>
    </div>
  </figure>;
}
