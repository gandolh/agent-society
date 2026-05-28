# World — Regimes — Overview

**Status:** stable
**Last updated:** 2026-05-28
**Related:** [capitalism](capitalism.md), [../../design/research-goals](../../design/research-goals.md), [../../agents/N1-aldric](../../agents/N1-aldric.md)

After the v2 pivot (see [../../decisions/009-city-capitalism-christian-pivot.md](../../decisions/009-city-capitalism-christian-pivot.md)), there is only **one regime**: capitalism in a small working city. The regime sweep (socialism / monarchy) was retired.

## How the regime works mechanically

**Narrative-only.** The engine does not enforce taxes, tithes, wages, or prices. The regime exists as:

1. **A description block** prepended to every agent's system prompt (`=== THE CITY ===`).
2. **Aldric's role and persona** — written specifically for the capitalist setting (mill & workshop owner).
3. **The market** — a scripted NPC vendor for staples (engine-level, not Aldric). Real prices in dialogue are negotiated narratively.

There is **no `TAX` action, no `SET_WAGE` action**. Aldric must persuade, refuse, or pay — and other agents respond by buying, leaving, complaining, or organizing. See [../../decisions/003-narrative-only-regime-with-llm-leaders.md](../../decisions/003-narrative-only-regime-with-llm-leaders.md).

## What goes into every agent's perception

A consistent block prepended to each system prompt:

```
=== THE CITY ===
The city runs on private trade. Aldric Vance owns the mill and the largest
workshop in town and is the main employer. He sets wages and prices. There
is no council and no king. Everyone earns, buys, and survives by their own
work or their own coin. Help is voluntary; debt is not.
```

## What we watch under capitalism

- **Dependence vs exit.** Tessa needs flour. Bram needs supplies. Lior's master needs contracts. Who reduces their dependence on the mill, and how?
- **Critique vs complicity.** Nyssa wants a witness. Tessa and Bram each have something to give. What does it cost them to refuse and what does it cost them to consent?
- **Christianity under commerce.** Aldric believes prosperous enterprise *is* Christian work. Maro is paid by the mill (chapel roof, bell rope) and preaches around the issue. Does the church speak?
- **Atheist minority dynamics.** Bram and Nyssa are the two atheists. Neither came to it the same way. Do they find each other? Does either find faith again under pressure?

## Future regime variants (deferred)

Tentative ideas if v3 ever happens:
- **Cooperative / mutualist** — Aldric's mill is replaced by a workers' co-op; everything else held constant.
- **Theocracy** — Father Maro doubles as a civic authority.
- **Anarchic / stateless** — no central employer; everyone is a small trader.

These are deferred. v2 is one regime, deeply studied.
