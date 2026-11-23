import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("returns the validated environment", () => {
    expect(parseEnv({ AI_PROVIDER_API_KEY: "test-key" })).toEqual({ AI_PROVIDER_API_KEY: "test-key" });
  });

  it("fails with a helpful message when the key is missing", () => {
    expect(() => parseEnv({})).toThrow(/copy \.env\.example/);
    expect(() => parseEnv({ AI_PROVIDER_API_KEY: "" })).toThrow(/copy \.env\.example/);
  });
});
