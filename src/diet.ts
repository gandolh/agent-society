// Diet-variety mechanic. A balanced diet keeps an agent full; eating the same
// food type day after day only partially satisfies, so monotony slowly starves
// you. This is what breaks fishing dominance: a pure-fisher's meals pall, and
// they must acquire crops/forage/bought food (or trade) to stay fed.

import type { AgentState, FoodStock, FoodType, WorldState } from "./types.js";

export const FOOD_TYPES: FoodType[] = ["fish", "crop", "forage", "other"];

export function emptyFoodStock(): FoodStock {
  return { fish: 0, crop: 0, forage: 0, other: 0 };
}

/** Add `n` food of a given provenance to an agent (also bumps fungible food). */
export function addFood(agent: AgentState, type: FoodType, n: number): void {
  agent.foodStock[type] += n;
  agent.resources.food += n;
}

/**
 * Remove `n` fungible food from an agent (market SELL/GIVE/TITHE), drawing down
 * the typed stock proportionally so the two stay roughly consistent. Used by
 * non-eating outflows; eating uses eatBestMeal.
 */
export function removeFood(agent: AgentState, n: number): void {
  let left = n;
  for (const t of FOOD_TYPES) {
    if (left <= 0) break;
    const take = Math.min(agent.foodStock[t], left);
    agent.foodStock[t] -= take;
    left -= take;
  }
  agent.resources.food = Math.max(0, agent.resources.food - n);
}

/**
 * Eat one unit at night. Picks the food type that best varies the recent diet
 * (a type NOT eaten recently), eats it, and returns the resulting hunger:
 *   - fresh variety  → hunger 0 (fully satisfied)
 *   - monotonous     → hunger = monotonyHungerFloor (ate, but unsatisfied)
 * Returns null if the agent has no food at all (caller increments hunger).
 */
export function eatBestMeal(
  world: WorldState,
  agent: AgentState,
): { type: FoodType; satisfied: boolean } | null {
  if (agent.resources.food < 1) return null;
  const window = agent.recentMeals.slice(-world.config.dietWindowDays);

  // Prefer an available type that is NOT in the recent window (maximise variety).
  const available = FOOD_TYPES.filter((t) => agent.foodStock[t] > 0);
  const fresh = available.find((t) => !window.includes(t));
  const chosen = fresh ?? available[0]!; // fall back to whatever is on hand

  agent.foodStock[chosen] -= 1;
  agent.resources.food -= 1;
  agent.recentMeals.push(chosen);
  if (agent.recentMeals.length > world.config.dietWindowDays) {
    agent.recentMeals.shift();
  }

  // Satisfied if the chosen type is fresh relative to the (pre-meal) window.
  const satisfied = !window.includes(chosen) || window.length === 0;
  return { type: chosen, satisfied };
}
