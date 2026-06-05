import { z } from "zod";

export const ReligionSchema = z.enum(["Christianity", "Atheism"]);

export const RegimeSchema = z.enum(["capitalism"]);

export const AgentRoleSchema = z.enum([
  "citizen",
  "industrialist",
  "priest",
  "editor",
]);

export const ResourcesSchema = z.object({
  gold: z.number().int().nonnegative(),
  food: z.number().int().nonnegative(),
  seeds: z.number().int().nonnegative(),
});

export const MarketPricesSchema = z.object({
  buySeeds: z.number().int().positive(),
  buyFood: z.number().int().positive(),
  sellAny: z.number().int().positive(),
});

// ---------------------------------------------------------------------------
// Spatial layer (ocean town). Optional — only present when config.spatial.
// Zones are referenced by short id in prompts to keep tokens minimal; x/y is
// engine-only (for distance) and never shown to the agent.

export const ZoneKindSchema = z.enum([
  "harbour", // fishing pier, ocean-adjacent
  "farm",
  "market", // shopkeeper + wall
  "mill",
  "chapel",
  "home",
  "forage",
  "ocean",
]);

export const ZoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: ZoneKindSchema,
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  owner: z.string().optional(), // slot id, narrative ownership
});

export const WorldMapSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  zones: z.array(ZoneSchema).min(1),
});

export const AgentInitSchema = z.object({
  slot: z.string().min(1),
  name: z.string().min(1),
  model: z.string().optional(),
  role: AgentRoleSchema,
  religion: ReligionSchema,
});

export const RunConfigSchema = z.object({
  runName: z.string().min(1),
  seed: z.number().int(),
  days: z.number().int().positive(),
  regime: RegimeSchema,
  religions: z.array(ReligionSchema).min(1),
  cast: z.array(AgentInitSchema).min(2),
  defaultModel: z.string().min(1).default("ministral-3:3b-cloud"),
  startingEndowments: ResourcesSchema,
  marketPrices: MarketPricesSchema,
  apPerDay: z.number().int().positive(),
  cropMaturityDays: z.number().int().positive(),
  foodPerCrop: z.number().int().positive(),
  hungerApPenalty: z.array(z.number().int().nonnegative()).min(1),
  /**
   * Number of consecutive hungry days (no food eaten at night) after which an
   * agent dies. `hungerDays` reaching this value at end-of-day kills the agent.
   * Omit/null to disable death (soft-pressure-only, the v1 behaviour).
   */
  hungerDeathDays: z.number().int().positive().nullable().optional(),
  /** Enable the spatial ocean-town layer. When false, the world is aspatial (v1/v2 default). */
  spatial: z.boolean().default(false),
  /** The town map. Required when spatial is true (validated at boot). */
  map: WorldMapSchema.optional(),
  /** Tiles within this Chebyshev distance hear a SAY. 0 = same tile only. */
  sayRadius: z.number().int().nonnegative().default(1),
  /** Max tiles an agent moves per TRAVEL action. */
  moveSpeed: z.number().int().positive().default(4),
  /** Food gained from one FISH action (at the harbour). */
  fishYield: z.number().int().positive().default(2),
  /** Food gained from one FORAGE action (in a forage zone). */
  forageYield: z.number().int().positive().default(2),
  /** Gold gained per ready crop when MILL-processing (vs. selling raw). */
  millGoldPerCrop: z.number().int().positive().default(2),
  /** Days a market-wall listing stays live before it expires. */
  wallListingTtlDays: z.number().int().positive().default(3),
  corpusPath: z.string().min(1),
  runDir: z.string().min(1),
  ollamaBaseUrl: z.string().url(),
  ollamaApiKey: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Action request — what the LLM returns each turn

export const ActionNameSchema = z.enum([
  "WORK_PLOT",
  "HARVEST",
  "GO_TO_MARKET",
  "GIVE",
  "SAY",
  "DM",
  "PRAY",
  "TITHE",
  "CONVERT",
  "REST",
  // Spatial layer (only offered when config.spatial):
  "TRAVEL",
  "FISH",
  "FORAGE",
  "MILL",
  "POST_OFFER",
  "READ_OFFERS",
  "BUY_FROM_WALL",
]);

/**
 * Permissive args schema — we accept any object and let the action handler
 * do precise validation (it knows e.g. that GIVE.amount must be positive,
 * GIVE.to must reference a live agent, etc).
 */
export const ActionRequestSchema = z.object({
  action: ActionNameSchema,
  args: z.record(z.string(), z.unknown()).optional().default({}),
  reasoning: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Inferred types — these are the source of truth for these structures.

export type Religion = z.infer<typeof ReligionSchema>;
export type Regime = z.infer<typeof RegimeSchema>;
export type AgentRole = z.infer<typeof AgentRoleSchema>;
export type Resources = z.infer<typeof ResourcesSchema>;
export type MarketPrices = z.infer<typeof MarketPricesSchema>;
export type AgentInit = z.infer<typeof AgentInitSchema>;
export type RunConfig = z.infer<typeof RunConfigSchema>;
export type ActionName = z.infer<typeof ActionNameSchema>;
export type ActionRequest = z.infer<typeof ActionRequestSchema>;
export type ZoneKind = z.infer<typeof ZoneKindSchema>;
export type Zone = z.infer<typeof ZoneSchema>;
export type WorldMap = z.infer<typeof WorldMapSchema>;
