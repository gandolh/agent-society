export type OllamaCallOptions = {
  baseUrl: string;
  model: string;
  prompt: string;
  seed: number;
  temperature?: number;
  /**
   * Output format. "json" = free-form JSON mode. A JSON-schema object enables
   * grammar-constrained decoding — Ollama forces the output to match the schema
   * (incl. enum constraints), so a small model literally cannot emit prose or an
   * invalid action verb. See https://ollama.com/blog/structured-outputs.
   */
  format?: "json" | Record<string, unknown>;
  /** Max attempts on connection error. */
  retries?: number;
  /**
   * API key for Ollama Cloud (sent as `Authorization: Bearer ${apiKey}`).
   * If not provided, falls back to the OLLAMA_API_KEY env var. Omit for
   * local Ollama; required for Ollama Cloud.
   */
  apiKey?: string;
};

export type OllamaResponse = {
  text: string;
  promptTokens: number;
  responseTokens: number;
  totalDurationMs: number;
};

/**
 * Thrown on 4xx responses from Ollama (e.g. 403 subscription wall, 404 model
 * not found, 401 bad key). Non-retryable.
 */
export class OllamaClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly model: string,
    public readonly body: string,
  ) {
    super(`Ollama ${status} for model "${model}": ${body}`);
    this.name = "OllamaClientError";
  }
}

/**
 * Minimal Ollama HTTP client using /api/generate. Returns the raw text.
 * Does not stream. Retries on connection errors. Supports both local Ollama
 * (no auth) and Ollama Cloud (Bearer-token auth).
 */
export async function ollamaGenerate(opts: OllamaCallOptions): Promise<OllamaResponse> {
  const url = `${opts.baseUrl.replace(/\/$/, "")}/api/generate`;
  const body = {
    model: opts.model,
    prompt: opts.prompt,
    stream: false,
    format: opts.format,
    options: {
      temperature: opts.temperature ?? 0,
      seed: opts.seed,
    },
  };

  const apiKey = opts.apiKey ?? process.env.OLLAMA_API_KEY;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const retries = opts.retries ?? 3;
  let lastErr: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        // 4xx errors won't fix themselves — fail fast with a clear message.
        if (res.status >= 400 && res.status < 500) {
          throw new OllamaClientError(res.status, opts.model, errText);
        }
        throw new Error(`Ollama returned ${res.status}: ${errText}`);
      }
      const data = (await res.json()) as {
        response: string;
        prompt_eval_count?: number;
        eval_count?: number;
        total_duration?: number;
      };
      return {
        text: data.response,
        promptTokens: data.prompt_eval_count ?? 0,
        responseTokens: data.eval_count ?? 0,
        totalDurationMs: Math.round((data.total_duration ?? 0) / 1_000_000),
      };
    } catch (err) {
      lastErr = err;
      if (err instanceof OllamaClientError) {
        // Non-retryable 4xx — propagate immediately.
        throw err;
      }
      const backoffMs = 500 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
  throw new Error(
    `Ollama call to ${opts.model} failed after ${retries} attempts: ${String(lastErr)}`,
  );
}

/**
 * Extract a JSON object from a model response. Tolerates surrounding prose
 * and fenced code blocks. Returns null if no parseable object is found.
 */
export function extractJson<T = unknown>(text: string): T | null {
  const trimmed = text.trim();
  const candidates: string[] = [];

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) candidates.push(fenceMatch[1].trim());

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }
  candidates.push(trimmed);

  for (const c of candidates) {
    try {
      return JSON.parse(c) as T;
    } catch {
      continue;
    }
  }
  return null;
}
