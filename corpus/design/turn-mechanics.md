# Design — Turn mechanics

**Status:** stable
**Last updated:** 2026-05-26
**Related:** [action-set](action-set.md), [perception-memory](perception-memory.md), [../decisions/004-round-robin-one-action.md](../decisions/004-round-robin-one-action.md)

How a day actually ticks.

## The shape

**Round-robin, one action at a time, variable AP cost, skip allowed.**

- Each agent has **7 AP/day** at day start.
- A "round" cycles through every agent that still has AP > 0 in **seeded random order** (reshuffled each day).
- On their turn, an agent takes **one** action (see [action-set](action-set.md)), spending its AP cost.
- They may `REST` to end their day early.
- Day ends when every agent is at 0 AP OR has REST-ed OR has skipped consecutively (3-strikes).

## Cost reality check

Worst case = 6 agents × 7 AP = 42 LLM calls/day. With variable-cost actions (some cost 2 AP) and skips, realistic average is ~25–30 calls/day. At ~10s per Ollama call on a single-GPU box, that's ~5 min/day → **~10 hours per 100-day run**. Plan to run unattended.

## Day phase machine

```
DAY START (day N)
  ├─ Refresh AP for every agent (7, minus hunger penalty)
  ├─ Reset event queue for the day
  ├─ Determine round-robin order (seeded RNG)
  └─ (Optional) Holy day notification — agents see "today is a holy day" in perception

ROUND-ROBIN PHASE
  ├─ for round = 1, 2, 3, ...:
  │    for each agent in shuffled order with AP > 0:
  │      ├─ build perception payload (see perception-memory.md)
  │      ├─ call Ollama → ActionResponse JSON
  │      ├─ validate
  │      ├─ apply effect (mutate world state)
  │      ├─ append to events.jsonl + transcript.md
  │      └─ if agent REST-ed: mark as done for the day
  └─ exit when no agent has AP > 0 OR all agents have REST-ed

DAY END / NIGHT
  ├─ For each agent: attempt to eat 1 food
  │    ├─ if food >= 1: food -= 1; hunger = 0
  │    └─ else: hunger += 1
  ├─ Advance crops: each planted crop with plantedDay <= N - 3 → ready
  ├─ Log day-end world state to events.jsonl and transcript.md
  ├─ Increment day counter
  └─ If end of week (day % 7 == 0): trigger reflections (see drift-reflection.md)

NEXT DAY → repeat
```

## Ordering within a day

- Random seeded order **per day** (reshuffled each day).
- Random seeded order **per round** within the day? **No** — same order for all rounds within a single day. Simpler, still fair over many days.
- An agent who has REST-ed is skipped for the rest of the day. They are not re-shuffled in.
- Within a round, if an agent doesn't have enough AP for any meaningful action and chooses REST, they are out.

## Hunger and AP

- `hungerDays = 0`: 7 AP.
- `hungerDays = 1`: 7 AP (no penalty on first day).
- `hungerDays = 2`: 6 AP.
- `hungerDays = 3`: 5 AP.
- `hungerDays = 4+`: 3 AP (floor).

This is soft pressure — agents survive indefinitely on no food but become incapacitated.

## Determinism

- The day seed is `runSeed + dayNumber`.
- The within-day shuffle is `seedrandom(daySeed)` applied to the agent list.
- Ollama is called with `temperature: 0` and a per-call `seed` derived from `daySeed + round + agentIndex`.
- Ollama itself is not perfectly deterministic across GPU runs, but reproducibility is close enough for cross-run comparison.

## Reflection ticks

End of every 7 days (days 7, 14, 21, ...) triggers a reflection round:
- After all day-end work, the engine calls each agent's reflection prompt.
- This is a separate LLM call per agent (~6 extra calls per week, trivial).
- See [drift-reflection](drift-reflection.md) for the prompt and update mechanics.

Event-triggered reflections (first-time hunger, post-CONVERT, after public accusation) happen inline, **after** the triggering action's normal effects are applied, **before** the next agent's turn.

## End of run

When `dayNumber > runConfig.days` (default 100):
- Final day-end runs.
- Final reflection if it's not already a week-end.
- Logger generates the per-agent files under `runs/<runDir>/agents/`.
- Run directory is finalized; an empty `summary_final.md` is placed there for the user to fill in after Claude-assisted analysis.

See [log-format](log-format.md).
