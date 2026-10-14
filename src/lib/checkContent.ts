import type {ChapterId} from './routes';

export type Copy = [string, string];
export type CheckOption = {
  label: Copy;
  heading: Copy;
  reason: Copy;
  cue: Copy;
};

export const checks: Record<ChapterId, {
  question: Copy;
  options: [CheckOption, CheckOption];
  correct: number;
  targetId: string;
}> = {
  overview: {
    question: ['As generated letters are added, what is updated?', '生成した文字を付け足すと、何が変わる？'],
    options: [
      {
        label: ['The generated text and the input used next', 'できた文章と、次に使う入力'],
        heading: ['The text grows; the saved numbers stay fixed', '文章は伸びても、保存した数値はそのまま'],
        reason: [
          'Adding the chosen letter gives the next prediction a new input. This can change the next prediction even though the model uses the same saved numbers each time.',
          '選んだ文字を付け足すと、次の予測に使う入力が変わります。毎回同じ数値を使っていても、入力が変われば予測は変わることがあります。',
        ],
        cue: [
          'In “Use: keep internal numbers”, follow “the ca” → “the cat”. The text grows beside the lock marked “Numbers stay fixed”.',
          '「使うとき：数値はそのまま」の「the ca」→「the cat」を見てみましょう。文章は伸びますが、鍵の横には「数値は固定」とあります。',
        ],
      },
      {
        label: ['The model automatically studies and changes its saved numbers', '自動で勉強して、保存した数値も変わる'],
        heading: ['Changing saved numbers would be training', '保存した数値を直すのは、学習するとき'],
        reason: [
          'This choice would mean every new letter trains the model. In this generation loop, it only adds to the text used for the next prediction. Updating saved numbers is a separate training step.',
          'この選択だと、1文字出すたびに学習することになります。この生成の流れでは、文字を次の予測の入力に付け足すだけです。保存した数値を直す学習は、別の作業です。',
        ],
        cue: [
          'The “Use” lane says “Add it, then predict again”, but its lock still says “Numbers stay fixed”. Adding text does not unlock the numbers.',
          '「使うとき」の列には「付け足して、また次を予測する」とありますが、鍵の横は「数値は固定」のままです。文字の追加は、数値の調整ではありません。',
        ],
      },
    ],
    correct: 0,
    targetId: 'check-cue-overview',
  },
  data: {
    question: ['Where does the practice answer “t” come from?', '練習の答え「t」は、どこから来る？'],
    options: [
      {
        label: ['A person must type it for every training step', '人が毎回、答えを入力する'],
        heading: ['The text already supplies this answer', 'この答えは、元の文章にもう書いてある'],
        reason: [
          'People prepare the training text, but do not have to answer each next-letter problem. Once “the cat” is available, the computer can hide its final t and use that t to check the prediction.',
          '人は練習用の文章を用意しますが、次の文字の問題に毎回答える必要はありません。「the cat」があれば、最後の t を隠して問題を作り、その t で予測を確かめられます。',
        ],
        cue: [
          'Match “the ca” in “Shown to the model” with t in “Next-letter answer”. This pair comes from the existing “the cat” sentence above it.',
          '「モデルに見せる」の「the ca」と、「次の文字の答え」の t を見比べましょう。どちらも、上にある元の文章「the cat」から取っています。',
        ],
      },
      {
        label: ['It is the next character already written in “the cat”', '元の文章「the cat」の次の文字'],
        heading: ['One text becomes both a question and its answer', '1つの文章から、問題と答えを作れる'],
        reason: [
          'After “the ca”, the existing sentence continues with t. Hiding that continuation creates the question; keeping the hidden letter separately gives the training calculation its answer.',
          '元の文章では「the ca」の次に t が続きます。続きを隠せば問題になり、隠した文字を別に取っておけば、学習の計算で使う答えになります。',
        ],
        cue: [
          'Read the two input–answer pairs: “the c” → a and “the ca” → t. Moving one letter forward supplies the next answer from the same text.',
          '「the c」→ a と、「the ca」→ t の2組を見てみましょう。見せる部分を1文字伸ばすと、同じ文章の次の文字が答えになります。',
        ],
      },
    ],
    correct: 1,
    targetId: 'check-cue-data',
  },
  embeddings: {
    question: ['Does ID 7 mean a letter is more important than ID 3?', '番号7の文字は、番号3の文字より重要？'],
    options: [
      {
        label: ['Yes: a larger ID means greater importance', 'はい。番号が大きいほど重要'],
        heading: ['A lookup number is not an importance score', '探すための番号は、重要度の点数ではない'],
        reason: [
          'This would treat 7 and 3 as scores, but they are labels, like locker numbers. The ID selects a list of numbers for a letter. Its size does not tell us how important that letter is.',
          'この選択は7と3を点数として比べていますが、ここではロッカー番号のような目印です。番号で文字の数値リストを選びます。番号が大きいだけで、その文字が重要になるわけではありません。',
        ],
        cue: [
          'Follow t → “ID 7” → “[0.2, −0.1, 0.4, …]”. ID 7 is the middle lookup label, not a score assigned to t. These labels and values are made-up examples.',
          't →「番号 7」→「[0.2, −0.1, 0.4, …]」とたどりましょう。番号7は途中の目印で、t に付けた点数ではありません。この番号と数値は説明用の例です。',
        ],
      },
      {
        label: ['No: the IDs are just lookup labels', 'いいえ。探すための目印にすぎない'],
        heading: ['The ID finds the list the calculation will use', '番号は、計算に使うリストを見つける目印'],
        reason: [
          'The model looks up the letter’s number list using its ID. Training can change the numbers in that list; it does not make a larger ID mean a more important letter.',
          'モデルは番号を使って、その文字の数値リストを取り出します。学習ではリストの数値を変えられますが、番号が大きいほど重要という意味を付けるわけではありません。',
        ],
        cue: [
          'The three boxes show a character, its lookup label, then its number list. The calculation uses the list after “ID 7”, rather than treating 7 as an importance score.',
          '3つの箱は「文字」「探すための番号」「数値のリスト」の順です。計算に使うのは「番号 7」の先にあるリストで、7を重要度の点数として使うのではありません。',
        ],
      },
    ],
    correct: 1,
    targetId: 'check-cue-embeddings',
  },
  attention: {
    question: ['Can the next answer enter the calculation that predicts it?', '次の文字の答えを、その文字を予測する計算に入れてもよい？'],
    options: [
      {
        label: ['No: that would reveal the answer', 'だめ。答えを先に見てしまう'],
        heading: ['Predict first, then compare with the hidden answer', '先に予測し、そのあとで隠した答えと比べる'],
        reason: [
          'The prediction uses only the allowed input. During training, a separate comparison uses the next letter afterward to calculate loss. Moving the boundary changes which letter is next, but never lets that answer into its own prediction.',
          '予測には、見てよい入力だけを使います。学習では、そのあとに次の文字と比べて損失を計算します。境界を動かすと答えの文字も変わりますが、答えを先に予測の計算へ入れることはありません。',
        ],
        cue: [
          'Find the next-letter answer marked × and the line “kept hidden from this prediction”. That letter stays outside the tokens used for this prediction, wherever you move the boundary.',
          '× が付いた次の文字と、「この予測には見せない、次の文字の答え」の行を見ましょう。境界を動かしても、その答えは今回の計算に入る文字には含まれません。',
        ],
      },
      {
        label: ['Yes: it needs to read the answer to make its prediction', 'よい。予測する前に答えを読む必要がある'],
        heading: ['Seeing the answer would let the model copy it', '答えを先に見せると、そのまま写せてしまう'],
        reason: [
          'Training does need the answer to check a prediction, but giving it to the prediction itself would leak the answer. Keep those two jobs separate: predict from earlier input, then compare with the next letter.',
          '学習で予測を確かめるには答えが必要です。でも予測する計算にも答えを渡すと、先に答えを教えることになります。「手前の入力から予測する」と「次の文字と比べる」は分けます。',
        ],
        cue: [
          'The next answer has ×, not the ● used for tokens inside the window. The line “kept hidden from this prediction” explains why you can see it in the teaching diagram while the prediction cannot use it.',
          '次の答えには、窓の中を表す ● ではなく × が付いています。「この予測には見せない」の行が示すとおり、説明図では答えを表示していても、予測の計算には渡しません。',
        ],
      },
    ],
    correct: 0,
    targetId: 'check-cue-attention',
  },
  loss: {
    question: ['The answer is t. Which prediction has a smaller penalty?', '正解は t。損失が小さいのはどちら？'],
    options: [
      {
        label: ['20% chance for t', 't の確率が20%'],
        heading: ['20% gives the known answer less chance, so loss is higher', '20%では正解の確率が低いので、損失は大きい'],
        reason: [
          'In this chosen example, 20% for t gives a loss of 1.6094 nats; 70% gives 0.3567 nats. A smaller chance for the known answer means a larger penalty. These are example probabilities, not predictions measured from the model.',
          'この説明用の例では、t が20%なら損失は1.6094 nat、70%なら0.3567 natです。正解に付けた確率が低いほど、損失は大きくなります。どちらも説明のために選んだ確率で、モデルの実測値ではありません。',
        ],
        cue: [
          'Set “Chance of the correct letter t” to 20%, then 70%. The loss readout and the dot on the curve both move down at 70%.',
          '「正解 t の確率」のつまみを20%、次に70%にしてみましょう。70%にすると、損失の表示も曲線の点も下がります。',
        ],
      },
      {
        label: ['70% chance for t', 't の確率が70%'],
        heading: ['70% gives the known answer more chance, so loss is lower', '70%では正解の確率が高いので、損失は小さい'],
        reason: [
          'In this chosen example, raising t from 20% to 70% lowers loss from 1.6094 to 0.3567 nats. That rewards giving the known answer more probability. It does not guarantee that a random choice will pick t. These are example values, not measured model predictions.',
          'この説明用の例では、t の確率を20%から70%にすると、損失は1.6094から0.3567 natに下がります。正解に高い確率を付けた予測ほど、損失が小さくなります。ただし、確率に従って選ぶときに必ず t が出るわけではありません。モデルの実測値ではなく、説明用の数値です。',
        ],
        cue: [
          'Compare 20% and 70% with the probability slider. At 70%, “Loss for this one answer” is smaller and the curve’s dot is farther right and lower.',
          '確率のつまみで20%と70%を比べましょう。70%では「この1文字の損失」が小さくなり、曲線の点も右下へ動きます。',
        ],
      },
    ],
    correct: 1,
    targetId: 'check-cue-loss',
  },
  optimization: {
    question: ['In a real model, does one adjustment have to improve every practice example?', '本物のモデルでは、1回の調整ですべての練習問題がよくなる？'],
    options: [
      {
        label: ['No: check the overall trend across many updates', '必ずではない。何度も調整した全体の傾向を見る'],
        heading: ['Shared numbers can help one example and hurt another', '同じ数値の調整が、別の問題には逆効果になることも'],
        reason: [
          'A real model reuses its numbers across many examples, so an update can help some and hurt others. We check the overall losses over time. The toy above is simpler: it repeatedly trains just one fixed answer, so its loss falls on every update.',
          '本物のモデルは、たくさんの問題で同じ数値を使います。ある問題によい調整が、別の問題にはよくないこともあるので、全体の損失の変化を見ます。上の小さな例は、1つの同じ答えだけで練習する仕組みなので、更新のたびに損失が下がります。',
        ],
        cue: [
          'Read the diagram’s final caption: many numbers are adjusted together, and one update need not improve every example. This describes real training; the one-answer toy does not show that trade-off.',
          '図の最後にある「多くの数値をまとめて調整するため、1回の更新ですべての問題がよくなるとは限りません」を読みましょう。本物の学習の説明です。答えが1つだけの小さな例では、この食い違いは再現していません。',
        ],
      },
      {
        label: ['Yes: otherwise the training must be broken', '必ずよくなる。そうでなければ学習が壊れている'],
        heading: ['One worse example does not by itself mean training is broken', '1つの問題が悪くなっただけで、学習の故障とは言えない'],
        reason: [
          'The one-answer toy lowers its loss each time, but that is not a promise for a real model. Real examples share model numbers and can pull adjustments in different directions. A single worse result is a reason to inspect the wider trend, not enough to declare failure.',
          '答えが1つだけの小さな例では、毎回損失が下がります。でも本物のモデルでもそうなるとは限りません。多くの問題が同じ数値を使い、問題によって望ましい調整の方向が違うことがあります。1つの結果だけで故障と決めず、全体の変化を確かめます。',
        ],
        cue: [
          'The final caption says “one update need not improve every example”. Compare that limit with the toy’s single fixed answer: its always-decreasing loss cannot establish a rule for all real training examples.',
          '最後の説明には「1回の更新ですべての問題がよくなるとは限りません」とあります。正解を1つに固定した小さな例の損失が毎回下がっても、本物の練習問題すべてに同じことが言えるわけではありません。',
        ],
      },
    ],
    correct: 0,
    targetId: 'check-cue-optimization',
  },
  evaluation: {
    question: ['A good score on these short template sentences proves what?', 'この短い定型文でよい成績なら、何が分かる？'],
    options: [
      {
        label: ['The model can answer any question correctly', 'どんな質問にも正しく答えられる'],
        heading: ['A small check cannot test every kind of question', '小さな確認だけで、あらゆる質問への力は分からない'],
        reason: [
          'These check sentences resemble the practice sentences. Doing well on them gives evidence about those patterns, but questions with different topics or structures may still be difficult. The check has not tested “any question”.',
          '確認用の文章は、練習用と似た文型です。よい成績は、そのパターンを予測できた証拠になりますが、話題や形が違う質問は苦手かもしれません。「どんな質問でも」を確かめたわけではありません。',
        ],
        cue: [
          'The final caption says both piles share simple sentence patterns. That is why a good check score here does not prove broad language understanding.',
          '最後の説明に「両方の山に似た文型がある」と書かれています。そのため、ここでのよい成績だけでは、幅広い言語理解までは証明できません。',
        ],
      },
      {
        label: ['It predicts these measured patterns fairly well', '測った範囲のパターンを、よく予測できる'],
        heading: ['The evidence reaches as far as the patterns checked', '確かめられるのは、実際に測ったパターンの範囲'],
        reason: [
          'A good check score shows that the model predicts the held-aside text well by this measure. Because that text has similar sentence patterns, this is useful evidence for this small task. Broader claims need broader checks.',
          'よい成績なら、この測り方では、別に取っておいた文章をうまく予測できています。ただし文型は練習用と似ているので、この小さな課題で役立つ証拠です。もっと広い力を確かめるには、確認する範囲も広げる必要があります。',
        ],
        cue: [
          'Read the final caption’s limit: the two piles still share simple sentence patterns. Keeping examples aside is useful, but their similarity limits what the result tells us.',
          '最後の説明の「両方の山に似た文型がある」に注目しましょう。文章を別に取っておくことは役立ちますが、文型が似ているため、結果から言えることにも限りがあります。',
        ],
      },
    ],
    correct: 1,
    targetId: 'check-cue-evaluation',
  },
  generation: {
    question: ['With several eligible candidates, does raising temperature teach new knowledge or change selection?', '選べる候補が複数あるとき、温度を上げると、新しい知識を学ぶ？ それとも選び方が変わる？'],
    options: [
      {
        label: ['It changes the next-letter selection rule without retraining', '学習し直さずに、次の文字の選び方を変える'],
        heading: ['Temperature changes selection using the same saved numbers', '温度は、同じ数値を使って文字を選ぶ方法を変える'],
        reason: [
          'When sampling from several eligible candidates, higher temperature ordinarily makes their chances less concentrated. It changes how the same scores become probabilities, without teaching the model. Equal scores can keep equal chances, and a random draw can still choose the same letter.',
          '複数の候補から確率に従って選ぶとき、温度を上げると、ふつうは確率の偏りが小さくなります。同じスコアを確率に変える方法が変わるのであって、モデルが学習するわけではありません。スコアが同じなら確率が変わらないことも、抽選で同じ文字が選ばれることもあります。',
        ],
        cue: [
          'The final caption connects temperature with the spread of chances, not new knowledge. Read it with the lock above: “Same saved numbers at every turn”. A changed setting does not promise a different or more accurate sentence.',
          '最後の説明で、温度が変えるのは確率の広がりで、知識は増えないことを確かめましょう。上の鍵にも「どの回も、保存した数値は同じ」とあります。設定を変えても、別の文章や、より正しい文章が必ず出るわけではありません。',
        ],
      },
      {
        label: ['It teaches new facts and makes answers more accurate', '新しい知識を教えて、答えを正確にする'],
        heading: ['Changing a selection setting does not teach new facts', '選び方の設定を変えても、新しい知識は増えない'],
        reason: [
          'Temperature supplies no new examples and makes no training update. With several eligible candidates, raising it ordinarily makes their chances less concentrated. This can make unlikely choices more common, but they may be wrong. More varied choices do not guarantee more accurate answers.',
          '温度を変えても、新しい教材を与えたり、学習で数値を更新したりはしません。候補が複数あれば、温度を上げると、ふつうは確率の偏りが小さくなります。選ばれにくかった候補も出やすくなりますが、その候補が間違いの場合もあります。選び方の幅が広がっても、正確さの保証にはなりません。',
        ],
        cue: [
          'The final caption says temperature does not add knowledge or guarantee correctness. The lock above shows why: the saved model numbers stay the same while letters are chosen.',
          '最後の説明に、温度は「知識を増やしたり正しさを保証したりしません」とあります。上の鍵が示すとおり、文字を選んでいる間、モデルの保存した数値は変わりません。',
        ],
      },
    ],
    correct: 0,
    targetId: 'check-cue-generation',
  },
};
