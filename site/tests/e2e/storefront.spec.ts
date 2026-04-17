import { test, expect } from '@playwright/test';
import { gotoHtmlRoute } from './helpers/html-route';

test('storefront navigation loads category pages from the HTML entry point', async ({ page }) => {
  await gotoHtmlRoute(page);

  await expect(page).toHaveTitle(/pet|shop|store/i);
  const dogsLink = page.getByRole('link', { name: 'Dogs', exact: true });
  await expect(dogsLink).toBeVisible();

  await dogsLink.click();
  await page.waitForLoadState('domcontentloaded');

  await expect(page).toHaveURL(/\/dogs\.html/);
  const dogsProductGrid = page.locator('[data-ps-product-grid="dogs"]');
  await expect(dogsProductGrid).toBeVisible();
  await expect(dogsProductGrid.locator(':scope > *').first()).toBeVisible();
});
