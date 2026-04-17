import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/html', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/PetShop/i);
});

test('main navigation is visible', async ({ page }) => {
  await page.goto('/html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText(/shop|products|cart/i);
});