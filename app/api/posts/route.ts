import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { clientId, post } = await req.json();

  if (!clientId || !post) {
    return NextResponse.json({ error: "clientId and post are required" }, { status: 400 });
  }

  const saved = await prisma.post.create({
    data: {
      clientId,
      title: post.title,
      subtitle: post.subtitle,
      body: post.body,
      visualDescription: post.visualDescription,
      logoUsage: post.logoUsage,
    },
  });

  return NextResponse.json({ id: saved.id }, { status: 201 });
}
