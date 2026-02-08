import api from "./axios"

export const createCheckoutSession = async ({
  mode,
  cart,
  productId,
  qty,
  couponCode,
  address
}) => {
  try {
    // ⚠️ api already points to BACKEND (http://localhost:4000)
    const data = await api.post(
      "/payment/create-checkout-session",
      {
        mode,
        cart,
        productId,
        qty,
        couponCode,
        address
      }
    )

    console.log("CHECKOUT SERVICE DATA:", data)

    // because of interceptor, `data` IS res.data
    return data
  } catch (err) {
    console.error("CHECKOUT API ERROR ❌", err.response || err)
    throw new Error(
      err.response?.data?.message || "Payment failed"
    )
  }
}
