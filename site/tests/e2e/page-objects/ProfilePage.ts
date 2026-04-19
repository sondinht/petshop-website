import { Page, Locator } from '@playwright/test';

export class ProfilePage {
  readonly page: Page;
  readonly heroOrderNumber: Locator;
  readonly latestOrderBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroOrderNumber = page.locator('header.mb-12 p', { hasText: 'Order #' });
    this.latestOrderBadge = page.locator('text=Latest order:');
  }

  async goto() {
    await this.page.goto('/html/profile.html', { waitUntil: 'domcontentloaded' });
  }

  async waitForHeroOrderNumber() {
    await this.heroOrderNumber.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async getHeroOrderNumber() {
    const text = await this.heroOrderNumber.textContent();
    if (!text) {
      return null;
    }

    const match = text.match(/Order #(.*)/i);
    return match?.[1]?.trim() ?? null;
  }

  async hasLatestOrderBadge() {
    return (await this.latestOrderBadge.count()) > 0;
  }
}
