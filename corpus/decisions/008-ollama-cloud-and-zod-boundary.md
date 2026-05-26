# 008 — Ollama Cloud, .env secrets, Zod boundary validation

**Status:** accepted
**Date:** 2026-05-26
**Related:** [../design/architecture](../design/architecture.md), [007-mvp-cast-size](007-mvp-cast-size.md), [../agents/overview](../agents/overview.md)

## Context

The original v1 plan was to run on **local Ollama** with three small open-source models (`llama3.1:8b`, `mistral:7b`, `qwen2.5:7b`). The user pivoted mid-build to use **Ollama Cloud** instead. At the same time, they asked for `.env` for secret handling and **Zod** for schema validation at I/O boundaries.

Three small but compounding decisions:

1. Where the LLM calls go (local vs cloud, and which models).
2. How the API key is supplied (env var, dotenv, secrets manager, config file).
3. How structured I/O (config files, LLM responses) is validated.

## Decision

### Endpoint and models

- **Default endpoint:** `https://ollama.com` (Ollama Cloud).
- **Default cloud models (low-usage cast, after 2026-05-26 third revision):**
  - V1 (Eda) → `gemma4:31b-cloud` (Google family, 31B)
  - V2 (Bram) → `ministral-3:8b-cloud` (Mistral family, 8B)
  - V3 (Lior) → `nemotron-3-super:cloud` (NVIDIA family, ~49B)
  - N1, N2, N3 (NPCs) → `gpt-oss:20b-cloud` (OpenAI family, 20B)
- All four cast models are confirmed free-tier on the test account; total parameter weight is roughly **~108B across the entire cast** (down from the earlier ~640B+ that included `qwen3-coder:480b-cloud`).
- **Local fallback** is supported and documented — set `ollamaBaseUrl` to `http://localhost:11434` and swap to local model names in the run config. No code change required.

### Free vs paid tier (researched 2026-05-26)

After hitting a 403 on `deepseek-v3.1:671b-cloud` ("this model requires a subscription"), researched Ollama Cloud's free tier policy:

- **Free tier:** un-sized `model:cloud` aliases (e.g. `deepseek-v3.2:cloud`, `qwen3-next:cloud`, `kimi-k2.5:cloud`, `glm-4.7:cloud`).
- **Subscription-walled:** sized-suffix variants of the heaviest models (e.g. `deepseek-v3.1:671b-cloud`, `kimi-k2:1t-cloud`).
- **Always free:** `gpt-oss:20b-cloud` and `gpt-oss:120b-cloud`.
- **Limits on free tier:** 1 concurrent model, session caps reset every 5 hours, weekly caps reset every 7 days. Rate limit roughly 10–20 req/min/model per anecdotal reports. Acceptable for our ~25 calls/day workload.

### API key handling

- API key is read from `OLLAMA_API_KEY` env var.
- **`.env`** file at project root, loaded via `dotenv/config` at the top of `src/runDriver.ts`. `.env` is gitignored; `.env.example` is committed as a template.
- Optionally, `ollamaApiKey` can be set directly in `config.json` — but secrets in committed config files are discouraged and exist only as an escape hatch.
- The driver fails fast at boot if the endpoint is `ollama.com` and no key was found anywhere.

### Schema validation with Zod

- **`src/schemas.ts`** is the source of truth for boundary types: `RunConfig`, `AgentInit`, `ActionRequest`, plus the enums (`Religion`, `Regime`, `AgentRole`).
- TypeScript types for these are inferred via `z.infer<typeof ...>`. `src/types.ts` re-exports them so engine code keeps a single import surface.
- Engine-internal mutable state types (`WorldState`, `AgentState`, `EventLogEntry`) stay as plain TS — Zod is for *boundaries*, not for engine internals.
- **Boundary checkpoints:**
  - Run config (`config.json`) is parsed through `RunConfigSchema` at boot. Malformed config exits with error code 2.
  - LLM action responses are parsed through `ActionRequestSchema` after `extractJson`. Invalid responses trigger a retry (up to 3 per turn, then forced `REST`).
  - `args` inside `ActionRequest` is **permissive** (`z.record(z.string(), z.unknown())`) — per-action argument validation stays in the action handlers in `src/actions/index.ts` where it lives next to the resource-availability checks.

## Alternatives considered

### For endpoint
- **Stay local-only.** Cheapest, no auth. Rejected by user — running 6 agents × 7 AP × 100 days takes ~10hrs locally on a single GPU.
- **Multi-vendor (Ollama Cloud + Anthropic API + OpenAI API).** Most flexible but multiplies integration burden. Rejected for v1.
- **Different cloud (e.g. Together, Replicate, Modal).** Each has its own SDK. Rejected — Ollama Cloud reuses the same `/api/generate` shape the local client already speaks.

### For API key handling
- **Plain env var, no `.env`.** Works but forces users to remember `export OLLAMA_API_KEY=...` per session. Rejected for ergonomics.
- **Secrets manager (1Password CLI, etc).** Heavy. Rejected for a personal research project.
- **Key in `config.json`.** Risks secrets in git history. Rejected as default; left as escape hatch.

### For schema validation
- **No validation, just trust JSON.** Status quo before this ADR. Cheap but bad UX when configs typo or LLMs return malformed JSON — failures show up as obscure `undefined.foo` runtime errors.
- **Hand-rolled type guards.** Verbose; type guards drift from runtime checks. Rejected.
- **TypeBox / valibot / runtypes.** All viable. Chose Zod because it's the de-facto standard, has excellent error formatting, and integrates cleanly with TypeScript inference.
- **Strict per-action arg schemas inside `ActionRequest`.** Cleaner but duplicates the resource-availability checks that have to be in handlers anyway. Rejected — handlers stay the single point of truth for action validity.

## Consequences

- **Enables:** much faster runs (cloud GPU vs local), much bigger models (120B+ vs 8B), no local hardware constraints. Better persona role-play due to model size.
- **New dependency:** an `OLLAMA_API_KEY` and an internet connection. Local fallback is fully supported but is no longer the default path.
- **New cost surface:** Ollama Cloud has a subscription / metered cost. Run 01's ~3000 LLM calls will incur cost. Plan accordingly.
- **Bigger models change the experiment.** Small-model behavior (sycophancy, role drift, agreeable collapse) was a real risk in the original local plan. Larger cloud models reduce that risk but introduce a new one — **over-aligned, samey responses** that smooth out the seeded tensions. Watch run 01 for this.
- **The "do llamas befriend llamas" research question is technically dead at MVP scale anyway** (1 villager per model — see [007-mvp-cast-size](007-mvp-cast-size.md)), so the model swap doesn't lose anything we were measuring.
- **Zod at boundaries** catches config typos and malformed LLM JSON immediately, with readable error messages. No more silent `undefined`s.
- **`.env` workflow** is conventional and matches what most TypeScript projects do.

## Open questions

- **Does the experiment still produce interesting drift with bigger, more-aligned models?** Cloud models are RLHF'd toward agreeable assistant behavior. Personas with built-in tension may get washed out into politeness. Diagnostic: run 01 transcript.
- **Should NPCs run on a single smaller model (`gpt-oss:20b-cloud`) or share the villager models?** Current choice: one small model for all 3 NPCs (consistency, speed). Reconsider if NPCs feel under-powered for their leader roles.
- **Will free-tier rate limits cause mid-run failures?** Anecdotal data says ~10–20 req/min/model on free tier; our peak rate is ~6 calls per round-robin pass (≤1/agent/round). Should be fine but unverified. Engine surfaces `OllamaClientError` cleanly if a 429 fires; the run can be resumed by editing `world.day` and rerunning.

## Errata

- **2026-05-26 (first revision):** Initial cast included `deepseek-v3.1:671b-cloud` (V2) and `qwen3-coder:480b-cloud` (V3). The deepseek model returned 403 ("requires subscription"). Both replaced with un-sized `:cloud` aliases (`deepseek-v3.2:cloud`, `qwen3-next:cloud`). The Ollama client now raises a typed `OllamaClientError` on 4xx and does NOT retry — the original failure wasted 3 attempts before surfacing the error.

- **2026-05-26 (second revision):** `deepseek-v3.2:cloud` *also* returned 403 — the un-sized alias is not actually free on this account either. Third-party "free model lists" turned out to be aspirational or stale. Pivoted to an empirical approach: added `scripts/probe-cloud-models.ts` that sends a one-token prompt to a list of candidates and reports which return 200 / 403 / 404 / 401. Probed against the actual API key.
  Result on this account, 2026-05-26:

  | Model | Status |
  |-------|--------|
  | `gpt-oss:20b-cloud` | OK |
  | `gpt-oss:120b-cloud` | OK |
  | `qwen3-coder:480b-cloud` | OK |
  | `glm-4.7:cloud` | OK |
  | `deepseek-v3.1:cloud` | 404 (not found) |
  | `deepseek-v3.2:cloud` | 403 (subscription) |
  | `qwen3-next:cloud` | 404 |
  | `qwen3.5:cloud` | 403 |
  | `kimi-k2.5:cloud` | 403 |
  | `glm-5:cloud` | 403 |
  | `gemma4:cloud` | 404 |
  | `minimax-m2.7:cloud` | 403 |
  | `nemotron-3-nano:cloud` | 404 |

  Final MVP cast:

  | Slot | Model | Family |
  |------|-------|--------|
  | V1 (Eda) | `gpt-oss:120b-cloud` | OpenAI |
  | V2 (Bram) | `glm-4.7:cloud` | Zhipu AI |
  | V3 (Lior) | `qwen3-coder:480b-cloud` | Alibaba |
  | N1, N2, N3 | `gpt-oss:20b-cloud` | OpenAI (small) |

  Still **three distinct model families** for villagers — research design intact. The qwen3-coder model is technically a code-specialized variant; if Lior's voice reads as stilted in run 01, swap to whatever non-coder Qwen becomes available, or to `glm-4.7:cloud` (used elsewhere) or rotate across the four working models.

  Run the probe again any time Ollama updates its model lineup:
  ```sh
  npx tsx scripts/probe-cloud-models.ts
  ```

- **2026-05-26 (third revision):** User flagged that the cast (`gpt-oss:120b-cloud` + `glm-4.7:cloud` + `qwen3-coder:480b-cloud`) burned too much free-tier quota. Probed smaller candidates the user named (`gemma4:31b-cloud`, `qwen3.5:cloud`, `ministral-3:8b-cloud`) plus a wider sweep. New empirical findings:

  | Newly probed | Result |
  |--------------|--------|
  | `gemma4:31b-cloud` | OK (31B, 114ms — fastest response of any free model) |
  | `ministral-3:8b-cloud` | OK (8B, 400ms) |
  | `nemotron-3-super:cloud` | OK (~49B, 359ms) |
  | `qwen3.5:cloud`, `ministral-3:cloud`, `gemma4:cloud`, `granite4:cloud`, `phi5:cloud`, `mistral3:cloud`, `llama3.5:cloud`, plus most sized variants | 403 or 404 |

  Cast updated to the low-usage 4-family configuration above. Total cast parameter weight dropped from ~640B+ to ~108B. Four distinct families (Google, Mistral, NVIDIA, OpenAI) preserved across V1, V2, V3, NPCs.

  Notes on the unknowns: `nemotron-3-super:cloud` is the *middle* size in NVIDIA's Nemotron family (Nano < Super < Ultra); Nano was 404. If Lior's voice feels under-powered for the Vine apostasy arc, the next-cheapest substitute would be `gpt-oss:20b-cloud` (overlaps with NPCs) or upgrading V3 to `gpt-oss:120b-cloud`.
