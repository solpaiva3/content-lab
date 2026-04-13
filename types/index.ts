// ── Client ────────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  sector: string;
  personality: string;
  pillars: string;
  toneNotes: string | null;
  toneOfVoice: string | null;
  colors: string;       // JSON string
  fonts: string;        // JSON string: { primary: string, secondary: string }
  fontFiles: string | null; // JSON string: { primary?: string, secondary?: string }
  logoUrl: string | null;
  logoVariants: string | null; // JSON string: { light?: string, dark?: string }
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ParsedClient extends Omit<Client, "colors" | "fonts" | "fontFiles" | "logoVariants"> {
  colors: string[];
  fonts: { primary: string; secondary: string };
  fontFiles: { primary?: string; secondary?: string } | null;
  logoVariants: { light?: string; dark?: string } | null;
}

// ── Carousel ──────────────────────────────────────────────────────────────────

export type SlideType = "hook" | "context" | "problem" | "insight" | "cta";

export type { CarouselTemplate, SlideDefinition, SlideLayout } from "@/lib/ai/templates";

export interface CarouselSlide {
  type: SlideType;
  title: string;
  subtitle?: string; // optional — mainly on hook
  body?: string;     // optional — absent on hook
}

export interface GeneratedCarousel {
  slides: CarouselSlide[];
  caption: string;          // Instagram caption — UI only, not sent to Figma
  visualDescription: string;
  logoUsage: string;
}

// ── Idea (holds a generated carousel pending approval) ────────────────────────

export interface Idea {
  id: string;
  userIdea: string;
  slides: CarouselSlide[];
  caption: string;
  visualDescription: string;
  logoUsage: string;
  status: "pending" | "approved" | "rejected";
}

// ── StructuredPost (approved carousel saved to DB / sent to Figma) ────────────

export interface StructuredPost {
  slides: CarouselSlide[];
  caption: string;
  visualDescription: string;
  logoUsage: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseStringOrArray(val: string): string[] {
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    return [String(parsed)].filter(Boolean);
  } catch {
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

export function parseClient(client: Client): ParsedClient {
  return {
    ...client,
    colors: JSON.parse(client.colors || "[]"),
    fonts: JSON.parse(client.fonts || '{"primary":"","secondary":""}'),
    fontFiles: client.fontFiles ? JSON.parse(client.fontFiles) : null,
    logoVariants: client.logoVariants ? JSON.parse(client.logoVariants) : null,
  };
}

export function parseClientPersonality(client: Client): string[] {
  return parseStringOrArray(client.personality || "");
}

export function parseClientPillars(client: Client): string[] {
  return parseStringOrArray(client.pillars || "");
}
