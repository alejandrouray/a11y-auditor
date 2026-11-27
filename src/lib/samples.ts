import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

/** Folder with the HTML samples and their `manifest.json`. */
export const SAMPLES_DIR = path.join(process.cwd(), "data", "samples");

/** Same impact levels axe-core uses, so expected and found issues compare directly. */
export const IMPACTS = ["minor", "moderate", "serious", "critical"] as const;

/** A WCAG success criterion such as `1.4.3`. */
export const WCAG_CRITERION = /^[1-4]\.\d{1,2}\.\d{1,2}$/;

export const CATEGORIES = [
  "images",
  "forms",
  "contrast",
  "keyboard-focus",
  "aria",
  "structure",
] as const;

/**
 * One accessibility failure a sample is known to contain.
 * `detectableByAxe` says whether axe-core has a rule for it: the issues without one
 * are the ones the model has to find on its own.
 */
const ExpectedIssueSchema = z
  .object({
    wcag: z.string().regex(WCAG_CRITERION, "wcag must be a success criterion like 1.4.3"),
    axeRule: z.string().min(1).nullable(),
    impact: z.enum(IMPACTS),
    selector: z.string().min(1),
    detectableByAxe: z.boolean(),
    description: z.string().min(1),
  })
  .refine((issue) => issue.detectableByAxe === (issue.axeRule !== null), {
    error: "axeRule must be set exactly when detectableByAxe is true",
  });

const SampleSchema = z
  .object({
    id: z.string().regex(/^\d{2}-[a-z0-9-]+$/, "id must look like 07-low-contrast-text"),
    file: z.string(),
    category: z.enum(CATEGORIES),
    issues: z.array(ExpectedIssueSchema).min(1),
  })
  .refine((sample) => sample.file === `${sample.id}.html`, { error: "file must be <id>.html" });

export const ManifestSchema = z
  .array(SampleSchema)
  .min(1)
  .refine((samples) => new Set(samples.map((sample) => sample.id)).size === samples.length, {
    error: "sample ids must be unique",
  });

export type ExpectedIssue = z.infer<typeof ExpectedIssueSchema>;
export type Sample = z.infer<typeof SampleSchema> & { html: string };

/** Reads the manifest, validates it and attaches each sample's HTML. */
export async function loadSamples(dir: string = SAMPLES_DIR): Promise<Sample[]> {
  const raw: unknown = JSON.parse(await readFile(path.join(dir, "manifest.json"), "utf8"));
  const manifest = ManifestSchema.parse(raw);

  return Promise.all(
    manifest.map(async (sample) => ({
      ...sample,
      html: await readFile(path.join(dir, sample.file), "utf8"),
    })),
  );
}
