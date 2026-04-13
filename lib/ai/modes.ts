// Generation mode abstraction — never expose model names to the user or UI

export type GenerationMode = "fast" | "quality";

const MODELS: Record<GenerationMode, string> = {
  fast: "gpt-4o-mini",  // low cost, high throughput
  quality: "gpt-4o",    // better writing, more nuanced
};

const MAX_TOKENS: Record<GenerationMode, number> = {
  fast: 800,
  quality: 1200,
};

export function resolveModel(mode: GenerationMode): string {
  return MODELS[mode];
}

export function resolveMaxTokens(mode: GenerationMode): number {
  return MAX_TOKENS[mode];
}
