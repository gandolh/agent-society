# Experiments — Run plan

**Status:** stable
**Last updated:** 2026-05-28
**Related:** [hypotheses](hypotheses.md), [../design/research-goals](../design/research-goals.md), [../world/regimes/overview](../world/regimes/overview.md), [../runs/2026-05-26_socialism_run01-summary](../runs/2026-05-26_socialism_run01-summary.md)

The planned experiment matrix. In v2 the regime is fixed (capitalism); what varies is the per-slot **model assignment** and the **seed**. The cast is constant.

> **v1 → v2.** The original plan was a regime sweep (socialism / monarchy / capitalism, 100 days each, local 7–8B models). It was retired with the [v2 pivot](../decisions/009-city-capitalism-christian-pivot.md). Run 01 was the only v1 run; it ran 31 days on a single 3B cloud model and collapsed into homogeneous poetic sycophancy. See its [summary](../runs/2026-05-26_socialism_run01-summary.md).

## Run matrix

| Run | Date | Regime | Models | Seed | Days | Status | Goal |
|-----|------|--------|--------|------|------|--------|------|
| 01 | 2026-05-26 | socialism (v1) | all `ministral-3:3b-cloud` | 42 | 31 | **done — failed** | MVP validation. Outcome: register collapse, near-zero economic action. |
| 02 | TBD | capitalism (v2) | **diverse, larger** per citizen slot | 42 | 31 | planned | First v2 run. Beat the run 01 failure mode: a readable, *heterogeneous* transcript with real economic action. |
| 03 | TBD | capitalism | same as 02 | 7 | 31 | planned | Reproducibility under seed (H8). How much was the condition vs. the dice? |
| 04 | TBD | capitalism | swap one citizen model | 42 | 31 | planned | Model-effect probe (H6). Same seed/persona, one slot's model changed. |
| 05 | TBD | (depends on 02–04) | TBD | TBD | TBD | not yet planned | Stress-test whatever broke or surprised. |

## Run 02 — first v2 capitalism run (the one that matters next)

**Purpose:** produce the first usable v2 transcript and, above all, **not repeat run 01's homogenisation**.

**Setup:**
- Regime: capitalism. Aldric owns the mill and sets prices. See [../world/regimes/capitalism](../world/regimes/capitalism.md).
- Religions: Christianity (majority) + atheism (Bram, Nyssa). See [../world/religions/overview](../world/religions/overview.md).
- Cast: six agents per [../agents/overview](../agents/overview.md).
- **Models: distinct families across V1/V2/V3**, one cheap shared model for NPCs. Avoid a single small model across the whole cast — that was the run 01 mistake. Larger than 3B where the free tier allows.
- Day count: 31. Seed: 42.

**Pre-run checklist:**
- [ ] Personas reviewed and locked. Core identities in `corpus/agents/*.md`.
- [ ] Per-slot models chosen and **probed against the live API key** (`scripts/probe-cloud-models.ts`) — confirm free-tier availability and reasonable latency.
- [ ] `config.json` written (gitignored) with all parameters and per-slot `model` fields.
- [ ] Smoke test: `npm run smoke -- runs/<dir>/config.json` to confirm prompts render and the logger writes. Throw away.

**Watch during/after:**
- Did the cast homogenise again? (the failure bar from run 01)
- Did real economic action happen — market, give, work, harvest — or only talk?
- Did anyone go on record / relent (Tessa or Bram → Nyssa, H5)?
- Did Aldric harden (H4)? Did anyone drift on Aldric without converting (H1)?

**Post-run:**
- Read `transcript.md` end-to-end.
- Paste into Claude using the templates in [../design/observer-workflow](../design/observer-workflow.md).
- Write `runs/<runDir>/summary_final.md` and `corpus/runs/<runDir>-summary.md`.
- Append to [../log.md](../log.md). Update [hypotheses](hypotheses.md) with any null/invalidation observations.

## Run 03 — reproducibility under seed

Same cast/models as run 02, new seed. If the story is wildly different, seed variance is high and we need more runs per condition. If it's similar, single-run reads across model assignments become trustworthy.

## Run 04 — model-effect probe

Same seed and personas as run 02; change exactly one citizen slot's model. Differences in that slot's voice/decisions — within Ollama nondeterminism — are attributable to the model (H6).

## Mitigations to try if homogenisation recurs

Driven by the run 01 failure. Apply incrementally, not all at once, so the cause is legible:

1. **Bigger / more diverse models** (the first lever; run 02 already does this).
2. **Raise sampling temperature** above 0 for the *action* call so agents don't lock-step (keep reflection lower).
3. **Tighten the action prompt toward action** — penalise / de-emphasise repeated `SAY`; require economic self-maintenance.
4. **Inject diversity pressure** — e.g. a system-prompt nudge that the agent should pursue *their own* concrete goal this turn, not echo the square.
5. **Per-relationship memory or rolling summary** (see [../design/perception-memory](../design/perception-memory.md)) so accumulating facts (hunger, prices) actually persist past 7 days.

## What to track over time

| Run | Homogenised? | Economic actions | Conversions | Major DMs | Drift moments | Notes |
|-----|--------------|------------------|-------------|-----------|---------------|-------|
| 01 | **Yes (total)** | ~0 | 0 | few | none real | register collapse; see summary |
| 02 | TBD | TBD | TBD | TBD | TBD | TBD |

Populated after each run. This is the closest the project gets to a quantitative dashboard; most of the value stays qualitative.
