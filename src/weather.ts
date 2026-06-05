// Daily weather — a seeded, reproducible world dynamic that couples to the food
// economy. Drawn fresh each day from seed+day so a run replays identically.

import { makeRng } from "./rng.js";
import type { Weather, WorldState, ActionName } from "./types.js";

// Rough daily distribution (cumulative). Clear is common; storm/drought rare.
const WEATHER_CDF: Array<[Weather, number]> = [
  ["clear", 0.55],
  ["rain", 0.8],
  ["storm", 0.92],
  ["drought", 1.0],
];

/** Deterministically roll the day's weather from the run seed + day number. */
export function rollWeather(seed: number, day: number): Weather {
  const r = makeRng(seed * 1000 + day)();
  for (const [w, cum] of WEATHER_CDF) {
    if (r <= cum) return w;
  }
  return "clear";
}

/** One-line description shown to agents in the TODAY block. */
export function weatherBlurb(w: Weather): string {
  switch (w) {
    case "clear":
      return "Clear skies — good for fishing.";
    case "rain":
      return "Rain — crops and foraging thrive; fishing is fine.";
    case "storm":
      return "STORM — the sea is too dangerous to fish today.";
    case "drought":
      return "Drought — the fields are parched; crops grow poorly.";
  }
}

/**
 * Multiplier applied to a food action's yield given the current weather.
 * Returns 0 to mean "blocked" (e.g. fishing in a storm). Non-food actions and
 * weather-off runs return 1.
 */
export function weatherYieldFactor(world: WorldState, action: ActionName): number {
  if (!world.config.weather) return 1;
  const w = world.weather;
  switch (action) {
    case "FISH":
      if (w === "storm") return 0; // seas closed
      if (w === "rain") return 1;
      return 1;
    case "FORAGE":
      if (w === "rain") return 1.5;
      if (w === "drought") return 0.5;
      return 1;
    case "HARVEST":
      // Harvest yield reflects the weather while growing; rain helped, drought hurt.
      if (w === "rain") return 1.5;
      if (w === "drought") return 0.5;
      return 1;
    default:
      return 1;
  }
}
