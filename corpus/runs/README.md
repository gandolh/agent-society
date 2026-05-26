# Runs

**Status:** scaffolding
**Last updated:** 2026-05-26
**Related:** [../design/log-format](../design/log-format.md), [../design/observer-workflow](../design/observer-workflow.md), [../experiments/run-plan](../experiments/run-plan.md)

This directory holds **raw simulation outputs**. Each run is a self-contained subdirectory. These files are written by the framework and **are not modified by hand** — they are the immutable record of what happened.

## Run directory naming

```
runs/<YYYY-MM-DD>_<regime>_run<NN>/
```

Examples:
- `runs/2026-05-26_socialism_run01/`
- `runs/2026-06-01_monarchy_run03/`

## Per-run layout

See [../design/log-format](../design/log-format.md) for the full schema. In brief:

```
runs/2026-05-26_socialism_run01/
├── README.md            # short — run metadata, anything noted before/after the run
├── config.json          # exact config used (reproducibility)
├── transcript.md        # master chronological prose narrative — paste this to Claude
├── events.jsonl         # structured event log, one JSON per line
├── agents/              # per-agent files, regenerated at end of run from events.jsonl
│   ├── V1-eda.md
│   ├── V2-bram.md
│   ├── V3-lior.md
│   ├── N1-aldric.md
│   ├── N2-father-maro.md
│   └── N3-sister-velka.md
└── summary_final.md     # filled in by hand after Claude-assisted analysis
```

## What gets edited by hand

Only two files per run directory are touched by humans:

- `README.md` — short notes before/after the run. Anything you want to remember about the conditions, anomalies, or context.
- `summary_final.md` — the qualitative observer findings, written after pasting the transcript into Claude.

Everything else is engine output. Do not edit.

## What gets edited at the corpus level after a run

When a run completes, the [../CLAUDE.md](../CLAUDE.md) workflow says:
1. Append a `## [date] run | ...` entry to [../log.md](../log.md).
2. Add a row to the table in [../experiments/run-plan.md](../experiments/run-plan.md).
3. If findings generalize, write a new page under [../experiments/](../experiments/) and cross-link.

The runs themselves are *immutable*; the *meaning* extracted from them lives in the wiki layer.

## Reproducibility note

Each `config.json` contains the seed and the exact model versions. With the same seed + same model versions + the same Ollama binary, a run *should* reproduce closely (Ollama's GPU nondeterminism may produce minor variation in word choices, but the structural events should match).

If reproducibility matters for a specific finding, rerun with the same config and diff `events.jsonl`. Structural differences are bugs (or interesting facts about Ollama nondeterminism).

## Disk budget

Each 100-day run produces:
- `transcript.md`: ~1–3 MB
- `events.jsonl`: ~0.5–1 MB
- `agents/*.md` (six files): ~0.5 MB total

Total per run: <5 MB. Plenty of headroom for many runs.
