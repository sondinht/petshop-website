import { test, expect } from '@playwright/test';

test('product detail page opens from the home page product link', async ({ page }) => {
  await page.goto('/html', { waitUntil: 'domcontentloaded' });

  const productLink = page.locator('a[href="product-detail.html"]').first();
  await expect(productLink).toBeVisible();

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    productLink.click(),
  ]);

  await expect(page).toHaveURL(/\/product-detail\.html/);
  await expect(page.locator('h1')).toContainText(/Premium|Product/i);
  await expect(page.locator('button', { hasText: /Add to Cart/i })).toBeVisible();
});
