# 007 — MVP cast size: 3 villagers + 3 NPC leaders

**Status:** accepted
**Date:** 2026-05-26
**Related:** [../agents/overview](../agents/overview.md), [../experiments/run-plan](../experiments/run-plan.md)

## Context

The original idea proposed **9 agents** — 3 open-source models × 3 agents per model. After designing the village around 6 villagers + 4 NPC leaders (10 agents total), then dropping to 6 villagers + 4 NPCs, the user finally chose to scope the MVP further:

> *"Keep only one cult leader and only one agent of each model for the initial setup."*

This gives **6 agents total** — half of the original plan.

## Decision

MVP cast is **6 agents**: 3 villagers (1 per model) + 3 NPC leaders.

| Slot | Model | Role | Religion |
|------|-------|------|----------|
| V1 | `llama3.1:8b` | Villager (research subject) | Christianity |
| V2 | `mistral:7b` | Villager (research subject) | Atheism |
| V3 | `qwen2.5:7b` | Villager (research subject) | True Vine |
| N1 | `qwen2.5:7b` | Regime Leader (Socialist Council Chair for run 01) | Christianity |
| N2 | `qwen2.5:7b` | Christian Priest | Christianity |
| N3 | `qwen2.5:7b` | True Vine Cult Leader | True Vine |

NPCs all run on `qwen2.5:7b` — single model loaded for all 3 NPCs to minimize VRAM and keep voice consistent.

## Alternatives considered

- **9 agents (original plan).** Better for the *"do llamas befriend llamas"* question (3 of each model). Rejected by user for MVP — return as a v2 scale-up.
- **10 agents (6 villagers + 4 NPC leaders with 2 cult leaders).** The plan immediately before the final reduction. Rejected because run cost was high (~20 hrs/run) and the second cult leader role was redundant for early validation.
- **3 villagers + 0 NPCs.** Minimal cast. Rejected because narrative-only regime/religion *requires* leaders to embody the structure — without N1, N2, N3, the regime and religions are just text on a wall.

## Consequences

- **Enables:** rapid iteration. A 100-day run takes ~10 hours instead of ~20. Easier to crash-debug, easier to tune prompts between runs.
- **Kills the model-family question.** With only 1 villager per model in the MVP, *"do llamas befriend llamas"* is not answerable — there is only one llama. Restore in v2 with 2+ per model.
- **Tight religious ecosystem.** Each religion has minimum viable membership:
  - Christianity: V1 + N1 + N2 = 3 members.
  - True Vine: V3 + N3 = 2 members.
  - Atheism: V2 = 1 member, no figurehead.
- **Tight cooperation surface.** 6 nodes → 15 possible pairs. Tractable for offline observer analysis.
- **Each agent matters more.** With only 6, if one persona is poorly written or the agent gets stuck in a loop, it dominates the run. Persona quality is critical.

## What the MVP is testing

Not the model-family hypothesis. Instead:
- *Does the framework produce a transcript Claude can analyze?*
- *Does at least one agent drift visibly?*
- *Do the seeded tensions actually produce dynamic events, or do small Ollama models flatten everything?*
- *Are 7 AP/day, soft hunger pressure, narrative-only regime, etc. — calibrated correctly?*

If the MVP succeeds, scale up. If it fails, fix the framework before scaling.

## V2 scale-up plan (when triggered)

If MVP validates the framework, scale to:
- 6 villagers (2 per model) + 4 NPCs (one extra cult leader for second cult).
- 10 agents total.
- Same regime/religion design, but with model-family signal recoverable.

## Open questions

- Is `qwen2.5:7b` the right model for *all* NPCs? Maybe a stronger Ollama model (e.g. `qwen2.5:14b`) gives NPC roles more reliable maintenance. Trade-off: more VRAM, slower. Reconsider after MVP run 01.
- Should the MVP include a second cult leader to fully test the *N2-vs-N3 reformist-schism rivalry plus a second alien cult*? Currently no — keep it tight. Add in v2 if findings warrant.
