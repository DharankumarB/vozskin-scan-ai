# Augmentation

No augmentation code or policy is included. Define transformations before training, document which transformations are clinically and acquisition-wise defensible, and apply them only to training data. Keep validation and locked test data unaugmented except for the exact deterministic preprocessing used at inference. Preserve source-image and patient grouping so augmented versions cannot cross data splits.
