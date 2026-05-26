/**
 * Sends a tiny one-token prompt to each candidate model and reports which
 * are reachable on the configured Ollama Cloud account. Use this BEFORE
 * editing your run's config to swap in an unfamiliar model.
 *
 * Usage:
 *   npx tsx scripts/probe-cloud-models.ts
 *   npx tsx scripts/probe-cloud-models.ts model1 model2 ...
 */
import "dotenv/config";
import { OllamaClientError, ollamaGenerate } from "../src/ollama.js";

const DEFAULT_CANDIDATES = [
  "gpt-oss:20b-cloud",
  "gpt-oss:120b-cloud",
  "deepseek-v3.1:cloud",
  "deepseek-v3.2:cloud",
  "qwen3-next:cloud",
  "qwen3.5:cloud",
  "qwen3-coder:480b-cloud",
  "kimi-k2.5:cloud",
  "glm-4.7:cloud",
  "glm-5:cloud",
  "gemma4:cloud",
  "minimax-m2.7:cloud",
  "nemotron-3-nano:cloud",
];

const baseUrl = process.env.OLLAMA_BASE_URL || "https://ollama.com";
const apiKey = process.env.OLLAMA_API_KEY;
if (!apiKey) {
  console.error("Set OLLAMA_API_KEY in .env first.");
  process.exit(1);
}

const candidates =
  process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_CANDIDATES;

console.log(`Probing ${candidates.length} models at ${baseUrl}\n`);

const results: { model: string; status: "ok" | string }[] = [];
for (const model of candidates) {
  process.stdout.write(`  ${model.padEnd(34)} ... `);
  try {
    const res = await ollamaGenerate({
      baseUrl,
      apiKey,
      model,
      prompt: 'Reply with the single word "ok".',
      seed: 1,
      temperature: 0,
      retries: 1,
    });
    console.log(`OK   (${res.responseTokens} tokens, ${res.totalDurationMs}ms)`);
    results.push({ model, status: "ok" });
  } catch (err) {
    if (err instanceof OllamaClientError) {
      const summary =
        err.status === 403
          ? "403 (subscription)"
          : err.status === 404
            ? "404 (not found)"
            : err.status === 401
              ? "401 (bad key)"
              : `${err.status}`;
      console.log(summary);
      results.push({ model, status: summary });
    } else {
      console.log(`ERROR: ${String(err).slice(0, 80)}`);
      results.push({ model, status: "error" });
    }
  }
}

console.log();
console.log("=== Reachable on this account ===");
for (const r of results.filter((r) => r.status === "ok")) {
  console.log(`  ${r.model}`);
}
console.log();
console.log("=== Walled / missing ===");
for (const r of results.filter((r) => r.status !== "ok")) {
  console.log(`  ${r.model.padEnd(34)}   ${r.status}`);
}
