import "server-only";

import type { ScreeningModel } from "@/lib/ai/interface";

/**
 * Production model registry. Register an evaluated adapter here only after the
 * clinical, security, and operational validation gates described in README.
 * A missing adapter is intentional and must never yield a synthetic result.
 */
export function getScreeningModel(): ScreeningModel | null {
  return null;
}
