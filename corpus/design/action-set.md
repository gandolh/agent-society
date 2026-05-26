# Design — Action set

**Status:** stable
**Last updated:** 2026-05-26
**Related:** [turn-mechanics](turn-mechanics.md), [perception-memory](perception-memory.md), [../world/economy](../world/economy.md)

Ten verbs. Tight by design. Add more in v2 if behavior is too flat.

## The verbs

| Verb | AP | Effect |
|------|----|----|
| `WORK_PLOT` | 1 | If you have seeds: plant one (seed → planted crop). If not: tend (narrative only). Planted crops mature after **3 days** into "ready." |
| `HARVEST` | 1 | Collect all ready crops on your plot. Each ready crop → **3 food**. |
| `GO_TO_MARKET(action)` | 2 | Travel + one transaction in same turn: `BUY(item, qty)` or `SELL(item, qty)`. Items: seeds, food. Prices in [../world/economy](../world/economy.md). |
| `GIVE(target, resource, amount)` | 1 | Unilateral transfer of gold/food/seeds. Recipient does not consent. They can `GIVE` it back if they want. |
| `SAY(text)` | 1 | Public village square. Every agent sees this in their next perception payload. |
| `DM(target, text)` | 1 | Private message to one agent. Only the target sees it (engine adds to their `unreadDms`). |
| `PRAY(deity)` | 1 | Narrative religious act. Publicly observable as "X prayed to Y". May appear in others' perception. |
| `TITHE(target_leader, resource, amount)` | 1 | Explicit transfer flagged as religious offering. Mechanically same as `GIVE` but logged distinctly so the observer can count belief-related transfers. |
| `CONVERT(religion)` | 2 | Change your `religion` field. Discrete, deliberate event. Counted in belief-propagation metrics. |
| `REST` | 0 | Explicitly pass for the rest of the day. Ends your day. |

## Action response schema

Every LLM call returns JSON:

```json
{
  "action": "TITHE",
  "args": { "target": "N2", "resource": "gold", "amount": 1 },
  "reasoning": "Father Maro spoke of generosity today. My hunger can wait one more day."
}
```

The `reasoning` field is **free**, costs no AP, and is captured in [log-format](log-format.md). It's the most valuable diagnostic we have.

## What is *not* in the action set (v1)

- `STEAL` — small models often abuse it once introduced, dominating runs with theft loops. Add in v2 if needed.
- `WORK_FOR(target)` — paid labor on another's plot. Interesting economically, defer.
- `GOSSIP(target_a, about_b, text)` — simulate via `DM(target_a, "btw, B is ...")`.
- `ACCUSE` / `PETITION` — emulate via `SAY` with the right tone.
- `DECREE` / `SERMON` — leader NPCs just `SAY` with role-given authority. No special verbs.

## Argument validation

The engine validates each action before applying:
- `WORK_PLOT` valid even with 0 seeds (becomes a narrative-only "tend" act).
- `HARVEST` valid only if `plot.cropsReady > 0`.
- `GO_TO_MARKET` requires enough resources for the transaction (gold to BUY, item to SELL).
- `GIVE` / `TITHE` require positive amount and sufficient resources.
- `CONVERT` valid for any of the three religions; converting to one's current religion is a no-op flagged in the log.
- `DM` target must exist; can be any agent including NPCs.
- `SAY` text must be non-empty.
- `REST` always valid.

Invalid actions are rejected; the engine returns an error to the agent and asks it to choose again **on the same turn** (does not consume AP). Limit: 3 retries, then force `REST`.

## Per-day AP budget interaction

Each agent gets **7 AP/day** (Q-block locked in grilling session). Variable costs mean an agent typically takes ~5 actions/day. Skip is free (REST).

Hunger penalty (see [../world/economy](../world/economy.md)) reduces AP. If an agent is 4+ days hungry they have only 3 AP that day.

## Adding new actions later

When v2 introduces a new verb, add it here, in [turn-mechanics](turn-mechanics.md) if it changes ordering rules, and in [perception-memory](perception-memory.md) if it changes what other agents observe. Always update [../index.md](../index.md) and append to [../log.md](../log.md).
