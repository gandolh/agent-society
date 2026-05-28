# World — Regime — Capitalism (the only regime in v2)

**Status:** stable
**Last updated:** 2026-05-28
**Related:** [overview](overview.md), [../setting](../setting.md), [../economy](../economy.md), [../../agents/N1-aldric](../../agents/N1-aldric.md)

The only regime in v2. A small working city. Private trade is the medium of survival.

## Aldric Vance — the industrialist

> Aldric Vance, late 40s, owns the city's mill and the largest workshop in town. He inherited the mill at thirty-one and tripled the workshop. He employs ~60 people in a city of ~3,000. He sets wages in his own house and prices on his own goods. He attends Father Maro's Sunday service from the front pew and pays for the chapel roof. He considers prosperous enterprise *Christian* work.

See [../../agents/N1-aldric](../../agents/N1-aldric.md) for the full persona.

## Perception block (every agent's system prompt)

```
=== THE CITY ===
The city runs on private trade. Aldric Vance owns the mill and the largest
workshop in town and is the main employer. He sets wages and prices. There
is no council and no king. Everyone earns, buys, and survives by their own
work or their own coin. Help is voluntary; debt is not.
```

## What's mechanical vs narrative

- **Mechanical.** The marketplace (food + materials) is a scripted NPC vendor at fixed prices. Hunger and AP penalties are engine-enforced. Everything else is dialogue.
- **Narrative.** Aldric's wages, his flour price to Tessa, the mill injuries Bram sees, Nyssa's piece, Lior's pew project. These exist in `SAY`/`DM`/`GIVE` interactions, not in special verbs.

There is **no `SET_PRICE` action**. If Aldric wants to raise the flour rate, he says so in dialogue. If Tessa wants to push back, she says so. The engine only moves resources via `GO_TO_MARKET` (scripted vendor) and `GIVE` (unilateral).

## What we watch

- **Dependence.** Who depends on the mill — Tessa for flour, Halim (off-screen) for repair contracts, Lior indirectly via his master.
- **Voice.** Nyssa is the press. Does she get a named witness? Tessa (credibility) and Bram (evidence) are the two candidates.
- **Pulpit.** Maro takes Aldric's money for the chapel and preaches around the issue. Does he ever name it?
- **Atheist minority.** Bram and Nyssa are the only atheists. Do they find each other? Does pressure change either of them?
- **Christian conscience.** Aldric believes he is a good Christian. So do Tessa and Maro. They mean different things by it. Does that fracture become visible?

## Why this regime is interesting

- **Mostly-Christian society + capitalism is a real historical configuration.** Lots to draw on; lots of small frictions the models will reach for.
- **Diverse jobs make economic chains legible.** Tessa needs Aldric's flour; Bram patches Aldric's workers; Lior's contracts come from Aldric; Nyssa's paper depends on Aldric's advertising. Six agents, one knot.
- **No engine compliance ⇒ behavior is the signal.** What the agents *do* — give, refuse, speak, withhold — is what we measure.
