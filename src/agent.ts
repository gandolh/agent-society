import type {
  ActionRequest,
  AgentState,
  EventLogEntry,
  WorldState,
} from "./types.js";
import { ActionRequestSchema } from "./schemas.js";
import { ollamaGenerate, extractJson } from "./ollama.js";
import { buildSystemPrompt } from "./prompts/system.js";
import { buildReflectionPrompt } from "./prompts/reflection.js";
import { availableActions } from "./actionsAvailable.js";

export type AgentCallContext = {
  world: WorldState;
  publicEventsToday: EventLogEntry[];
  seed: number;
};

/**
 * Calls the agent's LLM for one turn. Returns parsed ActionRequest or null
 * if the response could not be parsed.
 */
export async function callAgent(
  agent: AgentState,
  ctx: AgentCallContext,
): Promise<{ request: ActionRequest | null; raw: string }> {
  const prompt = buildSystemPrompt({
    agent,
    world: ctx.world,
    publicEventsToday: ctx.publicEventsToday,
  });

  // Grammar-constrained output: the action enum is the set of verbs this agent
  // may actually take right now (survival lock, zone gating, AP, anti-repeat all
  // applied). Ollama forces the output to match, so a small model cannot emit
  // prose or pick an ineligible/invalid verb at the decoding layer.
  const verbs = availableActions(agent, ctx.world);
  const actionSchema = {
    type: "object",
    properties: {
      action: { type: "string", enum: verbs },
      args: { type: "object" },
      reasoning: { type: "string" },
    },
    required: ["action", "reasoning"],
  };

  const res = await ollamaGenerate({
    baseUrl: ctx.world.config.ollamaBaseUrl,
    apiKey: ctx.world.config.ollamaApiKey,
    model: agent.model,
    prompt,
    seed: ctx.seed,
    temperature: ctx.world.config.actionTemperature,
    format: actionSchema,
  });

  const raw = extractJson<unknown>(res.text);
  if (raw === null) return { request: null, raw: res.text };
  const validated = ActionRequestSchema.safeParse(raw);
  const request: ActionRequest | null = validated.success ? validated.data : null;
  return { request, raw: res.text };
}

export type ReflectionContext = {
  world: WorldState;
  weekNumber: number;
  eventsThisWeek: EventLogEntry[];
  trigger: "weekly" | "event-triggered";
  triggerCause?: string;
  seed: number;
};

export async function reflectAgent(
  agent: AgentState,
  ctx: ReflectionContext,
): Promise<{ newCurrentState: string; raw: string }> {
  const prompt = buildReflectionPrompt({
    agent,
    weekNumber: ctx.weekNumber,
    eventsThisWeek: ctx.eventsThisWeek,
    trigger: ctx.trigger,
    triggerCause: ctx.triggerCause,
    rosterSlots: Object.keys(ctx.world.agents),
  });

  const res = await ollamaGenerate({
    baseUrl: ctx.world.config.ollamaBaseUrl,
    apiKey: ctx.world.config.ollamaApiKey,
    model: agent.model,
    prompt,
    seed: ctx.seed,
    temperature: 0,
  });

  const text = res.text.trim();
  // If the model included surrounding chatter, try to find the block markers.
  const start = text.indexOf("=== CURRENT STATE");
  const newCurrentState = start === -1 ? text : text.slice(start).trim();
  return { newCurrentState, raw: res.text };
}
