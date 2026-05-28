# Agents — Overview

**Status:** stable
**Last updated:** 2026-05-28
**Related:** [../design/agent-template](../design/agent-template.md), [../design/drift-reflection](../design/drift-reflection.md), [../world/setting](../world/setting.md), [../world/religions/overview](../world/religions/overview.md)

The MVP cast: 3 citizens (research subjects) + 3 NPC fixtures. All six are full LLM-played participants in the round-robin. NPCs are excluded from final research analysis.

## The cast

| Slot | Name | Job | Role | Religion | Page |
|------|------|-----|------|----------|------|
| V1 | Tessa | Baker | Citizen (research subject) | Christianity | [V1-tessa](V1-tessa.md) |
| V2 | Bram | Doctor | Citizen (research subject) | Atheism | [V2-bram](V2-bram.md) |
| V3 | Lior | Apprentice Carpenter | Citizen (research subject) | Christianity | [V3-lior](V3-lior.md) |
| N1 | Aldric Vance | Mill & Workshop Owner | Industrialist (NPC) | Christianity | [N1-aldric](N1-aldric.md) |
| N2 | Father Maro | Parish Priest | Priest (NPC) | Christianity | [N2-father-maro](N2-father-maro.md) |
| N3 | Nyssa Velkin | Newspaper Editor | Editor (NPC) | Atheism | [N3-nyssa](N3-nyssa.md) |

Jobs are **narrative** — they show up in personas, dialogue, and the things agents say to each other. The engine does not have job-specific actions; everyone shares the same generic verbs (WORK, HARVEST, GO_TO_MARKET, GIVE, SAY, DM, PRAY, TITHE, CONVERT, REST). See [../design/action-set](../design/action-set.md).

## Tension and collaboration matrix

Every persona is seeded with a deliberate tension *and* with at least one collaboration angle. Flat personas produce flat sims; lonely personas produce no sim at all.

| Edge | Tension | Collaboration angle |
|------|---------|---------------------|
| **V1 ↔ N1** | Tessa buys flour from Aldric's mill at prices that keep rising. They share a pew on Sundays. | Aldric considers Tessa a friend in faith and could be moved privately. |
| **V1 ↔ N2** | Tessa wants to argue scripture; Maro deflects. *"Clever Tessa"* lands wrong. | Maro is her shepherd; she trusts him at depth. |
| **V1 ↔ N3** | Nyssa wants Tessa on record about prices. Tessa is flattered and afraid. | Both want the city to be honest about itself. |
| **V2 ↔ N1** | Bram treats Aldric's injured workers; the office stopped paying. | None directly. Bram could write off the bills or insist on them — both are moves. |
| **V2 ↔ N3** | Nyssa wants Bram's count of injuries on the record; Bram will not be a figure. | They are natural allies. They drink tea once a month. |
| **V2 ↔ N2** | Bram doesn't come to church; Maro asks him to visit the dying anyway. | Each respects the other quietly and acts on it. |
| **V2 ↔ V3** | Bram tended Yorin's death; Lior owes a debt Bram will not accept. | Small gifts and small repairs — a slow human warmth. |
| **V3 ↔ N1** | Halim's shop takes Aldric's contracts; Lior overhears what they cost his master. | Lior could ask Aldric a favor on the pews; Aldric could grant it. |
| **V3 ↔ N2** | None — Maro is Lior's surrogate father. | The pew project. Lior wants to build chapel pews. |
| **V3 ↔ V1** | None — Tessa knew Yorin. | Tessa brings Lior bread; Lior repairs her counter. |
| **N1 ↔ N2** | Maro knows the mill funds the chapel roof; both know what that means. | Friendship that has worked for two decades. |
| **N1 ↔ N3** | Direct rivals. Aldric has cooled to Nyssa's advertising. | None at run start — but Aldric privately can be moved. |
| **N2 ↔ N3** | Religion vs. secular press. Polite mutual contempt. | Maro respects Nyssa's conviction. Each could surprise the other. |

## Reading the matrix

The graph is dense. Every agent is pulled in two or more directions. This is **deliberate** — flat personas produce flat sims.

The most important single arc to watch in run 02 (capitalism):
- **Does Nyssa get a named witness, and from whom?** Tessa (credibility) and Bram (evidence) are the two paths. Their refusals are well-founded. Their reasons for relenting would each be a major drift event.

## Authoring workflow recap

Each persona is authored hybrid-style:
1. A one-paragraph **brief** with deliberate tension was drafted in conversation.
2. Briefs were saved as the seed for the full core identity.
3. Full **core identity prose** is on each agent's page under `## Core identity (immutable)`.
4. **Current state — Week 0** is the agent's initial mutable state, also on the page.
5. Subsequent weekly reflections will append `## Current state — Week N` sections to each page as runs progress.

## Things to remember when editing personas

- **Never edit the immutable core identity** once a run has started. That is the comparison baseline.
- **Always append, never overwrite** in the current-state sections. Drift evidence is in the history.
