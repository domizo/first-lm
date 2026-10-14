# Dependency audit and runtime compatibility

Checked 2026-10-13/14 UTC for the explicit Linux CPU / Python 3.12 closure in `constraints.txt`. This is a point-in-time known-vulnerability check, not a guarantee of safety on every platform or an audit of every bundled native library.

## Supported runtime

The project now pins **PyTorch 2.13.0**. `constraints.txt` preserves the other 25 versions from the tested environment, including NumPy 2.3.5 and setuptools 84.0.0, rather than combining a security fix with unrelated upgrades. Install the non-torch requirements from PyPI first; then use the official CPU PyTorch index on Linux/Windows, or the platform-appropriate official package on macOS, following the README. CPU Linux wheels require glibc 2.28 or later. Python 3.11/3.12 wheels were confirmed; compatibility tests here used Python 3.12.14.

- `npm audit`: **0 known findings** for the checked-in npm lockfile
- PyPA `pip-audit 2.10.1`: **0 known findings**, 26 pinned Python runtime/test packages, no skipped packages, with torch's `+cpu` suffix mapped to its public release for advisory lookup
- Earlier torch 2.9.1 closure: **4 findings**; other packages in that closure had none
- The Python audit is performed from a separate tool environment so its own dependencies do not change the app's environment
- CI repeats both audits and attaches their JSON results beside the browser proof

The production browser bundle includes React 19.3.0, React DOM 19.3.0 and Scheduler 0.28.0. Their complete notices are [shipped with the app](../public/THIRD_PARTY_NOTICES.txt) and checked against the installed package files during every build. See [third-party notices](../THIRD_PARTY_NOTICES.md).

## Findings and exposure

The old `weights_only=True` loader was affected by [CVE-2026-24747](https://github.com/pytorch/pytorch/security/advisories/GHSA-63cw-57p8-fm3p); upstream identifies 2.10.0 as patched. Two other recorded issues concern [TorchScript/JIT](https://github.com/advisories/GHSA-rrmf-rvhw-rf47) and [LSTM](https://github.com/advisories/GHSA-qfhq-4f3w-5fph). first-lm does not call those APIs. The JIT advisory's stated fix is 2.13.0, making that the smallest scanner-clean candidate checked for this update.

There is an important limit: the [.pt2 advisory](https://github.com/pypa/advisory-database/blob/main/vulns/torch/PYSEC-2026-139.yaml) lists a last-affected release without an explicit fixed version. It disappears from the scanner above that range, but this audit did not establish an upstream fix; [2.13.0 source](https://github.com/pytorch/pytorch/blob/v2.13.0/torch/export/pt2_archive/_package.py#L790-L903) still contains unrestricted loading in that separate exported-program path. first-lm does not use `.pt2`, `torch.export.load`, or TorchScript. Zero scanner findings must not be read as “every PyTorch loading risk is fixed.”

Only use app-created checkpoints from a trusted local run. Browser imports are bounded data-only JSON, not `.pt` uploads. The loopback companion is not intended to be exposed as a public service. The straightforward malicious-pickle regression test does not prove that every malformed checkpoint is harmless.

## What changed numerically

**No existing model tensors, corpus text, reference loss values or inference oracle were regenerated.** The bundled demonstration retains its historical **PyTorch 2.9.1+cpu** environment metadata; it is data that the browser can inspect without installing that old runtime.

Under 2.13.0+cpu, the saved model passes all 24 full-logit comparisons against the historical float32 oracle (absolute tolerance 2e-5) and all 24 seeded generation comparisons. Same-runtime training, cancellation/resumption equality, and API/loader safety tests pass. A historical 2.9.1 optimizer/RNG `.pt` checkpoint was not available, so migration of that checkpoint format across releases was not tested; JSON-weight inference compatibility is a separate verified result.

A new 600-step run with the same configuration and the other dependency versions preserved completed successfully, but cross-version retraining was **not bit-identical**:

| Measurement | Historical 2.9.1 | New 2.13.0 |
|---|---:|---:|
| Final held-out loss | 0.215728431866759 | 0.216169669999918 |
| Largest absolute final-parameter difference | — | 0.070968218147755 |
| Largest absolute logged-loss difference | — | 0.022600120342820 |

The corpus hash was identical. These observations apply to this small CPU experiment, not other machines, releases or models. [PyTorch's reproducibility guidance](https://docs.pytorch.org/docs/stable/notes/randomness.html) does not promise bitwise equivalence across versions. Keep the historical recording separate from a new experiment.

## Recheck

Use the tested install commands in the README, then:

```sh
python -m pip check
npm audit
# Install this audit tool in a separate virtual environment, not the app environment:
python -m venv .audit-venv
.audit-venv/bin/python -m pip install pip-audit==2.10.1
.audit-venv/bin/python -m pip_audit -r constraints.txt --no-deps --disable-pip --strict
```

On Windows, the audit interpreter is `.audit-venv\Scripts\python.exe`. The constraint file is the complete selected CPU runtime/test inventory for this audit, not a universal cross-platform lock or a hash-verified wheel supply-chain attestation. New vulnerabilities and additional platform-specific dependencies need another audit.

## 日本語

現在の対応環境は **PyTorch 2.13.0** です。既知の脆弱性への対応として更新し、それ以外の25パッケージは検証した版を保ちました。`constraints.txt` とREADMEの順序でインストールしてください。監査時点のnpm依存関係と、固定したPython 26パッケージには、スキャナーの既知の指摘はありませんでした。ただし、全環境・未知の脆弱性まで安全だと保証するものではありません。

古い2.9.1には、`weights_only=True` でも不正なチェックポイントの影響を受ける問題がありました。2.13.0への更新で、今回確認した修正済みの問題に対応しています。別機能の `.pt2` 読込については、スキャナーから消えることと上流で修正されたことを同一視できません。このアプリはその機能を使いません。引き続き、信頼できる自分の実行が作ったチェックポイントだけを使い、Pythonサーバーは外部公開しないでください。

**同梱する重み・文章・過去の損失・比較用の正解データは作り直していません。** 過去の記録は2.9.1で計算した事実を保ちます。新環境でも保存済みモデルの予測と生成は比較テストを通過しています。旧2.9.1のoptimizer・乱数状態を含む `.pt` ファイルは残っていないため、その版をまたぐ移行は未検証です。新環境内での停止・再開は確認しています。一方、最初から600回学習し直すと重みは完全一致せず、検証損失は旧0.215728、新0.216170でした。これは確認した小さなCPU実験の結果で、版や端末をまたぐ完全再現を約束しません。

上の再確認コマンドは、アプリと別の仮想環境に監査ツールを入れます。Windowsでは `.audit-venv\Scripts\python.exe` を使ってください。Reactなどの同梱ライセンス原文は画面下部から確認でき、ビルド時に正確な版・原文との一致を確認します。
