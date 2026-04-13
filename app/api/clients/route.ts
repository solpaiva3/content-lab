import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, sector, toneOfVoice, personality, pillars, toneNotes, colors, fonts, fontFiles, logoUrl, logoVariants } = body;

  if (!name || !sector) {
    return NextResponse.json({ error: "name and sector are required" }, { status: 400 });
  }

  const client = await prisma.client.create({
    data: {
      name,
      sector,
      toneOfVoice: toneOfVoice ?? null,
      personality: personality ?? "",
      pillars: pillars ?? "",
      toneNotes: toneNotes ?? null,
      colors: JSON.stringify(colors ?? []),
      fonts: JSON.stringify(fonts ?? { primary: "", secondary: "" }),
      fontFiles: fontFiles ? JSON.stringify(fontFiles) : null,
      logoUrl: logoUrl ?? null,
      logoVariants: logoVariants ? JSON.stringify(logoVariants) : null,
    },
  });

  return NextResponse.json(client, { status: 201 });
}
