import { ACTION_HANDLERS } from "./actions/index.js";
import { callAgent, reflectAgent } from "./agent.js";
import type { RunLogger } from "./logger.js";
import { makeRng, shuffled, type Rng } from "./rng.js";
import type {
  ActionRequest,
  AgentState,
  EventLogEntry,
  WorldState,
} from "./types.js";
import { computeHolyDay } from "./prompts/system.js";
import { endDay, snapshotAgents, startDay } from "./world.js";

const MAX_RETRIES_PER_TURN = 3;

export type EngineHooks = {
  /** Called after each agent action. */
  onAction?: (entry: Extract<EventLogEntry, { type: "action" }>) => Promise<void> | void;
};

/**
 * Run the simulation for `world.config.days` days, writing to logger.
 */
export async function runSimulation(
  world: WorldState,
  logger: RunLogger,
  hooks: EngineHooks = {},
): Promise<void> {
  const baseRng = makeRng(world.config.seed);
  const t0 = Date.now();

  while (world.day <= world.config.days) {
    const daySeed = world.config.seed + world.day;
    const dayRng = makeRng(daySeed);

    startDay(world);
    const holyDay = computeHolyDay(world.day);
    logger.logDayHeader(world, holyDay);

    const publicEventsToday: EventLogEntry[] = [];
    const orderedSlots = shuffled(Object.keys(world.agents), dayRng);

    let round = 0;
    let actionsToday = 0;
    while (anyAgentCanAct(world, orderedSlots)) {
      round += 1;
      logger.logRoundHeader(round);

      // Snapshot public events before this round so all agents reason from the
      // same information (they can't react to simultaneous decisions).
      const publicEventsSnapshot = [...publicEventsToday];

      const activeSlots = orderedSlots.filter((slot) => {
        const a = world.agents[slot]!;
        return a.actionPointsLeft > 0 && !a.restedToday;
      });

      // Fire all LLM calls in parallel, then apply mutations sequentially.
      const decisions = await Promise.all(
        activeSlots.map((slot) => {
          const agent = world.agents[slot]!;
          return takeOneAction(world, agent, publicEventsSnapshot, dayRng, round).then(
            (result) => ({ slot, agent, result }),
          );
        }),
      );

      for (const { agent, result } of decisions) {
        if (!result) continue;

        const entry: Extract<EventLogEntry, { type: "action" }> = {
          type: "action",
          day: world.day,
          round,
          actor: agent.id,
          model: agent.model,
          action: result.request.action,
          ap_cost: result.apCost,
          args: result.request.args,
          result: result.actionResult,
          public: result.publicEvent,
          reasoning: result.request.reasoning,
        };
        logger.logEvent(entry);
        logger.logActionProse(formatActionForProse(agent, entry));
        if (hooks.onAction) await hooks.onAction(entry);

        publicEventsToday.push(entry);
        actionsToday += 1;
        agent.recentEvents.push(entry);
        pruneRecentEvents(agent, world.day);

        // Move DMs that were sent on previous turns into recentEvents next time.
        moveReceivedDmsToMemory(agent, world.day);
      }

      // Flush buffered log writes once per round.
      await logger.flush();
    }

    // End-of-day
    endDay(world);
    const snapshot = snapshotAgents(world);
    logger.logEvent({ type: "day_end", day: world.day, state: snapshot });
    logger.logNightProse(world, snapshot);

    // Weekly reflection
    if (world.day % 7 === 0) {
      await runWeeklyReflections(world, logger, baseRng);
    }

    await logger.flush();

    const elapsed = Math.round((Date.now() - t0) / 1000);
    console.log(
      `[day ${world.day}/${world.config.days}] ${actionsToday} actions, ${round} rounds — ${elapsed}s elapsed`,
    );

    world.day += 1;
  }
}

function anyAgentCanAct(world: WorldState, orderedSlots: string[]): boolean {
  for (const slot of orderedSlots) {
    const a = world.agents[slot]!;
    if (a.actionPointsLeft > 0 && !a.restedToday) return true;
  }
  return false;
}

async function takeOneAction(
  world: WorldState,
  agent: AgentState,
  publicEventsToday: EventLogEntry[],
  dayRng: Rng,
  round: number,
): Promise<{
  request: ActionRequest;
  apCost: number;
  actionResult: Record<string, unknown> | undefined;
  publicEvent: boolean;
} | null> {
  for (let attempt = 0; attempt < MAX_RETRIES_PER_TURN; attempt++) {
    const seed = Math.floor(dayRng() * 1_000_000) + round * 1000 + attempt;
    const { request } = await callAgent(agent, {
      world,
      publicEventsToday,
      seed,
    });
    if (!request || !request.action) continue;
    const handler = ACTION_HANDLERS[request.action];
    if (!handler) continue;
    const res = handler(world, agent, request.args ?? {});
    if (!res.ok) {
      // Try again on validation failure.
      continue;
    }
    if (agent.actionPointsLeft < res.apCost) {
      // Can't afford. Force REST.
      agent.restedToday = true;
      return {
        request: { action: "REST", args: {}, reasoning: "Out of AP for the day." },
        apCost: 0,
        actionResult: { forced: true },
        publicEvent: false,
      };
    }
    agent.actionPointsLeft -= res.apCost;
    return {
      request,
      apCost: res.apCost,
      actionResult: res.result,
      publicEvent: res.publicEvent ?? false,
    };
  }
  // Exhausted retries — force REST.
  agent.restedToday = true;
  return {
    request: { action: "REST", args: {}, reasoning: "(forced after parse failures)" },
    apCost: 0,
    actionResult: { forced: true },
    publicEvent: false,
  };
}

function formatActionForProse(
  agent: AgentState,
  entry: Extract<EventLogEntry, { type: "action" }>,
): Parameters<RunLogger["logActionProse"]>[0] {
  const args = entry.args ?? {};
  let summary = "";
  let speech: string | undefined;
  let targetDescription: string | undefined;
  switch (entry.action) {
    case "WORK_PLOT":
      summary = entry.result?.planted ? "planted 1 seed." : "tended the plot.";
      break;
    case "HARVEST":
      summary = `harvested ${entry.result?.harvested ?? "?"} crops (+${entry.result?.foodGained ?? "?"} food).`;
      break;
    case "GO_TO_MARKET":
      summary =
        entry.result && (entry.result as { sub?: string }).sub === "BUY"
          ? `bought ${(entry.result as { qty: number }).qty} ${(entry.result as { item: string }).item} for ${(entry.result as { cost: number }).cost} gold.`
          : `sold ${(entry.result as { qty: number }).qty} ${(entry.result as { item: string }).item} for ${(entry.result as { earnings: number }).earnings} gold.`;
      break;
    case "GIVE":
      summary = `gave ${args.amount} ${args.resource} to ${args.to}.`;
      break;
    case "SAY":
      summary = "spoke publicly.";
      speech = String(args.text ?? "");
      break;
    case "DM":
      targetDescription = `to ${args.to}`;
      summary = "private message.";
      speech = String(args.text ?? "");
      break;
    case "PRAY":
      summary = `prayed to ${args.deity}.`;
      break;
    case "TITHE":
      targetDescription = `to ${args.to}`;
      summary = `tithed ${args.amount} ${args.resource}.`;
      break;
    case "CONVERT":
      summary = `converted from ${(entry.result as { from: string }).from} to ${(entry.result as { to: string }).to}.`;
      break;
    case "REST":
      summary = "rests for the day.";
      break;
  }

  return {
    agentSlot: agent.id,
    agentName: agent.name,
    model: agent.model,
    role: agent.role,
    religion: agent.religion,
    action: entry.action,
    summary,
    reasoning: entry.reasoning,
    speech,
    isPublic: entry.public,
    targetDescription,
  };
}

function pruneRecentEvents(agent: AgentState, today: number): void {
  agent.recentEvents = agent.recentEvents.filter((e) => {
    if (e.type !== "action") return false;
    return today - e.day <= 7;
  });
}

function moveReceivedDmsToMemory(agent: AgentState, today: number): void {
  for (const dm of agent.unreadDms) {
    agent.recentEvents.push({
      type: "action",
      day: dm.day,
      round: 0,
      actor: dm.fromId,
      model: "",
      action: "DM",
      ap_cost: 1,
      args: { to: agent.id, text: dm.text },
      public: false,
    });
  }
  agent.unreadDms = [];
  pruneRecentEvents(agent, today);
}

async function runWeeklyReflections(
  world: WorldState,
  logger: RunLogger,
  baseRng: Rng,
): Promise<void> {
  const weekNumber = Math.floor(world.day / 7);
  const slots = Object.keys(world.agents);

  const reflections = await Promise.all(
    slots.map((slot) => {
      const agent = world.agents[slot]!;
      const eventsThisWeek = agent.recentEvents.filter(
        (e) => e.type === "action" && world.day - e.day < 7,
      );
      const seed = Math.floor(baseRng() * 1_000_000) + world.day;
      return reflectAgent(agent, {
        world,
        weekNumber,
        eventsThisWeek,
        trigger: "weekly",
        seed,
      }).then(({ newCurrentState }) => ({ agent, newCurrentState }));
    }),
  );

  for (const { agent, newCurrentState } of reflections) {
    const prev = agent.currentState;
    agent.currentState = newCurrentState;
    logger.logEvent({
      type: "reflection",
      day: world.day,
      actor: agent.id,
      trigger: "weekly",
      week: weekNumber,
      prev_state: prev,
      new_state: newCurrentState,
    });
  }

  logger.logReflectionMarker(world.day, weekNumber, slots);
}
