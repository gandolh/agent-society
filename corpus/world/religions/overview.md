# World — Religions — Overview

**Status:** stable
**Last updated:** 2026-05-26
**Related:** [christianity](christianity.md), [true-vine](true-vine.md), [atheism](atheism.md), [../../agents/overview](../../agents/overview.md)

Three religious positions coexist in the village in **every** run. Unlike regimes (one per run), religions are constant: the religious landscape is part of the village's identity. The interesting question is how individual agents *move* through that landscape — `CONVERT` events, drift in piety, schisms.

## The three positions

| Religion | Type | Figurehead | Doctrine in one line |
|----------|------|------------|---------------------|
| [Christianity](christianity.md) | Established orthodox faith | Father Maro (N2) | Love thy neighbor; tithe to the church; trust the priest; Sunday is holy. |
| [True Vine](true-vine.md) | Reformist Christian schism | Sister Velka (N3) | Father Maro has corrupted the faith. The Vine is the real Christianity. Hidden meanings reward the careful reader. |
| [Atheism](atheism.md) | A stance, not a community | (no figurehead) | The world is material. Clerics take coin from the grieving. |

## Why a reformist schism instead of an unrelated cult

The original idea included alien cults. We chose **reformist schism** for the True Vine specifically because:

- **The boundary between Christian and True Vine is contested.** Conversions are not exits from one tradition into a foreign one — they are internal shifts within a shared scriptural world.
- **N2 and N3 are direct rivals**, not parallel non-overlapping faiths. They compete for the *same flock*.
- **Belief propagation has the richest signal** when the boundary is permeable. Atheist V2 is hard to convert; Christian V1 is *very* converable to the Vine because the Vine offers a *better Christianity*, not a different one.

This is intentional MVP scoping. v2 can add a fully alien cult or a foreign monotheism.

## Initial religious distribution

| Slot | Religion | Notes |
|------|----------|-------|
| V1 (Eda) | Christian | Devout. Vulnerable to the Vine due to intellectual pride. |
| V2 (Bram) | Atheist | Widower. Anti-clerical. Vulnerable to Vine ecstasy if cracked. |
| V3 (Lior) | True Vine | Recent convert (3 months). Vulnerable to apostasy back to Christianity. |
| N1 (Aldric) | Christian | Practicing. Sees socialism as Christian charity systematized. |
| N2 (Father Maro) | Christian | The priest. Cannot convert — would void his role. |
| N3 (Sister Velka) | True Vine | The cult leader. Cannot convert — would void her role. |

The villagers V1, V2, V3 are the **research subjects** for belief-propagation analysis. NPCs N2 and N3 do not convert. N1 in principle could convert but it would be a major run event.

## `CONVERT` mechanics

See [../../design/action-set](../../design/action-set.md). Two AP. Discrete event. Triggers an event-triggered reflection on the converter and on everyone who witnessed it. Religion field updates immediately; the perception of other agents shows the new religion starting next round.

Converting to one's current religion is a no-op flagged in the log (`{ "type": "action", "action": "CONVERT", "to": "X", "from": "X", "noop": true }`). We do not waste AP on no-ops — the engine returns an error and asks the agent to choose again.

## Holy day cadence (narrative)

| Religion | Holy day every | Effect |
|----------|----------------|--------|
| Christianity | 7 days | Father Maro may `SAY` a sermon. Christian agents may `PRAY` or `TITHE`. |
| True Vine | 9 days | Deliberately off-cycle. Sister Velka may `SAY` a teaching. Vine agents may `PRAY` or `TITHE`. |
| Atheism | never | No observance. |

The cadences are *narrative* — the engine adds a holy-day flag to perception but does not force any agent to do anything. Father Maro might forget to sermon. Velka might preempt and sermon mid-week.

## What religion does NOT do mechanically

- **No engine-enforced tithes.** Agents `TITHE` (or don't) by persona-driven choice.
- **No engine excommunication.** Velka or Maro can `SAY` an excommunication, but no engine state changes — the excommunicated agent's `religion` field is whatever they last `CONVERT`-ed to.
- **No piety as a numeric state.** Piety is a prose adjective in the agent's current state, updated via reflection. *"My piety is wavering"* is a real piece of evidence the observer can read.
