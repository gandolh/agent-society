# 009 — City + capitalism + (Christian / atheist) pivot

**Status:** accepted
**Date:** 2026-05-28
**Supersedes:** parts of [003](003-narrative-only-regime-with-llm-leaders.md), [007](007-mvp-cast-size.md)
**Related:** [../world/setting](../world/setting.md), [../world/regimes/capitalism](../world/regimes/capitalism.md), [../world/religions/overview](../world/religions/overview.md), [../agents/overview](../agents/overview.md)

## Context

After run 01 (village + socialism, 31 days), we pivoted the scenario to a **small working city under capitalism, with a mostly-Christian population and a small atheist minority**. Six personas with distinct jobs replace the six previous personas. The True Vine reform branch and the socialism/monarchy regime variants were retired.

## Decision

1. **One regime, not three.** `Regime` enum collapses to `"capitalism"`. Socialism and monarchy are retired (their corpus pages were deleted; this ADR is the surviving pointer).
2. **Two religions, not three.** `Religion` enum collapses to `"Christianity" | "Atheism"`. The True Vine schism was retired.
3. **City, not village.** Setting is a small working city (~3,000 people, six in cast). The "plot" mechanic now represents an agent's workplace; the math is unchanged.
4. **Jobs are narrative.** Each persona has a distinct job (baker, doctor, apprentice carpenter, mill owner, priest, newspaper editor). No job-specific actions in the engine — the 10 generic verbs are unchanged.
5. **New cast (same six slots).** V1 Tessa (baker), V2 Bram (doctor — kept name, reskinned), V3 Lior (apprentice carpenter — kept name, reskinned), N1 Aldric Vance (mill owner — kept name, reskinned), N2 Father Maro (priest — preserved), N3 Nyssa Velkin (newspaper editor — replaced Sister Velka).
6. **`AgentRole` enum** collapses to `"citizen" | "industrialist" | "priest" | "editor"`. `villager`, `regime-leader`, and `cult-leader` retired.
7. **Token diet.** While rewriting the system prompt, we tightened regime/religion blocks, the action descriptions, the roster format, and the memory format. Aim: each per-turn prompt is materially shorter than v1.

## Rationale

- The original three-regime sweep was costly to maintain (three Aldric overlays, three perception blocks). One regime, deeply studied, is a sharper experiment.
- A reformist Christian schism + atheism + Christianity was structurally interesting but produced a noisy religious surface. A two-position landscape (majority + minority) is closer to the modal real configuration we want to study.
- A small city with diverse jobs makes the *economic* graph legible. Tessa needs Aldric's flour; Bram patches Aldric's workers; Lior's contracts come from Aldric; Nyssa's paper depends on Aldric's advertising. Six agents, one economic knot. The interactions are denser per minute of simulation than the village's six farmers were.
- Token cost per turn dominates the run budget. Cutting the system prompt by ~30% pays for ~30% more days at the same cost.

## What's preserved

- The 10-verb action set: WORK_PLOT, HARVEST, GO_TO_MARKET, GIVE, SAY, DM, PRAY, TITHE, CONVERT, REST.
- The bifurcated persona pattern (immutable core + weekly current-state).
- The narrative-only regime principle from [003](003-narrative-only-regime-with-llm-leaders.md).
- The MVP cast size of 6 from [007](007-mvp-cast-size.md) — three research subjects + three NPC fixtures.

## What's retired

- `world/regimes/socialism.md`, `world/regimes/monarchy.md` (files deleted).
- `world/religions/true-vine.md` (deleted).
- Old persona prose for V1 Eda, V3 Lior (village version), N1 Aldric (village version), N2 Father Maro (village version), N3 Sister Velka.

## Consequences

- The existing `runs/2026-05-26_socialism_run01/` is the last village/socialism run. It remains as a raw source but will not be the comparison baseline for future runs.
- The next run (`run02`) is single-regime capitalism, single-city, 31 days at minimum. See [../experiments/run-plan](../experiments/run-plan.md).
- ADR 003's "no engine-enforced compliance" principle now applies to wages and prices as well as taxes and tithes.
