import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CarouselSlide } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId   = searchParams.get("clientId")   ?? undefined;
  const templateId = searchParams.get("templateId") ?? undefined;

  const posts = await prisma.post.findMany({
    where: {
      ...(clientId   ? { clientId }   : {}),
      ...(templateId ? { templateId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { client: { select: { id: true, name: true, sector: true } } },
  });

  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  try {
    const { clientId, post, templateId } = await req.json();

    if (!clientId || !post) {
      return NextResponse.json({ error: "clientId and post are required" }, { status: 400 });
    }

    const slides: CarouselSlide[] = Array.isArray(post.slides) ? post.slides : [];

    const hookSlide    = slides.find((s) => s.type === "hook") ?? slides[0];
    const insightSlide = slides.find((s) => s.type === "insight") ?? slides[slides.length - 2] ?? slides[0];

    const saved = await prisma.post.create({
      data: {
        clientId,
        templateId: templateId ?? "",
        slides: JSON.stringify(slides),
        title:    hookSlide?.title    ?? "",
        subtitle: hookSlide?.subtitle ?? hookSlide?.body ?? "",
        body:     insightSlide?.body  ?? insightSlide?.title ?? "",
        caption:  post.caption  ?? "",
        visualDescription: post.visualDescription ?? "",
        logoUsage: post.logoUsage ?? "",
      },
    });

    return NextResponse.json({ id: saved.id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/posts] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
