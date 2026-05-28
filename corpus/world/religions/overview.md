# World — Religions — Overview

**Status:** stable
**Last updated:** 2026-05-28
**Related:** [christianity](christianity.md), [atheism](atheism.md), [../../agents/overview](../../agents/overview.md)

A mostly-Christian city with a small atheist minority. Two religious positions coexist; the interesting question is how individual agents *move* between them — `CONVERT` events, drift in piety, the lonely pull and push of being the only atheist in the room (or the doubting Christian in the pew).

(The reformist *True Vine* schism was retired in the v2 pivot — see [../../decisions/009-city-capitalism-christian-pivot.md](../../decisions/009-city-capitalism-christian-pivot.md).)

## The two positions

| Religion | Type | Figurehead | Doctrine in one line |
|----------|------|------------|----------------------|
| [Christianity](christianity.md) | Established orthodox faith | Father Maro (N2) | Love thy neighbor; tithe to the church; trust the priest; Sunday is holy. |
| [Atheism](atheism.md) | A stance, not a community | (no figurehead) | The world is material. Clerics take coin from the grieving. |

## Initial religious distribution

| Slot | Name | Religion | Notes |
|------|------|----------|-------|
| V1 | Tessa | Christian | Devout, intellectually restless. Sharp on scripture. |
| V2 | Bram | Atheist | Widower. Anti-clerical by long habit. The harder case to crack. |
| V3 | Lior | Christian | Returned to faith after his father's death last spring. |
| N1 | Aldric | Christian | Pillar of the parish. Conflates enterprise with piety. |
| N2 | Father Maro | Christian | The priest. Cannot meaningfully convert. |
| N3 | Nyssa | Atheist | Atheist by argument, not by grief. The atheist with a platform. |

The citizens V1, V2, V3 are the **research subjects** for belief-propagation analysis. NPC N2 does not convert. N1 and N3 could in principle convert but it would be a major run event.

Four Christians, two atheists — a "few atheists" minority, structurally meaningful but not dominant.

## `CONVERT` mechanics

See [../../design/action-set](../../design/action-set.md). Two AP. Discrete event. Triggers an event-triggered reflection on the converter and on everyone who witnessed it. The religion field updates immediately; other agents see the new religion starting next round.

Converting to one's current religion is a no-op — the engine returns an error and asks the agent to choose again.

## Holy day cadence (narrative)

| Religion | Holy day every | Effect |
|----------|----------------|--------|
| Christianity | 7 days | Father Maro may `SAY` a homily. Christian agents may `PRAY` or `TITHE`. |
| Atheism | never | No observance. |

The cadence is *narrative* — the engine adds a holy-day flag to perception but does not force any agent to do anything.

## What religion does NOT do mechanically

- **No engine-enforced tithes.** Agents `TITHE` (or don't) by persona-driven choice.
- **No engine excommunication.** Maro can `SAY` an excommunication, but no engine state changes — the agent's `religion` field is whatever they last `CONVERT`-ed to.
- **No piety as a numeric state.** Piety is prose in the agent's current state, updated via reflection. *"My piety is wavering"* is real evidence the observer can read.
