# 011 — Death from hunger

**Status:** accepted
**Date:** 2026-06-05
**Supersedes:** the "no death in v1" stance in [../world/economy](../world/economy.md) and [../design/turn-mechanics](../design/turn-mechanics.md)
**Related:** [010](010-run01-homogenisation-mitigations.md), [../world/economy](../world/economy.md), [../runs/2026-05-26_socialism_run01-summary](../runs/2026-05-26_socialism_run01-summary.md)

## Context

v1 used soft hunger pressure only — a hungry agent lost AP but could starve indefinitely without consequence. Run 01 showed the cast ignoring 28 days of hunger entirely; with no terminal stake, hunger never became a real pressure. Real scarcity needs a real downside.

This also reinforces [010](010-run01-homogenisation-mitigations.md): even narrow survival enforcement only matters if not-eating eventually *costs* something.

## Decision

Agents **die of hunger**. A new config knob `hungerDeathDays` (default **7**) sets the number of consecutive hungry days (no food eaten at end-of-day) after which an agent dies. When `hungerDays` reaches that value at end-of-day, the agent is marked dead and takes no further turns.

- Death is **config-driven and reproducible**: same seed + config → same deaths. Set `hungerDeathDays: null` to restore the old soft-pressure-only behaviour.
- The AP penalty ladder (`hungerApPenalty`, floor 3 AP) still applies on the way down, so a starving agent is increasingly incapacitated before dying — there is a recovery window.
- Dead agents are excluded from turns, the public roster, and weekly reflections. Their accumulated agent file (drift history) is preserved.
- If **all** agents die, the run ends early with an `extinction` world event.

## Implementation

- `AgentState` gains `alive: boolean` and `diedOnDay?: number`.
- `RunConfigSchema` gains `hungerDeathDays: positive int | null | optional`.
- `endDay` (world.ts) applies death after the hunger tick and returns the newly dead; `startDay` skips the dead.
- `engine.ts` logs a `world_event` of `kind: "death"` (and `"extinction"`), a transcript death marker, and exits early when nobody is alive.
- The per-turn system prompt now states the death threshold in the agent's STATE block ("you DIE at Nd without food") so the stake is legible to the model.

## Alternatives considered

- **Keep soft pressure only.** Rejected — run 01 proved it produces no behavioural pressure.
- **Instant death at first missed meal.** Rejected — too brittle; one bad day shouldn't be fatal, and it removes the interesting "scramble to recover" window.
- **Engine-forced eating.** Rejected here (that is lever 1 of [010](010-run01-homogenisation-mitigations.md), separately gated on run 02). Death makes the *consequence* real; enforcement (if adopted) makes the *response* mandatory. They compose but are decided independently.

## Consequences

- **Enables** genuine scarcity stakes, mutual-aid-or-die dynamics, and a real test of whether larger models self-preserve (the Sugarscape finding — see [../experiments/related-work](../experiments/related-work.md)).
- **Makes harder:** the social graph shrinks mid-run; the observer must handle absent actors; an NPC fixture (e.g. Father Maro) could die and remove a structural role. Mitigate by tuning `hungerDeathDays` generously and giving NPCs enough starting food, or by exempting NPCs in a future revision if their death proves disruptive.
- **Open question:** should NPC fixtures (N1–N3) be death-exempt to keep regime/religion structure stable, or is a priest starving to death itself a finding worth keeping? Left as-is (everyone mortal) for now.
