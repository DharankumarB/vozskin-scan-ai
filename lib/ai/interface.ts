import type { ScreeningOutput, ScreeningRequest } from "@/lib/screening/schema";

export interface ScreeningModel {
  readonly modelName: string;
  readonly modelVersion: string;
  predict(input: ScreeningRequest): Promise<ScreeningOutput>;
}

export class ModelUnavailableError extends Error {
  constructor() {
    super("No validated screening model is connected.");
    this.name = "ModelUnavailableError";
  }
}
