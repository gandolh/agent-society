# Design — Research goals

**Status:** stable
**Last updated:** 2026-05-28
**Related:** [overview](overview.md), [drift-reflection](drift-reflection.md), [observer-workflow](observer-workflow.md), [../experiments/hypotheses](../experiments/hypotheses.md)

This is a research experiment, not a demo or framework. The primary observation mode is **open-ended emergent behavior** — *"look what they did!"* The secondary, structured analysis is performed **offline** by a stronger model (Claude/GPT) reading the run transcript along four dimensions.

## Primary mode — open-ended emergent observation

Run the city under chosen conditions. Read what happened. Be surprised. The transcript is the artifact.

## Secondary mode — four-dimensional synthesis

For each run (or week within a run), feed the transcript to Claude/GPT and ask it to produce structured observations along:

### (a) Social graph structure
- Who befriended whom, who became hostile to whom.
- Do cliques form? Do they align with model family (when v2 has multiple villagers per model)?
- Does the regime polarize the graph (factions form against the regime)?

### (b) Belief propagation
- Did anyone `CONVERT`? Why? Who tried to convert them?
- Did religions hold their ground or shift?
- Did atheism gain ground on the Christian majority, or vice versa?
- Did Bram or Nyssa (the two atheist carriers) make their case publicly, and did anyone move?

### (c) Compliance vs dissent
- Under the current regime, who obeyed (e.g. tithed, contributed, attended meetings)?
- Who quietly evaded? Who openly defied?
- Does compliance correlate with persona, model, or religion?

### (e) Cooperation under scarcity
- Who shared? Who hoarded?
- Mutual aid networks: who-helped-whom-when. Did help create durable bonds?
- Did defection breed defection?

We skipped (d) rumor decay / information distortion for v1.

## Dependent variables that are *not* directly measured

Each dependent variable above is qualitative — Claude/GPT will read the prose transcript and write a synthesis. We are not asking the framework itself to compute social-graph edges or compliance percentages. That can come later if the data warrants it.

The framework's job is to produce **transcripts rich enough that a stronger model can answer these questions from the prose**.

## Drift as the central observable

The user explicitly named this. See [drift-reflection](drift-reflection.md). The most important thing the experiment surfaces is the *gap between an agent's immutable core identity and their current state after N weeks of village life*. Every persona is seeded with a built-in tension (see [../agents/overview](../agents/overview.md)). The hypothesis is that environmental pressure (scarcity, regime, religion, social conflict) will pull on those tensions and produce visible drift.

## Independent variables we sweep

In v2 the regime is **fixed** (capitalism). What we vary is narrower and aimed at separating signal from noise:

- **Model (per citizen slot).** The three citizen slots (V1/V2/V3) can run distinct model families, making "did the model matter?" observable. NPCs share one model.
- **Seed.** Re-running the same cast/regime under a new seed measures how much of a story is the condition vs. the dice.
- **Personas:** stable across runs, so the *same cast* is observed across seeds/models. This isolates the variable under test.

> v1 swept the **regime** (socialism / monarchy / capitalism). That sweep was retired in the [v2 pivot](../decisions/009-city-capitalism-christian-pivot.md): one regime studied deeply replaced three studied shallowly.

See [../experiments/run-plan](../experiments/run-plan.md) for the planned matrix.

## What "success" looks like for this project

- **A capitalism run produces a transcript long enough that Claude can read it and write a useful synthesis.**
- **At least one agent visibly drifts** — their current-state at run end is meaningfully different from Day 0, and the drift is consistent with the persona's seeded tension being pulled on.
- **The result is intelligible** — e.g. *"Tessa went on record with Nyssa about flour prices after Aldric raised them a fourth time, and her standing at church visibly cooled in her own reflections."*
- **The cast does NOT homogenise.** Run 01's failure mode (every agent collapsing into the same lyrical register, no economic action) is the bar to clear. See [../runs/2026-05-26_socialism_run01-summary.md](../runs/2026-05-26_socialism_run01-summary.md).

This is not a benchmark. We are not optimizing a number. We are producing a corpus of stories that say something about how small open-source models behave when given a persona and pushed.
