import { Page, Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly itemQuantityDisplays: Locator;
  readonly quantityMinusButtons: Locator;
  readonly quantityPlusButtons: Locator;
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
    this.cartItems = page.locator('[data-ps-cart-items] > div');
    this.itemQuantityDisplays = page.locator('[data-ps-cart-items] span.px-4.font-semibold');
    this.quantityMinusButtons = page.locator('[data-ps-cart-items] button span.material-symbols-outlined:has-text("remove")');
    this.quantityPlusButtons = page.locator('[data-ps-cart-items] button span.material-symbols-outlined:has-text("add")');
    this.removeItemButtons = page.locator('button:has-text("Remove")');
    this.itemPrices = page.locator('[data-ps-cart-items] span.text-xl.font-bold.text-primary');
    this.subtotal = page.locator('div.flex.justify-between:has(span:has-text("Subtotal")) span.font-semibold.text-on-surface');
    this.tax = page.locator('div.flex.justify-between:has(span:has-text("Estimated Tax")) span.font-semibold.text-on-surface');
    this.total = page.locator('span.text-3xl.font-black.text-primary');
    this.checkoutButton = page.locator('button:has-text("Proceed to Checkout")');
    this.continueShoppingButton = page.locator('a[data-ps-continue-shopping], a:has-text("Continue Shopping")');
    this.emptyCartMessage = page.locator('[data-ps-empty-cart], .empty-cart');
    this.savedForLaterItems = page.locator('[data-ps-saved-items] > div');
  }

  async goto() {
    await this.page.goto('/html/cart.html', { waitUntil: 'domcontentloaded' });
    // Wait for cart items to hydrate
    await this.page.waitForFunction(
      () => {
        const cartItemsHost = document.querySelector('[data-ps-cart-items]');
        return cartItemsHost && cartItemsHost.children.length >= 0;
      },
      { timeout: 5000 }
    ).catch(() => {});
  }

  async getCartItemCount() {
    // Wait for cart items to be available
    await this.page.waitForSelector('[data-ps-cart-items] > div', { timeout: 5000 }).catch(() => {});
    return this.cartItems.count();
  }

  async updateItemQuantity(index: number, quantity: number) {
    // Get current quantity from the display
    const quantityDisplay = this.cartItems.nth(index).locator('span.px-4.font-semibold');
    const currentQtyText = await quantityDisplay.textContent();
    const currentNum = parseInt(currentQtyText || '1');

    if (quantity > currentNum) {
      // Click plus button multiple times
      for (let i = currentNum; i < quantity; i++) {
        await this.cartItems.nth(index).locator('button span.material-symbols-outlined:has-text("add")').click();
      }
    } else if (quantity < currentNum) {
      // Click minus button multiple times
      for (let i = currentNum; i > quantity; i--) {
        await this.cartItems.nth(index).locator('button span.material-symbols-outlined:has-text("remove")').click();
      }
    }
    // Wait for cart update
    await this.page.waitForTimeout(500);
  }

  async removeItem(index: number) {
    await this.removeItemButtons.nth(index).click();
    // Wait for cart update
    await this.page.waitForTimeout(500);
  }

  async getItemPrice(index: number) {
    const priceLocator = this.cartItems.nth(index).locator('span.text-xl.font-bold.text-primary, [data-ps-item-price]');
    await priceLocator.waitFor({ timeout: 5000 }).catch(() => {});
    return priceLocator.textContent();
  }

  async getSubtotal() {
    await this.subtotal.waitFor({ timeout: 5000 }).catch(() => {});
    return this.subtotal.textContent();
  }

  async getTax() {
    await this.tax.waitFor({ timeout: 5000 }).catch(() => {});
    return this.tax.textContent();
  }

  async getTotal() {
    await this.total.waitFor({ timeout: 5000 }).catch(() => {});
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
    // Wait for cart hydration first
    await this.page.waitForFunction(
      () => {
        const cartItemsHost = document.querySelector('[data-ps-cart-items]');
        return cartItemsHost && (cartItemsHost.children.length > 0 || document.querySelector('[data-ps-empty-cart]') !== null);
      },
      { timeout: 5000 }
    ).catch(() => {});
    return (await this.cartItems.count()) === 0;
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
