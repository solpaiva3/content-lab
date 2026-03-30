import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
  }

  const { client, idea } = await req.json();

  if (!client || !idea) {
    return NextResponse.json({ error: "client and idea are required" }, { status: 400 });
  }

  const personality: string[] = JSON.parse(client.personality || "[]");
  const pillars: string[] = JSON.parse(client.pillars || "[]");

  const keyPoints = [idea.characteristic1, idea.characteristic2, idea.characteristic3]
    .filter(Boolean)
    .join(" ");

  const prompt = `Based on this approved idea, generate the complete post content:

Idea: ${idea.title}
Original concept: ${idea.userIdea}
Key points: ${keyPoints}
Client brand context:
- Client: ${client.name}
- Industry: ${client.sector}
- Brand personality: ${personality.join(", ")}
- Content pillars: ${pillars.join(", ")}
- Tone of voice: ${client.toneNotes || "not specified"}

Return ONLY JSON with:
- title: final title
- subtitle: subtitle (refined hook)
- body: full post copy (Instagram caption, with natural line breaks)
- visualDescription: detailed description of the image/scene for the designer
- logoUsage: logo usage instruction for the post (e.g. "logo in the bottom right corner, white version")`;

  let raw: string;
  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    const block = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    raw = block?.text ?? "";
    console.log("[generate/post] raw Anthropic response:", raw);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate/post] Anthropic API error:", message);
    return NextResponse.json({ error: `Anthropic API error: ${message}` }, { status: 502 });
  }

  if (!raw.trim()) {
    console.error("[generate/post] Anthropic returned empty content");
    return NextResponse.json({ error: "Anthropic returned an empty response" }, { status: 502 });
  }

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  try {
    const post = JSON.parse(cleaned);
    return NextResponse.json({ post });
  } catch {
    console.error("[generate/post] Failed to parse response as JSON:", raw);
    return NextResponse.json({ error: "Failed to parse AI response", raw }, { status: 500 });
  }
}
