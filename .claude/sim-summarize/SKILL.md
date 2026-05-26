---
name: sim-summarize
version: 0.1.0
description: |
  Post-run simulation summarizer. Triggers when the user says "/sim-summarize",
  "summarize the run", "analyze the transcript", or "run the observer". Reads
  the most recent run's transcript and prints ready-to-paste prompt templates
  for each of the five observer dimensions (social graph, belief propagation,
  compliance, cooperation, drift). Also offers to open a combined single-prompt
  version. Does NOT call any external API — output is for the user to paste
  into Claude/GPT chat manually.
license: MIT
compatibility: claude-code
allowed-tools:
  - Read
  - Write
  - Bash
---

# sim-summarize — post-run observer prompt generator

Reads the current run's transcript and emits the five standard observer
prompt templates, pre-filled with the correct agent names and regime from
the run's `config.json`. The user pastes one or more into a fresh Claude
chat alongside the transcript.

## When to run

Triggers on:

- `/sim-summarize`
- "summarize the run", "summarize the sim"
- "analyze the transcript"
- "run the observer", "observer prompts"
- "what happened in the run"

## Procedure

1. **Find the run directory.**
   - Look for the most recently modified directory under `runs/` that contains
     a `transcript.md`. Use `ls -t runs/` to sort by modification time and
     pick the first match.
   - If the user specified a run dir (e.g. "summarize run 2026-05-26_socialism_run01"),
     use that one instead.

2. **Read config.** Read `runs/<runDir>/config.json` to extract:
   - `regime` (e.g. "socialism")
   - agent names / slots (V1, V2, V3, N1, N2, N3 and their personas)

3. **Check transcript size.** Run `wc -l runs/<runDir>/transcript.md`.
   If it's over 2000 lines, warn the user that they may need to paste it
   in chunks or use a model with a large context window.

4. **Print the five prompt templates** (see below), each in its own fenced
   code block so the user can copy cleanly. Substitute the actual regime
   and agent names from step 2.

5. **Offer the combined prompt.** After the five templates, ask:

   > Want a single combined prompt that runs all five analyses at once?
   > Reply "combined" and I'll generate it.
   > If the user replies "combined", print the combined version (see below).

6. **Remind the user where to save.** End with:
   > After Claude synthesizes, save the result to:
   > `runs/<runDir>/summary_final.md`

---

## The five prompt templates

Fill `{{REGIME}}`, `{{V1_NAME}}`, `{{V2_NAME}}`, `{{V3_NAME}}`,
`{{V1_RELIGION}}`, `{{V2_RELIGION}}`, `{{V3_RELIGION}}`,
`{{N1_ROLE}}`, `{{N2_ROLE}}`, `{{N3_ROLE}}` from `config.json`.

### 1 — Social graph synthesis

```
This is a transcript of a small simulated village. Each agent is an
LLM with a hidden prose persona. Please analyze who became friends
with whom and who became enemies, based on actions taken (shares,
tithes, gifts, defenses) and language used (DMs, public sayings).

For each pair (V1-V2, V1-V3, V1-N1, V2-V3, V2-N1, V3-N1 and any
NPC-NPC pairs that interacted), give:
- sentiment: warm | neutral | cool | hostile
- 1-2 lines of evidence with specific day references
- direction of change (if any) over the run

Conclude with: did any cliques form? Did alignment cross religion or
regime boundaries?
```

### 2 — Belief propagation synthesis

```
Please track religious belief in this transcript. The starting
religions were: {{V1_NAME}} ({{V1_RELIGION}}), {{V2_NAME}}
({{V2_RELIGION}}), {{V3_NAME}} ({{V3_RELIGION}}).
The NPCs are {{N1_ROLE}}, {{N2_ROLE}}, {{N3_ROLE}}.

Report:
- Who converted, when, and (from the reasoning fields) why.
- Who almost converted but did not. What pulled them back?
- Did either religion radicalize? Did any faith drift toward
  open extremism or toward absorption into another?
- Did atheism (if present) gain or lose ground?
```

### 3 — Compliance and dissent synthesis

```
The regime in this run is {{REGIME}}. {{N1_ROLE}} leads the regime.
Note: there are no engine-enforced taxes. Compliance is purely
behavioral.

For each agent ({{V1_NAME}}, {{V2_NAME}}, {{V3_NAME}}), report:
- Did they GIVE to others when asked or when others were in need?
- Did they GIVE specifically to the regime leader or in response
  to their public SAYs?
- Did they evade quietly (small or no donations while clearly
  able) or openly refuse?
- Did the regime leader's tone shift when faced with non-compliance?
```

### 4 — Cooperation under scarcity

```
Track gifts, tithes, and shared resources across the run.
- Who shared most? Who hoarded?
- Did mutual aid create durable bonds (did A keep helping B over
  time) or one-off exchanges?
- Did sharing flow within religion (Christians help Christians,
  Vine helps Vine) or across?
- Did anyone defect repeatedly? Did defection breed defection?
```

### 5 — Drift analysis

```
Each agent updates their CURRENT STATE block weekly via
self-reflection. For each agent ({{V1_NAME}}, {{V2_NAME}},
{{V3_NAME}}, and any NPCs that showed state updates), compare
Week 0 with the final week. What drifted? Use specific quotes
from their current-state blocks.

Which drifts were consistent with the persona's seeded tension
being pulled on? Which were surprising?
```

---

## Combined prompt (on request)

```
This is a transcript of a small simulated village running under a
{{REGIME}} regime. Agents: {{V1_NAME}} ({{V1_RELIGION}}),
{{V2_NAME}} ({{V2_RELIGION}}), {{V3_NAME}} ({{V3_RELIGION}}).
NPCs: {{N1_ROLE}}, {{N2_ROLE}}, {{N3_ROLE}}.

Please produce a structured analysis across five dimensions:

## 1. Social graph
For each agent pair, give: sentiment (warm/neutral/cool/hostile),
1-2 lines of evidence with day references, direction of change.
Conclude: did cliques form? Did alignment cross religion or regime?

## 2. Belief propagation
Who converted, when, and why (use reasoning fields). Who almost
converted? Did any religion radicalize or get absorbed? Did
atheism gain/lose ground?

## 3. Compliance and dissent
Regime: {{REGIME}}. No engine-enforced rules — compliance is
behavioral. For each villager: did they give when asked? Did they
give to the regime leader specifically? Quiet evasion or open
refusal? Did the leader's tone shift under non-compliance?

## 4. Cooperation under scarcity
Who shared most? Who hoarded? Durable mutual aid or one-off?
Did sharing flow within religion or across? Did defection breed
defection?

## 5. Drift
Compare each agent's Week 0 current-state block with their final
one. What drifted? Quote specifically. Which drifts match the
seeded persona tension? Which were surprising?
```
