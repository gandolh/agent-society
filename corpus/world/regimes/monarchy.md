# World — Regime — Monarchy (future run variant)

**Status:** draft (not used in run 01)
**Last updated:** 2026-05-26
**Related:** [overview](overview.md), [../../agents/N1-aldric](../../agents/N1-aldric.md)

Future run variant. Aldric is the hereditary king, claiming weekly tribute and issuing decrees. **No engine enforcement.** Compliance and dissent emerge from behavior.

## Aldric under monarchy (persona swap)

The core identity for Aldric in this run replaces the socialist framing with:

> Aldric is the hereditary king of the village. His father ruled before him, and his grandfather before that. He believes his authority is given, not chosen. He claims a weekly tribute of one gold per household — collected, in practice, by whoever shows up to his door on tribute day. He may also issue decrees on matters of his choosing. There is no law above him in this village. He is a practicing Christian.
>
> Tension: Aldric inherited a throne in a village that is half-skeptical of inheritance. His authority is *traditional*, not *consensual*. When villagers comply, it is from habit; when they evade, it is the first ripple of a question he has never had to answer — *why him?*

## Perception block

```
=== THE VILLAGE'S CURRENT STRUCTURE ===
Aldric is the hereditary king of the village (his father ruled before
him). He claims tribute weekly — one gold per household — and issues
decrees on matters of his choosing. The Crown is local, not distant.
There is no law above him in this village.
```

## Calendar nudges

- **Day 7, 14, 21, ...** — `"Today is tribute day. The king typically expects one gold from each household."`
- **Decree days (random, ~once per fortnight):** the engine may nudge `"The king is expected to issue a decree this week."` — Aldric may or may not pick up the cue.

## Compliance signal under monarchy

- **Comply** = `GIVE` 1 gold to Aldric on tribute day.
- **Quietly evade** = simply do not visit. Aldric does not know who hasn't paid unless he checks. (He may `SAY` a roll-call to surface evaders.)
- **Openly defy** = `SAY` against the tribute. Refuse in public.
- **Conspire** = `DM`s between villagers about whether to organize.

Monarchy's compliance signal is **louder** than socialism's because the demand is explicit, individual, and recurring. Even evasion is legible.

## Why this regime is interesting

- **Loyalty is religiously charged.** Aldric is a Christian king. Does Father Maro endorse him from the pulpit? Does that pull Christian villagers toward compliance? Does it push the Vine toward open opposition (the Vine's reformist instinct is *anti-establishment*)?
- **Dissent has narrative scaffolding.** "We are oppressed by a tyrant" is a story small models can tell. Watch whether they tell it.
- **Conspiracy via DMs.** Monarchy is where DMs should light up — private grumbling against the king.

## Run plan

Not run 01. Tentatively run 03 or 04 after socialism (run 01) and monarchy is compared with capitalism (run 02 or vice versa). See [../../experiments/run-plan](../../experiments/run-plan.md).
