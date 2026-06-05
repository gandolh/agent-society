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

## Round 2 — fixing "talk, don't act" on a 3B model (post spatial run01/02)

After the spatial runs showed the *second* failure (agents talk + starve, don't act economically), a second literature pass targeted small-model agentic behaviour specifically. Implemented so far (see [../runs/2026-06-05_capitalism_spatial_run02-summary](../runs/2026-06-05_capitalism_spatial_run02-summary.md)): narrow survival enforcement, recency-weighted memory, concise second-person personas — which **fixed starvation** but left talk-to-act ratio high and the economy thin.

### Borrowable techniques (ranked by impact × feasibility on Ministral-3B, tight tokens)

1. **Grammar-constrained JSON output (Ollama `format` schema).** *XGrammar ([2411.15100](https://arxiv.org/abs/2411.15100)); Ollama structured outputs.* Pass a JSON schema with `action` as a typed **enum**; the 3B model then *cannot* emit prose-instead-of-action or an invalid verb at the decoding layer. **Highest-leverage fix** for our occasional malformed `TRAVEL.args.to`. Also lets us **dynamically filter the enum** — survival-lock and anti-repeat become schema edits, not just prompt text.
2. **Dynamic action-set locking at the schema level.** *Convergent (Sugarscape [2508.12920](https://arxiv.org/abs/2508.12920), Survival Games [2505.17937](https://arxiv.org/abs/2505.17937)).* We do this in the *engine* (reject + retry); doing it in the *schema enum* too would stop the wasted retries entirely. Pair with a per-turn **consequence line** ("without eating today you die in N days") — state fact, not static instruction (small models ignore old static instructions).
3. **`most_urgent_need` required JSON field before `action` (CoT-lite).** *Layered CoT ([2501.18645](https://arxiv.org/abs/2501.18645)).* One forced enum field (`food|money|safety|social|spiritual`) primes action without opening the multi-paragraph reasoning that causes poetic drift on 3B. ~Free in tokens.
4. **Anti-repeat: drop `SAY` from the enum after 3 consecutive SAYs.** Pure engineering, zero LLM cost. Directly attacks our 91-SAY problem and the run-01 echo loop.
5. **Matched 2-shot action examples (NOT free-form CoT).** *ReAct brittle foundations ([2405.13966](https://arxiv.org/abs/2405.13966)).* On small models, examples in *our exact verb+JSON format* drive correct actions; generic "think step by step" triggers lyrical drift. ~80 tokens.
6. **Make inaction costly / state rewards numerically.** *Yerkes-Dodson for agents ([2603.07360](https://arxiv.org/abs/2603.07360)), EconAgent ([2310.10436](https://arxiv.org/abs/2310.10436)).* Cooperation/trade peaks at *moderate* scarcity; put the payoff in the prompt as numbers ("FISH → +2 food") so the model compares values instead of reasoning about survival abstractly. Suggests tuning `hungerDeathDays` *down* (3–4) for a sharper response window.
7. **Ebbinghaus two-tier memory with heuristic importance.** *MemoryBank ([2305.10250](https://arxiv.org/abs/2305.10250)), Generative Agents ([2304.03442](https://arxiv.org/abs/2304.03442)).* We have recency tiers; add a cheap importance score (keyword heuristic: "died/earned/sold/converted" = high, "said/prayed/rested" = low) and decay so a key event survives longer than chatter — no embeddings.
8. **Metrics harness.** *AgentBoard ([2401.13178](https://arxiv.org/abs/2401.13178)).* Compute from `events.jsonl`: **Economic Action Rate**, **Talk-to-Act Ratio**, **per-agent pairwise speech similarity** (collapse detector, flag > 0.85), **idle rate**. Turns "did it work?" into numbers instead of transcript reading.

### Tension notes
- Items 1–4 are **engine/prompt/decoding** changes — compatible with all ADRs (they restrict *form*, not narrative outcome). Item 1 needs the Ollama client to pass `format` (small change to [`src/ollama.ts`](../../src/ollama.ts)).
- Item 6's "make inaction costly" must stay *narrative-affordance* (hunger already does this) to respect [ADR 003](../decisions/003-narrative-only-regime-with-llm-leaders.md); don't auto-debit gold for resting.
- The **codified/JSON-trait persona** ideas ([2505.07705](https://arxiv.org/abs/2505.07705), [2502.03821](https://arxiv.org/abs/2502.03821)) again tension with [ADR 002](../decisions/002-prose-persona-no-traits.md); our concise second-person prose already captured much of the benefit without numbers.
