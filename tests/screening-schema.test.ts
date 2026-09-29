import { describe, expect, it } from "vitest";
import { ScreeningOutputSchema, ScreeningRequestSchema, SymptomAnswersSchema } from "@/lib/screening/schema";

const answers = {
  age_range: "25_34",
  body_location: "arms",
  duration_days: 12,
  redness: true,
  scaling: false,
  itching: true,
  dryness: false,
  pain: false,
  burning: false,
  swelling: false,
  recurrence: false,
  previous_similar_episodes: "unsure",
  family_history: "no",
  previous_professional_diagnosis: "no",
};

const output = {
  screening_level: "MODERATE",
  probability: 0.42,
  confidence: 0.73,
  uncertainty: "moderate",
  signals: [{ type: "visual", name: "scaling_pattern", detected: true }],
  recommendation: "professional_evaluation",
  model_name: "validated-adapter",
  model_version: "0.1.0",
  prediction_timestamp: "2026-09-29T00:00:00.000Z",
  input_schema_version: "1.0",
};

describe("screening input schema", () => {
  it("accepts structured, consented input with bounded image metadata", () => {
    const result = ScreeningRequestSchema.safeParse({
      consent_given: true,
      image: { mime_type: "image/jpeg", file_size: 512000, width: 1200, height: 900 },
      answers,
    });
    expect(result.success).toBe(true);
  });

  it("rejects input when consent is absent", () => {
    const result = ScreeningRequestSchema.safeParse({
      consent_given: false,
      image: { mime_type: "image/png", file_size: 8000, width: 640, height: 480 },
      answers,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unsupported image MIME type and out-of-range dimensions", () => {
    const result = ScreeningRequestSchema.safeParse({
      consent_given: true,
      image: { mime_type: "image/gif", file_size: 8000, width: 80, height: 480 },
      answers,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing questionnaire responses rather than defaulting them", () => {
    const incomplete = { ...answers, itching: undefined };
    const result = SymptomAnswersSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });
});

describe("screening output schema", () => {
  it("accepts a traceable structured model output", () => {
    expect(ScreeningOutputSchema.safeParse(output).success).toBe(true);
  });

  it("rejects an unrecognized risk label or unbounded probability", () => {
    expect(ScreeningOutputSchema.safeParse({ ...output, screening_level: "DIAGNOSIS" }).success).toBe(false);
    expect(ScreeningOutputSchema.safeParse({ ...output, probability: 1.01 }).success).toBe(false);
  });

  it("requires model version and prediction provenance", () => {
    const untraceable = { ...output, model_version: undefined };
    expect(ScreeningOutputSchema.safeParse(untraceable).success).toBe(false);
  });
});
