import type { AgentState, ActionName, WorldState, EventLogEntry } from "../types.js";
import { publicRosterView } from "../world.js";
import { dist, zoneAt, nearestFoodZone } from "../spatial.js";
import { fishPrice } from "../world.js";
import { allowedActions } from "../survival.js";
import { availableActions } from "../actionsAvailable.js";
import { weatherBlurb } from "../weather.js";

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
  SEEK_ALMS:
    'SEEK_ALMS (1 AP). args: { convertIntent?: true }. At a religious building, if hungry and of that faith (or set convertIntent:true to join), receive free food from its charity. At the chapel.',
  SELL_FISH:
    "SELL_FISH (1 AP). args: { qty: number }. Sell fish to the harbour fishmonger for gold. Price FALLS as more fish are sold today — don't dump a glut.",
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
  const weatherLine = world.config.weather ? `\nWeather: ${weatherBlurb(world.weather)}` : "";
  sections.push(
    `=== TODAY ===\nDay ${world.day}. Holy day: ${holyDay ?? "none"}.${weatherLine}`,
  );

  const deathDays = world.config.hungerDeathDays;
  const hungerLine =
    deathDays != null
      ? `AP left: ${agent.actionPointsLeft}   Hunger: ${agent.hungerDays}d (you DIE at ${deathDays}d without food — eat to survive)`
      : `AP left: ${agent.actionPointsLeft}   Hunger: ${agent.hungerDays}d`;
  const stateLines = [
    `=== YOUR STATE ===`,
    `Religion: ${agent.religion}`,
    `Gold: ${agent.resources.gold}  Food: ${agent.resources.food}  Stock: ${agent.resources.seeds}`,
    `Work: ${agent.plot.cropsPlanted.length} in progress, ${agent.plot.cropsReady} ready`,
    hungerLine,
  ];
  if (world.config.dietVariety) {
    const fs = agent.foodStock;
    stateLines.push(
      `Diet: you hold fish ${fs.fish}, crops ${fs.crop}, foraged ${fs.forage}, other ${fs.other}. Recent meals: ${agent.recentMeals.join(",") || "none"}. Eating the SAME food repeatedly leaves you hungry — eat a VARIED diet (mix fish/crops/foraged/bought).`,
    );
  }
  sections.push(stateLines.join("\n"));

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

  const memoryLines = formatMemory(agent.recentEvents, world.day, world.config.memoryFullDays);
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

/**
 * Recency-weighted memory. The last `fullDays` days are rendered verbatim
 * (every event line); older days within the 7-day window are compressed to a
 * one-line salient summary. This makes recent context more relevant than old
 * context AND cuts tokens — important on a budget-locked small model.
 */
function formatMemory(events: EventLogEntry[], today: number, fullDays: number): string {
  const grouped = new Map<number, Array<Extract<EventLogEntry, { type: "action" }>>>();
  for (const e of events) {
    if (e.type !== "action") continue;
    if (today - e.day > 7) continue;
    const arr = grouped.get(e.day) ?? [];
    arr.push(e);
    grouped.set(e.day, arr);
  }
  const days = Array.from(grouped.keys()).sort((a, b) => a - b);
  const lines: string[] = [];
  for (const d of days) {
    const evs = grouped.get(d) ?? [];
    if (today - d < fullDays) {
      // Recent: full detail, one line per event.
      lines.push(`d${d}: ${evs.map(formatMemoryLine).join("; ")}`);
    } else {
      // Older: compressed to a salient one-line summary.
      lines.push(`d${d} (earlier): ${compressDay(evs)}`);
    }
  }
  return lines.join("\n");
}

/**
 * One-line summary of an older day: keep salient events (conversions, transfers,
 * trades, milestones) verbatim-ish; collapse routine chatter/movement to counts.
 */
function compressDay(evs: Array<Extract<EventLogEntry, { type: "action" }>>): string {
  const salient: string[] = [];
  const counts: Record<string, number> = {};
  for (const e of evs) {
    switch (e.action) {
      case "CONVERT":
        salient.push(`converted → ${e.args?.religion}`);
        break;
      case "TITHE":
        salient.push(`tithed ${e.args?.amount} ${e.args?.resource} → ${e.args?.to}`);
        break;
      case "GIVE":
        salient.push(`gave ${e.args?.amount} ${e.args?.resource} → ${e.args?.to}`);
        break;
      case "BUY_FROM_WALL":
        salient.push(`bought ${e.result?.qty ?? "?"} ${e.result?.item ?? "?"}`);
        break;
      case "HARVEST":
        salient.push(`harvested ${e.result?.foodGained ?? "?"}f`);
        break;
      case "MILL":
        salient.push(`milled +${e.result?.gold ?? "?"}g`);
        break;
      default:
        counts[e.action] = (counts[e.action] ?? 0) + 1;
    }
  }
  const countStr = Object.entries(counts)
    .map(([a, n]) => (n > 1 ? `${n}×${a.toLowerCase()}` : a.toLowerCase()))
    .join(", ");
  return [salient.join("; "), countStr].filter(Boolean).join("; ") || "quiet";
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
    case "SEEK_ALMS":
      return `alms +${e.result?.given ?? "?"}f${e.result?.converted ? " (converted)" : ""}`;
    case "SELL_FISH":
      return `sold ${e.result?.qty ?? "?"} fish +${e.result?.earnings ?? "?"}g`;
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
    case "SEEK_ALMS":
      return `${e.actor} received alms${e.result?.converted ? " and converted" : ""}`;
    case "SELL_FISH":
      return `${e.actor} sold ${e.result?.qty ?? "?"} fish`;
    default:
      return `${e.actor} ${e.action}`;
  }
}

function buildActionsAvailableBlock(agent: AgentState, world: WorldState): string {
  const spatial = world.config.spatial === true;
  // Use the SAME eligible-verb set the grammar schema uses, so the prompt and
  // the enforced enum can never disagree.
  const verbs = new Set(availableActions(agent, world));
  const survival = allowedActions(world, agent);
  const lines: string[] = [];
  if (survival) {
    lines.push(`=== URGENT: YOU ARE STARVING (${agent.hungerDays} days) ===`);
    // Destination-aware guidance: tell the agent WHERE the food is, because
    // small models won't plan this (run03: starved oscillating between non-food
    // zones). If already at a food zone, command the food action here.
    const map = world.config.map;
    const hereKind = spatial && map ? zoneAt(map, agent.pos)?.kind : undefined;
    const atFood = hereKind === "harbour" || hereKind === "farm" || hereKind === "forage" || hereKind === "market";
    if (spatial && map && !atFood) {
      const food = nearestFoodZone(map, agent.pos);
      if (food) {
        lines.push(
          `You will DIE soon. The nearest food is ${food.zone.id} (${food.zone.kind}, ${food.dist} tiles away). TRAVEL there now (args:{"to":"${food.zone.id}"}), then get food. Do NOT go anywhere else.`,
        );
      } else {
        lines.push(`You will DIE soon if you do not eat. Travel to a food zone and eat. Choose ONE:`);
      }
    } else if (spatial && atFood) {
      lines.push(`You will DIE soon. You are AT a food source — get food NOW (fish/forage/harvest/work/buy). Choose the food action:`);
    } else {
      lines.push(`You will DIE soon if you do not eat. You may ONLY get food (fish/forage/harvest/work/market) or rest. Choose ONE:`);
    }
  } else {
    lines.push("=== ACTIONS AVAILABLE (you may ONLY choose from these) ===");
  }
  for (const [name, baseDesc] of Object.entries(ACTION_DESCRIPTIONS) as Array<[ActionName, string]>) {
    if (!verbs.has(name)) continue;
    // SAY is heard only nearby in spatial runs.
    const desc =
      spatial && name === "SAY"
        ? "SAY (1 AP). args: { text: string }. Speak aloud — only people near you (see WHERE) hear it."
        : baseDesc;
    lines.push(desc);
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
  // At the harbour, show the fishmonger's current (supply-dependent) buy price.
  if (here?.kind === "harbour") {
    lines.push(`Fishmonger buys fish at ${fishPrice(world)}g each right now (falls as more are sold today).`);
  }
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

