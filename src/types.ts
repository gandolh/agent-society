// Boundary types (config, action requests, enums) come from Zod schemas.
// Engine-internal types (world/agent state, event log) stay as plain TS
// because they describe mutable runtime state.

export {
  ReligionSchema,
  RegimeSchema,
  AgentRoleSchema,
  ResourcesSchema,
  MarketPricesSchema,
  AgentInitSchema,
  RunConfigSchema,
  ActionNameSchema,
  ActionRequestSchema,
  ZoneKindSchema,
  ZoneSchema,
  WorldMapSchema,
} from "./schemas.js";
export type {
  Religion,
  Regime,
  AgentRole,
  Resources,
  MarketPrices,
  AgentInit,
  RunConfig,
  ActionName,
  ActionRequest,
  ZoneKind,
  Zone,
  WorldMap,
} from "./schemas.js";

import type { ActionName, AgentRole, Religion, Resources, RunConfig } from "./schemas.js";

export type Pos = { x: number; y: number };

export type PlantedCrop = {
  plantedDay: number;
};

export type Plot = {
  cropsPlanted: PlantedCrop[];
  cropsReady: number;
};

export type UnreadDm = {
  fromId: string;
  day: number;
  text: string;
};

export type AgentState = {
  id: string;
  name: string;
  model: string;
  role: AgentRole;
  isResearchSubject: boolean;
  coreIdentity: string;
  currentState: string;
  religion: Religion;
  resources: Resources;
  actionPointsLeft: number;
  plot: Plot;
  /** Grid position. Present only in spatial runs (otherwise {0,0}, unused). */
  pos: Pos;
  /** Id of the zone the agent currently stands in, if any. Spatial runs only. */
  zoneId?: string;
  hungerDays: number;
  /** False once the agent has died of hunger. Dead agents take no turns. */
  alive: boolean;
  /** The day the agent died, if dead. */
  diedOnDay?: number;
  unreadDms: UnreadDm[];
  recentEvents: EventLogEntry[];
  restedToday: boolean;
};

export type ActionResult = {
  ok: boolean;
  error?: string;
  apCost: number;
  result?: Record<string, unknown>;
  publicEvent?: boolean;
};

/** A standing offer on the market wall (spatial economy, Stage 4). */
export type WallListing = {
  id: string;
  seller: string; // slot id
  item: "food" | "seeds";
  qty: number;
  unitPrice: number; // gold per unit
  postedDay: number;
};

export type WorldState = {
  day: number;
  agents: Record<string, AgentState>;
  config: RunConfig;
  /** Market-wall listings (spatial runs). Engine-tracked; expire after N days. */
  wall: WallListing[];
  /** Monotonic counter for listing ids (deterministic). */
  nextListingId: number;
};

export type AgentSnapshot = {
  gold: number;
  food: number;
  seeds: number;
  hunger: number;
  religion: Religion;
};

export type EventLogEntry =
  | {
      type: "action";
      day: number;
      round: number;
      actor: string;
      model: string;
      action: ActionName;
      ap_cost: number;
      args: Record<string, unknown>;
      result?: Record<string, unknown>;
      public: boolean;
      reasoning?: string;
    }
  | {
      type: "reflection";
      day: number;
      actor: string;
      trigger: "weekly" | "event-triggered";
      week?: number;
      cause?: string;
      prev_state: string;
      new_state: string;
    }
  | {
      type: "day_end";
      day: number;
      state: Record<string, AgentSnapshot>;
    }
  | {
      type: "world_event";
      day: number;
      kind: string;
      details: Record<string, unknown>;
    };

export type ActionHandler = (
  world: WorldState,
  actor: AgentState,
  args: Record<string, unknown>,
) => ActionResult;
