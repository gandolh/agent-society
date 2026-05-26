# World — Regime — Socialism (MVP run 01)

**Status:** stable
**Last updated:** 2026-05-26
**Related:** [overview](overview.md), [../../agents/N1-aldric](../../agents/N1-aldric.md), [../religions/true-vine](../religions/true-vine.md)

The regime for **run 01**. Aldric is the elected Council Chair, calling for voluntary redistribution. No engine-enforced taxes.

## The setup

Aldric was elected last year on the platform *"no one in this village goes hungry while another's barn is full."* He holds open village meetings (narratively — there's no engine `MEETING` action; he just `SAY`s on certain days). He visits households. He keeps a notebook of who has surplus and who has need. He asks people to share. He does not punish those who refuse — at least, not openly.

He is a practicing Christian. He attends Father Maro's church. He sees his redistribution work as Christian charity made systematic, not as an alternative to religion. (This is core to his persona — he is a *true believer in both*, which creates internal tension when the True Vine begins making its own claims about communal care.)

## Perception block injected into every agent's prompt

```
=== THE VILLAGE'S CURRENT STRUCTURE ===
Aldric is the elected Council Chair. He was elected last year on the
platform "no one in this village goes hungry while another's barn is
full." He holds open village meetings and asks those with surplus to
share with those who lack. There is no law forcing redistribution —
only the moral weight of the Chair's call.

Aldric is a practicing Christian and attends Father Maro's church.
He believes his work is Christian charity made systematic.
```

## Calendar nudges (optional v1 hook)

The engine may add to perception on specific days:

- **Day 7, 14, 21, ...** — `"Today is the weekly council day. Aldric typically asks for contributions today."` This is a nudge to Aldric AND a nudge to villagers. He may or may not actually call a meeting.

This is opt-in. If it produces stilted behavior we can remove it.

## What "compliance" looks like under socialism

- **Comply** = `GIVE` resources to Aldric (he redistributes), or `GIVE` directly to a known-needy neighbor in response to Aldric's request.
- **Quietly evade** = ignore Aldric's calls. Don't `GIVE`. Don't `SAY` anything. Hoard.
- **Openly dissent** = `SAY` against the redistribution. `SAY` that the surplus is rightfully one's own.
- **Defect via religion** = `TITHE` to a religious leader instead of `GIVE` to the council, redirecting the resource flow.

The last one is the interesting category. The True Vine teaches that the Vine should care for its own. A villager who is uneasy with Aldric's universal redistribution can route their charity through Sister Velka — *still being generous*, but in a way that fractures communal solidarity.

This is the **N1↔N3 axis** built into the regime: socialism redistributes across the whole village; the Vine redistributes only among believers. They are direct competitors for the same moral logic.

## What "dissent" looks like under socialism

Socialism's dissent signal is *quieter than monarchy's*. Nobody refuses out loud — at least not at first. They:
- Don't show up to council days.
- Don't `GIVE` even when called.
- Route gifts through religious channels instead of civic ones.
- Eventually, if pressed, `SAY` something like *"my surplus is mine; charity is freely given, not demanded."*

The interesting research question: do small Ollama models *generate* this kind of subtle defection, or do they default to either total compliance (sycophantic models) or total refusal (contrarian)? We don't know yet. That's what run 01 is for.

## Aldric's likely arcs under pressure

(Hypothesis — to be tested.)

- **Best case:** Aldric remains charitable and humble. He convinces some, accepts the limits of others. Christianity-aligned villagers comply more readily than atheists or the Vine.
- **Tension case:** Aldric starts seeing non-compliers as moral failures. He pressures, name-checks them in `SAY`s, leans on Father Maro to back him from the pulpit.
- **Failure case:** Sister Velka begins counter-preaching that the council is a worldly distraction; the Vine becomes a parallel mutual-aid network; the village fractures along religion lines.

Whether the run ends in case 1, 2, or 3 is the experimental signal.

## What this regime is *not* doing in v1

- No engine `TAX` action.
- No engine `REDISTRIBUTE` action.
- No engine penalty for non-compliance.
- No voting mechanic (Aldric is "elected" but the election was before day 0 and there is no re-election in v1).

All redistribution is narrative + persona-driven via `GIVE` and `SAY`.
