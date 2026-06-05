# Log

Append-only chronological record of corpus changes. Each entry starts with `## [YYYY-MM-DD] <type> | <summary>` so it is greppable with `grep "^## \[" log.md | tail -N`.

## [2026-05-26] bootstrap | initial corpus established from grilling session

Initial corpus created after a long grilling session that pinned down:

- The project is a **research experiment** (not a demo, framework, or sandbox) — minimal UI, reproducibility matters, output is data + observations.
- Primary mode is **open-ended emergent behavior**, with a strong external model (Claude/GPT) used **offline via manual transcript paste** to synthesize along four dimensions: social graph, belief propagation, compliance/dissent, cooperation under scarcity.
- **Village setting** with plots, gold/seeds/food, AP per day, marketplace, and chat + DMs. The Openfront-style civilization-vs-civilization idea was parked as future work.
- **6-agent MVP cast** (down from initial 9): 3 villagers (one of each open-source model) + 3 NPC leaders. NPCs are full round-robin participants but **excluded from final research analysis**.
- **Round-robin, one action at a time, 7 AP/day**, variable AP costs, skip allowed.
- **Soft hunger pressure** (no death) — hungry agents lose AP.
- **Pure prose personas** with **bifurcated structure**: immutable core + mutable current-state updated via **weekly + event-triggered self-reflection** in the agent's own model.
- **Narrative-only regime/religion** mechanics with LLM-played leader NPCs (no engine-enforced taxes/tithes).
- Regime is the **independent variable** swept across runs: Socialism (run 01), Monarchy, Capitalism. Religions **coexist** in one village (Christianity, True Vine reformist cult, Atheism).
- Action set: 10 verbs — `WORK_PLOT`, `HARVEST`, `GO_TO_MARKET`, `GIVE`, `SAY`, `DM`, `PRAY`, `TITHE`, `CONVERT`, `REST`.
- Manual observer workflow — framework writes prose transcript + JSONL events + per-agent files; user pastes transcript to Claude offline.
- Personas drafted with **deliberate tension** seeded in each — every agent has a competing pull or unprocessed wound that the village conditions can pull on.

See [decisions/](decisions/) for the load-bearing choices with reasoning.

## [2026-05-26] ingest | Pivot to Ollama Cloud, add .env + Zod boundary validation

Three compounding decisions made together during the TypeScript build phase:

- **Endpoint:** default switched from local Ollama (`http://localhost:11434`) to **Ollama Cloud** (`https://ollama.com`). Local fallback supported.
- **Models:** villagers now run on cloud variants — `gpt-oss:120b-cloud` (V1), `deepseek-v3.1:671b-cloud` (V2), `qwen3-coder:480b-cloud` (V3). NPCs share `gpt-oss:20b-cloud`. Much bigger than the original local 7-8B plan; rationale and risks in the ADR.
- **Secrets:** `OLLAMA_API_KEY` loaded from `.env` via `dotenv/config` at the top of the run driver. `.env.example` committed; `.env` gitignored.
- **Validation:** [Zod](https://zod.dev) added at I/O boundaries. `src/schemas.ts` is the source of truth for `RunConfig`, `AgentInit`, `ActionRequest`, and enums. Config validated at boot; LLM responses validated per turn. Engine-internal state types stay as plain TS.

See [decisions/008-ollama-cloud-and-zod-boundary.md](decisions/008-ollama-cloud-and-zod-boundary.md).

## [2026-05-26] errata | Free-tier model swap and 4xx fail-fast

Smoke test exposed that the initial cloud model choices included subscription-walled
variants. Findings and fixes:

- `deepseek-v3.1:671b-cloud` → returned **HTTP 403** ("requires subscription"). Replaced
  with `deepseek-v3.2:cloud` (un-sized `:cloud` alias = free tier).
- `qwen3-coder:480b-cloud` → replaced with `qwen3-next:cloud` (free, non-coder).
- **Free-tier rule of thumb:** un-sized `model:cloud` aliases are free; sized variants
  (`:671b-cloud`, `:1t-cloud`) tend to require subscription. Always-free: `gpt-oss:20b-cloud`,
  `gpt-oss:120b-cloud`.
- **Client behavior:** added `OllamaClientError` and made the client fail-fast on 4xx
  instead of retrying 3 times. `runDriver.ts` now prints a helpful error message with
  free-tier alternatives when it sees a 403.

See [decisions/008-ollama-cloud-and-zod-boundary.md#errata](decisions/008-ollama-cloud-and-zod-boundary.md#errata).

## [2026-05-26] errata | Empirical free-tier probe — actual working models discovered

Second 403 (`deepseek-v3.2:cloud` also subscription-walled) made it clear that third-party
"free model lists" are unreliable. Added `scripts/probe-cloud-models.ts` to test
candidates directly against the user's API key.

**Probe result for this account (2026-05-26):**

| Working | Walled |
|---------|--------|
| `gpt-oss:20b-cloud` | `deepseek-v3.2:cloud` (403) |
| `gpt-oss:120b-cloud` | `qwen3.5:cloud` (403) |
| `qwen3-coder:480b-cloud` | `kimi-k2.5:cloud` (403) |
| `glm-4.7:cloud` | `glm-5:cloud` (403) |
| | `minimax-m2.7:cloud` (403) |
| | `deepseek-v3.1:cloud`, `qwen3-next:cloud`, `gemma4:cloud`, `nemotron-3-nano:cloud` (404) |

**Final MVP cast** uses three distinct families across the four working models:
- V1 (Eda) — `gpt-oss:120b-cloud` (OpenAI)
- V2 (Bram) — `glm-4.7:cloud` (Zhipu AI)
- V3 (Lior) — `qwen3-coder:480b-cloud` (Alibaba)
- NPCs — `gpt-oss:20b-cloud` (OpenAI, small)

Research design (three model families across villagers) preserved.

## [2026-05-26] errata | Low-usage cast (parameter weight reduced ~6x)

User flagged the previous cast was too expensive on free-tier quota. Wider probe found
three more low-usage free models:

| Model | Size | Latency | Family |
|-------|------|---------|--------|
| `gemma4:31b-cloud` | 31B | 114ms (fastest) | Google |
| `ministral-3:8b-cloud` | 8B | 400ms | Mistral |
| `nemotron-3-super:cloud` | ~49B | 359ms | NVIDIA |

**Low-usage cast (current):**
- V1 (Eda) — `gemma4:31b-cloud` (Google)
- V2 (Bram) — `ministral-3:8b-cloud` (Mistral)
- V3 (Lior) — `nemotron-3-super:cloud` (NVIDIA)
- NPCs — `gpt-oss:20b-cloud` (OpenAI)

Four distinct families across the cast. Total parameter weight ~108B (was ~640B+).
The slow `glm-4.7:cloud` (~5s response) is no longer in the cast.

## [2026-05-28] ingest | v2 pivot — city + capitalism + (Christian/atheist) cast

Major scenario pivot after run 01. Captured in [decisions/009-city-capitalism-christian-pivot.md](decisions/009-city-capitalism-christian-pivot.md).

- **Setting:** village → small working city.
- **Regime:** the three-regime sweep retired; capitalism is the only regime in v2. `Regime` enum collapsed to `"capitalism"`.
- **Religion:** True Vine reform branch retired; only Christianity + atheism remain. `Religion` enum collapsed to `["Christianity", "Atheism"]`.
- **Cast:** six new personas with distinct jobs (baker, doctor, apprentice carpenter, mill owner, priest, newspaper editor). Bram (doctor), Lior (apprentice carpenter), Aldric (mill owner), and Father Maro keep their names with reskinned roles. V1 Eda → V1 Tessa (baker). N3 Sister Velka → N3 Nyssa Velkin (newspaper editor).
- **Jobs are narrative.** Engine action set unchanged. `plot` = workplace, `seeds` = stock/materials.
- **`AgentRole` enum** collapsed to `citizen | industrialist | priest | editor`.
- **Token diet.** Rewrote the system-prompt blocks tighter: regime/religion descriptions compressed, action descriptions trimmed, roster line shortened (`g5 f3 s3` vs full breakdown), memory format collapsed to one-line-per-day. Aim: ~30% reduction per-turn.
- Files deleted: `world/regimes/socialism.md`, `world/regimes/monarchy.md`, `world/religions/true-vine.md`, and the six old persona files (replaced).
- `runs/2026-05-26_socialism_run01/` preserved as raw v1 data.

## [2026-06-05] run | socialism run01 | failed — homogeneous "poetic sycophancy" / register collapse

Wrote up the only executed run (the v1 socialism run) after reading its transcript. Result was a failure mode, not any planned hypothesis:

- Run as executed: **all six agents on one model** (`ministral-3:3b-cloud`), seed 42, **31 days** (not the planned 100), v1 cast (Eda, Velka, True Vine).
- Action tally: **469 `SAY`, 55 `REST`, 6 `WORK_PLOT`, 6 `PRAY`, and 0 of everything else** (no market, harvest, give, DM, tithe, convert). ~88% of actions were talk.
- The cast converged within days on a single mystical-poetic register and amplified it; distinct personas were erased. Everyone ended at hunger 28 — soft scarcity was ignored entirely.
- Suspected causes: single small model across the cast; cheap unconstrained public `SAY`; thin 7-day memory; temp-0 lock-step. Captured in [runs/2026-05-26_socialism_run01-summary.md](runs/2026-05-26_socialism_run01-summary.md).
- "Homogenisation / register collapse" added as the first framework-invalidating failure mode in [experiments/hypotheses.md](experiments/hypotheses.md); beating it is now run 02's primary success criterion in [experiments/run-plan.md](experiments/run-plan.md).

## [2026-06-05] lint | reconcile corpus + README with v2 codebase

Periodic health-check after noticing the corpus had drifted from the v2 code. Fixes:

- **README.md** rewritten from v1 (village/socialism/Eda/True Vine, 100-day, wrong `npm run run:run01` commands, stale 4-family model table) to v2 (city/capitalism/Christian-atheist, 31-day, actual `npm run sim`/`smoke` commands, per-slot model assignment). `package.json` description updated.
- **design/overview.md, research-goals.md** — removed the three-regime sweep / True Vine / local-7-8B framing; now single-regime capitalism with per-slot model as the swept variable.
- **design/perception-memory.md** — memory window corrected **14 → 7 days** (code is truth); system-prompt example block rewritten to match `buildSystemPrompt`; added a note that within-round decisions are parallel.
- **design/turn-mechanics.md + architecture.md** — turn flow corrected from sequential to **parallel-within-round**; cost/day-count figures updated; removed the unimplemented "world state persisted per day / crash recovery" claim.
- **design/drift-reflection.md** — reflection prompt aligned to `buildReflectionPrompt`; added a **NOT-YET-IMPLEMENTED** banner on event-triggered reflection (only weekly is wired).
- **experiments/hypotheses.md + run-plan.md** — rewritten to the v2 cast/conditions; H1–H8 re-anchored on Tessa/Bram/Lior/Aldric/Maro/Nyssa.
- **runs/README.md** — clarified raw-vs-summary layers; v1 layout (eda/velka, 100-day) updated.
- index.md + this log updated.

## [2026-06-05] ingest | related-work page — literature diagnosis of run 01 + improvement levers

Read the LLM-social-simulation literature against run 01's failure. New page [experiments/related-work.md](experiments/related-work.md):

- Run 01's collapse is **over-determined** by three documented mechanisms: small models lack survival priors ([2508.12920](https://arxiv.org/abs/2508.12920)), LLM positivity/harmony bias ([2510.21180](https://arxiv.org/abs/2510.21180)), and centralised-topology entrainment ([2601.05606](https://arxiv.org/abs/2601.05606), [2411.03252](https://arxiv.org/abs/2411.03252)).
- Anchor papers: Generative Agents (importance-scored retrieval + importance-gated reflection), Concordia (Game-Master consequence layer), CAMEL (contrastive prompting), Echo Chambers (Pz/DG/NCI metrics + dual memory).
- Eight prioritised improvement levers, flagged where they tension with [ADR 002](decisions/002-prose-persona-no-traits.md) (no numeric traits) and [ADR 003](decisions/003-narrative-only-regime-with-llm-leaders.md) (no engine enforcement). No code changed; these are proposals pending the user's direction.

## [2026-06-05] ingest | ADR 010 — run01 mitigation decisions (narrow enforcement / prose anchors / clean experiment)

User chose, in a grilling session: (1) **narrow survival enforcement** — engine may restrict the action SET under survival pressure but never dictates economic/social/faith outcomes (amends [ADR 003](decisions/003-narrative-only-regime-with-llm-leaders.md)); (2) **prose-only persona anchors** — contrastive + negative-trait + anti-sycophancy lines as prose, no numbers ([ADR 002](decisions/002-prose-persona-no-traits.md) intact); (3) **clean experiment first** — run 02 changes ONLY model assignment, then ship (1)/(2) for run 03 if it still homogenises. See [decisions/010-run01-homogenisation-mitigations.md](decisions/010-run01-homogenisation-mitigations.md).

## [2026-06-05] ingest | ADR 011 + code — death from hunger

Implemented death from hunger (user request). New config knob `hungerDeathDays` (default 7); an agent that goes that many consecutive days without eating dies, is removed from turns/roster/reflections, and the run ends early if all die. `AgentState` gains `alive`/`diedOnDay`; `endDay` returns newly-dead; engine logs `death`/`extinction` world events and a transcript marker; the per-turn prompt now states the death threshold. Verified deterministically (agent with no food dies on schedule; fed agent survives). Supersedes the v1 "no death" stance in [world/economy.md](world/economy.md) and [design/turn-mechanics.md](design/turn-mechanics.md). See [decisions/011-death-from-hunger.md](decisions/011-death-from-hunger.md).

## [2026-06-05] ingest | ADR 012 (proposed) + build plan — ocean town, spatial layer, capabilities, economy, group wealth

User brought their Farm Valley ADR-007 (BDI/ECS archipelago farm sim) and asked the society to absorb its capabilities, adapted: an ocean-side town that fishes + farms, survives + accumulates wealth (individual AND by social group), with gold as the medium for trade/friendship/services. Grilled to settle four reconciliations: **LLM brain kept** (import Farm Valley's *capabilities*, not its BDI heuristics — [ADR 002](decisions/002-prose-persona-no-traits.md) intact); **core economy enforced, peer trades narrative** (engine: inventory + shopkeeper + market wall; LLM: gifts/friendship/services via GIVE/SAY/DM; auctions/CNP/trust-matrix parked — narrowly amends [ADR 003](decisions/003-narrative-only-regime-with-llm-leaders.md)); **group wealth by faction** (religion + class aggregation over existing state); **plan before code**. Wrote [decisions/012-ocean-town-spatial-capabilities-economy.md](decisions/012-ocean-town-spatial-capabilities-economy.md) (proposed) and a 6-stage [design/ocean-town-build-plan.md](design/ocean-town-build-plan.md), all gated behind `config.spatial` (default off). No simulation code written yet — awaiting approval of the open knobs.

## [2026-06-05] ingest | ADR 012 BUILT — ocean-town spatial layer (Stages 1–5), token-minimised

Implemented the ocean town in 5 verified stages (deterministic test + live spatial smoke each). Hard constraint: **budget-locked on `ministral-3:3b-cloud`**, so the layer had to *cut* per-turn tokens, not add them.

- **Stage 1** — grid map (16×10, ocean on the south coast), `pos`/`zoneId` state, `TRAVEL` (greedy Chebyshev, `moveSpeed`), `src/spatial.ts` helpers, default map auto-filled. Agents see only zone **names** + a 3-line `WHERE` block (no coordinates/map).
- **Stage 2** — `SAY` scoped to `sayRadius` (distant speech never enters the prompt → anti-homogenisation **and** fewer tokens); roster detail shown only for nearby agents.
- **Stage 3** — `FISH`/`FORAGE`/`MILL` verbs; zone affordances (`requireZone`) gate work/market/fish/forage/mill; gated verbs hidden from the prompt unless the agent is at the right zone.
- **Stage 4** — market wall: `POST_OFFER`/`READ_OFFERS`/`BUY_FROM_WALL` with escrow + TTL refund; offers shown only at the market.
- **Stage 5** — daily wealth tally (per individual + by religion + by class) as a transcript line + `world_event{kind:"wealth"}`.

All behind `config.spatial` (default off) so the clean run-02 model comparison stays aspatial per [ADR 010](decisions/010-run01-homogenisation-mitigations.md). New config knobs: `spatial`, `map`, `sayRadius`, `moveSpeed`, `fishYield`, `forageYield`, `millGoldPerCrop`, `wallListingTtlDays`. ADR 012 → accepted; updated [world/setting](world/setting.md), [world/economy](world/economy.md), [design/action-set](design/action-set.md), [design/perception-memory](design/perception-memory.md), [design/ocean-town-build-plan](design/ocean-town-build-plan.md). Run with `npm run sim -- --spatial`.

## [2026-06-05] run | capitalism spatial run01 (8 days) | partial success — no homogenisation, but 0 economic actions + cast starving

First ocean-town spatial run (8 days, seed 42, all `ministral-3:3b-cloud`, low food start). **Good news:** the spatial layer works and the run-01 *poetic monoculture did NOT recur* — personas held for 8 days, pursued their seeded arcs (Nyssa+Lior on the mill ledger at `@mill`; Maro+Tessa on usury at `@chapel`), travelled between zones, and local `SAY` produced two parallel conversations instead of one global echo. **Bad news:** action tally was 92 SAY, 36 DM, 23 TRAVEL, 21 REST, 1 PRAY, and **0 economic actions** — nobody fished (even after travelling to the harbour 5×), worked, or traded; wealth froze at 8g each for all 8 days; hunger marched 0→6 in lockstep, one day short of death. This is the Sugarscape small-model survival-blindness finding ([experiments/related-work](experiments/related-work.md)) — distinct from homogenisation. Summary: [runs/2026-06-05_capitalism_spatial_run01-summary.md](runs/2026-06-05_capitalism_spatial_run01-summary.md). Strongly justifies [ADR 010](decisions/010-run01-homogenisation-mitigations.md) lever 1 (narrow survival enforcement) + lever 2 (bigger models). Minor: 3B model sometimes put prose in `TRAVEL.args.to` (rejected cleanly, no AP lost) — fuzzy zone matching would help.

## [2026-06-05] ingest+run | small-model fixes (survival enforce / recency memory / concise personas) + spatial run02

Three improvements built (all verified by deterministic test + live smoke), then a re-run:

- **Narrow survival enforcement** ([ADR 010](decisions/010-run01-homogenisation-mitigations.md) lever 1): new `survivalHungerThreshold` (default 3). When an agent is that hungry, the engine restricts its action set to feeding actions (`FISH/FORAGE/HARVEST/WORK_PLOT/GO_TO_MARKET/TRAVEL/REST`) and the prompt shows an URGENT block. `src/survival.ts`; enforced in engine + surfaced in prompt. Honors [ADR 003](decisions/003-narrative-only-regime-with-llm-leaders.md) (restrict the set, don't dictate the outcome).
- **Recency-weighted memory**: new `memoryFullDays` (default 2). Recent days verbatim; older days in the 7-day window compressed to a salient one-line summary (keeps CONVERT/TITHE/GIVE, collapses chatter to `2×say`). More recency-relevant + fewer tokens.
- **Concise personas**: all six core identities rewritten ~45% shorter (≈290–426 → ≈160–225 words), tight structured prose, **second person** ("You are Tessa…", a small-model immersion improvement). Names/relationships/tensions preserved; Week-0 states untouched.

**Spatial run02** (same config as the starving run01 + the above): **starvation fixed.** 14 economic actions (12 FISH, 2 market) vs run01's 0; agents travel to the harbour and fish under the lock, hunger now recovers instead of marching to death, all 6 sustainable. Caveat: talk still dominates (91 SAY) and the economy is thin (wealth ~flat) — agents feed only when forced. Summary: [runs/2026-06-05_capitalism_spatial_run02-summary.md](runs/2026-06-05_capitalism_spatial_run02-summary.md).

**Round-2 research** appended to [experiments/related-work.md](experiments/related-work.md): 8 ranked small-model techniques for the talk-not-act problem. Top: **grammar-constrained JSON output** (Ollama `format` enum — makes prose-instead-of-action impossible at decode time), schema-level dynamic action locking, a `most_urgent_need` CoT-lite field, anti-repeat SAY suppression, matched 2-shot examples, and a metrics harness (Economic Action Rate / Talk-to-Act Ratio / speech-similarity collapse detector).

## [2026-06-05] ingest+run | grammar-constrained JSON output + spatial run03

Implemented the top round-2 research lever: **grammar-constrained action output**. The Ollama client now accepts a JSON-schema `format` (not just `"json"`); `agent.ts` builds a per-turn schema whose `action` is an **enum of only the verbs the agent may currently take**. A new single-source-of-truth helper `src/actionsAvailable.ts` computes that set (spatial availability, zone gating, AP, survival lock, anti-repeat) and is used by BOTH the prompt's action block and the schema, so they can't diverge. Added `actionTemperature` (default 0.3) for variety. Verified: deterministic test (fed/starving/anti-repeat/zone) + live smoke (0 parse failures, valid enum output).

**Spatial run03** (run02 config + the above): **mixed.** Output validity essentially solved (1 forced-REST all run; no more malformed `TRAVEL` args). But (a) talk didn't shrink, it *moved*: SAY 91→51 while DM 22→50 — anti-repeat only blocks *consecutive same-verb*, so the model alternated SAY↔DM; talk:act ≈ 2.5:1. (b) **Lior starved to death (day 7)** despite being correctly survival-locked — the 3B model fixated on a social food theory ("Tessa gives bread at the market") and oscillated market↔home for 4 days instead of TRAVEL→harbour to FISH. **Key finding: grammar fixes *form*, survival lock fixes *talking-while-starving*, but neither fixes small-model *spatial/causal planning*** — a distinct third failure. Next step: destination-aware survival lock (surface nearest food zone / auto-target it). Summary: [runs/2026-06-05_capitalism_spatial_run03-summary.md](runs/2026-06-05_capitalism_spatial_run03-summary.md).

## [2026-06-05] ingest | ADR 013 — destination-aware survival, religious alms, conversion fatigue, weather

Four world dynamics built + verified (deterministic tests + live smoke), see [decisions/013-world-dynamics-alms-conversion-weather.md](decisions/013-world-dynamics-alms-conversion-weather.md):

- **Destination-aware survival lock** — fixes run03's Lior death. A starving agent's URGENT block names the nearest food zone, and the `TRAVEL` handler auto-redirects any starving travel to the nearest food zone. Can't wander away from food. (`src/spatial.ts` nearestFoodZone/atFoodZone.)
- **Religious alms** (`SEEK_ALMS`, chapel-gated) — hungry adherents / would-be converts draw free food from a chapel treasury seeded with `almsTreasurySeed` and grown by food TITHEs at the chapel. Self-sustaining; atheism has no building so no alms (deliberate asymmetry). New `WorldState.treasury`.
- **Conversion fatigue** — `AgentState.conversionCount`; after `maxConversions` (default 2) the faith refuses further `CONVERT`/alms-conversion. Belief change bounded + meaningful.
- **Weather + RNG** (`config.weather`) — daily seeded roll (clear 51 / rain 34 / storm 7 / drought 8 %) from seed+day; storm blocks FISH, rain ×1.5 FORAGE/HARVEST, drought ×0.5 crops. First stochastic world event; shown in TODAY block + transcript. `src/weather.ts`.

New config knobs: `survivalHungerThreshold`, `almsFoodAmount`, `almsTreasurySeed`, `maxConversions`, `weather`. All consistent with ADR 002 (no numeric traits) and ADR 010's narrow-enforcement carve-out of ADR 003 (guidance/affordances, not dictated outcomes).

## [2026-06-05] ingest | ADR 014 — diet variety, food tuning, fishmonger price gradient

Built + verified (deterministic tests + live smoke) to break fishing dominance (runs 02/03: everyone fished, nobody farmed/traded). See [decisions/014-diet-variety-and-fishmonger.md](decisions/014-diet-variety-and-fishmonger.md):

- **Typed food + diet variety** (`config.dietVariety`): `resources.food` stays fungible but gains provenance (`AgentState.foodStock` fish/crop/forage/other) + `recentMeals`. At night the agent eats the most-varied available type; a fresh type → hunger 0, a monotonous type → residual `monotonyHungerFloor` (2). A pure fisher's meals pall → must diversify/trade. `src/diet.ts`; all food in/outflows routed through addFood/removeFood so provenance stays consistent. Verified: mono-fish eater accrues hunger from day 2; varied eater stays full.
- **Fishmonger** (`SELL_FISH`, harbour-gated): buys fish at a price that falls with the day's supply (`fishBasePrice 3 → fishFloorPrice 1`, `fishGlutStep 3`), reset daily. Verified: 9 fish → 18g (3·3+2·3+1·3), resets to 3 next day. `WorldState.fishSoldToday`, `fishPrice()`.
- **Tuning:** raw yields unchanged; the rebalance is that no single food self-sustains, so trade/specialisation finally pays (the wall/market should see use). Current fish price shown in the WHERE block at the harbour; diet composition + hint in the STATE block.

New knobs: `dietVariety`, `dietWindowDays` (3), `monotonyHungerFloor` (2), `fishBasePrice` (3), `fishFloorPrice` (1), `fishGlutStep` (3). Consistent with ADR 002 (diet is world state, not persona traits) and ADR 003 (fishmonger sets a price rule, not forced trade).
