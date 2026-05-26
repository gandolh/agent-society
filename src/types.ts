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
} from "./schemas.js";

import type { ActionName, AgentRole, Religion, Resources, RunConfig } from "./schemas.js";

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
  hungerDays: number;
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

export type WorldState = {
  day: number;
  agents: Record<string, AgentState>;
  config: RunConfig;
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
