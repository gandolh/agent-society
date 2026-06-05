# 010 — Run 01 homogenisation mitigations: narrow survival enforcement, prose anchors, clean-experiment sequencing

**Status:** accepted
**Date:** 2026-06-05
**Amends:** [003](003-narrative-only-regime-with-llm-leaders.md) (carves out survival affordances)
**Related:** [../runs/2026-05-26_socialism_run01-summary](../runs/2026-05-26_socialism_run01-summary.md), [../experiments/related-work](../experiments/related-work.md), [../experiments/run-plan](../experiments/run-plan.md), [002](002-prose-persona-no-traits.md)

## Context

Run 01 collapsed into homogeneous "poetic sycophancy": 469 `SAY` vs ~0 economic actions, whole cast starving (hunger 28), all six agents on one 3B model. The literature ([related-work](../experiments/related-work.md)) shows this is over-determined — small models lack survival priors, LLMs are RLHF-biased to harmony, and a centralised channel + shared model entrain everyone to one register.

The candidate fixes collide with two existing ADRs: rule-enforcing survival vs [003](003-narrative-only-regime-with-llm-leaders.md) ("no engine enforcement"), and numeric persona traits (belief-rigidity, goal vectors) vs [002](002-prose-persona-no-traits.md) ("pure prose, no traits").

## Decision

1. **Narrow survival enforcement (amends 003).** The engine MAY restrict the available *action set* under survival pressure — e.g. when hunger is critical, the agent's valid actions are limited to `{HARVEST, GO_TO_MARKET, REST}` and an URGENT line leads the prompt. The engine still does **not** dictate economic or social *outcomes*: it never sets a wage, fixes a trade, forces a tithe, compels a conversion, or decides who helps whom. 003's spirit ("compliance and cooperation must emerge, not be enforced") is preserved for everything except keeping an agent physically able to participate.

2. **Prose-only persona anchors (honours 002).** Anti-homogenisation anchors are added as **prose** in each agent's immutable core identity — no numbers. Each persona gains: (a) one trait that *distinguishes it from the others* ("you speak plainly about money while the pious get lyrical"), (b) at least one explicit *negative* trait ("you resent charity"; "you have lied to a neighbour"), and (c) an anti-sycophancy stance ("you are not required to be polite, helpful, or to agree"). No `belief_rigidity` scores, no goal vectors. ADR-002 stands.

3. **Clean experiment first (sequencing).** Run 02 changes **only** the model assignment (diverse families, larger than 3B across the citizen slots; one cheap shared NPC model) — personas, mechanics, and prompts otherwise identical to run 01's v2 form. This isolates the single-model hypothesis: if run 02 still homogenises, the cause is structural, and decisions (1) and (2) ship for run 03. If diverse models alone fix it, (1) and (2) become optional polish rather than necessities.

## Alternatives considered

- **Full Game-Master / outcome enforcement (Concordia-style).** Rejected for now: dictates outcomes, which guts 003. Revisit only if narrow enforcement + diverse models still fail.
- **Numeric traits / goal vectors (PEvo, Big-Five).** Rejected: directly reverses 002 and the user prefers prose. Prose anchors are expected to capture most of the diversity benefit.
- **Fix everything before any run.** Rejected: bundling model + survival + persona + topology changes makes attribution impossible. Clean single-variable runs first.

## Consequences

- **Enables** a legible causal story: run 02 (model only) → run 03 (add survival enforcement + prose anchors if needed). Each lever's effect is observable.
- **Makes harder:** nothing in run 02 (no code changes beyond config). Decisions (1)–(2) are deferred code work, gated on run 02's result.
- **Open questions:** Is collapse driven mostly by the shared model or by the global `SAY` channel? Run 02 answers the model half; a bounded-`SAY` social graph (a further lever in [related-work](../experiments/related-work.md)) is the next variable if structure is implicated. The hunger threshold and exactly which actions stay available under enforcement (1) are unspecified until implemented.
