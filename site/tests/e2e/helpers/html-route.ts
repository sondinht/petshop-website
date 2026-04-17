import type { Page } from '@playwright/test';

export async function gotoHtmlRoute(page: Page, path = '') {
  const normalizedPath = path.replace(/^\/+/, '');
  const url = normalizedPath ? `/html/${normalizedPath}` : '/html';
  await page.goto(url, { waitUntil: 'domcontentloaded' });
}
