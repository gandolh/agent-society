import { readFile } from "node:fs/promises";
import { RunConfigSchema, ActionRequestSchema } from "../src/schemas.js";

// --- Validate the run 01 config ---
const raw = await readFile("./runs/2026-05-26_socialism_run01/config.json", "utf-8");
const cfg = RunConfigSchema.safeParse(JSON.parse(raw));
if (!cfg.success) {
  console.error("FAIL — config validation:");
  console.error(cfg.error.format());
  process.exit(1);
}
console.log(`OK   — RunConfig validated: runName=${cfg.data.runName}, cast=${cfg.data.cast.length}, endpoint=${cfg.data.ollamaBaseUrl}`);

// --- Validate a well-formed action response ---
const goodAction = { action: "TITHE", args: { to: "N2", resource: "gold", amount: 1 }, reasoning: "He spoke truth." };
const a1 = ActionRequestSchema.safeParse(goodAction);
console.log(a1.success ? "OK   — ActionRequest accepted valid TITHE" : "FAIL — ActionRequest rejected valid TITHE");

// --- Validate a malformed action response ---
const badAction = { action: "STEAL", args: {} };
const a2 = ActionRequestSchema.safeParse(badAction);
console.log(a2.success ? "FAIL — ActionRequest accepted invalid STEAL" : "OK   — ActionRequest rejected invalid STEAL");

// --- Confirm permissive args (handler does precise checks) ---
const ambiguousArgs = { action: "GIVE", args: { to: "V2", resource: "gold", amount: "five" } };
const a3 = ActionRequestSchema.safeParse(ambiguousArgs);
console.log(a3.success ? "OK   — ActionRequest accepted (args precise-checked by handler)" : "FAIL — ActionRequest over-restrictive on args");
