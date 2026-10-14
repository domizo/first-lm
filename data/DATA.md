# Corpus provenance

All bundled demonstration sentences were written for this project. The generator combines six animals, four colors, four places and three objects in two language templates, producing 576 distinct documents. No website, book, organization source, downloaded corpus or pretrained model contributed training text.

The bundled text is original project-authored content and has no third-party corpus license dependency. It is licensed under the [MIT License](../LICENSE), copyright (c) 2026 domizo. This covers `data/corpus.txt`, its identical `public/data/corpus.txt` copy, and the original sentences produced by `original_corpus()`. Custom user corpora remain subject to their own rights and permissions; this grant does not relicense them.

同梱する自作の学習用文章は、著作権表示を2026 domizoとするMITライセンスです。上記2つのテキストファイルと、`original_corpus()` が作る自作例文に適用します。利用者が追加する文章の権利・利用条件は、それぞれのものを確認してください。

The entire set is generated deterministically by `original_corpus()` in `python/model_lab/data.py`. `python -m model_lab corpus --output data/corpus.txt` regenerates it. SHA-256 in each run identifies the canonical JSON list of complete documents, not the text-file bytes.

Exact duplicate documents are removed before a seed-17 80/20 document split. Character vocabulary is built only from training documents. Windows never cross document boundaries. Near-duplicate sentences and shared templates remain intentionally present. This corpus demonstrates optimization and sampling, not broad natural-language competence.
