# 014 — Diet variety, food tuning, and the fishmonger price gradient

**Status:** accepted (built 2026-06-05; diet behind `config.dietVariety`, fishmonger behind `config.spatial`)
**Date:** 2026-06-05
**Related:** [012](012-ocean-town-spatial-capabilities-economy.md), [013](013-world-dynamics-alms-conversion-weather.md), [../experiments/design-questions-2026-06-05](../experiments/design-questions-2026-06-05.md), [../world/economy](../world/economy.md)

Across runs 02/03 **fishing dominated**: FISH was 1 AP, instant, +2 food, no input, repeatable — strictly better than farming, so nobody farmed or traded and wealth never moved. This ADR fixes that structurally (diet variety) and economically (a supply-sensitive fishmonger), per the [design-questions analysis](../experiments/design-questions-2026-06-05.md) Q2/Q3.

## Decisions

### 1. Typed food + diet variety (the structural fix)
`resources.food` stays a single fungible count (market/give/tithe/alms code untouched), but food now carries **provenance** — `foodStock: {fish, crop, forage, other}` — and agents track `recentMeals` (last `dietWindowDays`, default 3). At night an agent eats the food type that best **varies** its recent diet:
- a **fresh** type (not in the recent window) → fully satisfied, hunger 0;
- a **monotonous** type (same as recent days) → only partial relief, hunger floored at `monotonyHungerFloor` (2) — *ate, but still hungry*.

So a pure-fisher who only eats fish slowly accrues hunger and **must diversify or trade** for crops/forage/bought food ("other" = bought/gifted/alms, always counts as variety). This breaks fishing dominance without nerfing fishing's yield — it makes a *mono-diet* the problem, which is realistic and creates genuine fisher↔farmer interdependence. Gated by `config.dietVariety`.

### 2. Food tuning
With diet variety carrying the anti-dominance load, raw yields stay modest (fish/forage +2, crop +3 over 3 days). The real rebalance is that **no single food self-sustains** anymore — you need ≥2–3 sources or a trading partner to keep the diet window fresh. This is the *Yerkes-Dodson "moderate scarcity"* target from [related-work](../experiments/related-work.md): enough pressure to force activity and trade, not so much it collapses.

### 3. Fishmonger price gradient
A scripted harbour vendor (`SELL_FISH`) buys fish for gold at a price that **falls as supply rises**: `price = max(fishFloorPrice, fishBasePrice − floor(fishSoldToday / fishGlutStep))` (default 3 → floor 1, step 3), recomputed per fish and **reset daily**. Dumping a glut crashes the price (9 fish sold in a day → 3+3+3+2+2+2+1+1+1 = 18g, not 27). Fishing-for-gold is now self-limiting; fish becomes a **trade good with a market**, not an infinite gold tap. Self-sustaining (a fixed-rule counterparty, like the shopkeeper — no gold faucet beyond what it pays, which is bounded by the falling price).

## Consequences

- **Enables** the interdependence the economy lacked: a fisher must trade fish (via the fishmonger for gold, or the wall/GIVE for others' crops) to eat well; farmers and foragers gain a reason to exist. The market/wall should finally see use.
- **Composes with** weather ([013](013)): a storm closes fishing *and* a fish-heavy diet was already palling — double pressure to have diversified earlier.
- **Token cost:** one extra `Diet:` line in the prompt (only when `dietVariety` on) and a fishmonger price line at the harbour. Small.
- **Honors ADRs:** no numeric *persona* traits ([002](002-prose-persona-no-traits.md) intact — diet is world state, not personality); the fishmonger is a scripted counterparty, consistent with [003](003-narrative-only-regime-with-llm-leaders.md) (it sets a *price rule*, not who must trade).
- **Open / to watch:** with window 3 and exactly 3 food types, even a varied eater repeats on day 4 (needs "other"/trade to stay perfectly full) — intended pressure, but tune `dietWindowDays`/`monotonyHungerFloor` if it's too punishing. A full multi-day run hasn't yet confirmed agents *understand* the diet hint; that's the next run's question.

## Config knobs
`dietVariety`, `dietWindowDays` (3), `monotonyHungerFloor` (2); `fishBasePrice` (3), `fishFloorPrice` (1), `fishGlutStep` (3). New verb `SELL_FISH` (harbour-gated). New state: `AgentState.foodStock`/`recentMeals`, `WorldState.fishSoldToday`.
