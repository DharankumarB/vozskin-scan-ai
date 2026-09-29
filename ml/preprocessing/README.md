# Preprocessing

No image preprocessing pipeline is currently connected to model inference. The browser scan flow performs only local file-signature, decode, dimensions, exposure, and a crude sharpness heuristic; it cannot assess visible skin area, obstruction, or clinical suitability. These checks are explicitly not a validated clinical image-quality model.

A future model adapter must use a versioned, tested preprocessing implementation shared between training and inference, preserve the original image where required, and reject corrupted, unsupported, or out-of-distribution inputs before prediction.
