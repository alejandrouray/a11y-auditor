"use client";

import { useChat } from "@ai-sdk/react";
import { useState, type SubmitEvent } from "react";

/** Status labels announced to screen readers while an answer is in progress. */
const STATUS_LABEL = {
  submitted: "Thinking…",
  streaming: "Writing the answer…",
} as const;

export function Chat() {
  const { messages, sendMessage, status, stop, error, regenerate, clearError } = useChat();
  const [input, setInput] = useState("");

  const busy = status === "submitted" || status === "streaming";

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = input.trim();

    if (!text || busy) return;

    void sendMessage({ text });
    setInput("");
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-4" aria-labelledby="chat-title">
      <h1 id="chat-title" className="text-2xl font-semibold">
        Accessibility assistant
      </h1>

      <div
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      >
        {messages.length === 0 && (
          <p className="text-zinc-500">Ask about WCAG, ARIA or an accessibility bug in your code.</p>
        )}

        {messages
          // Reasoning arrives before the text; skip a bubble until it has text to show.
          .filter((message) => message.parts.some((part) => part.type === "text" && part.text))
          .map((message) => (
            <article
              key={message.id}
              aria-label={message.role === "user" ? "You" : "Assistant"}
              className={
                message.role === "user"
                  ? "self-end rounded-lg bg-zinc-900 px-3 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "self-start whitespace-pre-wrap rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-900"
              }
            >
              {message.parts.map((part, index) =>
                part.type === "text" ? <span key={index}>{part.text}</span> : null,
              )}
            </article>
          ))}

        {busy && (
          <p role="status" className="text-sm text-zinc-500">
            {STATUS_LABEL[status]}
          </p>
        )}
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-lg bg-red-50 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">
          <p className="flex-1">{error.message}</p>
          <button
            type="button"
            onClick={() => {
              clearError();
              void regenerate();
            }}
            className="rounded-md border border-current px-3 py-1"
          >
            Retry
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Your question
        </label>
        <input
          id="chat-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Why does my icon button fail WCAG?"
          autoComplete="off"
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
        />
        {busy ? (
          <button type="button" onClick={() => void stop()} className="rounded-md border px-4 py-2">
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Send
          </button>
        )}
      </form>
    </section>
  );
}
