import { z } from "zod";

export const ReligionSchema = z.enum(["Christianity", "Atheism"]);

export const RegimeSchema = z.enum(["capitalism"]);

export const WeatherSchema = z.enum(["clear", "rain", "storm", "drought"]);

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
  /**
   * Narrow survival enforcement (ADR-010 lever 1). When an agent's hungerDays
   * reaches this value, the engine restricts its action set to feeding actions
   * (+ TRAVEL toward food + REST) — it still CHOOSES among them, but cannot
   * talk/pray/trade-for-non-food while starving. Null/omit to disable.
   */
  survivalHungerThreshold: z.number().int().positive().nullable().optional(),
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
  /**
   * Recency-weighted memory: the most recent N days are shown verbatim in the
   * prompt; older days (still within the 7-day window) are compressed to a
   * one-line salient summary. Smaller = cheaper + more recency-biased.
   */
  memoryFullDays: z.number().int().positive().default(2),
  /**
   * Sampling temperature for the per-turn action call. A little above 0 gives
   * behavioural variety (avoids lock-step) while grammar-constrained decoding
   * keeps output valid. Reflection stays deterministic (temperature 0).
   */
  actionTemperature: z.number().min(0).max(2).default(0.3),
  /**
   * Religious charity: food a hungry adherent (or would-be convert) receives for
   * free at their faith's building, drawn from that building's treasury. The
   * treasury is seeded with `almsTreasurySeed` food and grows from food TITHEs
   * made at the building — so charity is self-sustaining, not engine-spawned.
   */
  almsFoodAmount: z.number().int().positive().default(2),
  almsTreasurySeed: z.number().int().nonnegative().default(6),
  /**
   * Conversion fatigue: after this many lifetime conversions, a religion refuses
   * to accept the agent ("the faith doubts your sincerity"). Null = unlimited.
   */
  maxConversions: z.number().int().positive().nullable().default(2),
  /**
   * Daily weather (seeded from seed+day, so reproducible). When on, weather
   * modifies food yields: storm halts fishing, rain boosts farming/foraging,
   * drought hurts crops. Surfaced in the prompt so agents can plan their day.
   */
  weather: z.boolean().default(false),
  /**
   * Diet variety. When on, food is tracked by provenance (fish/crop/forage/
   * other) and eating the SAME type as recent days only partially satisfies
   * hunger — a balanced diet keeps you full, monotony slowly starves you. This
   * is what breaks "just fish forever": a fisher must diversify or trade.
   */
  dietVariety: z.boolean().default(false),
  /** How many recent meals count toward the monotony check. */
  dietWindowDays: z.number().int().positive().default(3),
  /**
   * Residual hunger when a meal is monotonous (same type as the whole recent
   * window). 0 = no penalty; 2 = eating-but-still-hungry. Fresh variety always
   * resets hunger to 0.
   */
  monotonyHungerFloor: z.number().int().nonnegative().default(2),
  /**
   * Fishmonger at the harbour buys fish for gold, but the price FALLS as supply
   * rises: price = max(fishFloorPrice, fishBasePrice - floor(fishSoldToday /
   * fishGlutStep)). Resets daily. Makes catching-to-sell self-limiting (a glut
   * crashes the price) so fish becomes a trade good, not an infinite gold tap.
   */
  fishBasePrice: z.number().int().positive().default(3),
  fishFloorPrice: z.number().int().nonnegative().default(1),
  fishGlutStep: z.number().int().positive().default(3),
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
  "SEEK_ALMS",
  "SELL_FISH",
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
export type Weather = z.infer<typeof WeatherSchema>;
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
