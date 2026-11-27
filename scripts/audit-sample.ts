/**
 * Task 1.5: audit one sample with the real model and compare against the manifest.
 * Run: npm run ai:audit -- 01-img-missing-alt  (reads AI_PROVIDER_API_KEY from .env.local)
 * Each run is one paid model call.
 */
import { createAnthropic } from "@ai-sdk/anthropic";
import { auditHtml } from "../src/lib/audit.ts";
import { parseEnv } from "../src/lib/env.ts";
import { loadSamples } from "../src/lib/samples.ts";

const MODEL_ID = "claude-opus-5-5";

const id = process.argv[2];
const samples = await loadSamples();
const sample = samples.find((candidate) => candidate.id === id);

if (!sample) {
  console.error(`Unknown sample "${id}". Available:\n${samples.map((s) => `  ${s.id}`).join("\n")}`);
  process.exit(1);
}

const env = parseEnv(process.env);
const anthropic = createAnthropic({ apiKey: env.AI_PROVIDER_API_KEY });

const findings = await auditHtml({ html: sample.html, model: anthropic(MODEL_ID) });

console.log(`Expected (manifest), ${sample.issues.length}:`);

for (const issue of sample.issues) {
  console.log(`  ${issue.wcag}  ${issue.selector}  ${issue.description}`);
}

console.log(`\nFound (model), ${findings.length}:`);

for (const finding of findings) {
  console.log(`  ${finding.wcag}  ${finding.element}  ${finding.issue}`);
}
