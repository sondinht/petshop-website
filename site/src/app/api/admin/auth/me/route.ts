import { NextRequest, NextResponse } from "next/server";
import { getCurrentBackofficeUser } from "@/src/server/auth/adminSession";

export async function GET(request: NextRequest) {
  const user = await getCurrentBackofficeUser(request);

  if (!user || user.status !== "ENABLED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  });
}
