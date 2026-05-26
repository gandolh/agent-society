# Experiments — Run plan

**Status:** stable
**Last updated:** 2026-05-26
**Related:** [hypotheses](hypotheses.md), [../design/research-goals](../design/research-goals.md), [../world/regimes/overview](../world/regimes/overview.md)

The planned experiment matrix. Each row is one run. Cast is constant; regime varies; seed varies for diagnostic reruns.

## Run matrix (planned)

| Run | Date | Regime | Seed | Days | Status | Goal |
|-----|------|--------|------|------|--------|------|
| 01 | 2026-05-26 | Socialism | 42 | 100 | planned | **MVP validation.** Does the framework produce a transcript Claude can analyze? Does at least one agent drift? |
| 02 | TBD | Socialism | 7 | 100 | planned | **Reproducibility check.** Same regime, different seed. How much variance across runs of the same condition? |
| 03 | TBD | Monarchy | 42 | 100 | planned | **First regime swap.** Same seed as run 01 — direct comparison of regime effect with all else equal. |
| 04 | TBD | Capitalism | 42 | 100 | planned | **Second regime swap.** Full triple comparison: socialism vs monarchy vs capitalism, all on seed 42. |
| 05 | TBD | (depends on 1-4 findings) | TBD | TBD | not yet planned | Stress test of whatever broke or whatever was surprising. |

## Run 01 — Socialism, seed 42 (MVP)

**Purpose:** validate the framework. Produce a readable transcript. Confirm at least one of:
- Eda drifts visibly in her current-state (H1).
- Bram acts in public on his ideological alignment with Aldric (H2).
- Lior apostatizes from the Vine (H3).
- Aldric hardens (H4).

**Setup:**
- Regime: socialism (Aldric is Council Chair). See [../world/regimes/socialism](../world/regimes/socialism.md).
- Religions: Christianity + True Vine + Atheism, as in [../world/religions/overview](../world/religions/overview.md).
- Cast: 6 agents per [../agents/overview](../agents/overview.md).
- Day count: 100.
- Seed: 42.

**Pre-run checklist:**
- [ ] Personas reviewed and locked. Core identities in `corpus/agents/*.md`.
- [ ] Models pulled in Ollama: `llama3.1:8b`, `mistral:7b`, `qwen2.5:7b`.
- [ ] Disk space for `runs/2026-05-26_socialism_run01/` (estimate: <50MB for 100-day text logs).
- [ ] `config.json` written with all parameters from [../design/log-format](../design/log-format.md).
- [ ] Smoke test: 1-day dry run to confirm prompts render, Ollama responds with valid JSON, logger writes correctly. Throw away.

**During run:**
- Unattended for ~10 hours.
- Optional: check `transcript.md` periodically to ensure not stuck.
- Crash recovery: world state should be persisted at end of each day so restart resumes mid-run.

**Post-run:**
- Read `transcript.md` once end-to-end.
- Paste into Claude using the templates in [../design/observer-workflow](../design/observer-workflow.md).
- Fill in `runs/2026-05-26_socialism_run01/summary_final.md`.
- Append run summary to [../log.md](../log.md).
- Update [hypotheses](hypotheses.md) if any null/invalidation observations appeared.

## Run 02 — Reproducibility check

If run 01 succeeds, run 02 is **the same regime with a different seed**. The question is: how much of what we observed in run 01 was *the regime* and how much was *this particular roll of the dice*?

If run 02 produces a wildly different story (e.g. nobody drifts, Bram converts to the Vine), we have learned that **variance across seeds is high** and we will need more runs per condition to draw any cross-regime conclusions.

If run 02 produces a similar story, we have higher confidence that the personas + regime are doing real work and we can trust single-run comparisons across regimes.

## Run 03 — First regime swap

**Same seed as run 01.** This is the critical comparison. The personas are the same, the seed is the same, the only difference is that Aldric is now the king, not the council chair. Differences in the resulting transcript can — within the limits of Ollama nondeterminism — be attributed to the regime change.

Predicted differences from run 01:
- More explicit dissent in `SAY`s (H7).
- More DM conspiracy traffic.
- Sister Velka may openly oppose the king in a way she avoided opposing the chair.
- Compliance is binary (tithed yes/no) rather than gradient (gave a lot/a little).

## Run 04 — Capitalism completes the triangle

Same seed and personas. Aldric now controls market prices. Watch wealth distribution and economic dependence.

Predicted differences from runs 01 and 03:
- Gold inequality gets larger faster (H8).
- Bram's class-conscious materialism becomes a *behavioral* signal, not just a stated belief.
- The Vine's "care for our own" doctrine has a new specific target — Aldric's market.

## Scaling decisions (after run 04)

Outcomes that would justify a v2 scale-up (more agents, multiple per model):
- **Cross-regime differences are clear and interpretable.** → scale to 2-per-model villagers (6 total) to test "do llamas befriend llamas."
- **The single-cult monoreligion landscape is too thin.** → add a second cult or a fully alien faith.
- **Runs are taking longer than 10 hours each.** → optimize: parallel Ollama calls, faster models, shorter context.

Outcomes that would justify a v2 redesign:
- **All agents collapse to one of the failure modes in [hypotheses](hypotheses.md).** → revisit memory model, perception model, reflection prompt, or persona writing.
- **Reflections are uninteresting.** → revisit reflection prompt.
- **NPCs dominate.** → revisit AP distribution, or make some NPC actions cost double AP.

## What to track over time

Across all runs, build a comparison table in this file (or a new findings page):

| Run | Conversions | Hunger crises | Major DMs | Drift moments | Notes |
|-----|-------------|---------------|-----------|---------------|-------|
| 01 | TBD | TBD | TBD | TBD | TBD |
| 02 | TBD | TBD | TBD | TBD | TBD |

Populated after each run. This is the closest the project gets to a quantitative dashboard. Most of the value remains qualitative.
