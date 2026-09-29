export type ImageInspection = {
  ok: boolean;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  width: number;
  height: number;
  sizeBytes: number;
  reasons: string[];
  technicalChecks: string[];
};

const supported = ["image/jpeg", "image/png", "image/webp"] as const;
const maxSizeMb = Math.min(10, Math.max(1, Number(process.env.NEXT_PUBLIC_MAX_IMAGE_SIZE_MB ?? "10")));

function identifyImage(bytes: Uint8Array): (typeof supported)[number] | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

function analyzePixels(bitmap: ImageBitmap) {
  const sample = 72;
  const scale = Math.min(sample / bitmap.width, sample / bitmap.height, 1);
  const width = Math.max(2, Math.round(bitmap.width * scale));
  const height = Math.max(2, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas unavailable");
  context.drawImage(bitmap, 0, 0, width, height);
  const data = context.getImageData(0, 0, width, height).data;
  const luma = new Float32Array(width * height);
  let total = 0;
  let clipped = 0;
  for (let i = 0; i < width * height; i += 1) {
    const brightness = .2126 * data[i * 4] + .7152 * data[i * 4 + 1] + .0722 * data[i * 4 + 2];
    luma[i] = brightness;
    total += brightness;
    if (brightness < 8 || brightness > 247) clipped += 1;
  }

  let laplacianTotal = 0;
  let laplacianSquared = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const value = luma[index - width] + luma[index - 1] + luma[index + 1] + luma[index + width] - 4 * luma[index];
      laplacianTotal += value;
      laplacianSquared += value * value;
      count += 1;
    }
  }
  canvas.width = 0;
  canvas.height = 0;
  const mean = total / (width * height);
  const laplacianMean = laplacianTotal / Math.max(count, 1);
  const laplacianVariance = laplacianSquared / Math.max(count, 1) - laplacianMean * laplacianMean;
  return { mean, clippedFraction: clipped / (width * height), laplacianVariance };
}

export async function inspectImageFile(file: File): Promise<ImageInspection> {
  const reasons: string[] = [];
  const technicalChecks: string[] = [];
  const sizeLimit = Math.max(1, Number.isFinite(maxSizeMb) ? maxSizeMb : 10) * 1024 * 1024;
  if (file.size <= 0) reasons.push("The selected file is empty.");
  if (file.size > sizeLimit) reasons.push(`The image exceeds the ${((sizeLimit / 1024 / 1024).toFixed(1))} MB file-size limit.`);

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const detectedType = identifyImage(bytes);
  if (!detectedType || !(supported as readonly string[]).includes(detectedType)) reasons.push("The file content is not a supported JPEG, PNG, or WEBP image.");
  if (detectedType && file.type && file.type !== detectedType) reasons.push("The file content does not match its declared image type.");
  if (reasons.length > 0 || !detectedType) return { ok: false, mimeType: (detectedType ?? "image/jpeg") as ImageInspection["mimeType"], width: 0, height: 0, sizeBytes: file.size, reasons, technicalChecks };

  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); } catch {
    return { ok: false, mimeType: detectedType, width: 0, height: 0, sizeBytes: file.size, reasons: ["The image could not be decoded. Choose an uncorrupted image and try again."], technicalChecks };
  }

  const width = bitmap.width;
  const height = bitmap.height;
  if (width < 256 || height < 256) reasons.push("The image resolution is too low. Use an image at least 256 × 256 pixels.");
  if (width > 20000 || height > 20000) reasons.push("The image dimensions exceed the supported limit.");
  if (reasons.length === 0) {
    try {
      const pixels = analyzePixels(bitmap);
      if (pixels.mean < 25) reasons.push("The image appears extremely dark. Try again in even, natural light.");
      else if (pixels.mean > 238) reasons.push("The image appears extremely bright. Reduce glare and try again.");
      if (pixels.clippedFraction > .58) reasons.push("Too much of the image is near pure black or white. Adjust the lighting and try again.");
      if (pixels.laplacianVariance < 1.8) reasons.push("The image may be heavily blurred or lack detail. Hold the camera steady and try again.");
      technicalChecks.push("The image file decoded successfully.");
      technicalChecks.push(`Dimensions: ${width} × ${height} pixels.`);
      if (reasons.length === 0) technicalChecks.push("Basic exposure and sharpness heuristics passed.");
    } catch {
      reasons.push("A basic technical image check could not be completed in this browser.");
    }
  }
  bitmap.close();
  return { ok: reasons.length === 0, mimeType: detectedType, width, height, sizeBytes: file.size, reasons, technicalChecks };
}
