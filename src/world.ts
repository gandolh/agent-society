import type {
  AgentInit,
  AgentSnapshot,
  AgentState,
  Plot,
  RunConfig,
  WorldState,
} from "./types.js";
import { loadPersona } from "./personas.js";

export async function initializeWorld(config: RunConfig): Promise<WorldState> {
  const agents: Record<string, AgentState> = {};
  for (const init of config.cast) {
    agents[init.slot] = await initializeAgent(init, config);
  }
  return { day: 1, agents, config, wall: [], nextListingId: 1 };
}

async function initializeAgent(init: AgentInit, config: RunConfig): Promise<AgentState> {
  const persona = await loadPersona(config.corpusPath, init.slot, init.name);
  // Spatial start: stand at the agent's home zone if one is declared for them,
  // else the first zone. Aspatial runs use {0,0} (never read).
  let pos = { x: 0, y: 0 };
  let zoneId: string | undefined;
  if (config.spatial && config.map) {
    const home =
      config.map.zones.find((z) => z.kind === "home" && z.owner === init.slot) ??
      config.map.zones.find((z) => z.owner === init.slot) ??
      config.map.zones[0];
    if (home) {
      pos = { x: home.x, y: home.y };
      zoneId = home.id;
    }
  }
  return {
    id: init.slot,
    name: init.name,
    model: init.model ?? config.defaultModel,
    role: init.role,
    isResearchSubject: init.role === "citizen",
    coreIdentity: persona.coreIdentity,
    currentState: persona.initialCurrentState,
    religion: init.religion,
    resources: { ...config.startingEndowments },
    actionPointsLeft: config.apPerDay,
    plot: { cropsPlanted: [], cropsReady: 0 },
    pos,
    zoneId,
    hungerDays: 0,
    alive: true,
    unreadDms: [],
    recentEvents: [],
    restedToday: false,
  };
}

/** Refresh AP and reset per-day flags at start of day. Dead agents are skipped. */
export function startDay(world: WorldState): void {
  for (const agent of Object.values(world.agents)) {
    if (!agent.alive) {
      agent.actionPointsLeft = 0;
      agent.restedToday = true;
      continue;
    }
    const penalty = world.config.hungerApPenalty;
    const idx = Math.min(agent.hungerDays, penalty.length - 1);
    agent.actionPointsLeft = penalty[idx] ?? world.config.apPerDay;
    agent.restedToday = false;
  }
}

/**
 * End-of-day food consumption, hunger tick, crop maturation, and death.
 * Returns the agents that died of hunger this day (newly dead), so the caller
 * can log it.
 */
export function endDay(world: WorldState): AgentState[] {
  const { day, config } = world;
  const newlyDead: AgentState[] = [];
  for (const agent of Object.values(world.agents)) {
    if (!agent.alive) continue;
    // Eat one food if possible.
    if (agent.resources.food >= 1) {
      agent.resources.food -= 1;
      agent.hungerDays = 0;
    } else {
      agent.hungerDays += 1;
    }
    // Death from hunger, if enabled.
    const deathDays = config.hungerDeathDays;
    if (deathDays != null && agent.hungerDays >= deathDays) {
      agent.alive = false;
      agent.diedOnDay = day;
      agent.actionPointsLeft = 0;
      agent.restedToday = true;
      newlyDead.push(agent);
      continue; // no crop maturation for the dead
    }
    // Mature crops.
    const stillPlanted: typeof agent.plot.cropsPlanted = [];
    for (const crop of agent.plot.cropsPlanted) {
      if (day >= crop.plantedDay + config.cropMaturityDays) {
        agent.plot.cropsReady += 1;
      } else {
        stillPlanted.push(crop);
      }
    }
    agent.plot.cropsPlanted = stillPlanted;
  }
  expireWallListings(world);
  return newlyDead;
}

/** Refund escrowed goods for market-wall listings older than the TTL. */
function expireWallListings(world: WorldState): void {
  if (!world.config.spatial || world.wall.length === 0) return;
  const ttl = world.config.wallListingTtlDays;
  const kept: typeof world.wall = [];
  for (const l of world.wall) {
    if (world.day - l.postedDay >= ttl) {
      // Expired: return escrowed goods to the (living) seller.
      const seller = world.agents[l.seller];
      if (seller?.alive) seller.resources[l.item] += l.qty;
    } else {
      kept.push(l);
    }
  }
  world.wall = kept;
}

/**
 * Wealth tallies for the day: total gold per individual and per social group.
 * Groups are by faction — religion (Christianity/Atheism) and class (owner vs
 * worker, where "owner" = the industrialist role). Pure aggregation over living
 * agents; no new state. Used for the daily wealth event/line (Stage 5).
 */
export function computeWealth(world: WorldState): {
  individual: Record<string, number>;
  byReligion: Record<string, number>;
  byClass: Record<string, number>;
} {
  const individual: Record<string, number> = {};
  const byReligion: Record<string, number> = {};
  const byClass: Record<string, number> = {};
  for (const a of Object.values(world.agents)) {
    if (!a.alive) continue;
    const g = a.resources.gold;
    individual[a.id] = g;
    byReligion[a.religion] = (byReligion[a.religion] ?? 0) + g;
    const klass = a.role === "industrialist" ? "owner" : "worker";
    byClass[klass] = (byClass[klass] ?? 0) + g;
  }
  return { individual, byReligion, byClass };
}

export function snapshotAgents(world: WorldState): Record<string, AgentSnapshot> {
  const out: Record<string, AgentSnapshot> = {};
  for (const a of Object.values(world.agents)) {
    out[a.id] = {
      gold: a.resources.gold,
      food: a.resources.food,
      seeds: a.resources.seeds,
      hunger: a.hungerDays,
      religion: a.religion,
    };
  }
  return out;
}

export function publicRosterView(world: WorldState): Array<{
  slot: string;
  name: string;
  role: string;
  religion: string;
  gold: number;
  food: number;
  seeds: number;
  cropsPlanted: number;
  cropsReady: number;
}> {
  return Object.values(world.agents)
    .filter((a) => a.alive)
    .map((a) => ({
      slot: a.id,
      name: a.name,
      role: a.role,
      religion: a.religion,
      gold: a.resources.gold,
      food: a.resources.food,
      seeds: a.resources.seeds,
      cropsPlanted: a.plot.cropsPlanted.length,
      cropsReady: a.plot.cropsReady,
    }));
}

export function emptyPlot(): Plot {
  return { cropsPlanted: [], cropsReady: 0 };
}
