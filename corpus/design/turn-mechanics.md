# Design — Turn mechanics

**Status:** stable
**Last updated:** 2026-05-28
**Related:** [action-set](action-set.md), [perception-memory](perception-memory.md), [../decisions/004-round-robin-one-action.md](../decisions/004-round-robin-one-action.md)

How a day actually ticks.

## The shape

**Round-robin by round, one action at a time, variable AP cost, skip allowed. Within a round, all active agents decide in parallel.**

- Each agent has **7 AP/day** at day start (minus hunger penalty).
- A "round" includes every agent that still has AP > 0 and has not REST-ed.
- Within a round, **all active agents' LLM calls fire in parallel from the same public-events snapshot**, then their chosen actions are applied sequentially in the day's seeded order. So agents react to *previous rounds*, never to a same-round action. This is the implementation in [`src/engine.ts`](../../src/engine.ts) (`Promise.all` over the round) — it trades a little realism for big wall-clock savings and removes within-round ordering bias.
- On their turn, an agent takes **one** action (see [action-set](action-set.md)), spending its AP cost.
- They may `REST` to end their day early.
- After 3 consecutive parse/validation failures in a single turn, the engine forces a `REST` for that agent.
- Day ends when every agent is at 0 AP OR has REST-ed.

## Cost reality check

Worst case = 6 agents × 7 AP = 42 LLM calls/day. With variable-cost actions (some cost 2 AP) and skips, realistic average is ~25–30 calls/day. On Ollama Cloud a 31-day run is typically ~1–2 hours wall-clock (and parallel-within-round decisions cut it further). Plan to run unattended. Local single-GPU runs are slower (~10s/call).

## Day phase machine

```
DAY START (day N)
  ├─ Refresh AP for every agent (7, minus hunger penalty)
  ├─ Reset event queue for the day
  ├─ Determine round-robin order (seeded RNG)
  └─ (Optional) Holy day notification — agents see "today is a holy day" in perception

ROUND-ROBIN PHASE
  ├─ for round = 1, 2, 3, ...:
  │    snapshot today's public events (so all agents in this round see the same info)
  │    in PARALLEL, for each active agent (AP > 0, not REST-ed):
  │      ├─ build perception payload (see perception-memory.md)
  │      ├─ call Ollama → ActionResponse JSON (retry up to 3x on parse/validation fail)
  │      └─ validate against the action handler
  │    then SEQUENTIALLY in the day's seeded order, for each decided action:
  │      ├─ apply effect (mutate world state), deduct AP
  │      ├─ append to events.jsonl + transcript.md
  │      └─ if agent REST-ed / out of AP: mark as done for the day
  └─ exit when no agent has AP > 0 OR all agents have REST-ed

DAY END / NIGHT
  ├─ For each living agent: attempt to eat 1 food
  │    ├─ if food >= 1: food -= 1; hunger = 0
  │    └─ else: hunger += 1
  ├─ Death: if hunger >= hungerDeathDays (default 7) → agent dies, removed from sim
  ├─ Advance crops (for the still-living): plantedDay <= N - 3 → ready
  ├─ Log day-end world state (+ any deaths) to events.jsonl and transcript.md
  ├─ If everyone is dead → log extinction, end the run
  ├─ Increment day counter
  └─ If end of week (day % 7 == 0): trigger reflections for the living (see drift-reflection.md)

NEXT DAY → repeat
```

## Ordering within a day

- Random seeded order **per day** (reshuffled each day): `shuffled(slots, seedrandom(seed + day))`.
- Same order for all rounds within a single day. Simpler, still fair over many days.
- Order only governs the *apply* step; decisions within a round are made in parallel from one snapshot, so order does not bias what any agent sees.
- An agent who has REST-ed is skipped for the rest of the day. They are not re-shuffled in.
- If an agent's chosen action costs more AP than it has left, the engine forces a `REST` and ends its day.

## Hunger and AP

- `hungerDays = 0`: 7 AP.
- `hungerDays = 1`: 7 AP (no penalty on first day).
- `hungerDays = 2`: 6 AP.
- `hungerDays = 3`: 5 AP.
- `hungerDays = 4+`: 3 AP (floor).

(Config-driven via `hungerApPenalty`.) The penalty incapacitates a hungry agent gradually — and after `hungerDeathDays` (default 7) consecutive hungry days the agent **dies** and is removed. Set `hungerDeathDays: null` for the old soft-pressure-only behaviour. See [../world/economy#death](../world/economy.md) and [../decisions/011-death-from-hunger](../decisions/011-death-from-hunger.md).

## Determinism

- The day seed is `runSeed + dayNumber`.
- The within-day shuffle is `seedrandom(daySeed)` applied to the agent list.
- Ollama is called with `temperature: 0` and a per-call `seed` derived from `daySeed + round + agentIndex`.
- Ollama itself is not perfectly deterministic across GPU runs, but reproducibility is close enough for cross-run comparison.

## Reflection ticks

End of every 7 days (`world.day % 7 === 0`) triggers a reflection round:
- After all day-end work, the engine calls each agent's reflection prompt in parallel.
- This is a separate LLM call per agent (~6 extra calls per week, trivial).
- See [drift-reflection](drift-reflection.md) for the prompt and update mechanics.

> **Weekly reflection is the only reflection implemented today.** The event-triggered reflections (first-time hunger, post-`CONVERT`, after public accusation, after a charged DM) are designed in [drift-reflection](drift-reflection.md) but are **not yet built** in [`src/engine.ts`](../../src/engine.ts) (`runWeeklyReflections` is the only path). Treat them as a planned feature, not current behaviour.

## End of run

When `world.day > config.days` (default config: 31):
- The loop exits after the final day's end-of-day + any week-end reflection.
- Logger generates the per-agent files under `runs/<runDir>/agents/`.
- Run directory is finalized; the user writes `summary_final.md` after Claude-assisted analysis, then a corpus summary under `corpus/runs/`.

See [log-format](log-format.md).
