import { test, expect } from '@playwright/test';
import { StorefrontPage } from './page-objects/StorefrontPage';
import { TEST_PRODUCTS } from './helpers/test-data';

test('storefront navigation loads category pages from the HTML entry point', async ({ page }) => {
  const storefrontPage = new StorefrontPage(page);
  await storefrontPage.goto();

  await expect(page).toHaveTitle(/pet|shop|store/i);

  // Verify all navigation links are visible
  await expect(storefrontPage.dogsLink).toBeVisible();
  await expect(storefrontPage.catsLink).toBeVisible();
  await expect(storefrontPage.accessoriesLink).toBeVisible();
  await expect(storefrontPage.dealsLink).toBeVisible();

  // Navigate to dogs category
  await storefrontPage.navigateToCategory('dogs');

  await expect(page).toHaveURL(/\/dogs\.html/);
  await expect(storefrontPage.productGrid).toBeVisible();

  // Verify product grid has content
  const productItems = storefrontPage.productGrid.locator(':scope > *');
  await expect(productItems.first()).toBeVisible();

  // Verify specific product is present
  const premiumKibbleLink = page.locator(`a:has-text("${TEST_PRODUCTS.PREMIUM_KIBBLE.name}")`);
  await expect(premiumKibbleLink).toBeVisible();

  // Verify product has price displayed
  const firstProduct = productItems.first();
  const productPrice = firstProduct.locator('[data-ps-price], .price, [class*="price"]').first();
  await expect(productPrice).toBeVisible();
  await expect(productPrice).toMatch(/\$\d+(\.\d{2})?/);
});
