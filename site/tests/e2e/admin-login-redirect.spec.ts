import { test, expect } from '@playwright/test';

test('admin users HTML route redirects to admin login when unauthenticated', async ({ page }) => {
  await page.goto('/html/admin-users.html', { waitUntil: 'domcontentloaded' });

  const finalUrl = new URL(page.url(), 'http://localhost');
  expect(finalUrl.pathname).toBe('/admin-login.html');
  expect(finalUrl.searchParams.get('next')).toBe('/admin-users.html');
  await expect(page.locator('body')).toContainText(/admin login|sign in/i);
});
