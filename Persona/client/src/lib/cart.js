// utils/cart.js

// Cart structure:
// {
//   items: [
//     {
//       cartItemId: "cart-123456",
//       productId: "prod-123",
//       productSlug: "premium-tshirt",
//       productName: "Premium T-Shirt",
//       productType: "tshirt",
//       price: 29.99,
//       currency: "$",
//       quantity: 1,
//       variant: {
//         size: "M",
//         color: "black",
//         view: "front" // or "back" or "both"
//       },
//       printConfig: {
//         type: "tshirt_print",
//         areas: [...],
//         totalAreas: 2,
//         uploadedAreas: 1
//       },
//       designImages: {
//         cloudinaryUrls: { "area-1": "https://..." },
//         designId: "design-123"
//       },
//       metadata: {...},
//       designId: "design-123",
//       addedAt: "2024-01-15T10:30:00Z",
//       status: "active"
//     }
//   ],
//   summary: {
//     subtotal: 29.99,
//     totalItems: 1,
//     totalDesigns: 1
//   }
// }

class CartManager {
  constructor() {
    this.cartKey = 'shopping_cart';
    this.designsKey = 'tshirtDesigns';
  }

  // Initialize or get cart
  getCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(this.cartKey));
      return cart || this.createEmptyCart();
    } catch (error) {
      console.error('Error getting cart:', error);
      return this.createEmptyCart();
    }
  }

  // Create empty cart structure
  createEmptyCart() {
    return {
      items: [],
      summary: {
        subtotal: 0,
        totalItems: 0,
        totalDesigns: 0,
        currency: '$'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Save cart to localStorage
  saveCart(cart) {
    try {
      cart.updatedAt = new Date().toISOString();
      localStorage.setItem(this.cartKey, JSON.stringify(cart));
      return true;
    } catch (error) {
      console.error('Error saving cart:', error);
      return false;
    }
  }

  // Add item to cart
  addToCart(itemData) {
    const cart = this.getCart();
    
    // Generate unique cart item ID
    const cartItemId = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create cart item structure
    const cartItem = {
      cartItemId,
      productId: itemData.productId || '',
      productSlug: itemData.productSlug || '',
      productName: itemData.productName || 'Custom T-Shirt',
      productType: itemData.productType || 'tshirt',
      price: parseFloat(itemData.price) || 0,
      currency: itemData.currency || '$',
      quantity: parseInt(itemData.quantity) || 1,
      variant: {
        size: itemData.variant?.size || 'M',
        color: itemData.variant?.color || 'black',
        view: itemData.variant?.view || 'front'
      },
      printConfig: itemData.printConfig || {
        type: 'tshirt_print',
        areas: [],
        totalAreas: 0,
        uploadedAreas: 0
      },
      designImages: {
        cloudinaryUrls: itemData.designImages?.cloudinaryUrls || {},
        designId: itemData.designId || ''
      },
      metadata: itemData.metadata || {},
      designId: itemData.designId || '',
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    };

    // Add to cart
    cart.items.push(cartItem);
    
    // Update summary
    this.updateCartSummary(cart);
    
    // Save cart
    this.saveCart(cart);
    
    return {
      success: true,
      cartItemId,
      message: 'Item added to cart',
      item: cartItem
    };
  }

  // Update cart item quantity
  updateQuantity(cartItemId, quantity) {
    if (quantity < 1) {
      return this.removeFromCart(cartItemId);
    }

    const cart = this.getCart();
    const itemIndex = cart.items.findIndex(item => item.cartItemId === cartItemId);
    
    if (itemIndex === -1) {
      return { success: false, message: 'Item not found in cart' };
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].updatedAt = new Date().toISOString();
    
    this.updateCartSummary(cart);
    this.saveCart(cart);
    
    return {
      success: true,
      message: 'Quantity updated',
      item: cart.items[itemIndex]
    };
  }

  // Remove item from cart
  removeFromCart(cartItemId) {
    const cart = this.getCart();
    const initialLength = cart.items.length;
    
    cart.items = cart.items.filter(item => item.cartItemId !== cartItemId);
    
    if (cart.items.length === initialLength) {
      return { success: false, message: 'Item not found in cart' };
    }
    
    this.updateCartSummary(cart);
    this.saveCart(cart);
    
    return {
      success: true,
      message: 'Item removed from cart',
      cartItemId
    };
  }

  // Clear entire cart
  clearCart() {
    const emptyCart = this.createEmptyCart();
    this.saveCart(emptyCart);
    return {
      success: true,
      message: 'Cart cleared successfully'
    };
  }

  // Update cart summary
  updateCartSummary(cart) {
    let subtotal = 0;
    let totalItems = 0;
    
    cart.items.forEach(item => {
      subtotal += parseFloat(item.price) * (item.quantity || 1);
      totalItems += item.quantity || 1;
    });
    
    cart.summary = {
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalItems,
      totalDesigns: cart.items.length,
      currency: cart.items[0]?.currency || '$'
    };
    
    return cart;
  }

  // Get cart summary
  getCartSummary() {
    const cart = this.getCart();
    return cart.summary;
  }

  // Get item count
  getItemCount() {
    const cart = this.getCart();
    return cart.summary.totalItems || 0;
  }

  // Get design count
  getDesignCount() {
    const cart = this.getCart();
    return cart.summary.totalDesigns || 0;
  }

  // Get cart total
  getCartTotal() {
    const cart = this.getCart();
    return cart.summary.subtotal || 0;
  }

  // Check if item exists in cart
  itemExists(designId, variant) {
    const cart = this.getCart();
    return cart.items.some(item => 
      item.designId === designId && 
      item.variant.size === variant?.size &&
      item.variant.color === variant?.color &&
      item.variant.view === variant?.view
    );
  }

  // Merge guest cart with user cart (for login)
  mergeCarts(guestCart, userCart) {
    const mergedCart = this.createEmptyCart();
    
    // Add all items from both carts, avoiding duplicates
    const allItems = [...guestCart.items, ...userCart.items];
    const uniqueItems = [];
    const seenDesigns = new Set();
    
    allItems.forEach(item => {
      const itemKey = `${item.designId}-${item.variant.size}-${item.variant.color}-${item.variant.view}`;
      if (!seenDesigns.has(itemKey)) {
        seenDesigns.add(itemKey);
        uniqueItems.push(item);
      }
    });
    
    mergedCart.items = uniqueItems;
    this.updateCartSummary(mergedCart);
    this.saveCart(mergedCart);
    
    return mergedCart;
  }

  // Export cart for API submission
  exportCartForAPI() {
    const cart = this.getCart();
    
    return {
      items: cart.items.map(item => ({
        cartItemId: item.cartItemId,
        productId: item.productId,
        productName: item.productName,
        productType: item.productType,
        price: item.price,
        currency: item.currency,
        quantity: item.quantity,
        variant: item.variant,
        printConfig: item.printConfig,
        designImages: {
          // Only send references, not full images
          cloudinaryUrls: item.designImages.cloudinaryUrls,
          designId: item.designId
        },
        metadata: item.metadata,
        designId: item.designId
      })),
      summary: cart.summary,
      sessionId: this.getSessionId()
    };
  }

  // Get or create session ID
  getSessionId() {
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  }

  // Sync cart with backend
  async syncWithBackend() {
    try {
      const cartData = this.exportCartForAPI();
      
      const response = await fetch('/api/cart/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync cart');
      }
      
      const result = await response.json();
      return {
        success: true,
        message: 'Cart synced successfully',
        data: result
      };
      
    } catch (error) {
      console.error('Cart sync error:', error);
      return {
        success: false,
        message: 'Failed to sync cart. Changes saved locally.',
        error: error.message
      };
    }
  }

  // Get related design from localStorage
  getDesignDetails(designId) {
    try {
      const designs = JSON.parse(localStorage.getItem(this.designsKey) || '[]');
      return designs.find(design => design.id === designId) || null;
    } catch (error) {
      console.error('Error getting design details:', error);
      return null;
    }
  }

  // Get cart with design details
  getCartWithDesignDetails() {
    const cart = this.getCart();
    
    const itemsWithDesigns = cart.items.map(item => {
      const designDetails = this.getDesignDetails(item.designId);
      return {
        ...item,
        designDetails: designDetails ? {
          previewImage: designDetails.previewImage,
          savedAt: designDetails.savedAt,
          areaConfigurations: designDetails.areaConfigurations
        } : null
      };
    });
    
    return {
      ...cart,
      items: itemsWithDesigns
    };
  }
}

// Create singleton instance
const cartManager = new CartManager();

export default cartManager;