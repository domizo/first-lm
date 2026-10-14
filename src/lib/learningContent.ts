// Source-grounded bilingual learning content for first-lm.
// Reference dimensions and metrics describe public/runs/demo.json, not arbitrary imported runs.
// Chosen-number examples are explicitly illustrative; saved/model-computed values are labeled separately.
export type Bilingual = { en: string; ja: string };
export const chapters: Array<{
  id: string;
  title: Bilingual;
  question: Bilingual;
  why: Bilingual;
  plain: Bilingual[];
  takeaway: Bilingual;
  observe: Bilingual;
  glossary?: { term: Bilingual; meaning: Bilingual }[];
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
      "en": "Guess the next character",
      "ja": "次の1文字を予想しよう"
    },
    "question": {
      "en": "What changes when a model learns?",
      "ja": "モデルが学ぶと、何が変わるの？"
    },
    "why": {
      "en": "Follow one small example, “the cat”, from practice to making new text. No formulas needed to start.",
      "ja": "「the cat」という短い例で、練習から文章づくりまでを追います。最初は数式が分からなくても大丈夫です。"
    },
    "plain": [
      {
        "en": "Start with “the cat”. Cover its last letter, t. The program gets “the ca” and predicts what comes next. It gives each candidate a share of a 100% total, called a probability. This tiny language model repeats that calculation one character at a time.",
        "ja": "「the cat」の最後の t を隠してみましょう。プログラムには「the ca」を見せ、次の1文字を予想させます。各候補に合計100%になる割合を付けます。これが「確率」です。この小さな言語モデルは、そんな計算を1文字ずつ繰り返します。"
      },
      {
        "en": "Inside the model are adjustable numbers, rather like the settings on a machine. These are called parameters; we often call them weights. Training changes those numbers using examples. The machine-settings comparison is only an analogy: the program calculates the changes; it is not trying or thinking like a person.",
        "ja": "モデルの中には、機械のつまみのように調整できる数値があります。これを「パラメータ」といい、このガイドでは「重み」とも呼びます。学習では、例文を使って数値を変えます。つまみはたとえです。人のように考えるのではなく、変更量を計算しています。"
      },
      {
        "en": "In training, the next character is already in the original text, so nobody has to mark every answer each time. In generation, the model uses saved weights to choose new characters. The weights stay fixed: generating ten more sentences does not train this model.",
        "ja": "学習の答えは、元の文章にある「次の文字」です。実行するたびに人が全部の答えを付ける必要はありません。生成では、保存した重みを使って文字を選びます。重みはそのままなので、10回追加で生成しても、このモデルが新しく学習するわけではありません。"
      }
    ],
    "mechanism": [
      {
        "en": "A training example has two parts: the text available so far and the next character in the original document. The model scores candidates, compares them with that known answer, and adjusts its weights. Later chapters explain each part.",
        "ja": "学習問題は「ここまでの文章」と「元の文章で次に来た文字」の組です。候補にスコアを付け、分かっている答えと比べ、重みを調整します。各部分はこのあとの章で見ていきます。"
      },
      {
        "en": "Evaluation is a third activity: use fixed weights to predict answers in text kept aside for checking. Measure the results without updating the weights.",
        "ja": "もう1つの作業が「評価」です。確認用に取り分けた文章で答えを予測し、結果を測ります。このときは重みを更新しません。"
      },
      {
        "en": "Generation has no supplied next-character answer. Select a character, add it to the input, and calculate again with the same saved weights. A saved set of weights is called a checkpoint.",
        "ja": "生成では、次の文字の答えは渡しません。1文字を選んで入力に加え、同じ保存済みの重みでもう一度計算します。保存した時点の状態を「チェックポイント」と呼びます。"
      },
      {
        "en": "The saved learning curve records an actual PyTorch training run. Browser generation really calculates this same model using its saved weights. To change weights in a new training run, use the local PyTorch companion.",
        "ja": "保存された学習曲線は、実際にPyTorchで学習した記録です。ブラウザーの生成でも、同じモデルと保存した重みで実際に計算します。新たに重みを学習するには、ローカルのPyTorchサーバーを使います。"
      }
    ],
    "math": [
      {
        "en": "The bundled reference is a small model trained on project-written English and Japanese template sentences. It has 62,064 parameters, a vocabulary of 65 tokens, 48-number representations, 4 attention heads per block, 2 blocks, and a 48-token context limit. These details belong to the reference, not every imported run. It is not a general-purpose chatbot.",
        "ja": "同梱の参照モデルは、この教材用に書いた英語・日本語の定型文で学習した小さなモデルです。パラメータ62,064個、語彙65トークン、表現の数値48個、各ブロック4ヘッド、2ブロック、文脈上限48トークンです。これらは参照モデルの設定で、読み込むすべての実行に当てはまるわけではありません。汎用チャットボットではありません。"
      },
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
    "labStep": 2,
    "takeaway": {
      "en": "Training changes the model’s numbers. Generation uses those numbers to add one character at a time.",
      "ja": "学習は中の数値を変えること。生成はその数値を使って、1文字ずつ付け足すことです。"
    },
    "observe": {
      "en": "Follow the two paths in the diagram. Which path changes the weights, and which only adds text?",
      "ja": "図の2つの道をたどりましょう。重みを変えるのはどちら？ 文字を付け足すのはどちら？"
    },
    "glossary": [
      {
        "term": {
          "en": "Language model",
          "ja": "言語モデル"
        },
        "meaning": {
          "en": "A calculation that uses earlier text to assign likelihoods to what could come next. This one works character by character.",
          "ja": "前の文章を手がかりに、次に何が来そうかを計算する仕組み。この教材では1文字ずつ扱います。"
        }
      },
      {
        "term": {
          "en": "Parameters / weights",
          "ja": "パラメータ／重み"
        },
        "meaning": {
          "en": "Adjustable numbers inside the model. They are saved after training and reused during generation.",
          "ja": "モデルの中にある、調整できる数値。学習した値を保存し、生成に使います。"
        }
      },
      {
        "term": {
          "en": "Context",
          "ja": "文脈"
        },
        "meaning": {
          "en": "The earlier characters supplied for the current prediction. It is the text the calculation can use now.",
          "ja": "今回の予測に渡す、それまでの文字列。今の計算で使える手がかりです。"
        }
      }
    ]
  },
  {
    "id": "data",
    "title": {
      "en": "Make practice questions from text",
      "ja": "文章から練習問題を作ろう"
    },
    "question": {
      "en": "Where do the questions and answers come from?",
      "ja": "問題と答えは、どこから来るの？"
    },
    "why": {
      "en": "Turn “the cat” into small pieces, then see why some text is kept out of practice.",
      "ja": "「the cat」を小さな単位に分け、練習用と確認用の文章を分ける理由を考えます。"
    },
    "plain": [
      {
        "en": "This model breaks text into small pieces called tokens. Here, an ordinary token is one character: “cat” becomes c, a, t. A space is a token too. Each known character gets an ID number, like a name tag. A bigger ID does not mean a bigger, better, or more meaningful character.",
        "ja": "このモデルは、文章を「トークン」という小さな単位に分けます。ここでは、通常のトークンは1文字です。「cat」なら c・a・t の3個。空白も1個です。知っている文字には名札のようなID番号を付けます。番号の大小に、文字の価値や意味の大小はありません。"
      },
      {
        "en": "Slide along “the cat”: after t comes h; after th comes e; after “the ca” comes t. The original text supplies all these answers. Moving the answer row one place ahead creates many practice questions automatically. It does not mean t is the only possible continuation of “the ca” in every piece of writing.",
        "ja": "「the cat」を順に見ましょう。t の次は h、th の次は e、「the ca」の次は t です。答えはすべて元の文章にあります。答えの列を1文字ずらせば、練習問題を自動で作れます。ただし、どんな文章でも「the ca」の次は必ず t、という意味ではありません。"
      },
      {
        "en": "Before practice starts, put whole documents into two groups: training text for changing weights and held-out text for checking them. It is like keeping some questions aside for a practice test. If nearly the same passage is in both groups, a good result tells us less about handling unfamiliar text.",
        "ja": "練習前に、文書ごとに2つのグループへ分けます。重みを変える「学習用」と、結果を確かめる「検証用」です。問題を一部取り分けておく小テストに似ています。よく似た文章が両方にあると、高い成績でも、初めての文章への強さは分かりにくくなります。"
      }
    ],
    "mechanism": [
      {
        "en": "Remove exactly duplicated documents first. Use a repeatable shuffle setting, called split seed 17, then keep about 20% for checking. The seed makes the split reproducible; it is not a quality score. Build the vocabulary from training characters only. After the split, cut short pieces called windows from each group.",
        "ja": "まず、完全に同じ文書を除きます。順番の混ぜ方を再現する設定「分割シード17」を使い、約20%を検証用にします。シードは分け方を再現するための値で、品質の点数ではありません。語彙は学習用の文字だけで作り、そのあと各グループから「窓」という短い部分を切り出します。"
      },
      {
        "en": "Reference counts, from the saved run: 461 training documents and 115 held-out documents; 26,104 and 6,464 tokens including boundary markers. The template sentences share words and sentence patterns across both groups.",
        "ja": "保存された参照実行の件数は、学習461文書・検証115文書です。境界の印を含むトークン数は、それぞれ26,104個・6,464個です。定型文なので、両グループで単語や文型は共通しています。"
      },
      {
        "en": "The reference vocabulary has 62 observed characters and 3 special markers: <unk> for an unknown character, <bos> for a document start, and <eos> for a document end. Their IDs are 0, 1, and 2. An unfamiliar character becomes <unk>; typing it does not add it to the vocabulary.",
        "ja": "参照モデルの語彙は、観測した62文字と3つの特別な印です。<unk>は未知の文字、<bos>は文書の始まり、<eos>は文書の終わり。IDは順に0・1・2です。知らない文字は<unk>になり、入力するだけでは語彙に追加されません。"
      },
      {
        "en": "Each training row picks one document at random and then a starting point inside it. It takes up to 48 input/answer pairs in the reference run and never crosses into a second document. Different rows can repeat the same text.",
        "ja": "練習の1行を作るときは、文書を1つランダムに選び、その中の開始位置も選びます。参照実行では入力と答えを最大48組取り、別の文書へはまたぎません。同じ文章が繰り返し選ばれることもあります。"
      },
      {
        "en": "Japanese illustration: covering は in “ねこは” gives input “ねこ” and answer は. This shows the same rule, not a recorded model prediction. In the code, “character” means a Unicode code point; some visible emoji contain several. The reference held-out text has zero unknown tokens.",
        "ja": "日本語での説明例：「ねこは」の は を隠すと、入力は「ねこ」、答えは は です。同じ作り方を示す例で、モデルの予測結果ではありません。コードでの「文字」はUnicodeコードポイントなので、見た目が1個の絵文字でも複数に分かれることがあります。参照実行の検証文には未知トークンはありません。"
      }
    ],
    "math": [
      {
        "en": "For the excerpt “the cat”, inputs [t, h, e, space, c, a] pair with targets [h, e, space, c, a, t]. At each position, the causal mask hides later input characters. Real documents also have <bos> and <eos> boundaries. A window needs one extra token to supply the final next-token target.",
        "ja": "「the cat」の部分では、入力[t, h, e, 空白, c, a]に対し、正解は[h, e, 空白, c, a, t]です。各位置では因果マスクで後の入力文字を隠します。実際の文書には<bos>と<eos>の境界もあります。最後の次トークン正解を用意するため、窓は入力より1個多いトークンを必要とします。"
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
    "formula": "Input:  t  h  e  space  c  a\nTarget: h  e  space  c  a  t\nLoss ignores target = −100",
    "codePath": "python/model_lab/data.py",
    "codeLabel": {
      "en": "Read prepare_dataset and batch",
      "ja": "prepare_datasetとbatchを読む"
    },
    "labStep": 0,
    "takeaway": {
      "en": "The original text supplies the next-character answers. IDs are labels, and checking text is kept separate from weight updates.",
      "ja": "次の文字の答えは元の文章から作れます。IDは名札。検証用の文章は、重みを変える練習から分けておきます。"
    },
    "observe": {
      "en": "Match each input position to its answer one place ahead. For “the ca”, which character is hidden as the answer?",
      "ja": "入力と、1文字先の答えを線で結ぶつもりで見ましょう。「the ca」の先に隠した答えは何でしょう？"
    },
    "glossary": [
      {
        "term": {
          "en": "Token",
          "ja": "トークン"
        },
        "meaning": {
          "en": "One unit the model handles. Here that is usually one character; there are also special start, end, and unknown markers.",
          "ja": "モデルが扱う1単位。この教材では通常1文字で、ほかに開始・終了・未知を表す特別な印があります。"
        }
      },
      {
        "term": {
          "en": "Vocabulary / ID",
          "ja": "語彙／ID"
        },
        "meaning": {
          "en": "The vocabulary is the fixed list of available tokens. An ID is a token’s label in that list, not its meaning.",
          "ja": "語彙は使えるトークンの一覧です。IDはその一覧の中の名札で、意味を表す数字ではありません。"
        }
      },
      {
        "term": {
          "en": "Held-out / validation text",
          "ja": "検証用の文章"
        },
        "meaning": {
          "en": "Text kept out of weight updates and used to check predictions. Similar patterns can still appear in the training text.",
          "ja": "重みの更新には使わず、予測の確認に使う文章。学習用と似たパターンが含まれることはあります。"
        }
      }
    ]
  },
  {
    "id": "embeddings",
    "title": {
      "en": "Turn a name tag into numbers",
      "ja": "文字の名札を、数値の列へ"
    },
    "question": {
      "en": "How can a computer calculate with letters?",
      "ja": "コンピューターは文字でどう計算するの？"
    },
    "why": {
      "en": "An ID finds a row of numbers. The character’s place in the text adds another row.",
      "ja": "IDで数値の列を選び、文字がある「場所」の数値も加えます。"
    },
    "plain": [
      {
        "en": "The ID on the letter a is only a name tag. To use a in its calculations, the model looks up a list of adjustable numbers for that ID. Think of opening a card file by its label. This list is called an embedding, or a vector.",
        "ja": "a のIDは、ただの名札です。計算するときは、その名札を使って、調整できる数値の列を取り出します。名札からカードを探すようなものです。この数値の列を「埋め込み」、または「ベクトル」と呼びます。"
      },
      {
        "en": "The model also adds a list for the character’s position. In “the cat”, the last t uses the same character card as the first t, but a different position card. Adding the two lists gives the following calculations information about both the letter and its place.",
        "ja": "さらに、文字の位置を表す数値の列を加えます。「the cat」の最後の t は、最初の t と同じ「文字のカード」を使いますが、「位置のカード」は別です。2つを足すことで、後の計算に文字の種類と場所の両方を渡せます。"
      },
      {
        "en": "These numbers start randomly and change during training. Nobody labels their columns “animal”, “color”, or “Japanese”. The columns work together, so one number does not reveal a word’s meaning. The small illustration uses made-up values; you can open the real model’s saved numbers below.",
        "ja": "数値はランダムに始まり、学習で変わります。各列に「動物」「色」「日本語」などの意味を人が付けているわけではありません。列を組み合わせて使うため、1つの値から意味は読み取れません。下の説明図は作った数値で、さらに開くと実際の保存値も見られます。"
      }
    ],
    "mechanism": [
      {
        "en": "In the reference model, the token table has 65 rows, one per token, and 48 numbers per row. The position table has 48 rows with 48 numbers each. Select the needed row from each table and add matching entries.",
        "ja": "参照モデルでは、トークン表は65行で、各行に48個の数値があります。位置の表は48行で、各行に48個です。それぞれ必要な行を選び、同じ列どうしを足します。"
      },
      {
        "en": "Those sums pass through two repeated processing blocks. This model uses Transformer blocks, which combine earlier context and transform the number lists. The next chapter opens one block. A final normalization adjusts each resulting list’s scale.",
        "ja": "足した結果を、2つの処理ブロックへ順に渡します。ここではTransformerブロックを使い、前の文字の情報を組み合わせ、数値の列を変換します。次の章で中を見ます。最後に、各列の数値の大きさを整える正規化を行います。"
      },
      {
        "en": "To score possible next characters, the output uses the same token table again. This is called tied embeddings: one table serves both the input and output calculations, rather than learning a separate output table.",
        "ja": "次の文字の候補へスコアを付けるときにも、同じトークン表を使います。これを埋め込みの重み共有といいます。入力用・出力用の表を別々に学習せず、1つを両方に使います。"
      },
      {
        "en": "Position numbers restart at zero for each training window and each cropped generation context. They describe places inside the current window, not places in an unlimited conversation. The document-start marker is position zero when it is present at the beginning; a cropped window may start with an ordinary character.",
        "ja": "位置番号は、学習用の窓ごと、生成で切り出した文脈ごとに0から始まります。無限に長い会話全体の位置ではなく、今の窓の中の位置です。文書開始の印が先頭にあれば位置0ですが、切り出した窓は普通の文字から始まる場合もあります。"
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
    "labStep": 1,
    "takeaway": {
      "en": "An ID selects a learned number list. Adding a position list helps the model use order.",
      "ja": "IDで学習済みの数値の列を選びます。位置の数値も足して、順番を計算に使います。"
    },
    "observe": {
      "en": "Find the character’s number list, the position’s list, and their sum. What does the ID do before those lists are added?",
      "ja": "「文字の数値」「位置の数値」「足した結果」を探しましょう。IDは、数値を足す前に何のために使うのでしょう？"
    },
    "glossary": [
      {
        "term": {
          "en": "Embedding / vector",
          "ja": "埋め込み／ベクトル"
        },
        "meaning": {
          "en": "A list of numbers the model learns to use in calculations. Here each token ID selects one such list.",
          "ja": "計算に使えるように学習する数値の列。このモデルでは、トークンのIDで1列を選びます。"
        }
      },
      {
        "term": {
          "en": "Dimension",
          "ja": "次元"
        },
        "meaning": {
          "en": "One place in a number list. A 48-dimensional vector has 48 numbers; their places are not predefined meaning labels.",
          "ja": "数値の列にある1つの成分。「48次元」なら数値が48個あります。各成分に決まった意味の名前はありません。"
        }
      },
      {
        "term": {
          "en": "Position embedding",
          "ja": "位置の埋め込み"
        },
        "meaning": {
          "en": "A learned number list for a place within the current input window.",
          "ja": "今の入力の範囲内で、何番目にあるかを表す学習可能な数値の列。"
        }
      }
    ]
  },
  {
    "id": "attention",
    "title": {
      "en": "Use earlier letters as clues",
      "ja": "前の文字を手がかりにしよう"
    },
    "question": {
      "en": "How does the model use clues without peeking?",
      "ja": "答えを見ずに、手がかりをどう使うの？"
    },
    "why": {
      "en": "Look at which letters are available first. Then look at how their information is mixed.",
      "ja": "まず「見てよい文字」を確かめ、次にその情報の混ぜ方を見ます。"
    },
    "plain": [
      {
        "en": "To predict t after “the ca”, the model may use the letters through a. But when practicing the earlier prediction after “the c”, it must not see a or t yet. Those would give away the answer. The diagram’s hidden squares show this no-peeking rule.",
        "ja": "「the ca」の次の t を予想するときは、a までの文字を使えます。でも、もっと前の「the c」の次を練習するときは、まだ a や t を見てはいけません。答えが見えてしまうからです。図の隠れたマスは、この「先を見ない」決まりを表します。"
      },
      {
        "en": "At each position, the model mixes number lists from the letters it is allowed to use. Imagine a recipe saying how much of each ingredient to add. A learned calculation chooses those amounts. This mixing is called attention. The “ingredients” here are numbers, not whole words or human ideas.",
        "ja": "各位置で、見てよい文字の数値の列を混ぜます。料理のレシピで、材料ごとに入れる量が違う様子に似ています。その量を、学習した計算で決めます。この混ぜ方を「注意（attention）」と呼びます。材料にあたるのは数値で、単語や人の考えそのものではありません。"
      },
      {
        "en": "A larger amount means more of that position’s number list enters this particular mix. It does not prove that the model “paid attention” like a person, or explain by itself why the final letter was chosen. More calculations happen after this mix.",
        "ja": "割合が大きいほど、その位置の数値が、その混合に多く入ります。人のように「気を向けた」証拠ではなく、最後の文字を選んだ理由も、それだけでは分かりません。混ぜたあとにも、別の計算が続きます。"
      }
    ],
    "mechanism": [
      {
        "en": "First make three versions of each number list. One is used to compare from the current position, one to compare against other positions, and one holds the information to mix. These are called query (Q), key (K), and value (V). They are learned numerical transformations, not literal questions, search labels, or answers.",
        "ja": "まず数値の列を3種類に変換します。今の位置から比べるための列、ほかの位置で比べられる列、混ぜる情報を持つ列です。順にquery（Q）・key（K）・value（V）と呼びます。学習する数値の変換で、実際の質問文・検索の名札・答えではありません。"
      },
      {
        "en": "Compare the current Q with the available Ks. Turn the resulting scores into nonnegative mixing shares that sum to one. This conversion is called softmax. Use the shares to mix the Vs. Before this conversion, block all future positions with the causal mask.",
        "ja": "今の位置のQを、使える位置のKと比べます。そのスコアを、合計1になる0以上の割合へ直す計算がsoftmaxです。その割合でVを混ぜます。割合へ直す前に、因果マスクで未来の位置を除きます。"
      },
      {
        "en": "The reference makes four mixes in parallel, called heads. Each uses 12 of the 48 dimensions; their outputs are joined and transformed back to 48 numbers. A head is not assigned a fixed job such as “find animals”. The mask diagram shows allowed connections, not recorded mixing amounts.",
        "ja": "参照モデルは「ヘッド」と呼ぶ混合を4つ並行して行います。48次元を12次元ずつ使い、結果をつないで48個の数値に変換します。「動物を探す係」などの役割が決まっているわけではありません。マスク図は使えるつながりを示し、実測した混合の割合は示しません。"
      },
      {
        "en": "After mixing across positions, another calculation reshapes each position’s list separately. This is the feed-forward network, or MLP. In the reference it goes from 48 numbers to 192 and back to 48, with a nonlinear GELU transformation in the middle. The MLP itself does not mix different positions.",
        "ja": "位置どうしで混ぜたあと、各位置の数値の列を別々に作り直します。これがフィードフォワード層、またはMLPです。参照モデルでは48個から192個へ増やし、48個へ戻します。途中のGELUで非線形な変換を加えます。MLP自体は別の位置どうしを混ぜません。"
      },
      {
        "en": "Each part first adjusts the scale of its input list with LayerNorm. Its output is then added back to the original input: a residual connection. This preserves a direct path through the block for information and training signals. The reference repeats the full block twice.",
        "ja": "各部分の前に、LayerNormで入力の数値の大きさを整えます。計算後には、出力を元の入力へ足し戻します。これが残差接続です。情報や学習の信号がブロックを直接通る道を残します。参照モデルでは、このブロックを2回重ねます。"
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
    "labStep": 2,
    "takeaway": {
      "en": "Attention mixes available information. The no-peeking mask blocks future letters, including the answer.",
      "ja": "注意は、使える情報を混ぜる計算です。先を隠すマスクで、答えを含む未来の文字を見えなくします。"
    },
    "observe": {
      "en": "Which letters can be used to predict after “the ca”? Why is the final t covered even though it is written in the training text?",
      "ja": "「the ca」の次を予想するとき、使えるのはどの文字？ 元の学習文には書いてあるのに、最後の t を隠すのはなぜでしょう？"
    },
    "glossary": [
      {
        "term": {
          "en": "Attention",
          "ja": "注意（attention）"
        },
        "meaning": {
          "en": "A learned way to mix number lists from permitted positions. It is a calculation, not conscious attention.",
          "ja": "使ってよい位置の数値を、学習した割合で混ぜる計算。人の意識や集中を意味しません。"
        }
      },
      {
        "term": {
          "en": "Causal mask",
          "ja": "因果マスク"
        },
        "meaning": {
          "en": "The no-peeking rule: a position may use itself and earlier positions, but not later ones.",
          "ja": "自分の位置と前の位置だけを使い、後の位置を隠す決まり。"
        }
      },
      {
        "term": {
          "en": "Attention weight",
          "ja": "注意の重み"
        },
        "meaning": {
          "en": "An amount used in one intermediate mix. It is calculated from the current input and is different from a saved model parameter.",
          "ja": "途中の1回の混合で使う割合。今の入力から計算される値で、保存するモデルのパラメータとは別です。"
        }
      }
    ]
  },
  {
    "id": "loss",
    "title": {
      "en": "Measure how the guess went",
      "ja": "予想のずれを数で見よう"
    },
    "question": {
      "en": "How can we measure a next-character guess?",
      "ja": "次の文字の予想を、どう採点するの？"
    },
    "why": {
      "en": "Watch the share given to the known answer t. A bigger share means less surprise when t appears.",
      "ja": "答えの t に、どれくらいの割合を割り当てたかを見ます。割合が大きいほど、t が出ても意外ではありません。"
    },
    "plain": [
      {
        "en": "For “the ca”, the model first gives every candidate a raw score. These scores are called logits; they are not percentages. A calculation called softmax turns them into shares adding up to 100%. These are probabilities: a larger share means the model favors that candidate more, not that it is guaranteed.",
        "ja": "「the ca」に続く各候補へ、まず生のスコアを付けます。これが「logit」で、まだ百分率ではありません。「softmax」という計算で、合計100%の割合に直します。これが「確率」です。大きいほどモデルがその候補を有力としているだけで、必ず出るという約束ではありません。"
      },
      {
        "en": "Our original text is “the cat”, so this example’s answer is t. To score the guess, look at the probability given to t. The less the model expected t, the larger its surprise score. This score is called loss. It is calculated from the known answer; the model does not feel surprise.",
        "ja": "元の文章は「the cat」なので、この問題の答えは t です。t に与えた確率で、予想を採点します。t に付けた確率が低いほど大きくなる「意外さの点数」を「損失（loss）」と呼びます。答えから計算する数値で、モデルが驚くわけではありません。"
      },
      {
        "en": "Illustration, not a measured prediction: giving t 70% produces less loss than giving it 20%. Training averages this score over many next-character questions. Lower loss means better predictions on those questions; it is not a percentage of correct sentences. Other continuations can still make sense in other texts.",
        "ja": "説明用の例ですが、t に70%を与えた予想は、20%しか与えない予想より損失が小さくなります。これは実測値ではありません。学習では、多くの問題の損失を平均します。低いほど、その問題での予想がよいという意味で、正しい文の割合ではありません。別の文章なら、ほかの続きもあり得ます。"
      }
    ],
    "mechanism": [
      {
        "en": "The answer at each position is one token ahead. During training, the preceding characters come from the original document, not from the model’s own generated text. Supplying those real prefixes is called teacher forcing.",
        "ja": "各位置の答えは、1トークン先です。学習では、それまでの文字もモデルの生成文ではなく、元の文書から渡します。このように実際の続きの手前を使う方法をteacher forcingと呼びます。"
      },
      {
        "en": "This model uses a loss called cross-entropy. For each answer, take the negative natural logarithm of its probability, then average across the valid positions. The logarithm makes very low probability on an observed answer costly. No hand-marked grade is needed.",
        "ja": "ここでは交差エントロピーという損失を使います。各答えの確率の自然対数にマイナスを付け、対象の位置で平均します。実際の答えへの確率がとても低いと、損失が大きくなります。人が点数を付ける必要はありません。"
      },
      {
        "en": "The document-end marker <eos> is also an answer. Empty padding slots have target −100 and are left out of the average. Training scores the full vocabulary; it does not use the temperature or top-k controls from generation.",
        "ja": "文書終了の印<eos>も答えに含めます。長さをそろえる埋め草の正解は−100とし、平均から除きます。学習では全語彙を評価し、生成画面の温度やtop-kの設定は使いません。"
      },
      {
        "en": "Open “Try the real model’s numbers” to calculate with the selected saved weights. That panel uses the full vocabulary and no generation adjustments. Keep “the ca” and target t fixed, then compare saved steps. Its loss is for one answer; the learning curve averages many answers, so the values need not match.",
        "ja": "「本物のモデルの数値も見てみる」を開くと、選択した保存済みの重みから実際に計算できます。この欄は全語彙を使い、生成用の調整はしません。「the ca」と答え t を固定して、保存ステップを比べてみましょう。ここは1問分、学習曲線は多数の答えの平均なので、値が一致する必要はありません。"
      },
      {
        "en": "Illustrative numbers: at p(t) = 0.5 the loss is about 0.693; at p(t) = 0.1 it is about 2.303. The unit is called a nat per token because the calculation uses natural logarithms. You can understand the direction without memorizing the logarithm.",
        "ja": "説明用の数値では、p(t) = 0.5なら損失は約0.693、p(t) = 0.1なら約2.303です。自然対数を使うので、単位をnat/tokenといいます。対数を覚えなくても、「確率が高いほど損失が小さい」という向きは理解できます。"
      }
    ],
    "math": [
      {
        "en": "Softmax gives pⱼ = exp(zⱼ)/Σₖexp(zₖ), and one target’s loss is −ln pᵧ. The batch loss averages valid positions. PyTorch cross_entropy accepts logits directly and calculates the log-softmax loss stably.",
        "ja": "Softmaxはpⱼ = exp(zⱼ)/Σₖexp(zₖ)、1つの正解の損失は−ln pᵧです。バッチでは有効な位置を平均します。PyTorchのcross_entropyはlogitを直接受け取り、log-softmaxの損失を安定して計算します。"
      },
      {
        "en": "ILLUSTRATION, NOT A MEASURED TRACE: pretend there are just three candidates a, t, r after “the ca”. Choose logits [0, ln 2, 0] and target t from “the cat”. Probabilities are [0.25, 0.50, 0.25], loss is 0.6931, and the logit gradient p − one_hot(t) is [0.25, −0.50, 0.25]. The real reference has 65 tokens; these chosen numbers are not its recorded predictions or gradients.",
        "ja": "説明用の例・実測ではありません。「the ca」の次の候補がa・t・rの3個だけだと仮定します。logitを[0, ln 2, 0]、元の「the cat」の正解をtとすると、確率は[0.25, 0.50, 0.25]、損失は0.6931、logitの勾配p − one_hot(t)は[0.25, −0.50, 0.25]です。実際の参照モデルは65トークンです。ここで選んだ数値は、その予測や勾配の実測値ではありません。"
      },
      {
        "en": "Continue that illustration by pretending the logits themselves are parameters. A simple gradient-descent step with learning rate 0.2 gives new logits [−0.05, ln 2 + 0.10, −0.05]. The target probability becomes about 0.5374 and loss about 0.6210. This chosen example improves, but a general update need not. The actual network backpropagates into weights and uses AdamW, not this direct-logit update.",
        "ja": "同じ説明例で、logit自体をパラメータだと仮定します。学習率0.2の単純な勾配降下を1回行うと、新logitは[−0.05, ln 2 + 0.10, −0.05]です。正解の確率は約0.5374、損失は約0.6210になります。この例では改善しますが、一般の更新で保証されるわけではありません。実際のモデルは重みまで逆伝播し、logitの直接更新ではなくAdamWを使います。"
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
    "labStep": 2,
    "takeaway": {
      "en": "Loss gets smaller when the model gives the observed next character more probability. It does not measure all forms of language skill.",
      "ja": "実際に続いた文字へ高い確率を与えると、損失は小さくなります。言葉に関する能力を何でも測れる点数ではありません。"
    },
    "observe": {
      "en": "Move the chance given to t from 20% toward 70%. What happens to the point and the loss?",
      "ja": "t の確率を20%から70%へ近づけると、点と損失はどう動くでしょう？"
    },
    "glossary": [
      {
        "term": {
          "en": "Logit",
          "ja": "logit（生のスコア）"
        },
        "meaning": {
          "en": "A candidate’s score before it is converted into a probability. It may be negative and need not add up to anything.",
          "ja": "確率へ直す前の候補のスコア。負の値もあり、合計が決まった値になる必要はありません。"
        }
      },
      {
        "term": {
          "en": "Probability / softmax",
          "ja": "確率／softmax"
        },
        "meaning": {
          "en": "Probability is a candidate’s share of a total of 100%. Softmax converts raw scores into those shares. They express this model’s prediction.",
          "ja": "確率は、合計100%のうち候補に割り当てる割合。softmaxは生のスコアをその割合へ直す計算です。このモデルの予想を表します。"
        }
      },
      {
        "term": {
          "en": "Loss",
          "ja": "損失（loss）"
        },
        "meaning": {
          "en": "A number that increases when little probability is given to the observed answer. Here we average it over valid next-character targets.",
          "ja": "実際の答えへ与えた確率が低いほど大きくなる数値。ここでは、数える対象の次の文字について平均します。"
        }
      }
    ]
  },
  {
    "id": "optimization",
    "title": {
      "en": "Adjust the model a little",
      "ja": "中の数値を少しずつ直そう"
    },
    "question": {
      "en": "How does a wrong guess change the next attempt?",
      "ja": "予想したあとは、どうやって直すの？"
    },
    "why": {
      "en": "Follow one round of practice, measuring, and adjusting. A useful direction is not a promise of improvement.",
      "ja": "練習・採点・調整の1回分を追います。よさそうな方向へ動かしても、必ず改善するとは限りません。"
    },
    "plain": [
      {
        "en": "After trying a group of next-character questions, the program calculates how a tiny change to each weight would affect the loss. Think of checking which way a nearby slope goes. These local direction-and-size clues are called gradients. They describe the current calculation, not every future question.",
        "ja": "次の文字の問題をひとまとまり解いたら、「各重みを少し動かすと、損失がどう変わるか」を計算します。近くの坂がどちらへ傾いているか調べる感じです。この向きと大きさの手がかりを「勾配」と呼びます。今の計算での手がかりで、未来の全問題についての答えではありません。"
      },
      {
        "en": "A rule uses those clues to decide the actual changes. That rule is the optimizer. Its learning rate controls the size of the adjustments, rather like choosing a small or large step. This model’s rule also uses information from earlier gradients; it does not simply turn every weight by the same amount.",
        "ja": "その手がかりから、実際にどう動かすかを決める規則が「最適化手法（optimizer）」です。「学習率」は、一歩の大きさのように、変更量を調整します。このモデルの規則は過去の勾配も使い、全部の重みを同じ量だけ変えるわけではありません。"
      },
      {
        "en": "One round of updating is one training step. Then the program takes another group of examples and repeats. A large step can overshoot; even a small one can make some answers worse. Watch results across many steps and on held-out text. More practice does not guarantee that every next guess improves.",
        "ja": "重みを1回更新するのが、学習の「1ステップ」です。次の問題の組を取り、また繰り返します。大きく動かすと行き過ぎることがあり、小さく動かしても一部の答えは悪くなり得ます。何ステップかの変化と、検証用の結果を見ましょう。練習すれば毎回必ずよくなるわけではありません。"
      }
    ],
    "mechanism": [
      {
        "en": "Reference setup: start from random weights using seed 42, then sample 16 windows per step, with up to 48 scored positions in each. The model starts from scratch; the trainer downloads no pretrained model.",
        "ja": "参照実行は、シード42のランダムな重みから始めます。毎ステップ16窓、各窓最大48位置で予想を採点します。事前学習済みモデルをダウンロードせず、最初から学習します。"
      },
      {
        "en": "Calculate the predictions and loss first. Clear the previous gradients. Then work backward through the calculation to find new gradients. This backward calculation is called backpropagation; it uses the chain rule to combine the effects of successive operations.",
        "ja": "まず予想と損失を計算します。前の勾配を消し、計算を後ろからたどって新しい勾配を求めます。これを逆伝播と呼びます。連鎖律を使い、何段もある計算の影響をつなげます。"
      },
      {
        "en": "Before the update, limit the combined gradient size if it exceeds 1.0. This is gradient-norm clipping. It rescales the gradients together; it is not a guarantee that the next update will be safe or useful.",
        "ja": "更新前に、勾配全体の大きさが1.0を超える場合は抑えます。これが勾配ノルムのクリッピングです。勾配をまとめて縮めますが、次の更新の安定性や改善を保証するものではありません。"
      },
      {
        "en": "AdamW keeps running averages of gradients and their squares, adjusts updates using those averages, and separately shrinks weights with weight decay. Reference settings are learning rate 0.003 and weight decay 0.01. The learning rate stays constant in this trainer.",
        "ja": "AdamWは、勾配と勾配の二乗の平均を少しずつ更新して持ち、それを使って変更量を調整します。別に、重み減衰で重みを縮めます。参照設定は学習率0.003、重み減衰0.01です。この学習器では学習率は一定です。"
      },
      {
        "en": "An epoch usually means one pass through all examples. Here, documents and starting points are randomly sampled with repeats, so there is no exact epoch boundary. The reference’s 600 steps mean 600 updates and 9,600 sampled rows, not 600 passes through every document.",
        "ja": "エポックは通常、全例を1周することです。ここでは文書と開始位置を重複ありでランダムに選ぶので、厳密な周回の区切りはありません。参照実行の600ステップは600回の更新と9,600行の抽出で、全文書を600周したという意味ではありません。"
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
    "labStep": 2,
    "takeaway": {
      "en": "Gradients give local clues; the optimizer uses them to update weights. One update is one step, and improvement is not guaranteed.",
      "ja": "勾配は近くの変化の手がかり。最適化手法がそれを使って重みを更新します。1回の更新が1ステップで、改善は保証されません。"
    },
    "observe": {
      "en": "Trace one loop. At which point are predictions measured, and at which point do the stored weights actually change?",
      "ja": "図を1周たどりましょう。予想を採点する場所と、保存される重みを実際に変える場所は、どこですか？"
    },
    "glossary": [
      {
        "term": {
          "en": "Gradient",
          "ja": "勾配"
        },
        "meaning": {
          "en": "How the current loss would change for a very small change in each parameter. It is a local clue.",
          "ja": "各パラメータをほんの少し変えたときに、今の損失がどう変わるかを表す手がかり。"
        }
      },
      {
        "term": {
          "en": "Optimizer / learning rate",
          "ja": "最適化手法／学習率"
        },
        "meaning": {
          "en": "The optimizer is the update rule; the learning rate adjusts its step size. This implementation uses the AdamW rule.",
          "ja": "最適化手法は更新の規則、学習率は変更の大きさを調整する値。この実装の規則はAdamWです。"
        }
      },
      {
        "term": {
          "en": "Step / batch",
          "ja": "ステップ／バッチ"
        },
        "meaning": {
          "en": "A batch is a group of practice rows used together. One optimizer update after using that batch is one step.",
          "ja": "バッチは、まとめて練習する問題の行の組。その組を使って1回更新すると、1ステップです。"
        }
      }
    ]
  },
  {
    "id": "evaluation",
    "title": {
      "en": "Check with text kept aside",
      "ja": "取り分けた文章で確かめよう"
    },
    "question": {
      "en": "Did practice help beyond the practice questions?",
      "ja": "練習した問題以外でも、うまくいくの？"
    },
    "why": {
      "en": "Compare two curves and ask what this small test can, and cannot, tell us.",
      "ja": "2本の線を比べ、この小さなテストから何が分かるかを考えます。"
    },
    "plain": [
      {
        "en": "A student may do well on a worksheet they have practiced many times. To check more, try questions kept aside. We do something similar here: measure prediction loss on training text and on held-out text. During both checks, the weights stay fixed.",
        "ja": "何度も練習したプリントなら、うまく答えられることがあります。もう少し確かめるなら、取り分けておいた問題も試します。このモデルでも、学習用と検証用の両方で予想の損失を測ります。確認している間は、どちらでも重みを変えません。"
      },
      {
        "en": "If the practice score keeps getting better while the held-out score gets worse, the model may be fitting the practice text too closely. This is called overfitting. Look for a pattern over several points; one bump in a curve does not settle the question. Lower loss is better on the questions that were measured.",
        "ja": "学習用だけよくなり、検証用は悪くなるなら、練習文に合わせすぎているのかもしれません。これが「過学習」です。線の1か所の上下だけで決めず、何点かの流れを見ましょう。損失は小さいほど、測った問題での予想がよいことを表します。"
      },
      {
        "en": "The two groups here still share simple sentence patterns about animals, colors, and places. A good held-out score shows progress on this small task. It does not prove that the model can translate, check facts, or reason about an unfamiliar topic. It can still misspell words or switch animals halfway through a sentence.",
        "ja": "この教材では、両方のグループに、動物・色・場所についての似た文型があります。検証結果がよければ、この小さな課題では進歩したと言えます。それだけで翻訳・事実確認・知らない話題の推論ができるとは言えません。綴りを間違えたり、途中で動物が変わったりすることもあります。"
      }
    ],
    "mechanism": [
      {
        "en": "See the Train screen for actual curves. Before training, the reference fixes eight batches of 16 windows for each group, using evaluation seed 2025. Every curve point checks the same windows. The curve measures sampled windows, not every possible question in the corpus.",
        "ja": "実際の曲線は「学習」画面で見られます。参照実行では、学習前に評価シード2025で、各グループに16窓×8バッチを用意して固定します。線上の各点で同じ窓を調べます。選んだ窓での測定であり、データ中の全問題を測った値ではありません。"
      },
      {
        "en": "Measured reference train/held-out losses, in nats per token: step 0, 4.1953/4.1938; step 200, 0.5079/0.5179; step 400, 0.2692/0.2528; step 600, 0.2249/0.2157. These are recorded results from the bundled run, not a promise for a new run.",
        "ja": "同梱の参照実行で実測した学習／検証損失は、0ステップで4.1953／4.1938、200で0.5079／0.5179、400で0.2692／0.2528、600で0.2249／0.2157です。単位はnat/token。保存された実行の結果で、新しい実行でも同じになるという約束ではありません。"
      },
      {
        "en": "For comparison, a simpler rule counts which token follows only the immediately previous token. This is the bigram baseline. With additive smoothing 0.1, its measured reference held-out loss is 1.1568 on the same windows. That is a comparison within this toy task, not a broad language test.",
        "ja": "比較相手として、直前の1トークンのあとに何が来たかだけを数える、簡単な規則も使います。これがバイグラム基準です。0.1の加算平滑化を使った参照実測の検証損失は、同じ窓で1.1568でした。この教材内の比較であり、幅広い言語の試験ではありません。"
      },
      {
        "en": "Better average scores still leave mistakes. In the saved reference sample at step 600, the English text changes “cat” to “bear” and later spells “be ird”. One improved average does not guarantee a better individual continuation.",
        "ja": "平均の成績がよくなっても、誤りは残ります。参照実行の600ステップの保存例では、英語の文で「cat」が「bear」に変わり、あとで「be ird」という綴りも出ます。平均がよくなっても、個々の続きが必ずよくなるとは限りません。"
      },
      {
        "en": "The browser JSON saves weights, model settings, vocabulary, measurements, and samples for inspection and generation. The local training checkpoint also saves AdamW’s running state, the completed step, corpus, and random-generator states. Those extra pieces are needed to continue the same training process.",
        "ja": "ブラウザー用JSONは、観察と生成のために、重み・モデル設定・語彙・測定値・生成例を保存します。ローカルの学習用チェックポイントは、AdamWの途中の状態、完了ステップ、学習文書、乱数の状態も保存します。同じ学習を続けるには、この追加情報が必要です。"
      },
      {
        "en": "Resuming permits changes to target steps and evaluation interval, while preserving the corpus and other settings. Imported JSON metadata is self-reported: loading it does not authenticate where it came from.",
        "ja": "学習の再開では、目標ステップと評価間隔は変えられますが、文書やほかの設定は保ちます。読み込んだJSONの説明情報は自己申告です。読み込めたことだけで、出どころが認証されるわけではありません。"
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
    "labStep": 2,
    "takeaway": {
      "en": "Use held-out text to check more than practice performance. A good score on this small dataset is a limited result, not proof of general understanding.",
      "ja": "検証用の文章で、練習以外の結果も確かめます。小さなデータでの好成績だけでは、広い意味での理解は証明できません。"
    },
    "observe": {
      "en": "Compare the two possible patterns. What would you check if practice results improved but held-out results got worse?",
      "ja": "図の2つのパターンを比べましょう。練習だけよくなり、検証は悪くなったら、何を確かめたいですか？"
    },
    "glossary": [
      {
        "term": {
          "en": "Evaluation",
          "ja": "評価"
        },
        "meaning": {
          "en": "Measuring predictions while leaving the weights unchanged. It can use either training or held-out examples.",
          "ja": "重みを変えずに予想の結果を測ること。学習用の例でも、検証用の例でも行えます。"
        }
      },
      {
        "term": {
          "en": "Overfitting",
          "ja": "過学習"
        },
        "meaning": {
          "en": "Fitting practice examples so closely that performance on other examples is less useful or gets worse.",
          "ja": "練習した例に合わせすぎて、ほかの例では役に立ちにくくなったり、結果が悪くなったりすること。"
        }
      },
      {
        "term": {
          "en": "Checkpoint",
          "ja": "チェックポイント"
        },
        "meaning": {
          "en": "A saved state from a training step. Saved weights can generate text; resuming the exact training process needs additional saved state.",
          "ja": "ある学習ステップで保存した状態。重みがあれば生成できますが、同じ学習を正確に続けるには追加の状態も必要です。"
        }
      }
    ]
  },
  {
    "id": "generation",
    "title": {
      "en": "Add one character, then repeat",
      "ja": "1文字足して、また予想しよう"
    },
    "question": {
      "en": "How do many small guesses become a sentence?",
      "ja": "1文字ずつの予想が、どうやって文になるの？"
    },
    "why": {
      "en": "Keep the learned numbers fixed and watch the input grow. Then change how a candidate is picked.",
      "ja": "学習済みの数値を変えず、入力が伸びる様子を見ます。次に、候補の選び方を変えます。"
    },
    "plain": [
      {
        "en": "Start with “the ca”. The model predicts the next character, picks one, and adds it. If it picks t, the next input is “the cat”. That is an illustration of the loop, not a recorded prediction. It repeats using its own previous choices; there is no answer sheet for the new text.",
        "ja": "「the ca」から始めます。次の文字を予想し、1つ選んで付け足します。もし t を選べば、次の入力は「the cat」です。これは繰り返し方の説明例で、実測した予測ではありません。新しい文の答えは渡さず、自分が選んだ文字も使って次へ進みます。"
      },
      {
        "en": "The saved weights stay fixed. The input changes. The reference model uses only the last 48 tokens, including any special markers in that range. Older text can remain visible on screen while being absent from the next calculation. Reusing its own output this way is a calculation loop, not conscious thought.",
        "ja": "保存した重みは変わらず、入力が変わります。参照モデルが使うのは、範囲内の特別な印も含めて末尾48トークンまでです。古い文が画面に見えていても、次の計算には入らないことがあります。自分の出力を使う繰り返しで、意識を持って考えているわけではありません。"
      },
      {
        "en": "To pick a letter, the generator can draw from the candidate probabilities, like a draw with unequal chances. The temperature control makes those chances more concentrated or more spread out. It changes variety, not the model’s knowledge or intelligence. A higher or lower setting does not guarantee more accurate text.",
        "ja": "文字を選ぶときは、候補ごとの確率に従って抽選できます。当たりやすさが違うくじのようなものです。「温度（temperature）」は、その確率を集中させたり広げたりする設定です。選択の幅を変えるもので、知識や賢さを増やすつまみではありません。高くても低くても、正確な文は保証されません。"
      }
    ],
    "mechanism": [
      {
        "en": "Give the prompt a document-start token, map characters to IDs, keep the latest context window, and run the model. Convert its final-position scores into a distribution, select one token, append its ID, and repeat. This use of earlier generated tokens is called autoregressive generation.",
        "ja": "入力の書き出しに文書開始トークンを付け、文字をIDへ変え、末尾の文脈の窓でモデルを計算します。最後の位置のスコアから確率を作り、1トークンを選んでIDを加え、繰り返します。前に生成したトークンを使うこの方法を、自己回帰生成と呼びます。"
      },
      {
        "en": "Temperature divides each allowed score by T. Below 1, probabilities usually become more concentrated; above 1, more spread out. At T = 0 this implementation directly chooses the highest-scoring allowed token, with no probability draw.",
        "ja": "温度は、使える候補のスコアをTで割ります。1未満なら通常は確率が集中し、1より大きいと広がります。T = 0では、この実装は確率で抽選せず、使える候補の最大スコアを直接選びます。"
      },
      {
        "en": "Top-k keeps only the k highest-scoring candidates before the final probabilities are normalized. k = 0 turns that cutoff off; k = 1 leaves a single possible choice. Generation always excludes <unk> and <bos>. Selecting <eos> stops the loop without adding a visible character.",
        "ja": "top-kは、最後に確率をそろえる前に、上位k個の候補だけを残します。k = 0なら制限なし、k = 1なら候補は1つです。生成では<unk>と<bos>を常に除きます。<eos>を選ぶと、見える文字を足さずに終了します。"
      },
      {
        "en": "The seed sets a repeatable sequence of draws; it is not a quality level. With the same run, saved step, input, and controls, the browser can repeat the result. Changing the seed may still pick the same characters, and it has no effect on greedy choices at T = 0.",
        "ja": "シードは、抽選の乱数列を再現する設定で、品質の段階ではありません。同じ実行・保存ステップ・入力・設定なら、ブラウザーで結果を再現できます。シードを変えても同じ文字が選ばれることがあり、T = 0で最大候補を選ぶときは影響しません。"
      },
      {
        "en": "Maximum new tokens limits additions, not the prompt’s total length. Probability bars in the generation experiment show only the first choice, after temperature and top-k; the leading bars need not total 100%. They differ from the unadjusted probabilities in the loss lesson.",
        "ja": "最大生成トークン数は、入力を含む全長ではなく、追加数の上限です。生成実験の確率の棒は、温度とtop-kを適用した最初の1回分だけです。上位の棒しか見せないため、合計100%とは限りません。損失の章で使う、調整前の確率とは別です。"
      },
      {
        "en": "An unknown prompt character becomes <unk> in the calculation, even if its original symbol remains visible. The model cannot generate ordinary characters outside its fixed vocabulary. A first wrong choice can affect later choices; one strange sentence alone cannot identify the cause.",
        "ja": "知らない入力文字は、元の記号が画面に残っていても、計算では<unk>になります。固定した語彙にない普通の文字は生成できません。最初の誤りが後の選択へ影響することもありますが、変な文が1つ出ただけでは原因は特定できません。"
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
    "labStep": 3,
    "takeaway": {
      "en": "Generation adds a chosen character and predicts again with fixed weights. Temperature changes the choices’ probabilities, not what the model learned.",
      "ja": "生成は、選んだ文字を足し、同じ重みでまた予想する繰り返しです。温度が変えるのは選択の確率で、学んだ内容ではありません。"
    },
    "observe": {
      "en": "Follow the added t back into the next input. If text grows past the context limit, which end of the text stays available?",
      "ja": "付け足した t が次の入力になる道をたどりましょう。文字列が上限を超えたら、先頭側と末尾側のどちらを残しますか？"
    },
    "glossary": [
      {
        "term": {
          "en": "Generation / inference",
          "ja": "生成／推論"
        },
        "meaning": {
          "en": "Inference calculates outputs with fixed weights. Generation repeatedly uses those calculations to extend text.",
          "ja": "推論は重みを固定して出力を計算すること。生成はその計算を繰り返し、文章を伸ばすことです。"
        }
      },
      {
        "term": {
          "en": "Sampling / temperature",
          "ja": "サンプリング／温度"
        },
        "meaning": {
          "en": "Sampling draws a candidate according to its probability. Temperature reshapes those probabilities without retraining the model.",
          "ja": "サンプリングは確率に従って候補を選ぶこと。温度は、学習し直さずに、その確率の偏り方を変える設定です。"
        }
      },
      {
        "term": {
          "en": "Context window",
          "ja": "文脈の窓"
        },
        "meaning": {
          "en": "The limited slice of earlier text available for a prediction. The reference uses the last 48 tokens, not everything on screen.",
          "ja": "予測に使える、それまでの文章の限られた範囲。参照モデルは末尾48トークンを使い、画面の全文は使いません。"
        }
      }
    ]
  }
];
