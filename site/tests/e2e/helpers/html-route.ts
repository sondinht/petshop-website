import type { Page } from '@playwright/test';

export async function gotoHtmlRoute(page: Page, path = '') {
  const normalizedPath = path.replace(/^\/+/, '');
  const url = normalizedPath ? `/html/${normalizedPath}` : '/html';
  await page.goto(url, { waitUntil: 'domcontentloaded' });
}

export async function clearSessionStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    sessionStorage.clear();
  });
}

export async function clearLocalStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
  });
}

export async function clearAllStorage(page: Page): Promise<void> {
  await clearSessionStorage(page);
  await clearLocalStorage(page);
}

export async function setSessionId(page: Page, sessionId: string): Promise<void> {
  await page.evaluate((id) => {
    sessionStorage.setItem('sessionId', id);
  }, sessionId);
}

export async function getSessionId(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    return sessionStorage.getItem('sessionId');
  });
}

export async function resetTestSession(page: Page): Promise<void> {
  await clearAllStorage(page);
  // Generate a new session ID for isolation
  const newSessionId = `test-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await setSessionId(page, newSessionId);
}
