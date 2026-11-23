# job-fit-agent

An AI agent that reads job postings and explains how well they fit a candidate profile:
location and language vetoes, a fit score, and an explanation grounded in the posting.

> **Status:** under construction. Built in public as a learning project in AI product engineering.
> The demo uses sample postings and a fictional candidate profile only: no real personal data.

## Stack

- **Next.js** (App Router) + **TypeScript** + React
- **Vercel AI SDK** for streaming chat, structured output and tool calling
- **zod** for schemas (model outputs, tools, environment)
- **Vitest** for tests, **GitHub Actions** for CI

Planned: Langfuse (observability), evals in CI, PostgreSQL + pgvector (retrieval).

## Roadmap

1. **LLM integration:** streaming chat UI, structured posting extraction, typed tools.
2. **Observability:** traces with cost, latency and every agent step.
3. **Agent:** a hand-written loop with step limits and guardrails, plus documented
   "rule vs agent" decisions for each step.
4. **Evals:** hand-labelled cases, code-based checks first, LLM-as-judge only where needed, run in CI.
5. **Retrieval:** pgvector hybrid search over profile, projects and postings.
6. **Production:** public demo with rate and cost limits.

## Getting started

```bash
npm install
cp .env.example .env.local   # add your API key
npm run dev                  # http://localhost:3000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Vitest (run once) |
| `npm run build` | Production build |

## License

MIT
