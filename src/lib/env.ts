import { z } from "zod";

/**
 * Server-side environment, validated once. Fails loudly at startup instead of
 * failing later inside a model call. Keys live in `.env.local` (gitignored);
 * `.env.example` lists the names without values.
 */
const MISSING_KEY = "AI_PROVIDER_API_KEY is missing: copy .env.example to .env.local";

const EnvSchema = z.object({
  AI_PROVIDER_API_KEY: z.string({ error: MISSING_KEY }).min(1, MISSING_KEY),
});

export type Env = z.infer<typeof EnvSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join("; "));
  }
  return result.data;
}
