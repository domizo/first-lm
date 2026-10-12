# Verification record

Verified on the local CPU runtime used to build this project:

- Genuine 25-step smoke training and a 600-step reference run completed
- Independent fresh 600-step retraining reproduced every final tensor and every recorded train/held-out loss value exactly in this runtime
- 53 TypeScript parity tests passed, covering full Python/browser logits and seeded generation across all four saved checkpoints
- 16 Python tests passed, including causal masking, train-only vocabulary, exact cancellation/resumption equality, local API boundaries, bounded body streaming, checkpoint retention, and rejecting executable pickle payloads with weights-only loading
- TypeScript check and production Vite build passed
- Fresh-process recovery of an interrupted app-created run and rejection of a path-traversing latest-run pointer were independently checked

Local Chromium launch is blocked by this execution sandbox's socket permissions, so browser proof is produced by the exact-commit [GitHub Actions workflow](https://github.com/domizo/first-lm/actions/workflows/verify.yml). Its `first-lm-browser-proof` artifact contains desktop/mobile English/Japanese screenshots, the test report, and failure traces when relevant. Check the run associated with the source commit; a local sandbox limitation does not count as a browser pass.

The browser suite exercises recorded-run navigation, real seeded inference, JSON import/export, initialization races, custom-corpus training, cancellation, reload and resumption. Screenshots come from that matching build. Owner-private hosting is deployed separately; authenticated hosted-session behavior has not been verified because its sign-in route was unavailable to the automated QA session. No authentication or access controls were bypassed.

The bundle's metadata is not a cryptographic signature. The included reference run is tied to reproducible source and independently checked; arbitrary imported bundle claims are not authenticated.
