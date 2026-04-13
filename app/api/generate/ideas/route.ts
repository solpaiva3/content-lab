import { NextRequest, NextResponse } from "next/server";
import { generatePost, type PostGenerationInput } from "@/lib/ai/generate-post";
import { TEMPLATES } from "@/lib/ai/templates";
import type { GenerationMode } from "@/lib/ai/modes";

const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id; // educational-5

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const body = await req.json();
  const { client, userIdea, reference, mode, templateId } = body as {
    client: PostGenerationInput["client"];
    userIdea: string;
    reference?: string | null;
    mode?: GenerationMode;
    templateId?: string;
  };

  if (!client || !userIdea?.trim()) {
    return NextResponse.json({ error: "client and userIdea are required" }, { status: 400 });
  }

  const resolvedMode: GenerationMode =
    mode === "quality" || mode === "fast" ? mode : "quality";

  const resolvedTemplateId = templateId ?? DEFAULT_TEMPLATE_ID;

  try {
    const carousel = await generatePost({
      client,
      userIdea,
      reference: reference ?? null,
      mode: resolvedMode,
      templateId: resolvedTemplateId,
    });
    return NextResponse.json({ post: carousel });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate/ideas] error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
