import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Loads the immutable "Core identity" section + the initial "Current state — Week 0"
 * section from a persona markdown file under `corpus/agents/`.
 *
 * Returns the prose text for each, exactly as it appears in the file (heading-stripped).
 */
export type LoadedPersona = {
  coreIdentity: string;
  initialCurrentState: string;
};

const CORE_HEADING = "## Core identity (immutable)";
const WEEK_ZERO_HEADING = "## Current state — Week 0 (initial)";

/** Reads a persona file by slot+name, e.g. ("V1", "eda"). */
export async function loadPersona(
  corpusPath: string,
  slot: string,
  name: string,
): Promise<LoadedPersona> {
  const fileName = `${slot}-${name.toLowerCase().replace(/\s+/g, "-")}.md`;
  const path = join(corpusPath, "agents", fileName);
  const content = await readFile(path, "utf-8");

  const coreIdentity = extractSection(content, CORE_HEADING);
  const initialCurrentState = extractSection(content, WEEK_ZERO_HEADING);

  if (!coreIdentity) {
    throw new Error(`Missing "${CORE_HEADING}" section in ${path}`);
  }
  if (!initialCurrentState) {
    throw new Error(`Missing "${WEEK_ZERO_HEADING}" section in ${path}`);
  }

  return { coreIdentity, initialCurrentState };
}

function extractSection(content: string, heading: string): string | null {
  const idx = content.indexOf(heading);
  if (idx === -1) return null;
  const after = content.slice(idx + heading.length);
  // Find the next H2 (## ) header or EOF.
  const nextHeader = after.search(/\n## [^\n]/);
  const body = nextHeader === -1 ? after : after.slice(0, nextHeader);
  return body.trim();
}
