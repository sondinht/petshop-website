import { test, expect } from '@playwright/test';
import { StorefrontPage } from './page-objects/StorefrontPage';
import { TEST_PRODUCTS } from './helpers/test-data';

test.describe('Storefront Browsing', () => {
  let storefrontPage: StorefrontPage;

  test.beforeEach(async ({ page }) => {
    storefrontPage = new StorefrontPage(page);
    await storefrontPage.goto();
  });

  test('navigates to dogs category and displays product grid', async () => {
    await storefrontPage.navigateToCategory('dogs');

    await expect(storefrontPage.page).toHaveURL(/\/dogs\.html/);
    await expect(storefrontPage.productGrid).toBeVisible();

    // Verify at least one product is displayed
    const productItems = storefrontPage.productGrid.locator(':scope > *');
    await expect(productItems.first()).toBeVisible();

    // Check that we have multiple products
    const productCount = await productItems.count();
    expect(productCount).toBeGreaterThan(0);
  });

  test('navigates to cats category and displays product grid', async () => {
    await storefrontPage.navigateToCategory('cats');

    await expect(storefrontPage.page).toHaveURL(/\/cats\.html/);
    await expect(storefrontPage.productGrid).toBeVisible();

    // Verify at least one product is displayed
    const productItems = storefrontPage.productGrid.locator(':scope > *');
    await expect(productItems.first()).toBeVisible();
  });

  test('navigates to accessories category and displays product grid', async () => {
    await storefrontPage.navigateToCategory('accessories');

    await expect(storefrontPage.page).toHaveURL(/\/accessories\.html/);
    await expect(storefrontPage.productGrid).toBeVisible();

    // Verify at least one product is displayed
    const productItems = storefrontPage.productGrid.locator(':scope > *');
    await expect(productItems.first()).toBeVisible();
  });

  test('navigates to deals category and displays product grid', async () => {
    await storefrontPage.navigateToCategory('deals');

    await expect(storefrontPage.page).toHaveURL(/\/deals\.html/);
    await expect(storefrontPage.productGrid).toBeVisible();

    // Verify at least one product is displayed
    const productItems = storefrontPage.productGrid.locator(':scope > *');
    await expect(productItems.first()).toBeVisible();
  });

  test('product grid displays product names and prices', async () => {
    await storefrontPage.navigateToCategory('dogs');

    // Check that products have names and prices visible
    const productItems = storefrontPage.productGrid.locator(':scope > *');
    const firstProduct = productItems.first();

    // Look for product name (usually in heading or link)
    const productName = firstProduct.locator('h3, h4, a, [data-ps-product-name]').first();
    await expect(productName).toBeVisible();
    await expect(productName).not.toBeEmpty();

    // Look for price
    const productPrice = firstProduct.locator('[data-ps-price], .price, [class*="price"]').first();
    await expect(productPrice).toBeVisible();
    const priceText = await productPrice.textContent();
    expect(priceText).toMatch(/\$\d+(\.\d{2})?/);
  });
});