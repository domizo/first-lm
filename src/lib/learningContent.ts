// Source-grounded bilingual learning content for first-lm.
// Reference dimensions and metrics describe public/runs/demo.json, not arbitrary imported runs.
export type Bilingual = { en: string; ja: string };
export const chapters: Array<{
  id: string;
  title: Bilingual;
  question: Bilingual;
  why: Bilingual;
  plain: Bilingual[];
  mechanism: Bilingual[];
  math: Bilingual[];
  formula?: string;
  codePath: string;
  codeLabel: Bilingual;
  labStep: 0 | 1 | 2 | 3;
}> = [
  {
    "id": "overview",
    "title": {
      "en": "One prediction, two activities",
      "ja": "1文字ずつの予測、学習と生成の違い"
    },
    "question": {
      "en": "What does it mean for a language model to learn?",
      "ja": "言語モデルが「学ぶ」とは？"
    },
    "why": {
      "en": "Separate changing the model from using it, before looking inside.",
      "ja": "中身を見る前に、モデルを変えることと使うことを分けて考えます。"
    },
    "plain": [
      {
        "en": "Imagine the next character in a sentence is covered up. Given “the ca”, this model scores every possible next token. Training has an answer sheet: the original text. Generation chooses a token and adds it to the input.",
        "ja": "文章の次の1文字を隠したと考えましょう。「the ca」を見て、このモデルは次に来る各トークンにスコアを付けます。学習には元の文章という正解表があります。生成では1つを選び、入力の末尾に加えます。"
      },
      {
        "en": "Training adjusts learned numbers called parameters. Generation uses those numbers without changing them. Asking for ten more sentences does not teach this model anything new.",
        "ja": "学習は、パラメータと呼ぶ数値を調整する作業です。生成は、その数値を変えずに使います。このモデルで文章を10回追加生成しても、新たな学習にはなりません。"
      },
      {
        "en": "The bundled reference has 62,064 parameters, a 65-token character vocabulary, 48-dimensional representations, 4 attention heads per block, 2 blocks, and a 48-token context limit. Its original English/Japanese template corpus makes the pipeline visible; it is not a general-purpose chatbot.",
        "ja": "同梱の参照モデルは62,064パラメータ、文字語彙65種類、48次元、各ブロック4ヘッド、2ブロック、文脈上限48トークンです。教材用の英語・日本語の定型文で、処理の流れを観察します。汎用チャットボットではありません。"
      }
    ],
    "mechanism": [
      {
        "en": "Training: sample real text → predict → calculate loss → backpropagate → update parameters.",
        "ja": "学習: 元の文章を抽出 → 予測 → 損失を計算 → 逆伝播 → パラメータを更新"
      },
      {
        "en": "Evaluation: predict tokens from held-out text and measure loss, with no weight updates.",
        "ja": "評価: 検証用の文章で予測し、重みを更新せずに損失を測る"
      },
      {
        "en": "Generation: predict one token → select it → append it → repeat. The selected checkpoint stays fixed.",
        "ja": "生成: 1トークンを予測 → 選ぶ → 末尾に加える → 繰り返す。選んだ重みは固定"
      },
      {
        "en": "The saved curve records real PyTorch training. Browser generation performs real forward passes using saved weights. A new training run needs the local PyTorch companion.",
        "ja": "保存済みの曲線は実際のPyTorch学習記録です。ブラウザーでの生成は、保存済みの重みで実際に順伝播を計算します。新たな学習にはローカルのPyTorchサーバーを使います。"
      }
    ],
    "math": [
      {
        "en": "Write the model as pθ(next token | context). θ means all learned parameters. Training changes θ; inference holds θ fixed while the context changes. A parameter can be an embedding entry, linear weight or bias, or normalization scale or bias.",
        "ja": "モデルをpθ(次トークン | 文脈)と書きます。θは学習する全パラメータです。学習はθを変え、推論はθを固定して文脈を変えます。埋め込みの要素、線形層の重みやバイアス、正規化の倍率やバイアスなどがパラメータです。"
      },
      {
        "en": "Python forward returns vocabulary logits at every input position. Browser logitsFor returns only the final position’s logits, because generation needs the next token after the whole current context. Neither a forward pass nor appending tokens is a training update.",
        "ja": "Pythonのforwardは入力の全位置について語彙logitを返します。ブラウザーのlogitsForは、現在の文脈の次を選ぶため、最後の位置のlogitだけを返します。順伝播も、トークンの追加も、それだけでは学習の更新ではありません。"
      }
    ],
    "formula": "Training: θ changes\nEvaluation / generation: θ is fixed",
    "codePath": "python/model_lab/model.py",
    "codeLabel": {
      "en": "Read forward and generate",
      "ja": "forwardとgenerateを読む"
    },
    "labStep": 2
  },
  {
    "id": "data",
    "title": {
      "en": "Text becomes training examples",
      "ja": "文章から学習問題を作る"
    },
    "question": {
      "en": "Why split documents before cutting them into windows?",
      "ja": "なぜ窓を切り出す前に文書を分ける？"
    },
    "why": {
      "en": "The examples and split determine what your measurement can honestly show.",
      "ja": "データと分割方法が、測定から何を言えるかを決めます。"
    },
    "plain": [
      {
        "en": "Here, “cat” is three ordinary tokens and “ねこ” is two. A fixed vocabulary maps known characters to integer IDs. An ID is a label, not a measure of meaning. A new word can still be tokenized if all its characters are known.",
        "ja": "このモデルでは「cat」は通常のトークン3個、「ねこ」は2個です。固定した語彙が既知の文字を整数IDへ対応させます。IDは識別用で、意味の大きさではありません。新しい単語でも、文字がすべて既知ならトークン化できます。"
      },
      {
        "en": "Training documents are practice problems. Held-out documents test predictions on text that did not update the weights. Overlapping windows from the same document are too closely related to split casually between these groups.",
        "ja": "学習文書は練習問題です。検証文書は、重みの更新に使わなかった文章で予測を試します。同じ文書の重なり合う窓を両方へ振り分けると、よく似た文脈が漏れ込みます。"
      },
      {
        "en": "The bundled reference has 461 training documents and 115 held-out documents. Their encoded lengths, including boundaries, are 26,104 and 6,464 tokens. The templates still share vocabulary and structure across the split.",
        "ja": "同梱の参照データは学習461文書、検証115文書です。境界を含むトークン数は26,104個と6,464個です。文書を分けても、定型文の語彙や文型は両側で共通しています。"
      }
    ],
    "mechanism": [
      {
        "en": "Remove exact duplicates → shuffle documents with split seed 17 → hold out about 20% → build vocabulary from training characters only → sample windows within each partition.",
        "ja": "完全に同じ文書を除く → 分割シード17で文書をシャッフル → 約20%を検証へ → 学習文字だけで語彙を作る → 各分割で窓を抽出"
      },
      {
        "en": "The reference vocabulary contains 62 observed characters plus <unk> (unknown, ID 0), <bos> (document start, ID 1), and <eos> (document end, ID 2). Unknown input does not extend the vocabulary.",
        "ja": "参照語彙は観測された62文字と、<unk>（未知、ID 0）、<bos>（文書先頭、ID 1）、<eos>（文書末尾、ID 2）です。未知の入力で語彙は増えません。"
      },
      {
        "en": "“Character” means a Unicode code point. One visible emoji or accented symbol can contain several code points. The original held-out split has zero unknown tokens.",
        "ja": "「文字」はUnicodeコードポイントです。見た目が1個の絵文字やアクセント付き文字でも、複数のコードポイントを含むことがあります。同梱の検証側には未知トークンはありません。"
      },
      {
        "en": "Each minibatch row chooses a document uniformly, then a random start inside it. The row stops at that document’s boundary; it never joins two documents.",
        "ja": "ミニバッチの各行は文書を等確率で選び、その中の開始位置をランダムに選びます。文書の境界で止まり、2文書をつなぎません。"
      }
    ],
    "math": [
      {
        "en": "For the illustrative sequence [<bos>, c, a, t, <eos>], inputs are [<bos>, c, a, t] and targets are [c, a, t, <eos>]. A window needs one extra token because each prediction is scored against the next token, not the input token itself.",
        "ja": "説明用の列[<bos>, c, a, t, <eos>]では、入力は[<bos>, c, a, t]、正解は[c, a, t, <eos>]です。各位置を入力自身ではなく次のトークンと比べるため、窓に1個多く必要です。"
      },
      {
        "en": "Reference windows have up to 48 input/target pairs. Short rows use input padding ID 2 and target padding −100. Cross-entropy ignores −100 targets; −100 is not a vocabulary token. Causal masking ensures right-padding cannot affect earlier predictions.",
        "ja": "参照実行の窓は最大48組です。短い行の入力はID 2、正解は−100で埋めます。交差エントロピーは正解−100を除外し、−100は語彙には入りません。因果マスクにより、右側の埋め草は前の予測へ影響しません。"
      },
      {
        "en": "Deduplication only removes identical documents. It does not detect near-duplicates, and this template corpus intentionally reuses patterns. A careful split reduces leakage; it does not make this an independent test of general language ability.",
        "ja": "重複除去は完全に同じ文書だけが対象で、近い文書を検出しません。この定型文データは意図的にパターンを再利用します。分割は漏れ込みを減らしますが、汎用的な言語能力の独立した試験になるわけではありません。"
      }
    ],
    "formula": "Input:  <bos>  c  a  t\nTarget: c      a  t  <eos>\nLoss ignores target = −100",
    "codePath": "python/model_lab/data.py",
    "codeLabel": {
      "en": "Read prepare_dataset and batch",
      "ja": "prepare_datasetとbatchを読む"
    },
    "labStep": 0
  },
  {
    "id": "embeddings",
    "title": {
      "en": "Give tokens a representation",
      "ja": "トークンをベクトルで表す"
    },
    "question": {
      "en": "How does an ID become something a network can work with?",
      "ja": "IDをどう計算に使える表現へ変える？"
    },
    "why": {
      "en": "Follow the first learned transformation and see where order enters.",
      "ja": "最初の学習可能な変換と、順番の情報が入る場所を追います。"
    },
    "plain": [
      {
        "en": "Arithmetic on a character’s integer ID would not express its meaning. Instead, the ID selects a learned vector: a short list of numbers called an embedding. The network changes these numbers during training.",
        "ja": "文字の整数IDを足し引きしても、意味を表す計算にはなりません。IDを使って、埋め込みという学習可能な数値の列を選びます。その数値を学習中に調整します。"
      },
      {
        "en": "A position vector is added to the token vector. This lets the model represent the same character differently at different places. The coordinates are learned numbers, not preassigned labels such as “animal” or “Japanese”.",
        "ja": "トークンのベクトルへ位置のベクトルを加えます。同じ文字でも場所に応じた表現になります。各座標は学習する数値で、「動物」「日本語」といった意味が事前に割り当てられているわけではありません。"
      }
    ],
    "mechanism": [
      {
        "en": "The bundled reference token table is 65 × 48, and its learned position table is 48 × 48. Each position selects one row of each table and adds them.",
        "ja": "同梱の参照モデルのトークン表は65×48、学習可能な位置表は48×48です。各位置で両方の表から1行ずつ選び、加えます。"
      },
      {
        "en": "Two Transformer blocks transform these representations, followed by a final LayerNorm.",
        "ja": "2個のTransformerブロックが表現を変換し、最後にLayerNormを適用します。"
      },
      {
        "en": "The vocabulary output reuses the token-embedding weights. This tied embedding saves parameters; it is not a second independent table.",
        "ja": "語彙への出力にもトークン埋め込みの重みを使います。この共有でパラメータを減らし、独立した2つ目の表は作りません。"
      },
      {
        "en": "Positions restart at zero in each training window and cropped generation context. These are learned absolute positions within the current window, not an unlimited conversation counter.",
        "ja": "位置は学習窓ごと、切り詰めた生成文脈ごとに0から始まります。現在の窓の中の学習可能な絶対位置であり、会話全体の無限の位置カウンターではありません。"
      }
    ],
    "math": [
      {
        "en": "With token table E and position table P, xᵢ = E[tokenᵢ] + P[i]. A batch of B windows and T positions becomes B × T × d numbers. For the bundled reference, d = 48 and T ≤ 48.",
        "ja": "トークン表をE、位置表をPとすると、xᵢ = E[tokenᵢ] + P[i]です。B個の窓、T位置のバッチはB×T×dの数値になります。同梱の参照モデルではd = 48、T ≤ 48です。"
      },
      {
        "en": "For final normalized column vector hᵢ, logits zᵢ = E hᵢ have one score per vocabulary token. There is no separate output bias here. Sharing E means gradients from its input and output uses update the same parameter table.",
        "ja": "最後に正規化した列ベクトルをhᵢとすると、logitはzᵢ = E hᵢで、各語彙トークンのスコアを得ます。独立した出力バイアスはありません。Eを共有するため、入力側と出力側からの勾配が同じ表を更新します。"
      },
      {
        "en": "Reference parameter count: 3,120 token embeddings + 2,304 position embeddings + 2 × 28,272 for blocks + 96 for final normalization = 62,064. The shared token table is counted once. Loaded runs may have different dimensions and counts.",
        "ja": "参照モデルの内訳は、トークン埋め込み3,120＋位置埋め込み2,304＋ブロック2×28,272＋最後の正規化96＝62,064です。共有表は1回だけ数えます。読み込んだ実行では、次元数や個数が異なる場合があります。"
      }
    ],
    "formula": "xᵢ = E[tokenᵢ] + P[i]\nReference E: 65 × 48; P: 48 × 48\nOutput logits: zᵢ = E hᵢ",
    "codePath": "python/model_lab/model.py",
    "codeLabel": {
      "en": "Read embeddings and tied output",
      "ja": "埋め込みと出力の重み共有を読む"
    },
    "labStep": 1
  },
  {
    "id": "attention",
    "title": {
      "en": "Mix context without seeing the future",
      "ja": "未来を見ずに文脈を使う"
    },
    "question": {
      "en": "How can one position use earlier text without seeing the answer?",
      "ja": "答えを見ずに、前の文字をどう使う？"
    },
    "why": {
      "en": "Attention mixes positions; the MLP transforms features. Both matter.",
      "ja": "注意は位置間を混ぜ、MLPは特徴を変換します。両方が大切です。"
    },
    "plain": [
      {
        "en": "Each position can combine information from itself and earlier positions. It cannot peek at later characters. Attention mixes available representations, then a feed-forward network transforms the features at each position.",
        "ja": "各位置は、自分自身とそれより前の位置の情報を組み合わせられます。後の文字は先に見られません。注意が参照可能な表現を混ぜ、フィードフォワード層が各位置の特徴を変換します。"
      },
      {
        "en": "The mask explains which positions can contribute. Attention weights describe one intermediate mixture; on their own, they are not proof of why the final token was produced. A conceptual mask diagram is not a recorded attention trace.",
        "ja": "マスクは参照できる位置を示します。注意の重みは中間的な混合の割合で、それだけでは最後のトークンが出た理由を証明できません。構造を説明するマスク図は、実測した注意の記録ではありません。"
      }
    ],
    "mechanism": [
      {
        "en": "Query, key, value are three learned projections of normalized input. Compare each query with available keys, then use those scores to mix the values.",
        "ja": "Query・Key・Valueは、正規化した入力を3種類に変換したものです。Queryと参照可能なKeyを比べ、そのスコアを使ってValueを混ぜます。"
      },
      {
        "en": "The bundled reference splits 48 dimensions into 4 heads of 12. Each head calculates its own mixture, then the results are concatenated and projected back to 48 dimensions. Multiple heads allow several learned mixing patterns; repeated blocks refine representations. Heads have no guaranteed human-readable roles.",
        "ja": "同梱の参照モデルは48次元を12次元ずつ4ヘッドに分けます。別々に混合を計算し、連結して48次元へ変換します。複数ヘッドで異なる混ぜ方を学び、ブロックの反復で表現をさらに変換します。人間が説明しやすい役割が必ずあるわけではありません。"
      },
      {
        "en": "The causal mask permits positions 0 through i when predicting after position i. Position i + 1 would expose the target, so it is excluded before softmax.",
        "ja": "因果マスクは、位置iの次を予測するときに位置0〜iを許可します。位置i+1は正解を見せてしまうため、softmaxの前に除きます。"
      },
      {
        "en": "Pre-norm LayerNorm normalizes features before each sublayer, keeping scales manageable during optimization. Residual connections add the sublayer output to its input, leaving a direct path for information and gradients.",
        "ja": "Pre-normのLayerNormは各部分の前に特徴を正規化し、最適化中にスケールを扱いやすくします。残差接続は出力を入力へ加え、情報と勾配が直接通る経路を残します。"
      },
      {
        "en": "The reference MLP independently transforms each position 48 → 192 → 48, with GELU between linear layers. GELU adds nonlinearity: two linear maps alone could collapse to one affine map. Attention mixes positions; the MLP does not mix them directly.",
        "ja": "参照モデルのMLPは各位置を独立に48→192→48次元へ変換し、線形層の間にGELUを使います。GELUは非線形性を加えます。線形層だけなら、2層を1つのアフィン変換へまとめられます。注意は位置間を混ぜますが、MLP自体は直接混ぜません。"
      }
    ],
    "math": [
      {
        "en": "For one reference head, Sᵢⱼ = (qᵢ · kⱼ)/√12 for j ≤ i; future scores are −∞. Softmax across j makes weights A, and the head output is Σⱼ Aᵢⱼvⱼ. Scaling by the square root of head dimension limits dot-product scale growth.",
        "ja": "参照モデルの1ヘッドでは、j ≤ iのときSᵢⱼ = (qᵢ · kⱼ)/√12、未来のスコアは−∞です。jについてsoftmaxを取り重みAを作り、出力をΣⱼ Aᵢⱼvⱼとします。ヘッド次元の平方根で割り、内積のスケール増大を抑えます。"
      },
      {
        "en": "Attention softmax normalizes over context positions. Output softmax normalizes over vocabulary tokens. These are different distributions at different stages.",
        "ja": "注意のsoftmaxは文脈の位置について、出力のsoftmaxは語彙トークンについて正規化します。計算段階も、分布の対象も異なります。"
      },
      {
        "en": "A block is x′ = x + Attention(LN₁(x)), then x″ = x′ + MLP(LN₂(x′)). LayerNorm uses each position’s feature mean/variance, learned scale/bias, and ε = 10⁻⁵. GELU uses a tanh approximation in both Python and browser code. This implementation has no dropout.",
        "ja": "ブロックはx′ = x + Attention(LN₁(x))、次にx″ = x′ + MLP(LN₂(x′))です。LayerNormは各位置の特徴の平均・分散、学習可能な倍率・バイアス、ε = 10⁻⁵を使います。GELUはPythonとブラウザーの両方でtanh近似を使い、dropoutはありません。"
      }
    ],
    "formula": "A = softmax(causal_mask(QKᵀ / √d_head))\nAttention head = AV\nx′ = x + Attention(LN₁(x))\nx″ = x′ + MLP(LN₂(x′))",
    "codePath": "python/model_lab/model.py",
    "codeLabel": {
      "en": "Read Attention and Block",
      "ja": "AttentionとBlockを読む"
    },
    "labStep": 2
  },
  {
    "id": "loss",
    "title": {
      "en": "Turn predictions into a loss",
      "ja": "予測のずれを損失にする"
    },
    "question": {
      "en": "How does the model know which prediction to improve?",
      "ja": "どの予測を改善すればよいと分かる？"
    },
    "why": {
      "en": "Connect next-token probabilities to the scalar that training minimizes.",
      "ja": "次トークンの確率と、学習で小さくする数値を結びつけます。"
    },
    "plain": [
      {
        "en": "A logit is a score, not a probability. Softmax converts vocabulary scores into probabilities that sum to one. Cross-entropy penalizes the model when it gives the actual next token little probability.",
        "ja": "logitはスコアであり、確率ではありません。softmaxが語彙スコアを合計1の確率へ変換します。交差エントロピーは、実際の次トークンへ小さな確率しか与えない予測を大きく罰します。"
      },
      {
        "en": "Lower loss means better average next-token prediction on the measured examples. It is not a percentage of grammatical sentences, factual accuracy, or a guarantee that the next sampled sentence will be better.",
        "ja": "損失が低いほど、測定した例での平均的な次トークン予測がよいと言えます。文法的な文章の割合や事実の正しさではなく、次の生成文が必ずよくなる保証でもありません。"
      }
    ],
    "mechanism": [
      {
        "en": "Each training target is one token ahead of the input. Teacher forcing supplies real document prefixes, rather than the model’s own sampled mistakes.",
        "ja": "学習の正解は入力の1トークン先です。Teacher forcingにより、モデルの生成した誤りではなく元の文書の接頭辞を渡します。"
      },
      {
        "en": "Cross-entropy scores all non-padding target positions, including <eos>. Targets of −100 are ignored. Training uses the full vocabulary distribution.",
        "ja": "交差エントロピーは<eos>を含む埋め草以外の正解位置を評価し、正解−100を除きます。学習では全語彙の分布を使います。"
      },
      {
        "en": "Generation bars instead show the first next-token distribution after excluding <unk>/<bos>, temperature, and top-k. Only the leading candidates are shown, so displayed probabilities need not sum to 100%.",
        "ja": "生成の棒グラフは、<unk>/<bos>の除外、temperature、top-kの後の最初の次トークン分布です。上位の候補だけを表示するため、見える確率の合計が100%とは限りません。"
      },
      {
        "en": "Natural logarithms give loss in nats/token. If the correct token has probability 0.5, its loss is about 0.693; at 0.1, about 2.303.",
        "ja": "自然対数を使うため単位はnat/tokenです。正解の確率が0.5なら損失は約0.693、0.1なら約2.303です。"
      }
    ],
    "math": [
      {
        "en": "Softmax gives pⱼ = exp(zⱼ)/Σₖexp(zₖ), and one target’s loss is −ln pᵧ. The batch loss averages valid positions. PyTorch cross_entropy accepts logits directly and calculates the log-softmax loss stably.",
        "ja": "Softmaxはpⱼ = exp(zⱼ)/Σₖexp(zₖ)、1つの正解の損失は−ln pᵧです。バッチでは有効な位置を平均します。PyTorchのcross_entropyはlogitを直接受け取り、log-softmaxの損失を安定して計算します。"
      },
      {
        "en": "ILLUSTRATIVE EXAMPLE, NOT A MEASURED TRACE: choose three logits [0, ln 2, 0] for a, b, c with target b. Probabilities are [0.25, 0.50, 0.25], loss is 0.6931, and the logit gradient p − one_hot(b) is [0.25, −0.50, 0.25]. These are chosen numbers, not saved model gradients or attention.",
        "ja": "説明用の例・実測ではありません。a・b・cのlogitを[0, ln 2, 0]、正解をbとすると、確率は[0.25, 0.50, 0.25]、損失は0.6931、logitの勾配p − one_hot(b)は[0.25, −0.50, 0.25]です。説明のための数値で、保存モデルの勾配や注意の実測値ではありません。"
      },
      {
        "en": "Pretend the logits themselves are parameters and take a simple gradient-descent step with learning rate 0.2: new logits [−0.05, ln 2 + 0.10, −0.05]. The target probability becomes about 0.5374 and loss about 0.6210. The real network backpropagates into its weights and uses AdamW, not this direct-logit SGD update.",
        "ja": "logit自体をパラメータと仮定し、学習率0.2の単純な勾配降下を1回行うと、新logitは[−0.05, ln 2 + 0.10, −0.05]です。正解確率は約0.5374、損失は約0.6210になります。実際のモデルは重みまで逆伝播し、logitの直接SGD更新ではなくAdamWを使います。"
      },
      {
        "en": "A uniform 65-token model would have loss ln 65 ≈ 4.174. The bundled random initialization is not exactly uniform: its measured held-out loss is 4.1938. Illustrative values and recorded metrics are different kinds of evidence.",
        "ja": "65トークンが一様なら損失はln 65 ≈ 4.174です。同梱モデルの初期分布は厳密な一様ではなく、実測の検証損失は4.1938です。説明用の数値と実測の評価値を区別しましょう。"
      }
    ],
    "formula": "pⱼ = exp(zⱼ) / Σₖ exp(zₖ)\nℓ = −ln p(target)\n∂ℓ/∂z = p − one_hot(target)",
    "codePath": "python/model_lab/model.py",
    "codeLabel": {
      "en": "Read next-token cross-entropy",
      "ja": "次トークンの交差エントロピーを読む"
    },
    "labStep": 2
  },
  {
    "id": "optimization",
    "title": {
      "en": "Change weights, one step at a time",
      "ja": "重みを少しずつ更新する"
    },
    "question": {
      "en": "What actually happens during one training step?",
      "ja": "学習の1ステップで何が起こる？"
    },
    "why": {
      "en": "Distinguish a gradient, an optimizer, a learning rate, and an epoch.",
      "ja": "勾配・最適化手法・学習率・エポックの違いを押さえます。"
    },
    "plain": [
      {
        "en": "Training repeats a loop: try prediction problems, measure loss, calculate which small weight changes would reduce it, then update. One optimizer update is one step. It is not one sentence or one full pass through the corpus.",
        "ja": "学習は、予測問題を解き、損失を測り、どの重みをどちらへ少し動かせば損失が減るか計算して、更新する繰り返しです。1回の更新が1ステップで、1文やコーパス1周ではありません。"
      },
      {
        "en": "The learning rate controls update scale. Larger values may move faster but overshoot; smaller values may require more steps. More updates do not guarantee better held-out results.",
        "ja": "学習率は更新の大きさを調整します。大きいと速く進む場合も行き過ぎる場合もあり、小さいと多くのステップが必要になり得ます。更新を増やしても検証結果が必ずよくなるとは限りません。"
      }
    ],
    "mechanism": [
      {
        "en": "The bundled run starts from seed-42 random weights. Each step samples 16 windows, each with up to 48 scored positions. No pretrained model is downloaded.",
        "ja": "同梱の実行はシード42のランダムな重みから始めます。毎ステップ16窓、各窓最大48位置を抽出します。事前学習済みモデルはダウンロードしません。"
      },
      {
        "en": "Compute loss → clear old gradients → backpropagate → clip total gradient norm at 1.0 if needed → AdamW update. Backpropagation uses the chain rule to calculate each parameter’s local effect on loss.",
        "ja": "損失を計算 → 前の勾配を消す → 逆伝播 → 必要なら勾配全体のノルムを1.0へ抑える → AdamWで更新。逆伝播は連鎖律で各パラメータの損失への局所的な影響を計算します。"
      },
      {
        "en": "AdamW tracks moving averages of gradients and squared gradients, scales updates adaptively, and applies separate weight decay. The reference uses learning rate 0.003 and weight decay 0.01.",
        "ja": "AdamWは勾配と勾配二乗の移動平均を持ち、更新量を調整し、別に重み減衰を適用します。参照実行の学習率は0.003、重み減衰は0.01です。"
      },
      {
        "en": "An epoch conventionally means one pass over all examples. This trainer samples documents and starts with replacement, so it has no exact epoch boundary. Six hundred steps means 600 updates and 9,600 sampled rows, not 600 epochs or unique windows.",
        "ja": "エポックは通常、全例を1周することです。この学習器は文書と開始点を重複ありで抽出し、厳密な周回の区切りはありません。600ステップは600更新、9,600行の抽出で、600エポックでも、すべて異なる窓でもありません。"
      }
    ],
    "math": [
      {
        "en": "Basic gradient descent is θ ← θ − η∇θL. It explains direction, but the actual optimizer is AdamW. It uses bias-corrected moment estimates m̂ and v̂ and an adaptive term ηm̂/(√v̂ + ε), plus decoupled weight decay.",
        "ja": "単純な勾配降下はθ ← θ − η∇θLです。方向を理解する式ですが、実際はAdamWを使います。バイアス補正した移動平均m̂・v̂と、適応的な更新項ηm̂/(√v̂ + ε)、分離した重み減衰を使います。"
      },
      {
        "en": "The AdamW defaults here are β₁ = 0.9, β₂ = 0.999, ε = 10⁻⁸. Learning rate is constant; there is no schedule. zero_grad prevents unintended accumulation. Clipping rescales a large gradient but does not guarantee stability or prevent overfitting.",
        "ja": "このAdamWの既定値はβ₁ = 0.9、β₂ = 0.999、ε = 10⁻⁸です。学習率は一定でスケジューラーはありません。zero_gradは意図しない勾配の蓄積を防ぎます。クリッピングも安定性や過学習の防止を保証するものではありません。"
      },
      {
        "en": "To compare learning rates, start new runs with the same corpus, seed, model, batch size, and target steps. Change only the rate. Resuming preserves that setting, because it continues the same experiment.",
        "ja": "学習率を比べるなら、コーパス・シード・モデル・バッチサイズ・目標ステップをそろえ、学習率だけ違う新しい実行を作ります。再開は同じ実験の続きなので、その設定を保ちます。"
      }
    ],
    "formula": "_, loss = model(x, y)\noptimizer.zero_grad(set_to_none=True)\nloss.backward()\ntorch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)\noptimizer.step()",
    "codePath": "python/model_lab/train.py",
    "codeLabel": {
      "en": "Read the actual update loop",
      "ja": "実際の更新ループを読む"
    },
    "labStep": 2
  },
  {
    "id": "evaluation",
    "title": {
      "en": "Ask what the measurements prove",
      "ja": "測定結果から何が言える？"
    },
    "question": {
      "en": "Does a lower loss mean the model understands language?",
      "ja": "損失が下がれば、言語を理解したと言える？"
    },
    "why": {
      "en": "Read a learning curve honestly and know what a saved checkpoint contains.",
      "ja": "学習曲線を正しく読み、保存状態に何が入るかを知ります。"
    },
    "plain": [
      {
        "en": "Training loss measures practice performance. Held-out loss measures text excluded from weight updates. If training loss keeps falling while held-out loss rises, that may indicate overfitting. A single bump is not a diagnosis.",
        "ja": "学習損失は練習での成績、検証損失は重みの更新に使わなかった文章での成績です。学習損失が下がる一方で検証損失が上がるなら、過学習の兆候かもしれません。1回の上下だけでは判断できません。"
      },
      {
        "en": "The repetitive template corpus shares sentence patterns and words across splits. Low held-out loss demonstrates learning in this constrained task, not factuality, reasoning, translation, or general English/Japanese competence.",
        "ja": "繰り返しの多い定型文データは、分割をまたいで文型と単語を共有します。低い検証損失は、この限られた課題での学習を示します。事実性・推論・翻訳・英語や日本語の汎用能力を示すわけではありません。"
      },
      {
        "en": "Saved samples still make mistakes. At step 600, the reference English sample changes “cat” to “bear” and later spells “be ird”. Lower average loss does not guarantee every sampled continuation improves.",
        "ja": "保存例にも誤りは残ります。参照実行の600ステップの英語例は「cat」から「bear」に変わり、後に「be ird」と綴ります。平均損失が下がっても、個々の続きが必ず改善するとは限りません。"
      }
    ],
    "mechanism": [
      {
        "en": "Before training, eight batches of 16 windows per partition are fixed using evaluation seed 2025. Every chart point reuses them. These are sampled-window metrics, not exhaustive corpus-wide scores.",
        "ja": "学習前に評価シード2025で各分割の16窓×8バッチを固定し、グラフの各点で再利用します。抽出窓での評価であり、全コーパスを網羅した値ではありません。"
      },
      {
        "en": "Measured reference train/held-out losses: step 0, 4.1953/4.1938; step 200, 0.5079/0.5179; step 400, 0.2692/0.2528; step 600, 0.2249/0.2157 nats/token.",
        "ja": "参照実行の実測の学習／検証損失は、0ステップ4.1953／4.1938、200で0.5079／0.5179、400で0.2692／0.2528、600で0.2249／0.2157 nat/tokenです。"
      },
      {
        "en": "A bigram baseline counts transitions from only the previous token with additive smoothing 0.1. On the same held-out windows it scores 1.1568. This is a controlled toy-task comparison, not a broad benchmark.",
        "ja": "バイグラム基準は直前の1トークンだけから遷移を数え、0.1の加算平滑化を使います。同じ検証窓で1.1568です。限定した教材上の比較で、汎用ベンチマークではありません。"
      },
      {
        "en": "The JSON bundle saves measurements, metadata, samples, and inference snapshots. The local optimizer checkpoint additionally saves AdamW state, step, corpus/configuration, and PyTorch/NumPy RNG states for resuming.",
        "ja": "JSON記録は測定値・メタデータ・生成例・推論用の重みを保存します。ローカルの最適化用チェックポイントは、再開のためAdamW状態・ステップ・コーパスと設定・PyTorch/NumPy乱数状態も保存します。"
      },
      {
        "en": "Weights alone can run inference but cannot reproduce the exact next optimizer update. Resumption preserves corpus/settings except target steps and evaluation interval. Imported JSON metadata is self-reported, not authenticated provenance.",
        "ja": "重みだけで推論はできますが、次の更新を厳密に再現するには足りません。再開で変えられるのは目標ステップと評価間隔だけです。読み込んだJSONのメタデータは自己申告で、出自を認証しません。"
      }
    ],
    "math": [
      {
        "en": "Evaluation weights each batch mean by its non-padding target count, then divides by all valid targets. Training and held-out windows differ, so held-out loss can be lower. Held-out targets never produce parameter updates.",
        "ja": "評価は各バッチの平均に有効な正解数を掛けて合計し、全有効正解数で割ります。評価窓が異なるため、検証損失の方が低い場合もあります。検証側の正解でパラメータは更新しません。"
      },
      {
        "en": "A separate paired test uses the same 512 held-out targets at context caps 8, 24, and 48. Measured reference losses: 0.251623, 0.191059, 0.195158. Longer was not monotonically better. Its sampling scheme differs from the curve, so its loss need not equal 0.2157.",
        "ja": "別の対応比較は同じ検証側512位置を文脈上限8・24・48で測り、参照実行の実測損失は0.251623・0.191059・0.195158でした。長いほど単調によくはなりません。曲線とは抽出方法が違うため、0.2157と一致する必要はありません。"
      },
      {
        "en": "Repeatedly choosing settings using validation can overfit validation itself; a final untouched test set would provide a stronger estimate. The included tests verify matching resumed/uninterrupted tensors in the same environment, not arbitrary cross-hardware or cross-version equality.",
        "ja": "検証結果を使って何度も設定を選ぶと、検証側へ合わせすぎる場合もあります。未使用の最終テストデータがあれば、より厳密に評価できます。テストは同じ環境で再開と連続実行の重み一致を確認し、任意の機器や版での一致を保証しません。"
      }
    ],
    "formula": "L_eval = Σ(batch mean loss × valid targets)\n         / Σ(valid targets)\nReference held-out: 4.1938 → 0.2157 nats/token",
    "codePath": "python/model_lab/train.py",
    "codeLabel": {
      "en": "Read evaluation, save, and resume",
      "ja": "評価・保存・再開の実装を読む"
    },
    "labStep": 2
  },
  {
    "id": "generation",
    "title": {
      "en": "Generate, inspect, and experiment",
      "ja": "生成し、観察し、実験する"
    },
    "question": {
      "en": "Why do the same weights produce different text?",
      "ja": "同じ重みから、なぜ違う文が出る？"
    },
    "why": {
      "en": "Control sampling, understand finite context, and investigate errors fairly.",
      "ja": "選び方を制御し、有限の文脈を理解し、誤りを条件付きで調べます。"
    },
    "plain": [
      {
        "en": "Generation reads the context, predicts, selects one token, appends it, and repeats. Its own output becomes its next input. An early mistake can change everything that follows. The checkpoint weights remain fixed.",
        "ja": "生成は、文脈を読む・予測する・1つ選ぶ・加える、を繰り返します。自分の出力が次の入力になり、初期の誤りが続き全体を変える場合があります。重みは固定です。"
      },
      {
        "en": "The bundled reference sees only the last 48 context tokens. Older text may remain on screen but is absent from the next forward pass. That limit is not a guarantee that the model learned 48 characters of coherent memory.",
        "ja": "同梱の参照モデルが見るのは直近最大48トークンです。古い文が画面に残っていても、次の順伝播には渡されません。この上限は、48文字分の内容を一貫して記憶できる保証ではありません。"
      },
      {
        "en": "Misspellings, switches between animals, and repetition can reflect limited data/capacity, local next-token training, finite context, or sampling. A single sample cannot identify the dominant cause. Changing temperature does not add knowledge.",
        "ja": "綴りの誤り、動物の入れ替わり、反復には、データや能力の限界、局所的な次トークン学習、有限の文脈、サンプリングが関わり得ます。1例だけでは主因を特定できません。temperatureを変えても知識は増えません。"
      }
    ],
    "mechanism": [
      {
        "en": "Temperature divides logits by T. Below 1 usually concentrates probability; above 1 spreads it. T = 0 selects the highest-scoring allowed token. Lower temperature is not automatically better.",
        "ja": "TemperatureはlogitをTで割ります。1未満なら通常は集中し、1より大きいと広がります。T = 0では許可された最大候補を選びます。低ければ必ずよいわけではありません。"
      },
      {
        "en": "Top-k retains the k highest candidates before normalization. k = 0 disables the cutoff; k = 1 makes each choice deterministic. <unk> and <bos> are always excluded; <eos> can stop generation early.",
        "ja": "Top-kは正規化の前に上位k候補だけを残します。k = 0は制限なし、k = 1は決定的な選択です。<unk>と<bos>は常に除外し、<eos>を選ぶと早く終了します。"
      },
      {
        "en": "The seed makes the sampling sequence repeatable. It is not a quality setting. Changing a seed may leave the result unchanged; with greedy selection it cannot change the chosen token.",
        "ja": "シードはサンプリングの乱数列を再現し、品質を決める設定ではありません。変えても出力が同じ場合があり、最大候補を選ぶ設定では選択は変わりません。"
      },
      {
        "en": "Maximum new tokens caps additions, not total prompt length. <eos> is not added to the visible text. Displayed probability bars describe only the first next-token choice.",
        "ja": "最大生成トークン数は入力を含む全長ではなく、追加数の上限です。<eos>は表示文へ加えません。確率の棒は最初の次トークン1回分です。"
      },
      {
        "en": "Unknown prompt characters map to <unk> even if their original symbols remain visible. The generator cannot create ordinary tokens outside its fixed vocabulary. Tokenization is not understanding.",
        "ja": "未知の入力文字は、元の記号が画面に見えていても<unk>になります。生成器は固定語彙にない通常トークンを作れません。トークン化できることと理解は別です。"
      }
    ],
    "math": [
      {
        "en": "For T > 0, sampling probability qⱼ is proportional to exp(zⱼ/T) for candidates surviving output exclusions and top-k, and zero elsewhere. At T = 0, this implementation directly takes argmax instead.",
        "ja": "T > 0では、出力除外とtop-kを通った候補のqⱼはexp(zⱼ/T)に比例し、ほかは0です。T = 0では、この実装は直接argmaxを選びます。"
      },
      {
        "en": "Each iteration crops IDs to the last blockSize, restarts positions at zero, recomputes the forward pass without a key/value cache, and samples with seeded Mulberry32. Training uses real prefixes; generation may condition on its own errors.",
        "ja": "各反復でIDを末尾blockSize個へ切り詰め、位置を0から振り、Key/Valueキャッシュなしで順伝播を再計算し、シード付きMulberry32で選びます。学習は元の文脈、生成は自分の誤りを含む文脈を使い得ます。"
      },
      {
        "en": "For a controlled comparison, keep the prompt, checkpoint, seed, temperature, top-k, and length fixed except for one variable. Two prompts with identical final context windows should yield identical first-token distributions and sampled continuations under identical settings.",
        "ja": "比較では、入力・重み・シード・temperature・top-k・長さのうち1つだけを変えます。末尾の文脈窓が同一の2入力なら、同じ設定で最初の確率と生成される続きは一致するはずです。"
      }
    ],
    "formula": "context = tokenIds.slice(−blockSize)\nqⱼ ∝ exp(zⱼ / T), for retained candidates\nnext = sample(q, seeded RNG)\nappend next; repeat until <eos> or limit",
    "codePath": "src/lib/model.ts",
    "codeLabel": {
      "en": "Read browser inference and sampling",
      "ja": "ブラウザーの推論と選択を読む"
    },
    "labStep": 3
  }
];
