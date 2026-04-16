import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/html');
  await expect(page).toHaveTitle(/pet|shop|store/i);
});

test('main navigation is visible', async ({ page }) => {
  await page.goto('/html');
  await expect(page.locator('body')).toContainText(/shop|products|cart/i);
});