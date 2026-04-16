import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const IMAGE_MIME_BY_EXT: Record<string, string> = {
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg":  "image/svg+xml",
};

const FONT_MIME_BY_EXT: Record<string, string> = {
  ".ttf":   "font/ttf",
  ".otf":   "font/otf",
  ".woff":  "font/woff",
  ".woff2": "font/woff2",
};

export async function POST(req: NextRequest) {
  console.log("[upload] POST received");

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    console.error("[upload] Failed to parse formData:", err);
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;

  if (!file) {
    console.error("[upload] No file in formData");
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const fileExt = "." + (file.name.split(".").pop() ?? "").toLowerCase();

  // Derive MIME type from extension when the browser doesn't supply one (common on mobile/prod)
  let mimeType = file.type && file.type !== "application/octet-stream"
    ? file.type
    : (IMAGE_MIME_BY_EXT[fileExt] ?? FONT_MIME_BY_EXT[fileExt] ?? "");

  console.log(`[upload] File: "${file.name}" | declared type: "${file.type}" | resolved type: "${mimeType}" | size: ${file.size} bytes`);

  const isImageFile = Object.values(IMAGE_MIME_BY_EXT).includes(mimeType);
  const isFontFile  = Object.values(FONT_MIME_BY_EXT).includes(mimeType);

  if (!isImageFile && !isFontFile) {
    console.error(`[upload] Rejected — unrecognised type: "${mimeType}" ext: "${fileExt}"`);
    return NextResponse.json(
      { error: `Unsupported file type: "${file.type || fileExt}". Use PNG, SVG, JPG or WOFF/TTF/OTF.` },
      { status: 400 }
    );
  }

  const maxSize = isFontFile ? 5 * 1024 * 1024 : 1 * 1024 * 1024; // 1 MB for images, 5 MB for fonts
  if (file.size > maxSize) {
    const limit = isFontFile ? "5 MB" : "1 MB";
    console.error(`[upload] Rejected — file too large: ${file.size} bytes (limit ${limit})`);
    return NextResponse.json(
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${limit}.` },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64  = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log(`[upload] OK — data URI: ${mimeType}, base64 length: ${base64.length} chars`);
    return NextResponse.json({ url: dataUrl, mimeType, size: file.size });
  } catch (err) {
    console.error("[upload] base64 conversion failed:", err);
    return NextResponse.json({ error: "Upload failed: could not process file" }, { status: 500 });
  }
}
