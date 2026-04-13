import { prisma } from "./db/prisma";

type ReviewRow = {
  id: string;
  productId: string | null;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  createdAt: Date;
};

function toReviewView(review: ReviewRow, source: "product" | "store") {
  return {
    id: review.id,
    productId: review.productId,
    rating: review.rating,
    title: review.title,
    body: review.body,
    authorName: review.authorName,
    createdAt: review.createdAt,
    source
  };
}

function normalizeLimit(limit: number | undefined, fallback = 8): number {
  if (!Number.isInteger(limit) || (limit as number) <= 0) {
    return fallback;
  }

  return Math.min(limit as number, 30);
}

export async function listStoreReviews(limit?: number) {
  const rows = await prisma.review.findMany({
    where: {
      enabled: true,
      productId: null
    },
    take: normalizeLimit(limit),
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      productId: true,
      rating: true,
      title: true,
      body: true,
      authorName: true,
      createdAt: true
    }
  });

  return {
    source: "store" as const,
    reviews: rows.map((row) => toReviewView(row, "store"))
  };
}

export async function listReviewsForProductOrFallback(productId: string, limit?: number) {
  const take = normalizeLimit(limit);
  const productRows = await prisma.review.findMany({
    where: {
      enabled: true,
      productId
    },
    take,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      productId: true,
      rating: true,
      title: true,
      body: true,
      authorName: true,
      createdAt: true
    }
  });

  if (productRows.length > 0) {
    return {
      source: "product" as const,
      reviews: productRows.map((row) => toReviewView(row, "product"))
    };
  }

  return listStoreReviews(take);
}
