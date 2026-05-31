# Contributing to Aria

Thanks for your interest! Aria is built to be **extended** — the architecture makes adding
capabilities a small, well-defined change. See [ARCHITECTURE.md](ARCHITECTURE.md) for the big
picture.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests (Vitest)
npm run lint     # ESLint
npm run build    # production build
```

CI runs lint + test + build on every push and PR.

## Adding an app

1. Add a component in `src/components/apps/YourApp.tsx`.
2. Register metadata in `src/lib/apps.ts` (`AppId` union + `APPS` entry — controls window size,
   dock icon, colour).
3. Add the case in `src/components/apps/registry.tsx`.

That's it — the window manager, dock, and Spotlight pick it up automatically.

## Adding an agent

Add one entry to the `AGENTS` map in `src/lib/agents.ts` (persona, colour, icon, system prompt,
specialties). The orchestrator, roster, dashboard, and graph all read from it.

## Adding a tool

1. Implement the `Tool` interface from `src/lib/runtime/types.ts`.
2. Register it in `src/lib/runtime/tools.ts`.
3. Wire it into the orchestrator where an agent should call it.

Tools should do **real** work and degrade gracefully (return a clear `ToolResult` on failure) so
they behave well under every brain — simulated, BYO-key, or local.

## Conventions

- TypeScript everywhere; keep the strict types.
- Match the surrounding code style; run `npm run lint` before pushing.
- Add a unit test for any pure logic you add (`*.test.ts`).
- Keep user-facing copy free of internal/engine names.

## Commit / PR

- Small, focused PRs with a clear description.
- Make sure `npm test`, `npm run lint`, and `npm run build` all pass.
