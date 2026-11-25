import { createAnthropic } from "@ai-sdk/anthropic";
import { createChatResponse, MODEL_ID, parseChatRequest } from "@/lib/chat";
import { parseEnv } from "@/lib/env";

/** Upper bound for one streamed answer, in seconds. */
export const maxDuration = 30;

export async function POST(request: Request): Promise<Response> {
  let messages;

  try {
    ({ messages } = await parseChatRequest(await request.json()));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body";
    return Response.json({ error: message }, { status: 400 });
  }

  const env = parseEnv(process.env);
  const anthropic = createAnthropic({ apiKey: env.AI_PROVIDER_API_KEY });

  return createChatResponse({ messages, model: anthropic(MODEL_ID) });
}
