# a11y-auditor

An AI agent that audits web components for accessibility. Paste a component or an HTML snippet:
**axe-core finds the issues** (deterministic rules), and **the agent explains them, prioritises them
by user impact and proposes a fix**, citing the relevant WCAG success criterion.

> **Status:** under construction. Built in public as a learning project in AI product engineering.

## Why a rule *and* an agent

Detection is a solved problem: axe-core's rules are fast, deterministic and testable, so the agent
never guesses whether an issue exists. What rules can't do well is explain an issue to the person who
has to fix it, rank issues by how much they hurt real users, or write the corrected markup for *this*
component. That is the agent's job. Every step of the pipeline documents which side of that line it is on.

## Stack

- **Next.js** (App Router) + **TypeScript** + React
- **Vercel AI SDK** for streaming chat, structured output and tool calling
- **zod** for schemas (model outputs, tools, environment)
- **axe-core** for rule-based detection (planned)
- **Vitest** for tests, **GitHub Actions** for CI

Planned: Langfuse (observability), evals in CI, PostgreSQL + pgvector (retrieval over WCAG and ARIA guidance).

## Roadmap

1. **LLM integration:** streaming chat UI, structured findings (zod), typed tools (`runAxe`, `explainIssue`).
2. **Observability:** traces with cost, latency and every agent step.
3. **Agent:** a hand-written loop with step limits and guardrails; written "rule vs agent" decisions.
4. **Evals:** a labelled set of components with known issues; code-based checks first, LLM-as-judge
   only for explanation quality; run in CI.
5. **Retrieval:** pgvector hybrid search over WCAG success criteria and ARIA Authoring Practices.
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
