# Training protocol

No training code, labels, dataset, or weights are supplied. A future training implementation must be reproducible and include:

- immutable patient-level `TRAIN`, `VALIDATION`, and locked `TEST` assignment;
- stratification where appropriate without splitting a patient across partitions;
- class-imbalance handling chosen using training data only;
- transfer-learning baseline, documented augmentation, fixed seeds, and versioned preprocessing;
- hyperparameter selection and probability calibration using validation data only;
- explicit abstention thresholds for `INSUFFICIENT_INFORMATION`;
- model card, data card, training commit, dependency lock, and artifact hash.

Do not use the locked test set to select architectures, thresholds, or explanatory examples.
