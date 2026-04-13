export const PRODUCT_CATEGORIES = ["dogs", "cats", "accessories", "deals"] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const STOREFRONT_PAGES = ["dogs", "cats", "accessories", "deals"] as const;

export type StorefrontPage = (typeof STOREFRONT_PAGES)[number];

export const PRODUCT_COLLECTIONS = ["FLASH_SALE", "BEST_SELLERS"] as const;

export type ProductCollection = (typeof PRODUCT_COLLECTIONS)[number];

const PRODUCT_CATEGORY_SET = new Set<string>(PRODUCT_CATEGORIES);
const STOREFRONT_PAGE_SET = new Set<string>(STOREFRONT_PAGES);
const PRODUCT_COLLECTION_SET = new Set<string>(PRODUCT_COLLECTIONS);

export function isProductCategory(value: string): value is ProductCategory {
	return PRODUCT_CATEGORY_SET.has(value);
}

export function isStorefrontPage(value: string): value is StorefrontPage {
	return STOREFRONT_PAGE_SET.has(value);
}

export function isProductCollection(value: string): value is ProductCollection {
	return PRODUCT_COLLECTION_SET.has(value);
}

export function storefrontPageFromCategory(value: string): StorefrontPage | null {
	const normalized = String(value || "").trim().toLowerCase();

	if (!normalized) {
		return null;
	}

	if (normalized.includes("dog")) {
		return "dogs";
	}

	if (normalized.includes("cat")) {
		return "cats";
	}

	if (normalized.includes("access")) {
		return "accessories";
	}

	if (normalized.includes("deal") || normalized.includes("sale")) {
		return "deals";
	}

	return isStorefrontPage(normalized) ? normalized : null;
}