// Input transformation layer — organizes free-text user input before prompt construction.
// Heuristics only. No NLP dependency required.

export interface TransformedInput {
  raw: string;
  topic: string;
  tone: string | null;
  audience: string | null;
  intent: string | null;
  reference: string | null;
}

const TONE_MARKERS = [
  "funny", "humorous", "serious", "inspiring", "inspirational", "educational",
  "casual", "formal", "emotional", "playful", "bold", "elegant", "urgent",
  "warm", "empathetic", "provocative", "minimalist", "luxurious",
];

const AUDIENCE_PATTERNS = [
  /(?:for|targeting|aimed at|audience[:\s]+)([\w\s,]+?)(?:\.|,|$)/i,
  /(?:women|men|teens|professionals|entrepreneurs|mothers|parents|creators|founders)([\w\s]*)/i,
];

const INTENT_PATTERNS = [
  /(?:goal[:\s]+|objective[:\s]+|want to|trying to|to\s+)([\w\s]+?)(?:\.|,|$)/i,
  /(?:announce|promote|educate|inspire|sell|drive|increase|generate|build|launch|celebrate)([\w\s]+?)(?:\.|,|$)/i,
];

export function transformInput(raw: string, reference: string | null): TransformedInput {
  const text = raw.trim();

  // Topic: everything before the first sentence that mentions audience/intent,
  // or the full text if nothing is detected.
  const topic = text.split(/[.!?]/)[0]?.trim() || text;

  // Tone: scan for tone keywords
  const lower = text.toLowerCase();
  const tone = TONE_MARKERS.find((t) => lower.includes(t)) ?? null;

  // Audience: try patterns
  let audience: string | null = null;
  for (const pattern of AUDIENCE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      audience = match[0].trim();
      break;
    }
  }

  // Intent: try patterns
  let intent: string | null = null;
  for (const pattern of INTENT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      intent = match[0].trim();
      break;
    }
  }

  return {
    raw: text,
    topic,
    tone,
    audience,
    intent,
    reference: reference?.trim() || null,
  };
}
