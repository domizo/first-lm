# Corpus provenance

All bundled demonstration sentences were written for this project. The generator combines six animals, four colors, four places and three objects in two language templates, producing 576 distinct documents. No website, book, organization source, downloaded corpus or pretrained model contributed training text.

The bundled text is original project-authored content and has no third-party corpus license dependency. It is distributed as part of this private project; no public software or data license is granted. Custom user corpora remain subject to their own rights and permissions.

The entire set is generated deterministically by `original_corpus()` in `python/model_lab/data.py`. `python -m model_lab corpus --output data/corpus.txt` regenerates it. SHA-256 in each run identifies the canonical JSON list of complete documents, not the text-file bytes.

Exact duplicate documents are removed before a seed-17 80/20 document split. Character vocabulary is built only from training documents. Windows never cross document boundaries. Near-duplicate sentences and shared templates remain intentionally present. This corpus demonstrates optimization and sampling, not broad natural-language competence.
