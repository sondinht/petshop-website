export const PRODUCT_CATEGORIES = ["dogs", "cats", "accessories", "deals"] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

const PRODUCT_CATEGORY_SET = new Set<string>(PRODUCT_CATEGORIES);

export function isProductCategory(value: string): value is ProductCategory {
	return PRODUCT_CATEGORY_SET.has(value);
}