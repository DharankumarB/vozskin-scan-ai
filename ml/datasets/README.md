# Dataset handling

No dataset or patient data is included. Mount approved data from encrypted, access-controlled storage outside Git. Store a manifest with pseudonymous patient-group identifiers, image identifiers, label provenance, consent/usage scope, and split assignment. Do not include direct identifiers in manifests, logs, notebooks, or model artifacts.

Before training, deduplicate at patient level and verify that no patient, derived crop, duplicate, or near-duplicate crosses `TRAIN`, `VALIDATION`, and locked `TEST` splits. Keep the final test set isolated until the model and thresholds are frozen. Confirm legal basis and data-use permissions with the responsible organization.
