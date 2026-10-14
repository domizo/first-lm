import {useState} from 'react';
import {useI18n} from '../lib/i18n';
import type {ChapterId} from '../lib/routes';
import {checks} from '../lib/checkContent';
export {checks} from '../lib/checkContent';

export default function QuickCheck({chapter}:{chapter:ChapterId}) {
  const {t}=useI18n();
  const [selection,setSelection]=useState<{chapter:ChapterId;index:number}|null>(null);
  const [missingCue,setMissingCue]=useState(false);
  const q=checks[chapter], choice=selection?.chapter===chapter?selection.index:null;
  const selected=choice===null?null:q.options[choice];
  function showCue(){
    const target=document.getElementById(q.targetId);
    if(!target){setMissingCue(true);return;}
    setMissingCue(false);
    target.focus({preventScroll:true});
    target.scrollIntoView({block:'center',behavior:'instant'});
  }
  return <section className="quick-check" aria-labelledby={`check-${chapter}`}>
    <span className="level-label">{t('Choose, then explore the reason','選んで、理由を確かめよう')}</span>
    <p className="check-purpose">{t('Make a prediction. Each choice explains what that idea would mean and where to check it in the diagram. Try the other choice too; there are no points or progress requirements.','まず予想を1つ選んでみましょう。その考え方では何が起きるかと、図で確かめる場所を説明します。選び直して比べられます。点数や、先へ進むための条件はありません。')}</p>
    <h3 id={`check-${chapter}`}>{t(...q.question)}</h3>
    <div className="check-choices" role="group" aria-labelledby={`check-${chapter}`}>
      {q.options.map((option,index)=><button key={index} type="button" aria-pressed={choice===index} onClick={()=>{setSelection({chapter,index});setMissingCue(false);}}>
        <span>{t(...option.label)}</span>{choice===index&&<small aria-hidden="true">{t('Selected','選択中')}</small>}
      </button>)}
    </div>
    <div className="check-feedback" role="status" aria-live="polite" aria-atomic="true">
      {selected?<>
        <p className="check-selected"><span>{t('Your choice: ','選んだ考え：')}</span>{t(...selected.label)}</p>
        <h4>{t(...selected.heading)}</h4>
        <p className="check-reason">{t(...selected.reason)}</p>
        <div className="check-cue-copy"><strong>{t('What to look at in the diagram','図で確かめるところ')}</strong><p>{t(...selected.cue)}</p></div>
      </>:<p className="check-awaiting">{t('Choose either idea to see its explanation here.','どちらかを選ぶと、その理由がここに表示されます。')}</p>}
    </div>
    {selected&&<div className="check-evidence-action"><button type="button" className="button secondary" onClick={showCue}>{t('Show the relevant part of the diagram','図の該当部分を枠で示す')} <span aria-hidden="true">↑</span></button><p>{t('This moves focus to the diagram above. It does not reset your controls or change the model.','上の図へ移動して、該当する部分にフォーカスします。つまみの設定やモデルは変えません。')}</p></div>}
    {missingCue&&<p role="alert">{t('The diagram is not available here. Use the written cue above.','ここでは図が見つかりません。上の「図で確かめるところ」を参照してください。')}</p>}
  </section>;
}
