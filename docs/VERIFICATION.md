# Verification record

Historical reference evidence (PyTorch 2.9.1+cpu, retained unchanged):

- Genuine 25-step smoke training and a 600-step reference run completed
- Independent fresh 600-step retraining reproduced every final tensor and every recorded train/held-out loss value exactly in this runtime
- Fresh-process recovery of an interrupted app-created run and rejection of a path-traversing latest-run pointer were independently checked on that historical runtime

Current supported runtime: PyTorch 2.13.0+cpu with the pinned Linux/Python3.12 dependency closure. The 600-step retraining completes but differs across versions: held-out loss 0.216170 versus recorded 0.215728. Saved-checkpoint inference remains compatible. See [dependency and compatibility record](DEPENDENCIES.md).

- 119 TypeScript tests passed, covering full Python/browser logits and seeded generation across all four saved checkpoints, teaching-probe arithmetic, real embedding lookups, guide route parsing, bilingual beginner content, explanatory-diagram labels/order, unscored question structure, and the introductory LLM definition/scope and single-heading route structure
- 18 Python tests passed, including causal masking, train-only vocabulary, exact cancellation/resumption equality, local API boundaries, bounded body streaming, checkpoint retention, and rejecting executable pickle payloads with weights-only loading, and supported-runtime logits/sampling against the immutable historical oracle
- TypeScript check and production Vite build passed

Local Chromium launch is blocked by this execution sandbox's socket permissions, so browser proof is produced by the exact-commit [GitHub Actions workflow](https://github.com/domizo/first-lm/actions/workflows/verify.yml). Its `first-lm-browser-proof` artifact contains desktop/mobile English/Japanese screenshots, the test report, and failure traces when relevant. Check the run associated with the source commit; a local sandbox limitation does not count as a browser pass.

The browser suite exercises recorded-run navigation, real seeded inference, JSON import/export, initialization races, custom-corpus training, cancellation, reload and resumption. The expanded learning-path suite also checks direct chapter links, browser history, keyboard activation, preserved experiment inputs/output, real controlled comparisons, and EN/JA mobile diagrams. A dedicated beginner case checks all eight explanatory illustrations, keyboard-operated feedback, optional real-model depth, and 320/390-pixel layouts. A separate introduction case verifies the LLM orientation appears before the chapter list, keyboard access to optional scope and the Start button, unchanged hashes, language switching, history, and mobile layouts. The browser suite also verifies exact served third-party notice text and bilingual footer access. Screenshots come from that matching build. Owner-private hosting is deployed separately; authenticated hosted-session behavior has not been verified because its sign-in route was unavailable to the automated QA session. No authentication or access controls were bypassed.

The bundle's metadata is not a cryptographic signature. The included reference run is tied to reproducible source and independently checked; arbitrary imported bundle claims are not authenticated.
