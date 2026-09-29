import { z } from "zod";

export const ImageMetadataSchema = z.object({
  mime_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  file_size: z.number().int().positive().max(10 * 1024 * 1024),
  width: z.number().int().min(256).max(20000),
  height: z.number().int().min(256).max(20000),
}).strict();

export const SymptomAnswersSchema = z.object({
  age_range: z.enum(["under_18", "18_24", "25_34", "35_44", "45_54", "55_64", "65_plus", "prefer_not_to_say"]),
  body_location: z.enum(["scalp", "face", "neck", "chest", "back", "arms", "hands", "legs", "feet", "other"]),
  duration_days: z.number().int().min(0).max(36500),
  redness: z.boolean(),
  scaling: z.boolean(),
  itching: z.boolean(),
  dryness: z.boolean(),
  pain: z.boolean(),
  burning: z.boolean(),
  swelling: z.boolean(),
  recurrence: z.boolean(),
  previous_similar_episodes: z.enum(["yes", "no", "unsure"]),
  family_history: z.enum(["yes", "no", "unsure"]),
  previous_professional_diagnosis: z.enum(["yes", "no", "unsure"]),
  relevant_skin_history: z.string().max(300).optional(),
}).strict();

export const ScreeningRequestSchema = z.object({
  consent_given: z.literal(true),
  image: ImageMetadataSchema,
  answers: SymptomAnswersSchema,
}).strict();

export const ScreeningLevelSchema = z.enum(["LOW", "MODERATE", "HIGH", "INSUFFICIENT_INFORMATION"]);
export const UncertaintySchema = z.enum(["low", "moderate", "high"]);

export const ScreeningSignalSchema = z.object({
  type: z.enum(["visual", "symptom"]),
  name: z.string().min(1).max(80),
  detected: z.boolean(),
}).strict();

export const ScreeningOutputSchema = z.object({
  screening_level: ScreeningLevelSchema,
  probability: z.number().min(0).max(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  uncertainty: UncertaintySchema,
  image_quality: z.number().min(0).max(1).optional(),
  signals: z.array(ScreeningSignalSchema).max(50),
  recommendation: z.enum(["professional_evaluation", "routine_follow_up", "insufficient_information"]),
  model_name: z.string().min(1).max(120),
  model_version: z.string().min(1).max(60),
  prediction_timestamp: z.string().datetime(),
  input_schema_version: z.string().min(1).max(30),
}).strict();

export type ImageMetadata = z.infer<typeof ImageMetadataSchema>;
export type SymptomAnswers = z.infer<typeof SymptomAnswersSchema>;
export type ScreeningRequest = z.infer<typeof ScreeningRequestSchema>;
export type ScreeningOutput = z.infer<typeof ScreeningOutputSchema>;
