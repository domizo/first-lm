# Bundled model weights

The trained and initialization checkpoint tensors included in `public/runs/demo.json` are original first-lm project artifacts, licensed under the [MIT License](LICENSE), copyright (c) 2026 domizo. The same grant covers this project's original code and original demonstration corpus; dependency licenses remain separate. Keep the MIT copyright and permission notice when redistributing these artifacts.

These weights were learned from random initialization, not adapted from a pretrained model. They use the project-authored bilingual template corpus described in [data/DATA.md](data/DATA.md). Their architecture, evaluation method, historical PyTorch 2.9.1 provenance and limitations are documented in [docs/METHOD.md](docs/METHOD.md). They are a 62,064-parameter character-level teaching model, not a general-purpose chat assistant.

The security runtime update does not replace the weight tensors or historical metrics. The only change to the saved reference JSON during licensing is `dataset.license`; every other parsed field is unchanged. New training uses the supported runtime in [dependency notes](docs/DEPENDENCIES.md), and is not promised to recreate identical tensors across releases.

This license does not grant rights to third-party or user-supplied training text. Custom corpora and artifacts someone else gives you require their own rights/provenance review. An imported JSON bundle's metadata is self-reported, not proof of ownership or a cryptographic signature.

## 日本語

`public/runs/demo.json` に含む学習前・学習後のチェックポイントの数値は、このfirst-lmプロジェクトが作成したもので、著作権表示を2026 domizoとする[MITライセンス](LICENSE)です。自作コードと自作の学習用文章にも同じ利用条件を適用します。再配布時にはMITの著作権表示と許諾文を残してください。第三者パッケージのライセンスは別です。

事前学習済みモデルの改変ではなく、自作の英語・日本語の定型文を使い、ランダムな初期値から学習しました。62,064パラメータの文字単位の教材で、汎用会話AIではありません。過去の実行環境・測定方法・限界は[METHOD.md](docs/METHOD.md)に記録しています。

セキュリティ更新でも重み・過去の数値は変えていません。保存済みJSONのライセンス変更は `dataset.license` だけです。新しい環境での学習が、異なる版の過去の数値を完全に再現するとは約束しません。第三者や利用者が追加した文章の権利を、このMITライセンスが与えるものではありません。

## Metadata-only reference-file change

The saved JSON's raw SHA-256 changed from `1de259de0dd30a75b0ed8ec5a06b3c46df335e3dfafc12309a609852a3fc6953` to `79bd08deb765ee122fd4c2f3d82b2ef8591cb75573c2520835c7f0dbf28dd08a` solely because `dataset.license` now reads `MIT; original project-authored demo text (see LICENSE)`. Every other parsed field remains identical. Both corpus text files retain SHA-256 `04e88f78721d153452dfd08a83d392c615fcb8d24f42efbe975bddaec6429d5e`.

The static app also ships `LICENSE.txt`, an exact copy of the root MIT license, alongside the third-party notices. Both are linked from the app footer and checked during the build.

保存済みJSONのファイルハッシュが変わるのは `dataset.license` の説明をMITに直したためだけです。その他の項目は同じです。静的配信にもMIT原文の `LICENSE.txt` と第三者告知を同梱し、画面下部から開けます。
