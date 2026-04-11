import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/src/server/auth/adminSession";

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin(request);

  if (!admin || admin.status !== "ENABLED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: admin.id,
      email: admin.email,
      role: admin.role
    }
  });
}
