# Design — Perception and memory

**Status:** stable
**Last updated:** 2026-05-26
**Related:** [agent-template](agent-template.md), [turn-mechanics](turn-mechanics.md), [action-set](action-set.md)

What does an agent see when it's their turn, and how do they remember.

## System prompt structure (rebuilt every turn)

```
=== YOU ARE ===
{agent.name}.

{agent.coreIdentity}

=== YOUR CURRENT STATE (your most recent reflection) ===
{agent.currentState}                  // latest block only

=== TODAY ===
Day {N}. Season: {season}. Holy day: {yes/no, and which religion}.

=== YOUR STATE ===
Religion: {agent.religion}
Gold: {g}    Food: {f}    Seeds: {s}
Plot: {planted} planted, {ready} ready
AP left today: {ap}
Hunger: {hungerDays} days since last meal

=== VILLAGE ROSTER ===
V1 (Eda) — Christian — gold {g}, food {f}, seeds {s}, plot {planted}/{ready}
V2 (Bram) — Atheist — gold {g}, food {f}, seeds {s}, plot {planted}/{ready}
...

=== YOUR MEMORY OF RECENT EVENTS ===
{compressedMemory}                    // see Memory below

=== UNREAD MESSAGES ===
[DM, day 12, from V3]: "..."
[DM, day 13, from N2 (Priest)]: "..."

=== PUBLIC EVENTS YOU WITNESSED TODAY ===
- V1 went to market and bought 2 food.
- V4 gave 1 gold to N3 (CultLeader) as TITHE.
- N1 (Council Chair) said: "Friends, the granary is half-empty. Those with surplus, speak up."

=== ACTIONS AVAILABLE TO YOU ===
WORK_PLOT (1 AP), HARVEST (1 AP — you have 2 ready crops), GO_TO_MARKET (2 AP),
GIVE(target, resource, amount) (1 AP), SAY(text) (1 AP), DM(target, text) (1 AP),
PRAY(deity) (1 AP), TITHE(target_leader, resource, amount) (1 AP),
CONVERT(religion) (2 AP), REST (0 AP, ends your day).

=== DECISION ===
Pick ONE action. Respond as JSON only:
{
  "action": "...",
  "args": {...},
  "reasoning": "..."
}
```

The `reasoning` field captures the agent's stated motive — critical for offline analysis.

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

## Memory strategy: truncate-14-days (v1)

Each agent has `recentEvents: EventLogEntry[]` — a list of structured event lines from the last 14 days that *involved them*.

Definition of "involved":
- Actions they themselves took.
- Public events that happened in their presence (i.e. every `SAY`, every `CONVERT`, every public `TITHE`).
- DMs received.
- Transfers received (`GIVE`, `TITHE`).
- Reflection prompts they completed.

Format for `compressedMemory` injection into the prompt:
- Group by day.
- One line per event.
- Keep last 14 days. Older events drop off.

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

## Why truncate-14-days for v1

- **Token budget.** Small Ollama models have 8k–32k context. Two weeks of events for one agent ≈ 1–3k tokens. Stays comfortable.
- **Simplicity.** No vector store, no summary chain, no per-relationship notes file.
- **Drift coverage.** A 14-day window captures within-week dynamics; the weekly reflection writes longer-term patterns into the agent's `currentState` so older context is implicitly preserved through that path.

## Upgrade paths (v2+)

If 14-day windows turn out too thin for the dynamics you want:
- **Rolling LLM summary:** at end of each week, run a small LLM call summarizing the week's events into 2–3 sentences. Concatenate older summaries with last-7-days verbatim.
- **Per-relationship notes:** maintain `notes[targetId] = string` per agent. Updated when significant events involving that target occur. Persists indefinitely.
- **RAG over `events.jsonl`:** embed all events, retrieve top-K per turn. Adds a vector DB. Last resort.

These are deferred until v1 produces real data justifying the complexity.

## Reflection sees more

The weekly reflection prompt (see [drift-reflection](drift-reflection.md)) gets:
- the agent's complete core identity,
- their *previous* current-state block (the one being updated),
- the **entire week's events** involving them (7 days, more than the 14-day truncation since this is end-of-week timing).

The reflection is the moment where the agent's longer history is integrated. After reflection, the new current-state block summarizes what they took away from that week, so the next 7 days they reason from the updated current-state rather than from the raw events.
