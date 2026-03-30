export interface Client {
  id: string;
  name: string;
  sector: string;
  personality: string; // JSON string
  pillars: string; // JSON string
  toneNotes: string | null;
  colors: string; // JSON string
  fonts: string; // JSON string: { primary: string, secondary: string }
  logoUrl: string | null;
  logoVariants: string | null; // JSON string: { light?: string, dark?: string }
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ParsedClient extends Omit<Client, "personality" | "pillars" | "colors" | "fonts" | "logoVariants"> {
  personality: string[];
  pillars: string[];
  colors: string[];
  fonts: { primary: string; secondary: string };
  logoVariants: { light?: string; dark?: string } | null;
}

export interface Idea {
  id: string;
  userIdea: string; // the user's original input
  title: string;
  characteristic1: string;
  characteristic2: string;
  characteristic3: string | null;
  status: "pending" | "approved" | "rejected";
}

export interface StructuredPost {
  title: string;
  subtitle: string;
  body: string;
  visualDescription: string;
  logoUsage: string;
}

export function parseClient(client: Client): ParsedClient {
  return {
    ...client,
    personality: JSON.parse(client.personality || "[]"),
    pillars: JSON.parse(client.pillars || "[]"),
    colors: JSON.parse(client.colors || "[]"),
    fonts: JSON.parse(client.fonts || '{"primary":"","secondary":""}'),
    logoVariants: client.logoVariants ? JSON.parse(client.logoVariants) : null,
  };
}
