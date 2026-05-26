import seedrandom from "seedrandom";

export type Rng = () => number;

export function makeRng(seed: number | string): Rng {
  return seedrandom(String(seed));
}

export function shuffled<T>(arr: T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
