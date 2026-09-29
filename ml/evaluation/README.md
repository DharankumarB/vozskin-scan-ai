# Evaluation protocol

Evaluation values are **not available** because no validated model or clinical dataset is connected. Never replace missing values with estimates or demo percentages.

A signed evaluation report should cover sensitivity, specificity, precision, recall, F1, AUROC, AUPRC, calibration, confusion matrix, confidence intervals, subgroup results, image-quality abstention, external validation, and failure analysis. Include patient-level split provenance and a leakage audit. Freeze the test set until model selection and threshold calibration are complete. The template `metrics.template.json` intentionally contains null values only.
