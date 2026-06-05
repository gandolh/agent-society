// Single source of truth for "which action verbs may this agent use right now".
// Used by BOTH the prompt's ACTIONS AVAILABLE block and the grammar-constrained
// JSON schema (so the model literally cannot pick an ineligible verb).

import type { ActionName, AgentState, WorldState, ZoneKind } from "./types.js";
import { allowedActions } from "./survival.js";

/** AP cost per action (REST is free; everything else is its handler's cost). */
export const ACTION_AP_COST: Record<ActionName, number> = {
  WORK_PLOT: 1,
  HARVEST: 1,
  GO_TO_MARKET: 2,
  GIVE: 1,
  SAY: 1,
  DM: 1,
  PRAY: 1,
  TITHE: 1,
  CONVERT: 2,
  REST: 0,
  TRAVEL: 1,
  FISH: 1,
  FORAGE: 1,
  MILL: 2,
  POST_OFFER: 1,
  READ_OFFERS: 1,
  BUY_FROM_WALL: 3,
  SEEK_ALMS: 1,
  SELL_FISH: 1,
};

/** Verbs that only exist in a spatial world. */
export const SPATIAL_ONLY: ReadonlySet<ActionName> = new Set<ActionName>([
  "TRAVEL",
  "FISH",
  "FORAGE",
  "MILL",
  "POST_OFFER",
  "READ_OFFERS",
  "BUY_FROM_WALL",
  "SEEK_ALMS",
  "SELL_FISH",
]);

/** Verbs that require standing at a specific zone kind (spatial runs). */
export const ZONE_GATED: Partial<Record<ActionName, ZoneKind>> = {
  WORK_PLOT: "farm",
  HARVEST: "farm",
  GO_TO_MARKET: "market",
  FISH: "harbour",
  FORAGE: "forage",
  MILL: "mill",
  POST_OFFER: "market",
  READ_OFFERS: "market",
  BUY_FROM_WALL: "market",
  SEEK_ALMS: "chapel",
  SELL_FISH: "harbour",
};

const ALL_ACTIONS = Object.keys(ACTION_AP_COST) as ActionName[];

/**
 * Count this agent's most recent consecutive same-action streak (today), to
 * support anti-repeat suppression. Looks at trailing recentEvents for this day.
 */
export function trailingActionStreak(agent: AgentState, today: number): { action: ActionName | null; count: number } {
  let action: ActionName | null = null;
  let count = 0;
  for (let i = agent.recentEvents.length - 1; i >= 0; i--) {
    const e = agent.recentEvents[i]!;
    if (e.type !== "action" || e.day !== today || e.actor !== agent.id) break;
    if (action === null) action = e.action;
    if (e.action !== action) break;
    count++;
  }
  return { action, count };
}

/**
 * The verbs an agent may take this turn, after applying: spatial availability,
 * zone gating, AP affordability, survival lock, and anti-repeat suppression.
 * REST is always included as a fallback. This is the canonical eligible set.
 */
export function availableActions(agent: AgentState, world: WorldState): ActionName[] {
  const spatial = world.config.spatial === true;
  const hereKind =
    spatial && world.config.map
      ? world.config.map.zones.find((z) => z.x === agent.pos.x && z.y === agent.pos.y)?.kind
      : undefined;
  const survival = allowedActions(world, agent); // null = unrestricted
  // Anti-repeat: if the agent has chosen the same talk action 2+ times in a row
  // today, suppress it this turn (it must vary). Only applies to SAY/DM/PRAY.
  const streak = trailingActionStreak(agent, world.day);
  const suppressRepeat =
    streak.action != null &&
    streak.count >= 2 &&
    (streak.action === "SAY" || streak.action === "DM" || streak.action === "PRAY")
      ? streak.action
      : null;

  const out: ActionName[] = [];
  for (const name of ALL_ACTIONS) {
    if (SPATIAL_ONLY.has(name) && !spatial) continue;
    if (survival && !survival.has(name)) continue;
    if (spatial) {
      const need = ZONE_GATED[name];
      if (need && hereKind !== need) continue;
    }
    if (name === suppressRepeat) continue;
    const cost = ACTION_AP_COST[name];
    if (name === "REST" || agent.actionPointsLeft >= cost) {
      out.push(name);
    }
  }
  // Safety net: REST must always be choosable.
  if (!out.includes("REST")) out.push("REST");
  return out;
}
