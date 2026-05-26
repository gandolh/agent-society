import { readFile } from "node:fs/promises";
import { initializeWorld } from "../src/world.js";
import { buildSystemPrompt } from "../src/prompts/system.js";
import type { RunConfig } from "../src/types.js";

const config = JSON.parse(
  await readFile("./runs/2026-05-26_socialism_run01/config.json", "utf-8"),
) as RunConfig;

const world = await initializeWorld(config);

console.log("=== Agents initialized ===");
for (const agent of Object.values(world.agents)) {
  console.log(
    `${agent.id} (${agent.name}) [${agent.model}, ${agent.role}, ${agent.religion}] — core ${agent.coreIdentity.length} chars, current ${agent.currentState.length} chars`,
  );
}

console.log();
console.log("=== Sample system prompt for V1 (truncated) ===");
const prompt = buildSystemPrompt({
  agent: world.agents["V1"]!,
  world,
  publicEventsToday: [],
});
console.log(prompt.slice(0, 2000));
console.log("...");
console.log("(total prompt length:", prompt.length, "chars)");
