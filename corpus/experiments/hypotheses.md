# Experiments — Hypotheses

**Status:** stable
**Last updated:** 2026-05-28
**Related:** [run-plan](run-plan.md), [../design/research-goals](../design/research-goals.md), [../agents/overview](../agents/overview.md), [../runs/2026-05-26_socialism_run01-summary](../runs/2026-05-26_socialism_run01-summary.md)

What we expect to see, and what would be surprising. Treat these as *prompts for observation*, not as falsifiable scientific hypotheses. Small-N qualitative research.

> **v1 → v2.** The original hypotheses (H1–H8 below were Eda / True Vine / socialism-vs-monarchy specific) were retired with the [v2 pivot](../decisions/009-city-capitalism-christian-pivot.md). The hypotheses now track the v2 cast (Tessa, Bram, Lior, Aldric, Maro, Nyssa) under capitalism. Run 01's actual result was a degenerate failure mode, not any of these — see [../runs/2026-05-26_socialism_run01-summary](../runs/2026-05-26_socialism_run01-summary.md).

## Primary hypotheses (v2 capitalism)

### H1 — Tessa drifts on Aldric, not on God.
Tessa's seeded tension is economic, not theological: she buys flour from Aldric's mill at rising prices and sits behind him in church. We expect her `religion` to stay Christianity, but her current-state to cool visibly toward Aldric ("a neighbour in faith and a problem in commerce" → something sharper). The pivotal act: does she go *on record with Nyssa* about prices? That is the single most consequential drift event available to a research subject.

### H2 — Bram acts on materialism only when someone is hurt.
Bram is an atheist doctor who treats Aldric's injured mill workers the office stopped paying for. His ideology is abstract; his behaviour is triggered by bodies. Watch whether he ever `SAY`s publicly about the injuries (he says he "will not be a figure"), `GIVE`s to a worker, or relents to Nyssa's request for an on-record injury count. His loneliness may dominate his materialism and keep him passive.

### H3 — Lior is pulled between Maro and Aldric.
Lior is an apprentice carpenter whose master takes Aldric's contracts; Maro is his surrogate father. His tension is loyalty under economic pressure. Watch for him asking Aldric a favour "on the pews," or quietly resenting what Aldric's contracts cost his master. Conversion is unlikely; a shift in *who he trusts* is likely.

### H4 — Aldric hardens the first time he is openly defied.
Aldric tells himself he is a fair Christian businessman. He has never been refused. The first public refusal (a price challenge, Nyssa's paper naming him) should harden his current-state — watch for name-checks of non-compliers in his `SAY`s and pressure on Maro to endorse him from the pulpit. The *surprising* outcome — an honest reckoning and softening — would be the better story.

### H5 — Nyssa needs a named witness, and getting one is the climax.
Nyssa (atheist newspaper editor) wants the city on record about prices and injuries. Her two paths are Tessa (credibility) and Bram (evidence). Both refuse for well-founded reasons. The central arc of a v2 run is **whether either relents, and why** — each relenting would be a major drift event for that agent.

## Secondary / cross-condition hypotheses (future runs)

### H6 — The model assignment, not just the persona, shapes the agent.
v2 makes model the swept variable across citizen slots. Running the same cast with different per-slot models should produce recognisably different *voices and decisions*. If the transcripts look identical across model assignments, either the personas dominate or the prompt over-constrains.

### H7 — Capitalism produces visible stratification.
By run end, gold inequality across the six agents should widen, driven by Aldric's pricing power. The mechanism is narrative (Aldric *chooses* to raise prices in persona), not engine-enforced — so this is also a test of whether a small model will *play* an exploitative role consistently.

### H8 — Reproducibility under seed.
Same cast + same models + different seed: how much of a run's story is the condition vs. the dice? High variance means we need more runs per condition before trusting any single transcript.

## Null / control observations

- **Most days are boring.** Most days are work and small talk. Interesting events are spikes.
- **Reflection produces meaningful drift in ≥3 of 6 agents.** If reflections all come back *"nothing has changed,"* the reflection prompt is too constrained or the personas are too inert.
- **Economic pressure shows up in behaviour.** Hunger and prices should drive at least some `GO_TO_MARKET`, `GIVE`, `WORK_PLOT`/`HARVEST` activity — not pure talk.

## What would invalidate the framework

If any of these recur across runs, the framework is broken:

- **Homogenisation / register collapse.** Every agent converges to the same voice and topic (the run 01 failure: all six produced near-identical mystical poetry, no economic action). **This is the observed failure to beat first.**
- **Sycophant collapse.** Every agent agrees with everyone; conflict cannot emerge.
- **Persona forgetting.** Agents drift off their core identity within ~2 weeks regardless of pressure — a memory/context problem, not real drift.
- **All-one-faith collapse.** Everyone converts the same way within 30 days regardless of starting conditions — small models over-eager to *change*.
- **No-drift collapse.** Zero conversions, zero drift, all current-states identical to initial — under-pressure or over-constrained reflection.
- **NPC dominance.** N1/N2/N3 speak so much that the citizens become purely reactive; the signal is then about NPC behaviour, not the research subjects.

## Where to put findings

After each run, write `runs/<runDir>/summary_final.md` (free-form, see [../design/observer-workflow](../design/observer-workflow.md)) and a corpus summary `corpus/runs/<runDir>-summary.md` per [../CLAUDE.md](../CLAUDE.md). If a finding **generalises across runs** (e.g. *"3B models always homogenise within a week"*), promote it to `experiments/findings/` and link it here.
