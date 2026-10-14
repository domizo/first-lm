# Third-party notices

The browser build includes **React 19.3.0**, **React DOM 19.3.0**, and **Scheduler 0.28.0**. Each is MIT-licensed and carries the copyright notice of Meta Platforms, Inc. and affiliates.

The project’s own MIT text is also shipped as `public/LICENSE.txt`, checked byte-for-byte against root `LICENSE`. The complete, unchanged license text from each installed package is in [public/THIRD_PARTY_NOTICES.txt](public/THIRD_PARTY_NOTICES.txt). Vite copies this file into every static build, and the app footer links to the served copy. `npm run build` verifies the file against the exact versions in `package-lock.json` and their installed `LICENSE` files. After a reviewed dependency update, regenerate it with `npm run notices`.

Development tools and separately installed Python dependencies retain their respective licenses. They are not included in the static browser bundle by this project. This notice is a focused inventory of shipped browser dependencies, not a full environment SBOM.

## 日本語

ブラウザー用ビルドには **React 19.3.0**、**React DOM 19.3.0**、**Scheduler 0.28.0** を含みます。いずれもMITライセンスで、Meta Platforms, Inc. and affiliates. の著作権表示があります。

各パッケージの原文を変更せずに収録した [public/THIRD_PARTY_NOTICES.txt](public/THIRD_PARTY_NOTICES.txt) は、ビルド時に静的配信ファイルへコピーされます。画面下部からも開けます。`npm run build` は、ロックファイル・インストール済みの正確な版・各LICENSE原文との一致を確認します。依存関係を見直して更新した場合は、`npm run notices` で再生成してください。

開発ツールと別途インストールするPython依存関係には、それぞれのライセンスが適用されます。このプロジェクトの静的ブラウザービルドには含めません。この文書は同梱するブラウザー依存関係の一覧であり、実行環境全体のSBOMではありません。
