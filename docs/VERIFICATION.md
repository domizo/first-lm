# Verification record

Verified on the local CPU runtime used to build this project:

- Genuine 25-step smoke training and a 600-step reference run completed
- Independent fresh 600-step retraining reproduced every final tensor and every recorded train/held-out loss value exactly in this runtime
- 53 TypeScript parity tests passed, covering full Python/browser logits and seeded generation across all four saved checkpoints
- 16 Python tests passed, including causal masking, train-only vocabulary, exact cancellation/resumption equality, local API boundaries, bounded body streaming, checkpoint retention, and rejecting executable pickle payloads with weights-only loading
- TypeScript check and production Vite build passed
- Fresh-process recovery of an interrupted app-created run and rejection of a path-traversing latest-run pointer were independently checked

Local interactive browser verification is not yet recorded here. Chromium launch in this execution sandbox fails with a socket permission error before any page opens. The shared cloud browser cannot reach this executor's loopback service. GitHub Actions browser tests and screenshots are being prepared to verify the exact source revision in a supported runtime. This limitation does not count as a browser pass.

The bundle's metadata is not a cryptographic signature. The included reference run is tied to reproducible source and independently checked; arbitrary imported bundle claims are not authenticated.
