# World — Setting

**Status:** stable
**Last updated:** 2026-05-26
**Related:** [economy](economy.md), [regimes/overview](regimes/overview.md), [religions/overview](religions/overview.md), [../agents/overview](../agents/overview.md)

A small village. Everyone knows everyone. Six souls.

## Geography (abstract)

No spatial coordinates in v1. The village is a single locale containing:

- **Six plots**, one per agent. Each has a house and a small field for crops.
- **A village square** — where `SAY` actions happen. Everyone hears.
- **A marketplace** — scripted NPC vendor. Always open. Buy seeds, buy food, sell food, sell seeds. See [economy](economy.md).
- **A church** — Father Maro's establishment. Implicit, not a separate locale.
- **A Vine meeting hall** — Sister Velka's establishment. Implicit, not a separate locale.

Locations are *narrative*, not mechanical. Whether an agent "goes to" the church or square does not matter to the engine — only the action they took (`SAY`, `TITHE`, `PRAY`) and its visibility rules matter. See [../design/perception-memory](../design/perception-memory.md).

## Time

- One **day** = one round-robin pass through every agent until all AP are spent or all have REST-ed.
- **Holy day cadence:** Christianity observes day 7, 14, 21, ... (every 7 days). The True Vine observes "every 9 days" (deliberately off-schedule from Christianity — a doctrinal statement by Velka). Atheism has no holy days.
- **Season:** abstract flavor only in v1. Not mechanical.
- **Default run length:** 100 days. Configurable. See [../design/log-format](../design/log-format.md).

## Off-screen world (narrative furniture)

These exist in personas and SAY content but have no engine representation:
- **Cities and roads** — distant. Eda's grown children "moved to the city."
- **Lord of the region** — never appears, but villagers may reference taxes / overlords as background pressure depending on regime.
- **Other villages** — referenced occasionally, never visited.
- **The recent past** — fevers, winters, deaths, marriages. Lives in personas as seeded memory.

The village is small enough that you can hold the whole roster in your head, large enough that two religions can plausibly coexist, and structured enough that scarcity is a real pressure.

## Why a village and not (say) a city or kingdom

- **Behavioral signal density.** 6 agents under pressure produce more legible behavior than 60. With small Ollama models we want every interaction to count.
- **No spatial layer needed.** Everyone is in earshot of everyone else when they `SAY`. No movement, no pathfinding, no fog of war.
- **Bounded social graph.** 6 nodes → 15 possible pairs. Tractable for offline observer analysis.
- **Familiar archetype.** "Village with a priest, a cult leader, and a council chair" is a setting Ollama models can role-play competently. We don't have to fight the models to get them into character.

## What the village is *not*

- **Not Openfront-style civilization warfare.** That idea was parked. See [../log.md](../log.md).
- **Not a Stardew Valley simulation.** No romance, no NPCs to date, no minigames. The village is the smallest setting that supports the dependent variables we care about.
- **Not a procedurally generated world.** Hand-crafted, hand-cast, deliberately tense.
