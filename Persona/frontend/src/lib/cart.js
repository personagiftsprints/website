export const getCart = () => {
  return JSON.parse(localStorage.getItem("cart") || "[]")
}

export const saveCart = cart => {
  localStorage.setItem("cart", JSON.stringify(cart))
  window.dispatchEvent(new Event("cart-updated"))
}

export const getCartCount = () => {
  const cart = getCart()
  return cart.reduce((sum, item) => sum + (item.quantity || 0), 0)
}

export const addToCart = item => {
  const cart = getCart()

  const existing = cart.find(
    i =>
      i.productId === item.productId &&
      i.isCustom === item.isCustom &&
      JSON.stringify(i.design) === JSON.stringify(item.design)
  )

  if (existing) {
    existing.quantity += item.quantity
  } else {
    cart.push(item)
  }

  saveCart(cart)
}

export const removeFromCart = id => {
  const cart = getCart().filter(i => i.id !== id)
  saveCart(cart)
}

export const updateQuantity = (id, qty) => {
  if (qty < 1) return

  const cart = getCart().map(i =>
    i.id === id ? { ...i, quantity: qty } : i
  )

  saveCart(cart)
}
