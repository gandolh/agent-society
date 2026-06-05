import { appendFile, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ActionName, AgentSnapshot, AgentState, EventLogEntry, RunConfig, WorldState } from "./types.js";

/**
 * Writes to two artifacts per event:
 *  - `transcript.md`  — prose-readable
 *  - `events.jsonl`   — machine-readable
 *
 * Log methods write to an in-memory buffer. Call flush() to commit the buffer
 * to disk in a single appendFile call — do this once per round (or per day).
 */
export class RunLogger {
  private readonly runDir: string;
  private readonly transcriptPath: string;
  private readonly eventsPath: string;
  private transcriptBuf: string[] = [];
  private eventsBuf: string[] = [];

  constructor(runDir: string) {
    this.runDir = runDir;
    this.transcriptPath = join(runDir, "transcript.md");
    this.eventsPath = join(runDir, "events.jsonl");
  }

  async init(config: RunConfig, agents: AgentState[]): Promise<void> {
    // Wipe any previous run in this directory (e.g. repeated smoke runs).
    await rm(this.runDir, { recursive: true, force: true });
    await mkdir(this.runDir, { recursive: true });
    const { ollamaApiKey: _redacted, ...safeConfig } = config;
    await writeFile(
      join(this.runDir, "config.json"),
      JSON.stringify(safeConfig, null, 2),
    );
    const castLine = agents
      .map((a) => `${a.id} (${a.name}, ${a.model})`)
      .join("; ");
    await writeFile(
      this.transcriptPath,
      `# ${config.runName}\n\n` +
        `**Regime:** ${config.regime}\n` +
        `**Religions:** ${config.religions.join(", ")}\n` +
        `**Seed:** ${config.seed}\n` +
        `**Days:** ${config.days}\n` +
        `**Cast:** ${castLine}\n\n`,
    );
    await writeFile(this.eventsPath, "");
  }

  /** Flush buffered writes to disk — call once per round. */
  async flush(): Promise<void> {
    const transcript = this.transcriptBuf.join("");
    const events = this.eventsBuf.join("");
    this.transcriptBuf = [];
    this.eventsBuf = [];
    if (transcript) await appendFile(this.transcriptPath, transcript);
    if (events) await appendFile(this.eventsPath, events);
  }

  logEvent(entry: EventLogEntry): void {
    this.eventsBuf.push(JSON.stringify(entry) + "\n");
  }

  logDayHeader(world: WorldState, holyDay: string | null): void {
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
    this.transcriptBuf.push(lines.join("\n"));
  }

  logRoundHeader(round: number): void {
    this.transcriptBuf.push(`[Round ${round}]\n`);
  }

  logActionProse(opts: {
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
    zone?: string;
  }): void {
    const lines: string[] = [];
    const tag = `[${opts.model}-${shortRole(opts.role)}, ${opts.religion}]`;
    const at = opts.zone ? ` @${opts.zone}` : "";
    const head = `- **${opts.agentSlot} (${opts.agentName})**${at} ${tag} → \`${opts.action}\``;
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
    this.transcriptBuf.push(lines.join("\n") + "\n");
  }

  logNightProse(world: WorldState, snapshot: Record<string, AgentSnapshot>): void {
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
    this.transcriptBuf.push(lines.join("\n"));
  }

  logWealth(
    day: number,
    wealth: {
      individual: Record<string, number>;
      byReligion: Record<string, number>;
      byClass: Record<string, number>;
    },
  ): void {
    const indiv = Object.entries(wealth.individual)
      .map(([id, g]) => `${id} ${g}g`)
      .join(", ");
    const rel = Object.entries(wealth.byReligion)
      .map(([k, g]) => `${k} ${g}g`)
      .join(", ");
    const klass = Object.entries(wealth.byClass)
      .map(([k, g]) => `${k} ${g}g`)
      .join(", ");
    this.transcriptBuf.push(
      `\n*Wealth d${day} — individuals: ${indiv}. By faith: ${rel}. By class: ${klass}.*\n`,
    );
  }

  logDeaths(day: number, dead: Array<{ id: string; name: string }>): void {
    const who = dead.map((d) => `${d.id} (${d.name})`).join(", ");
    const verb = dead.length > 1 ? "have" : "has";
    this.transcriptBuf.push(
      `\n> 💀 **${who} ${verb} died of hunger on day ${day}.**\n`,
    );
  }

  logReflectionMarker(day: number, week: number, slots: string[]): void {
    const lines: string[] = [];
    lines.push("");
    lines.push(`[REFLECTION] — Week ${week} end (day ${day})`);
    for (const slot of slots) {
      lines.push(`- ${slot}: weekly reflection. See \`agents/${slot}\`.`);
    }
    lines.push("");
    this.transcriptBuf.push(lines.join("\n"));
  }

  logRawProse(text: string): void {
    this.transcriptBuf.push(text);
  }
}

function shortRole(role: string): string {
  return role;
}
