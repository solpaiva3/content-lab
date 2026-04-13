import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const { visualDescription, clientName } = await req.json();

  if (!visualDescription) {
    return NextResponse.json({ error: "visualDescription is required" }, { status: 400 });
  }

  const prompt = `Instagram post visual for ${clientName || "a brand"}. ${visualDescription}. High quality, professional photography style, clean composition, suitable for social media.`;

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    });

    const image = response?.data?.[0];

    if (!image) {
      return NextResponse.json({ error: "No image returned from OpenAI" }, { status: 500 });
    }

    // Prefer url; fall back to b64_json as a data URI
    const url = image.url ?? (
      image.b64_json ? `data:image/png;base64,${image.b64_json}` : null
    );

    if (!url) {
      return NextResponse.json({ error: "OpenAI returned an image with no url or b64_json" }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate/image] OpenAI error:", message);
    return NextResponse.json({ error: `Image generation error: ${message}` }, { status: 502 });
  }
}
