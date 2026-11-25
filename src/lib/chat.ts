import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  safeValidateUIMessages,
  streamText,
  toUIMessageStream,
  type LanguageModel,
  type UIMessage,
} from "ai";
import { z } from "zod";

/** Model used by the chat route. Same model as `scripts/hello-stream.ts`. */
export const MODEL_ID = "claude-opus-5-5";

/** Cap on each answer, so one request can never run up a large bill. */
export const MAX_OUTPUT_TOKENS = 1024;

export const CHAT_INSTRUCTIONS = [
  "You are an accessibility assistant for frontend developers.",
  "Answer questions about WCAG 2.2, ARIA and accessible HTML, CSS and React.",
  "Be concise. When you suggest a fix, show the corrected code and name the WCAG success criterion it addresses.",
].join(" ");

/** Message shown in the UI when the provider fails. Never leaks provider details. */
export const PROVIDER_ERROR_MESSAGE =
  "The model could not answer right now. Please try again in a moment.";

/** The body `useChat` posts to `/api/chat`: a non-empty list of UI messages. */
const ChatRequestSchema = z.object({
  messages: z.array(z.unknown()).min(1, "messages must not be empty"),
});

export type ChatRequest = { messages: UIMessage[] };

/**
 * Validates the request body. zod checks the envelope; the AI SDK's own validator
 * checks each message (id, role, parts), so the route never trusts client input.
 */
export async function parseChatRequest(body: unknown): Promise<ChatRequest> {
  const envelope = ChatRequestSchema.safeParse(body);

  if (!envelope.success) {
    throw new Error(envelope.error.issues.map((i) => i.message).join("; "));
  }

  const result = await safeValidateUIMessages({ messages: envelope.data.messages });

  if (!result.success) {
    throw new Error(`Invalid messages: ${result.error.message}`);
  }

  return { messages: result.data };
}

/**
 * Streams the model's answer in the UI message stream protocol that `useChat` reads.
 * The model is a parameter so tests can pass a mock instead of calling the provider.
 */
export async function createChatResponse({
  messages,
  model,
}: ChatRequest & { model: LanguageModel }): Promise<Response> {
  const result = streamText({
    model,
    instructions: CHAT_INSTRUCTIONS,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      // The UI shows only the answer, so the model's reasoning never leaves the server.
      sendReasoning: false,
      onError: (error) => {
        console.error("[chat] provider error", error);

        return PROVIDER_ERROR_MESSAGE;
      },
    }),
  });
}
