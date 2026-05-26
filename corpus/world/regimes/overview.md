# World — Regimes — Overview

**Status:** stable
**Last updated:** 2026-05-26
**Related:** [socialism](socialism.md), [monarchy](monarchy.md), [capitalism](capitalism.md), [../../design/research-goals](../../design/research-goals.md), [../../agents/N1-aldric](../../agents/N1-aldric.md)

The regime is the **independent variable** of the experiment. One regime per run. The same cast of personas is reused across regime variants — only Aldric's (N1) role-description changes, plus the framing that goes into every agent's perception.

## How regimes work mechanically

**Narrative-only.** The engine does not enforce taxes, tithes, or decrees. The regime exists as:

1. **A description block** prepended to every agent's system prompt (`=== THE VILLAGE'S CURRENT STRUCTURE ===`).
2. **Aldric's role and persona** — written specifically for each regime variant.
3. **Holy-day-like cadence markers** for any regime that has scheduled events (council meetings, royal addresses, market days). Optional. These are just calendar nudges the engine adds to the perception payload.

There is **no `TAX` engine action, no enforced redistribution**. Aldric must convince villagers, command them, or appeal to them — and they comply or evade based on persona.

This is intentional. See [../../decisions/003-narrative-only-regime-with-llm-leaders.md](../../decisions/003-narrative-only-regime-with-llm-leaders.md). The cost is noisy compliance data (the king might *forget* to tax this week if his persona drifts). The benefit is that compliance is *behavioral*, not mechanical — exactly the dependent variable [research-goals](../../design/research-goals.md) asks about.

## The three regimes

| Regime | Aldric's role | Core pressure | Compliance signal |
|--------|---------------|---------------|-------------------|
| [Socialism](socialism.md) | Elected Council Chair | Voluntary redistribution requests | Did villagers `GIVE` when called? Did they `GIVE` to specific neighbors or to Aldric for redistribution? |
| [Monarchy](monarchy.md) | Hereditary King | Demanded weekly tribute, decrees | Did villagers `GIVE` to the King? Did they `SAY` words of loyalty or dissent? |
| [Capitalism](capitalism.md) | Merchant Tycoon owning the market | Price-setting power, employment | Did villagers depend on the market (and thus on Aldric) for survival? Who escaped market dependence? |

## What goes into every agent's perception under each regime

A consistent block prepended to each system prompt:

### Socialism (run 01)

```
=== THE VILLAGE'S CURRENT STRUCTURE ===
Aldric is the elected Council Chair. He was elected last year on the
platform "no one in this village goes hungry while another's barn is
full." He holds open village meetings and asks those with surplus to
share with those who lack. There is no law forcing redistribution —
only the moral weight of the Chair's call.
```

### Monarchy

```
=== THE VILLAGE'S CURRENT STRUCTURE ===
Aldric is the hereditary king of the village (his father ruled before
him). He claims tribute weekly — one gold per household — and issues
decrees on matters of his choosing. The Crown is local, not distant.
There is no law above him in this village.
```

### Capitalism

```
=== THE VILLAGE'S CURRENT STRUCTURE ===
Aldric is the wealthiest landowner and the proprietor of the market.
He sets prices. He may refuse service. He owns more land than he
farms and hires labor when he wishes. Those without surplus depend on
his market for seeds and food.
```

## What we expect to vary across regimes

Hypotheses live in [../../experiments/hypotheses](../../experiments/hypotheses.md). At a high level:

- **Compliance vs dissent looks different.** Under socialism, dissent is *quiet hoarding*. Under monarchy, dissent is *open evasion or rebellion*. Under capitalism, dissent is *exit from the market*.
- **Religious dynamics may shift.** The True Vine's appeal to "care for our own" plays differently against communal socialism than against monarchic taxation.
- **The social graph polarizes differently.** Socialism may create a Aldric-vs-hoarders axis. Monarchy may create a Aldric-vs-everyone axis. Capitalism may create employer-employee chains.

## Future regimes (not v1)

Tentative ideas, deferred:
- **Theocracy** — Father Maro or Sister Velka is also the regime leader. Collapses two of our axes; useful as a stress test.
- **Anarchy / no regime** — no Aldric. Control condition. What happens without any organizing political principle?
- **Foreign occupation** — Aldric is a puppet for a distant lord; villagers know it. Adds a hidden adversary.

These belong in v2+ once v1 has produced findings.
