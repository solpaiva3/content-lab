import { NextRequest, NextResponse } from "next/server";
import { generatePost, type PostGenerationInput } from "@/lib/ai/generate-post";
import { TEMPLATES, TEMPLATES_BY_ID } from "@/lib/ai/templates";
import type { GenerationMode } from "@/lib/ai/modes";

const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id; // educational-5

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  let body: {
    client: PostGenerationInput["client"];
    userIdea: string;
    reference?: string | null;
    mode?: GenerationMode;
    templateId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { client, userIdea, reference, mode, templateId } = body;

  if (!client || !userIdea?.trim()) {
    return NextResponse.json({ error: "client and userIdea are required" }, { status: 400 });
  }

  const resolvedMode: GenerationMode =
    mode === "quality" || mode === "fast" ? mode : "quality";

  // Validate templateId — reject unknown values explicitly, no silent fallback
  const resolvedTemplateId = templateId ?? DEFAULT_TEMPLATE_ID;
  console.log(`[generate/ideas] templateId received: "${templateId}" → resolved: "${resolvedTemplateId}", mode: ${resolvedMode}`);

  if (!TEMPLATES_BY_ID[resolvedTemplateId]) {
    const valid = Object.keys(TEMPLATES_BY_ID).join(", ");
    console.error(`[generate/ideas] invalid templateId: "${resolvedTemplateId}". Valid: ${valid}`);
    return NextResponse.json(
      { error: `Template not found. Please select a valid template. (received: "${resolvedTemplateId}")` },
      { status: 400 }
    );
  }

  try {
    const carousel = await generatePost({
      client,
      userIdea,
      reference: reference ?? null,
      mode: resolvedMode,
      templateId: resolvedTemplateId,
    });
    console.log(`[generate/ideas] success — templateId: "${resolvedTemplateId}", slides: ${carousel.slides.length}`);
    return NextResponse.json({ post: carousel });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[generate/ideas] error (templateId: "${resolvedTemplateId}"):`, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
