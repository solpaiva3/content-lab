import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const variant = (formData.get("variant") as string) || "main";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const imageTypes = ["image/png", "image/svg+xml", "image/jpeg"];
  const fontExtensions = [".ttf", ".otf", ".woff", ".woff2"];
  const fileExt = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  const isFontFile = fontExtensions.includes(fileExt);
  const isImageFile = imageTypes.includes(file.type);

  if (!isImageFile && !isFontFile) {
    return NextResponse.json({ error: "Invalid file type. Images (PNG, SVG, JPG) or fonts (TTF, OTF, WOFF, WOFF2) only." }, { status: 400 });
  }

  const maxSize = isFontFile ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: `File too large. Max ${isFontFile ? "5MB" : "2MB"}.` }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const ext = file.name.split(".").pop();
  const filename = `${Date.now()}-${variant}.${ext}`;
  const filepath = path.join(uploadsDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
