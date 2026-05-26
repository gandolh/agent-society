# Log

Append-only chronological record of corpus changes. Each entry starts with `## [YYYY-MM-DD] <type> | <summary>` so it is greppable with `grep "^## \[" log.md | tail -N`.

## [2026-05-26] bootstrap | initial corpus established from grilling session

Initial corpus created after a long grilling session that pinned down:

- The project is a **research experiment** (not a demo, framework, or sandbox) — minimal UI, reproducibility matters, output is data + observations.
- Primary mode is **open-ended emergent behavior**, with a strong external model (Claude/GPT) used **offline via manual transcript paste** to synthesize along four dimensions: social graph, belief propagation, compliance/dissent, cooperation under scarcity.
- **Village setting** with plots, gold/seeds/food, AP per day, marketplace, and chat + DMs. The Openfront-style civilization-vs-civilization idea was parked as future work.
- **6-agent MVP cast** (down from initial 9): 3 villagers (one of each open-source model) + 3 NPC leaders. NPCs are full round-robin participants but **excluded from final research analysis**.
- **Round-robin, one action at a time, 7 AP/day**, variable AP costs, skip allowed.
- **Soft hunger pressure** (no death) — hungry agents lose AP.
- **Pure prose personas** with **bifurcated structure**: immutable core + mutable current-state updated via **weekly + event-triggered self-reflection** in the agent's own model.
- **Narrative-only regime/religion** mechanics with LLM-played leader NPCs (no engine-enforced taxes/tithes).
- Regime is the **independent variable** swept across runs: Socialism (run 01), Monarchy, Capitalism. Religions **coexist** in one village (Christianity, True Vine reformist cult, Atheism).
- Action set: 10 verbs — `WORK_PLOT`, `HARVEST`, `GO_TO_MARKET`, `GIVE`, `SAY`, `DM`, `PRAY`, `TITHE`, `CONVERT`, `REST`.
- Manual observer workflow — framework writes prose transcript + JSONL events + per-agent files; user pastes transcript to Claude offline.
- Personas drafted with **deliberate tension** seeded in each — every agent has a competing pull or unprocessed wound that the village conditions can pull on.

See [decisions/](decisions/) for the load-bearing choices with reasoning.
