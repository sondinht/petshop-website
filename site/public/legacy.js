// Legacy.js - Hardcoded product data for legacy HTML pages
// This script is injected into legacy HTML pages to provide product functionality

const HARDCODED_PRODUCTS = {
  'premium-grain-free-kibble': {
    id: 'premium-grain-free-kibble',
    name: 'Premium Grain-Free Kibble',
    category: 'dogs',
    description: 'Crafted with premium ingredients, this grain-free formula provides optimal nutrition for dogs.',
    variants: [
      { name: '15lb', price: 64.99 },
      { name: '30lb', price: 109.99 },
      { name: '50lb', price: 149.99 },
    ],
  },
  'indestructible-rubber-bone': {
    id: 'indestructible-rubber-bone',
    name: 'Indestructible Rubber Bone',
    category: 'dogs',
    description: 'Built to withstand aggressive chewing, this durable rubber bone keeps dogs entertained.',
    variants: [
      { name: '15lb', price: 18.50 },
      { name: '30lb', price: 24.50 },
    ],
  },
  'orthopedic-memory-foam-bed': {
    id: 'orthopedic-memory-foam-bed',
    name: 'Orthopedic Memory Foam Bed',
    category: 'dogs',
    description: 'Crafted with premium ingredients, this orthopedic bed provides maximum comfort and joint support.',
    variants: [
      { name: '15lb', price: 129 },
      { name: '30lb', price: 159 },
    ],
  },
  'adjustable-leather-harness': {
    id: 'adjustable-leather-harness',
    name: 'Adjustable Leather Harness',
    category: 'dogs',
    description: 'Premium leather harness with adjustable straps for a perfect fit and comfortable daily walks.',
    variants: [
      { name: '15lb', price: 42 },
      { name: '30lb', price: 49 },
    ],
  },
};

// Initialize legacy.js when DOM is ready
function initLegacy() {
  // Check current page and initialize appropriate functionality
  const pathname = window.location.pathname;
  const urlParams = new URLSearchParams(window.location.search);

  if (pathname.includes('product-detail.html')) {
    initProductDetailPage(urlParams);
  } else if (pathname.includes('cart.html')) {
    initCartPage();
  } else if (pathname.includes('checkout.html')) {
    initCheckoutPage();
  } else if (pathname.includes('/dogs.html') || pathname.includes('/cats.html') || pathname.includes('/accessories.html') || pathname.includes('/deals.html')) {
    initCategoryPage();
  } else if (pathname.includes('index.html') || pathname === '/' || pathname === '/html' || pathname === '/html/') {
    initHomePage();
  }
}

// Initialize product detail page
function initProductDetailPage(urlParams) {
  const productId = urlParams.get('id');
  if (!productId || !HARDCODED_PRODUCTS[productId]) {
    console.error('Product not found:', productId);
    return;
  }

  const product = HARDCODED_PRODUCTS[productId];
  let selectedVariant = product.variants[0];
  let quantity = 1;

  // Set product title
  const titleElement = document.querySelector('h1');
  if (titleElement) {
    titleElement.textContent = product.name;
  }

  // Update price element robustly
  const updatePrice = () => {
    const priceElements = document.querySelectorAll('[data-ps-price], span:has-text("$")');
    priceElements.forEach(el => {
      el.textContent = `$${selectedVariant.price.toFixed(2)}`;
    });
    // Also update any span that looks like a price
    document.querySelectorAll('span').forEach(span => {
      if (span.textContent.includes('$') && !span.textContent.includes('Subtotal') && !span.textContent.includes('Tax') && !span.textContent.includes('Total')) {
        span.textContent = `$${selectedVariant.price.toFixed(2)}`;
      }
    });
  };

  // Set initial price
  updatePrice();

  // Handle variant selection
  const variantButtons = document.querySelectorAll('button.px-6.py-3.rounded-xl');
  variantButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const buttonText = button.textContent.trim();
      const matchedVariant = product.variants.find(v => 
        v.name.toLowerCase().replace(/\s+/g, '') === buttonText.toLowerCase().replace(/\s+/g, '')
      );
      if (matchedVariant) {
        selectedVariant = matchedVariant;
        // Update button styles
        variantButtons.forEach(b => b.classList.remove('bg-primary', 'text-on-primary'));
        button.classList.add('bg-primary', 'text-on-primary');
        updatePrice();
      }
    });
  });

  // Set active variant button on load
  const activeVariantBtn = Array.from(variantButtons).find(btn => 
    btn.textContent.trim().toLowerCase().replace(/\s+/g, '') === 
    selectedVariant.name.toLowerCase().replace(/\s+/g, '')
  );
  if (activeVariantBtn) {
    activeVariantBtn.classList.add('bg-primary', 'text-on-primary');
  }

  // Handle quantity input
  const quantityDisplay = document.querySelector('.flex.items-center.w-32.bg-surface-container-highest.rounded-xl.p-1 span.flex-grow.text-center.font-bold');
  const quantityMinusBtn = document.querySelector('div.flex.items-center.w-32 button:first-of-type');
  const quantityPlusBtn = document.querySelector('div.flex.items-center.w-32 button:last-of-type');

  if (quantityDisplay) {
    quantityDisplay.textContent = quantity;
  }

  if (quantityMinusBtn) {
    quantityMinusBtn.addEventListener('click', () => {
      if (quantity > 1) {
        quantity--;
        if (quantityDisplay) quantityDisplay.textContent = quantity;
      }
    });
  }

  if (quantityPlusBtn) {
    quantityPlusBtn.addEventListener('click', () => {
      quantity++;
      if (quantityDisplay) quantityDisplay.textContent = quantity;
    });
  }

  // Handle add to cart
  const addToCartBtn = document.querySelector('button:has-text("Add to Cart"), [data-ps-add-to-cart], button:has(span:only-child:last-of-type)');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const response = await fetch('/api/cart/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            variantName: selectedVariant.name,
            quantity: quantity,
            price: selectedVariant.price,
          }),
        });
        if (response.ok) {
          // Navigate to cart or show success message
          window.location.href = '/html/cart.html';
        }
      } catch (error) {
        console.error('Add to cart failed:', error);
      }
    });
  }
}

// Initialize cart page
function initCartPage() {
  let cartState = {
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
  };

  // Load cart from localStorage/sessionStorage
  const loadCart = async () => {
    try {
      // Get cart from API or localStorage
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        cartState = data;
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem('cart-items');
        cartState.items = saved ? JSON.parse(saved) : [];
      }
    } catch (error) {
      const saved = localStorage.getItem('cart-items');
      cartState.items = saved ? JSON.parse(saved) : [];
    }

    renderCart();
  };

  const renderCart = () => {
    const cartItemsContainer = document.querySelector('[data-ps-cart-items]');
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';

    if (cartState.items.length === 0) {
      // Show empty cart message
      const emptyMessage = document.querySelector('[data-ps-empty-cart]');
      if (emptyMessage) {
        emptyMessage.style.display = 'block';
      } else {
        cartItemsContainer.innerHTML = '<div class="text-center py-8">Your cart is empty</div>';
      }
      updateCartTotals();
      return;
    }

    // Hide empty message
    const emptyMessage = document.querySelector('[data-ps-empty-cart]');
    if (emptyMessage) {
      emptyMessage.style.display = 'none';
    }

    // Render each cart item
    cartState.items.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'flex items-center justify-between p-4 border-b';
      itemDiv.innerHTML = `
        <div class="flex-1">
          <h3 class="font-semibold">${item.productName || item.name}</h3>
          <p class="text-sm text-gray-600">${item.variantName || 'variant'}</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center bg-surface-container-highest rounded-lg">
            <button class="px-3 py-2 hover:bg-gray-200">
              <span class="material-symbols-outlined text-xl">remove</span>
            </button>
            <span class="px-4 font-semibold w-12 text-center">${item.quantity}</span>
            <button class="px-3 py-2 hover:bg-gray-200">
              <span class="material-symbols-outlined text-xl">add</span>
            </button>
          </div>
          <span class="text-xl font-bold text-primary">$${(item.price * item.quantity).toFixed(2)}</span>
          <button class="ml-4 px-4 py-2 text-red-600 hover:text-red-800">Remove</button>
        </div>
      `;

      // Add event listeners
      const removeBtn = itemDiv.querySelector('button:last-child');
      const minusBtn = itemDiv.querySelector('button:first-child');
      const plusBtn = itemDiv.querySelector('button:nth-child(3)');

      removeBtn.addEventListener('click', () => removeFromCart(index));
      minusBtn.addEventListener('click', () => updateQuantity(index, item.quantity - 1));
      plusBtn.addEventListener('click', () => updateQuantity(index, item.quantity + 1));

      cartItemsContainer.appendChild(itemDiv);
    });

    updateCartTotals();
  };

  const updateQuantity = async (index, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      const item = cartState.items[index];
      const response = await fetch('/api/cart/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          variantName: item.variantName,
          quantity: newQuantity,
        }),
      });
      if (response.ok) {
        item.quantity = newQuantity;
        renderCart();
      }
    } catch (error) {
      console.error('Update quantity failed:', error);
    }
  };

  const removeFromCart = async (index) => {
    try {
      const item = cartState.items[index];
      const response = await fetch('/api/cart/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          variantName: item.variantName,
        }),
      });
      if (response.ok) {
        cartState.items.splice(index, 1);
        renderCart();
      }
    } catch (error) {
      console.error('Remove from cart failed:', error);
    }
  };

  const updateCartTotals = () => {
    // Calculate totals
    const subtotal = cartState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    // Update subtotal
    const subtotalElements = document.querySelectorAll('div.flex.justify-between:has(span:has-text("Subtotal")) span.font-semibold.text-on-surface');
    subtotalElements.forEach(el => {
      el.textContent = `$${subtotal.toFixed(2)}`;
    });

    // Update tax
    const taxElements = document.querySelectorAll('div.flex.justify-between:has(span:has-text("Estimated Tax")) span.font-semibold.text-on-surface');
    taxElements.forEach(el => {
      el.textContent = `$${tax.toFixed(2)}`;
    });

    // Update total
    const totalElements = document.querySelectorAll('span.text-3xl.font-black.text-primary');
    totalElements.forEach(el => {
      el.textContent = `$${total.toFixed(2)}`;
    });

    // Update continue shopping link
    const continueShoppingLink = document.querySelector('[data-ps-continue-shopping]');
    if (continueShoppingLink) {
      continueShoppingLink.href = '/html/dogs.html';
    }
  };

  // Handle checkout
  const checkoutBtn = document.querySelector('button:has-text("Proceed to Checkout")');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      try {
        // Save cart state before checkout
        localStorage.setItem('cart-items', JSON.stringify(cartState.items));
        window.location.href = '/html/checkout.html';
      } catch (error) {
        console.error('Checkout failed:', error);
      }
    });
  }

  loadCart();
}

// Initialize checkout page
function initCheckoutPage() {
  // Handle order submission
  const checkoutForm = document.querySelector('form');
  if (!checkoutForm) return;

  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      // Get cart items from localStorage
      const cartItems = JSON.parse(localStorage.getItem('cart-items') || '[]');
      
      // Collect form data
      const formData = new FormData(checkoutForm);
      const orderData = {
        customer: {
          email: formData.get('email'),
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          phone: formData.get('phone'),
        },
        billing: {
          address: formData.get('address'),
          city: formData.get('city'),
          state: formData.get('state'),
          zip: formData.get('zip'),
        },
        items: cartItems,
      };

      // Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const order = await orderResponse.json();

      // Process payment
      const paymentData = {
        orderId: order.id,
        amount: order.total,
        cardNumber: formData.get('cardNumber'),
        expiry: formData.get('expiry'),
        cvv: formData.get('cvv'),
      };

      const paymentResponse = await fetch('/api/payments/stub/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      if (paymentResponse.ok) {
        // Clear cart and redirect to confirmation
        localStorage.removeItem('cart-items');
        // Redirect to order confirmation or home
        window.location.href = '/html/index.html?orderComplete=true';
      }
    } catch (error) {
      console.error('Checkout submission failed:', error);
      alert('Checkout failed. Please try again.');
    }
  });
}

// Initialize category page (dogs, cats, accessories, deals)
function initCategoryPage() {
  const productGrid = document.querySelector('[data-ps-product-grid]');
  if (!productGrid) return;

  productGrid.innerHTML = '';

  // Render hardcoded products
  Object.values(HARDCODED_PRODUCTS).forEach(product => {
    const productCard = document.createElement('a');
    productCard.href = `/product-detail.html?id=${product.id}`;
    productCard.className = 'flex flex-col gap-2 p-4 border rounded-lg hover:shadow-lg transition-shadow';
    
    const defaultVariant = product.variants[0];
    productCard.innerHTML = `
      <div class="w-full h-40 bg-gray-200 rounded flex items-center justify-center">
        <span class="text-gray-400">Product Image</span>
      </div>
      <h3 class="font-semibold line-clamp-2">${product.name}</h3>
      <p class="text-sm text-gray-600">$${defaultVariant.price.toFixed(2)}</p>
      <button class="mt-2 px-4 py-2 bg-primary text-on-primary rounded hover:opacity-90">
        Add to Cart
      </button>
    `;

    // Handle add to cart click
    const addBtn = productCard.querySelector('button');
    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Navigate to product detail page instead
      window.location.href = productCard.href;
    });

    productGrid.appendChild(productCard);
  });
}

// Initialize home page
function initHomePage() {
  initCategoryPage();
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLegacy);
} else {
  initLegacy();
}
