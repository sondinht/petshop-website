import type { ProductCategory } from "./catalog";
import { prisma } from "./db/prisma";

export type AdminProductInput = {
  name: string;
  price: number;
  category: string;
  image: string;
  sku?: string | null;
  description?: string | null;
  brand?: string | null;
  stockQty?: number | null;
};

export type AdminProductPatchInput = Partial<AdminProductInput>;

export async function listProducts(category?: ProductCategory) {
  return prisma.product.findMany({
    where: category ? { category } : undefined
  });
}

export async function getProductById(productId: string) {
  return prisma.product.findUnique({
    where: { id: productId }
  });
}

export async function listAdminProducts() {
  return prisma.product.findMany({
    orderBy: { updatedAt: "desc" }
  });
}

export async function createProduct(input: AdminProductInput) {
  return prisma.product.create({
    data: {
      name: input.name,
      price: input.price,
      category: input.category,
      image: input.image,
      sku: input.sku ?? null,
      description: input.description ?? null,
      brand: input.brand ?? null,
      stockQty: input.stockQty ?? null
    }
  });
}

export async function patchProduct(productId: string, input: AdminProductPatchInput) {
  return prisma.product.update({
    where: { id: productId },
    data: {
      name: input.name,
      price: input.price,
      category: input.category,
      image: input.image,
      sku: input.sku,
      description: input.description,
      brand: input.brand,
      stockQty: input.stockQty
    }
  });
}

export async function deleteProduct(productId: string) {
  return prisma.product.delete({
    where: { id: productId }
  });
}
