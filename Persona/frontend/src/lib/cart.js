// =====================
// CART STORAGE HELPERS
// =====================

export const getCart = () => {
  return JSON.parse(localStorage.getItem("cart") || "[]")
}

export const saveCart = cart => {
  localStorage.setItem("cart", JSON.stringify(cart))
  window.dispatchEvent(new Event("cart-updated"))
}

export const getCartCount = () => {
  return getCart().reduce((sum, item) => sum + (item.quantity || 0), 0)
}

// =====================
// CART KEY GENERATOR
// =====================

const getCartKey = item => {
  const size = item.variant?.size || ""
  const color = item.variant?.color || ""
  const custom = item.customization?.enabled ? "custom" : "plain"

  return `${item.productId}-${size}-${color}-${custom}`
}

// =====================
// ADD TO CART (CORE)
// =====================

export const addToCart = product => {
  const cart = getCart()

  const cartItem = {
    cartKey: getCartKey(product),

    productId: product.productId,
    slug: product.slug,
    name: product.name,
    type: product.type,

    image: product.image,
    price: product.price,

    quantity: product.quantity || 1,

    variant: product.variant || null,

    customization: product.customization || { enabled: false },

    addedAt: Date.now()
  }

  const existing = cart.find(i => i.cartKey === cartItem.cartKey)

  if (existing) {
    existing.quantity += cartItem.quantity
  } else {
    cart.push(cartItem)
  }

  saveCart(cart)
}

// =====================
// REMOVE ITEM
// =====================

export const removeFromCart = cartKey => {
  const cart = getCart().filter(i => i.cartKey !== cartKey)
  saveCart(cart)
}

// =====================
// UPDATE QUANTITY
// =====================

export const updateQuantity = (cartKey, qty) => {
  if (qty < 1) return

  const cart = getCart().map(i =>
    i.cartKey === cartKey ? { ...i, quantity: qty } : i
  )

  saveCart(cart)
}

// =====================
// CLEAR CART (OPTIONAL)
// =====================

export const clearCart = () => {
  saveCart([])
}
