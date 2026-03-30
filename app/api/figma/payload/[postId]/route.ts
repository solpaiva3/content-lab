import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { client: { select: { logoUrl: true, logoVariants: true } } },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404, headers: CORS_HEADERS });
  }

  // Resolve the best logo URL — prefer white/light variant for dark Figma frames
  let logoUrl: string | null = null;
  if (post.client.logoVariants) {
    try {
      const variants = JSON.parse(post.client.logoVariants);
      logoUrl = variants.light ?? variants.dark ?? null;
    } catch { /* ignore */ }
  }
  if (!logoUrl) logoUrl = post.client.logoUrl;

  // Make logo URL absolute so the Figma plugin can fetch it
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const absoluteLogoUrl = logoUrl
    ? logoUrl.startsWith("http") ? logoUrl : `${baseUrl}${logoUrl}`
    : null;

  return NextResponse.json(
    {
      title: post.title,
      subtitle: post.subtitle,
      body: post.body,
      logoUsage: post.logoUsage,
      logoUrl: absoluteLogoUrl,
    },
    { headers: CORS_HEADERS }
  );
}
