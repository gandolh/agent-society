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
