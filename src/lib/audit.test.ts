import { NoObjectGeneratedError } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { beforeAll, describe, expect, it } from "vitest";
import { AUDIT_INSTRUCTIONS, AUDIT_MAX_OUTPUT_TOKENS, auditHtml, FindingSchema, type Finding } from "./audit";
import { loadSamples, type Sample } from "./samples";

const usage = {
  inputTokens: { total: 100, noCache: 100, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 50, text: 50, reasoning: 0 },
};

/** A model that always answers with `text`, the way a real one sends its JSON. */
function answeringModel(text: string) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text" as const, text }],
      finishReason: { unified: "stop" as const, raw: "end_turn" },
      usage,
      warnings: [],
    }),
  });
}

/** The findings a perfect model would report for a sample: one per expected issue. */
function perfectFindings(sample: Sample): Finding[] {
  return sample.issues.map((issue) => ({
    issue: issue.description,
    wcag: issue.wcag,
    impact: issue.impact,
    element: issue.selector,
    explanation: issue.description,
    fix: "<!-- corrected HTML -->",
  }));
}

const validFinding: Finding = {
  issue: "Image without alt text",
  wcag: "1.1.1",
  impact: "critical",
  element: "img",
  explanation: "Screen readers cannot describe the image.",
  fix: '<img src="logo.png" alt="Acme">',
};

describe("auditHtml", () => {
  let samples: Sample[];

  beforeAll(async () => {
    samples = await loadSamples();
  });

  it("returns the findings for five samples, one from each of five categories", async () => {
    const categories = ["images", "forms", "contrast", "keyboard-focus", "aria"];

    for (const category of categories) {
      const sample = samples.find((candidate) => candidate.category === category);

      if (!sample) {
        throw new Error(`no sample in category ${category}`);
      }

      const expected = perfectFindings(sample);
      const model = answeringModel(JSON.stringify({ findings: expected }));

      expect(await auditHtml({ html: sample.html, model }), sample.id).toEqual(expected);
    }
  });

  it("sends the instructions, the HTML and the token cap to the model", async () => {
    const model = answeringModel(JSON.stringify({ findings: [] }));
    const html = '<img src="logo.png">';

    await auditHtml({ html, model });

    const call = model.doGenerateCalls[0];

    expect(JSON.stringify(call.prompt)).toContain(AUDIT_INSTRUCTIONS);
    expect(JSON.stringify(call.prompt)).toContain(JSON.stringify(html).slice(1, -1));
    expect(call.maxOutputTokens).toBe(AUDIT_MAX_OUTPUT_TOKENS);
  });

  it("returns an empty list when the HTML has no failures", async () => {
    const model = answeringModel(JSON.stringify({ findings: [] }));

    expect(await auditHtml({ html: "<p>All good</p>", model })).toEqual([]);
  });

  it.each([
    ["text that is not JSON", "I found two problems: ..."],
    ["a finding with an unknown impact", JSON.stringify({ findings: [{ ...validFinding, impact: "huge" }] })],
    ["a finding without a fix", JSON.stringify({ findings: [{ ...validFinding, fix: undefined }] })],
  ])("throws NoObjectGeneratedError when the model returns %s", async (_label, text) => {
    await expect(auditHtml({ html: "<img>", model: answeringModel(text) })).rejects.toSatisfy(
      NoObjectGeneratedError.isInstance,
    );
  });
});

describe("FindingSchema", () => {
  it("accepts a valid finding", () => {
    expect(FindingSchema.safeParse(validFinding).success).toBe(true);
  });

  it.each([
    ["a WCAG level instead of a criterion", { ...validFinding, wcag: "wcag2a" }],
    ["an empty selector", { ...validFinding, element: "" }],
    ["a missing explanation", { ...validFinding, explanation: undefined }],
  ])("rejects %s", (_label, finding) => {
    expect(FindingSchema.safeParse(finding).success).toBe(false);
  });
});
