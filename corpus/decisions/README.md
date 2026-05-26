# Decisions — Architectural Decision Records (ADRs)

**Status:** stable
**Last updated:** 2026-05-26
**Related:** [../CLAUDE.md](../CLAUDE.md), [../log.md](../log.md)

This directory holds **architectural decision records** for load-bearing choices made about the framework. ADRs capture *what was decided*, *what alternatives were considered*, and *why the chosen option won*. They are how a future LLM session (or a future you) avoids relitigating decisions that have already been settled.

## When to write an ADR

Write a new ADR when:
- A decision changes the *shape* of the framework or its research output (not just an implementation detail).
- A decision has plausible alternatives that someone reading the code later would wonder about.
- The decision is one we expect to be challenged in the future.

Skip when:
- The decision is local (e.g. file naming convention) — those go in [../CLAUDE.md](../CLAUDE.md).
- The decision is obvious (e.g. *"use TypeScript"* — that was the user's choice up front).

## Format

Each ADR is `NNN-short-title.md`, zero-padded sequence. Format:

```markdown
# NNN — Short title

**Status:** accepted | superseded by NNN
**Date:** YYYY-MM-DD
**Related:** [page-1](...), [page-2](...)

## Context

What is the problem? What are the constraints? Why does this matter?

## Decision

What did we decide?

## Alternatives considered

Each alternative with its trade-offs, and why it lost.

## Consequences

What does this enable? What does this make harder? What are the open questions?
```

## Index of decisions

| # | Title | Status |
|---|-------|--------|
| 001 | [research-experiment-framing](001-research-experiment-framing.md) | accepted |
| 002 | [prose-persona-no-traits](002-prose-persona-no-traits.md) | accepted |
| 003 | [narrative-only-regime-with-llm-leaders](003-narrative-only-regime-with-llm-leaders.md) | accepted |
| 004 | [round-robin-one-action](004-round-robin-one-action.md) | accepted |
| 005 | [manual-observer-workflow](005-manual-observer-workflow.md) | accepted |
| 006 | [bifurcated-persona-with-reflection](006-bifurcated-persona-with-reflection.md) | accepted |
| 007 | [mvp-cast-size](007-mvp-cast-size.md) | accepted |
| 008 | [ollama-cloud-and-zod-boundary](008-ollama-cloud-and-zod-boundary.md) | accepted |

## Superseding

If a future decision supersedes one of these:
1. Write the new ADR (next sequence number).
2. Mark the old one `superseded by NNN` in its frontmatter status.
3. Add a `## Superseded by NNN` section at the bottom of the old one explaining what changed.
4. Update the table above.

Do **not** delete superseded ADRs. They are the history of how the project's thinking changed.
