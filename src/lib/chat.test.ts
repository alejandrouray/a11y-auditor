import { simulateReadableStream, type UIMessage } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CHAT_INSTRUCTIONS,
  createChatResponse,
  MAX_OUTPUT_TOKENS,
  parseChatRequest,
  PROVIDER_ERROR_MESSAGE,
} from "./chat";

const userMessage: UIMessage = {
  id: "m1",
  role: "user",
  parts: [{ type: "text", text: "Why does an icon button need a label?" }],
};

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 5, text: 5, reasoning: 0 },
};

function streamingModel(deltas: string[]) {
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "text-start" as const, id: "t1" },
          ...deltas.map((delta) => ({ type: "text-delta" as const, id: "t1", delta })),
          { type: "text-end" as const, id: "t1" },
          { type: "finish" as const, usage, finishReason: { unified: "stop" as const, raw: "end_turn" } },
        ],
      }),
    }),
  });
}

describe("parseChatRequest", () => {
  it("accepts the body useChat sends", async () => {
    expect((await parseChatRequest({ messages: [userMessage] })).messages).toHaveLength(1);
  });

  it.each([
    ["no body", undefined],
    ["no messages", {}],
    ["empty messages", { messages: [] }],
    ["unknown role", { messages: [{ id: "m1", role: "robot", parts: [{ type: "text", text: "hi" }] }] }],
    ["missing parts", { messages: [{ id: "m1", role: "user" }] }],
  ])("rejects %s", async (_label, body) => {
    await expect(parseChatRequest(body)).rejects.toThrow();
  });
});

describe("createChatResponse", () => {
  afterEach(() => vi.restoreAllMocks());

  it("streams the model text in the UI message stream protocol", async () => {
    const model = streamingModel(["Screen readers ", "need a name."]);

    const response = await createChatResponse({ messages: [userMessage], model });
    const body = await response.text();

    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(body).toContain('"delta":"Screen readers "');
    expect(body).toContain('"delta":"need a name."');
  });

  it("does not send the model's reasoning to the browser", async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            { type: "reasoning-start" as const, id: "r1" },
            { type: "reasoning-delta" as const, id: "r1", delta: "private thoughts" },
            { type: "reasoning-end" as const, id: "r1" },
            { type: "text-start" as const, id: "t1" },
            { type: "text-delta" as const, id: "t1", delta: "Use aria-label." },
            { type: "text-end" as const, id: "t1" },
            { type: "finish" as const, usage, finishReason: { unified: "stop" as const, raw: "end_turn" } },
          ],
        }),
      }),
    });

    const body = await (await createChatResponse({ messages: [userMessage], model })).text();

    expect(body).toContain("Use aria-label.");
    expect(body).not.toContain("private thoughts");
  });

  it("sends the instructions and caps the output tokens", async () => {
    const model = streamingModel(["ok"]);

    await (await createChatResponse({ messages: [userMessage], model })).text();

    const call = model.doStreamCalls[0];

    expect(call.maxOutputTokens).toBe(MAX_OUTPUT_TOKENS);
    expect(JSON.stringify(call.prompt)).toContain(CHAT_INSTRUCTIONS);
  });

  it("turns a provider failure into a safe error message", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const model = new MockLanguageModelV4({
      doStream: async () => {
        throw new Error("401 invalid x-api-key sk-secret");
      },
    });

    const response = await createChatResponse({ messages: [userMessage], model });
    const body = await response.text();

    expect(body).toContain(PROVIDER_ERROR_MESSAGE);
    expect(body).not.toContain("sk-secret");
  });
});
