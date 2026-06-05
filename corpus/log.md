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
