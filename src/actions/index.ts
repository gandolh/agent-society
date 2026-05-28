import type { ActionHandler, ActionName, AgentState, Religion, WorldState } from "../types.js";

type Resource = "gold" | "food" | "seeds";

function isResource(s: unknown): s is Resource {
  return s === "gold" || s === "food" || s === "seeds";
}

function isReligion(s: unknown): s is Religion {
  return s === "Christianity" || s === "Atheism";
}

function getAgent(world: WorldState, slot: unknown): AgentState | null {
  if (typeof slot !== "string") return null;
  return world.agents[slot] ?? null;
}

const workPlot: ActionHandler = (world, actor) => {
  if (actor.resources.seeds > 0) {
    actor.resources.seeds -= 1;
    actor.plot.cropsPlanted.push({ plantedDay: world.day });
    return {
      ok: true,
      apCost: 1,
      result: { planted: 1, seedsRemaining: actor.resources.seeds },
      publicEvent: true,
    };
  }
  return { ok: true, apCost: 1, result: { tended: true }, publicEvent: true };
};

const harvest: ActionHandler = (world, actor) => {
  if (actor.plot.cropsReady <= 0) {
    return { ok: false, error: "No ready crops to harvest.", apCost: 0 };
  }
  const foodGained = actor.plot.cropsReady * world.config.foodPerCrop;
  actor.resources.food += foodGained;
  const harvested = actor.plot.cropsReady;
  actor.plot.cropsReady = 0;
  return {
    ok: true,
    apCost: 1,
    result: { harvested, foodGained },
    publicEvent: true,
  };
};

const goToMarket: ActionHandler = (world, actor, args) => {
  const sub = args.sub;
  const item = args.item;
  const qty = typeof args.qty === "number" ? args.qty : 0;
  if (sub !== "BUY" && sub !== "SELL") {
    return { ok: false, error: "args.sub must be BUY or SELL.", apCost: 0 };
  }
  if (item !== "seeds" && item !== "food") {
    return { ok: false, error: "args.item must be seeds or food.", apCost: 0 };
  }
  if (qty <= 0 || !Number.isInteger(qty)) {
    return { ok: false, error: "args.qty must be a positive integer.", apCost: 0 };
  }
  const prices = world.config.marketPrices;
  if (sub === "BUY") {
    const unitPrice = item === "seeds" ? prices.buySeeds : prices.buyFood;
    const cost = unitPrice * qty;
    if (actor.resources.gold < cost) {
      return { ok: false, error: `Need ${cost} gold, have ${actor.resources.gold}.`, apCost: 0 };
    }
    actor.resources.gold -= cost;
    actor.resources[item] += qty;
    return {
      ok: true,
      apCost: 2,
      result: { sub, item, qty, cost },
      publicEvent: true,
    };
  } else {
    if (actor.resources[item] < qty) {
      return { ok: false, error: `Not enough ${item} to sell.`, apCost: 0 };
    }
    const earnings = prices.sellAny * qty;
    actor.resources[item] -= qty;
    actor.resources.gold += earnings;
    return {
      ok: true,
      apCost: 2,
      result: { sub, item, qty, earnings },
      publicEvent: true,
    };
  }
};

const give: ActionHandler = (world, actor, args) => {
  const target = getAgent(world, args.to);
  if (!target) return { ok: false, error: "args.to must be a valid slot.", apCost: 0 };
  if (target.id === actor.id) return { ok: false, error: "Cannot give to self.", apCost: 0 };
  const resource = args.resource;
  if (!isResource(resource)) {
    return { ok: false, error: "args.resource must be gold|food|seeds.", apCost: 0 };
  }
  const amount = typeof args.amount === "number" ? args.amount : 0;
  if (amount <= 0 || !Number.isInteger(amount)) {
    return { ok: false, error: "args.amount must be a positive integer.", apCost: 0 };
  }
  if (actor.resources[resource] < amount) {
    return { ok: false, error: `Not enough ${resource} to give.`, apCost: 0 };
  }
  actor.resources[resource] -= amount;
  target.resources[resource] += amount;
  return {
    ok: true,
    apCost: 1,
    result: { to: target.id, resource, amount },
    publicEvent: true,
  };
};

const say: ActionHandler = (_world, _actor, args) => {
  const text = typeof args.text === "string" ? args.text.trim() : "";
  if (!text) return { ok: false, error: "args.text must be non-empty.", apCost: 0 };
  return {
    ok: true,
    apCost: 1,
    result: { text },
    publicEvent: true,
  };
};

const dm: ActionHandler = (world, actor, args) => {
  const target = getAgent(world, args.to);
  if (!target) return { ok: false, error: "args.to must be a valid slot.", apCost: 0 };
  if (target.id === actor.id) return { ok: false, error: "Cannot DM self.", apCost: 0 };
  const text = typeof args.text === "string" ? args.text.trim() : "";
  if (!text) return { ok: false, error: "args.text must be non-empty.", apCost: 0 };
  target.unreadDms.push({ fromId: actor.id, day: world.day, text });
  return {
    ok: true,
    apCost: 1,
    result: { to: target.id, text },
    publicEvent: false,
  };
};

const pray: ActionHandler = (_world, actor, args) => {
  const deity = typeof args.deity === "string" && args.deity.trim().length > 0 ? args.deity : actor.religion;
  return {
    ok: true,
    apCost: 1,
    result: { deity },
    publicEvent: true,
  };
};

const tithe: ActionHandler = (world, actor, args) => {
  const target = getAgent(world, args.to);
  if (!target) return { ok: false, error: "args.to must be a valid slot.", apCost: 0 };
  const resource = args.resource;
  if (resource !== "gold" && resource !== "food") {
    return { ok: false, error: "args.resource must be gold or food.", apCost: 0 };
  }
  const amount = typeof args.amount === "number" ? args.amount : 0;
  if (amount <= 0 || !Number.isInteger(amount)) {
    return { ok: false, error: "args.amount must be a positive integer.", apCost: 0 };
  }
  if (actor.resources[resource] < amount) {
    return { ok: false, error: `Not enough ${resource} to tithe.`, apCost: 0 };
  }
  actor.resources[resource] -= amount;
  target.resources[resource] += amount;
  return {
    ok: true,
    apCost: 1,
    result: { to: target.id, resource, amount, religion: actor.religion },
    publicEvent: true,
  };
};

const convert: ActionHandler = (_world, actor, args) => {
  const religion = args.religion;
  if (!isReligion(religion)) {
    return { ok: false, error: "args.religion must be Christianity|Atheism.", apCost: 0 };
  }
  if (religion === actor.religion) {
    return { ok: false, error: "Already this religion.", apCost: 0 };
  }
  const from = actor.religion;
  actor.religion = religion;
  return {
    ok: true,
    apCost: 2,
    result: { from, to: religion },
    publicEvent: true,
  };
};

const rest: ActionHandler = (_world, actor) => {
  actor.restedToday = true;
  return { ok: true, apCost: 0, result: {}, publicEvent: false };
};

export const ACTION_HANDLERS: Record<ActionName, ActionHandler> = {
  WORK_PLOT: workPlot,
  HARVEST: harvest,
  GO_TO_MARKET: goToMarket,
  GIVE: give,
  SAY: say,
  DM: dm,
  PRAY: pray,
  TITHE: tithe,
  CONVERT: convert,
  REST: rest,
};
