import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
  }

  const { client, userIdea } = await req.json();

  if (!client || !userIdea) {
    return NextResponse.json({ error: "client and userIdea are required" }, { status: 400 });
  }

  const personality: string[] = JSON.parse(client.personality || "[]");
  const pillars: string[] = JSON.parse(client.pillars || "[]");

  const prompt = `You are an Instagram content strategist. Based on the post idea and client brand context below, generate structured post content.

Client: ${client.name}
Industry: ${client.sector}
Brand personality: ${personality.join(", ")}
Content pillars: ${pillars.join(", ")}
Tone of voice: ${client.toneNotes || "not specified"}

Post idea: ${userIdea}

Return ONLY a JSON object with:
- title: short impactful title (max 8 words)
- characteristic1: first key message or content point (1-2 sentences)
- characteristic2: second key message or content point (1-2 sentences)
- characteristic3: third key message or content point (1-2 sentences) — only if it adds value, otherwise return null

No markdown, no extra text. Valid JSON only.`;

  let raw: string;
  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const block = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    raw = block?.text ?? "";
    console.log("[generate/ideas] raw response:", raw);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate/ideas] API error:", message);
    return NextResponse.json({ error: `API error: ${message}` }, { status: 502 });
  }

  if (!raw.trim()) {
    return NextResponse.json({ error: "API returned an empty response" }, { status: 502 });
  }

  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  try {
    const post = JSON.parse(cleaned);
    return NextResponse.json({ post });
  } catch {
    console.error("[generate/ideas] Failed to parse JSON:", raw);
    return NextResponse.json({ error: "Failed to parse AI response", raw }, { status: 500 });
  }
}
