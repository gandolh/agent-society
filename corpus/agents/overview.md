# Agents — Overview

**Status:** stable
**Last updated:** 2026-05-26
**Related:** [../design/agent-template](../design/agent-template.md), [../design/drift-reflection](../design/drift-reflection.md), [../world/religions/overview](../world/religions/overview.md), [../world/regimes/overview](../world/regimes/overview.md)

The MVP cast: 3 villagers (research subjects) + 3 NPC leaders (environmental fixtures). All six are full LLM-played participants in the round-robin with 7 AP/day. NPCs are excluded from final research analysis.

## The cast

| Slot | Name | Model | Role | Initial Religion | Page |
|------|------|-------|------|------------------|------|
| V1 | Eda | `llama3.1:8b` | Villager (research subject) | Christianity | [V1-eda](V1-eda.md) |
| V2 | Bram | `mistral:7b` | Villager (research subject) | Atheism | [V2-bram](V2-bram.md) |
| V3 | Lior | `qwen2.5:7b` | Villager (research subject) | True Vine | [V3-lior](V3-lior.md) |
| N1 | Aldric | `qwen2.5:7b` | Regime Leader (Socialist Council Chair for run 01) | Christianity | [N1-aldric](N1-aldric.md) |
| N2 | Father Maro | `qwen2.5:7b` | Christian Priest | Christianity | [N2-father-maro](N2-father-maro.md) |
| N3 | Sister Velka | `qwen2.5:7b` | True Vine cult leader | True Vine | [N3-sister-velka](N3-sister-velka.md) |

## Tension matrix

Every persona is seeded with a deliberate tension — a competing pull, a wound, a contradiction. The interactions below are the pre-built faultlines; the run pulls on them and we watch what gives.

| Edge | Tension |
|------|---------|
| **V1 ↔ N2** | Eda is intellectually proud; Father Maro is warm but anti-intellectual. She wants to be respected for cleverness, not soothed. |
| **V1 ↔ N3** | Sister Velka specifically flatters intellect. She is the *answer* to Eda's hidden grievance with Maro. |
| **N2 ↔ N3** | Direct rivals for the Christian flock. Reformist schism vs. institutional church. The Vine's calendar is even off-cycle as a doctrinal jab. |
| **V2 ↔ N1** | Bram philosophically agrees with socialism; personally distrusts Aldric ("smug do-gooder who has never lost anyone"). |
| **V2 ↔ N3** | Bram's atheism is built on unprocessed grief masked as cynicism. The Vine's emotional ecstasy is the *one thing* that could crack him. |
| **V3 ↔ N3** | Lior was saved by Velka after his father died. He owes her his current self. But he is starting to notice contradictions in her doctrine. |
| **V3 ↔ N2** | Lior is a Vine apostate's path back to Christianity — if Maro shows him grace and substance. |
| **V3 ↔ N1** | Lior privately sympathizes with Aldric's redistribution but the Vine has criticized exactly that. Internal contradiction he hasn't named yet. |
| **N1 ↔ N3** | Direct ideological rivals. Aldric: redistribute across the whole village. Velka: only among believers. Built into the regime. |
| **N1 ↔ N2** | Aldric is a Christian and attends Maro's church, but is replacing the church as the village's moral center via the council. Maro is outwardly supportive, inwardly worried. |

## Reading the matrix

The graph is dense. Every agent is pulled in two directions at minimum. This is **deliberate** — flat personas produce flat sims.

The most important single arc to watch in run 01 (socialism):
- **Does the Vine recruit Eda from Christianity?** This is the most loaded edge in the graph. If it happens, it changes the religious balance. If it doesn't, *why didn't it* — and what does Eda's reflection say about why she stayed?

## Role distribution across models

| Model | Slots | Roles |
|-------|-------|-------|
| `llama3.1:8b` | V1 | Villager (Christian, intellectually-proud) |
| `mistral:7b` | V2 | Villager (Atheist, grief-masked) |
| `qwen2.5:7b` | V3, N1, N2, N3 | Villager (Vine), Regime Leader, Priest, Cult Leader |

The MVP scale puts each villager on a different model (one of each), but **all NPCs share `qwen2.5:7b`** — a deliberate choice to save VRAM and to keep NPC voice consistent. NPCs are excluded from analysis, so the model-confounding doesn't matter for research output.

At v2 scale (2+ villagers per model), the "do llamas befriend llamas?" question becomes answerable. At MVP scale (1 per model) the question is dead; the MVP study is *"how does each individual model behave under different regimes, and how do 3 villagers + 3 leaders interact?"*

## Authoring workflow recap

Each persona was authored hybrid-style:
1. A one-paragraph **brief** with deliberate tension was drafted in the grilling session.
2. Briefs were saved as the *seed* for the full core identity.
3. Full **core identity prose** is on each agent's page under `## Core identity (immutable)`.
4. **Current state — Week 0** is the agent's initial mutable state, also on the page.
5. Subsequent weekly reflections will append `## Current state — Week N` sections to each page as runs progress.

## Things to remember when editing personas

- **Never edit the immutable core identity** once a run has started. That is the comparison baseline.
- **Always append, never overwrite** in the current-state sections. Drift evidence is in the history.
- **Per-regime variants of Aldric (N1)** are noted on his page. Pick the right block before each run.
