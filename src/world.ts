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
  return { day: 1, agents, config };
}

async function initializeAgent(init: AgentInit, config: RunConfig): Promise<AgentState> {
  const persona = await loadPersona(config.corpusPath, init.slot, init.name);
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
    hungerDays: 0,
    unreadDms: [],
    recentEvents: [],
    restedToday: false,
  };
}

/** Refresh AP and reset per-day flags at start of day. */
export function startDay(world: WorldState): void {
  for (const agent of Object.values(world.agents)) {
    const penalty = world.config.hungerApPenalty;
    const idx = Math.min(agent.hungerDays, penalty.length - 1);
    agent.actionPointsLeft = penalty[idx] ?? world.config.apPerDay;
    agent.restedToday = false;
  }
}

/** End-of-day food consumption, hunger tick, crop maturation. */
export function endDay(world: WorldState): void {
  const { day, config } = world;
  for (const agent of Object.values(world.agents)) {
    // Eat one food if possible.
    if (agent.resources.food >= 1) {
      agent.resources.food -= 1;
      agent.hungerDays = 0;
    } else {
      agent.hungerDays += 1;
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
  return Object.values(world.agents).map((a) => ({
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
