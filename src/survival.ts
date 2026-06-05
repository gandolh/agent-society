// Narrow survival enforcement (ADR-010 lever 1, ADR-011 context).
//
// Small models won't self-feed even when starving (the Sugarscape finding,
// confirmed in capitalism spatial run01: 0 economic actions, whole cast
// starved). So when an agent is at/over the hunger threshold, the engine
// RESTRICTS its action set to feeding-related actions. It still CHOOSES among
// them — we never dictate the specific action — which keeps ADR-003's spirit
// (no enforced outcomes) while making "do something about food" mandatory.

import type { ActionName, AgentState, WorldState } from "./types.js";

/**
 * Actions allowed while starving. The food-acquiring set, plus TRAVEL (you may
 * need to walk to the harbour/market/farm) and REST (a starving, AP-poor agent
 * may have no better option). GO_TO_MARKET lets them BUY food. In aspatial runs
 * TRAVEL/FISH/FORAGE/MILL simply won't exist, leaving WORK_PLOT/HARVEST/
 * GO_TO_MARKET/REST — still a coherent feeding set.
 */
const SURVIVAL_ACTIONS: ReadonlySet<ActionName> = new Set<ActionName>([
  "FISH",
  "FORAGE",
  "HARVEST",
  "WORK_PLOT",
  "GO_TO_MARKET",
  "SEEK_ALMS", // free food at your faith's building, if hungry
  "TRAVEL",
  "REST",
]);

/** Is survival enforcement active for this run? */
export function survivalEnforced(world: WorldState): boolean {
  return world.config.survivalHungerThreshold != null;
}

/** Is this agent hungry enough to be locked to survival actions? */
export function isStarving(world: WorldState, agent: AgentState): boolean {
  const t = world.config.survivalHungerThreshold;
  return t != null && agent.hungerDays >= t;
}

/** The action name set an agent may use right now (null = no restriction). */
export function allowedActions(world: WorldState, agent: AgentState): ReadonlySet<ActionName> | null {
  if (isStarving(world, agent)) return SURVIVAL_ACTIONS;
  return null;
}

export function isSurvivalAction(name: ActionName): boolean {
  return SURVIVAL_ACTIONS.has(name);
}
