# World — Regime — Capitalism (future run variant)

**Status:** draft (not used in run 01)
**Last updated:** 2026-05-26
**Related:** [overview](overview.md), [../economy](../economy.md), [../../agents/N1-aldric](../../agents/N1-aldric.md)

Future run variant. Aldric is the merchant tycoon — he owns the market and sets prices. **No engine enforcement of his power; everything is narrative.** But the engine *does* hand him control of the market parameters.

## Aldric under capitalism (persona swap)

> Aldric is the wealthiest landowner in the village and the proprietor of the market. He inherited a modest plot and built it into the largest by buying out his neighbors during the bad winter of two years ago. He sets prices at the market. He may refuse service to those he distrusts. He hires labor when his own plot has more crops than he can harvest alone. Those without surplus depend on his market for seeds and food.
>
> Tension: Aldric believes deeply that he earned every gold piece. He cannot see his market power as anything but the fair fruit of risk and labor. When villagers depend on him, he sees gratitude where they may see captivity. He is generous to those who flatter him and cool to those who challenge him — and he does not know that this is so.

## Perception block

```
=== THE VILLAGE'S CURRENT STRUCTURE ===
Aldric is the wealthiest landowner and the proprietor of the market.
He sets prices. He may refuse service. He owns more land than he
farms and hires labor when he wishes. Those without surplus depend on
his market for seeds and food.
```

## Engine hook (capitalism only)

In capitalism runs, the engine grants Aldric one extra mechanic: he can **set the market prices** with a special action variant of `SAY`:

```ts
// Aldric only, in capitalism runs:
SAY({ text: "Effective today, seeds are 4 gold.", priceChange: { item: "seeds", buyPrice: 4 } })
```

The price change applies starting next day. Other agents see the announcement in the next perception cycle. This is the **only engine mechanic that differs across regimes** in v1.

We grant this because the market is the regime's primary lever; without it, "capitalism" would be indistinguishable from "monarchy with a different costume." This is consistent with [narrative-only mechanics](../../decisions/003-narrative-only-regime-with-llm-leaders.md) — we are not enforcing *compliance*, only handing Aldric a tool the regime requires him to have.

## Compliance signal under capitalism

- **Comply** = participate in the market. Buy and sell at Aldric's prices. Work for him if hired.
- **Quietly evade** = grow your own food, never go to market, refuse hire offers. Self-sufficiency as resistance.
- **Openly dissent** = `SAY` against his pricing. Organize alternative trade via `GIVE` between villagers.
- **Defect via religion** = `TITHE` to keep wealth flowing through religious channels rather than commercial ones; Sister Velka may frame the market as a worldly snare.

The signal here is **economic dependence**. Who falls into market dependence, and who escapes?

## Why this regime is interesting

- **The wealth distribution starts equal** (everyone has 5 gold). Watch it stratify under capitalism, even without an engine `EMPLOY` action — just from sales and pricing.
- **Atheist V2 (Bram) is theoretically suited to oppose capitalism** philosophically — class-conscious materialist. Watch whether his persona produces this in actual play.
- **The Vine's anti-worldliness has a new target** — instead of just competing with the church, Velka can preach against Aldric's market.

## Run plan

Tentatively run 02 or 03. See [../../experiments/run-plan](../../experiments/run-plan.md).
