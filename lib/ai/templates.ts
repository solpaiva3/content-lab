import type { SlideType } from "@/types";

// ── Slide layout hints ────────────────────────────────────────────────────────
// Used by CarouselPreview to render each slide appropriately.
// Does NOT control copy — only visual weight and field visibility.

export type SlideLayout = "title-only" | "title-subtitle" | "title-body" | "title-body-large";

export interface SlideDefinition {
  type: SlideType;
  label: string;
  layout: SlideLayout;
  instruction: string; // what the AI should write for this slide (kept in English for AI quality)
}

// ── Template ──────────────────────────────────────────────────────────────────

export interface CarouselTemplate {
  id: string;
  name: string;
  description: string;
  slides: SlideDefinition[];
  narrativeGoal: string; // top-level instruction displayed in the UI
}

// ── Template definitions ──────────────────────────────────────────────────────

export const TEMPLATES: CarouselTemplate[] = [
  {
    id: "educational-5",
    name: "Educativo",
    description: "Ensine algo valioso em 5 etapas claras.",
    narrativeGoal:
      "Eduque o público sobre um tema guiando-os por uma narrativa clara e lógica — da atenção ao entendimento e à ação.",
    slides: [
      {
        type: "hook",
        label: "Gancho",
        layout: "title-subtitle",
        instruction:
          "A bold, attention-grabbing title that states what the audience will learn or why it matters. Add a one-line subtitle that reinforces curiosity.",
      },
      {
        type: "context",
        label: "Contexto",
        layout: "title-body",
        instruction:
          "Set the scene. Explain why this topic is relevant now, or what situation the audience is likely in. 1–2 sentences.",
      },
      {
        type: "problem",
        label: "Problema",
        layout: "title-body",
        instruction:
          "Name the challenge, misconception, or gap in knowledge. Make the audience feel seen. 1–2 sentences.",
      },
      {
        type: "insight",
        label: "Insight",
        layout: "title-body-large",
        instruction:
          "Deliver the core lesson or value. This is the most important slide — be specific, actionable, and on-brand. 2–3 sentences.",
      },
      {
        type: "cta",
        label: "CTA",
        layout: "title-body",
        instruction:
          "Close with a clear call to action. Direct the audience to follow, save, share, or take a next step.",
      },
    ],
  },

  {
    id: "provocative-3",
    name: "Provocativo",
    description: "Desafie ideias preconcebidas e provoque uma reação em 3 slides.",
    narrativeGoal:
      "Provoque o público desafiando uma crença comum — crie tensão e resolva-a com um ponto de vista forte.",
    slides: [
      {
        type: "hook",
        label: "Gancho",
        layout: "title-subtitle",
        instruction:
          "An unexpected, counter-intuitive, or bold statement that challenges the status quo. Short and punchy. Subtitle adds a small twist or question.",
      },
      {
        type: "problem",
        label: "Tensão",
        layout: "title-body-large",
        instruction:
          "Develop the tension. Why does the common belief fail? What's the real truth? Be direct and confident. 2–3 sentences.",
      },
      {
        type: "cta",
        label: "CTA",
        layout: "title-body",
        instruction:
          "Land the point with conviction. Give the audience something to think about, agree with, or act on. Can be a question or a challenge.",
      },
    ],
  },

  {
    id: "storytelling-6",
    name: "Storytelling",
    description: "Conte uma história em 6 slides — da tensão à resolução.",
    narrativeGoal:
      "Leve o público em uma jornada narrativa: apresente um mundo, introduza o conflito e resolva-o com a perspectiva da marca.",
    slides: [
      {
        type: "hook",
        label: "Gancho",
        layout: "title-subtitle",
        instruction:
          "Open the story with a vivid scene or relatable moment. Short title, subtitle that drops the audience into the situation.",
      },
      {
        type: "context",
        label: "Contexto",
        layout: "title-body",
        instruction:
          "Establish the world of the story. Who is this about? What's the starting situation? 1–2 sentences.",
      },
      {
        type: "problem",
        label: "Problema",
        layout: "title-body",
        instruction:
          "Introduce the conflict or obstacle. What goes wrong, what's missing, or what challenge arises? 1–2 sentences.",
      },
      {
        type: "insight",
        label: "Virada",
        layout: "title-body",
        instruction:
          "The turning point. Something changes — a realization, decision, or discovery. This is the pivot of the story. 1–2 sentences.",
      },
      {
        type: "insight",
        label: "Resolução",
        layout: "title-body-large",
        instruction:
          "How the story ends. What changed, what was achieved, or what was learned. Tie back to the brand. 2–3 sentences.",
      },
      {
        type: "cta",
        label: "CTA",
        layout: "title-body",
        instruction:
          "Invite the audience to take the next step. Connect the story to an action — follow, save, shop, join, or reflect.",
      },
    ],
  },
];

export const TEMPLATES_BY_ID: Record<string, CarouselTemplate> = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t])
);

export function getTemplate(id: string): CarouselTemplate {
  const t = TEMPLATES_BY_ID[id];
  if (!t) {
    const valid = TEMPLATES.map((t) => `"${t.id}"`).join(", ");
    throw new Error(`Template not found: "${id}". Valid options: ${valid}`);
  }
  return t;
}
