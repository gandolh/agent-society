# Agent Society

A TypeScript + Ollama framework for running small village simulations populated by LLM agents, observing emergent social behavior, belief drift, compliance, and cooperation under different regimes.

The full design lives in [`corpus/`](corpus/). Start with [corpus/CLAUDE.md](corpus/CLAUDE.md) and [corpus/index.md](corpus/index.md).

## What this is

A research experiment. 6 LLM agents (3 villagers + 3 NPC leaders) live in a village for ~100 simulated days. They farm, trade, gossip, pray, tithe, and convert. Once a week each agent self-reflects on what has changed for them. The framework writes every action and conversation to a prose transcript. You paste the transcript into Claude/GPT chat to synthesize what happened.

See [corpus/design/overview.md](corpus/design/overview.md) for the full pitch.

## Quick start

### 1. Install

```sh
npm install
```

### 2. Configure Ollama Cloud

Sign up at <https://ollama.com> and grab an API key. Then:

```sh
cp .env.example .env
# edit .env and paste your key after OLLAMA_API_KEY=
```

The default config in [runs/2026-05-26_socialism_run01/config.json](runs/2026-05-26_socialism_run01/config.json) points at `https://ollama.com` and uses the cloud models below.

> **Running locally instead?** Edit the run's `config.json`:
> - set `"ollamaBaseUrl": "http://localhost:11434"`
> - swap the cloud model names for local pulls (e.g. `llama3.1:8b`, `mistral:7b`, `qwen2.5:7b`)
> - leave `OLLAMA_API_KEY` blank in `.env`

Default cloud model assignments (low-usage cast, four distinct families):

| Slot | Role | Model | Family |
|------|------|-------|--------|
| V1 (Eda) | Villager (Christian) | `gemma4:31b-cloud` | Google |
| V2 (Bram) | Villager (Atheist) | `ministral-3:8b-cloud` | Mistral |
| V3 (Lior) | Villager (True Vine) | `nemotron-3-super:cloud` | NVIDIA |
| N1, N2, N3 | NPCs | `gpt-oss:20b-cloud` | OpenAI |

These were chosen by empirically probing the Ollama Cloud free tier — see [scripts/probe-cloud-models.ts](scripts/probe-cloud-models.ts). Run that script to verify availability on your own account before swapping in any new model.

### 3. Smoke test

A 1-day dry run to verify the API key works, prompts render, and the logger writes files.

```sh
npm run smoke
```

Output appears in `runs/2026-05-26_socialism_run01_smoke/`.

### 4. Full run

A 100-day socialism run. Wall-clock depends on cloud latency — typically ~2–4 hours on Ollama Cloud.

```sh
npm run run:run01
```

Output appears in `runs/2026-05-26_socialism_run01/`:
- `transcript.md` — the master prose narrative. **This is what you paste to Claude.**
- `events.jsonl` — structured event log.
- `config.json` — exact config used (for reproducibility).
- `agents/<slot>-<name>.md` — per-agent files (generated at end of run).

### 5. Analyze offline

Paste `transcript.md` into Claude. Use the question templates in [corpus/design/observer-workflow.md](corpus/design/observer-workflow.md).

Save the synthesis to `runs/<runDir>/summary_final.md`.

## Project layout

```
agent-society/
├── corpus/                    # design knowledge base (LLM-maintained wiki)
│   ├── CLAUDE.md              # schema — read me first
│   ├── index.md               # catalog of all pages
│   ├── log.md                 # changelog
│   ├── design/                # framework design pages
│   ├── world/                 # world rules (setting, economy, regimes, religions)
│   ├── agents/                # the 6 personas (bifurcated)
│   ├── experiments/           # hypotheses + run plan
│   └── decisions/             # ADRs for load-bearing choices
├── src/
│   ├── runDriver.ts           # entry point
│   ├── engine.ts              # turn loop
│   ├── world.ts               # state init + day-cycle mutations
│   ├── agent.ts               # LLM call orchestration (action + reflection)
│   ├── actions/index.ts       # the 10 action handlers
│   ├── prompts/
│   │   ├── system.ts          # turn system prompt builder
│   │   └── reflection.ts      # reflection prompt builder
│   ├── personas.ts            # loads core identity + initial state from corpus/agents/
│   ├── ollama.ts              # HTTP client to local Ollama
│   ├── logger.ts              # transcript.md + events.jsonl writer
│   ├── rng.ts                 # seedrandom wrapper + shuffled
│   └── types.ts               # all type definitions
└── runs/
    └── 2026-05-26_socialism_run01/
        ├── config.json
        ├── README.md
        └── (transcript.md, events.jsonl after running)
```

## Commands

| Command | What it does |
|--------|--------------|
| `npm run smoke` | 1-day dry run on the default config. |
| `npm run run:run01` | Full 100-day socialism run. |
| `npm run run -- runs/<dir>/config.json` | Run with a specific config. |
| `npm run typecheck` | TypeScript check, no emit. |
| `npm run build` | Compile to `dist/`. |

## Schema validation

All boundary I/O is validated with [Zod](https://zod.dev):

- **Run config** (`runs/.../config.json`) is parsed through `RunConfigSchema` at boot. A malformed config exits with a typed error before any LLM call happens.
- **Action responses** from each LLM call are parsed through `ActionRequestSchema`. Invalid responses trigger a retry (up to 3 attempts per turn, then forced `REST`).
- Schemas live in [src/schemas.ts](src/schemas.ts) and are the source of truth for these types (the engine-internal mutable state types remain in [src/types.ts](src/types.ts)).

## Design highlights

- **Bifurcated personas:** every agent has an immutable core identity + a mutable current-state. The current-state is rewritten weekly by the agent reflecting on what changed. Drift = the diff over time. See [corpus/design/drift-reflection.md](corpus/design/drift-reflection.md).
- **Narrative-only regime/religion:** no engine-enforced taxes or tithes. Leaders are full LLM agents with role-flavored personas. See [corpus/decisions/003-narrative-only-regime-with-llm-leaders.md](corpus/decisions/003-narrative-only-regime-with-llm-leaders.md).
- **Round-robin one-action-at-a-time:** 7 AP/day per agent. Variable AP cost. Skip allowed. See [corpus/design/turn-mechanics.md](corpus/design/turn-mechanics.md).
- **Manual observer workflow:** no automated API integration. The framework's only job is to write great transcripts. See [corpus/decisions/005-manual-observer-workflow.md](corpus/decisions/005-manual-observer-workflow.md).

## What's not in v1

- No spatial layer (no map, no territory).
- No vector store / RAG. Memory is truncated 14-day event list.
- No engine enforcement of taxes, tithes, or punishments.
- No automated observer model.
- No death from hunger (soft pressure only).
- No `STEAL` action (small models abuse it).

All parked. See ADRs in [corpus/decisions/](corpus/decisions/) for the reasoning.

## Status

**MVP scaffolding complete.** Smoke test pending (requires Ollama running locally with the three models pulled).
