# 004 — Round-robin, one action at a time, 7 AP/day

**Status:** accepted
**Date:** 2026-05-26
**Related:** [../design/turn-mechanics](../design/turn-mechanics.md), [../design/action-set](../design/action-set.md)

## Context

How should a day actually tick? Three options:

- **(a) Sequential, full-day-per-turn.** Each agent receives the full state, spends all their AP in one LLM call, then the next agent goes. 6 LLM calls per day. Simplest. Has ordering bias (later agents see earlier moves).
- **(b) Sequential, one action at a time, round-robin.** Each agent takes ONE action, then the next agent, repeat until all are out of AP. ~25–30 LLM calls per day realistic. Interleaved actions feel more alive. Variable-cost actions and skips allowed.
- **(c) Simultaneous / phased.** All agents submit actions in parallel within a phase. No ordering bias. Most complex (conflict resolution).

## Decision

**(b) Round-robin, one action at a time, 7 AP/day, variable AP cost, skip allowed (`REST`).**

Specifically:
- Each agent starts the day with 7 AP (or less if hunger-penalized).
- Each agent's turn = one action, costing 1–2 AP. Actions defined in [../design/action-set](../design/action-set.md).
- Round-robin order is determined once per day by seeded RNG; same order for all rounds within that day.
- Agent may `REST` at any point to end their day.
- Day ends when every agent is at 0 AP or has REST-ed.

## Alternatives considered

- **(a) Full-day-per-turn.** Cheapest in LLM calls (~6/day). Initially recommended. Rejected by user. Cost of rejection: 4–5x more LLM calls per day. Benefit gained: interleaved action feel — an agent can react to what just happened in the previous round.
- **(c) Simultaneous / phased.** Most "fair" experimentally but most complex. Conflict resolution rules (e.g. two agents try to give last gold at same time) become engineering chores. Rejected as overkill for v1.

## Consequences

- **Enables:** turn-by-turn reactivity. If V1 tithes to the priest in round 1, V2 in round 2 sees that action and may react in round 3 by `DM`-ing V1 about it.
- **Compute cost:** worst-case 6 agents × 7 AP = 42 LLM calls/day. Realistic average ~25–30 with skips and 2-AP actions. ~10 hours per 100-day run on Ollama on a single GPU. Plan unattended runs.
- **Reproducibility:** seeded RNG controls (1) per-day shuffle, (2) Ollama call seed via temperature=0 + seed parameter.
- **Ordering bias remains:** within a day, the first agent always sees a fresher state than the last. Random reshuffle each day washes this out over a long run. We accept the bias.

## AP budget rationale

7 AP/day was chosen (up from initial 3-4) to give more room for chained behavior:
- Plant a seed (1) + harvest (1) + visit market (2) + chat (1) + give (1) = 6 — possible in a day.
- Tight enough to force tradeoffs (you can't do everything).
- Loose enough to allow rich days.

Hunger penalty floor is 3 AP. A starving agent cannot self-farm and must depend on others or risk failure.

## Open questions

- Is 7 AP too generous? Some Ollama models may take 7 trivial actions and produce flat days. Watch for boring transcripts; reduce to 5 if needed.
- Does the round-robin order significantly bias outcomes? Diagnostic: in early runs, compare days where the same agent goes first vs last in adjacent days. If their action distribution differs sharply, ordering bias is real.
