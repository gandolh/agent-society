# Design — Action set

**Status:** stable
**Last updated:** 2026-06-05
**Related:** [turn-mechanics](turn-mechanics.md), [perception-memory](perception-memory.md), [../world/economy](../world/economy.md), [../decisions/012-ocean-town-spatial-capabilities-economy](../decisions/012-ocean-town-spatial-capabilities-economy.md)

Ten core verbs (always available) plus seven spatial verbs that appear only when `config.spatial` is on (the ocean town).

## Core verbs (always available)

| Verb | AP | Effect |
|------|----|----|
| `WORK_PLOT` | 1 | If you have seeds: plant one (seed → planted crop). If not: tend (narrative only). Planted crops mature after **3 days** into "ready." Spatial: requires a farm zone. |
| `HARVEST` | 1 | Collect all ready crops on your plot. Each ready crop → **3 food**. Spatial: requires a farm zone. |
| `GO_TO_MARKET` | 2 | One transaction: `BUY(item, qty)` or `SELL(item, qty)`. Items: seeds, food. Prices in [../world/economy](../world/economy.md). Spatial: requires the market zone. |
| `GIVE(to, resource, amount)` | 1 | Unilateral transfer of gold/food/seeds — gifts, friendship, paying for a service. Recipient doesn't consent. |
| `SAY(text)` | 1 | Speak publicly. Aspatial: everyone hears. **Spatial: only agents within `sayRadius` hear it.** |
| `DM(to, text)` | 1 | Private message to one agent. Only the target sees it. Not spatially gated (a letter reaches anyone). |
| `PRAY(deity)` | 1 | Narrative religious act. Publicly observable. |
| `TITHE(to, resource, amount)` | 1 | Transfer flagged as a religious offering. Logged distinctly so the observer can count belief-related transfers. |
| `CONVERT(religion)` | 2 | Change your `religion` field (Christianity/Atheism). Discrete, deliberate; counted in belief-propagation metrics. |
| `REST` | 0 | Pass for the rest of the day. Ends your day. |

## Spatial verbs (ocean town only — `config.spatial`)

See [ADR 012](../decisions/012-ocean-town-spatial-capabilities-economy.md) and the [build plan](ocean-town-build-plan.md). Zone-gated verbs only appear in the prompt when the agent is standing at the right zone.

| Verb | AP | Effect |
|------|----|----|
| `TRAVEL(to)` | 1 | Walk up to `moveSpeed` tiles toward a named zone. Multi-day if far. (0 AP would let an agent roam free; 1 AP makes "where you spend the day" a real cost.) |
| `FISH` | 1 | At the harbour: catch `fishYield` food. |
| `FORAGE` | 1 | At a forage zone: gather `forageYield` food (seasonal in flavour). |
| `MILL` | 2 | At the mill: turn your ready crops into `millGoldPerCrop` gold each. |
| `POST_OFFER(item, qty, unitPrice)` | 1 | At the market: list food/seeds for sale on the wall (goods held in escrow). |
| `READ_OFFERS` | 1 | At the market: review current wall offers (also injected into perception there). |
| `BUY_FROM_WALL(id, qty)` | 3 | At the market: buy from a wall listing; gold→seller, goods→you. |

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

## What is *not* in the action set

- `STEAL` — small models often abuse it once introduced, dominating runs with theft loops.
- `WORK_FOR(target)` — paid labor on another's plot. Emulate via narrative `SAY`/`DM` agreement + `GIVE`.
- Auctions / Contract-Net / numeric trust — present in the source Farm Valley sim, deferred here (see [ADR 012](../decisions/012-ocean-town-spatial-capabilities-economy.md)).
- `GOSSIP(target_a, about_b, text)` — simulate via `DM(target_a, "btw, B is ...")`.
- `ACCUSE` / `PETITION` — emulate via `SAY` with the right tone.
- `DECREE` / `SERMON` — leader NPCs just `SAY` with role-given authority. No special verbs.

## Argument validation

The engine validates each action before applying:
- `WORK_PLOT` valid even with 0 seeds (becomes a narrative-only "tend" act).
- `HARVEST` valid only if `plot.cropsReady > 0`.
- `GO_TO_MARKET` requires enough resources for the transaction (gold to BUY, item to SELL).
- `GIVE` / `TITHE` require positive amount and sufficient resources.
- `CONVERT` valid for either religion (Christianity/Atheism); converting to one's current religion is rejected.
- `DM` target must exist; can be any agent including NPCs.
- `SAY` text must be non-empty.
- `REST` always valid.
- Spatial verbs: `TRAVEL.to` must be a known zone id (and not already there); zone-gated verbs fail with a "TRAVEL there first" message if the agent isn't at the right zone; `BUY_FROM_WALL.id` must be a live listing (not your own); `POST_OFFER` requires enough goods to escrow.

Invalid actions are rejected; the engine returns an error to the agent and asks it to choose again **on the same turn** (does not consume AP). Limit: 3 retries, then force `REST`.

## Per-day AP budget interaction

Each agent gets `apPerDay` AP/day (default **5** in the v2 config; was 7 in early design). Variable costs mean an agent typically takes a handful of actions/day. Skip is free (REST).

Hunger penalty (see [../world/economy](../world/economy.md)) reduces AP. If an agent is 4+ days hungry they have only 3 AP that day.

## Adding new actions later

When v2 introduces a new verb, add it here, in [turn-mechanics](turn-mechanics.md) if it changes ordering rules, and in [perception-memory](perception-memory.md) if it changes what other agents observe. Always update [../index.md](../index.md) and append to [../log.md](../log.md).
