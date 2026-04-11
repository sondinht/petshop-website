import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/src/server/auth/adminSession";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  return clearAdminSessionCookie(response);
}
