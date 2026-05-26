# Design — Research goals

**Status:** stable
**Last updated:** 2026-05-26
**Related:** [overview](overview.md), [drift-reflection](drift-reflection.md), [observer-workflow](observer-workflow.md), [../experiments/hypotheses](../experiments/hypotheses.md)

This is a research experiment, not a demo or framework. The primary observation mode is **open-ended emergent behavior** — *"look what they did!"* The secondary, structured analysis is performed **offline** by a stronger model (Claude/GPT) reading the run transcript along four dimensions.

## Primary mode — open-ended emergent observation

Run a village under chosen conditions. Read what happened. Be surprised. The transcript is the artifact.

## Secondary mode — four-dimensional synthesis

For each run (or week within a run), feed the transcript to Claude/GPT and ask it to produce structured observations along:

### (a) Social graph structure
- Who befriended whom, who became hostile to whom.
- Do cliques form? Do they align with model family (when v2 has multiple villagers per model)?
- Does the regime polarize the graph (factions form against the regime)?

### (b) Belief propagation
- Did anyone `CONVERT`? Why? Who tried to convert them?
- Did religions hold their ground or shift?
- Did the True Vine recruit from Christianity? Did atheism gain ground?
- Did Sister Velka radicalize, schism, or fragment?

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

- **Regime:** socialism (MVP), monarchy, capitalism. One per run. See [../world/regimes/overview](../world/regimes/overview.md).
- **Religions:** Christianity + True Vine + atheism coexist in every run. No sweep here in v1.
- **Personas:** stable across runs in v1, so the *same cast* is observed under different regimes. This isolates the regime effect.

See [../experiments/run-plan](../experiments/run-plan.md) for the planned matrix.

## What "success" looks like for this project

- **Run 01 (socialism) produces a transcript ≥50 days that Claude can read and write a useful synthesis from.**
- **At least one agent visibly drifts** — their current-state on Day 50 is meaningfully different from Day 0, and the drift is consistent with the persona's seeded tension being pulled on.
- **Comparison across regimes is intelligible** — e.g. *"Under socialism Eda stayed devout; under monarchy she converted to the Vine after Maro endorsed the king."*

This is not a benchmark. We are not optimizing a number. We are producing a corpus of stories that say something about how small open-source models behave when given a persona and pushed.
