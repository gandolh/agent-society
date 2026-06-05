# 013 — World dynamics: destination-aware survival, religious alms, conversion fatigue, weather

**Status:** accepted (built 2026-06-05; spatial-layer features behind `config.spatial`, weather behind `config.weather`)
**Date:** 2026-06-05
**Related:** [010](010-run01-homogenisation-mitigations.md), [011](011-death-from-hunger.md), [012](012-ocean-town-spatial-capabilities-economy.md), [../runs/2026-06-05_capitalism_spatial_run03-summary](../runs/2026-06-05_capitalism_spatial_run03-summary.md)

A batch of dynamics added after run03 exposed small-model planning failures and to make the world richer but still self-sustaining.

## Decisions

### 1. Destination-aware survival lock
Run03's Lior starved oscillating between non-food zones while survival-locked — the lock forced "do something about food" but not "go where food is." Now: when an agent is starving (`hungerDays ≥ survivalHungerThreshold`) and not standing in a food zone, the URGENT prompt block **names the nearest food zone + its id**, and the `TRAVEL` handler **auto-redirects** any starving travel to the nearest food zone regardless of the requested target. A starving agent cannot wander away from food. Food zones = harbour/farm/forage/market (chapel excluded from routing since alms is faith-gated).

### 2. Religious food charity (alms)
Each religious building (currently the chapel → Christianity; atheism has no building per the corpus) holds a **food treasury**, seeded with `almsTreasurySeed` (6) and grown by **food TITHEs made at the building**. A new verb `SEEK_ALMS` (chapel-gated): a *hungry* agent who shares the building's faith — **or** sets `convertIntent: true` — receives `almsFoodAmount` (2) free food from the treasury. Others are refused in character. A would-be convert who accepts alms also converts (subject to fatigue, below). The loop is **self-sustaining**: adherents tithe food in, the needy draw food out — no engine food-spawning, honoring [ADR 003](003-narrative-only-regime-with-llm-leaders.md).

### 3. Conversion fatigue
Agents track a lifetime `conversionCount`. After `maxConversions` (default 2), any further `CONVERT` (or alms-conversion) is **refused** — "the faith doubts your sincerity." Keeps belief changes meaningful and stops a small model from flip-flopping faith for convenience.

### 4. Weather (seeded RNG world dynamic)
When `config.weather` is on, each day's weather is rolled deterministically from `seed + day` (reproducible) as one of clear/rain/storm/drought (~51/34/7/8%). It couples to the food economy: **storm blocks fishing**, **rain boosts foraging & harvest 1.5×**, **drought halves crops**. Surfaced in the TODAY prompt block and the transcript so agents can plan (fish on clear days, farm in rain). This is the project's first stochastic world event — the `rng.ts` hook that always existed, finally used.

## Consequences

- **Enables** a real reason to move and time activities (weather), a faith-based safety net that gives religion economic teeth (alms — and a concrete carrot for conversion), and meaningful, bounded belief change (fatigue). Together they make the food economy less of a flat "everyone fishes" loop.
- **Self-sustaining:** alms can't inflate the food supply (treasury is tithe-funded); weather is symmetric-ish (boosts and penalties); death ([011](011)) still bounds the population.
- **Tension/precedent:** alms and the survival redirect are mild engine *enforcement*, but of *affordances/guidance* not *outcomes* — consistent with [ADR 010](010-run01-homogenisation-mitigations.md)'s "narrow enforcement" carve-out of 003. No numeric persona traits added, so [ADR 002](002-prose-persona-no-traits.md) stands.
- **Config knobs:** `survivalHungerThreshold`, `almsFoodAmount`, `almsTreasurySeed`, `maxConversions`, `weather`. All default-on in the built-in config; each independently disableable.
- **Open:** atheism has no building, so atheists have no alms safety net — deliberate asymmetry (matches the corpus: atheism has no figurehead), but worth watching whether it disadvantages the atheist minority unfairly.
