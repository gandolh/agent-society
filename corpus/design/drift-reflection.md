# Design — Drift and reflection

**Status:** stable
**Last updated:** 2026-05-28
**Related:** [agent-template](agent-template.md), [perception-memory](perception-memory.md), [research-goals](research-goals.md), [../decisions/006-bifurcated-persona-with-reflection.md](../decisions/006-bifurcated-persona-with-reflection.md)

The central observable. The user explicitly named this: *"design good the agent personas and see what drifts from their beliefs and desires and how they can change over time."*

## The mechanism in one paragraph

Every agent has a bifurcated persona ([agent-template](agent-template.md)). The **core identity** never changes. The **current state** is a prose block describing the agent's current beliefs, desires, mood, and feelings toward others. It is updated by a **self-reflection LLM call** that runs at the end of every week and on certain triggering events. Each updated block is appended to the agent's file in [../agents/](../agents/) — old blocks remain visible for offline analysis. Drift is the *diff* between Week 0 and Week N.

## Weekly reflection — the prompt

At the end of every 7 days (`world.day % 7 === 0`), the engine calls each agent's LLM with this prompt. This mirrors `buildReflectionPrompt` in [`src/prompts/reflection.ts`](../../src/prompts/reflection.ts); the roster lines are built from the live `rosterSlots` (slot IDs, self excluded), not a hardcoded cast.

```
You are {name}.

YOUR CORE IDENTITY (does not change — it is who you have always been):
{coreIdentity}

YOUR CURRENT STATE LAST WEEK:
{previousCurrentState}

EVENTS INVOLVING YOU THIS WEEK:
{weeksEvents}          // last 7 days, formatted per-event; "(quiet week)" if none

It is the end of week {weekNumber}. Reflect, in character, on what has changed for you.
- Have your beliefs about the world shifted? In what direction?
- Have your desires changed — in priority, or in kind?
- How has your mood changed?
- Have your feelings toward specific people shifted? Which people, and how?

It is fine if nothing has changed — say so. It is fine to have changed dramatically — explain why.
Stay in character. Speak in the first person. Be honest about contradictions in your own thinking.

Output a complete updated CURRENT STATE block in this exact format:

=== CURRENT STATE — Week {weekNumber} ===

Beliefs about the world: <prose>

Desires: <prose>

Mood: <prose>

Feelings about others:
- {otherSlot}: <prose>     // one line per other agent, by slot id
...

Output ONLY the CURRENT STATE block. Do not include any other text.
```

## Event-triggered reflection

> [!warning]
> **NOT YET IMPLEMENTED.** The engine ([`src/engine.ts`](../../src/engine.ts)) currently runs **only** the weekly reflection (`runWeeklyReflections`). The `reflectAgent` function accepts a `trigger` of `"weekly" | "event-triggered"`, but nothing calls it with `"event-triggered"` and there is no detector for the triggers below. This section is the design spec for a planned feature, not current behaviour. Until it ships, all drift is captured at the weekly tick.

Beyond the weekly tick, certain events should force an immediate reflection (between normal turns, not consuming AP):

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

> *"On Day 0, Tessa (V1) was a devout Christian who trusted Father Maro and saw Aldric as 'a neighbour in faith and a problem in commerce.' By Day 28, her current-state says she 'no longer believes Maro will ever meet her questions' and 'has stopped greeting Aldric warmly at church.' She hasn't converted (religion field still Christianity), but the prose shows clear drift."*

This is the kind of evidence the experiment is trying to produce.

## Why reflection happens in the agent's own model

We deliberately do **not** use the strong observer model for reflection. Reasons:

1. **Voice consistency.** The reflection prose should sound like the agent. Using a stronger model would make a small-model Tessa suddenly sound like Sonnet — that breaks the experiment.
2. **Drift is a property of the agent.** What changes is what *this model, under this persona, after these experiences* thinks. Hand-waving with a stronger model would hide the model's own drift dynamics.
3. **Cost.** Six reflection calls per week × ~4–5 weeks (31-day run) ≈ 30 extra Ollama calls per run. Trivial.

The strong external model (Claude/GPT) is for **offline observer synthesis only** — see [observer-workflow](observer-workflow.md).

## When reflection itself is the drama

Some of the most interesting transcript moments are likely to be reflection outputs themselves. An agent who, at the end of week 4, writes:

> *"I keep telling myself I am still a Christian. But every Sunday I now arrive at Father Maro's service with my heart already in another place. Nyssa's question last Tuesday — 'you of all people would be believed; why won't you say it?' — I have not stopped hearing it. I don't know what I am anymore."*

That is the artifact the experiment is designed to produce. Make it possible. Don't over-constrain the reflection prompt.
