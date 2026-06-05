# Design — Overview

**Status:** stable
**Last updated:** 2026-05-28
**Related:** [research-goals](research-goals.md), [architecture](architecture.md), [../agents/overview.md](../agents/overview.md), [../world/setting.md](../world/setting.md), [../decisions/009-city-capitalism-christian-pivot.md](../decisions/009-city-capitalism-christian-pivot.md)

A TypeScript + Ollama framework for running small town simulations populated by LLM agents. Each agent has a prose persona with built-in tensions. The city runs day by day under **capitalism**, with two religious positions — Christianity (the majority) and atheism (a small minority) — coexisting in one community. We log every action and every word into prose transcripts and paste them into a stronger model (Claude/GPT) offline to synthesize what happened — friendships, enemies, conversions, compliance, conspiracies.

> **v2 scope.** The original three-regime sweep (socialism / monarchy / capitalism) and three-faith landscape (Christianity / True Vine reform cult / atheism) were retired after run 01. v2 studies a single regime (capitalism) and a two-position faith landscape deeply. See [../decisions/009-city-capitalism-christian-pivot.md](../decisions/009-city-capitalism-christian-pivot.md).

## The pitch in one paragraph

Run a small working city of 6 LLM agents (3 citizens as research subjects, 3 NPC fixtures) for ~31 simulated days under capitalism. Every agent has a hidden prose persona seeded with deliberate tension and a distinct job (baker, doctor, apprentice carpenter, mill owner, priest, newspaper editor). Every day they take turns in a round-robin, spending action points on working their trade, trading, gossiping, praying, tithing, or converting religion. Once a week, each agent self-reflects and updates their "current state" — letting beliefs and desires drift visibly over time. The framework writes everything to a transcript file. You read the transcript or paste it into Claude offline to see what emerged.

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
- **Open-source models, assigned per slot.** Each agent has its own `model` field in `config.json`. A research-grade run uses three distinct model families across the three citizen slots (so behaviour can be attributed to the model) and one cheap shared model for NPCs. Run 01 used a single 3B model across the whole cast — and homogenised badly (see [../runs/2026-05-26_socialism_run01-summary.md](../runs/2026-05-26_socialism_run01-summary.md)). Default endpoint is Ollama Cloud; local Ollama is supported.
- **Cloud / cost budget.** ~25–30 LLM calls per simulated day. ~1–2 hours for a 31-day run on Ollama Cloud. Plan to run unattended.
- **No API integration for the observer.** The observer model is a human pasting transcripts into Claude/GPT chat. See [observer-workflow](observer-workflow.md).

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
