# World — Economy

**Status:** stable
**Last updated:** 2026-05-28
**Related:** [setting](setting.md), [../design/action-set](../design/action-set.md), [../design/turn-mechanics](../design/turn-mechanics.md)

Three resources, one market, one survival pressure. Designed to be just complex enough that scarcity matters and just simple enough that the engine fits in 50 lines.

> **v2 reframing.** The same three-resource loop now sits beneath six distinct *jobs* (baker, doctor, carpenter, mill owner, priest, editor). The engine is unchanged — `plot` is the agent's workplace, `seeds` is their stock/materials, `crops` are goods in progress, `food` is the staple they (and everyone) needs to eat. Jobs are narrative; the math is the same.

> **Spatial (ocean-town) additions.** When `config.spatial` is on (see [../decisions/012-ocean-town-spatial-capabilities-economy](../decisions/012-ocean-town-spatial-capabilities-economy.md)), food has two new sources — **`FISH`** at the harbour (+`fishYield`) and **`FORAGE`** at a forage zone (+`forageYield`) — and gold has a new source, **`MILL`** (ready crops → `millGoldPerCrop` gold each). Trade gains a **market wall**: agents `POST_OFFER` goods (held in escrow), `READ_OFFERS`, and `BUY_FROM_WALL`; unsold listings refund after `wallListingTtlDays`. All of these are zone-gated. Resources, prices, and shopkeeper below are unchanged.

## Resources

| Resource | Use | Source |
|----------|-----|--------|
| **Gold** | Currency at the market. Tithed to religious leaders. | Selling food/seeds at the market. Starting endowment. |
| **Food** | Eaten at night. 1 food/day staves off hunger. | Harvesting crops. Buying at market. Receiving as gift/tithe. |
| **Seeds** | Planted to grow crops. | Starting endowment. Buying at market. Receiving as gift. |

No other resources in v1. No tools, no weapons, no luxuries.

## Starting endowments

Every agent starts the run with:
- **5 gold**
- **3 food**
- **3 seeds**
- Empty plot

Same for all agents — research subjects and NPCs alike. We do not want starting inequality to confound the experimental signal. Inequality *emerges* from behavior.

## Plot mechanics

Each agent owns one plot. The plot tracks individual planted crops with maturity timing.

```ts
plot: {
  cropsPlanted: { plantedDay: number }[];
  cropsReady: number;
}
```

### `WORK_PLOT` (1 AP)

- If `seeds > 0`: deduct 1 seed, append `{ plantedDay: currentDay }` to `cropsPlanted`.
- If `seeds == 0`: narrative-only "tend" — no state change, but the action is logged. (Allows an agent to *look like* a hardworking farmer even when broke.)

### Maturation (engine, end-of-day)

- For each `crop` in `cropsPlanted`: if `currentDay >= plantedDay + 3`, move it from `cropsPlanted` to `cropsReady` (increment `cropsReady`, drop the entry).
- Maturity is **3 days**. Plant on day 5 → ready on day 8.

### `HARVEST` (1 AP)

- Requires `cropsReady > 0`.
- All ready crops harvested at once: `food += cropsReady * 3; cropsReady = 0`.
- One harvest collects everything. (Simpler than per-crop harvesting.)

### Yield

- **3 food per crop**. So 1 seed → 3 food after 3 days. ROI: triples your food in 3 days.

## Market mechanics

Scripted NPC vendor. Always open. Always full stock. No LLM call — pure config.

### Prices (v1)

| Item | Buy from market (gold) | Sell to market (gold) |
|------|------------------------|------------------------|
| Seeds | 2 | 1 |
| Food | 1 | 1 |

- **Spread of 1 gold on seeds** — market makes money. Discourages flipping.
- **Food buy/sell same** — pure liquidity for hungry agents who have only seeds.

### `GO_TO_MARKET(action)` (2 AP)

- One transaction per visit. Travel cost is baked in.
- Sub-actions:
  - `BUY(item, qty)` — checks gold, transfers.
  - `SELL(item, qty)` — checks inventory, transfers.

Prices may become time-varying in v2 (scarcity-responsive). v1 is constant.

## Survival pressure (hunger)

Graded AP penalty **and death**. As of [../decisions/011-death-from-hunger](../decisions/011-death-from-hunger.md), an agent that goes `hungerDeathDays` (default 7) consecutive days without eating **dies** and is removed from the simulation. The AP penalty still bites on the way down, so there is a recovery window. Set `hungerDeathDays: null` to restore soft-pressure-only.

### End-of-day food consumption

At end of every day, each agent attempts to eat 1 food.
- If `food >= 1`: `food -= 1`, `hungerDays = 0`.
- Else: `hungerDays += 1`. Their next day will start with reduced AP.

### Hunger → AP penalty

| `hungerDays` | AP next day |
|--------------|-------------|
| 0 | 7 |
| 1 | 7 (grace) |
| 2 | 6 |
| 3 | 5 |
| 4+ | 3 (floor) |

A starving agent can still act, just less. Effectively they become incapable of self-sufficient farming (3 AP isn't enough to plant, harvest, and trade in the same day) and depend on others or on giving up something else.

### Death

After `hungerDeathDays` (default 7) consecutive hungry days, the agent dies at end-of-day: marked `alive = false`, removed from turns, the public roster, and reflections; its agent file (drift history) is kept. If everyone dies, the run ends with an `extinction` event. The per-turn prompt tells the agent the threshold so the stake is legible. See [../decisions/011-death-from-hunger](../decisions/011-death-from-hunger.md).

This is the **scarcity that creates real stakes for cooperation and dissent.** See [../design/research-goals](../design/research-goals.md).

## Engine config (in `config.json`)

```json
{
  "startingEndowments": { "gold": 5, "food": 3, "seeds": 3 },
  "marketPrices": { "buySeeds": 2, "buyFood": 1, "sellAny": 1 },
  "cropMaturityDays": 3,
  "foodPerCrop": 3,
  "apPerDay": 5,
  "hungerApPenalty": [7, 7, 6, 5, 3],  // index by hungerDays, last value is floor
  "hungerDeathDays": 7                 // die after this many hungry days; null = no death
}
```

Tune knobs without code changes. Reproducibility key.

## Bottom line

A self-sufficient agent needs to plant ~1 seed per 3 days (yields 3 food, eats 3, breaks even). Anyone caught short has to ask, give, sell, or steal — and stealing isn't in the action set in v1. Sharing is the only structural way out of scarcity.
