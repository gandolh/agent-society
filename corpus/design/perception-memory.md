# Design — Perception and memory

**Status:** stable
**Last updated:** 2026-05-28
**Related:** [agent-template](agent-template.md), [turn-mechanics](turn-mechanics.md), [action-set](action-set.md)

What does an agent see when it's their turn, and how do they remember.

## System prompt structure (rebuilt every turn)

This mirrors `buildSystemPrompt` in [`src/prompts/system.ts`](../../src/prompts/system.ts). Sections are separated by blank lines; the v2 token-diet wording is terse on purpose.

```
=== YOU ARE ===
{agent.name}.

{agent.coreIdentity}

=== YOUR CURRENT STATE (your most recent reflection) ===
{agent.currentState}                  // latest block only

=== TODAY ===
Day {N}. Holy day: {Christianity | none}.

=== YOUR STATE ===
Religion: {agent.religion}
Gold: {g}  Food: {f}  Stock: {s}
Work: {inProgress} in progress, {ready} ready
AP left: {ap}   Hunger: {hungerDays}d

=== THE CITY ===
{capitalism block: Aldric owns the mill, sets wages/prices, help is voluntary, debt is not.}

=== YOUR FAITH ===
{Christianity or Atheism block}

=== ROSTER ===
V2 Bram (Atheism) — g5 f3 s3
V3 Lior (Christianity) — g5 f3 s3
...                                   // self excluded; public info only

=== YOUR RECENT EVENTS ===
{compressedMemory}                    // see Memory below; last 7 days

=== UNREAD DMS ===
[d12 from V3]: "..."

=== PUBLIC TODAY ===
N3: "..."                             // SAYs, TITHE/CONVERT/market lines from earlier this round
N1 tithed 1 gold → N2

=== ACTIONS AVAILABLE ===
{only actions the agent can currently afford, with arg schemas}

=== DECISION ===
Pick ONE action. Respond ONLY with JSON:
{"action":"<NAME>","args":{...},"reasoning":"<one short in-character sentence>"}
No other text. args must match the action's schema.
```

The `reasoning` field captures the agent's stated motive — critical for offline analysis.

> **Spatial mode (ocean town).** When `config.spatial` is on, perception is *scoped by location* and gains two compact blocks (see [ADR 012](../decisions/012-ocean-town-spatial-capabilities-economy.md)):
> - `=== WHERE ===` — current zone, who is nearby (within `sayRadius`), and travel targets as `id:kind` pairs. **No coordinates or map** are shown (token economy on small models).
> - `=== MARKET WALL ===` — live offers with ids, shown only when standing at the market.
> - The **roster** shows full `g/f/s` detail only for nearby agents; distant agents collapse to `id name (religion) @elsewhere`.
> - `=== PUBLIC TODAY ===` includes only events whose actor is within `sayRadius` — `SAY` is local, so distant speech never enters the prompt (this both fixes run-01 homogenisation and *reduces* tokens).
> - Zone-gated actions appear in `=== ACTIONS AVAILABLE ===` only when the agent is at the matching zone.

> **Implementation notes (code is truth):**
> - There is no `Season` line — only day + holy day. Holy day fires on day 7, 14, 21, ... for Christianity; atheism has none.
> - The roster shows the *other* agents only and uses the compressed `g# f# s#` form.
> - `=== PUBLIC TODAY ===` shows public events from **earlier rounds of the same day** that the agent did not itself perform — agents within one round decide in parallel and cannot see each other's same-round actions (see [turn-mechanics](turn-mechanics.md)).
> - The actions block lists only actions the agent can currently afford (plus REST).

## What is public, what is hidden

### Visible to other agents (in their roster + public events)
- name, slot id, role label (where role is public — "the priest"), current religion (last `CONVERT` they did or initial), gold, food, seeds, plot crops, public actions (`SAY`, `GO_TO_MARKET`, `TITHE`, `CONVERT`).

### Hidden from other agents
- coreIdentity
- currentState (their own reflection prose)
- hungerDays
- unreadDms
- internal reasoning field
- **model name** — agents do *not* know what model another agent is. Model identity is the research variable; leaking it to the simulation would contaminate the data.

### DMs
- Visible only to sender and recipient.
- Sender sees their own sent DMs in their `recentEvents` memory.
- Recipient sees received DMs in `unreadDms` until they take their next turn; then DMs move into `recentEvents`.
- Both versions appear in the master transcript (see [log-format](log-format.md)) so Claude can analyze them. The agents themselves only see their own halves.

## Memory strategy: truncate-7-days

Each agent has `recentEvents: EventLogEntry[]` — a list of structured event lines from the last **7 days** that *involved them*. (`pruneRecentEvents` in [`src/engine.ts`](../../src/engine.ts) drops anything older than `today - 7`, and `formatMemory` in [`src/prompts/system.ts`](../../src/prompts/system.ts) re-applies the same 7-day cutoff. The original design called for 14 days; the implementation settled on 7 and is the source of truth.)

Definition of "involved":
- Actions they themselves took.
- Public events that happened in their presence (i.e. every `SAY`, every `CONVERT`, every public `TITHE`).
- DMs received.
- Transfers received (`GIVE`, `TITHE`).
- Reflection prompts they completed.

Format for `compressedMemory` injection into the prompt:
- Group by day.
- One line per event.
- Keep last 7 days. Older events drop off.

Example slice:
```
Day 10:
- You harvested 3 food.
- Public: N2 said "Brothers and sisters, today is the Day of Bread..."
- You tithed 1 gold to N2.

Day 11:
- Public: V3 said "Father Maro's words remind me of my own father."
- You worked your plot (planted 1 seed).

Day 12:
- DM from V3: "I saw you tithe yesterday. The Vine could use someone with your kindness."
- You replied to V3 (DM): "I have only one church."
```

## Why truncate-7-days

- **Token budget.** Small Ollama models have 8k–32k context. A week of events for one agent is well under 1–2k tokens. Stays comfortable, and the v2 token diet leaned on this.
- **Simplicity.** No vector store, no summary chain, no per-relationship notes file.
- **Drift coverage.** A 7-day window aligns with the weekly reflection cadence: the reflection (which sees the *whole* week) writes longer-term patterns into the agent's `currentState`, so older context is preserved through that path rather than through raw memory.

> **Known risk.** A 7-day raw window is thin. Anything an agent should remember beyond a week survives *only* if its weekly reflection captures it. If reflections are shallow, the agent effectively has one-week amnesia — a likely contributor to run 01's failure to act on accumulating hunger. The retrieval-based memory of *Generative Agents* (Park et al. 2023) is the obvious upgrade path; see Upgrade paths below.

## Upgrade paths

If 7-day windows turn out too thin for the dynamics you want:
- **Rolling LLM summary:** at end of each week, run a small LLM call summarizing the week's events into 2–3 sentences. Concatenate older summaries with last-7-days verbatim.
- **Per-relationship notes:** maintain `notes[targetId] = string` per agent. Updated when significant events involving that target occur. Persists indefinitely.
- **RAG over `events.jsonl`:** embed all events, retrieve top-K per turn. Adds a vector DB. Last resort.

These are deferred until a run produces real data justifying the complexity. Run 01 arguably already justifies the per-relationship notes and/or rolling summary — see [../runs/2026-05-26_socialism_run01-summary.md](../runs/2026-05-26_socialism_run01-summary.md).

## Reflection sees more

The weekly reflection prompt (see [drift-reflection](drift-reflection.md)) gets:
- the agent's complete core identity,
- their *previous* current-state block (the one being updated),
- the **week's events** involving them (the same 7-day window as turn memory, gathered at end-of-week timing).

The reflection is the moment where the agent's longer history is integrated. After reflection, the new current-state block summarizes what they took away from that week, so the next 7 days they reason from the updated current-state rather than from the raw events.
