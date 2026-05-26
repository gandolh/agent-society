# Design — Agent template

**Status:** stable
**Last updated:** 2026-05-26
**Related:** [drift-reflection](drift-reflection.md), [perception-memory](perception-memory.md), [../agents/overview](../agents/overview.md), [../decisions/002-prose-persona-no-traits.md](../decisions/002-prose-persona-no-traits.md), [../decisions/006-bifurcated-persona-with-reflection.md](../decisions/006-bifurcated-persona-with-reflection.md)

Every agent — villager and NPC alike — has the same data shape. Personality, beliefs, and desires are **pure prose**. The dynamic state the engine mutates (resources, AP, plot, religion) is structured. The persona is **bifurcated** into an immutable core identity and a mutable current-state that updates weekly.

## Type shape

```ts
type Agent = {
  // Identity (static, public)
  id: string;                 // "V1", "N3"
  name: string;               // "Eda", "Sister Velka"
  model: string;              // Ollama model name, e.g. "llama3.1:8b"
  role: "villager" | "regime-leader" | "priest" | "cult-leader";

  // Persona — bifurcated
  coreIdentity: string;       // immutable prose, written at sim start
  currentState: string;       // mutable prose, updated weekly via reflection

  // Beliefs (engine-tracked, mutable)
  religion: "Christianity" | "TrueVine" | "Atheism";

  // World state (engine-tracked, public)
  resources: { gold: number; food: number; seeds: number };
  actionPointsLeft: number;
  plot: {
    cropsPlanted: { plantedDay: number }[]; // per-crop maturity tracking
    cropsReady: number;
  };

  // Status
  hungerDays: number;         // 0 = fed today, >0 = days since last meal
  isResearchSubject: boolean; // true for V1-V3, false for N1-N3

  // Communication queue
  unreadDms: { fromId: string; day: number; text: string }[];

  // Memory (event list, see perception-memory.md)
  recentEvents: EventLogEntry[]; // last 14 days, truncated
};
```

## The two persona blocks

### Core identity (immutable)

Written once at sim start. Never edited by the engine or by the agent. Contains:

- **Name and surface description** — age, role, appearance hints.
- **Background** — formative experiences, losses, relationships.
- **Personality** — temperament, habits of speech, what they look like under stress.
- **Initial beliefs** — current religion, attitudes toward the regime and other agents.
- **Initial desires** — what they want most right now and why.
- **Seeded tension** — the built-in contradiction that environmental pressure will pull on. *This is the single most important sentence in the core identity.* Without it, the persona is flat and the sim is boring.

Example fragment (Eda's seeded tension):
> Eda is intellectually proud. She used to debate scripture with her husband and loved being told she was clever. Father Maro's sermons are warm but anti-intellectual — *"trust, don't question"*. Sister Velka of the True Vine specifically teaches that hidden meanings in scripture reward the careful reader, which flatters Eda's intellect.

### Current state (mutable)

Updated weekly via self-reflection (and on event triggers — see [drift-reflection](drift-reflection.md)). Contains:

- **Current beliefs about the world** — prose, ~3–5 sentences.
- **Current desires / what I want most right now** — prose.
- **Current mood** — prose.
- **Feelings about specific people** — labeled per-other-agent.

Example fragment (Eda, Week 0):
```
=== CURRENT STATE — Week 0 (initial) ===

Beliefs about the world: I trust Father Maro and the church to guide me through the cold months. The Vine is misguided but not malicious. Aldric means well but I am uneasy about his redistribution — I would rather give freely than be required to.

Desires: I want to keep my plot productive, see my children visit at midsummer, and feel my late husband's presence at Sunday service.

Mood: Tired, but resolute. The harvest will be enough.

Feelings about others:
- V2 (Bram): A sad man. I should bring him bread.
- V3 (Lior): I worry for him since his father died.
- N1 (Aldric): A good man with bad ideas about how to be good.
- N2 (Father Maro): Steady. A comfort.
- N3 (Sister Velka): Dangerous in a way she does not see.
```

Each subsequent week, a new section is appended:
```
=== CURRENT STATE — Week 1 (post-reflection day 7) ===
...
```

Both old and new blocks remain in the agent's file under [../agents/](../agents/) so the drift over time is observable. Only the most recent block is used to build the system prompt for the next turn.

## What goes into the system prompt each turn

The agent's LLM sees, every turn:

1. The **complete core identity** (immutable).
2. The **most recent current-state block only** (the latest one).
3. Today's perception payload (world state, roster, recent events, unread DMs). See [perception-memory](perception-memory.md).

The agent does *not* see its own prior current-state blocks during normal turns. Drift is visible to *us* (we can read the agent's file and diff across weeks), not visible to the agent itself. This matches how humans experience drift — you don't remember exactly who you were six months ago.

## What is hidden from other agents

When an agent's perception of the village includes other agents, it sees:
- name, role (where role is public — "the priest"), public religion (the one they last `CONVERT`-ed to), gold, food, seeds, plot crops, public actions.

It does **not** see:
- their core identity
- their current-state
- their hunger days
- their unread DMs
- their internal reasoning field
- their model name

See [decisions/002-prose-persona-no-traits.md](../decisions/002-prose-persona-no-traits.md) and [perception-memory](perception-memory.md) for more.

## How personas are authored

Hybrid workflow (decided in the grilling session):
1. User writes a one-paragraph **brief** per agent that seeds a tension.
2. Claude drafts the full core identity from the brief.
3. User edits.
4. The resulting prose is saved to the agent's file under [../agents/](../agents/) under `## Core identity (immutable)`.

The 6 initial briefs and the resulting core identities live under [../agents/](../agents/). See [../agents/overview](../agents/overview.md) for the tension matrix.
