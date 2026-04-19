import { Page, Locator } from '@playwright/test';

export class StorefrontPage {
  readonly page: Page;
  readonly dogsLink: Locator;
  readonly catsLink: Locator;
  readonly accessoriesLink: Locator;
  readonly dealsLink: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly productGrid: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dogsLink = page.getByRole('link', { name: 'Dogs', exact: true });
    this.catsLink = page.getByRole('link', { name: 'Cats', exact: true });
    this.accessoriesLink = page.getByRole('link', { name: 'Accessories', exact: true });
    this.dealsLink = page.getByRole('link', { name: 'Deals', exact: true });
    this.searchInput = page.locator('input[type="search"], input[name="search"]');
    this.searchButton = page.locator('button[type="submit"], button:has-text("Search")');
    this.productGrid = page.locator('[data-ps-product-grid]');
  }

  async goto() {
    await this.page.goto('/html', { waitUntil: 'domcontentloaded' });
  }

  async navigateToCategory(category: 'dogs' | 'cats' | 'accessories' | 'deals') {
    const categoryMap = {
      dogs: this.dogsLink,
      cats: this.catsLink,
      accessories: this.accessoriesLink,
      deals: this.dealsLink,
    };

    await categoryMap[category].click();
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for products to be loaded by checking if the grid has content
    await this.page.waitForFunction(() => {
      const grid = document.querySelector('[data-ps-product-grid]');
      return grid && grid.children.length > 0;
    }, { timeout: 10000 });
  }

  async searchForProduct(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickProductByName(name: string) {
    const productLink = this.page.locator(`a:has-text("${name}")`).first();
    await productLink.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getProductLinks() {
    return this.page.locator('a[href*="product-detail"]').all();
  }

  async getVisibleProducts() {
    return this.productGrid.locator(':scope > *').all();
  }
}
