# Experiments — open design questions (2026-06-05)

**Status:** draft — analysis + recommendations, pending user direction
**Last updated:** 2026-06-05
**Related:** [run-plan](run-plan.md), [related-work](related-work.md), [../world/economy](../world/economy.md), [../decisions/007-mvp-cast-size](../decisions/007-mvp-cast-size.md), [../decisions/013-world-dynamics-alms-conversion-weather](../decisions/013-world-dynamics-alms-conversion-weather.md)

The user asked four open design questions. This page analyses each and gives a recommendation. None are built yet — they reshape the world and need a decision first.

## Q1 — Reduce agent complexity but increase their number?

**Analysis.** Right now: 6 agents, rich prose personas, dense hand-authored tension graph. Two regimes of value are in tension:
- **Few rich agents** (current): deep, legible drama; every pair is authored; a stronger model can narrate it. But the "society" is tiny — no crowds, no emergent factions beyond the 15 pairs, and the signal is fragile (one model quirk skews the whole run).
- **Many simple agents**: real emergent phenomena (opinion clusters, market price discovery, faction sizes) that only appear at N≳20; matches the *Generative Agents* / *1000 People* / Takata-individuality literature ([related-work](related-work.md)). But on a budget-locked 3B model, each agent is the same weak brain, and we've seen them homogenise.

**Recommendation (hybrid, two tiers): keep the 6 rich "named" agents AND add a population of ~15–30 "extra" simple agents.** The extras get a one-line persona (occupation + 1 trait + faith), share the cheap model, and are *not* individually analysed — they're the crowd the named six move through. This is the *Generative Agents* "townsfolk vs. protagonists" split and the [ADR 007](../decisions/007-mvp-cast-size.md) NPC-fixture idea generalised. It gets emergent scale (markets, conversion contagion, faction wealth) without losing the authored drama, and the token cost of extras is tiny (short persona, often just REST/WORK). **Defer until** the named-six economy is healthy (it isn't yet — run03 still talk-heavy); scale is the *next* frontier, not this one.

## Q2 — Farming/food dynamics: good, or fine-tune?

**Current numbers:** 5 AP/day; crops mature in 3 days at 3 food each; FISH/FORAGE +2 food; eat 1/day; death at 7 hungry days; start with 3 food + 3 seeds.

**Analysis.** The loop is *coherent* but **too easy and too flat**, and the runs show it:
- **Fishing dominates.** FISH is 1 AP, instant, +2 food, no input, repeatable — strictly better than farming (1 seed + WORK + 3-day wait + travel for +3). Run02/03: agents fished, nobody farmed. The farm loop is dead weight.
- **No reason to specialise or trade.** Everyone can self-feed by fishing, so the market/wall sits idle and wealth never moves (run02/03 wealth was ~flat). Scarcity isn't biting except when the survival lock fires.
- **Weather (ADR 013) helps** — storms now make pure fishing risky and push toward farming/foraging — but the base yields still favour fishing.

**Recommendation — fine-tune toward *interdependence and scarcity*:**
1. **Make fishing riskier/limited** so it isn't the dominant strategy: lower `fishYield` to 1, or cap fish per agent per day, or (cheap) lean harder on weather (more storms). Goal: no single action self-sustains.
2. **Make farming worth it** (higher yield, the 3-day wait is the cost) so specialisation pays.
3. **Tighten the margin** so trade matters: if 5 AP barely covers self-feeding, agents must *trade* surplus (fisher↔farmer), which finally exercises the wall and moves wealth. This is the *Yerkes-Dodson "moderate scarcity"* sweet spot from [related-work](related-work.md) — too easy = idle, too hard = collapse.
4. **Consider a perishability/!storage pressure** later (food spoils) to force ongoing activity, not one big harvest.

**Verdict:** the dynamics need tuning, not redesign. The single highest-value change is **break fishing's dominance** so the other food paths and the market come alive.

## Q3 — New NPCs that make the world more dynamic but still self-sustaining

The bar: an NPC should *create pressure or opportunity* without spawning infinite resources. Candidates, ranked:

1. **Fishmonger / grain factor (a second scripted market actor at the harbour).** Buys fish, sells at the market — creates a price gradient (catch cheap at the coast, food dear in town) that rewards the carrying/trading the wall is meant to enable. Self-sustaining: it's a fixed-price counterparty like the existing shopkeeper, not a resource source.
2. **Tax/landlord NPC** (rent collector for Aldric). A recurring *drain* that forces agents to earn, not just subsist — directly creates the scarcity Q2 wants, and gives the capitalism regime teeth. Self-sustaining (moves gold, doesn't create it).
3. **A second faith carrier / itinerant preacher** (gives atheism or a minor sect a building + alms, fixing the ADR-013 asymmetry where atheists have no safety net). Makes belief-propagation two-sided.
4. **Wandering merchant** that appears on RNG days (now that weather/RNG exists) with a stock of goods at variable prices — an event, not a fixture. Adds surprise and a reason to hold gold.
5. **The sick/poor (a needy cohort)** — ties to Bram (doctor) and alms; agents who *need* help create the cooperation-under-scarcity signal the research goals want.

**Recommendation:** start with **#1 (fishmonger price gradient)** — it directly fixes Q2's "no trade" problem and is the cheapest (another scripted vendor). Then **#2 (a drain)** to create real scarcity. #3 fixes a real fairness gap and is worth doing for the religion experiment. All are self-sustaining (counterparties/drains/events, never faucets).

## Q4 — Other dynamics worth adding

From the runs + [related-work](related-work.md), highest-value-per-effort:
- **Break fishing dominance** (Q2.1) — *the* unlock for the economy. Do first.
- **Cross-category talk suppression** — run03 showed anti-repeat just shifts SAY→DM; suppress *all* talk after N talk-turns to actually cut the 2.5:1 ratio.
- **Metrics harness** ([related-work](related-work.md) round-2 #8) — Economic Action Rate, Talk-to-Act Ratio, speech-similarity collapse detector, computed from `events.jsonl`. Turn "did it work" into numbers; needed before scaling to many agents (Q1).
- **Food perishability** — a gentle decay so agents can't bank one harvest and idle; keeps pressure continuous.
- **Seasons** (layer on weather/RNG) — multi-day weather regimes (a stormy week) that force planning horizons longer than one day.

## Suggested order

1. **Tune food to break fishing dominance + tighten margins** (Q2) — makes the economy real.
2. **Add the fishmonger price gradient** (Q3 #1) — gives trade a reason.
3. **Metrics harness** (Q4) — measure the above.
4. *Then* **scale to a two-tier population** (Q1) once the 6-agent economy is healthy.
5. Later: drain NPC, second faith carrier, perishability, seasons.
