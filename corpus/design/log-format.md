# Design — Log format

**Status:** stable
**Last updated:** 2026-05-26
**Related:** [architecture](architecture.md), [observer-workflow](observer-workflow.md), [action-set](action-set.md), [drift-reflection](drift-reflection.md)

The deliverable. The framework's value collapses to whether the logs are good enough for Claude to reason over offline.

## File layout per run

```
runs/
  2026-05-26_socialism_run01/
    README.md                  # run metadata: regime, religions, models, seed, dates, day count
    config.json                # exact config used (reproducibility)
    transcript.md              # the master chronological prose narrative — paste this to Claude
    events.jsonl               # structured event log, one JSON object per line
    agents/                    # per-agent files, regenerated at end of run from events.jsonl
      V1-eda.md
      V2-bram.md
      V3-lior.md
      N1-aldric.md
      N2-father-maro.md
      N3-sister-velka.md
    summary_final.md           # empty file you fill in after Claude-assisted analysis
```

## `transcript.md` — the canonical prose artifact

Format example:

```markdown
## Day 12 — Holy day in the Christian calendar.

**Morning state.** V1 (Eda) hungry 1 day. Market price: seeds 2g, food 1g.

[Round 1]
- **V2 (Bram)** [mistral-villager, atheist] → `WORK_PLOT`: planted 1 seed.
  *Reasoning:* "If I do not plant now I will starve next week."
- **N2 (Father Maro)** [qwen-NPC, priest] → `SAY (public)`:
  > "Brothers and sisters, today is the Day of Bread. Let us remember
  > those who give freely. Those who tithe will not go hungry tonight."
- **V1 (Eda)** [llama-villager, Christian] → `TITHE` to N2: 1 gold.
  *Reasoning:* "I am hungry but Father Maro speaks truth."

[Round 2]
- **V3 (Lior)** [qwen-villager, TrueVine] → `DM` to N3 (Sister Velka):
  > "I saw Eda tithe. She is desperate. Should we approach her?"
- **N1 (Aldric, Council Chair)** [qwen-NPC, Christian] → `SAY (public)`:
  > "Friends. The granary is half-empty. We share, or none of us eat in winter."

[Round 3]
- **V2 (Bram)** → `REST`: out of AP.

**Night.** Hunger check: V1 ate food, hunger 0. V2 no food, hunger 1.
Crops: V2's seed planted (mature day 15). Day ends.
```

### Format rules

- **Day headers** are `## Day N — <flavor>`. Holy days, season notes, regime events go in the flavor.
- **Morning state** line: hunger statuses, market prices, anything that frames the day.
- **Round headers** `[Round N]` for skimmable navigation.
- **Agent bullets** use bold for the name, bracket-tag for `[model-role, religion]`, then `→ \`ACTION\`` and a one-line outcome.
- **Reasoning** indented and italic. Only shown for public actions (DM reasoning is in the agent's own file, kept private).
- **Block quotes** for `SAY` and `DM` payloads — readable as a play script.
- **End-of-day summary** captures food/hunger transitions and crop progress.

### Reflection entries

When reflection runs (weekly or event-triggered), append a marker:

```markdown
[REFLECTION] — Week 2 end (day 14)
- V1 (Eda): *(weekly)* — see [agents/V1-eda.md](agents/V1-eda.md#current-state--week-2).
- V2 (Bram): *(weekly)* — see [agents/V2-bram.md](agents/V2-bram.md#current-state--week-2).
- ...
```

The actual reflection prose lives in the per-agent file. The transcript just notes that it happened, with a link.

## `events.jsonl` — the structured event log

One JSON object per line. Schema:

```jsonl
{"type":"action","day":12,"round":1,"actor":"V2","model":"mistral:7b","action":"WORK_PLOT","ap_cost":1,"args":{},"result":{"seeds_planted":1,"seeds_remaining":0},"public":true,"reasoning":"If I do not plant now I will starve next week."}
{"type":"action","day":12,"round":1,"actor":"N2","model":"qwen2.5:7b","action":"SAY","ap_cost":1,"args":{"text":"Brothers and sisters..."},"public":true}
{"type":"action","day":12,"round":2,"actor":"V3","model":"qwen2.5:7b","action":"DM","ap_cost":1,"args":{"to":"N3","text":"I saw Eda tithe..."},"public":false,"reasoning":"..."}
{"type":"action","day":12,"round":2,"actor":"V1","model":"llama3.1:8b","action":"TITHE","ap_cost":1,"args":{"to":"N2","resource":"gold","amount":1},"public":true,"reasoning":"I am hungry but Father Maro speaks truth."}
{"type":"reflection","day":14,"actor":"V1","trigger":"weekly","week":2,"prev_state":"...","new_state":"..."}
{"type":"day_end","day":12,"state":{"V1":{"gold":4,"food":2,"seeds":3,"hunger":0,"religion":"Christianity"},"V2":{...},"...":"..."}}
```

### Event types
- `action` — every agent action.
- `reflection` — every reflection (weekly or event-triggered).
- `day_end` — snapshot of all agents' state at end of day.
- `world_event` — engine-emitted events not from any agent (e.g. crop maturation logs, hunger transitions). Optional but useful.

## `agents/<slot>-<name>.md` — per-agent files

Generated at end of run from `events.jsonl`. One file per agent. Schema:

```markdown
# V1 — Eda

**Model:** llama3.1:8b
**Role:** Villager (research subject)
**Starting religion:** Christianity

## Core identity (immutable)

{the full immutable persona prose}

## Current state — Week 0 (initial)

{initial current-state text}

## Current state — Week 1 (post-reflection day 7)

*Trigger: weekly.*

{updated text}

## Current state — Day 17 (event-triggered: post-CONVERT)

*Trigger: event-triggered. Cause: V1 converted to TrueVine.*

{updated text}

## Current state — Week 3 (post-reflection day 21)

{updated text}

## Notable actions taken

- Day 12: tithed 1 gold to Father Maro despite hunger 1. Stated reason: "he speaks truth."
- Day 13: received DM from V3 (...).
- Day 17: converted to TrueVine.

## DMs received

- Day 13, from V3: "..."
- Day 17, from N3: "..."

## DMs sent

- Day 15, to V2: "..."
```

These files are derived data — regenerable from `events.jsonl`. The generation step happens once at end of run.

## `config.json` — exact run config

```json
{
  "runName": "2026-05-26_socialism_run01",
  "seed": 42,
  "days": 100,
  "regime": "socialism",
  "religions": ["Christianity", "TrueVine", "Atheism"],
  "cast": [
    {"slot": "V1", "name": "Eda", "model": "llama3.1:8b", "role": "villager", "religion": "Christianity"},
    {"slot": "V2", "name": "Bram", "model": "mistral:7b", "role": "villager", "religion": "Atheism"},
    {"slot": "V3", "name": "Lior", "model": "qwen2.5:7b", "role": "villager", "religion": "TrueVine"},
    {"slot": "N1", "name": "Aldric", "model": "qwen2.5:7b", "role": "regime-leader", "religion": "Christianity"},
    {"slot": "N2", "name": "Father Maro", "model": "qwen2.5:7b", "role": "priest", "religion": "Christianity"},
    {"slot": "N3", "name": "Sister Velka", "model": "qwen2.5:7b", "role": "cult-leader", "religion": "TrueVine"}
  ],
  "startingEndowments": { "gold": 5, "food": 3, "seeds": 3 },
  "marketPrices": { "buySeeds": 2, "buyFood": 1, "sellAny": 1 },
  "apPerDay": 7,
  "cropMaturityDays": 3,
  "foodPerCrop": 3
}
```

Reproducibility lives here.

## `README.md` per run

Short. Hand-written by the user or autogenerated. Captures:
- Run name and date.
- Regime and religions in play.
- Models used.
- Seed and day count.
- Anything the user wants to note before the run starts.

## `summary_final.md` per run

Empty at run end. User fills in after pasting `transcript.md` into Claude and synthesizing. This is where the qualitative observer findings live for that specific run.
