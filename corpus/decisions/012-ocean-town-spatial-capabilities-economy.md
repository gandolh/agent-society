# 012 — Ocean town: spatial layer, expanded capabilities, core economy, group wealth

**Status:** accepted (built 2026-06-05, gated behind `config.spatial`, default off)
**Date:** 2026-06-05
**Supersedes:** the "No spatial layer" stance in [../design/architecture](../design/architecture.md); the narrative-only-location stance in [../world/setting](../world/setting.md)
**Amends:** [003](003-narrative-only-regime-with-llm-leaders.md) (narrow economic enforcement); composes with [010](010-run01-homogenisation-mitigations.md), [011](011-death-from-hunger.md)
**Related:** [../world/setting](../world/setting.md), [../world/economy](../world/economy.md), [../design/action-set](../design/action-set.md), [../design/perception-memory](../design/perception-memory.md), [../experiments/related-work](../experiments/related-work.md)

> Adapted from the user's **Farm Valley** ADR-007 (a BDI/ECS farm sim on an 88×80 archipelago). We keep its **capability vocabulary, spatial localization, and zone affordances**, but adapt three things to Agent Society's premises: the **brain stays the LLM** (not BDI heuristics), **personas stay prose** ([002](002-prose-persona-no-traits.md)), and **only core economics are engine-enforced** — peer trade, gifts, friendship, and services remain narrative.

## Context

Agent Society is aspatial with a 10-verb action set and no real economy; run 01 homogenised badly. The user wants the society to live in an **ocean-side town**, **fish and farm**, **survive and accumulate wealth**, tracked **per individual and per social group**, with **gold as the medium for trade, friendship, and buying services**. Farm Valley already proves a concrete spatial + capability + zone design; this ADR ports it under Agent Society's constraints.

## Decision

### A. Setting — ocean-side town on a grid

- The world becomes a **grid map** (`config.spatial`, off by default so prior aspatial runs are unaffected). Named **zones** sit on the grid; the coast/ocean is a first-class feature. Reasonable starting size ~30×20 (smaller than Farm Valley's 88×80 — six agents, not five farms + travel-maximising corners).
- Zones (Agent-Society flavour of Farm Valley's): **harbour/fishing pier** (ocean-adjacent), **farm plots** (per agent or shared), **market square** (shop + wall), **mill**, **chapel**, **homes**. Each zone *affords* a subset of actions (below).
- `SAY` becomes **local**: heard only within `sayRadius` (Chebyshev distance) of the speaker, not globally. This is also the run-01 homogenisation fix from [../experiments/related-work](../experiments/related-work.md) (bounded communication ranges → preserved diversity).

### B. Brain — still the LLM

Agents decide every turn via the model from their prose persona, exactly as today. We do **not** port Farm Valley's `deliberate*`/FSM heuristics or numeric personality tuning. The richer capability set is offered to the model; the model chooses. ([001](001-research-experiment-framing.md), [002](002-prose-persona-no-traits.md) intact.)

### C. Capability vocabulary (imported from Farm Valley, LLM-chosen)

New/changed verbs layered onto the existing set. AP costs mirror Farm Valley where sensible; all config-tunable.

| Verb | AP | Requires | Notes |
|------|----|----------|-------|
| `TRAVEL(to)` | 0–1 | a reachable zone/tile | walking; cheap, throttled by distance (multi-turn for far zones) |
| `FISH` | 1 | rod + at harbour/pier adjacent to ocean | yields food (and sometimes a premium catch → gold) |
| `FARM` (= `WORK_PLOT`) | 1 | on a farm plot | plant/tend; existing crop loop |
| `HARVEST` | 1 | ready crops on plot | existing |
| `FORAGE` | 1 | in-season forage zone | seasonal food |
| `MILL` (= `PROCESS`) | 2 | at the mill | raw crops → gold premium |
| `GO_TO_MARKET` | 2 | at market square | shopkeeper fixed-price buy/sell (existing) |
| `POST_OFFER` / `READ_OFFERS` / `BUY_FROM_WALL` | 1 / 1 / 3 | at market wall | async peer marketplace (engine-tracked listings) |
| `GIVE` | 1 | co-located (or relaxed) | unilateral transfer — gifts, friendship, paying for services (narrative) |
| `SAY` / `DM` / `PRAY` / `TITHE` / `CONVERT` / `REST` | — | as today | `SAY` now local |

Retired/renamed as needed; the engine still validates each in its handler. Tools (rod, hoe) may be modelled lightly or assumed — TBD in the plan.

### D. Economy — core enforced, trades narrative (amends 003)

The engine **enforces**: per-agent **inventory** (gold/food/seeds/fish/materials), the **shopkeeper** (fixed buy/sell), and the **market wall** (listings: post → read → buy, gold + goods actually move). The engine does **not** enforce: peer-to-peer prices, gifts, friendship, hiring/services, or who-helps-whom — those happen through `GIVE`/`SAY`/`DM` and are interpreted narratively, preserving 003's spirit (compliance/cooperation *emerge*). **No auctions, Contract-Net, or numeric trust matrix in v1** (parked; Farm Valley has them, we defer).

Gold is explicitly the medium for **trades** (shop/wall/peer `GIVE`), **friendship** (gifting), and **services** (an agent pays another via `GIVE` after a `SAY`/`DM` agreement — the "contract" is narrative, the transfer is enforced).

### E. Wealth — individual and by social group

- **Individual wealth** = an agent's gold (already tracked).
- **Group wealth** = sum of members' gold, grouped **by faction**: religion (Christian vs atheist) and class (worker vs owner/industrialist). Computed each day into the metrics/day-end snapshot — no new agent state needed, just an aggregation over existing `religion`/`role`. Lets us observe e.g. "do owners pull away from workers under capitalism?" (ties to hypothesis H7).

## Alternatives considered

- **Port BDI brain / numeric personas.** Rejected — reverses 001/002, kills the LLM-emergence premise. (User chose LLM brain.)
- **Full Farm Valley economy (auctions + CNP + trust matrix).** Rejected for v1 — large build, large 003 reversal. (User chose core econ + narrative trades.)
- **Emergent friend-cluster group wealth.** Deferred — needs a relationship graph + community detection. Faction grouping reuses existing state. (User chose by-faction.)
- **Graph movement (zone nodes only).** Plausible lighter alternative to a full grid; the plan defaults to a grid with zones on it per the user's "grid + locations" preference, but this remains an open knob.

## Consequences

- **Enables** survival-and-wealth gameplay with real spatial cost (where you spend the day matters), legible economic stratification (individual + group), and bounded `SAY` (anti-homogenisation). Composes with death-from-hunger ([011](011)) to make fishing/farming genuinely stakes-bearing.
- **Makes harder:** bigger engine surface (map, pathfinding-lite, wall listings, zone affordances, scoped perception); the transcript must render a text map (no GUI — [005](005-manual-observer-workflow.md) preserved). More per-turn prompt tokens.
- **Open questions:** grid size + zone layout; whether tools are modelled or assumed; movement as free grid vs zone-graph; `sayRadius` default; shared vs per-agent farm plots; whether NPC fixtures fish/farm or only run services. Resolved in the build plan below before code.

## Built (2026-06-05)

Implemented in 5 mechanical stages (see [../design/ocean-town-build-plan](../design/ocean-town-build-plan.md)), all gated behind `config.spatial` (default `false`), each verified by a deterministic test + a live spatial smoke. A hard constraint shaped the build: the project is **budget-locked on `ministral-3:3b-cloud`**, so the spatial layer had to *minimise* per-turn tokens, not add to them. Resolutions:

- **Map:** 16×10 grid, free Chebyshev movement, zones placed on it; ocean on the south coast. Default map auto-filled when `spatial` is on. Resolved "grid vs zone-graph" → grid; "size" → compact (short travel on a 31-day run).
- **Token minimisation (the key adaptation):** agents never see coordinates or an ASCII map — only zone *names* in a 3-line `WHERE` block. `SAY` is scoped to `sayRadius` (default 1), so distant speech does **not** enter a prompt — this both fixes run-01 homogenisation *and* shrinks prompts. Zone-gated actions are hidden unless the agent stands at the right zone (shorter action list, no wasted retries). Market-wall offers shown only at the market.
- **Capabilities:** `TRAVEL`, `FISH` (harbour→food), `FORAGE` (forage→food), `MILL` (crops→gold) added; `WORK_PLOT`/`HARVEST`/`GO_TO_MARKET` zone-gated. Tools **assumed** (not modelled). NPCs **can** work like anyone (not service-only).
- **Economy:** shopkeeper (zone-gated `GO_TO_MARKET`) + **market wall** with escrowed listings (`POST_OFFER`/`READ_OFFERS`/`BUY_FROM_WALL`), TTL refund. Peer gifts/services stay narrative.
- **Wealth:** daily tally — per individual + by religion + by class (owner = industrialist, else worker) — logged as a transcript line and a `world_event{kind:"wealth"}`.
- **Farm plots:** per-agent (unchanged from v2). **Deferred:** auctions, Contract-Net, numeric trust, tool durability, A* pathfinding, unrested-AP penalty.
