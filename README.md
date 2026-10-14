# first-lm

Train a tiny language model from random initialization, then inspect what changed.

A real PyTorch decoder-only Transformer and a bilingual React learning lab. No pretrained model, API key, GPU service, or external corpus is required. The bundled model has **62,064 parameters**. It learns deliberately repetitive toy scenes; it is **not a useful chatbot**.

[日本語](README.ja.md) · [Learning guide](docs/GUIDE.md) · [Method and measurements](docs/METHOD.md)

![The recorded training run in first-lm](docs/screenshots/training-desktop.png)

Actual Chromium screenshot of the bundled measured run. Hosted mode is recorded-run exploration; local training requires the Python companion.

## Learn inside the app

Use **Guide** in the header, or **Start the learning path** above the experiment. The opening explains what an LLM is, how this small teaching model differs, and what you will learn. Eight directly linkable chapters explain why each part is needed, then connect it to mechanisms, equations, and the actual implementation. The beginner layer follows one missing-letter example, “the ca” → “t”, through plain explanations, labeled illustrations, and unscored explain-your-choice questions. Terms are defined as they appear. Real saved-model probes and advanced math/code stay in optional deeper sections.

- `#/learn/overview`: training changes weights; generation uses fixed weights
- `#/learn/embeddings`: inspect real token and position embedding values
- `#/learn/loss`: compute a real next-character probability and single-target loss
- `#/learn/generation`: compare saved checkpoints or temperatures under controlled settings

The guide preserves your experiment inputs and output while you read. Browser Back/Forward and direct chapter links work without server-side routes. Structural diagrams are labeled separately from measurements; the single-target probe uses raw training probabilities, whereas comparison bars include sampling filters. Imported run provenance remains self-reported.

## Two honest execution modes

- **Local training:** the Python companion serves the app on `127.0.0.1`. The browser controls real CPU training, cancellation, checkpoint saving and resumption.
- **Recorded run:** the static app replays genuine saved training metrics. Generation is still real inference in the browser using exported Transformer weights. A static host cannot run Python training; the app never labels replay as live training or connects a hosted page to your localhost.

## Get the source

Use Git and a supported Node version (22.12+ or 24). Python 3.11 or 3.12 is needed only for real local training. Allow about 1 GB of free disk for the Python dependencies; no GPU is required. Cloning requires repository access while this repository is private.

```sh
git clone https://github.com/domizo/first-lm.git
cd first-lm
npm ci
```

## Start with the guide and recorded run

```sh
npm run dev
```

Open the [local learning guide](http://127.0.0.1:5173/#/learn/overview), or open http://127.0.0.1:5173 and choose **Guide**. Keep the terminal running. If that port is already in use, follow the exact local URL Vite prints and append `#/learn/overview`.

Without the Python companion, you can read the guide, inspect genuine recorded training metrics, and generate text in the browser using the saved weights. No Python, account, API key, or access to a hosted demo is needed for this mode. The development server can also connect to an already running loopback Python companion through its `/api` proxy.

To build and preview the static version instead:

```sh
npm run build
npm run preview
```

Open the [built local guide](http://127.0.0.1:4173/#/learn/overview). This static preview has no Python API proxy and cannot start real training. `dist/` contains the built app, original corpus, measured run bundle, and third-party notices. Do not open `dist/index.html` directly with a `file://` URL; use the preview server.

## Train a model locally

From the same project root, create an isolated Python environment:

```sh
# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

On Windows PowerShell, use these two commands instead:

```powershell
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
```

Install the local companion and build the browser UI. `constraints.txt` selects the audited dependency versions; do not remove it when reproducing the tested environment:

```sh
python -m pip install -r requirements.txt
# Linux / Windows: official CPU-only PyTorch distribution
python -m pip install torch==2.13.0 --index-url https://download.pytorch.org/whl/cpu -c constraints.txt
# macOS: use `python -m pip install torch==2.13.0 -c constraints.txt` instead of the line above
python -m pip install -e . --no-deps --no-build-isolation
npm run build
python -m model_lab serve
```

Open **http://127.0.0.1:8765**, or go directly to its [learning guide](http://127.0.0.1:8765/#/learn/overview). This Python-served version supports real CPU training, saving, cancellation and resumption. Keep the terminal running; Ctrl+C stops the server. The service intentionally binds only to loopback and needs no credentials. Do not expose it to a public network. Use [PyTorch's official selector](https://pytorch.org/get-started/locally/) if no wheel matches your platform.

Only resume checkpoints created by your own trusted first-lm run. Browser imports accept bounded JSON bundles; the app does not offer a browser `.pt` upload. `weights_only=True` reduces pickle exposure but is not a guarantee that an untrusted checkpoint is safe.

## Run the reference training configuration

```sh
python -m model_lab train --steps 600 --output runs/my-run
# Resume an app-created CLI checkpoint; target steps is the total, not extra steps.
python -m model_lab train --steps 900 --output runs/my-run --resume
```

The supported runtime is now PyTorch 2.13.0; the preserved bundled recording was made with 2.9.1. The same 600-step configuration still trains successfully, but cross-version retraining is not byte-identical. Keep the recorded weights and historical measurements separate from a new run; see [dependency and compatibility notes](docs/DEPENDENCIES.md).

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

## License

Original project code, the original demonstration corpus and the bundled trained weights are all licensed under the [MIT License](LICENSE), copyright (c) 2026 domizo. Commercial use, modification and redistribution are permitted under its terms; retain the copyright and license notice. See [corpus provenance](data/DATA.md) and the [weight license/model record](WEIGHTS.md). Third-party packages keep their own licenses, and custom user corpora are not relicensed by this project.

## Third-party notices

The [browser dependency notices](THIRD_PARTY_NOTICES.md) include the exact React, React DOM and Scheduler copyright/license texts shipped in the build. They are also available from the app footer.
