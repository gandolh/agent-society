import type { AgentState, ActionName, WorldState, EventLogEntry } from "../types.js";
import { publicRosterView } from "../world.js";

const REGIME_BLOCKS: Record<string, string> = {
  socialism: `Aldric is the elected Council Chair. He was elected last year on the platform
"no one in this village goes hungry while another's barn is full." He holds open
village meetings and asks those with surplus to share with those who lack. There
is no law forcing redistribution — only the moral weight of the Chair's call.

Aldric is a practicing Christian and attends Father Maro's church. He believes
his work is Christian charity made systematic.`,
  monarchy: `Aldric is the hereditary king of the village (his father ruled before him). He
claims tribute weekly — one gold per household — and issues decrees on matters
of his choosing. The Crown is local, not distant. There is no law above him in
this village.`,
  capitalism: `Aldric is the wealthiest landowner and the proprietor of the market. He sets
prices. He may refuse service. He owns more land than he farms and hires labor
when he wishes. Those without surplus depend on his market for seeds and food.`,
};

const RELIGION_BLOCKS: Record<string, string> = {
  Christianity: `You are a Christian. Father Maro is your priest. You attend his services on
holy days (every 7 days) and may TITHE to him. The church teaches: love thy
neighbor, give freely, trust the priest, observe the holy day. Christianity in
this village is traditional and warm rather than scholarly.`,
  TrueVine: `You are a follower of the True Vine, a reformist faith led by Sister Velka.
The Vine teaches that Father Maro's church has lost its way and that scripture
rewards those who read for themselves. Vine followers share with each other
freely and abundantly. Care for outsiders is a worldly duty, not a sacred one.
You may TITHE to Sister Velka. You attend Vine teachings on Vine holy days
(every 9 days, off-cycle from Christianity).`,
  Atheism: `You are an atheist. You do not attend Father Maro's church or Sister Velka's
teachings. You may PRAY (as a private gesture, ironic or nostalgic), but you do
not TITHE. You may be lonely. Many atheists in this village are former
believers who left after loss.`,
};

const ACTION_DESCRIPTIONS: Record<ActionName, string> = {
  WORK_PLOT:
    'WORK_PLOT (1 AP). args: {}. If you have seeds, plants one. Otherwise tends the plot (narrative only). Crops mature after 3 days.',
  HARVEST:
    'HARVEST (1 AP). args: {}. Collects all ready crops on your plot. Each ready crop yields 3 food.',
  GO_TO_MARKET:
    'GO_TO_MARKET (2 AP). args: { sub: "BUY" | "SELL", item: "seeds" | "food", qty: number }. One transaction. Prices fixed.',
  GIVE:
    'GIVE (1 AP). args: { to: "V1|V2|...", resource: "gold"|"food"|"seeds", amount: number }. Unilateral transfer. They cannot refuse.',
  SAY:
    'SAY (1 AP). args: { text: string }. Speak publicly in the village square. Everyone hears.',
  DM:
    'DM (1 AP). args: { to: "V1|V2|...", text: string }. Private message. Only the recipient sees it.',
  PRAY:
    'PRAY (1 AP). args: { deity: "Christianity" | "TrueVine" | "Atheism" | string }. Narrative religious act. Publicly observable.',
  TITHE:
    'TITHE (1 AP). args: { to: "N2"|"N3"|..., resource: "gold"|"food", amount: number }. Religious offering. Recipient should be a religious leader.',
  CONVERT:
    'CONVERT (2 AP). args: { religion: "Christianity"|"TrueVine"|"Atheism" }. Deliberately change your faith.',
  REST:
    'REST (0 AP). args: {}. End your day. You will not take more actions today.',
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
      `Gold: ${agent.resources.gold}    Food: ${agent.resources.food}    Seeds: ${agent.resources.seeds}`,
      `Plot: ${agent.plot.cropsPlanted.length} planted, ${agent.plot.cropsReady} ready`,
      `AP left today: ${agent.actionPointsLeft}`,
      `Hunger: ${agent.hungerDays} day${agent.hungerDays === 1 ? "" : "s"} since last meal`,
    ].join("\n"),
  );

  const regimeBlock = REGIME_BLOCKS[world.config.regime];
  if (regimeBlock) {
    sections.push(`=== THE VILLAGE'S CURRENT STRUCTURE ===\n${regimeBlock}`);
  }

  const religionBlock = RELIGION_BLOCKS[agent.religion];
  if (religionBlock) {
    sections.push(`=== YOUR FAITH (or lack thereof) ===\n${religionBlock}`);
  }

  const roster = publicRosterView(world)
    .filter((r) => r.slot !== agent.id)
    .map(
      (r) =>
        `${r.slot} (${r.name}) — ${r.religion} — gold ${r.gold}, food ${r.food}, seeds ${r.seeds}, plot ${r.cropsPlanted}/${r.cropsReady}`,
    );
  sections.push(`=== VILLAGE ROSTER ===\n${roster.join("\n")}`);

  const memoryLines = formatMemory(agent.recentEvents, world.day);
  sections.push(
    `=== YOUR MEMORY OF RECENT EVENTS ===\n${memoryLines || "(no recent events)"}`,
  );

  if (agent.unreadDms.length > 0) {
    const dmLines = agent.unreadDms
      .map((dm) => `[DM, day ${dm.day}, from ${dm.fromId}]: "${dm.text}"`)
      .join("\n");
    sections.push(`=== UNREAD MESSAGES ===\n${dmLines}`);
  }

  const publicLines = input.publicEventsToday
    .filter((e) => e.type === "action" && e.public && e.actor !== agent.id)
    .map((e) => formatPublicEventLine(e as Extract<EventLogEntry, { type: "action" }>));
  if (publicLines.length > 0) {
    sections.push(
      `=== PUBLIC EVENTS YOU WITNESSED TODAY ===\n${publicLines.join("\n")}`,
    );
  }

  sections.push(buildActionsAvailableBlock(agent));

  sections.push(
    `=== DECISION ===\n` +
      `Pick ONE action. Respond ONLY with JSON in this exact shape:\n` +
      `{"action": "<NAME>", "args": {...}, "reasoning": "<one short sentence in character>"}\n` +
      `Do not include any other text. Do not explain. The "args" object must match the action's schema above.`,
  );

  return sections.join("\n\n");
}

export function computeHolyDay(day: number): string | null {
  if (day % 7 === 0) return "Christianity";
  if (day % 9 === 0) return "TrueVine";
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
    lines.push(`Day ${d}:`);
    for (const l of grouped.get(d) ?? []) {
      lines.push(`  - ${l}`);
    }
  }
  return lines.join("\n");
}

function formatMemoryLine(e: Extract<EventLogEntry, { type: "action" }>): string {
  const args = e.args ?? {};
  switch (e.action) {
    case "WORK_PLOT":
      return `You worked your plot.`;
    case "HARVEST":
      return `You harvested ${e.result?.foodGained ?? "?"} food.`;
    case "GO_TO_MARKET":
      return `You went to market: ${JSON.stringify(args)}.`;
    case "GIVE":
      return `You gave ${args.amount} ${args.resource} to ${args.to}.`;
    case "SAY":
      return `You said in public: "${String(args.text ?? "").slice(0, 100)}".`;
    case "DM":
      return `You sent DM to ${args.to}: "${String(args.text ?? "").slice(0, 100)}".`;
    case "PRAY":
      return `You prayed to ${args.deity}.`;
    case "TITHE":
      return `You tithed ${args.amount} ${args.resource} to ${args.to}.`;
    case "CONVERT":
      return `You converted to ${args.religion}.`;
    case "REST":
      return `You rested.`;
    default:
      return `(unknown action)`;
  }
}

function formatPublicEventLine(e: Extract<EventLogEntry, { type: "action" }>): string {
  const args = e.args ?? {};
  switch (e.action) {
    case "SAY":
      return `${e.actor} said publicly: "${String(args.text ?? "")}"`;
    case "TITHE":
      return `${e.actor} tithed ${args.amount} ${args.resource} to ${args.to}.`;
    case "CONVERT":
      return `${e.actor} converted to ${args.religion}.`;
    case "GO_TO_MARKET":
      return `${e.actor} went to market.`;
    case "GIVE":
      return `${e.actor} gave ${args.amount} ${args.resource} to ${args.to}.`;
    case "PRAY":
      return `${e.actor} prayed.`;
    case "HARVEST":
      return `${e.actor} harvested crops.`;
    case "WORK_PLOT":
      return `${e.actor} worked their plot.`;
    case "REST":
      return `${e.actor} rested.`;
    default:
      return `${e.actor} did ${e.action}.`;
  }
}

function buildActionsAvailableBlock(agent: AgentState): string {
  const lines = ["=== ACTIONS AVAILABLE TO YOU ==="];
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
