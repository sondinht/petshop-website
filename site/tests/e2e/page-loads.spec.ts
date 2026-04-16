import { test, expect } from '@playwright/test';
import { gotoHtmlRoute } from './helpers/html-route';

const pages = [
  { path: '', title: /PetShop/i },
  { path: 'dogs.html', title: /Dogs Category/i },
  { path: 'cats.html', title: /Cats/i },
  { path: 'accessories.html', title: /Accessories/i },
  { path: 'deals.html', title: /Deals/i },
  { path: 'checkout.html', title: /Checkout/i },
];

for (const pageData of pages) {
  test(`HTML route ${pageData.path || '/html'} loads successfully`, async ({ page }) => {
    await gotoHtmlRoute(page, pageData.path);
    await expect(page).toHaveURL(pageData.path ? new RegExp(`/html/${pageData.path}`) : /\/html$/);
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveTitle(pageData.title);
  });
}
