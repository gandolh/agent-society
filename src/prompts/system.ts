import type { AgentState, ActionName, WorldState, EventLogEntry } from "../types.js";
import { publicRosterView } from "../world.js";

const REGIME_BLOCKS: Record<string, string> = {
  capitalism: `The city runs on private trade. Aldric Vance owns the mill and the largest workshop in town and is the main employer. He sets wages and prices. There is no council and no king. Everyone earns, buys, and survives by their own work or their own coin. Help is voluntary; debt is not.`,
};

const RELIGION_BLOCKS: Record<string, string> = {
  Christianity: `You are a Christian. Father Maro is your parish priest. You attend Sunday services (every 7 days) and may TITHE to him. The church teaches: love thy neighbor, give freely, observe the holy day. Most of the city is Christian.`,
  Atheism: `You are an atheist in a mostly-Christian city. You do not attend Father Maro's services. You may PRAY (a private gesture, often ironic) but you do not TITHE. You are a small minority and you know it.`,
};

const ACTION_DESCRIPTIONS: Record<ActionName, string> = {
  WORK_PLOT:
    "WORK_PLOT (1 AP). args: {}. Spend a day's effort on your trade. If you have stock/materials, you invest one unit; goods mature in 3 days.",
  HARVEST:
    "HARVEST (1 AP). args: {}. Collect ready goods from your trade. Each yields 3 food (or food-equivalent earnings).",
  GO_TO_MARKET:
    'GO_TO_MARKET (2 AP). args: { sub: "BUY"|"SELL", item: "seeds"|"food", qty: number }. One transaction at fixed prices. "seeds" = trade stock/materials.',
  GIVE:
    'GIVE (1 AP). args: { to: "V1|V2|...", resource: "gold"|"food"|"seeds", amount: number }. Unilateral transfer.',
  SAY:
    "SAY (1 AP). args: { text: string }. Speak publicly in the city square. Everyone hears.",
  DM:
    'DM (1 AP). args: { to: "V1|V2|...", text: string }. Private message. Only recipient sees it.',
  PRAY:
    'PRAY (1 AP). args: { deity: "Christianity"|"Atheism"|string }. Public religious act.',
  TITHE:
    'TITHE (1 AP). args: { to: "N2"|..., resource: "gold"|"food", amount: number }. Religious offering.',
  CONVERT:
    'CONVERT (2 AP). args: { religion: "Christianity"|"Atheism" }. Deliberately change your faith.',
  REST:
    "REST (0 AP). args: {}. End your day.",
};

export type SystemPromptInput = {
  agent: AgentState;
  world: WorldState;
  publicEventsToday: EventLogEntry[];
};

export function buildSystemPrompt(input: SystemPromptInput): string {
  const { agent, world } = input;
  const sections: string[] = [];

  sections.push(`=== YOU ARE ===\n${agent.name}.`);
  sections.push(agent.coreIdentity);

  sections.push(`=== YOUR CURRENT STATE (your most recent reflection) ===\n${agent.currentState}`);

  const holyDay = computeHolyDay(world.day);
  sections.push(
    `=== TODAY ===\nDay ${world.day}. Holy day: ${holyDay ?? "none"}.`,
  );

  sections.push(
    [
      `=== YOUR STATE ===`,
      `Religion: ${agent.religion}`,
      `Gold: ${agent.resources.gold}  Food: ${agent.resources.food}  Stock: ${agent.resources.seeds}`,
      `Work: ${agent.plot.cropsPlanted.length} in progress, ${agent.plot.cropsReady} ready`,
      `AP left: ${agent.actionPointsLeft}   Hunger: ${agent.hungerDays}d`,
    ].join("\n"),
  );

  const regimeBlock = REGIME_BLOCKS[world.config.regime];
  if (regimeBlock) {
    sections.push(`=== THE CITY ===\n${regimeBlock}`);
  }

  const religionBlock = RELIGION_BLOCKS[agent.religion];
  if (religionBlock) {
    sections.push(`=== YOUR FAITH ===\n${religionBlock}`);
  }

  const roster = publicRosterView(world)
    .filter((r) => r.slot !== agent.id)
    .map((r) => `${r.slot} ${r.name} (${r.religion}) — g${r.gold} f${r.food} s${r.seeds}`);
  sections.push(`=== ROSTER ===\n${roster.join("\n")}`);

  const memoryLines = formatMemory(agent.recentEvents, world.day);
  if (memoryLines) {
    sections.push(`=== YOUR RECENT EVENTS ===\n${memoryLines}`);
  }

  if (agent.unreadDms.length > 0) {
    const dmLines = agent.unreadDms
      .map((dm) => `[d${dm.day} from ${dm.fromId}]: "${dm.text}"`)
      .join("\n");
    sections.push(`=== UNREAD DMS ===\n${dmLines}`);
  }

  const publicLines = input.publicEventsToday
    .filter((e) => e.type === "action" && e.public && e.actor !== agent.id)
    .map((e) => formatPublicEventLine(e as Extract<EventLogEntry, { type: "action" }>));
  if (publicLines.length > 0) {
    sections.push(`=== PUBLIC TODAY ===\n${publicLines.join("\n")}`);
  }

  sections.push(buildActionsAvailableBlock(agent));

  sections.push(
    `=== DECISION ===\n` +
      `Pick ONE action. Respond ONLY with JSON:\n` +
      `{"action":"<NAME>","args":{...},"reasoning":"<one short in-character sentence>"}\n` +
      `No other text. args must match the action's schema.`,
  );

  return sections.join("\n\n");
}

export function computeHolyDay(day: number): string | null {
  if (day % 7 === 0) return "Christianity";
  return null;
}

function formatMemory(events: EventLogEntry[], today: number): string {
  const lines: string[] = [];
  const grouped = new Map<number, string[]>();
  for (const e of events) {
    if (e.type !== "action") continue;
    const d = e.day;
    if (today - d > 7) continue;
    const arr = grouped.get(d) ?? [];
    arr.push(formatMemoryLine(e));
    grouped.set(d, arr);
  }
  const days = Array.from(grouped.keys()).sort((a, b) => a - b);
  for (const d of days) {
    const acts = (grouped.get(d) ?? []).join("; ");
    lines.push(`d${d}: ${acts}`);
  }
  return lines.join("\n");
}

function formatMemoryLine(e: Extract<EventLogEntry, { type: "action" }>): string {
  const args = e.args ?? {};
  switch (e.action) {
    case "WORK_PLOT":
      return `worked`;
    case "HARVEST":
      return `harvested ${e.result?.foodGained ?? "?"}f`;
    case "GO_TO_MARKET":
      return `market ${JSON.stringify(args)}`;
    case "GIVE":
      return `gave ${args.amount} ${args.resource} → ${args.to}`;
    case "SAY":
      return `said "${String(args.text ?? "").slice(0, 80)}"`;
    case "DM":
      return `dm ${args.to}: "${String(args.text ?? "").slice(0, 80)}"`;
    case "PRAY":
      return `prayed ${args.deity}`;
    case "TITHE":
      return `tithed ${args.amount} ${args.resource} → ${args.to}`;
    case "CONVERT":
      return `converted → ${args.religion}`;
    case "REST":
      return `rested`;
    default:
      return `?`;
  }
}

function formatPublicEventLine(e: Extract<EventLogEntry, { type: "action" }>): string {
  const args = e.args ?? {};
  switch (e.action) {
    case "SAY":
      return `${e.actor}: "${String(args.text ?? "")}"`;
    case "TITHE":
      return `${e.actor} tithed ${args.amount} ${args.resource} → ${args.to}`;
    case "CONVERT":
      return `${e.actor} converted → ${args.religion}`;
    case "GO_TO_MARKET":
      return `${e.actor} → market`;
    case "GIVE":
      return `${e.actor} gave ${args.amount} ${args.resource} → ${args.to}`;
    case "PRAY":
      return `${e.actor} prayed`;
    case "HARVEST":
      return `${e.actor} harvested`;
    case "WORK_PLOT":
      return `${e.actor} worked`;
    case "REST":
      return `${e.actor} rested`;
    default:
      return `${e.actor} ${e.action}`;
  }
}

function buildActionsAvailableBlock(agent: AgentState): string {
  const lines = ["=== ACTIONS AVAILABLE ==="];
  for (const [name, desc] of Object.entries(ACTION_DESCRIPTIONS) as Array<[ActionName, string]>) {
    const cost = parseFirstNumber(desc);
    if (cost === null || agent.actionPointsLeft >= cost || name === "REST") {
      lines.push(desc);
    }
  }
  return lines.join("\n");
}

function parseFirstNumber(s: string): number | null {
  const m = s.match(/\((\d+) AP/);
  return m && m[1] ? parseInt(m[1], 10) : null;
}
