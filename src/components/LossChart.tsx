import {useI18n} from '../lib/i18n';
import type {Metric} from '../lib/types';
export default function LossChart({metrics,selectedStep}:{metrics:Metric[];selectedStep?:number}){
 const {t}=useI18n();const w=860,h=290,p={left:51,right:18,top:15,bottom:43};
 if(!metrics.length)return <div className="chart-empty">{t('Waiting for the first real evaluation…','最初の実際の評価を待っています…')}</div>;
 const maxY=Math.max(1,Math.ceil(Math.max(...metrics.flatMap(m=>[m.trainLoss,m.validationLoss]))*1.08)),maxX=Math.max(1,...metrics.map(m=>m.step));
 const x=(v:number)=>p.left+v/maxX*(w-p.left-p.right),y=(v:number)=>h-p.bottom-v/maxY*(h-p.top-p.bottom);
 const path=(key:'trainLoss'|'validationLoss')=>metrics.map((m,i)=>`${i?'L':'M'}${x(m.step).toFixed(2)},${y(m[key]).toFixed(2)}`).join(' ');
 const last=metrics.at(-1)!;
 return <figure className="loss-chart"><svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={t(`Cross-entropy loss across ${maxX} steps. Latest training loss ${last.trainLoss.toFixed(3)}, held-out loss ${last.validationLoss.toFixed(3)}.`,`交差エントロピー損失。${maxX} ステップ。最新の訓練損失 ${last.trainLoss.toFixed(3)}、検証損失 ${last.validationLoss.toFixed(3)}。`)}>
 {[0,1,2,3,4].map(i=>{const v=maxY*i/4;return <g key={i}><line className="grid-line" x1={p.left} y1={y(v)} x2={w-p.right} y2={y(v)}/><text x={p.left-12} y={y(v)+4} textAnchor="end">{v.toFixed(1)}</text></g>;})}
 {[0,1,2,3,4,5,6].map(i=>{const v=maxX*i/6;return <g key={i}><line className="grid-line vertical" x1={x(v)} y1={p.top} x2={x(v)} y2={h-p.bottom}/><text x={x(v)} y={h-p.bottom+23} textAnchor="middle">{Math.round(v)}</text></g>;})}
 <line className="axis-line" x1={p.left} y1={p.top} x2={p.left} y2={h-p.bottom}/><line className="axis-line" x1={p.left} y1={h-p.bottom} x2={w-p.right} y2={h-p.bottom}/>
 {selectedStep!==undefined&&<line className="checkpoint-line" x1={x(selectedStep)} x2={x(selectedStep)} y1={p.top} y2={h-p.bottom}/>}
 <path className="validation-path" d={path('validationLoss')}/><path className="train-path" d={path('trainLoss')}/>
 <text x={w/2} y={h-2} textAnchor="middle">{t('Optimizer steps','最適化ステップ')}</text><text transform={`translate(12 ${h/2-8}) rotate(-90)`} textAnchor="middle">{t('Cross-entropy loss','交差エントロピー損失')}</text>
 </svg><figcaption className="sr-only">{metrics.map(m=>`${m.step}: train ${m.trainLoss}, held-out ${m.validationLoss}`).join('; ')}</figcaption></figure>;
}
