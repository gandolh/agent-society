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

  if (isSmoke) {
    config = { ...config, days: 1, runName: `${config.runName}_smoke` };
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
    runName: "2026-05-26_socialism_run01",
    seed: 42,
    days: 31,
    regime: "socialism",
    religions: ["Christianity", "TrueVine", "Atheism"],
    // Per-agent model overrides — omit to use defaultModel.
    // Available free-tier models (probed 2026-05-26):
    //   ministral-3:3b-cloud, ministral-3:8b-cloud, gpt-oss:20b-cloud,
    //   gemma4:31b-cloud, nemotron-3-super:cloud
    // For diversity runs, set model per-agent, e.g.:
    //   { slot: "V1", ..., model: "gemma4:31b-cloud" }
    cast: [
      { slot: "V1", name: "Eda", role: "villager", religion: "Christianity" },
      { slot: "V2", name: "Bram", role: "villager", religion: "Atheism" },
      { slot: "V3", name: "Lior", role: "villager", religion: "TrueVine" },
      { slot: "N1", name: "Aldric", role: "regime-leader", religion: "Christianity" },
      { slot: "N2", name: "Father Maro", role: "priest", religion: "Christianity" },
      { slot: "N3", name: "Sister Velka", role: "cult-leader", religion: "TrueVine" },
    ],
    defaultModel: "ministral-3:3b-cloud",
    startingEndowments: { gold: 5, food: 3, seeds: 3 },
    marketPrices: { buySeeds: 2, buyFood: 1, sellAny: 1 },
    apPerDay: 5,
    cropMaturityDays: 3,
    foodPerCrop: 3,
    hungerApPenalty: [7, 7, 6, 5, 3],
    corpusPath: "./corpus",
    runDir: "./runs/2026-05-26_socialism_run01",
    ollamaBaseUrl: "https://ollama.com",
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
