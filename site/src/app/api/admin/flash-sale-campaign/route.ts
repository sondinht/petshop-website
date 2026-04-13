import { NextRequest, NextResponse } from "next/server";
import { requireBackofficeUser } from "@/src/server/auth/adminSession";
import { prisma } from "@/src/server/db/prisma";
import { FlashSaleDiscountType } from "@prisma/client";

function parseBody(input: unknown) {
  const body = input as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return { error: "Invalid payload" as const };
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const startAt = typeof body.startAt === "string" ? new Date(body.startAt) : null;
  const endAt = typeof body.endAt === "string" ? new Date(body.endAt) : null;
  const discountType: FlashSaleDiscountType =
    body.discountType === "FIXED_AMOUNT" ? "FIXED_AMOUNT" : "PERCENTAGE";
  const discountValueRaw = body.discountValue;
  const discountValue =
    discountValueRaw === undefined || discountValueRaw === null || discountValueRaw === ""
      ? null
      : Number(discountValueRaw);

  if (!name) {
    return { error: "Campaign name is required" as const };
  }

  if (!(startAt instanceof Date) || Number.isNaN(startAt.valueOf())) {
    return { error: "startAt is required" as const };
  }

  if (!(endAt instanceof Date) || Number.isNaN(endAt.valueOf())) {
    return { error: "endAt is required" as const };
  }

  if (endAt <= startAt) {
    return { error: "endAt must be after startAt" as const };
  }

  if (discountValue !== null && (!Number.isFinite(discountValue) || discountValue < 0)) {
    return { error: "discountValue must be a non-negative number" as const };
  }

  return {
    data: {
      name,
      startAt,
      endAt,
      discountType,
      discountValue
    }
  };
}

function parsePatchBody(input: unknown) {
  const body = input as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return { error: "Invalid payload" as const };
  }

  const data: {
    name?: string;
    startAt?: Date;
    endAt?: Date;
    discountType?: FlashSaleDiscountType;
    discountValue?: number | null;
    isActive?: boolean;
  } = {};

  if ("name" in body) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return { error: "Campaign name cannot be empty" as const };
    }
    data.name = name;
  }

  if ("startAt" in body) {
    const startAt = typeof body.startAt === "string" ? new Date(body.startAt) : null;
    if (!(startAt instanceof Date) || Number.isNaN(startAt.valueOf())) {
      return { error: "startAt must be a valid ISO datetime" as const };
    }
    data.startAt = startAt;
  }

  if ("endAt" in body) {
    const endAt = typeof body.endAt === "string" ? new Date(body.endAt) : null;
    if (!(endAt instanceof Date) || Number.isNaN(endAt.valueOf())) {
      return { error: "endAt must be a valid ISO datetime" as const };
    }
    data.endAt = endAt;
  }

  if ("discountType" in body) {
    if (body.discountType !== "PERCENTAGE" && body.discountType !== "FIXED_AMOUNT") {
      return { error: "discountType must be PERCENTAGE or FIXED_AMOUNT" as const };
    }
    data.discountType = body.discountType;
  }

  if ("discountValue" in body) {
    const discountValueRaw = body.discountValue;
    const discountValue =
      discountValueRaw === undefined || discountValueRaw === null || discountValueRaw === ""
        ? null
        : Number(discountValueRaw);

    if (discountValue !== null && (!Number.isFinite(discountValue) || discountValue < 0)) {
      return { error: "discountValue must be a non-negative number" as const };
    }

    data.discountValue = discountValue;
  }

  if ("isActive" in body) {
    if (typeof body.isActive !== "boolean") {
      return { error: "isActive must be a boolean" as const };
    }

    data.isActive = body.isActive;
  }

  if (Object.keys(data).length === 0) {
    return { error: "No fields to update" as const };
  }

  return { data };
}

async function getTargetCampaignId(request: NextRequest): Promise<string | null> {
  const explicitId = request.nextUrl.searchParams.get("id");
  if (explicitId) {
    return explicitId;
  }

  const activeCampaign = await prisma.flashSaleCampaign.findFirst({
    where: { isActive: true },
    orderBy: [{ startAt: "desc" }, { updatedAt: "desc" }],
    select: { id: true }
  });

  return activeCampaign?.id ?? null;
}

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && error.message === "UNAUTHORIZED";
}

export async function GET(request: NextRequest) {
  try {
    await requireBackofficeUser(request);

    const campaign = await prisma.flashSaleCampaign.findFirst({
      where: { isActive: true },
      orderBy: [{ startAt: "desc" }, { updatedAt: "desc" }]
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to load campaign" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireBackofficeUser(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = parseBody(body);

  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const campaign = await prisma.$transaction(async (tx) => {
      await tx.flashSaleCampaign.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });

      return tx.flashSaleCampaign.create({
        data: {
          name: parsed.data.name,
          startAt: parsed.data.startAt,
          endAt: parsed.data.endAt,
          discountType: parsed.data.discountType,
          discountValue: parsed.data.discountValue,
          isActive: true
        }
      });
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to save campaign" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireBackofficeUser(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaignId = await getTargetCampaignId(request);
  if (!campaignId) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = parsePatchBody(body);

  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const campaign = await prisma.$transaction(async (tx) => {
      const existing = await tx.flashSaleCampaign.findUnique({ where: { id: campaignId } });
      if (!existing) {
        throw new Error("CAMPAIGN_NOT_FOUND");
      }

      const nextStartAt = parsed.data.startAt ?? existing.startAt;
      const nextEndAt = parsed.data.endAt ?? existing.endAt;

      if (nextEndAt <= nextStartAt) {
        throw new Error("INVALID_DATE_RANGE");
      }

      if (parsed.data.isActive === true) {
        await tx.flashSaleCampaign.updateMany({
          where: { isActive: true, id: { not: campaignId } },
          data: { isActive: false }
        });
      }

      return tx.flashSaleCampaign.update({
        where: { id: campaignId },
        data: parsed.data
      });
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    if (error instanceof Error && error.message === "CAMPAIGN_NOT_FOUND") {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "INVALID_DATE_RANGE") {
      return NextResponse.json({ error: "endAt must be after startAt" }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to update campaign" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireBackofficeUser(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaignId = await getTargetCampaignId(request);
  if (!campaignId) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const hardDelete = request.nextUrl.searchParams.get("hard") === "true";

  try {
    const campaign = hardDelete
      ? await prisma.flashSaleCampaign.delete({ where: { id: campaignId } })
      : await prisma.flashSaleCampaign.update({
          where: { id: campaignId },
          data: { isActive: false }
        });

    return NextResponse.json({ campaign, deleted: hardDelete, deactivated: !hardDelete });
  } catch {
    return NextResponse.json({ error: "Unable to remove campaign" }, { status: 500 });
  }
}
