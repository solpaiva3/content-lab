import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { client: { select: { id: true, name: true, sector: true, logoUrl: true, logoVariants: true } } },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // Accept slides (array → serialized), caption, visualDescription, logoUsage
  const slides = Array.isArray(body.slides) ? body.slides : undefined;

  // Re-derive legacy flat fields from updated slides for Figma compat
  let title: string | undefined;
  let subtitle: string | undefined;
  let bodyText: string | undefined;

  if (slides) {
    const hookSlide    = slides.find((s: { type: string }) => s.type === "hook") ?? slides[0];
    const insightSlide = slides.find((s: { type: string }) => s.type === "insight") ?? slides[slides.length - 2] ?? slides[0];
    title    = hookSlide?.title    ?? "";
    subtitle = hookSlide?.subtitle ?? hookSlide?.body ?? "";
    bodyText = insightSlide?.body  ?? insightSlide?.title ?? "";
  }

  try {
    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...(slides !== undefined && {
          slides:   JSON.stringify(slides),
          title:    title    ?? "",
          subtitle: subtitle ?? "",
          body:     bodyText ?? "",
        }),
        ...(body.caption            !== undefined && { caption:           body.caption }),
        ...(body.visualDescription  !== undefined && { visualDescription: body.visualDescription }),
        ...(body.logoUsage          !== undefined && { logoUsage:         body.logoUsage }),
      },
    });
    return NextResponse.json({ id: updated.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
