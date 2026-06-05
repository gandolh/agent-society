# Agent Society

A TypeScript + Ollama framework for running small town simulations populated by LLM agents, observing emergent social behavior, belief drift, compliance, and cooperation under capitalism.

The full design lives in [`corpus/`](corpus/). Start with [corpus/CLAUDE.md](corpus/CLAUDE.md) and [corpus/index.md](corpus/index.md).

## What this is

A research experiment. 6 LLM agents (3 citizens + 3 NPC fixtures) live in a small working city for ~31 simulated days under capitalism. They work their trade, trade, gossip, pray, tithe, and convert between Christianity and atheism. Once a week each agent self-reflects on what has changed for them. The framework writes every action and conversation to a prose transcript. You paste the transcript into Claude/GPT chat to synthesize what happened.

> **v1 → v2 pivot.** This project began as a village under a three-regime sweep (socialism / monarchy / capitalism) with a three-faith landscape (Christianity / a True Vine reform cult / atheism) and a cast led by "Eda". After run 01 we pivoted to a single city under capitalism with a Christian-majority / atheist-minority population and a new six-job cast. See [corpus/decisions/009-city-capitalism-christian-pivot.md](corpus/decisions/009-city-capitalism-christian-pivot.md). The codebase reflects v2; the old run is preserved as raw data.

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

Model assignment is per-slot via each agent's `model` field in `config.json` (falling back to `defaultModel`). Run 01 used a single small model (`ministral-3:3b-cloud`) across the whole cast. A research-grade run assigns **distinct model families** across the three citizen slots (V1/V2/V3) so the research subjects' behaviour can be attributed to the model, and shares one cheap model across the three NPC fixtures (N1/N2/N3).

Free-tier model availability on Ollama Cloud is not reliably documented by third parties — empirically probe candidates against your own key before assigning them. See [scripts/probe-cloud-models.ts](scripts/probe-cloud-models.ts) and [corpus/decisions/008-ollama-cloud-and-zod-boundary.md](corpus/decisions/008-ollama-cloud-and-zod-boundary.md).

> **Caveat from run 01.** A single 3B model across the whole cast collapsed into homogeneous "poetic sycophancy" (every agent producing near-identical lyrical speech, almost no economic action). See [corpus/runs/2026-05-26_socialism_run01-summary.md](corpus/runs/2026-05-26_socialism_run01-summary.md). Use larger and/or more diverse models, and read that summary before configuring a real run.

### 3. Smoke test

A 1-day dry run to verify the API key works, prompts render, and the logger writes files.

```sh
npm run smoke
```

### 4. Full run

A ~31-day capitalism run. Wall-clock depends on cloud latency — typically ~1–2 hours on Ollama Cloud.

```sh
npm run sim -- runs/<dir>/config.json
```

Output appears in your run directory:
- `transcript.md` — the master prose narrative. **This is what you paste to Claude.**
- `events.jsonl` — structured event log.
- `config.json` — exact config used (for reproducibility).
- `agents/<slot>-<name>.md` — per-agent files (generated at end of run).

### 5. Analyze offline

Paste `transcript.md` into Claude. Use the question templates in [corpus/design/observer-workflow.md](corpus/design/observer-workflow.md).

Save the synthesis to `runs/<runDir>/summary_final.md`, then write a corpus-side summary under `corpus/runs/` per [corpus/CLAUDE.md](corpus/CLAUDE.md).

## Project layout

```
agent-society/
├── corpus/                    # design knowledge base (LLM-maintained wiki)
│   ├── CLAUDE.md              # schema — read me first
│   ├── index.md               # catalog of all pages
│   ├── log.md                 # changelog
│   ├── design/                # framework design pages
│   ├── world/                 # world rules (setting, economy, capitalism, religions)
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
    └── <date>_<regime>_<runNN>/
        ├── config.json        # gitignored — exact config + secrets stay local
        └── (transcript.md, events.jsonl, agents/ after running)
```

> The only committed run is `runs/2026-05-26_socialism_run01/` (its `transcript.md`, preserved as raw v1 data). Per-run `config.json` files are gitignored.

## Commands

| Command | What it does |
|--------|--------------|
| `npm run smoke -- runs/<dir>/config.json` | 1-day dry run on a given config. |
| `npm run sim -- runs/<dir>/config.json` | Full run on a given config. |
| `npm run sim:run01` | Convenience alias for the run01 config. |
| `npm run typecheck` | TypeScript check, no emit. |
| `npm run build` | Compile to `dist/`. |

## Schema validation

All boundary I/O is validated with [Zod](https://zod.dev):

- **Run config** (`runs/.../config.json`) is parsed through `RunConfigSchema` at boot. A malformed config exits with a typed error before any LLM call happens.
- **Action responses** from each LLM call are parsed through `ActionRequestSchema`. Invalid responses trigger a retry (up to 3 attempts per turn, then forced `REST`).
- Schemas live in [src/schemas.ts](src/schemas.ts) and are the source of truth for these types (the engine-internal mutable state types remain in [src/types.ts](src/types.ts)).

## Design highlights

- **Bifurcated personas:** every agent has an immutable core identity + a mutable current-state. The current-state is rewritten weekly by the agent reflecting on what changed. Drift = the diff over time. See [corpus/design/drift-reflection.md](corpus/design/drift-reflection.md).
- **Narrative-only regime/religion:** no engine-enforced wages, prices, taxes, or tithes. Leaders are full LLM agents with role-flavored personas. See [corpus/decisions/003-narrative-only-regime-with-llm-leaders.md](corpus/decisions/003-narrative-only-regime-with-llm-leaders.md).
- **Round-robin one-action-at-a-time:** 7 AP/day per agent. Variable AP cost. Skip allowed. Within a round, all agents decide in parallel from the same snapshot. See [corpus/design/turn-mechanics.md](corpus/design/turn-mechanics.md).
- **Manual observer workflow:** no automated API integration. The framework's only job is to write great transcripts. See [corpus/decisions/005-manual-observer-workflow.md](corpus/decisions/005-manual-observer-workflow.md).

## What's not in v1/v2

- No spatial layer (no map, no territory).
- No vector store / RAG. Memory is a truncated 7-day event list.
- No engine enforcement of wages, prices, taxes, tithes, or punishments.
- No automated observer model.
- No `STEAL` action (small models abuse it).
- **Event-triggered reflection is designed but not yet implemented** — reflection is weekly only. See [corpus/design/drift-reflection.md](corpus/design/drift-reflection.md).

All parked. See ADRs in [corpus/decisions/](corpus/decisions/) for the reasoning.

## Status

**MVP scaffolding complete. Run 01 executed (31 days, single 3B model across the cast).** Run 01 surfaced a homogenisation / "poetic sycophancy" failure — see [corpus/runs/2026-05-26_socialism_run01-summary.md](corpus/runs/2026-05-26_socialism_run01-summary.md). Next step is a v2 capitalism run with diverse, larger models.
