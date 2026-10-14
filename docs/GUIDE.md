# A language model, from zero / ゼロから言語モデルを育てる

Run the app with `npm ci` → `npm run dev` after [cloning the repository](../README.md#get-the-source). Then open the local guide below; it requires no hosted-demo access. For real training, use the Python companion described in the README.

[リポジトリを取得](../README.ja.md#ソースを取得)して `npm ci` → `npm run dev` を実行してから、下のローカルガイドを開いてください。ホストされたデモへのアクセスは不要です。実際の学習にはREADMEのPythonサーバーを使います。

## Before you begin: what is an LLM? / はじめに：LLMって、どんなもの？

**LLM** means **Large Language Model**. It learns patterns from large amounts of text by adjusting many internal numbers, called parameters. Given some text, it predicts a next small piece, then repeats to build a response. A piece is called a **token**; many modern LLMs use word pieces, whole words or characters depending on the text. LLM-powered apps can help answer questions, draft text and translate. Fluent output can still be wrong, so check important information. These are numerical predictions, not human experience or a guarantee of understanding. An app may add web search, but the underlying model does not automatically search or verify sources.

**LLM**は **Large Language Model（大規模言語モデル）** の略です。大量の文章を使い、中にあるたくさんの数値（パラメータ）を調整して、言葉の使われ方を学びます。入力から次の小さな文字列を予測し、繰り返して返答を作ります。この単位が**トークン**です。現在の多くのLLMは、文章に応じて単語の一部分・単語・文字などを使います。質問への回答、下書き、翻訳などに使われますが、自然な文章でも間違うことがあります。大切な情報は確かめましょう。数値による予測は、人の経験や理解をそのまま再現するものではありません。検索機能を組み合わせたアプリもありますが、モデルだけで毎回ネットや出典を確認するわけではありません。

### What this guide explains / このガイドで分かること

The **included first-lm reference** is a tiny character-level Transformer with **62,064 parameters**, trained on repetitive project-written English/Japanese sentence patterns. Transformer is a design used by many LLMs. This tiny version exposes shared basics of prediction and learning. It is not a large chat assistant, and success on this toy corpus does not establish general language ability.

**同梱のfirst-lm参照モデル**は、**62,064個のパラメータ**を持つ小さな文字単位のTransformerです。この教材用の、似た形の短い英語・日本語の文で学びます。Transformerは多くのLLMで使う仕組みです。この小さな版で、共通する予測・学習の基本を観察できますが、大規模な会話AIと同じ能力はありません。この例文での成功は、言葉全般を使いこなせる証拠にはなりません。

Follow **text → numbers → prediction → checking → adjustment**. Training repeats prediction, checking and adjustment. Then **generation uses saved numbers held fixed**, adding text one piece at a time. Learn how text becomes a prediction, what training changes, how separate check data helps evaluate it, and why errors remain.

**文章 → 数値 → 予測 → 答え合わせ → 調整**を追います。学習では、予測・答え合わせ・調整を繰り返します。そのあと、**生成では保存した数値を固定**して、続きを少しずつ付け足します。文章から予測を作る方法、学習で変わるもの、別に取っておいた文章で効果を確かめる理由、間違いが残る理由を学びます。

Start with the [eight-chapter local browser guide](http://127.0.0.1:5173/#/learn/overview): a short “the ca” → “t” example, a labeled picture, then an unscored question. No AI background or formulas are needed. Real model numbers, deeper mechanisms and math/code are optional. The sections below are a more technical companion.

まずは[ローカルの8章のガイド](http://127.0.0.1:5173/#/learn/overview)で、「the ca」の次は「t」という例を、短い説明・図・採点しない確認問題で追ってみましょう。AIの予備知識や数式は不要です。本物の数値、詳しい仕組み、数式とコードは必要なときに開けます。以下は、その先の技術的な補助教材です。

**Outside this guide:** large-scale pretraining, additional training to follow chat instructions, learning from human feedback (RLHF), image/audio models and production service operations.

**扱わないこと:** 巨大なデータでの事前学習、会話の指示に従う追加学習、人の評価を使う学習（RLHF）、画像・音声モデル、実用サービスの運用。

## Explore with diagrams / 図を動かして確かめる

The browser chapters now include these complementary diagrams. No animation is needed: sliders, buttons and number labels work with a keyboard, and the static initial view still explains each idea.

ブラウザーの各章では、次の図を動かせます。自動アニメーションは使わず、キーボードでも操作できます。最初に表示される図と数値だけでも、仕組みを読み取れます。

- **Embeddings / 文字を数値に:** Open the real-model expander and compare the two `t` positions in `the cat`. The token vector is reused; a different position vector is added. Signed bars share a zero-centered scale, and show actual saved coordinates before attention. Change the saved step to compare checkpoints. / 本物の数値を開き、2つの `t` を比べます。文字のベクトルは同じで、位置のベクトルが違います。棒は注意計算前の実際の保存値を、共通の目盛りで示します。保存ステップも変えられます。
- **Attention / 見てよい範囲:** Move the last visible input and a small example window. See both hidden future tokens and older input outside the window; local position numbers restart at 0. This changes the illustration only, not the reference model's fixed 48-token architecture or measured attention. / 入力の境界と説明用の窓を動かし、未来の文字と、古すぎて外れた文字を区別します。窓の中の位置は0から数え直します。実際のモデルの構造や注意重みを変える操作ではありません。
- **Loss / 予測を採点:** Move the chosen probability of the correct letter `t`. The point follows the exact `−ln(p)` curve; numbers are rounded. These probabilities are explanatory choices, not model measurements. / 正解 `t` の確率を動かすと、式から計算した損失と点が変わります。確率は説明用で、モデルの実測値ではありません。
- **Updates / 数値を調整:** Change the learning rate and perform up to ten direct-score SGD updates on three chosen scores. This one-target toy deliberately omits shared network weights, clipping and AdamW. Its decreasing loss does not imply every real training update improves every example, nor demonstrate excessive-learning-rate failures. / 学習率を選び、仮の3スコアを最大10回更新します。実際のネットワーク全体やAdamWの記録ではありません。この例で損失が下がっても、本物の毎回の改善を保証せず、大きすぎる学習率の失敗を再現するものでもありません。
- **Generation / 次を選ぶ:** Open the real-model expander. Keep saved step and prompt fixed while moving temperature or top-k: actual scores stay fixed and probability bars change. The optional ribbon shows how one chosen number selects a character. The generator uses repeatable seeded uniform draws; the ribbon slider is an illustration, not a saved random event. / 本物の数値を開き、入力と保存ステップを固定して温度・top-kを変えます。実際のスコアは同じまま、確率が変わります。帯の図では、選んだ数値から1文字を決める規則も確かめられます。実際の生成はシード付き乱数を使い、帯のつまみは説明用です。

None of these controls starts Python training, changes saved model weights, or modifies the experiment screen's input settings. Model-derived values and chosen-number illustrations are labeled separately. The real trainer remains the loopback-only Python companion.

これらの操作でPython学習を開始したり、保存した重みや実験画面の入力設定を書き換えたりはしません。モデルから求めた値と説明用の数値は、それぞれ明記しています。実際に学習するのはローカルのPythonサーバーです。

## 1. Start with text / まず文章

A language model predicts a next token from a context. Here a token is one Unicode code point, plus three reserved tokens: unknown, beginning of document and end of document. This choice makes the whole pipeline visible. It does not reproduce the efficient subword tokenization used by most large models.

言語モデルは、文脈から次のトークンを予測します。この教材は Unicode のコードポイント単位で区切り、未知文字・文書の始まり・終わりの3種類を加えます。見通しをよくするための選択で、一般的な大規模モデルのトークン化と同じではありません。

Try: open Dataset, inspect both partitions, then open Tokenize and enter `the cat` or `ねこは`. Add an emoji not in the vocabulary. It should become `<unk>` rather than silently expanding the vocabulary.

試すこと: Dataset で学習用・検証用の文章を見て、Tokenize に `the cat` や `ねこは` を入力します。語彙にない絵文字を足すと、語彙が勝手に増えず `<unk>` になることを確認します。

### Why split first? / なぜ先に分割する？

Overlapping windows from the same document are strongly related. Randomly sending those windows to train and validation leaks near-identical context. This lab deduplicates exact documents, splits documents, builds the character vocabulary from training only, and then samples windows separately inside each document. The original templates remain related across splits, so this is still an easy toy task.

同じ文書から作った重なり合う窓を訓練用・検証用へ振り分けると、ほぼ同じ文脈が両方に現れます。この教材は同一文書を除去し、文書を分割し、訓練側だけから語彙を作った後、それぞれの文書内で窓を取ります。ただし定型文の文型は両側で共通するため、依然として簡単な教材です。

## 2. IDs become predictions / IDから予測へ

1. A token ID selects a learned embedding vector
2. A learned position embedding adds order information
3. Causal self-attention combines available positions
4. A feed-forward layer transforms those representations
5. Repeat the block, normalize, and score each vocabulary item
6. Softmax turns scores into probabilities

1. トークン ID から学習可能な埋め込みベクトルを選ぶ
2. 位置の埋め込みで順番を加える
3. 因果的自己注意で参照できる位置の情報を組み合わせる
4. 順伝播層で表現を変換する
5. ブロックを繰り返し、正規化して各語彙のスコアを出す
6. softmax で確率に変換する

The model uses two pre-normalized attention blocks, four heads, 48-dimensional embeddings and a 48-token maximum context. Output projection shares the token embedding weights. There is no dropout in this small deterministic reference implementation. The total **62,064** is computed from actual parameters, not a marketing size label.

このモデルは2層、4ヘッド、48次元、最大文脈48トークンです。出力層はトークン埋め込みの重みを共有します。この小さい参照実装には dropout を使いません。**62,064** はコードから集計した実際のパラメータ数です。

### The causal mask / 因果マスク

At position 3, positions 0–3 can contribute; position 4 cannot. The upper triangle of the score matrix is excluded before softmax. The model cannot see a future target during its prediction. A unit test changes future tokens and verifies earlier logits are unchanged.

位置3では位置0〜3を参照でき、位置4は参照できません。スコア行列の上三角を softmax 前に除外します。未来の文字を変えても、それ以前の予測スコアが変わらないことをテストしています。

A mask diagram is a structural explanation. Attention weights alone are not proof of why a model produced an answer. See [Jain & Wallace, 2019](https://aclanthology.org/N19-1357/) and [Wiegreffe & Pinter, 2019](https://aclanthology.org/D19-1002/) for different positions on attention interpretation.

マスク図は構造を説明するものです。attention の重みだけで「この理由で答えた」と証明できるわけではありません。

## 3. Train and measure / 学習して測る

Training minimizes cross-entropy, the negative natural logarithm of the probability assigned to the actual next token. A confident correct prediction has low loss. A confident wrong one has high loss. Backpropagation computes gradients; AdamW updates the model. This is genuine optimization from seeded random initialization.

学習では、正解の次トークンに割り当てた確率の負の自然対数を小さくします。逆伝播で勾配を求め、AdamW で重みを更新します。最初から学習済みの重みを利用しているのではなく、シード付きのランダム初期値から最適化します。

The chart uses fixed sampled training/held-out windows, not the noisy current minibatch. Held-out windows never update the model. The bigram baseline only counts transitions from the preceding token, with additive smoothing. It is deliberately simple and useful: a complex model should demonstrate an actual advantage.

グラフは、その時のミニバッチの値ではなく、固定した訓練用・検証用の窓で測ります。検証側は重みの更新に使いません。バイグラム基準は直前の1トークンから次のトークンを数えます。複雑なモデルの利点を確かめる比較対象です。

Try: compare step 0, 200, 400 and 600. Notice that a lower loss does not guarantee every generated sentence improves. The saved English sample still changes animals and misspells a word. It is intentionally not cleaned up.

試すこと: 0、200、400、600ステップを比べます。loss が下がっても、すべての生成文が改善するとは限りません。保存した英語のサンプルにも動物の入れ替わりや綴りの誤りがあり、そのまま残しています。

## 4. Sample the next token / 次の文字を選ぶ

- **Temperature:** rescales logits. Lower values concentrate probability; zero uses greedy argmax
- **Top-k:** keeps only the k highest-scoring candidates. Zero keeps all allowed candidates
- **Seed:** makes the pseudorandom sampling sequence repeatable
- **Maximum new tokens:** caps the generation; end-of-document may stop it sooner

- **Temperature:** スコアの分布を調整します。小さいほど集中し、0は最大値を選びます
- **Top-k:** 上位 k 件だけを残します。0は候補を限定しません
- **Seed:** サンプリングの疑似乱数列を再現します
- **生成長:** 追加するトークン数の上限です。文書末尾を選ぶと早く終了します

Beginning-of-document and unknown tokens are excluded from output sampling. The displayed probability bars are **after** temperature and top-k, for the first next token at the selected prompt/checkpoint. They are not raw training probabilities. Keep all settings and the prompt identical for pre/post comparisons.

文書先頭と未知文字のトークンは出力候補から除外します。確率の棒グラフは、選択した入力とチェックポイントについて、temperature と top-k の処理**後**の最初の次トークンを示します。学習前後の比較では入力と設定をそろえます。

## 5. Run a controlled experiment / 条件をそろえて実験

Start a new local run to change dimensions, context or learning rate. Resumption continues the same experiment and therefore locks those settings. Cancel saves optimizer and RNG state; resuming under the same environment yields the same final weights as an uninterrupted run, as verified by tests.

次元数・文脈長・学習率を変える場合は、新しい実験を始めます。再開は同じ実験の続きなので設定を固定します。停止時は optimizer と乱数状態も保存し、同じ環境での再開が連続実行と同じ重みになることをテストしています。

A paired context test is included: the same 512 held-out target positions are evaluated at step 600 with context caps 8, 24 and 48. Results are 0.252, 0.191 and 0.195 nats/token respectively. More context was not monotonically better in this small sample. See [method](METHOD.md); do not treat these as broad benchmark scores.

同じ512個の検証側ターゲットを、600ステップの重みと文脈上限8・24・48で測る実験も含めています。結果は順に0.252・0.191・0.195 nat/token で、文脈が長いほど必ずよいわけではありません。小さい教材上の結果であり、汎用ベンチマークではありません。

## Next, not hidden inside this demo / 次の学習テーマ

Subword tokenization (BPE), more varied licensed data, larger models, longer contexts and stronger evaluation are sensible next topics. They are not claimed as implemented here. BPE also changes the token unit, so its token loss should not be directly ranked against character-token loss. [Hugging Face's BPE explanation](https://huggingface.co/docs/course/en/chapter6/5) is a useful next reference.

BPE、利用権を確認した多様なデータ、モデルの拡大、より厳密な評価は次のテーマです。この版で実装済みとはしていません。BPEではトークンの単位が変わるため、文字単位の loss とそのまま優劣を比べるのも適切ではありません。
