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
    this.productPrice = page.locator('span:has-text("$"), [data-ps-price]');
    this.variantSelect = page.locator('select[name="variant"], select[data-ps-variant]');
    this.quantityDisplay = page.locator('.flex.items-center.w-32.bg-surface-container-highest.rounded-xl.p-1 span.flex-grow.text-center.font-bold');
    this.quantityInput = this.quantityDisplay;
    this.addToCartButton = page.locator('button:has-text("Add to Cart"), [data-ps-add-to-cart]');
    this.productImages = page.locator('[data-ps-product-images], .product-images');
    this.mainImage = page.locator('[data-ps-main-image] img, .main-image img, img[alt*="product"]:first-child');
    this.thumbnailImages = page.locator('img[alt*="thumbnail"], img[alt*="Product thumbnail"]');
    this.productDescription = page.locator('p:has-text("Crafted with"), [data-ps-description], .product-description');
    this.variantButtons = page.locator('button.px-6.py-3.rounded-xl');
    this.quantityMinusButton = page.locator('div.flex.items-center.w-32 button:first-of-type');
    this.quantityPlusButton = page.locator('div.flex.items-center.w-32 button:last-of-type');
  }

  async goto(productId?: string) {
    const url = productId ? `/product-detail.html?id=${productId}` : '/product-detail.html';
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
    await this.addToCartButton.click({ force: true });
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
