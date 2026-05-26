# Design — Observer workflow

**Status:** stable
**Last updated:** 2026-05-26
**Related:** [research-goals](research-goals.md), [log-format](log-format.md), [../decisions/005-manual-observer-workflow.md](../decisions/005-manual-observer-workflow.md)

How qualitative analysis happens. **No API integration in v1.** The user pastes transcripts into Claude/GPT chat manually and synthesizes offline.

## The flow

1. Run completes. `runs/<runDir>/transcript.md` exists.
2. User opens `transcript.md` in their text editor or browser.
3. User pastes the relevant slice (last week, last 30 days, or the whole thing) into Claude or GPT chat.
4. User asks one or more of the standard questions (below) or improvises.
5. User saves Claude's synthesis into `runs/<runDir>/summary_final.md`.

## Recommended question templates

Save these somewhere reusable. Past-tense framing helps the model treat the transcript as historical record rather than a story to embellish.

### Social graph synthesis

```
This is a transcript of a small simulated village. Each agent is an
LLM with a hidden prose persona. Please analyze who became friends
with whom and who became enemies, based on actions taken (shares,
tithes, gifts, defenses) and language used (DMs, public sayings).

For each pair (V1-V2, V1-V3, V1-N1, ...), give:
- sentiment: warm | neutral | cool | hostile
- 1-2 lines of evidence with specific day references
- direction of change (if any) over the run

Conclude with: did any cliques form? Did alignment cross religion or
regime boundaries?
```

### Belief propagation synthesis

```
Please track religious belief in this transcript. The starting religions
were: V1 Christian, V2 Atheist, V3 TrueVine. The NPCs are Father Maro
(Christian priest), Sister Velka (TrueVine cult leader), Aldric (Christian
council chair, but plays the socialist regime role).

Report:
- Who converted, when, and (from the reasoning fields) why.
- Who *almost* converted but did not. What pulled them back?
- Did either religion radicalize? Did the True Vine drift toward
  open cultism or toward absorption back into Christianity?
- Did atheism gain or lose ground?
```

### Compliance and dissent synthesis

```
The regime in this run is socialism — Aldric is the elected Council
Chair, calling for voluntary redistribution. Note: there are no engine-
enforced taxes. Compliance is purely behavioral.

For each agent, report:
- Did they GIVE to others when asked or when others were in need?
- Did they GIVE specifically to Aldric or in response to his SAYs?
- Did they evade quietly (small or no donations while clearly able)
  or openly refuse?
- Did Aldric's tone shift when faced with non-compliance?
```

### Cooperation under scarcity

```
Track gifts, tithes, and shared resources across the run.
- Who shared most? Who hoarded?
- Did mutual aid create durable bonds (did A keep helping B over time)
  or one-off exchanges?
- Did sharing flow within religion (Christians help Christians, Vine
  helps Vine) or across?
- Did anyone defect repeatedly? Did defection breed defection?
```

### Drift analysis

```
Each agent updates their CURRENT STATE block weekly via self-reflection.
For each agent (V1, V2, V3, N1, N2, N3), compare Week 0 with the final
week. What drifted? Use specific quotes from their current-state blocks.

Which drifts were consistent with the persona's seeded tension being
pulled on? Which were surprising?
```

## Why manual and not automated

This was an intentional design choice (see [../decisions/005-manual-observer-workflow.md](../decisions/005-manual-observer-workflow.md)):

- **Zero API integration burden.** No keys, no rate limits, no costs from a runaway loop.
- **The user stays in the loop.** They read the transcripts. They see what's interesting before Claude does. They guide the synthesis.
- **Flexibility.** Each run can be queried differently. Ad-hoc questions are first-class.
- **The framework's only job is to write good logs.** That sharpens what the framework has to be good at.

The cost is **one task we don't automate**. Acceptable for a personal research project. Revisit if running 20+ runs becomes routine.

## What to do with Claude's synthesis

Save it to `runs/<runDir>/summary_final.md`. Cross-link from there to the relevant transcript sections (Claude can produce day references — keep them).

If the synthesis surfaces a finding that *generalizes* across runs (e.g. "small Ollama models converge to politeness under all regimes — we haven't seen real conflict") write a new page under [../experiments/](../experiments/) capturing it. That's how the corpus accumulates beyond per-run notes.
