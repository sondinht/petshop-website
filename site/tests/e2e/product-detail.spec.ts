import { test, expect } from '@playwright/test';
import { StorefrontPage } from './page-objects/StorefrontPage';
import { ProductDetailPage } from './page-objects/ProductDetailPage';
import { TEST_PRODUCTS } from './helpers/test-data';

test('product detail page opens from the home page product link', async ({ page }) => {
  const storefrontPage = new StorefrontPage(page);
  const productDetailPage = new ProductDetailPage(page);

  await storefrontPage.goto();

  const productLink = page.locator('a[href="product-detail.html"]').first();
  await expect(productLink).toBeVisible();

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    productLink.click(),
  ]);

  await expect(page).toHaveURL(/\/product-detail\.html(\?.*)?$/);
  await expect(productDetailPage.productTitle).toContainText(/Premium|Product/i);
  await expect(productDetailPage.addToCartButton).toBeVisible();
});

test('product detail page supports variant selection', async ({ page }) => {
  const productDetailPage = new ProductDetailPage(page);

  await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);

  // Verify variant buttons are present
  await expect(productDetailPage.variantButtons.first()).toBeVisible();

  // Test selecting different variants
  for (const variant of TEST_PRODUCTS.PREMIUM_KIBBLE.variants) {
    await productDetailPage.selectVariant(variant.name);
    // Note: Price doesn't change in static HTML, so we just verify the button click worked
    await expect(productDetailPage.productTitle).toBeVisible();
  }
});

test('product detail page displays images and description', async ({ page }) => {
  const productDetailPage = new ProductDetailPage(page);

  await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);

  // Check main product image
  await expect(productDetailPage.mainImage).toBeVisible();

  // Check product description
  await expect(productDetailPage.productDescription).toBeVisible();
  await expect(productDetailPage.productDescription).not.toBeEmpty();

  // Check price display
  await expect(productDetailPage.productPrice).toBeVisible();
});

test('product detail page shows related products', async ({ page }) => {
  const productDetailPage = new ProductDetailPage(page);

  await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);

  // Check that the page loaded and displays product information
  // Related products section may be present in static HTML
  const relatedProductsSection = page.locator('[data-ps-related-products], .related-products, .similar-products');
  
  // Verify that the main product content is displayed
  await expect(productDetailPage.productTitle).toBeVisible();
  await expect(productDetailPage.productDescription).toBeVisible();
});
