import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function computeToken(secret: string): string {
  return createHmac("sha256", secret).update("auth").digest("hex");
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const validEmail    = process.env.ADMIN_EMAIL;
  const validPassword = process.env.ADMIN_PASSWORD;
  const secret        = process.env.AUTH_SECRET;

  if (!validEmail || !validPassword || !secret) {
    return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
  }

  if (email !== validEmail || password !== validPassword) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const token = computeToken(secret);
  const res   = NextResponse.json({ ok: true });

  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
