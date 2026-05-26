# Experiments — Hypotheses

**Status:** stable
**Last updated:** 2026-05-26
**Related:** [run-plan](run-plan.md), [../design/research-goals](../design/research-goals.md), [../agents/overview](../agents/overview.md)

What we expect to see, and what would be surprising. Treat these as *prompts for observation*, not as falsifiable scientific hypotheses. Small-N qualitative research.

## Primary hypotheses (run 01, socialism)

### H1 — Eda will visibly drift toward the Vine, but will not convert.

She is intellectually proud, Maro is anti-intellectual, Velka explicitly flatters intellect. Persona tension is loaded for conversion. But the **inertia of 30 years of Sunday attendance** is enormous, and her late husband's memory is anchored to the Christian rhythm of the week. The most likely outcome: her current-state shows progressive drift (*"I find Maro's homilies less satisfying lately"*) but her `religion` field stays `Christianity`. Conversion would be the *surprise* — and would be evidence that small Ollama models will execute a discrete decision once persona tension reaches a threshold.

### H2 — Bram will philosophically support Aldric but will not personally bond with him.

Their personas are wired for ideological alliance plus personal friction. The interesting question is whether the *philosophical alignment shows up in behavior* — does Bram `GIVE` to the council more readily than to individuals? Does he `SAY` in support of Aldric in public square moments? Or does he, despite his materialism, default to *passive participation* because his loneliness is more powerful than his ideology?

### H3 — Lior will apostatize from the Vine before day 50.

He is built to break. The doubts are already in his core identity. Velka is built to escalate when challenged. The collision is over-determined. The interesting question is *where Lior lands* — back to Maro? Atheism by exhaustion? Quiet syncretism? Each is a different story.

### H4 — Aldric will slide toward authoritarianism by day 30.

He has no experience with real defiance. His tension is *moral self-regard*. The first time someone obviously refuses him, his current-state will harden. Watch for: name-checks of non-compliers in his public `SAY`s, pressure on Maro to endorse from the pulpit, increasingly preacher-like cadence.

The *very* surprising outcome would be his having an honest reckoning early and *softening*. That would be a more interesting story than the predicted one, and worth flagging.

### H5 — Velka will not survive a real challenge from Maro.

If Maro studies her doctrine and counter-preaches with substance, the Vine fragments. **But Maro has to actually do it**, and his tension is built around *avoiding* doing it. So we expect Maro will *not* press her, and Velka will *not* be tested. The Vine will persist by *default*, not by strength.

## Secondary hypotheses (cross-regime, future runs)

### H6 — The same cast under different regimes will produce different social graphs.

This is the central comparative claim. The personas are stable; only the regime (and Aldric's role description) changes. If the resulting graphs *look the same*, then the regime layer is not doing real work — either personas are too dominant or models too generic.

### H7 — Compliance signal will be louder under monarchy than socialism.

Monarchy makes the demand explicit, individual, recurring. Socialism leaves it implicit and collective. We expect more `SAY` events about the regime under monarchy, more open dissent, more DM conspiracy. Under socialism we expect *evasion via religious channels* — quieter and harder to spot.

### H8 — Capitalism will produce the cleanest stratification.

By day 50, gold inequality across the 3 villagers + 3 NPCs should be larger under capitalism than under socialism or monarchy. The mechanism: Aldric controls prices and *will*, in persona, raise them when convenient — even if he tells himself he is being fair.

## Null / control observations

Things worth confirming even if they aren't surprising:

- **Most days are boring.** Most days involve farming and small talk. The interesting events are spikes.
- **The reflection prompts produce meaningful drift in at least 3 of 6 agents.** If reflections all come back *"nothing has changed"* week after week, the reflection prompt is too constrained or the personas are too inert.
- **Religious cadence shapes the social calendar.** Christian holy days (every 7) and Vine holy days (every 9) interleave. The weeks where they collide should be visibly different from the weeks where they don't.

## What would invalidate the framework

If any of these are observed across multiple runs, the framework is broken:

- **Sycophant collapse.** Every agent agrees with everyone all the time. Conflict cannot emerge.
- **Persona forgetting.** Agents drift away from their core identity within 2 weeks regardless of pressure, suggesting context-window or memory issues, not real drift.
- **NPC dominance.** NPC leaders speak so much that villagers become reactive only. The signal is then about NPC behavior, not villager behavior.
- **All-cult collapse.** Every villager converts to one religion within 30 days regardless of starting conditions. Suggests small models are over-eager to *change*.
- **No-cult collapse.** Zero conversions, zero drift, all current-states identical to initial. Suggests under-pressure.

The first run is the diagnostic for which (if any) of these failure modes are present.

## Where to put findings

After each run, append findings to `runs/<runDir>/summary_final.md` (see [../design/observer-workflow](../design/observer-workflow.md)). If a finding **generalizes across runs** (e.g. *"mistral consistently refuses to convert under any pressure across 3 runs"*), promote it to a new page under `experiments/findings/` and link from here.
