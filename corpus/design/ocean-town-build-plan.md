# Design — Ocean town build plan

**Status:** built — all 5 mechanical stages done (Stages 1–5); gated behind `config.spatial` (default off)
**Last updated:** 2026-06-05
**Related:** [../decisions/012-ocean-town-spatial-capabilities-economy](../decisions/012-ocean-town-spatial-capabilities-economy.md), [architecture](architecture.md), [action-set](action-set.md), [perception-memory](perception-memory.md), [../world/economy](../world/economy.md)

Staged implementation plan for [ADR 012](../decisions/012-ocean-town-spatial-capabilities-economy.md). Everything is gated behind `config.spatial` (default `false`); aspatial runs are untouched until we commit. Each stage typechecks + has a deterministic test (like the death test) before the next.

## Stage 0 — config + state scaffolding

- **`schemas.ts`**: add `spatial: boolean (default false)`, `map?: { width, height, zones: Zone[] }`, `sayRadius (default 1)`, `moveSpeed (default 3)`. New resources on `ResourcesSchema`: `fish`, `materials` (kept optional/back-compatible). New zone schema: `{ id, name, kind, x, y, w, h, owner? }` where `kind ∈ harbour|farm|market|mill|chapel|home|forage|ocean`.
- **`types.ts`**: `AgentState` gains `pos: {x,y}` and `zoneId?: string`. `WorldState` gains `map?` and `wall: WallListing[]`. `WallListing = { id, seller, item, qty, unitPrice, day }`.

## Stage 1 — map + movement ✅ DONE (2026-06-05)

Built and verified (typecheck + deterministic test + 1-day spatial smoke). Notes vs. the original plan:
- Geometry lives in a dedicated [`src/spatial.ts`](../../src/spatial.ts) (`dist`, `zoneAt`, `zoneById`, `stepToward`, `agentsWithin`, `atZoneKind`).
- Movement is a greedy Chebyshev step (no A*), `moveSpeed` (default 4) tiles/turn. Far zones take multiple turns; arriving sets `arrived: true`.
- **Token-minimal `WHERE` block** instead of an ASCII map: current zone, who's nearby (within `sayRadius`), and travel targets as `id:kind` pairs. Coordinates never shown to the agent.
- `TRAVEL` only offered when `config.spatial`; default ocean-town map in `runDriver` (16×10, harbour on the south coast, market hub, mill, chapel, two fields, a forage grove, one home per slot). Run with `npm run sim -- --spatial` (or `config.spatial:true` + `config.map`).
- Original plan below for reference.

- **`world.ts`**: build the map from config; place agents at their home zone. `zoneAt(x,y)`, `isWalkable`, `dist(a,b)` (Chebyshev), `agentsWithin(pos, r)`.
- **New `TRAVEL` action** (`actions/index.ts` + `ActionNameSchema`): move up to `moveSpeed` tiles toward a target zone/tile; AP 0–1; arriving mid-zone allowed. Lightweight greedy step (no WASM A* — straight-line with obstacle skip is enough for ~30×20).
- **Perception** (`prompts/system.ts`): add `=== WHERE YOU ARE ===` (zone, who's here, adjacent zones + distance) and a compact ASCII map. Roster splits into "here" vs "elsewhere (name+zone only)".

## Stage 2 — scoped SAY + local perception ✅ DONE (2026-06-05)

Built + verified (deterministic prompt test + live smoke). In spatial runs:
- **`PUBLIC TODAY`** shows only events whose actor is within `sayRadius` of the viewer — distant `SAY` is genuinely unheard (anti-homogenisation) and the prompt carries fewer lines.
- **Roster** shows full `g/f/s` detail only for nearby agents; distant agents collapse to `id name (religion) @elsewhere` — info asymmetry + token savings.
- The `SAY` action description is rewritten to "only people near you hear it" when spatial. DMs remain non-spatial (a letter reaches anyone).
- Original plan below for reference.

- Filter each agent's `PUBLIC TODAY` and roster detail by `sayRadius`. Distant `SAY` is genuinely unheard. (This is the anti-homogenisation lever.)
- **`logger.ts`**: action prose gains a `@zone` tag; day header renders the ASCII map with agent positions.

## Stage 3 — fishing + farming + zone affordances ✅ DONE (2026-06-05)

Built + verified (deterministic test + live 2-day spatial sim — agents travelled between zones). Notes:
- New verbs `FISH` (harbour → +`fishYield` food), `FORAGE` (forage zone → +`forageYield` food), `MILL` (mill → ready crops become `millGoldPerCrop` gold each). Config knobs default 2/2/2.
- **Zone-gated** actions (`requireZone`): `WORK_PLOT`/`HARVEST` need a `farm` zone, `GO_TO_MARKET` a `market`, `FISH` a `harbour`, `FORAGE` a `forage`, `MILL` a `mill`. Aspatial runs unrestricted.
- **Token win:** the actions-available block hides zone-gated verbs unless the agent stands at the right zone — shorter prompt + no wasted retries on actions that'd fail.
- `--spatial` (or `config.spatial`) now auto-fills the default ocean-town map if none is supplied.
- Original plan below for reference.

- **`FISH`**: requires harbour zone adjacent to ocean; yields `food` (+ chance of premium catch → sellable). Reuses the crop-maturity-free instant-yield pattern of `HARVEST`.
- **`FARM`/`HARVEST`/`FORAGE`/`MILL`**: gate each handler on the agent's current `zoneId.kind`. Farm = existing crop loop; forage = seasonal food; mill = crops→gold premium.
- Affordance check is a small table: `ZONE_AFFORDS[kind] = Set<ActionName>`; the actions-available block filters by it when spatial.

## Stage 4 — economy: shopkeeper + market wall ✅ DONE (2026-06-05)

Built + verified (deterministic post/buy/expire test). Notes:
- Shopkeeper = existing `GO_TO_MARKET`, market-zone-gated (Stage 3).
- **Market wall** is engine-tracked on `WorldState.wall` with **escrow**: `POST_OFFER` deducts goods immediately; `BUY_FROM_WALL` moves gold to seller + goods to buyer (partial buys decrement qty); unsold listings **refund escrow to the seller after `wallListingTtlDays`** (default 3) at end-of-day. `READ_OFFERS` spends the turn; offers are injected into perception only when at the market (`=== MARKET WALL ===`, with ids) to keep other prompts short. Can't buy your own listing.
- Peer gifts / friendship / services remain narrative via `GIVE`/`SAY`/`DM` (no new verbs) per ADR-012.
- Original plan below for reference.

- **Shopkeeper** = existing `GO_TO_MARKET` (fixed prices), gated to the market zone.
- **Market wall**: `POST_OFFER(item, qty, unitPrice)` (writes a `WallListing`), `READ_OFFERS` (perception injects current listings when at market), `BUY_FROM_WALL(listingId, qty)` (gold + goods move between buyer and seller, engine-enforced). Listings expire after N days.
- Peer trade / gifts / services stay narrative via `GIVE` + `SAY`/`DM` — no new verbs.

## Stage 5 — wealth metrics (individual + group) ✅ DONE (2026-06-05)

Built + verified (deterministic aggregation test + live smoke). `computeWealth(world)` tallies, each day-end: per-individual gold, total by religion (Christianity/Atheism), and total by class (owner = industrialist role, else worker), over **living** agents only. Logged as a terse transcript line (`*Wealth dN — individuals: … By faith: … By class: …*`) and a structured `world_event{kind:"wealth"}` in `events.jsonl` for offline analysis. Pure aggregation, no new agent state. Original plan below.

- Extend the `day_end` snapshot / a metrics writer: per-agent gold (have it) **plus** group totals: `byReligion`, `byClass` (worker vs owner). Pure aggregation over existing fields — no new agent state.
- Log a daily wealth line to the transcript and a structured `world_event` (`kind: "wealth"`). This also seeds the automated-metrics idea from [../experiments/related-work](../experiments/related-work.md).

## Stage 6 — corpus + ADR finalize

- Flip ADR 012 `proposed → accepted`. Update [../world/setting](../world/setting.md) (ocean town, mechanical zones), [../world/economy](../world/economy.md) (fish/materials, wall), [action-set](action-set.md) (new verbs + affordance table), [perception-memory](perception-memory.md) (scoped perception + map), [architecture](architecture.md) (map/wall components), index + log.

## Open knobs (defaults chosen; flag to change)

| Knob | Default | Alt |
|------|---------|-----|
| Map size | 30×20 | bigger for more travel cost |
| Movement | free grid, zones on it | zone-graph (nodes only) |
| `sayRadius` | 1 (co-located + adjacent hear you) | 0 (same tile only) / wider |
| Tools (rod/hoe) | assumed (not modelled) | model durability like Farm Valley |
| Farm plots | one per agent (as today) | shared communal plots |
| NPC work | NPCs also fish/farm | NPCs run services only |
| Group def | religion + class | + emergent clusters later |

## Not in this plan (parked from Farm Valley)

Auctions (English/FPSB), Contract-Net negotiation, numeric pairwise trust matrix, blacksmith/carpentry tool upgrades, A* WASM pathfinding, the unrested-AP penalty for sleeping away from home. Each can be a later ADR if a run shows we need it.
