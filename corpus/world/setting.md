# World — Setting

**Status:** stable
**Last updated:** 2026-05-28
**Related:** [economy](economy.md), [regimes/capitalism](regimes/capitalism.md), [religions/overview](religions/overview.md), [../agents/overview](../agents/overview.md)

A small working city. Maybe three thousand people. Six of them — the cast — are at the centre of the simulation.

## Geography — two modes

The engine supports two world modes, chosen by `config.spatial`:

### Aspatial (default)
No coordinates. The city is a single locale; everyone is in earshot of everyone when they `SAY`. Locations (bakery, mill, chapel, square, marketplace) are *narrative*, not mechanical — the engine cares about the action and its visibility, not where it happens. This is the v1/v2 default.

### Spatial — the ocean town (opt-in)
`config.spatial: true` turns on a **grid of named zones** beside the ocean. See [../decisions/012-ocean-town-spatial-capabilities-economy](../decisions/012-ocean-town-spatial-capabilities-economy.md) and the [ocean-town build plan](../design/ocean-town-build-plan.md). In this mode:

- The town is a 16×10 grid; the **harbour** sits on the south **coast**, with a market square, mill, chapel, two farm fields, a tidal forage grove, and one home per agent.
- Agents **`TRAVEL`** between zones; each zone *affords* a subset of actions (you must be at a farm to `WORK_PLOT`/`HARVEST`, at the harbour to `FISH`, at a forage zone to `FORAGE`, at the mill to `MILL`, at the market to trade).
- **`SAY` is local** — heard only within `sayRadius` tiles, not city-wide. This is both realism and the run-01 homogenisation fix.
- To stay cheap on small models, agents see only zone **names** (never coordinates or a map), and a 3-line `WHERE` block.

The six workplaces stay narrative in flavour (Tessa's bakery, Bram's surgery, …) but now also have grid homes.

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
- **Spatial layer is optional.** The aspatial default keeps everyone in earshot; the opt-in ocean-town mode adds a grid, movement, and local `SAY` (see above and [ADR 012](../decisions/012-ocean-town-spatial-capabilities-economy.md)).
- **Bounded social graph.** 6 nodes → 15 possible pairs. Tractable for offline observer analysis.

## What the city is *not*

- **Not a village.** That was the prior MVP. See [../decisions/009-city-capitalism-christian-pivot.md](../decisions/009-city-capitalism-christian-pivot.md).
- **Not a multi-regime sweep.** Capitalism is the only regime studied in v2.
- **Not a multi-faith experiment.** Christianity + a few atheists. The True Vine reform branch was retired in the pivot.
