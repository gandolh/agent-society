import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ActionName, AgentSnapshot, EventLogEntry, RunConfig, WorldState } from "./types.js";

/**
 * Writes to two artifacts per event:
 *  - `transcript.md`  — prose-readable
 *  - `events.jsonl`   — machine-readable
 *
 * Append-only. No in-memory buffering.
 */
export class RunLogger {
  private readonly runDir: string;
  private readonly transcriptPath: string;
  private readonly eventsPath: string;

  constructor(runDir: string) {
    this.runDir = runDir;
    this.transcriptPath = join(runDir, "transcript.md");
    this.eventsPath = join(runDir, "events.jsonl");
  }

  async init(config: RunConfig): Promise<void> {
    await mkdir(this.runDir, { recursive: true });
    await writeFile(
      join(this.runDir, "config.json"),
      JSON.stringify(config, null, 2),
    );
    await writeFile(
      this.transcriptPath,
      `# ${config.runName}\n\n` +
        `**Regime:** ${config.regime}\n` +
        `**Religions:** ${config.religions.join(", ")}\n` +
        `**Seed:** ${config.seed}\n` +
        `**Days:** ${config.days}\n` +
        `**Cast:** ${config.cast.map((a) => `${a.slot} (${a.name}, ${a.model})`).join("; ")}\n\n`,
    );
    await writeFile(this.eventsPath, "");
  }

  async logEvent(entry: EventLogEntry): Promise<void> {
    await appendFile(this.eventsPath, JSON.stringify(entry) + "\n");
  }

  async logDayHeader(world: WorldState, holyDay: string | null): Promise<void> {
    const lines: string[] = [];
    lines.push("");
    lines.push(`## Day ${world.day}${holyDay ? ` — Holy day in the ${holyDay} calendar.` : ""}`);
    lines.push("");
    const morningParts: string[] = [];
    for (const agent of Object.values(world.agents)) {
      if (agent.hungerDays > 0) {
        morningParts.push(`${agent.id} (${agent.name}) hungry ${agent.hungerDays} day${agent.hungerDays > 1 ? "s" : ""}`);
      }
    }
    const prices = world.config.marketPrices;
    morningParts.push(`Market: seeds ${prices.buySeeds}g, food ${prices.buyFood}g`);
    lines.push(`**Morning state.** ${morningParts.join(". ")}.`);
    lines.push("");
    await appendFile(this.transcriptPath, lines.join("\n"));
  }

  async logRoundHeader(round: number): Promise<void> {
    await appendFile(this.transcriptPath, `[Round ${round}]\n`);
  }

  async logActionProse(opts: {
    agentSlot: string;
    agentName: string;
    model: string;
    role: string;
    religion: string;
    action: ActionName;
    targetDescription?: string;
    summary: string;
    reasoning?: string;
    speech?: string;
    isPublic: boolean;
  }): Promise<void> {
    const lines: string[] = [];
    const tag = `[${opts.model}-${shortRole(opts.role)}, ${opts.religion}]`;
    const head = `- **${opts.agentSlot} (${opts.agentName})** ${tag} → \`${opts.action}\``;
    const detail = opts.targetDescription
      ? `${head} ${opts.targetDescription}: ${opts.summary}`
      : `${head}: ${opts.summary}`;
    lines.push(detail);
    if (opts.speech) {
      const visibility = opts.isPublic ? "" : " *(private)*";
      lines.push(`  >${visibility} ${opts.speech.replace(/\n/g, "\n  > ")}`);
    }
    if (opts.reasoning) {
      lines.push(`  *Reasoning:* "${opts.reasoning.replace(/"/g, '\\"')}"`);
    }
    await appendFile(this.transcriptPath, lines.join("\n") + "\n");
  }

  async logNightProse(world: WorldState, snapshot: Record<string, AgentSnapshot>): Promise<void> {
    const lines: string[] = [];
    lines.push("");
    const hungerLines: string[] = [];
    for (const agent of Object.values(world.agents)) {
      const s = snapshot[agent.id]!;
      if (s.hunger === 0 && agent.hungerDays === 0) {
        hungerLines.push(`${agent.id} ate (hunger 0)`);
      } else if (agent.hungerDays > 0) {
        hungerLines.push(`${agent.id} did not eat (hunger ${agent.hungerDays})`);
      }
    }
    lines.push(`**Night.** ${hungerLines.join("; ")}. Day ${world.day} ends.`);
    lines.push("");
    await appendFile(this.transcriptPath, lines.join("\n"));
  }

  async logReflectionMarker(day: number, week: number, slots: string[]): Promise<void> {
    const lines: string[] = [];
    lines.push("");
    lines.push(`[REFLECTION] — Week ${week} end (day ${day})`);
    for (const slot of slots) {
      lines.push(`- ${slot}: weekly reflection. See \`agents/${slot}\`.`);
    }
    lines.push("");
    await appendFile(this.transcriptPath, lines.join("\n"));
  }

  async logRawProse(text: string): Promise<void> {
    await appendFile(this.transcriptPath, text);
  }
}

function shortRole(role: string): string {
  if (role === "regime-leader") return "regime";
  if (role === "cult-leader") return "cult";
  return role;
}
