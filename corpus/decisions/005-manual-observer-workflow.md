# 005 — Manual observer workflow (no API integration)

**Status:** accepted
**Date:** 2026-05-26
**Related:** [../design/observer-workflow](../design/observer-workflow.md), [../design/log-format](../design/log-format.md), [../design/research-goals](../design/research-goals.md)

## Context

The original plan included an automated "observer model" — a stronger LLM (Claude or GPT) that would periodically read the simulation and produce structured analysis along four dimensions (social graph, belief propagation, compliance, cooperation). This implied:
- API integration with Anthropic or OpenAI.
- Cadence decisions (daily, weekly).
- Cost management.
- Stateful prompt design carrying previous reports forward.
- Structured JSON + Markdown output schemas.

## Decision

**No automated observer.** The framework's only job is to write **excellent transcripts**. The user pastes those transcripts into Claude/GPT chat manually for analysis. The "observer" is a human-mediated step using the existing Claude Code or chat tool.

Specifically:
- No API key handling for the observer.
- No cost meter.
- No observer cadence config.
- The framework writes `transcript.md`, `events.jsonl`, and per-agent files (see [../design/log-format](../design/log-format.md)).
- The user copies the transcript (or a window of it) into Claude chat and asks one of the question templates from [../design/observer-workflow](../design/observer-workflow.md).
- The user pastes the resulting synthesis into `runs/<runDir>/summary_final.md`.

## Alternatives considered

- **Automated observer via Anthropic API.** Most "production" choice. Adds API integration, key management, retries, cost tracking, prompt versioning. Rejected by user. Big scope reduction.
- **Local strong model (e.g. Llama-3.1-70B via Ollama).** Avoids API but adds heavy VRAM requirements and slower inference. Rejected because the observer's job is *qualitative reasoning over hundreds of events*, which is something Claude Sonnet does well and Llama-3.1-70B does at much higher cost and lower quality.
- **Pre-aggregated metrics fed to a smaller model.** Compute social-graph edges and conversion counts mechanically; feed numbers + sample events to a small LLM for narrative. Rejected because the observer's value comes from reasoning over the *prose*, not the numbers. Pre-aggregation throws away the signal.

## Consequences

- **Enables:** zero API integration burden. Zero cost from runaway observer loops. The user stays in the loop and can ask ad-hoc questions for free.
- **Makes harder:** running 20+ runs unattended and getting summaries auto-generated. If we ever get to that scale, revisit. For v1's expected ~5 runs total, manual is fine.
- **Sharpens the framework's job:** the *only* deliverable is a transcript good enough for Claude to reason over. That's a clear, narrow product goal.
- **Cost shift:** the cost moves from API tokens to user attention. Each post-run analysis takes ~30 minutes of user time (copy → paste → ask Claude → save). For 5 runs, ~2.5 hours total. Acceptable.

## How this changed downstream design

- `transcript.md` is the *primary* artifact, not a side effect. Its prose quality matters more than `events.jsonl`'s machine readability.
- The transcript includes **agent reasoning fields inline** for public actions — Claude needs to see *why* an action was taken to interpret it.
- DM content appears in the master transcript (with private flag) so Claude can analyze conspiracy. Privacy is between agents, not between the user and Claude.
- The framework does not need to produce structured social-graph data. Claude can derive it from the transcript prose.

## Open questions

- At what scale of runs does manual become painful? Probably ~10 per condition. If we cross that threshold, automate.
- Could we ship a lightweight CLI that wraps the paste-to-Claude step using the Anthropic SDK *without* committing to "automation"? Maybe v2. Would still be user-triggered, just less copy-paste.
