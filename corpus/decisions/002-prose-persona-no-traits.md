# 002 — Prose persona, no numeric traits

**Status:** accepted
**Date:** 2026-05-26
**Related:** [../design/agent-template](../design/agent-template.md), [006-bifurcated-persona-with-reflection](006-bifurcated-persona-with-reflection.md)

## Context

How should an agent's personality, beliefs, and desires be represented? Three options were considered:

- Structured numeric traits (Big Five + drives vector) — clean for experiments but small models role-play poorly from numbers.
- Free-text persona — rich behavior, but no sweepable variables.
- Both — structured numeric source of truth + LLM-generated persona prose.

The recommendation in the grilling session was *both* — for cleanest experimental design. The user chose **free-text only**.

## Decision

Each agent's personality, beliefs, and desires are **pure prose**. No numeric trait vector. No drives vector. The persona is what the model reads and reasons from.

The only structured agent state is the **dynamic, engine-mutated** fields — religion (enum), gold/food/seeds (ints), AP (int), plot crops (counted), hunger days (int), unread DMs (list). These are not personality; they are world state.

## Alternatives considered

- **Structured numeric traits (Big Five + drives).** Cleaner experimental design — sweepable variables, statistical comparison across runs. Rejected because small Ollama models (`llama3.1:8b`, `mistral:7b`, `qwen2.5:7b`) produce bland, samey personas when prompted with numeric inputs like *"you are LOW agreeableness, HIGH piety."* They role-play *much* better from prose.
- **Hybrid (numeric truth + generated prose).** The recommended option in the grilling session. Best of both: sweepable variables and rich behavior. Rejected by the user. The consequence is documented below.

## Consequences

- **Enables:** rich, distinct, dramatically tense personas. Small models perform best at this. Personas are *art*, not parameter sweeps.
- **Makes harder:** sweeping per-trait variables across runs ("what if all agents were +10% greedier"). That kind of experiment is impossible — there is no "greed dial." Instead the experimental design shifts to **vary the conditions (regime), keep the cast (personas) constant**.
- **Reproducibility is preserved** — same seed + same personas + same models + temperature=0 reproduces the run. We just can't vary the personas systematically across runs.
- **The experiment becomes**: *"How does this fixed cast behave under different environmental conditions?"* — which is a perfectly valid research design (it's how human social experiments are often run too).

## Open questions

- If we later want to test the model-family hypothesis ("do llamas befriend llamas") at v2 scale, we will have 2+ villagers per model. They will all have different personas (we can't have two identical personas — same prose would defeat the comparison). The model-family signal will be confounded with persona variation. This is acceptable but worth flagging.
