# 003 — Narrative-only regime/religion with LLM-played leaders

**Status:** accepted
**Date:** 2026-05-26
**Related:** [../world/regimes/overview](../world/regimes/overview.md), [../world/religions/overview](../world/religions/overview.md), [../agents/N1-aldric](../agents/N1-aldric.md), [../agents/N2-father-maro](../agents/N2-father-maro.md), [../agents/N3-sister-velka](../agents/N3-sister-velka.md)

## Context

How mechanically present should regime rules (taxes, decrees) and religious rules (tithes, holy days, doctrine) be in the engine?

Four options were considered in the grilling session:

- **(a) Narrative-only.** Rules exist as text in agent prompts. Engine enforces nothing.
- **(b) Engine-enforced, no agent in role.** Engine auto-deducts taxes, schedules holy days as world events. Regime/religion are faceless.
- **(c) Agent-played roles + engine enforcement.** One agent IS the mayor and one IS the priest, with special engine actions. Rich emergent power dynamics.
- **(d) Hybrid: engine enforcement + scripted NPC announcements.** Engine enforces base rules; NPCs are scripted/templated, not LLM-played.

The user chose **(a) Narrative-only with optional NPC role**. After clarification, this resolved to: rules are narrative-only (no engine enforcement), but leaders are full LLM-played agents (not scripted), with role-flavored personas.

## Decision

- **Engine enforces nothing related to regime or religion.** No `TAX` action, no auto-tithe, no penalty for non-compliance, no excommunication state.
- **Regime is a description block** prepended to every agent's system prompt + a specific persona for Aldric (varies per regime).
- **Religion is a description block** included in each follower's system prompt + holy-day calendar nudges.
- **Leaders are full LLM agents** (N1 Aldric, N2 Father Maro, N3 Sister Velka). They participate in the round-robin with 7 AP/day. Their "decrees" and "sermons" are just `SAY` actions with role-flavored authority.

The one exception: under [capitalism](../world/regimes/capitalism.md), Aldric gets one extra mechanic — he can set market prices via a special `SAY` variant. This is the only regime-specific engine action. It is granted because the market is the regime's primary lever and without it "capitalism" would be indistinguishable from "monarchy with a different costume."

## Alternatives considered

- **(b) Engine-enforced, no agent in role.** Cleanest measurable compliance signal. Easiest A/B test of regime variables. Rejected because it makes the regime and religion *faceless* — there is no priest to convert from, no king to overthrow. Loses the dramatic dimension that makes the simulation interesting to read.
- **(c) Engine-enforced + agent leaders with special actions.** Combines structural compliance signal with character drama. Rejected because (1) it requires designing leader-specific action subsets, (2) succession rules become complicated if leaders "die" or are removed, and (3) it makes the regime *not actually controlled* — if the mayor agent decides not to tax, the experimental variable is lost.
- **(d) Engine-enforced + scripted NPCs.** Cheap and reliable but loses the conversational emergence with NPCs. A scripted priest cannot respond to a heretical villager's DM with substance. Rejected because the most interesting moments are likely to be NPC↔villager interactions.

## Consequences

- **Enables:** narrative richness, conversational emergence, character drama. Velka can be *surprising*. Maro can drift. Aldric can have a crisis.
- **Makes harder:** clean compliance measurement. *"Did Aldric collect tax this week?"* depends on whether the persona prompted Aldric to do it — which is noisy. Compliance data has to be inferred by the offline observer reading transcripts, not computed from engine state.
- **Risk:** small Ollama models *forget* rules in their context. The "king" might forget to tax. The priest might forget to sermon. Reflections, weekly cadence prompts, and persona reinforcement help but don't eliminate this. Compliance noise is the cost.
- **Mitigation in v2:** if the noise is too high, we can bolt on engine-enforcement of a few key rules (auto-tithe, auto-tax) as opt-in flags in `config.json`. The infrastructure is forward-compatible — narrative-only is the baseline; engine enforcement is an additive layer.

## Open questions

- How often do small models forget the rules? Run 01 is the diagnostic.
- If forgetting is severe, do we add prompt reinforcement (e.g. "remember: today is tribute day") or do we go to (b)/(c)? Decide after run 01.
