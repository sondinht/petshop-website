import { Page, Locator } from '@playwright/test';

export type ShippingInfo = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address: string;
  city: string;
  state?: string;
  zip: string;
};

export type PaymentInfo = {
  cardNumber: string;
  expiry: string;
  cvv: string;
};

export class CheckoutPage {
  readonly page: Page;
  readonly fullNameInput: Locator;
  readonly streetAddressInput: Locator;
  readonly cityInput: Locator;
  readonly zipInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly cardNumberInput: Locator;
  readonly expiryInput: Locator;
  readonly cvvInput: Locator;
  readonly placeOrderButton: Locator;
  readonly orderSummaryItems: Locator;
  readonly subtotal: Locator;
  readonly total: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fullNameInput = page.locator('input[placeholder="John Doe"], input[placeholder*="Name"], input[name="fullName"], input[name="name"]');
    this.streetAddressInput = page.locator('input[placeholder="123 Puppy Lane"], input[placeholder*="Address"], input[name="address"], input[name="streetAddress"]');
    this.cityInput = page.locator('input[placeholder="San Francisco"], input[name="city"]');
    this.zipInput = page.locator('input[placeholder="94103"], input[name="zip"], input[name="postalCode"]');
    this.emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="email"]');
    this.phoneInput = page.locator('input[name="phone"], input[type="tel"], input[placeholder*="phone"]');
    this.cardNumberInput = page.locator('input[placeholder*="****"]');
    this.expiryInput = page.locator('input[placeholder="MM/YY"]');
    this.cvvInput = page.locator('input[placeholder="123"]');
    this.placeOrderButton = page.locator('button:has-text("Place Order"), button[data-ps-place-order]');
    this.orderSummaryItems = page.locator('aside div.space-y-6 > div');
    this.subtotal = page.locator('div.flex.justify-between.text-on-surface-variant:has(span:has-text("Subtotal")) span.font-medium');
    this.total = page.locator('div.flex.justify-between.text-xl:has(span:has-text("Total")) span:not(:has-text("Total"))');
  }

  async goto() {
    await this.page.goto('/html/checkout.html', { waitUntil: 'domcontentloaded' });
  }

  async fillShippingInfo(info: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address: string;
    city: string;
    state?: string;
    zip: string;
  }) {
    await this.fullNameInput.fill(`${info.firstName} ${info.lastName}`);
    await this.streetAddressInput.fill(info.address);
    await this.cityInput.fill(info.city);
    await this.zipInput.fill(info.zip);

    if (await this.emailInput.count() > 0 && info.email) {
      await this.emailInput.fill(info.email);
    }

    if (await this.phoneInput.count() > 0 && info.phone) {
      await this.phoneInput.fill(info.phone);
    }
  }

  async fillPaymentInfo(info: {
    cardNumber: string;
    expiry: string;
    cvv: string;
  }) {
    await this.cardNumberInput.fill(info.cardNumber);
    await this.expiryInput.fill(info.expiry);
    await this.cvvInput.fill(info.cvv);
  }

  async placeOrder() {
    await this.placeOrderButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getSubtotal() {
    return (await this.subtotal.textContent())?.trim() ?? '';
  }

  async getTotal() {
    return (await this.total.textContent())?.trim() ?? '';
  }

  async getOrderSummary() {
    return {
      items: await this.orderSummaryItems.count(),
      subtotal: await this.getSubtotal(),
      total: await this.getTotal(),
    };
  }
}
