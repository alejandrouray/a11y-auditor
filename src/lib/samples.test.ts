import { readdir } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { CATEGORIES, ManifestSchema, SAMPLES_DIR, loadSamples, type Sample } from "./samples";

const validIssue = {
  wcag: "1.1.1",
  axeRule: "image-alt",
  impact: "critical",
  selector: "img",
  detectableByAxe: true,
  description: "No alt.",
};

const validSample = { id: "01-demo", file: "01-demo.html", category: "images", issues: [validIssue] };

describe("the sample dataset", () => {
  let samples: Sample[];

  beforeAll(async () => {
    samples = await loadSamples();
  });

  it("has at least 21 samples, each with HTML", () => {
    expect(samples.length).toBeGreaterThanOrEqual(21);

    for (const sample of samples) {
      expect(sample.html.trim(), sample.id).not.toBe("");
    }
  });

  it("lists every HTML file in the folder in the manifest", async () => {
    const htmlFiles = (await readdir(SAMPLES_DIR)).filter((file) => file.endsWith(".html"));

    expect(htmlFiles.sort()).toEqual(samples.map((sample) => sample.file).sort());
  });

  it("covers every category with at least three samples", () => {
    for (const category of CATEGORIES) {
      const count = samples.filter((sample) => sample.category === category).length;

      expect(count, category).toBeGreaterThanOrEqual(3);
    }
  });

  it("only uses selectors whose classes and ids appear in the sample", () => {
    for (const sample of samples) {
      for (const issue of sample.issues) {
        const tokens = [...issue.selector.matchAll(/[.#]([\w-]+)/g)].map((match) => match[1]);

        for (const token of tokens) {
          expect(sample.html, `${sample.id}: ${issue.selector}`).toContain(token);
        }
      }
    }
  });

  it("includes issues axe-core cannot detect, for the model to find", () => {
    const issues = samples.flatMap((sample) => sample.issues);

    expect(issues.some((issue) => issue.detectableByAxe)).toBe(true);
    expect(issues.some((issue) => !issue.detectableByAxe)).toBe(true);
  });
});

describe("ManifestSchema", () => {
  it("accepts a valid manifest", () => {
    expect(ManifestSchema.safeParse([validSample]).success).toBe(true);
  });

  it.each([
    ["a duplicated id", [validSample, validSample]],
    ["a file that does not match the id", [{ ...validSample, file: "other.html" }]],
    ["an invalid WCAG criterion", [{ ...validSample, issues: [{ ...validIssue, wcag: "1.1" }] }]],
    ["an unknown impact", [{ ...validSample, issues: [{ ...validIssue, impact: "huge" }] }]],
    ["an axe rule on an issue axe cannot detect", [{ ...validSample, issues: [{ ...validIssue, detectableByAxe: false }] }]],
    ["a sample without issues", [{ ...validSample, issues: [] }]],
  ])("rejects %s", (_label, manifest) => {
    expect(ManifestSchema.safeParse(manifest).success).toBe(false);
  });
});
