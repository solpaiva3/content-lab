// Main generation orchestrator: input → transform → prompt → AI → validated carousel

import { openai } from "@/lib/openai";
import { resolveModel, resolveMaxTokens, type GenerationMode } from "./modes";
import { transformInput } from "./transform-input";
import { buildCarouselPrompt } from "./build-prompt";
import { getTemplate, type CarouselTemplate } from "./templates";
import type { CarouselSlide, GeneratedCarousel, SlideType } from "@/types";

export interface PostGenerationInput {
  client: {
    name: string;
    sector: string;
    toneOfVoice: string | null;
    personality: string | null;
    pillars: string | null;
    toneNotes: string | null;
  };
  userIdea: string;
  reference: string | null;
  mode: GenerationMode;
  templateId: string;
}

const VALID_SLIDE_TYPES: SlideType[] = ["hook", "context", "problem", "insight", "cta"];

function validateSlides(raw: unknown[], template: CarouselTemplate): CarouselSlide[] {
  const slides: CarouselSlide[] = raw
    .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
    .map((s, i) => {
      // Use template's declared type as fallback if AI drifts
      const expectedType = template.slides[i]?.type;
      const type = VALID_SLIDE_TYPES.includes(s.type as SlideType)
        ? (s.type as SlideType)
        : (expectedType ?? "context");

      return {
        type,
        title: String(s.title ?? ""),
        subtitle: s.subtitle ? String(s.subtitle) : undefined,
        body: s.body ? String(s.body) : undefined,
      };
    })
    .filter((s) => s.title.length > 0);

  if (slides.length === 0) throw new Error("AI returned no valid slides");
  return slides;
}

export async function generatePost(input: PostGenerationInput): Promise<GeneratedCarousel> {
  const template: CarouselTemplate = getTemplate(input.templateId);
  const transformed = transformInput(input.userIdea, input.reference);
  const prompt = buildCarouselPrompt(input.client, transformed, template);
  const model = resolveModel(input.mode);
  // Scale token budget to slide count: ~200 tokens per slide + overhead
  const baseTokens = resolveMaxTokens(input.mode);
  const maxTokens = Math.max(baseTokens, template.slides.length * 200 + 400);

  let raw: string;
  try {
    const response = await openai.chat.completions.create({
      model,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });
    raw = response.choices[0]?.message?.content ?? "";
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`AI request failed: ${message}`);
  }

  if (!raw.trim()) throw new Error("AI returned an empty response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse AI response as JSON. Raw: ${raw.slice(0, 200)}`);
  }

  const data = parsed as Record<string, unknown>;

  if (!Array.isArray(data.slides) || data.slides.length === 0) {
    throw new Error("AI response missing required field: slides");
  }

  const slides = validateSlides(data.slides, template);

  return {
    slides,
    caption: String(data.caption ?? ""),
    visualDescription: String(data.visualDescription ?? ""),
    logoUsage: String(data.logoUsage ?? ""),
  };
}
