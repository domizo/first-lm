# Measured reference run

This file records the bundled `public/runs/demo.json`, not an estimated or simulated run.

| Item | Value |
|---|---:|
| Parameters | 62,064 |
| Character vocabulary, including 3 special tokens | 65 |
| Blocks / heads / embedding / context | 2 / 4 / 48 / 48 |
| Training / held-out documents | 461 / 115 |
| Training / held-out tokens including boundaries | 26,104 / 6,464 |
| Split / training seeds | 17 / 42 |
| Optimizer | AdamW, lr 0.003, weight decay 0.01 |
| Batch / steps / gradient norm clip | 16 / 600 / 1.0 |
| Train loss, initialization → step 600 | 4.1953 → 0.2249 |
| Held-out loss, initialization → step 600 | 4.1938 → 0.2157 |
| Bigram held-out loss | 1.1568 |
| Recorded training/evaluation/export interval | 7.5 seconds |
| Compute | CPU, 2 PyTorch threads; no GPU |
| Environment | Python 3.12.14, PyTorch 2.9.1+cpu, NumPy 2.3.5 |

Elapsed time is measured inside the training function. It excludes environment setup, package downloads, Python startup and browser rendering; it is not a speed promise for another machine. The resource probe reported 9 logical processors and approximately 8 GB available RAM. Only two CPU threads were used.

## Evaluation

Before training, eight batches of 16 fixed windows are drawn for each partition with NumPy seed 2025. Starting positions are sampled inside a document. Windows stop at document boundaries; shorter rows are padded and excluded from the loss with target `-100`. The same windows are reused at each chart point and for the bigram baseline. Loss is total negative log likelihood divided by the number of non-padding target tokens. The end-of-document token counts as a target.

Document selection is uniform before selecting a start position; this is not an exhaustive corpus-wide metric. Special beginning/ending tokens contribute to counts. The model never predicts a future position without a causal mask. Evaluation runs with gradients disabled and does not change weights.

The corpus has exact deduplication and document-first partitioning, but its documents share templates and most words. Results demonstrate learning and composition within a constrained generator. They do not establish factuality, conversational quality, multilingual competence or transfer to arbitrary text.

## Paired context experiment

`scripts/measure_context.py` samples 512 distinct next-token target positions from held-out documents using seed 718, without replacement. It evaluates exactly those positions with the final checkpoint and a maximum context of 8, 24 or 48 previous tokens. A short prefix uses only available tokens. Position indices restart at zero in each cropped context, matching generation. Weights are not retrained for this experiment.

| Maximum context | Mean held-out next-token loss |
|---:|---:|
| 8 | 0.251623 |
| 24 | 0.191059 |
| 48 | 0.195158 |

The 24 and 48 results are close; the longer context does not uniformly win. This paired evaluation uses a different sampling scheme than the learning-curve metric, so the values need not match 0.2157. The complete result and corpus hash are in `context-experiment.json`.

## Reproducibility

The run records code configuration, data hash, versions, device and seeds. A local optimizer checkpoint preserves AdamW state and both training RNG states. Tests verify identical tensors after cancellation/resumption versus uninterrupted training in the same environment. Browser Float64 arithmetic differs from PyTorch Float32; full logits match within 2e-5 in parity tests, and selected seeded generation cases match exactly. Cross-version/device bitwise equality is not promised.

Imported JSON bundles are data, not trusted evidence of provenance: the metadata is self-reported and is not cryptographically signed. Only the bundled demo is tied to the included reproducible training source and parity fixtures. Never treat a random imported bundle's loss numbers as independently verified.
