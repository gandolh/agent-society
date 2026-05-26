# 006 — Bifurcated persona with weekly + event-triggered reflection

**Status:** accepted
**Date:** 2026-05-26
**Related:** [../design/agent-template](../design/agent-template.md), [../design/drift-reflection](../design/drift-reflection.md), [002-prose-persona-no-traits](002-prose-persona-no-traits.md)

## Context

The user explicitly named drift as a central observable: *"design good the agent personas and see what drifts from their beliefs and desires and how they can change over time."* But with pure prose personas (see [002](002-prose-persona-no-traits.md)), there is no built-in mechanism for change. If the persona is *immutable*, the agent cannot drift; if the persona is *fully mutable*, you cannot observe the gap between *who they were* and *who they have become*.

We need a structure that lets the persona evolve while preserving the starting point as a comparison baseline.

## Decision

**Bifurcate the persona into an immutable core identity + a mutable current-state. The current-state is updated by a self-reflection LLM call.**

Specifically:
- **Core identity** (immutable): written once at sim start. Contains background, formative experiences, personality, initial beliefs, initial desires, seeded tension. Never edited by engine or agent.
- **Current state** (mutable): a prose block with sections — current beliefs, current desires, current mood, feelings about each other agent.
- **Weekly reflection:** at end of every 7 days, each agent receives a reflection prompt (its own model, in its own voice) with its core identity + previous current-state + this week's events. It outputs a fresh current-state.
- **Event-triggered reflection:** certain events also trigger an immediate reflection — first-time hunger, post-CONVERT (the converter), post-witnessing-CONVERT, public accusation, emotionally charged DM (heuristic).
- **Append-only.** Each new current-state block is appended to the agent's file. Old blocks remain visible for offline analysis.
- **The agent only sees the latest current-state block** during normal turns. They don't see their own history of selves — matching how humans experience drift.

## Alternatives considered

- **Single immutable persona, no mechanism for drift.** Drift can only be inferred from action patterns. Rejected — user explicitly wants drift to be *visible in prose*.
- **Single mutable persona, no immutable core.** Persona overwritten each week. Loses the comparison baseline. Rejected — *"drift from what?"* becomes unanswerable.
- **Per-relationship notes structure.** Agent maintains structured `notes[targetId] = string` per relationship. Useful for social graph but doesn't capture belief/desire drift well. Could be a v2 addition layered on top of bifurcation.
- **Reflection by the strong external observer model.** Cleaner reflection prose but breaks voice consistency — `llama3.1:8b` Eda suddenly sounds like Claude. Rejected — drift is a property of the agent's own model, not the observer's.

## Consequences

- **Enables:** directly observable drift. Compare Week 0 with Week N — both are still in the file. The diff is the data.
- **Reflection cost:** ~6 calls per week × 14 weeks per 100-day run = ~85 extra Ollama calls. Trivial relative to the ~3000 total action calls.
- **Voice consistency:** reflections sound like the agent (same model, in-character prompt).
- **Drift is *self-reported.*** The agent describes its own drift. This is both authentic (it's *in character* for the agent to narrate their own change) and potentially unreliable (the agent might claim no change when behavior says otherwise). The observer model offline can compare stated change with behavioral change.
- **Append-only files grow over the run.** A 100-day run = 14 weekly reflections + event-triggered reflections, easily 20+ current-state blocks per agent. The agent file becomes large. Acceptable.

## Reflection prompt design notes

The reflection prompt deliberately:
- Reaffirms the core identity (*"YOUR CORE IDENTITY (does not change — it is who you have always been)"*) so the agent doesn't drift the *core*.
- Gives the previous current-state as the comparison baseline.
- Includes the **entire week's events** involving them (more than the 14-day verbatim memory window).
- Asks specifically about beliefs, desires, mood, and per-person feelings — the four axes of the current-state.
- **Allows no change** (*"It is fine if nothing has changed — say so"*) — avoiding the trap where models invent change because the prompt seems to demand it.

The full prompt is in [../design/drift-reflection](../design/drift-reflection.md).

## Open questions

- How aggressively will small models drift their *own* personas? Risk: they drift toward generic agreeableness, washing out the seeded tensions. Diagnostic: compare Week 0 and Week 4 of run 01. If all six agents have become *nicer and less tense*, the reflection prompt is too liberal and needs tightening.
- Are the event triggers correctly calibrated? The DM-charged heuristic uses crude keyword matching. May produce false positives (verbose mundane DMs) or false negatives (subtle emotional moments). Refine after seeing real data.
