// Spatial helpers for the ocean-town layer. Pure functions over the map.
// Movement is on a grid, but agents only ever SEE zone names/ids in their
// prompt (coordinates are engine-only) to keep per-turn tokens minimal.

import type { Pos, WorldMap, Zone, WorldState, AgentState } from "./types.js";

/** Chebyshev (king-move) distance — diagonal counts as 1. */
export function dist(a: Pos, b: Pos): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export function zoneById(map: WorldMap, id: string): Zone | undefined {
  return map.zones.find((z) => z.id === id);
}

/** The zone whose footprint contains pos, if any (zones are single tiles in v1). */
export function zoneAt(map: WorldMap, pos: Pos): Zone | undefined {
  return map.zones.find((z) => z.x === pos.x && z.y === pos.y);
}

/** Step `pos` up to `speed` tiles toward `target` (Chebyshev steps). Returns the new pos. */
export function stepToward(pos: Pos, target: Pos, speed: number): Pos {
  let { x, y } = pos;
  for (let i = 0; i < speed; i++) {
    if (x === target.x && y === target.y) break;
    if (x < target.x) x++;
    else if (x > target.x) x--;
    if (y < target.y) y++;
    else if (y > target.y) y--;
  }
  return { x, y };
}

/** Agents (living, excluding self) within `radius` of `pos`. */
export function agentsWithin(
  world: WorldState,
  pos: Pos,
  radius: number,
  excludeId?: string,
): AgentState[] {
  return Object.values(world.agents).filter(
    (a) => a.alive && a.id !== excludeId && dist(a.pos, pos) <= radius,
  );
}

/** Is this agent close enough to act at a zone of the given kind right now? */
export function atZoneKind(world: WorldState, agent: AgentState, kind: Zone["kind"]): boolean {
  if (!world.config.map) return false;
  const z = zoneAt(world.config.map, agent.pos);
  return z?.kind === kind;
}
