import { Page, Locator } from '@playwright/test';

export class ProductDetailPage {
  readonly page: Page;
  readonly productTitle: Locator;
  readonly productPrice: Locator;
  readonly variantSelect: Locator;
  readonly quantityInput: Locator;
  readonly addToCartButton: Locator;
  readonly productImages: Locator;
  readonly mainImage: Locator;
  readonly thumbnailImages: Locator;
  readonly productDescription: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productTitle = page.locator('h1');
    this.productPrice = page.locator('[data-ps-price], .price');
    this.variantSelect = page.locator('select[name="variant"], select[data-ps-variant]');
    this.quantityInput = page.locator('input[name="quantity"], input[type="number"]');
    this.addToCartButton = page.locator('button:has-text("Add to Cart"), button[data-ps-add-to-cart]');
    this.productImages = page.locator('[data-ps-product-images], .product-images');
    this.mainImage = page.locator('[data-ps-main-image] img, .main-image img');
    this.thumbnailImages = page.locator('[data-ps-thumbnails] img, .thumbnails img');
    this.productDescription = page.locator('[data-ps-description], .product-description');
  }

  async goto(productId?: string) {
    const url = productId ? `/html/product-detail.html?id=${productId}` : '/html/product-detail.html';
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async selectVariant(variantName: string) {
    await this.variantSelect.selectOption({ label: variantName });
  }

  async setQuantity(quantity: number) {
    await this.quantityInput.fill(quantity.toString());
  }

  async addToCart() {
    await this.addToCartButton.click();
    // Wait for cart update or navigation
    await this.page.waitForTimeout(1000);
  }

  async getProductTitle() {
    return this.productTitle.textContent();
  }

  async getProductPrice() {
    return this.productPrice.textContent();
  }

  async getAvailableVariants() {
    const options = await this.variantSelect.locator('option').all();
    const variants = [];
    for (const option of options) {
      const text = await option.textContent();
      if (text) variants.push(text);
    }
    return variants;
  }

  async clickThumbnail(index: number = 0) {
    await this.thumbnailImages.nth(index).click();
  }

  async isAddToCartEnabled() {
    return this.addToCartButton.isEnabled();
  }
}