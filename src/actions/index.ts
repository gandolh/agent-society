import type { ActionHandler, ActionName, AgentState, Religion, WorldState, ZoneKind } from "../types.js";
import { stepToward, zoneAt, zoneById, atZoneKind, nearestFoodZone, atFoodZone } from "../spatial.js";
import { isStarving } from "../survival.js";
import { zoneReligion, fishPrice } from "../world.js";
import { weatherYieldFactor } from "../weather.js";
import { addFood, removeFood } from "../diet.js";

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
  const base = actor.plot.cropsReady * world.config.foodPerCrop;
  const foodGained = Math.max(actor.plot.cropsReady, Math.round(base * weatherYieldFactor(world, "HARVEST")));
  addFood(actor, "crop", foodGained);
  const harvested = actor.plot.cropsReady;
  actor.plot.cropsReady = 0;
  return {
    ok: true,
    apCost: 1,
    result: { harvested, foodGained, weather: world.weather },
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
    if (item === "food") addFood(actor, "other", qty); // bought food = variety
    else actor.resources[item] += qty;
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
    if (item === "food") removeFood(actor, qty);
    else actor.resources[item] -= qty;
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
  if (resource === "food") {
    removeFood(actor, amount);
    addFood(target, "other", amount); // a gift of food adds dietary variety
  } else {
    actor.resources[resource] -= amount;
    target.resources[resource] += amount;
  }
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
  if (resource === "food") {
    removeFood(actor, amount);
    addFood(target, "other", amount);
  } else {
    actor.resources[resource] -= amount;
    target.resources[resource] += amount;
  }
  // If a food tithe is made while standing in a religious building of the
  // actor's own faith, also stock that building's charity treasury — closing
  // the alms loop (adherents tithe → the needy receive). Spatial runs only.
  let toTreasury = 0;
  if (resource === "food" && world.config.spatial && world.config.map) {
    const here = zoneAt(world.config.map, actor.pos);
    if (here && zoneReligion(here.kind) === actor.religion) {
      world.treasury[here.id] = (world.treasury[here.id] ?? 0) + amount;
      toTreasury = amount;
    }
  }
  return {
    ok: true,
    apCost: 1,
    result: { to: target.id, resource, amount, religion: actor.religion, toTreasury },
    publicEvent: true,
  };
};

/**
 * Religious charity. At a religious building, a hungry agent who shares the
 * building's faith — OR declares intent to convert to it (args.convertIntent) —
 * receives free food from the building's treasury. Others are refused. Self-
 * sustaining: the treasury is funded by food TITHEs (see tithe).
 */
const seekAlms: ActionHandler = (world, actor, args) => {
  const map = world.config.map;
  if (!world.config.spatial || !map) {
    return { ok: false, error: "SEEK_ALMS is only available in a spatial world.", apCost: 0 };
  }
  const here = zoneAt(map, actor.pos);
  const faith = here ? zoneReligion(here.kind) : null;
  if (!here || faith == null) {
    return { ok: false, error: "You must be at a religious building to seek alms.", apCost: 0 };
  }
  if (actor.hungerDays < 1) {
    return { ok: false, error: "Alms are for those in need; you are not hungry.", apCost: 0 };
  }
  const sameFaith = actor.religion === faith;
  const wantsConvert = args.convertIntent === true;
  if (!sameFaith && !wantsConvert) {
    return {
      ok: false,
      error: `The ${faith} charity feeds its own and those who would join. You are neither.`,
      apCost: 0,
    };
  }
  const available = world.treasury[here.id] ?? 0;
  if (available <= 0) {
    return { ok: false, error: "The charity treasury is empty today.", apCost: 0 };
  }
  const given = Math.min(world.config.almsFoodAmount, available);
  world.treasury[here.id] = available - given;
  addFood(actor, "other", given); // charity bread = dietary variety
  // A would-be convert who accepts alms takes the faith (subject to conversion
  // fatigue — a serial convert is fed but not enrolled).
  let converted = false;
  if (wantsConvert && !sameFaith) {
    const cap = world.config.maxConversions;
    if (cap == null || actor.conversionCount < cap) {
      actor.religion = faith;
      actor.conversionCount += 1;
      converted = true;
    }
  }
  return {
    ok: true,
    apCost: 1,
    result: { faith, given, converted, treasuryLeft: world.treasury[here.id] },
    publicEvent: true,
  };
};

const convert: ActionHandler = (world, actor, args) => {
  const religion = args.religion;
  if (!isReligion(religion)) {
    return { ok: false, error: "args.religion must be Christianity|Atheism.", apCost: 0 };
  }
  if (religion === actor.religion) {
    return { ok: false, error: "Already this religion.", apCost: 0 };
  }
  // Conversion fatigue: a faith refuses someone who has already flip-flopped
  // too many times ("it doubts your sincerity"). Keeps belief changes meaningful.
  const cap = world.config.maxConversions;
  if (cap != null && actor.conversionCount >= cap) {
    return {
      ok: false,
      error: `The ${religion} faith doubts your sincerity — you have changed faith too many times to be accepted again.`,
      apCost: 0,
    };
  }
  const from = actor.religion;
  actor.religion = religion;
  actor.conversionCount += 1;
  return {
    ok: true,
    apCost: 2,
    result: { from, to: religion, conversionCount: actor.conversionCount },
    publicEvent: true,
  };
};

const fish: ActionHandler = (world, actor) => {
  const gate = requireZone(world, actor, "harbour");
  if (gate) return { ok: false, error: gate, apCost: 0 };
  const factor = weatherYieldFactor(world, "FISH");
  if (factor <= 0) {
    return { ok: false, error: "The sea is too rough to fish in this storm.", apCost: 0 };
  }
  const caught = Math.max(1, Math.round(world.config.fishYield * factor));
  addFood(actor, "fish", caught);
  return { ok: true, apCost: 1, result: { caught, food: actor.resources.food, weather: world.weather }, publicEvent: true };
};

const sellFish: ActionHandler = (world, actor, args) => {
  const gate = requireZone(world, actor, "harbour");
  if (gate) return { ok: false, error: gate, apCost: 0 };
  const qty = typeof args.qty === "number" ? args.qty : actor.foodStock.fish;
  if (qty <= 0 || !Number.isInteger(qty)) {
    return { ok: false, error: "args.qty must be a positive integer.", apCost: 0 };
  }
  if (actor.foodStock.fish < qty) {
    return { ok: false, error: `You only have ${actor.foodStock.fish} fish.`, apCost: 0 };
  }
  // Price falls as the day's catch gluts the market — sell fish one at a time at
  // the current price, recomputing after each (so a big dump tanks the price).
  let earnings = 0;
  for (let i = 0; i < qty; i++) {
    earnings += fishPrice(world);
    world.fishSoldToday += 1;
  }
  removeFood(actor, qty); // draws fish-first; guarded above so only fish leave
  actor.resources.gold += earnings;
  return {
    ok: true,
    apCost: 1,
    result: { qty, earnings, priceNow: fishPrice(world) },
    publicEvent: true,
  };
};

const forage: ActionHandler = (world, actor) => {
  const gate = requireZone(world, actor, "forage");
  if (gate) return { ok: false, error: gate, apCost: 0 };
  const gathered = Math.max(1, Math.round(world.config.forageYield * weatherYieldFactor(world, "FORAGE")));
  addFood(actor, "forage", gathered);
  return { ok: true, apCost: 1, result: { gathered, food: actor.resources.food, weather: world.weather }, publicEvent: true };
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
  if (item === "food") removeFood(actor, qty);
  else actor.resources[item] -= qty;
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
  if (listing.item === "food") addFood(actor, "other", want); // bought food = variety
  else actor.resources[listing.item] += want;
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
  let target = zoneById(map, typeof args.to === "string" ? args.to : "");
  // Destination-aware survival: a starving agent's TRAVEL is auto-redirected to
  // the nearest food zone, regardless of where it asked to go. The prompt tells
  // it this; the engine guarantees it (run03: Lior starved travelling to a
  // social non-food destination instead of the harbour).
  if (isStarving(world, actor) && !atFoodZone(world, actor)) {
    const food = nearestFoodZone(map, actor.pos);
    if (food) target = food.zone;
  }
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
  SEEK_ALMS: seekAlms,
  SELL_FISH: sellFish,
  POST_OFFER: postOffer,
  READ_OFFERS: readOffers,
  BUY_FROM_WALL: buyFromWall,
};
