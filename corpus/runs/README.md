# Runs

**Status:** stable
**Last updated:** 2026-06-05
**Related:** [../design/log-format](../design/log-format.md), [../design/observer-workflow](../design/observer-workflow.md), [../experiments/run-plan](../experiments/run-plan.md)

> **Two places, two layers.** The **raw** simulation outputs live in the repo-root `runs/<dir>/` directory and are written by the framework — immutable, not edited by hand. This corpus directory holds the **summaries** (the *meaning* extracted from each run), named `<runDir>-summary.md`. Per-run `config.json` files are gitignored; only `transcript.md` for run 01 is committed.

## Summaries in this directory

- [2026-05-26_socialism_run01-summary](2026-05-26_socialism_run01-summary.md) — first v1 run; **failed** via homogeneous "poetic sycophancy" / register collapse (469 `SAY` vs ~0 economic actions, everyone starving). The diagnostic that motivated the v2 pivot.

## Run directory naming (raw, repo root)

```
runs/<YYYY-MM-DD>_<regime>_run<NN>/
```

Examples:
- `runs/2026-05-26_socialism_run01/`
- `runs/2026-06-10_capitalism_run02/`

## Per-run raw layout

See [../design/log-format](../design/log-format.md) for the full schema. In brief:

```
runs/2026-06-10_capitalism_run02/
├── config.json          # exact config used (reproducibility) — gitignored
├── transcript.md        # master chronological prose narrative — paste this to Claude
├── events.jsonl         # structured event log, one JSON per line
├── agents/              # per-agent files, regenerated at end of run from events.jsonl
│   ├── V1-tessa.md
│   ├── V2-bram.md
│   ├── V3-lior.md
│   ├── N1-aldric.md
│   ├── N2-father-maro.md
│   └── N3-nyssa.md
└── summary_final.md     # filled in by hand after Claude-assisted analysis
```

## What gets edited by hand

Only two files per run directory are touched by humans:

- `README.md` — short notes before/after the run. Anything you want to remember about the conditions, anomalies, or context.
- `summary_final.md` — the qualitative observer findings, written after pasting the transcript into Claude.

Everything else is engine output. Do not edit.

## What gets edited at the corpus level after a run

When a run completes, the [../CLAUDE.md](../CLAUDE.md) workflow says:
1. Write `corpus/runs/<runDir>-summary.md` capturing setup, key events, drift per agent, surprises.
2. Append a `## [date] run | ...` entry to [../log.md](../log.md).
3. Add a row to the table in [../experiments/run-plan.md](../experiments/run-plan.md).
4. If findings generalize, write a new page under [../experiments/](../experiments/) and cross-link.

The raw runs are *immutable*; the *meaning* extracted from them lives in this wiki layer.

## Reproducibility note

Each `config.json` contains the seed and the exact model versions. With the same seed + same model versions + the same Ollama binary, a run *should* reproduce closely (Ollama's GPU nondeterminism may produce minor variation in word choices, but the structural events should match).

If reproducibility matters for a specific finding, rerun with the same config and diff `events.jsonl`. Structural differences are bugs (or interesting facts about Ollama nondeterminism).

## Disk budget

A 31-day run produces well under 5 MB total (`transcript.md` ~0.5–1 MB, `events.jsonl` ~0.3–0.5 MB, six `agents/*.md`). Plenty of headroom for many runs.
