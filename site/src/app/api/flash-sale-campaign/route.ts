import { NextResponse } from "next/server";
import { prisma } from "@/src/server/db/prisma";

export async function GET() {
  const now = new Date();

  const activeCampaign = await prisma.flashSaleCampaign.findFirst({
    where: {
      isActive: true,
      startAt: { lte: now },
      endAt: { gt: now }
    },
    orderBy: [{ startAt: "desc" }, { updatedAt: "desc" }]
  });

  if (activeCampaign) {
    return NextResponse.json({ campaign: activeCampaign });
  }

  const nextCampaign = await prisma.flashSaleCampaign.findFirst({
    where: {
      isActive: true,
      startAt: { gt: now }
    },
    orderBy: [{ startAt: "asc" }, { updatedAt: "desc" }]
  });

  return NextResponse.json({ campaign: nextCampaign });
}
