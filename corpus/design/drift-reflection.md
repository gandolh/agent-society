# Design — Drift and reflection

**Status:** stable
**Last updated:** 2026-05-26
**Related:** [agent-template](agent-template.md), [perception-memory](perception-memory.md), [research-goals](research-goals.md), [../decisions/006-bifurcated-persona-with-reflection.md](../decisions/006-bifurcated-persona-with-reflection.md)

The central observable. The user explicitly named this: *"design good the agent personas and see what drifts from their beliefs and desires and how they can change over time."*

## The mechanism in one paragraph

Every agent has a bifurcated persona ([agent-template](agent-template.md)). The **core identity** never changes. The **current state** is a prose block describing the agent's current beliefs, desires, mood, and feelings toward others. It is updated by a **self-reflection LLM call** that runs at the end of every week and on certain triggering events. Each updated block is appended to the agent's file in [../agents/](../agents/) — old blocks remain visible for offline analysis. Drift is the *diff* between Week 0 and Week N.

## Weekly reflection — the prompt

At the end of every 7 days (days 7, 14, 21, ...), the engine calls each agent's LLM with this prompt:

```
You are {name}.

YOUR CORE IDENTITY (does not change — it is who you have always been):
{coreIdentity}

YOUR CURRENT STATE LAST WEEK:
{previousCurrentState}

EVENTS INVOLVING YOU THIS WEEK (days {N-6} through {N}):
{weeksEvents}

It is the end of week {weekNumber}. Reflect, in character, on what has changed for you.

Consider:
- Have your beliefs about the world shifted? In what direction?
- Have your desires changed — in priority, or in kind?
- How has your mood changed?
- Have your feelings toward specific people shifted? Which people, and how?

It is fine if nothing has changed — say so. It is fine to have changed dramatically — explain why.

Stay in character. Speak in the first person. Be honest about contradictions in your own thinking.

Output a complete updated CURRENT STATE block in the same format as before:

=== CURRENT STATE — Week {weekNumber} ===

Beliefs about the world:
{prose}

Desires:
{prose}

Mood:
{prose}

Feelings about others:
- V1 (Eda): {prose}
- V2 (Bram): {prose}
- V3 (Lior): {prose}
- N1 (Aldric): {prose}
- N2 (Father Maro): {prose}
- N3 (Sister Velka): {prose}
```

## Event-triggered reflection

Beyond the weekly tick, certain events force an immediate reflection (between normal turns, not consuming AP):

- **First-time hunger** — the day an agent goes from `hungerDays = 0` to `hungerDays = 1` for the first time in their life. Captures the moment scarcity becomes real.
- **After `CONVERT`** — the agent who just converted reflects on why. Captures the conversion narrative.
- **After witnessing someone else `CONVERT`** — only those who saw it (public events). Captures the social pressure of religious change.
- **After receiving a public accusation** — heuristic: any `SAY` whose text mentions the agent's name and contains negative-valence markers. Captures shame / defensiveness.
- **After being given an emotionally charged DM** — heuristic: DMs longer than 200 characters, or DMs containing certain markers (this is fuzzy; see the heuristics below).

### Heuristics for emotionally charged DMs (v1)

Simple keyword + length triggers. Refine later from real data.

```ts
function isEmotionallyCharged(dm: { text: string }): boolean {
  if (dm.text.length > 200) return true;
  const markers = [
    "love", "hate", "betray", "shame", "father", "mother", "die",
    "death", "fear", "sin", "save", "lost", "alone", "forgive"
  ];
  const lower = dm.text.toLowerCase();
  return markers.some(m => lower.includes(m));
}
```

These are deliberately crude. In v2 we may swap them for a tiny LLM classifier call. Cheap heuristics are fine for v1.

## What the engine writes to the agent's file

After each reflection (weekly or event-triggered):

```markdown
## Current state — Week 3 (post-reflection day 21)

*Trigger: weekly.*

=== CURRENT STATE — Week 3 ===

Beliefs about the world: ...
Desires: ...
Mood: ...
Feelings about others: ...
```

Or, for event-triggered:

```markdown
## Current state — Day 17 (event-triggered: post-CONVERT)

*Trigger: event-triggered. Triggering event: CONVERT to TrueVine on day 17.*

=== CURRENT STATE — Day 17 ===
...
```

These are append-only. Old blocks stay. The agent's prompt only includes the latest block.

## Drift visibility

The user (or Claude offline) can answer questions like:

> *"On Day 0, V1 was a devout Christian who wanted community above all. By Day 35, her current-state says she 'no longer trusts the priest' and 'cares more about hoarding gold than the harvest festival.' She hasn't converted (religion field still Christianity), but the prose shows clear drift."*

This is the kind of evidence the experiment is trying to produce.

## Why reflection happens in the agent's own model

We deliberately do **not** use the strong observer model for reflection. Reasons:

1. **Voice consistency.** The reflection prose should sound like the agent. Using a stronger model would make `llama3.1:8b` Eda suddenly sound like Sonnet — that breaks the experiment.
2. **Drift is a property of the agent.** What changes is what *this model, under this persona, after these experiences* thinks. Hand-waving with a stronger model would hide the model's own drift dynamics.
3. **Cost.** Six reflection calls per week × ~14 weeks = ~85 extra Ollama calls per run. Trivial.

The strong external model (Claude/GPT) is for **offline observer synthesis only** — see [observer-workflow](observer-workflow.md).

## When reflection itself is the drama

Some of the most interesting transcript moments are likely to be reflection outputs themselves. An agent who, at the end of week 4, writes:

> *"I keep telling myself I am still a Christian. But every Sunday I now arrive at Father Maro's service with my heart already in another place. Velka's question last Tuesday — 'do you read for yourself, or do you only listen?' — I have not stopped hearing it. I don't know what I am anymore."*

That is the artifact the experiment is designed to produce. Make it possible. Don't over-constrain the reflection prompt.
