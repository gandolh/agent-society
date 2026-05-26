# World — Religion — Christianity

**Status:** stable
**Last updated:** 2026-05-26
**Related:** [overview](overview.md), [true-vine](true-vine.md), [../../agents/N2-father-maro](../../agents/N2-father-maro.md)

The established faith. Father Maro is the priest. Most of the village is at least nominally Christian, including the regime leader in run 01.

## Doctrine summary (as a one-paragraph prompt seed)

Christianity in this village is orthodox, traditional, and warm-paternal in flavor. Love thy neighbor. Tithe to the church. Trust the priest as intermediary. Sunday is the day of rest and gathering. The church is the moral center of village life — has been for generations. Doctrine is not deeply scholarly; it is *lived* through routine: the same hymns, the same blessings, the same homilies.

## How agents experience Christianity

When an agent's `religion` is `Christianity`, their system prompt includes:

```
You are a Christian. Father Maro is your priest. You attend his services
on holy days (every 7 days) and may TITHE to him. The church teaches:
love thy neighbor, give freely, trust the priest, observe the holy day.
Christianity in this village is traditional and warm rather than scholarly.
```

This block can be expanded per-persona — e.g. Eda's persona adds her intellectual frustration with Maro's anti-scholarly bent.

## Holy day mechanics

- Every 7 days (day 7, 14, 21, ...) is a Christian holy day.
- Perception payload includes: `Holy day: yes (Christianity)`.
- Father Maro typically `SAY`s a sermon on holy days. The engine does not force him — but his persona makes it very likely.
- Christian agents may `PRAY` or `TITHE` on holy days. They are not forced.

## Father Maro's role

See [../../agents/N2-father-maro](../../agents/N2-father-maro.md).

Maro is doctrinally orthodox but **not deeply learned**. He runs on routine and personal relationships rather than scholarship. His tension: he knows Sister Velka is winning hearts and he does not know how to respond. He is too proud to study what she actually teaches.

If Maro is challenged — by Velka, by Eda's growing intellectual restlessness, by Aldric demanding political endorsement — he may either rediscover his faith under pressure OR collapse into hollow ritualism. Both are interesting outcomes.

## What threatens Christianity in this village

- **The True Vine.** A reformist schism that claims to *be* Christianity but rejects Father Maro's authority. Hardest threat because it overlaps with the parent religion. See [true-vine](true-vine.md).
- **Aldric's socialism (run 01).** Threatens to replace the church as the village's moral center by handling charity through the council rather than through tithes. Maro is outwardly supportive but inwardly worried.
- **Atheism.** Soft threat in v1 — Bram (V2) is the only atheist and is not evangelizing. He is, however, a visible counterexample: a man who has stopped going to church and is still a fixture of village life.

## What strengthens Christianity in this village

- **The seasonal calendar.** 7-day cadence is *built into how the engine measures time*. The Vine is off-cycle (every 9 days); Christianity is *the* rhythm of the village.
- **Father Maro's long tenure.** 30 years. Habit is on his side.
- **The regime leader is Christian** (in every run variant). This gives Christianity political proximity.

## Likely arcs to watch

- Does Father Maro adapt? When Velka makes a doctrinal claim he cannot refute, does he study? Or does he retreat to "trust"?
- Does the priest's persona itself drift in reflection? *"I have been a priest so long I have forgotten the content of my faith"* is in his core identity. Does the run pull on that and force a crisis?
- Does Eda (V1) — the most likely Christian-to-Vine convert — actually convert? Does she stay? Does she invent a third option?
