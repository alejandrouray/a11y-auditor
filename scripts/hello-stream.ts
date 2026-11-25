/**
 * Task 1.2: first contact with the AI SDK.
 * Run: npm run ai:hello  (reads AI_PROVIDER_API_KEY from .env.local)
 */
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, streamText } from "ai";
import { parseEnv } from "../src/lib/env.ts";

const MODEL_ID = "claude-opus-5-5";

const env = parseEnv(process.env);
const anthropic = createAnthropic({ apiKey: env.AI_PROVIDER_API_KEY });
const model = anthropic(MODEL_ID);

// 1. generateText: waits for the whole answer, then returns it at once.
const { text, usage: callUsage } = await generateText({
  model,
  prompt: "In one sentence: what is WCAG?",
});
console.log(`generateText:\n${text}`);
console.log(`tokens: ${callUsage.inputTokens} in / ${callUsage.outputTokens} out\n`);

// 2. streamText: returns immediately; the text arrives in chunks.
const result = streamText({
  model,
  prompt: "In three short bullet points: why do images need alt text?",
});
console.log("streamText:");
for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
const usage = await result.usage;
console.log(`\ntokens: ${usage.inputTokens} in / ${usage.outputTokens} out`);
