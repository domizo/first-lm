# first-lm

Train a tiny language model from random initialization, then inspect what changed.

A real PyTorch decoder-only Transformer and a bilingual React learning lab. No pretrained model, API key, GPU service, or external corpus is required. The bundled model has **62,064 parameters**. It learns deliberately repetitive toy scenes; it is **not a useful chatbot**.

[日本語](README.ja.md) · [Learning guide](docs/GUIDE.md) · [Method and measurements](docs/METHOD.md)

![The recorded training run in first-lm](docs/screenshots/training-desktop.png)

Actual Chromium screenshot of the bundled measured run. Hosted mode is recorded-run exploration; local training requires the Python companion.

## Two honest execution modes

- **Local training:** the Python companion serves the app on `127.0.0.1`. The browser controls real CPU training, cancellation, checkpoint saving and resumption.
- **Recorded run:** the static app replays genuine saved training metrics. Generation is still real inference in the browser using exported Transformer weights. A static host cannot run Python training; the app never labels replay as live training or connects a hosted page to your localhost.

## Quick start

Requirements: Python 3.11 or 3.12, Node 22.12+ or 24, approximately 1 GB free disk for dependencies. No GPU needed. Run from the project root.

```sh
python3 -m venv .venv
# macOS / Linux
source .venv/bin/activate
# Windows PowerShell instead: .venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
# Linux/Windows: CPU-only PyTorch from its official distribution
python -m pip install torch==2.9.1 --index-url https://download.pytorch.org/whl/cpu
# macOS instead: python -m pip install torch==2.9.1
npm ci
npm run build
python -m pip install -e . --no-deps
python -m model_lab serve
```

Open **http://127.0.0.1:8765**. Keep the terminal running. The service intentionally binds only to loopback; do not expose it to a public network. It needs no credentials. Python install details are platform-specific; use [PyTorch's official selector](https://pytorch.org/get-started/locally/) if no wheel matches your platform.

For static recorded-run exploration only:

```sh
npm ci
npm run dev
```

The default Vite dev server proxies `/api` to the loopback companion. Without the companion, the app remains in recorded-run mode.

## Reproduce the bundled training run

```sh
python -m model_lab train --steps 600 --output runs/my-run
# Resume an app-created CLI checkpoint; target steps is the total, not extra steps.
python -m model_lab train --steps 900 --output runs/my-run --resume
```

The CLI writes a data-only `bundle.json` and a local `checkpoint.pt` including optimizer/RNG state. You may load a bundle in the browser or replace `public/runs/demo.json` and rebuild. Browser imports accept JSON data only; no imported pickle or executable code is loaded. Python resumes only with `torch.load(..., weights_only=True)`.

The local UI saves completed/cancelled runs under `runs/run-…/`. `runs/latest.json` allows the same local companion to resume its latest saved run after restart. Resume preserves the corpus, seed, model architecture, batch size and learning rate; change only the target total steps or evaluation interval. New experiments start from fresh random weights. Up to eight inference snapshots are retained (initialization plus the latest seven); the latest optimizer checkpoint remains resumable.

## Use your own text locally

```sh
python -m model_lab train --corpus my-text.txt --steps 600 --output runs/custom
```

Separate documents with a blank line. Limits: 100 KB UTF-8; 10–2,000 unique documents; 8–4,000 characters per document; at most 509 distinct training characters. Use only text you have rights to use. Nothing is uploaded by the app. Exported bundles contain vocabulary, dataset previews and model weights, which can reveal training text: review them before sharing. This lab is not designed for secrets or sensitive training data.

## Safety and bounds

- One training job at a time; 1–1,000 steps, ≤32 batch size, ≤96 context, ≤64 embedding dimensions, ≤3 layers, and a 15-minute runtime cap
- Cancel requests are checked between optimizer steps; the final valid weights and optimizer state are saved
- Loopback Host/Origin checks, no CORS grant, JSON-only mutation requests and capped request bodies
- Imported JSON has strict shape, numeric and size checks; text is rendered as text, never HTML
- No remote model calls, telemetry, paid compute, package installation, or network fetching is triggered by the app

## Verification

```sh
python -m pip install -r requirements-dev.txt
npm run check
npm test
npm run build
python -m unittest discover -s tests -p 'test_*.py' -v
python scripts/measure_context.py
```

Tests cover causal masking, document split/vocabulary isolation, real training and exact interrupted/resumed weight equality, Python/browser logit and sampling parity, input bounds, and loopback request protections. See [verification notes](docs/VERIFICATION.md) for the actual checks and screenshots produced for this revision.

## Structure

```text
python/model_lab/   tokenizer, data split, Transformer, real trainer, local API
src/lib/model.ts    matching browser inference and strict bundle validation
src/components/    bilingual learning lab and guide
public/runs/       measured run bundle, including actual checkpoint weights
public/data/       original demonstration text
scripts/           reproducible paired context experiment
```

## Provenance and limits

The code was implemented for this project. The instructional approach is informed by [nanoGPT](https://github.com/karpathy/nanoGPT); its implementation was not copied. The demonstration sentences are project-authored template combinations, with no downloaded corpus or pretrained weights. Their provenance and distribution status are documented in [DATA.md](data/DATA.md).

Character tokenization makes the mechanism inspectable, but is inefficient for realistic language models. Vocabulary is learned only from training documents; unseen held-out characters use `<unk>`. Metrics are natural-log cross-entropy per predicted token, including the end-of-document token, measured on fixed seeded windows. Split documents still share templates and vocabulary, so low validation loss does not establish general English/Japanese ability. Seeds support repeatability on the same software/device; [PyTorch does not guarantee exact reproducibility across releases or platforms](https://docs.pytorch.org/docs/stable/notes/randomness.html).

Code distribution: private project, no general public software license granted. The original demo text has no third-party corpus dependency; see data/DATA.md.
