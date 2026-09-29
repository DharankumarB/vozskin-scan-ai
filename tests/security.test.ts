import { describe, expect, it } from "vitest";
import { allowRateLimit, isSameOriginMutation } from "@/lib/security/rate-limit";

describe("request security helpers", () => {
  it("applies a fixed-window request limit", () => {
    const key = `test:${crypto.randomUUID()}`;
    expect(allowRateLimit(key, 2, 60_000, 10_000).allowed).toBe(true);
    expect(allowRateLimit(key, 2, 60_000, 10_001).allowed).toBe(true);
    expect(allowRateLimit(key, 2, 60_000, 10_002).allowed).toBe(false);
    expect(allowRateLimit(key, 2, 60_000, 70_001).allowed).toBe(true);
  });

  it("accepts same-origin mutations and rejects a foreign origin", () => {
    const sameOrigin = new Request("https://vozskin.example/api/sessions", { method: "DELETE", headers: { Origin: "https://vozskin.example" } });
    const foreignOrigin = new Request("https://vozskin.example/api/sessions", { method: "DELETE", headers: { Origin: "https://attacker.example" } });
    expect(isSameOriginMutation(sameOrigin, "https://vozskin.example")).toBe(true);
    expect(isSameOriginMutation(foreignOrigin, "https://vozskin.example")).toBe(false);
  });

  it("honors a trusted forwarded origin in reverse-proxy deployments", () => {
    const request = new Request("http://internal:3000/api/sessions", { method: "DELETE", headers: { Origin: "https://preview.example", "x-forwarded-host": "preview.example", "x-forwarded-proto": "https" } });
    expect(isSameOriginMutation(request, "http://localhost:3000")).toBe(true);
  });

  it("rejects a mutation without Origin or Referer", () => {
    const request = new Request("https://vozskin.example/api/sessions", { method: "DELETE" });
    expect(isSameOriginMutation(request, "https://vozskin.example")).toBe(false);
  });
});
