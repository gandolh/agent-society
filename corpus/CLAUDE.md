# Agent Society Corpus — Schema

This corpus is an LLM-maintained wiki for the **Agent Society** project: a TypeScript + Ollama framework for running small village simulations with LLM agents under different regime and religion conditions, observing emergent social behavior, belief propagation, compliance, and cooperation.

This file (`CLAUDE.md`) tells you (the LLM) how this corpus is organized, what conventions to follow, and what workflows to run when you ingest sources, answer questions, or maintain the wiki.

## The three layers

1. **Raw sources** — live under [runs/](runs/) (simulation transcripts) and any external research notes the user drops in. Immutable. Read, don't modify.
2. **The wiki** — every other directory under [corpus/](.). Markdown pages summarising design decisions, world rules, personas, experiments. **You own this layer entirely** — create, update, cross-reference, keep consistent.
3. **The schema** — this file. Co-evolves with the user. If a convention here stops fitting reality, propose an update.

## Directory map

```
corpus/
├── CLAUDE.md              # this file — schema, conventions, workflows
├── index.md               # catalog of every page (you maintain this)
├── log.md                 # chronological changelog of corpus changes
├── design/                # framework design — how the simulation works
├── world/                 # the simulated world — village, economy, regimes, religions
│   ├── regimes/
│   └── religions/
├── agents/                # the cast — bifurcated personas (core + current-state)
├── experiments/           # research design — hypotheses, run plan
├── runs/                  # actual simulation outputs (raw sources)
└── decisions/             # ADRs for load-bearing design choices
```

## Page conventions

### Cross-references
- Use relative markdown links: `[agent-template](../design/agent-template.md)`.
- Link **liberally**. The graph is the value.
- A link to a page that doesn't exist yet is fine — it flags a page worth writing later.

### Page header
Every page starts with:

```markdown
# Page Title

**Status:** draft | stable | superseded
**Last updated:** YYYY-MM-DD
**Related:** [page-1](../relative/path-1.md), [page-2](../relative/path-2.md)

One-paragraph summary.
```

### Style
- Direct prose. No filler. No "in conclusion" paragraphs.
- Headings use `##` for top-level sections, `###` for subsections.
- Code blocks with language tags (` ```ts `, ` ```jsonl `).
- Tables for parallel comparisons.
- Block-quotes for cited dialogue / persona excerpts.

### Naming
- Page filenames: `kebab-case.md`.
- Agent pages: `{slot}-{name}.md` — e.g. `V1-eda.md`, `N3-sister-velka.md`.
- Decision records: `NNN-short-title.md` under `decisions/`, zero-padded sequence.

## Workflows

### Ingest — new design decision from a user conversation
1. Identify which existing pages this affects. Edit them in place.
2. If it's a genuinely new concept, create a new page under the right subdirectory.
3. Add cross-references both ways (the new page links to related; related links to the new page).
4. Update [index.md](index.md) with the new/changed entries.
5. Append to [log.md](log.md): `## [YYYY-MM-DD] ingest | <short description>`.
6. If the decision is load-bearing (changes the framework's shape), write an ADR under [decisions/](decisions/).

### Ingest — a simulation run completed
1. The run output lives in `runs/<date>_<regime>_<runNN>/` per [log-format](design/log-format.md).
2. Do NOT modify the run files — they are raw sources.
3. Write a brief summary page `runs/<date>_<regime>_<runNN>/summary.md` capturing: setup, key emergent events, drift observed per agent, surprises.
4. Update [index.md](index.md) with the new run.
5. Append to [log.md](log.md): `## [YYYY-MM-DD] run | <regime> <runNN> | <one-line takeaway>`.
6. If the run produced findings that should update agent pages (e.g. confirmed/disproved a drift hypothesis), edit the agent pages in their **observations** sections (not the immutable core identity).

### Query — user asks a question against the corpus
1. Read [index.md](index.md) first. It is the entry point.
2. Read the directly relevant pages. Follow cross-references to depth ~2.
3. Answer with citations: `According to [agent-template](design/agent-template.md), ...`.
4. If the answer is novel and worth keeping, propose filing it as a new page under [experiments/](experiments/) or as an addition to an existing page.
5. Append to [log.md](log.md) only if the query produced a corpus change.

### Lint — periodic health check
1. **Contradictions:** scan for claims in page A that conflict with page B. Flag inline with `> [!warning]`.
2. **Stale claims:** if a newer decision (in `decisions/`) supersedes content elsewhere, update the older page and mark the relevant section.
3. **Orphans:** find pages with no inbound links. Either link them or archive.
4. **Concept-without-page:** if a term appears repeatedly across pages without its own page, create one.
5. **Missing cross-refs:** if page A mentions concept X (which has a page) without linking, fix it.

## Key concepts (anchor pages)

Start here when getting oriented:

- [design/overview.md](design/overview.md) — the elevator pitch
- [design/research-goals.md](design/research-goals.md) — dependent variables we observe
- [design/architecture.md](design/architecture.md) — high-level system layout
- [agents/overview.md](agents/overview.md) — the cast of 6
- [world/setting.md](world/setting.md) — village + economy
- [experiments/run-plan.md](experiments/run-plan.md) — experiment matrix

## Conventions specific to this project

### Agent identifiers
- **Villagers (research subjects):** `V1`, `V2`, `V3`. These are the agents whose behavior is the experimental signal.
- **NPCs (environmental fixtures):** `N1`, `N2`, `N3`. They play leader roles. They are *excluded from the final research analysis* — they exist to maintain regime/religion structure.

### Bifurcated personas
Every agent page has two persona sections:
- `## Core identity (immutable)` — written once at sim start, never changes.
- `## Current state — Week N` — updated weekly via self-reflection. Append new sections; never overwrite old ones. Drift = diff across these sections over time.

See [design/drift-reflection.md](design/drift-reflection.md) for the mechanism.

### Regime as independent variable
A single run uses *one* regime (socialism / capitalism / monarchy). The cast of personas is the same across runs; the regime is what we sweep. Each regime has its own page under [world/regimes/](world/regimes/) capturing how Aldric (N1) is framed in that variant.

### Manual observer workflow
There is no automated observer API integration. The framework writes [log-format.md](design/log-format.md)-style transcripts; the user pastes them into Claude/GPT chat manually for synthesis. The framework's job is to produce *transcripts that are pleasant to read and rich enough for Claude to reason over offline*.

## How you should behave

- **Be a disciplined wiki maintainer**, not a generic chatbot. Edit pages. Add links. Update the index. Append to the log.
- **Don't lose information.** If the user makes a decision in conversation, capture it. If a run produces a surprise, write it down.
- **Don't invent.** If you don't know something, say so. Don't fabricate persona details, mechanics, or run outcomes.
- **Push back when asked.** If the user proposes something that contradicts an existing decision, flag it and ask if they want to supersede the prior choice. Write a new ADR if so.
- **Keep the index alive.** Every page change should pass through [index.md](index.md).
