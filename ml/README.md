# ML development workspace

This folder is a deliberately empty integration scaffold. **No trained skin-screening model, patient dataset, checkpoint, clinical evaluation, or validated heatmap is included.** The application must continue to return `AI_MODEL_NOT_CONNECTED` until a real model has passed the governance and evaluation process below.

## Intended project layout

- `datasets/` — locally mounted, access-controlled dataset manifests only; never commit patient data.
- `preprocessing/` — versioned image decoding, normalization, and technical validation.
- `augmentation/` — training-only augmentation policy; preserve source provenance.
- `training/` — reproducible training configuration and patient-level split manifest.
- `evaluation/` — locked test evaluation, subgroup analysis, calibration, and report artifacts.
- `inference/` — typed screening-model protocol shared with the application adapter.
- `explainability/` — validated model-specific saliency/attention support only.
- `configs/` — reviewed, non-secret configuration.
- `checkpoints/` — external/model-registry references; binary weights do not belong in Git.
- `notebooks/` — exploratory work only; production transformations must move into tested modules.

## Required validation gates before connecting a model

1. Use a lawful, consented, provenance-tracked dataset and document intended use, exclusions, and image acquisition conditions.
2. Split at **patient level**, never by image. Keep `TRAIN`, `VALIDATION`, and a locked `TEST` cohort disjoint by patient identifier. Do not inspect or tune against the locked test set.
3. Document label provenance, adjudication, missing labels, duplicates, leakage checks, and class distribution.
4. Compare a justified transfer-learning baseline with alternatives. Keep augmentation inside training only and tune hyperparameters on validation data.
5. Calibrate on validation data; select abstention/insufficient-information thresholds with clinical and safety review.
6. Evaluate sensitivity, specificity, precision, recall, F1, AUROC, AUPRC, calibration, and confusion matrix. Report confidence intervals and subgroup performance; do not optimize only raw accuracy.
7. Perform external validation and prospective workflow review before any clinical use. Do not invent metrics if any evaluation set is missing.
8. Version model weights, code, preprocessing, input schema, thresholds, and evaluation artifacts together. Store model artifacts outside the repository in an access-controlled registry.
9. Independently validate any Grad-CAM, saliency, or attention visualization. Never generate a decorative or synthetic heatmap.
10. Complete clinical, privacy, security, legal, and operational approval for the deployment region.

## Application integration

The TypeScript contract lives in `lib/ai/interface.ts`; runtime output validation lives in `lib/screening/schema.ts`. Register a server-only adapter in `lib/ai/registry.ts` only after every gate passes. The browser must never call a sensitive model API directly. Persist an output only with its session, image, questionnaire, model version, timestamp, schema version, and validated explanation. If the adapter is missing, uncertain, malformed, or fails validation, abstain and do not create a result.
