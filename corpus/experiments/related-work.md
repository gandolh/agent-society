# Experiments — Related work & improvement levers

**Status:** draft
**Last updated:** 2026-06-05
**Related:** [hypotheses](hypotheses.md), [run-plan](run-plan.md), [../design/perception-memory](../design/perception-memory.md), [../design/drift-reflection](../design/drift-reflection.md), [../runs/2026-05-26_socialism_run01-summary](../runs/2026-05-26_socialism_run01-summary.md)

Literature relevant to this project, read specifically to diagnose run 01's homogenisation failure and to pick concrete improvements. The papers below are the ones that map directly onto our design; each entry says *what to borrow*.

## Why run 01 collapsed — the literature explains it

Three findings converge on exactly what we saw:

1. **Small models have weak survival priors.** *Do LLM Agents Exhibit a Survival Instinct?* ([arXiv:2508.12920](https://arxiv.org/abs/2508.12920)) found small models showed **0% survival-seeking behaviour** under scarcity (vs 83% for large models). Our 3B cast ignoring 28 days of hunger is the predicted result, not a bug in our prompt.
2. **LLMs are RLHF-biased toward harmony / positivity.** *Social Simulations with LLM Risk Utopian Illusion* ([arXiv:2510.21180](https://arxiv.org/abs/2510.21180)) names "positivity bias" and "primacy effect" — agents converge to polite, agreeable, on-topic-with-each-other text regardless of persona. Our poetic mutual-echo is this.
3. **Centralised topology accelerates convergence.** *Conformity Dynamics* ([arXiv:2601.05606](https://arxiv.org/abs/2601.05606)) and *Spontaneous Emergence of Agent Individuality* ([arXiv:2411.03252](https://arxiv.org/abs/2411.03252)): when everyone hears everyone (our global `SAY`), agents entrain to one register. Bounded communication ranges preserve diversity. Same model across the cast (run 01) removes the last source of divergence.

So run 01's failure is over-determined by three independent, documented mechanisms — not a fluke.

## Anchor papers

| Paper | Year | Borrow |
|-------|------|--------|
| **Generative Agents** ([2304.03442](https://arxiv.org/abs/2304.03442)) | 2023 | Memory **retrieval** scored by `recency·0.995^h + importance(1–10) + relevance(cosine)`; **importance-gated** reflection (fires when cumulative importance crosses a threshold, not on a calendar); reflections stored as **first-class retrievable memories**. Our 7-day recency-only truncation + calendar reflection is the ablated-down version their study shows degrades believability most. |
| **Concordia** ([2312.03664](https://arxiv.org/abs/2312.03664)) | 2023 | A **Game Master** layer between agent intent and world state: narrates consequences, enforces plausibility. A GM can reflect "your speech produced no trades" back into memory, punishing empty `SAY`. |
| **CAMEL** ([2303.17760](https://arxiv.org/abs/2303.17760)) | 2023 | **Inception / contrastive prompting**: tell each agent its role *and how it differs from the others* ("others speak mystically; you speak plainly about money"). Counteracts pull toward the average persona. |
| **Decoding Echo Chambers** ([2409.19338](https://arxiv.org/abs/2409.19338)) | 2024 | Quantitative metrics — **Polarization (variance), Global Disagreement, Normalized Clustering Index** — and a **dual memory** (compressed long-term + verbatim short-term). Cheaper than RAG, fixes amnesia. |
| **Opinion Dynamics with LLM agents** ([2311.09618](https://arxiv.org/abs/2311.09618)) | 2023 | LLMs default to consensus; realistic faith/ideology tension needs **explicit confirmation-bias / belief-rigidity** seeded in the persona. |
| **JASSS LLM-ABM survey** ([2507.19364](https://arxiv.org/abs/2507.19364)) | 2025 | **Hybrid architecture**: hard rules for survival mechanics, LLM only for higher reasoning. Numeric **goal/need vectors** in every prompt. |
| **Generative Agents of 1,000 People** ([2411.10109](https://arxiv.org/abs/2411.10109)) | 2024 | Ground personas in a **structured "formative interview"** rather than free prose — stays in character longer, richer day-1 retrieval corpus. |
| **PersonaEvolve** ([2509.16457](https://arxiv.org/abs/2509.16457)) | 2025 | Weekly **distribution check**: if `SAY:action` ratio is too high for an agent, rewrite a *trait* (not an instruction) toward practical urgency. Fits our existing weekly reflection. |
| **Collective behaviour metrics** ([2602.16662](https://arxiv.org/abs/2602.16662)) | 2025 | **Mean Pairwise Distance** of per-agent action-frequency vectors as a one-number mode-collapse detector; Participation Ratio for behavioural dimensionality. |
| **BeliefShift** ([2603.23848](https://arxiv.org/abs/2603.23848)) | 2026 | Metrics to separate **genuine belief revision (evidence-driven) from sycophantic drift (social-pressure-driven)** — a structured task for the offline Claude synthesis. |

## Prioritised improvement levers (for this project)

Ranked by expected impact on the run 01 failure (register collapse + economic inaction) and fit to the current TypeScript engine. These are **proposals**, not yet decided — see open questions in [run-plan](run-plan.md).

1. **Rule-enforce survival (highest impact, smallest change).** Before each LLM call, if hunger is critical, lock the action space to `{HARVEST, GO_TO_MARKET, REST}` and put an URGENT line first in the prompt. No poetry can come from a locked action set. *(JASSS survey, Sugarscape.)*
2. **Diverse + larger models per citizen slot.** Run 02 already plans this. The single-model cast is the prime suspect. *(Conformity, Individuality.)*
3. **Bound the `SAY` channel.** A social graph so an agent hears only its 2–3 nearest others, not a global broadcast. Breaks the entrainment loop and creates Christian/atheist micro-cultures to measure. *(Individuality, Conformity.)*
4. **Contrastive persona anchors + anti-sycophancy line.** Add to each system prompt: the agent's distinguishing trait vs the others, ≥1 explicit negative trait, and "you are not required to be polite or cooperative." *(CAMEL, Utopian Illusion.)*
5. **Importance-scored, retrieval-based memory + importance-gated reflection.** Replace 7-day recency truncation with `recency+importance+relevance` top-K; trigger reflection on cumulative importance, not the calendar. *(Generative Agents.)* Cheaper interim: dual memory (compressed long-term + verbatim last 1–2 days). *(Echo Chambers.)*
6. **Automated degeneration metrics.** Log per-day **MPD** of action-frequency vectors, **faith-intensity variance**, and **type-token ratio** of `SAY` text. Abort/flag a run when MPD collapses, instead of reading 1,883 lines by hand. *(Collective behaviour, Echo Chambers, Individuality.)*
7. **Seed belief rigidity.** A `belief_rigidity` 0–10 per agent injected into the prompt, so faith doesn't drift to bland pluralism. *(Opinion Dynamics.)*
8. **Game-Master consequence layer.** Narrate the result of each action back into memory so empty speech has visible non-effect and scarcity is legible. *(Concordia.)*

## Tension with existing decisions

Some levers cut against load-bearing decisions and would need an ADR to adopt:

- Lever 1 (rule-enforced survival) and lever 8 (GM) push against [ADR 003](../decisions/003-narrative-only-regime-with-llm-leaders.md)'s "no engine enforcement" principle. The narrow version — enforce only *survival affordances*, not social/economic outcomes — is probably compatible; a GM that *narrates* without *dictating* is borderline.
- Lever 4's numeric traits push against [ADR 002](../decisions/002-prose-persona-no-traits.md) (pure prose, no numeric traits). Big-Five/rigidity *scores* are exactly what 002 rejected. A prose-only realisation ("you rarely change your mind on faith; you resent charity") may capture most of the benefit without breaking 002 — to be decided.
- Lever 5 (retrieval/RAG-ish memory) is explicitly the deferred upgrade path in [perception-memory](../design/perception-memory.md); run 01 arguably now justifies it.

Full annotated source list (with ~17 papers + extras) is in the research output that produced this page; the table above is the curated subset that bears on our design.
