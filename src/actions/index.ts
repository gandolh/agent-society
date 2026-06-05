import type { ActionHandler, ActionName, AgentState, Religion, WorldState, ZoneKind } from "../types.js";
import { stepToward, zoneAt, zoneById, atZoneKind } from "../spatial.js";

/**
 * Zone gate: in a spatial run an action that needs a specific zone fails unless
 * the agent stands there. Aspatial runs are unrestricted (returns null = ok).
 */
function requireZone(world: WorldState, actor: AgentState, kind: ZoneKind): string | null {
  if (!world.config.spatial) return null;
  if (atZoneKind(world, actor, kind)) return null;
  return `You must be at a ${kind} zone to do this — TRAVEL there first.`;
}

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
  const gate = requireZone(world, actor, "farm");
  if (gate) return { ok: false, error: gate, apCost: 0 };
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
  const gate = requireZone(world, actor, "farm");
  if (gate) return { ok: false, error: gate, apCost: 0 };
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
  const gate = requireZone(world, actor, "market");
  if (gate) return { ok: false, error: gate, apCost: 0 };
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

const fish: ActionHandler = (world, actor) => {
  const gate = requireZone(world, actor, "harbour");
  if (gate) return { ok: false, error: gate, apCost: 0 };
  const caught = world.config.fishYield;
  actor.resources.food += caught;
  return { ok: true, apCost: 1, result: { caught, food: actor.resources.food }, publicEvent: true };
};

const forage: ActionHandler = (world, actor) => {
  const gate = requireZone(world, actor, "forage");
  if (gate) return { ok: false, error: gate, apCost: 0 };
  const gathered = world.config.forageYield;
  actor.resources.food += gathered;
  return { ok: true, apCost: 1, result: { gathered, food: actor.resources.food }, publicEvent: true };
};

const mill: ActionHandler = (world, actor) => {
  const gate = requireZone(world, actor, "mill");
  if (gate) return { ok: false, error: gate, apCost: 0 };
  if (actor.plot.cropsReady <= 0) {
    return { ok: false, error: "No ready crops to process at the mill.", apCost: 0 };
  }
  const processed = actor.plot.cropsReady;
  const gold = processed * world.config.millGoldPerCrop;
  actor.plot.cropsReady = 0;
  actor.resources.gold += gold;
  return { ok: true, apCost: 2, result: { processed, gold }, publicEvent: true };
};

const postOffer: ActionHandler = (world, actor, args) => {
  const gate = requireZone(world, actor, "market");
  if (gate) return { ok: false, error: gate, apCost: 0 };
  const item = args.item;
  if (item !== "food" && item !== "seeds") {
    return { ok: false, error: "args.item must be food or seeds.", apCost: 0 };
  }
  const qty = typeof args.qty === "number" ? args.qty : 0;
  const unitPrice = typeof args.unitPrice === "number" ? args.unitPrice : 0;
  if (qty <= 0 || !Number.isInteger(qty)) {
    return { ok: false, error: "args.qty must be a positive integer.", apCost: 0 };
  }
  if (unitPrice <= 0 || !Number.isInteger(unitPrice)) {
    return { ok: false, error: "args.unitPrice must be a positive integer.", apCost: 0 };
  }
  if (actor.resources[item] < qty) {
    return { ok: false, error: `Not enough ${item} to post.`, apCost: 0 };
  }
  // Escrow the goods: deducted now, returned if the listing expires unsold.
  actor.resources[item] -= qty;
  const id = `L${world.nextListingId++}`;
  world.wall.push({ id, seller: actor.id, item, qty, unitPrice, postedDay: world.day });
  return { ok: true, apCost: 1, result: { id, item, qty, unitPrice }, publicEvent: true };
};

const readOffers: ActionHandler = (world, actor) => {
  const gate = requireZone(world, actor, "market");
  if (gate) return { ok: false, error: gate, apCost: 0 };
  // The offers themselves are injected into perception; this just spends the
  // turn "checking the wall" and logs it.
  return { ok: true, apCost: 1, result: { count: world.wall.length }, publicEvent: false };
};

const buyFromWall: ActionHandler = (world, actor, args) => {
  const gate = requireZone(world, actor, "market");
  if (gate) return { ok: false, error: gate, apCost: 0 };
  const id = typeof args.id === "string" ? args.id : "";
  const listing = world.wall.find((l) => l.id === id);
  if (!listing) return { ok: false, error: "args.id must be a live listing (see offers).", apCost: 0 };
  if (listing.seller === actor.id) {
    return { ok: false, error: "Cannot buy your own listing.", apCost: 0 };
  }
  const want = typeof args.qty === "number" ? args.qty : listing.qty;
  if (want <= 0 || !Number.isInteger(want) || want > listing.qty) {
    return { ok: false, error: `args.qty must be 1..${listing.qty}.`, apCost: 0 };
  }
  const cost = want * listing.unitPrice;
  if (actor.resources.gold < cost) {
    return { ok: false, error: `Need ${cost} gold, have ${actor.resources.gold}.`, apCost: 0 };
  }
  const seller = world.agents[listing.seller];
  if (!seller) return { ok: false, error: "Seller no longer present.", apCost: 0 };
  // Goods are in escrow on the listing; gold goes to the seller.
  actor.resources.gold -= cost;
  seller.resources.gold += cost;
  actor.resources[listing.item] += want;
  listing.qty -= want;
  if (listing.qty <= 0) {
    world.wall = world.wall.filter((l) => l.id !== listing.id);
  }
  return {
    ok: true,
    apCost: 3,
    result: { id: listing.id, item: listing.item, qty: want, cost, seller: seller.id },
    publicEvent: true,
  };
};

const rest: ActionHandler = (_world, actor) => {
  actor.restedToday = true;
  return { ok: true, apCost: 0, result: {}, publicEvent: false };
};

const travel: ActionHandler = (world, actor, args) => {
  const map = world.config.map;
  if (!world.config.spatial || !map) {
    return { ok: false, error: "TRAVEL is only available in a spatial world.", apCost: 0 };
  }
  const target = zoneById(map, typeof args.to === "string" ? args.to : "");
  if (!target) {
    return { ok: false, error: "args.to must be a known zone id.", apCost: 0 };
  }
  const before = { ...actor.pos };
  actor.pos = stepToward(actor.pos, { x: target.x, y: target.y }, world.config.moveSpeed);
  const here = zoneAt(map, actor.pos);
  actor.zoneId = here?.id;
  const arrived = actor.pos.x === target.x && actor.pos.y === target.y;
  // Standing still (already there) wastes the turn; treat as a no-op failure so
  // the agent re-picks rather than burning AP going nowhere.
  if (actor.pos.x === before.x && actor.pos.y === before.y) {
    return { ok: false, error: `Already at ${target.id}.`, apCost: 0 };
  }
  return {
    ok: true,
    apCost: 1,
    result: { to: target.id, arrived, at: actor.zoneId ?? null },
    publicEvent: true,
  };
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
  TRAVEL: travel,
  FISH: fish,
  FORAGE: forage,
  MILL: mill,
  POST_OFFER: postOffer,
  READ_OFFERS: readOffers,
  BUY_FROM_WALL: buyFromWall,
};
