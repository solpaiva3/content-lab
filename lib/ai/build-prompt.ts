// Prompt builder — constructs minimal, intentional prompts from brand context + transformed input.
// Template drives slide count, types, and per-slide instructions.

import type { TransformedInput } from "./transform-input";
import type { CarouselTemplate } from "./templates";

interface BrandContext {
  name: string;
  sector: string;
  toneOfVoice: string | null;
  personality: string | null;
  pillars: string | null;
  toneNotes: string | null;
}

function extractConstraints(toneNotes: string | null): string | null {
  if (!toneNotes) return null;
  const sentences = toneNotes.split(/[.!?]/).map((s) => s.trim()).filter(Boolean);
  const constraints = sentences.filter((s) =>
    /avoid|never|don't|do not|always|must|should not/i.test(s)
  );
  return constraints.length > 0 ? constraints.join(". ") : null;
}

function buildBrandBlock(brand: BrandContext): string {
  const lines: string[] = [`BRAND: ${brand.name} (${brand.sector})`];
  if (brand.toneOfVoice) lines.push(`TONE: ${brand.toneOfVoice}`);
  if (brand.personality) lines.push(`PERSONALITY: ${brand.personality}`);
  if (brand.pillars) {
    const pillars = brand.pillars.split(",").map((p) => p.trim()).filter(Boolean).slice(0, 3);
    if (pillars.length > 0) lines.push(`CONTENT PILLARS: ${pillars.join(", ")}`);
  }
  const constraints = extractConstraints(brand.toneNotes);
  if (constraints) lines.push(`CONSTRAINTS: ${constraints}`);
  return lines.join("\n");
}

function buildIntentBlock(input: TransformedInput): string {
  const lines: string[] = [`TOPIC: ${input.topic}`];
  if (input.tone) lines.push(`DESIRED TONE: ${input.tone}`);
  if (input.audience) lines.push(`AUDIENCE: ${input.audience}`);
  if (input.intent) lines.push(`GOAL: ${input.intent}`);
  if (input.raw !== input.topic) lines.push(`FULL BRIEF: ${input.raw}`);
  return lines.join("\n");
}

function buildSlideSchema(template: CarouselTemplate): string {
  return template.slides
    .map((slide, i) => {
      const fields: string[] = [`"type": "${slide.type}"`, `"title": "..."`];
      if (slide.layout === "title-subtitle") fields.push(`"subtitle": "..."`);
      if (slide.layout === "title-body" || slide.layout === "title-body-large") fields.push(`"body": "..."`);
      return `    { ${fields.join(", ")} }  // Slide ${i + 1} — ${slide.label}: ${slide.instruction}`;
    })
    .join(",\n");
}

export function buildCarouselPrompt(
  brand: BrandContext,
  input: TransformedInput,
  template: CarouselTemplate
): string {
  const referenceBlock = input.reference
    ? `\nREFERENCE (use as tone/style inspiration — do NOT copy):\n${input.reference}\n`
    : "";

  const slideSchema = buildSlideSchema(template);

  return `You are a senior creative copywriter building Instagram carousel content.

NARRATIVE GOAL: ${template.narrativeGoal}

Generate a ${template.slides.length}-slide carousel following the exact structure below.
Each slide has a specific role — follow the per-slide instructions precisely.
Follow the brand voice strictly. Be specific, not generic.
${referenceBlock}
---
${buildBrandBlock(brand)}
---
${buildIntentBlock(input)}
---

Return ONLY valid JSON — no markdown, no explanation.
Each slide MUST appear in the exact order shown. Do NOT add or remove slides.

{
  "slides": [
${slideSchema}
  ],
  "caption": "Full Instagram caption with clear CTA and 5–8 relevant hashtags.",
  "visualDescription": "Visual direction for the whole carousel: composition, mood, lighting, color, style. For the designer.",
  "logoUsage": "One sentence on logo placement and treatment across the carousel."
}`;
}
