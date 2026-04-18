import { Page, Locator } from '@playwright/test';

export class ProductDetailPage {
  readonly page: Page;
  readonly productTitle: Locator;
  readonly productPrice: Locator;
  readonly variantSelect: Locator;
  readonly quantityInput: Locator;
  readonly quantityDisplay: Locator;
  readonly addToCartButton: Locator;
  readonly productImages: Locator;
  readonly mainImage: Locator;
  readonly thumbnailImages: Locator;
  readonly productDescription: Locator;
  readonly variantButtons: Locator;
  readonly quantityMinusButton: Locator;
  readonly quantityPlusButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productTitle = page.locator('h1');
    this.productPrice = page.locator('[data-ps-price], .price, span:has-text("$")');
    this.variantSelect = page.locator('select[name="variant"], select[data-ps-variant]');
    this.quantityInput = page.locator('input[name="quantity"], input[type="number"]'); // Keep input for fallback
    this.quantityDisplay = page.locator('span:has-text("1"), span.font-bold'); // The quantity display span
    this.addToCartButton = page.locator('button:has-text("Add to Cart"), [data-ps-add-to-cart]');
    this.productImages = page.locator('[data-ps-product-images], .product-images');
    this.mainImage = page.locator('[data-ps-main-image] img, .main-image img, img[alt*="product"]');
    this.thumbnailImages = page.locator('[data-ps-thumbnails] img, .thumbnails img');
    this.productDescription = page.locator('[data-ps-description], .product-description, p:has-text("Crafted with")');
    this.variantButtons = page.locator('button:has-text("15lb"), button:has-text("30lb"), button:has-text("50lb"), button:has-text("Standard"), button:has-text("Large")');
    this.quantityMinusButton = page.locator('button:has-text("remove"), button span:has-text("remove")');
    this.quantityPlusButton = page.locator('button:has-text("add"), button span:has-text("add")');
  }

  async goto(productId?: string) {
    const url = productId ? `/html/product-detail.html?id=${productId}` : '/html/product-detail.html';
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    // Wait for page to be ready (static page, no dynamic loading)
    await this.page.waitForLoadState('domcontentloaded');
  }

  async selectVariant(variantName: string) {
    // The HTML uses buttons for variant selection, not a select dropdown
    const normalizedName = variantName.replace(/\s+/g, '').toLowerCase(); // Remove spaces and lowercase

    // Find the button with matching text (case-insensitive)
    const variantButton = this.page.locator('button').filter({ hasText: new RegExp(normalizedName, 'i') });

    if (await variantButton.count() > 0) {
      await variantButton.click();
    } else {
      throw new Error(`Variant button for "${variantName}" not found`);
    }
  }

  async setQuantity(quantity: number) {
    // Get current quantity from the span element
    const currentQtyText = await this.quantityDisplay.textContent();
    const currentNum = parseInt(currentQtyText || '1');

    if (quantity > currentNum) {
      // Click plus button
      for (let i = currentNum; i < quantity; i++) {
        await this.quantityPlusButton.click();
      }
    } else if (quantity < currentNum) {
      // Click minus button
      for (let i = currentNum; i > quantity; i--) {
        await this.quantityMinusButton.click();
      }
    }
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