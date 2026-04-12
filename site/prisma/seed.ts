import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedProducts } from "./seedData/products";

const prisma = new PrismaClient();

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=800&q=80";

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for seeding`);
  }

  return value;
}

function optionalEnv(name: string): string | null {
  const value = process.env[name];

  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

async function main() {
  for (const product of seedProducts) {
    const normalizedImages = Array.from(
      new Set(
        (Array.isArray(product.images) ? product.images : [product.image])
          .map((image) => (typeof image === "string" ? image.trim() : ""))
          .filter((image) => image.length > 0)
      )
    );
    const orderedImages = normalizedImages.length > 0 ? normalizedImages : [FALLBACK_IMAGE];

    const savedProduct = await prisma.product.upsert({
      where: { id: product.id },
      create: {
        id: product.id,
        publicId: product.publicId,
        name: product.name,
        price: product.price,
        category: product.category
      },
      update: {
        publicId: product.publicId,
        name: product.name,
        price: product.price,
        category: product.category
      }
    });

    await prisma.productImage.deleteMany({
      where: { productId: savedProduct.id }
    });

    await prisma.productImage.createMany({
      data: orderedImages.map((url, index) => ({
        productId: savedProduct.id,
        url,
        alt: product.name,
        sortOrder: index
      }))
    });
  }

  const adminCount = await prisma.user.count({
    where: { role: "ADMIN" }
  });

  if (adminCount === 0) {
    const adminEmail = requireEnv("ADMIN_SEED_EMAIL").trim().toLowerCase();
    const adminPassword = requireEnv("ADMIN_SEED_PASSWORD");
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        status: "ENABLED"
      },
      update: {
        passwordHash,
        role: "ADMIN",
        status: "ENABLED"
      }
    });
  } else {
    const adminEmail = optionalEnv("ADMIN_SEED_EMAIL");

    if (adminEmail) {
      const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail.toLowerCase() },
        select: { role: true }
      });

      if (existingAdmin?.role !== "ADMIN") {
        console.warn("ADMIN_SEED_EMAIL is set but initial admin bootstrap was skipped (admin already exists).");
      }
    }
  }
}

main()
  .catch((error) => {
    console.error("Seeding failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
