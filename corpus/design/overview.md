# Design — Overview

**Status:** stable
**Last updated:** 2026-05-26
**Related:** [research-goals](research-goals.md), [architecture](architecture.md), [../agents/overview.md](../agents/overview.md), [../world/setting.md](../world/setting.md)

A TypeScript + Ollama framework for running small village simulations populated by LLM agents. Each agent has a prose persona with built-in tensions. The village runs day by day under a chosen regime (socialism / monarchy / capitalism), with multiple religions (Christianity, the True Vine reformist cult, atheism) coexisting in one community. We log every action and every word into prose transcripts and paste them into a stronger model (Claude/GPT) offline to synthesize what happened — friendships, enemies, conversions, compliance, conspiracies.

## The pitch in one paragraph

Run a tiny village of 6 LLM agents (3 villagers as research subjects, 3 NPC leaders as fixtures) for ~100 simulated days. Every agent has a hidden prose persona seeded with deliberate tension. Every day they take turns in a round-robin, spending action points on farming, trading, gossiping, praying, tithing, or converting religions. Once a week, each agent self-reflects and updates their "current state" — letting beliefs and desires drift visibly over time. The framework writes everything to a transcript file. You read the transcript or paste it into Claude offline to see what emerged. Vary the regime, rerun, compare.

## What this is not

- **Not a game.** No win condition, no player.
- **Not a demo.** No polished UI. Logs are the output.
- **Not a framework for others.** No public API stability commitment.
- **Not a benchmark.** Open-ended emergent behavior is intentionally hard to score numerically.

## What this is

- A **personal research experiment** — see [research-goals](research-goals.md).
- An exercise in **observable belief drift** under environmental pressure — see [drift-reflection](drift-reflection.md).
- A **transcript-first** system — see [log-format](log-format.md) and [observer-workflow](observer-workflow.md).

## Key constraints

- **Reproducibility matters.** Same seed + same models + temperature=0 reproduces a run (modulo Ollama's slight nondeterminism). See [turn-mechanics](turn-mechanics.md).
- **Open-source models for villagers** (`llama3.1:8b`, `mistral:7b`, `qwen2.5:7b`) — one of each in the MVP cast. NPCs run on `qwen2.5:7b`.
- **Local hardware budget.** ~25–30 LLM calls per simulated day. ~10 hours for a 100-day run. Plan to run unattended.
- **No API integration in v1.** The observer model is a human pasting transcripts into Claude/GPT chat.

## The full design tree

| Layer | Pages |
|-------|-------|
| Why & what | [overview](overview.md), [research-goals](research-goals.md) |
| Architecture | [architecture](architecture.md), [log-format](log-format.md), [observer-workflow](observer-workflow.md) |
| Agents | [agent-template](agent-template.md), [drift-reflection](drift-reflection.md), [perception-memory](perception-memory.md) |
| Mechanics | [action-set](action-set.md), [turn-mechanics](turn-mechanics.md) |
| World | [../world/setting](../world/setting.md), [../world/economy](../world/economy.md), [../world/regimes/overview](../world/regimes/overview.md), [../world/religions/overview](../world/religions/overview.md) |
| Cast | [../agents/overview](../agents/overview.md) |
| Experiments | [../experiments/hypotheses](../experiments/hypotheses.md), [../experiments/run-plan](../experiments/run-plan.md) |
