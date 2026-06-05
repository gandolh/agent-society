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
- [design/ocean-town-build-plan.md](design/ocean-town-build-plan.md) — staged plan for the ocean-town spatial + economy layer (proposed)

## World — what is being simulated

- [world/setting.md](world/setting.md) — the city (v2)
- [world/economy.md](world/economy.md) — gold, materials, food, market, workplace mechanics
- [world/regimes/overview.md](world/regimes/overview.md) — single regime (capitalism) after the v2 pivot
- [world/regimes/capitalism.md](world/regimes/capitalism.md) — the regime in v2
- [world/religions/overview.md](world/religions/overview.md) — Christianity + atheism, after retiring True Vine
- [world/religions/christianity.md](world/religions/christianity.md) — established faith
- [world/religions/atheism.md](world/religions/atheism.md) — stance, no figurehead, two carriers (Bram + Nyssa)

## Agents — the cast

- [agents/overview.md](agents/overview.md) — cast table and tension/collaboration matrix
- [agents/V1-tessa.md](agents/V1-tessa.md) — Tessa, baker, Christian
- [agents/V2-bram.md](agents/V2-bram.md) — Bram, doctor, atheist
- [agents/V3-lior.md](agents/V3-lior.md) — Lior, apprentice carpenter, Christian
- [agents/N1-aldric.md](agents/N1-aldric.md) — Aldric Vance, mill & workshop owner, Christian
- [agents/N2-father-maro.md](agents/N2-father-maro.md) — Father Maro, parish priest, Christian
- [agents/N3-nyssa.md](agents/N3-nyssa.md) — Nyssa Velkin, newspaper editor, atheist

## Experiments — research design

- [experiments/hypotheses.md](experiments/hypotheses.md) — what we're trying to learn (v2 cast)
- [experiments/run-plan.md](experiments/run-plan.md) — planned matrix of runs (capitalism, model/seed sweep)
- [experiments/related-work.md](experiments/related-work.md) — relevant papers + prioritised improvement levers (why run 01 collapsed)
- [experiments/design-questions-2026-06-05.md](experiments/design-questions-2026-06-05.md) — analysis + recommendations: agent count, farming tuning, new NPCs, world dynamics

## Runs — summaries (raw outputs live in repo-root `runs/`)

- [runs/README.md](runs/README.md) — raw vs. summary layers; run-directory layout
- [runs/2026-05-26_socialism_run01-summary.md](runs/2026-05-26_socialism_run01-summary.md) — first v1 run; **failed** via homogeneous "poetic sycophancy" (469 SAY, ~0 economic actions, whole cast starving). Motivated the v2 pivot.
- [runs/2026-06-05_capitalism_spatial_run01-summary.md](runs/2026-06-05_capitalism_spatial_run01-summary.md) — first ocean-town spatial run; **partial success**: no register collapse, personas held + moved between zones, but 0 economic actions and the whole cast starved (small-model survival-blindness). Justifies survival enforcement.
- [runs/2026-06-05_capitalism_spatial_run02-summary.md](runs/2026-06-05_capitalism_spatial_run02-summary.md) — same config + survival enforcement + recency memory + concise personas; **starvation fixed** (14 economic actions, agents fish under the lock and recover) but talk still dominates and the economy is thin.
- [runs/2026-06-05_capitalism_spatial_run03-summary.md](runs/2026-06-05_capitalism_spatial_run03-summary.md) — + grammar-constrained JSON (dynamic enum), temp 0.3, anti-repeat. Output validity solved; but talk only *shifted* (SAY→DM) and Lior starved by **bad planning** (oscillated chasing bread instead of fishing). Exposes planning as the next bottleneck.

## Decisions — ADRs for load-bearing choices

- [decisions/README.md](decisions/README.md) — ADR conventions
- [decisions/001-research-experiment-framing.md](decisions/001-research-experiment-framing.md) — why this is a research experiment, not a demo
- [decisions/002-prose-persona-no-traits.md](decisions/002-prose-persona-no-traits.md) — pure free-text persona, no Big-Five-style numeric traits
- [decisions/003-narrative-only-regime-with-llm-leaders.md](decisions/003-narrative-only-regime-with-llm-leaders.md) — no engine-enforced taxes/tithes; leaders are LLM agents
- [decisions/004-round-robin-one-action.md](decisions/004-round-robin-one-action.md) — round-robin, one action at a time, 7 AP/day
- [decisions/005-manual-observer-workflow.md](decisions/005-manual-observer-workflow.md) — no API integration; user pastes transcripts to Claude
- [decisions/006-bifurcated-persona-with-reflection.md](decisions/006-bifurcated-persona-with-reflection.md) — immutable core + mutable current-state via weekly reflection
- [decisions/007-mvp-cast-size.md](decisions/007-mvp-cast-size.md) — 3 villagers + 3 NPCs for initial setup
- [decisions/008-ollama-cloud-and-zod-boundary.md](decisions/008-ollama-cloud-and-zod-boundary.md) — Ollama Cloud + .env secrets + Zod at boundaries
- [decisions/009-city-capitalism-christian-pivot.md](decisions/009-city-capitalism-christian-pivot.md) — v2 pivot: city + capitalism + (Christian/atheist) cast; retire TrueVine + socialism + monarchy
- [decisions/010-run01-homogenisation-mitigations.md](decisions/010-run01-homogenisation-mitigations.md) — narrow survival enforcement, prose-only persona anchors, clean-experiment sequencing
- [decisions/011-death-from-hunger.md](decisions/011-death-from-hunger.md) — agents die after `hungerDeathDays` hungry days (default 7)
- [decisions/012-ocean-town-spatial-capabilities-economy.md](decisions/012-ocean-town-spatial-capabilities-economy.md) — **accepted/built** (behind `config.spatial`): ocean town, grid + zones, fishing/farming, core economy (shop+wall), individual + group wealth
- [decisions/013-world-dynamics-alms-conversion-weather.md](decisions/013-world-dynamics-alms-conversion-weather.md) — **accepted/built**: destination-aware survival lock, religious alms (self-sustaining), conversion fatigue, seeded weather
- [decisions/014-diet-variety-and-fishmonger.md](decisions/014-diet-variety-and-fishmonger.md) — **accepted/built**: typed food + diet-variety fulfillment (breaks fishing dominance), food tuning, fishmonger price gradient
