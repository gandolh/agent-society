# 001 — Research experiment framing

**Status:** accepted
**Date:** 2026-05-26
**Related:** [../design/overview](../design/overview.md), [../design/research-goals](../design/research-goals.md)

## Context

When starting this project, the user had a generative idea — *"agents living in a society with regimes and religion, see what friendships and enemies they form"* — but no committed framing for what kind of *artifact* the project would produce. The same idea could be:

- A **research experiment** to *learn something* by running scenarios and comparing.
- A **demo / portfolio piece** to show off as a cool thing.
- A **framework** for others to plug their own agents and scenarios into.
- A **personal sandbox** to play with and see what happens.

Each framing demands a different engineering investment: different fidelity, different UI, different reproducibility requirements, different output shape.

## Decision

This project is a **research experiment** — personal scale, qualitative, output is data + observations.

Concretely:
- Reproducibility matters (seed-controlled runs).
- Output is logs/transcripts the user reads and Claude synthesizes from.
- UI is minimal (CLI run, files on disk).
- No public API stability commitment.
- No timeline pressure.
- Scope can be expanded iteratively.

## Alternatives considered

- **Demo / portfolio.** Would have demanded polished UI and a compelling visualization. Would have prioritized appearance over experimental rigor. Rejected because the user's actual interest is *learning what happens*, not *showing off*.
- **Framework for others.** Would have demanded API stability, documentation discipline, abstraction layers, plugin architecture. Premature — there is nothing to share yet. Rejected as v1.
- **Personal sandbox.** Would have removed reproducibility constraint and the discipline of structured observation. Rejected because *"see what happens"* without structure converges to *"nothing interesting happens and you never know why."*

## Consequences

- **Enables:** focus on transcript quality over UI polish; seed-controlled comparison runs; iterative scope.
- **Makes harder:** other people reusing the framework (deferred until v2+); demoing the work to others (no shiny artifact, just markdown).
- **Open questions:** at what point does a research experiment become valuable enough to invest in framework or demo packaging? Probably after multiple runs produce findings worth showing.
