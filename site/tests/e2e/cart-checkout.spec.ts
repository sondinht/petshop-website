import { test, expect } from '@playwright/test';
import { gotoHtmlRoute } from './helpers/html-route';

test('cart page loads and checkout page is accessible', async ({ page }) => {
  await gotoHtmlRoute(page, 'cart.html');

  await expect(page).toHaveURL(/\/html\/cart\.html/);
  await expect(page.locator('body')).toContainText(/cart|checkout|subtotal/i);

  await gotoHtmlRoute(page, 'checkout.html');
  await expect(page).toHaveURL(/\/html\/checkout\.html/);
  await expect(page.locator('body')).toContainText(/shipping|payment|order summary/i);
});
