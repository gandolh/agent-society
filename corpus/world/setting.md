# World — Setting

**Status:** stable
**Last updated:** 2026-05-28
**Related:** [economy](economy.md), [regimes/capitalism](regimes/capitalism.md), [religions/overview](religions/overview.md), [../agents/overview](../agents/overview.md)

A small working city. Maybe three thousand people. Six of them — the cast — are at the centre of the simulation.

## Geography (abstract)

No spatial coordinates in v1. The city is a single locale containing:

- **Six "workplaces"**, one per agent — their bakery, surgery, carpentry bench, mill office, chapel, print-shop. The engine treats each as a generic `plot` for productive output; jobs are narrative.
- **A city square** — where `SAY` actions happen. Everyone hears.
- **A marketplace** — scripted NPC vendor for staples (food, materials). Always open. See [economy](economy.md).
- **The mill & workshop** — Aldric Vance's operation. The city's largest single employer. Implicit, not a separate locale.
- **The chapel** — Father Maro's parish, the city's only church. Implicit.
- **The print-shop** — Nyssa Velkin's *City Ledger*. Implicit.

Locations are *narrative*, not mechanical. The engine cares about the action (`SAY`, `TITHE`, `PRAY`) and its visibility rules, not where it happens. See [../design/perception-memory](../design/perception-memory.md).

## Time

- One **day** = one round-robin pass through every agent until all AP are spent or all have REST-ed.
- **Holy day cadence:** Christianity observes day 7, 14, 21, ... (every 7 days). Atheism has no holy days.
- **Season:** abstract flavor only in v1. Not mechanical.
- **Default run length:** 31 days. Configurable.

## Off-screen world (narrative furniture)

These exist in personas and SAY content but have no engine representation:
- **The mill workers** — ~sixty employees of Aldric's. Referenced, never voiced.
- **Halim** — Lior's master carpenter. Off-screen, but his shop is Aldric's main repair vendor.
- **Other cities and the upriver grain trade** — referenced when explaining flour prices.
- **The recent past** — Yorin's death, Mira's death, Tessa's husband's accident. Lives in personas as seeded memory.

The city is small enough that everyone knows the cast, large enough that a capitalist economy is plausible, and structured enough that scarcity is a real pressure.

## Why a small city and not a village or a kingdom

- **Capitalism needs a labor market.** A village of farmers can be redistributive; a city of trades makes wages, prices, and credit the natural medium of conflict.
- **Diverse jobs become legible.** Baker, doctor, carpenter, mill owner, priest, editor — six distinct economic roles in earshot of each other.
- **No spatial layer needed.** Everyone is in earshot of everyone else when they `SAY`. No movement, no pathfinding.
- **Bounded social graph.** 6 nodes → 15 possible pairs. Tractable for offline observer analysis.

## What the city is *not*

- **Not a village.** That was the prior MVP. See [../decisions/009-city-capitalism-christian-pivot.md](../decisions/009-city-capitalism-christian-pivot.md).
- **Not a multi-regime sweep.** Capitalism is the only regime studied in v2.
- **Not a multi-faith experiment.** Christianity + a few atheists. The True Vine reform branch was retired in the pivot.
