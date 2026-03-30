import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;

  const post = await prisma.post.findUnique({ where: { id: postId } });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({
    title: post.title,
    subtitle: post.subtitle,
    body: post.body,
    logoUsage: post.logoUsage,
  });
}
