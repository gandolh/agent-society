import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { runSimulation } from "./engine.js";
import { RunLogger } from "./logger.js";
import { OllamaClientError } from "./ollama.js";
import { RunConfigSchema, type RunConfig } from "./schemas.js";
import { initializeWorld } from "./world.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isSmoke = args.includes("--smoke");
  const configPath = args.find((a) => !a.startsWith("--"));

  let config: RunConfig;
  if (configPath) {
    const raw = await readFile(configPath, "utf-8");
    const parsed = RunConfigSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.error(`[runDriver] config validation failed (${configPath}):`);
      console.error(parsed.error.format());
      process.exit(2);
    }
    config = parsed.data;
  } else {
    config = defaultRun01Config();
  }

  if (args.includes("--spatial")) {
    config = { ...config, spatial: true };
  }

  if (isSmoke) {
    config = { ...config, days: 1, runName: `${config.runName}_smoke` };
  }

  // Spatial runs need a map; fall back to the built-in ocean-town map if the
  // config enabled spatial but didn't supply one.
  if (config.spatial && !config.map) {
    config = { ...config, map: defaultOceanTownMap() };
    console.log("[runDriver]   spatial=on, using default ocean-town map");
  }

  config.runDir = resolve(config.runDir);
  config.corpusPath = resolve(config.corpusPath);

  if (!config.ollamaApiKey && process.env.OLLAMA_API_KEY) {
    config.ollamaApiKey = process.env.OLLAMA_API_KEY;
  }

  const usingCloud = config.ollamaBaseUrl.includes("ollama.com");
  if (usingCloud && !config.ollamaApiKey) {
    console.error(
      "[runDriver] Cloud endpoint configured but no API key found. " +
        "Set OLLAMA_API_KEY in .env (or in config.ollamaApiKey).",
    );
    process.exit(3);
  }

  console.log(`[runDriver] starting "${config.runName}"`);
  console.log(`[runDriver]   regime=${config.regime}, seed=${config.seed}, days=${config.days}`);
  console.log(`[runDriver]   endpoint=${config.ollamaBaseUrl} (${usingCloud ? "cloud" : "local"})`);
  console.log(`[runDriver]   runDir=${config.runDir}`);

  const world = await initializeWorld(config);
  const logger = new RunLogger(config.runDir);
  await logger.init(config, Object.values(world.agents));

  await runSimulation(world, logger);

  console.log(`[runDriver] done. Output in ${config.runDir}`);
}

function defaultRun01Config(): RunConfig {
  return {
    runName: "2026-05-28_capitalism_run02",
    seed: 42,
    days: 31,
    regime: "capitalism",
    religions: ["Christianity", "Atheism"],
    cast: [
      { slot: "V1", name: "Tessa", role: "citizen", religion: "Christianity" },
      { slot: "V2", name: "Bram", role: "citizen", religion: "Atheism" },
      { slot: "V3", name: "Lior", role: "citizen", religion: "Christianity" },
      { slot: "N1", name: "Aldric", role: "industrialist", religion: "Christianity" },
      { slot: "N2", name: "Father Maro", role: "priest", religion: "Christianity" },
      { slot: "N3", name: "Nyssa", role: "editor", religion: "Atheism" },
    ],
    defaultModel: "ministral-3:3b-cloud",
    startingEndowments: { gold: 5, food: 3, seeds: 3 },
    marketPrices: { buySeeds: 2, buyFood: 1, sellAny: 1 },
    apPerDay: 5,
    cropMaturityDays: 3,
    foodPerCrop: 3,
    hungerApPenalty: [7, 7, 6, 5, 3],
    hungerDeathDays: 7,
    survivalHungerThreshold: 3,
    spatial: false,
    sayRadius: 1,
    moveSpeed: 4,
    fishYield: 2,
    forageYield: 2,
    millGoldPerCrop: 2,
    wallListingTtlDays: 3,
    memoryFullDays: 2,
    actionTemperature: 0.3,
    almsFoodAmount: 2,
    almsTreasurySeed: 6,
    maxConversions: 2,
    weather: true,
    dietVariety: true,
    dietWindowDays: 3,
    monotonyHungerFloor: 2,
    fishBasePrice: 3,
    fishFloorPrice: 1,
    fishGlutStep: 3,
    corpusPath: "./corpus",
    runDir: "./runs/2026-05-28_capitalism_run02",
    ollamaBaseUrl: "https://ollama.com",
  };
}

/**
 * Default ocean-town map. Compact 16×10 grid so travel is a real but small cost
 * over a 31-day run. The south edge (y=9) is ocean; the harbour sits on the
 * coast. Homes are owned per-slot so agents start spread out.
 */
function defaultOceanTownMap(): RunConfig["map"] {
  return {
    width: 16,
    height: 10,
    zones: [
      // Coast (south).
      { id: "harbour", name: "Harbour Pier", kind: "harbour", x: 4, y: 8 },
      { id: "ocean", name: "The Ocean", kind: "ocean", x: 4, y: 9 },
      // Hub + workplaces (mid).
      { id: "market", name: "Market Square", kind: "market", x: 8, y: 5 },
      { id: "mill", name: "Vance Mill", kind: "mill", x: 12, y: 5, owner: "N1" },
      { id: "chapel", name: "Parish Chapel", kind: "chapel", x: 8, y: 2, owner: "N2" },
      // Land use.
      { id: "fieldN", name: "North Field", kind: "farm", x: 5, y: 2 },
      { id: "fieldS", name: "South Field", kind: "farm", x: 5, y: 6 },
      { id: "grove", name: "Tidal Grove", kind: "forage", x: 1, y: 7 },
      // Homes (one per slot).
      { id: "home-V1", name: "Tessa's Bakery", kind: "home", x: 11, y: 2, owner: "V1" },
      { id: "home-V2", name: "Bram's Surgery", kind: "home", x: 10, y: 7, owner: "V2" },
      { id: "home-V3", name: "Lior's Workshop", kind: "home", x: 13, y: 7, owner: "V3" },
      { id: "home-N1", name: "Aldric's House", kind: "home", x: 14, y: 4, owner: "N1" },
      { id: "home-N2", name: "Maro's Rectory", kind: "home", x: 7, y: 1, owner: "N2" },
      { id: "home-N3", name: "Nyssa's Print-shop", kind: "home", x: 2, y: 4, owner: "N3" },
    ],
  };
}

main().catch((err) => {
  if (err instanceof OllamaClientError) {
    console.error();
    console.error(`[runDriver] Ollama returned HTTP ${err.status} for model "${err.model}".`);
    if (err.status === 403) {
      console.error(
        `[runDriver] This usually means the model requires a paid Ollama Cloud subscription.`,
      );
      console.error(
        `[runDriver] Known free-tier models on this account (probed 2026-05-26):`,
      );
      console.error(
        `[runDriver]   Small/low usage:`,
      );
      console.error(
        `[runDriver]     ministral-3:8b-cloud, gpt-oss:20b-cloud, gemma4:31b-cloud, nemotron-3-super:cloud.`,
      );
      console.error(
        `[runDriver]   Larger/higher usage:`,
      );
      console.error(
        `[runDriver]     gpt-oss:120b-cloud, glm-4.7:cloud, qwen3-coder:480b-cloud.`,
      );
      console.error(
        `[runDriver] To re-probe (e.g. when Ollama adds models): npx tsx scripts/probe-cloud-models.ts`,
      );
      console.error(`[runDriver] Body: ${err.body}`);
    } else if (err.status === 401) {
      console.error(
        `[runDriver] Bad or missing API key. Check OLLAMA_API_KEY in .env (or config.ollamaApiKey).`,
      );
    } else if (err.status === 404) {
      console.error(
        `[runDriver] Model not found. Check the spelling and the :cloud suffix.`,
      );
    } else {
      console.error(`[runDriver] Body: ${err.body}`);
    }
    process.exit(4);
  }
  console.error(err);
  process.exit(1);
});
