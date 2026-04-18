import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function isDogProduct(category: string, storefrontPages: string[]): boolean {
  return category === "dogs" || storefrontPages.some((page) => normalize(page) === "dogs");
}

function isCatProduct(category: string, storefrontPages: string[]): boolean {
  return category === "cats" || storefrontPages.some((page) => normalize(page) === "cats");
}

function inferDogLifeStage(name: string): string {
  const normalized = normalize(name);

  if (/pup|puppy|puppies/i.test(name)) {
    return "Puppy";
  }

  if (/senior|old(er)?|memory foam|orthopedic|bed/i.test(name)) {
    return "Senior";
  }

  return "Adult";
}

function inferDogBreedSize(name: string): string {
  const normalized = normalize(name);

  if (/(small|toy|mini)/i.test(name)) {
    return "Small";
  }

  if (/(large|extra large|xl|xxl|jumbo)/i.test(name)) {
    return "Large";
  }

  return "Medium";
}

function inferCatAge(name: string): string {
  if (/(kitten|young cat)/i.test(name)) {
    return "Kitten";
  }

  return "Adult";
}

function inferCatType(name: string): string {
  if (/(dry|grain|kibble)/i.test(name)) {
    return "Dry Food";
  }

  if (/(wet|pate|canned|broth|fresh)/i.test(name)) {
    return "Wet Food";
  }

  return "Dry Food";
}

async function main() {
  const products = await prisma.product.findMany({
    include: {
      placements: true
    }
  });

  let updatedCount = 0;
  let skippedCount = 0;

  for (const product of products) {
    const storefrontPages = product.placements.map((placement) => placement.storefrontPage);
    const isDog = isDogProduct(product.category, storefrontPages);
    const isCat = isCatProduct(product.category, storefrontPages);

    const updateData: Partial<{
      dogLifeStage: string | null;
      dogBreedSize: string | null;
      catAge: string | null;
      catType: string | null;
    }> = {};

    if (isDog) {
      if (!product.dogLifeStage) {
        updateData.dogLifeStage = inferDogLifeStage(product.name);
      }
      if (!product.dogBreedSize) {
        updateData.dogBreedSize = inferDogBreedSize(product.name);
      }
    }

    if (isCat) {
      if (!product.catAge) {
        updateData.catAge = inferCatAge(product.name);
      }
      if (!product.catType) {
        updateData.catType = inferCatType(product.name);
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: updateData
      });
      updatedCount += 1;
      console.log(`Updated product ${product.name} (${product.id})`, updateData);
      continue;
    }

    skippedCount += 1;
  }

  console.log(`Done. Updated ${updatedCount} product(s), skipped ${skippedCount} product(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
