import { Page, Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly itemQuantityInputs: Locator;
  readonly removeItemButtons: Locator;
  readonly itemPrices: Locator;
  readonly subtotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;
  readonly emptyCartMessage: Locator;
  readonly savedForLaterItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItems = page.locator('[data-ps-cart-item], .cart-item');
    this.itemQuantityInputs = page.locator('input[name="quantity"], input[data-ps-quantity]');
    this.removeItemButtons = page.locator('button[data-ps-remove], button:has-text("Remove")');
    this.itemPrices = page.locator('[data-ps-item-price], .item-price');
    this.subtotal = page.locator('[data-ps-subtotal], .subtotal');
    this.tax = page.locator('[data-ps-tax], .tax');
    this.total = page.locator('[data-ps-total], .total');
    this.checkoutButton = page.locator('button[data-ps-checkout], button:has-text("Checkout")');
    this.continueShoppingButton = page.locator('a[data-ps-continue-shopping], a:has-text("Continue Shopping")');
    this.emptyCartMessage = page.locator('[data-ps-empty-cart], .empty-cart');
    this.savedForLaterItems = page.locator('[data-ps-saved-item], .saved-item');
  }

  async goto() {
    await this.page.goto('/html/cart.html', { waitUntil: 'domcontentloaded' });
  }

  async getCartItemCount() {
    return this.cartItems.count();
  }

  async updateItemQuantity(index: number, quantity: number) {
    await this.itemQuantityInputs.nth(index).fill(quantity.toString());
    // Wait for cart update
    await this.page.waitForTimeout(500);
  }

  async removeItem(index: number) {
    await this.removeItemButtons.nth(index).click();
    // Wait for cart update
    await this.page.waitForTimeout(500);
  }

  async getItemPrice(index: number) {
    return this.itemPrices.nth(index).textContent();
  }

  async getSubtotal() {
    return this.subtotal.textContent();
  }

  async getTax() {
    return this.tax.textContent();
  }

  async getTotal() {
    return this.total.textContent();
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async isCartEmpty() {
    return this.emptyCartMessage.isVisible();
  }

  async getSavedForLaterCount() {
    return this.savedForLaterItems.count();
  }

  async moveToSavedForLater(index: number) {
    const saveButton = this.cartItems.nth(index).locator('button[data-ps-save-for-later]');
    await saveButton.click();
    await this.page.waitForTimeout(500);
  }

  async moveToCartFromSaved(index: number) {
    const moveButton = this.savedForLaterItems.nth(index).locator('button[data-ps-move-to-cart]');
    await moveButton.click();
    await this.page.waitForTimeout(500);
  }
}