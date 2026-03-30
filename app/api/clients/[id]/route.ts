import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const client = await prisma.client.update({
    where: { id },
    data: {
      ...body,
      personality: body.personality ? JSON.stringify(body.personality) : undefined,
      pillars: body.pillars ? JSON.stringify(body.pillars) : undefined,
      colors: body.colors ? JSON.stringify(body.colors) : undefined,
      fonts: body.fonts ? JSON.stringify(body.fonts) : undefined,
      logoVariants: body.logoVariants ? JSON.stringify(body.logoVariants) : undefined,
    },
  });
  return NextResponse.json(client);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
