import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { productCatalog } from "../src/server/catalog";

const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for seeding`);
  }

  return value;
}

async function main() {
  for (const product of productCatalog) {
    await prisma.product.upsert({
      where: { id: product.id },
      create: {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        image: product.image
      },
      update: {
        name: product.name,
        price: product.price,
        category: product.category,
        image: product.image
      }
    });
  }

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
}

main()
  .catch((error) => {
    console.error("Seeding failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
