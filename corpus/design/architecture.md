# Design — Architecture

**Status:** stable
**Last updated:** 2026-05-28
**Related:** [overview](overview.md), [turn-mechanics](turn-mechanics.md), [log-format](log-format.md), [action-set](action-set.md), [perception-memory](perception-memory.md)

High-level layout of the TypeScript framework. Intentionally minimal — the framework is a glorified turn-based game loop with an LLM agent on each side.

## Components

```
┌─────────────────────────────────────────────────────────────────┐
│                          Run Driver                              │
│  Loads config (regime, religions, seed, cast) → runs N days     │
└──────────────────────────────┬──────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
  ┌──────────┐          ┌────────────┐         ┌────────────┐
  │  World   │          │   Agents   │         │  Logger    │
  │  State   │◄────────►│ (LLM calls)│────────►│ (writes    │
  │          │          │            │         │  files)    │
  └──────────┘          └─────┬──────┘         └────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │ Ollama HTTP  │
                       │ cloud /local │
                       └──────────────┘
```

### Run Driver (`runDriver.ts`)
- Reads run config (`runs/<date>_<regime>_<runNN>/config.json`).
- Initializes world state, agents, logger.
- Loops: for each day until day count reached, runs the day cycle.
- Triggers weekly reflection at end of each 7-day block (see [drift-reflection](drift-reflection.md)).
- Writes final summary file.

### World State (`world.ts`)
- Mutable in-memory state of the city: each agent's resources, plots (workplaces), hunger, current religion, current-state-block.
- Market prices.
- Day counter, holy-day calendar.
- Action history (event queue) for the current day.

> The `transcript.md` / `events.jsonl` are flushed per round/day, but the in-memory `WorldState` is **not** checkpointed to disk — there is no mid-run crash recovery today. A crash means restarting the run from day 1. (Planned, not built.)

### Agents (`agent.ts`)
- One `Agent` instance per slot (V1, V2, V3, N1, N2, N3).
- Owns its identity (model, role, core identity prose, current state prose).
- On each turn: builds its system prompt from world state (see [perception-memory](perception-memory.md)), calls Ollama, parses the returned action JSON, returns it to the engine.
- On reflection ticks: builds a reflection prompt and updates its current-state block.

### Ollama HTTP Client (`ollama.ts`)
- Thin wrapper around the Ollama chat endpoint, against **Ollama Cloud (`https://ollama.com`) by default** or a local `http://localhost:11434` — set by `ollamaBaseUrl` in config. API key (cloud) comes from `OLLAMA_API_KEY` in `.env`.
- Fails fast on 4xx (e.g. a 403 "requires subscription" for a walled model) via `OllamaClientError`, rather than retrying. See [../decisions/008-ollama-cloud-and-zod-boundary.md](../decisions/008-ollama-cloud-and-zod-boundary.md).
- Records token counts and latency per call for logging.

### Logger (`logger.ts`)
- Writes three artifacts per run, as described in [log-format](log-format.md):
  - `transcript.md` — chronological prose, what the user pastes to Claude.
  - `events.jsonl` — one JSON per event line, machine-readable.
  - `agents/<slot>-<name>.md` — generated at end of run from `events.jsonl`.
- Logger is dumb: just append on each event call. No in-memory buffering beyond the current day.

### Engine (`engine.ts`)
- Validates actions (does the agent have AP? gold? a target?).
- Mutates world state (transfer gold, plant crop, broadcast SAY to all, deliver DM to recipient).
- Computes derived state (end-of-day hunger check, crop maturation).
- Determines round-robin order each day from the seeded RNG.

## Data flow per round (within a day)

```
1. Engine snapshots today's public events, then for ALL active agents IN PARALLEL:
   builds each one's perception payload:
   - their own state (resources, hunger, AP)
   - their core identity + current-state (only this agent's)
   - the city roster (public info only, self excluded)
   - their recent memory (last 7 days of events involving them, truncated)
   - unread DMs (received since their last turn)
   - public events from today's EARLIER rounds (not this round — parallel decisions)
   - the actions they can currently afford
2. Each agent → calls Ollama → returns ActionRequest JSON
   { action, args, reasoning } (retry up to 3x on parse/validation fail, else forced REST)
3. Engine applies the decided actions SEQUENTIALLY in the day's seeded order:
   validate against the handler, mutate world state, deduct AP, broadcast side-effects.
4. Logger writes each event to events.jsonl AND the prose form to transcript.md.
5. Next round until everyone is at 0 AP or has REST-ed.
6. End-of-day phase: eat 1 food / hunger tick, crops mature, log day-end state.
7. If world.day % 7 == 0: weekly reflection for each agent (parallel).
8. Next day.
```

## Determinism

- Seeded RNG (e.g. `seedrandom`) controls:
  - Round-robin order each day
  - Any random world events (none in v1, but the hook exists)
- Ollama calls use `temperature: 0` and a fixed `seed` parameter per call.
- Ollama itself is not perfectly deterministic even at temp=0 due to GPU non-determinism, but it is close enough for our purposes.

## File layout (project)

```
agent-society/
├── corpus/                 # this directory — design knowledge base
├── src/
│   ├── runDriver.ts
│   ├── engine.ts
│   ├── world.ts
│   ├── agent.ts
│   ├── ollama.ts
│   ├── logger.ts
│   ├── rng.ts
│   ├── schemas.ts          # Zod schemas — source of truth for boundary types
│   ├── actions/
│   │   └── index.ts        # all 10 action handlers in one module
│   ├── prompts/
│   │   ├── system.ts       # per-turn system prompt builder
│   │   └── reflection.ts   # weekly reflection prompt builder
│   └── types.ts
├── runs/                   # raw simulation outputs (raw sources)
├── package.json
└── tsconfig.json
```

## What is *not* in the architecture

- **No vector store / RAG.** Memory is truncated event lists, not embeddings. See [perception-memory](perception-memory.md).
- **No web UI.** CLI run, file outputs. Logs are the deliverable.
- **No observer API integration.** Manual paste workflow. See [observer-workflow](observer-workflow.md).
- **No database.** Plain markdown + JSONL. Git is the version control.
- **No Openfront-style spatial map.** Parked as future work.
