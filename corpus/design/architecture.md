# Design — Architecture

**Status:** stable
**Last updated:** 2026-05-26
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
                       │  (localhost) │
                       └──────────────┘
```

### Run Driver (`runDriver.ts`)
- Reads run config (`runs/<date>_<regime>_<runNN>/config.json`).
- Initializes world state, agents, logger.
- Loops: for each day until day count reached, runs the day cycle.
- Triggers weekly reflection at end of each 7-day block (see [drift-reflection](drift-reflection.md)).
- Writes final summary file.

### World State (`world.ts`)
- Mutable in-memory state of the village: each agent's resources, plots, hunger, current religion, current-state-block.
- Market prices.
- Day counter, holy-day calendar.
- Action history (event queue) for the current day.
- Persisted to disk at end of each day for crash recovery.

### Agents (`agent.ts`)
- One `Agent` instance per slot (V1, V2, V3, N1, N2, N3).
- Owns its identity (model, role, core identity prose, current state prose).
- On each turn: builds its system prompt from world state (see [perception-memory](perception-memory.md)), calls Ollama, parses the returned action JSON, returns it to the engine.
- On reflection ticks: builds a reflection prompt and updates its current-state block.

### Ollama HTTP Client (`ollama.ts`)
- Thin wrapper around Ollama's `/api/generate` or `/api/chat` endpoint at `http://localhost:11434`.
- Manages model loading hints (keep models warm to avoid reload latency).
- Retries with exponential backoff on connection errors.
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

## Data flow per turn

```
1. Engine selects next agent in round-robin order (skipping agents with 0 AP).
2. Engine builds perception payload for that agent:
   - their own state (resources, hunger, AP)
   - their core identity + current-state (only this agent's)
   - the village roster (public info only)
   - their recent memory (last 14 days of events involving them, truncated)
   - unread messages (DMs received since their last turn)
   - public events from today's earlier rounds
   - the list of actions available to them at this AP budget
3. Agent.takeTurn(perception) → calls Ollama → returns ActionResponse JSON
   { action: "...", args: {...}, reasoning: "..." }
4. Engine validates, mutates world state, deducts AP cost, broadcasts side-effects.
5. Logger writes the event to events.jsonl AND the prose form to transcript.md.
6. Loop back to step 1 until everyone is at 0 AP or has REST-ed.
7. End-of-day phase: hunger check, crops mature, log day-end state.
8. If end of week: trigger reflection for each agent.
9. Next day.
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
│   ├── actions/
│   │   ├── workPlot.ts
│   │   ├── harvest.ts
│   │   ├── goToMarket.ts
│   │   ├── give.ts
│   │   ├── say.ts
│   │   ├── dm.ts
│   │   ├── pray.ts
│   │   ├── tithe.ts
│   │   ├── convert.ts
│   │   └── rest.ts
│   ├── prompts/            # prompt templates (system, reflection)
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
