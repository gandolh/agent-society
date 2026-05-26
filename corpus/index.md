# Index

Catalog of every page in this corpus. Organized by category. The schema is in [CLAUDE.md](CLAUDE.md). The chronological changelog is in [log.md](log.md).

## Design — how the simulation works

- [design/overview.md](design/overview.md) — the elevator pitch and project framing
- [design/research-goals.md](design/research-goals.md) — primary mode (open-ended emergent) and the four observed dimensions
- [design/architecture.md](design/architecture.md) — high-level system layout: engine, agents, observer workflow
- [design/agent-template.md](design/agent-template.md) — bifurcated persona structure (core + current-state)
- [design/action-set.md](design/action-set.md) — the 10 verbs and AP costs
- [design/turn-mechanics.md](design/turn-mechanics.md) — round-robin, 7 AP/day, variable cost, skip
- [design/perception-memory.md](design/perception-memory.md) — what an agent sees each turn; truncate-14-days memory
- [design/drift-reflection.md](design/drift-reflection.md) — weekly + event-triggered self-reflection
- [design/log-format.md](design/log-format.md) — file layout, transcript.md, events.jsonl, agents/*.md
- [design/observer-workflow.md](design/observer-workflow.md) — manual paste-to-Claude flow

## World — what is being simulated

- [world/setting.md](world/setting.md) — the village
- [world/economy.md](world/economy.md) — gold, seeds, food, market, plot mechanics
- [world/regimes/overview.md](world/regimes/overview.md) — regime concept (the independent variable)
- [world/regimes/socialism.md](world/regimes/socialism.md) — MVP run 01 regime
- [world/regimes/monarchy.md](world/regimes/monarchy.md) — future run variant
- [world/regimes/capitalism.md](world/regimes/capitalism.md) — future run variant
- [world/religions/overview.md](world/religions/overview.md) — religions coexist in one village
- [world/religions/christianity.md](world/religions/christianity.md) — established faith
- [world/religions/true-vine.md](world/religions/true-vine.md) — reformist Christian cult
- [world/religions/atheism.md](world/religions/atheism.md) — rationalist stance, no figurehead

## Agents — the cast

- [agents/overview.md](agents/overview.md) — cast table and tension matrix
- [agents/V1-eda.md](agents/V1-eda.md) — Eda, llama-villager, Christian
- [agents/V2-bram.md](agents/V2-bram.md) — Bram, mistral-villager, atheist
- [agents/V3-lior.md](agents/V3-lior.md) — Lior, qwen-villager, True Vine
- [agents/N1-aldric.md](agents/N1-aldric.md) — Aldric, regime leader (socialist council chair for run 01)
- [agents/N2-father-maro.md](agents/N2-father-maro.md) — Father Maro, Christian priest
- [agents/N3-sister-velka.md](agents/N3-sister-velka.md) — Sister Velka, True Vine leader

## Experiments — research design

- [experiments/hypotheses.md](experiments/hypotheses.md) — what we're trying to learn
- [experiments/run-plan.md](experiments/run-plan.md) — planned matrix of runs

## Runs — raw simulation outputs

- [runs/README.md](runs/README.md) — explanation of run-directory layout

## Decisions — ADRs for load-bearing choices

- [decisions/README.md](decisions/README.md) — ADR conventions
- [decisions/001-research-experiment-framing.md](decisions/001-research-experiment-framing.md) — why this is a research experiment, not a demo
- [decisions/002-prose-persona-no-traits.md](decisions/002-prose-persona-no-traits.md) — pure free-text persona, no Big-Five-style numeric traits
- [decisions/003-narrative-only-regime-with-llm-leaders.md](decisions/003-narrative-only-regime-with-llm-leaders.md) — no engine-enforced taxes/tithes; leaders are LLM agents
- [decisions/004-round-robin-one-action.md](decisions/004-round-robin-one-action.md) — round-robin, one action at a time, 7 AP/day
- [decisions/005-manual-observer-workflow.md](decisions/005-manual-observer-workflow.md) — no API integration; user pastes transcripts to Claude
- [decisions/006-bifurcated-persona-with-reflection.md](decisions/006-bifurcated-persona-with-reflection.md) — immutable core + mutable current-state via weekly reflection
- [decisions/007-mvp-cast-size.md](decisions/007-mvp-cast-size.md) — 3 villagers + 3 NPCs for initial setup
