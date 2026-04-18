import { Page, Locator } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  readonly shippingForm: Locator;
  readonly billingForm: Locator;
  readonly paymentForm: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipInput: Locator;
  readonly cardNumberInput: Locator;
  readonly expiryInput: Locator;
  readonly cvvInput: Locator;
  readonly placeOrderButton: Locator;
  readonly orderSummary: Locator;
  readonly orderTotal: Locator;
  readonly backToCartButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.shippingForm = page.locator('[data-ps-shipping-form], form[action*="shipping"]');
    this.billingForm = page.locator('[data-ps-billing-form], form[action*="billing"]');
    this.paymentForm = page.locator('[data-ps-payment-form], form[action*="payment"]');
    this.firstNameInput = page.locator('input[name="firstName"], input[data-ps-first-name]');
    this.lastNameInput = page.locator('input[name="lastName"], input[data-ps-last-name]');
    this.emailInput = page.locator('input[name="email"], input[type="email"]');
    this.phoneInput = page.locator('input[name="phone"], input[type="tel"]');
    this.addressInput = page.locator('input[name="address"], textarea[name="address"]');
    this.cityInput = page.locator('input[name="city"]');
    this.stateInput = page.locator('select[name="state"], input[name="state"]');
    this.zipInput = page.locator('input[name="zip"], input[name="zipCode"]');
    this.cardNumberInput = page.locator('input[name="cardNumber"], input[data-ps-card-number]');
    this.expiryInput = page.locator('input[name="expiry"], input[data-ps-expiry]');
    this.cvvInput = page.locator('input[name="cvv"], input[data-ps-cvv]');
    this.placeOrderButton = page.locator('button[data-ps-place-order], button:has-text("Place Order")');
    this.orderSummary = page.locator('[data-ps-order-summary], .order-summary');
    this.orderTotal = page.locator('[data-ps-order-total], .order-total');
    this.backToCartButton = page.locator('a[data-ps-back-to-cart], a:has-text("Back to Cart")');
  }

  async goto() {
    await this.page.goto('/html/checkout.html', { waitUntil: 'domcontentloaded' });
  }

  async fillShippingInfo(info: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  }) {
    await this.firstNameInput.fill(info.firstName);
    await this.lastNameInput.fill(info.lastName);
    await this.emailInput.fill(info.email);
    await this.phoneInput.fill(info.phone);
    await this.addressInput.fill(info.address);
    await this.cityInput.fill(info.city);
    if (await this.stateInput.locator('option').count() > 0) {
      await this.stateInput.selectOption({ label: info.state });
    } else {
      await this.stateInput.fill(info.state);
    }
    await this.zipInput.fill(info.zip);
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

  async getOrderTotal() {
    return this.orderTotal.textContent();
  }

  async backToCart() {
    await this.backToCartButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async isFormValid() {
    // Check if all required fields are filled and place order button is enabled
    const requiredFields = [
      this.firstNameInput,
      this.lastNameInput,
      this.emailInput,
      this.addressInput,
      this.cityInput,
      this.zipInput,
      this.cardNumberInput,
      this.expiryInput,
      this.cvvInput,
    ];

    for (const field of requiredFields) {
      if (await field.getAttribute('required') !== null && await field.inputValue() === '') {
        return false;
      }
    }

    return this.placeOrderButton.isEnabled();
  }

  async getOrderSummaryItems() {
    return this.orderSummary.locator('[data-ps-order-item], .order-item').all();
  }
}