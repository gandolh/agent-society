import { z } from "zod";

export const ReligionSchema = z.enum(["Christianity", "TrueVine", "Atheism"]);

export const RegimeSchema = z.enum(["socialism", "monarchy", "capitalism"]);

export const AgentRoleSchema = z.enum([
  "villager",
  "regime-leader",
  "priest",
  "cult-leader",
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
