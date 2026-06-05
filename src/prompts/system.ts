import type { AgentState, ActionName, WorldState, EventLogEntry, ZoneKind } from "../types.js";
import { publicRosterView } from "../world.js";
import { dist } from "../spatial.js";

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
  TRAVEL:
    'TRAVEL (1 AP). args: { to: "<zone id>" }. Walk toward a zone (see WHERE). Multi-day if far.',
  FISH: "FISH (1 AP). args: {}. Catch fish for food. Must be at the harbour.",
  FORAGE: "FORAGE (1 AP). args: {}. Gather wild food. Must be at a forage zone.",
  MILL: "MILL (2 AP). args: {}. Process your ready crops into gold. Must be at the mill.",
  POST_OFFER:
    'POST_OFFER (1 AP). args: { item: "food"|"seeds", qty: number, unitPrice: number }. List goods for sale on the market wall (held in escrow). At market.',
  READ_OFFERS: "READ_OFFERS (1 AP). args: {}. Check the market wall's current offers. At market.",
  BUY_FROM_WALL:
    'BUY_FROM_WALL (3 AP). args: { id: "<listing id>", qty: number }. Buy from a wall offer. At market.',
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

  const deathDays = world.config.hungerDeathDays;
  const hungerLine =
    deathDays != null
      ? `AP left: ${agent.actionPointsLeft}   Hunger: ${agent.hungerDays}d (you DIE at ${deathDays}d without food — eat to survive)`
      : `AP left: ${agent.actionPointsLeft}   Hunger: ${agent.hungerDays}d`;
  sections.push(
    [
      `=== YOUR STATE ===`,
      `Religion: ${agent.religion}`,
      `Gold: ${agent.resources.gold}  Food: ${agent.resources.food}  Stock: ${agent.resources.seeds}`,
      `Work: ${agent.plot.cropsPlanted.length} in progress, ${agent.plot.cropsReady} ready`,
      hungerLine,
    ].join("\n"),
  );

  const whereBlock = buildWhereBlock(agent, world);
  if (whereBlock) sections.push(whereBlock);

  const wallBlock = buildWallBlock(agent, world);
  if (wallBlock) sections.push(wallBlock);

  const regimeBlock = REGIME_BLOCKS[world.config.regime];
  if (regimeBlock) {
    sections.push(`=== THE CITY ===\n${regimeBlock}`);
  }

  const religionBlock = RELIGION_BLOCKS[agent.religion];
  if (religionBlock) {
    sections.push(`=== YOUR FAITH ===\n${religionBlock}`);
  }

  // Roster. In spatial runs, show full resource detail only for agents you can
  // see (within sayRadius); distant agents collapse to a name + zone line. This
  // both models information asymmetry and trims tokens.
  const spatial = world.config.spatial === true;
  const radius = world.config.sayRadius;
  const roster = publicRosterView(world)
    .filter((r) => r.slot !== agent.id)
    .map((r) => {
      if (!spatial) {
        return `${r.slot} ${r.name} (${r.religion}) — g${r.gold} f${r.food} s${r.seeds}`;
      }
      const other = world.agents[r.slot]!;
      const near = dist(other.pos, agent.pos) <= radius;
      return near
        ? `${r.slot} ${r.name} (${r.religion}) @${other.zoneId ?? "—"} — g${r.gold} f${r.food} s${r.seeds}`
        : `${r.slot} ${r.name} (${r.religion}) @${other.zoneId ?? "elsewhere"}`;
    });
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

  // Public events from earlier rounds today. In spatial runs, an event is only
  // perceptible if its actor is currently within sayRadius of this agent — so
  // SAY is local, not a global broadcast (the anti-homogenisation lever), and
  // the prompt carries fewer lines.
  const publicLines = input.publicEventsToday
    .filter((e) => {
      if (e.type !== "action" || !e.public || e.actor === agent.id) return false;
      if (!spatial) return true;
      const actor = world.agents[e.actor];
      return actor != null && dist(actor.pos, agent.pos) <= radius;
    })
    .map((e) => formatPublicEventLine(e as Extract<EventLogEntry, { type: "action" }>));
  if (publicLines.length > 0) {
    sections.push(`=== PUBLIC TODAY ===\n${publicLines.join("\n")}`);
  }

  sections.push(buildActionsAvailableBlock(agent, world));

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
    case "TRAVEL":
      return `→ ${args.to}`;
    case "FISH":
      return `fished +${e.result?.caught ?? "?"}f`;
    case "FORAGE":
      return `foraged +${e.result?.gathered ?? "?"}f`;
    case "MILL":
      return `milled +${e.result?.gold ?? "?"}g`;
    case "POST_OFFER":
      return `posted ${args.qty} ${args.item} @${args.unitPrice}g`;
    case "READ_OFFERS":
      return `read wall`;
    case "BUY_FROM_WALL":
      return `bought ${e.result?.qty ?? "?"} ${e.result?.item ?? "?"} (${e.result?.cost ?? "?"}g)`;
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
    case "TRAVEL":
      return `${e.actor} → ${args.to}`;
    case "FISH":
      return `${e.actor} fished`;
    case "FORAGE":
      return `${e.actor} foraged`;
    case "MILL":
      return `${e.actor} milled`;
    case "POST_OFFER":
      return `${e.actor} posted ${args.qty} ${args.item} @${args.unitPrice}g`;
    case "BUY_FROM_WALL":
      return `${e.actor} bought from wall`;
    default:
      return `${e.actor} ${e.action}`;
  }
}

/** Action names that only exist in a spatial world. */
const SPATIAL_ONLY: ReadonlySet<ActionName> = new Set([
  "TRAVEL",
  "FISH",
  "FORAGE",
  "MILL",
  "POST_OFFER",
  "READ_OFFERS",
  "BUY_FROM_WALL",
]);

/** Actions that require standing at a specific zone kind (spatial runs). */
const ZONE_GATED: Partial<Record<ActionName, ZoneKind>> = {
  WORK_PLOT: "farm",
  HARVEST: "farm",
  GO_TO_MARKET: "market",
  FISH: "harbour",
  FORAGE: "forage",
  MILL: "mill",
  POST_OFFER: "market",
  READ_OFFERS: "market",
  BUY_FROM_WALL: "market",
};

function buildActionsAvailableBlock(agent: AgentState, world: WorldState): string {
  const spatial = world.config.spatial === true;
  const hereKind =
    spatial && world.config.map
      ? world.config.map.zones.find((z) => z.x === agent.pos.x && z.y === agent.pos.y)?.kind
      : undefined;
  const lines = ["=== ACTIONS AVAILABLE ==="];
  for (const [name, baseDesc] of Object.entries(ACTION_DESCRIPTIONS) as Array<[ActionName, string]>) {
    if (SPATIAL_ONLY.has(name) && !spatial) continue;
    // In a spatial run, hide zone-gated actions unless the agent stands there —
    // keeps the prompt short and avoids wasted retries on actions that'd fail.
    if (spatial) {
      const need = ZONE_GATED[name];
      if (need && hereKind !== need) continue;
    }
    // SAY is heard only nearby in spatial runs.
    const desc =
      spatial && name === "SAY"
        ? "SAY (1 AP). args: { text: string }. Speak aloud — only people near you (see WHERE) hear it."
        : baseDesc;
    const cost = parseFirstNumber(desc);
    if (cost === null || agent.actionPointsLeft >= cost || name === "REST") {
      lines.push(desc);
    }
  }
  return lines.join("\n");
}

/**
 * Compact "where you are" block (spatial runs only). Token-minimal: shows the
 * current zone, who is co-located (within sayRadius), and the travel targets as
 * `id:kind` pairs. Coordinates are never shown.
 */
function buildWhereBlock(agent: AgentState, world: WorldState): string | null {
  const map = world.config.map;
  if (!world.config.spatial || !map) return null;
  const here = map.zones.find((z) => z.x === agent.pos.x && z.y === agent.pos.y);
  const radius = world.config.sayRadius;
  const near = Object.values(world.agents)
    .filter(
      (a) =>
        a.alive &&
        a.id !== agent.id &&
        Math.max(Math.abs(a.pos.x - agent.pos.x), Math.abs(a.pos.y - agent.pos.y)) <= radius,
    )
    .map((a) => a.id);
  const destinations = map.zones
    .filter((z) => z.kind !== "ocean" && z.id !== here?.id)
    .map((z) => `${z.id}:${z.kind}`)
    .join(", ");
  const lines = [
    `=== WHERE ===`,
    `You are at: ${here ? `${here.id} (${here.kind})` : "open ground"}.`,
    `Nearby (can hear you): ${near.length ? near.join(", ") : "no one"}.`,
    `Travel to: ${destinations}`,
  ];
  return lines.join("\n");
}

/**
 * Market-wall offers — shown only when the agent is standing at the market, so
 * the listings (with ids to BUY_FROM_WALL) don't bloat every other prompt.
 */
function buildWallBlock(agent: AgentState, world: WorldState): string | null {
  const map = world.config.map;
  if (!world.config.spatial || !map) return null;
  const here = map.zones.find((z) => z.x === agent.pos.x && z.y === agent.pos.y);
  if (here?.kind !== "market") return null;
  if (world.wall.length === 0) {
    return `=== MARKET WALL ===\n(no offers posted)`;
  }
  const rows = world.wall
    .map((l) => `${l.id}: ${l.qty} ${l.item} @ ${l.unitPrice}g/ea${l.seller === agent.id ? " (yours)" : ` from ${l.seller}`}`)
    .join("\n");
  return `=== MARKET WALL ===\n${rows}`;
}

function parseFirstNumber(s: string): number | null {
  const m = s.match(/\((\d+) AP/);
  return m && m[1] ? parseInt(m[1], 10) : null;
}
