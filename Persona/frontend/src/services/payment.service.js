import api from "./axios"

export const createCheckoutSession = async ({
  mode,
  cart,
  productId,
  qty,
  couponCode
}) => {
  try {
    const { data } = await api.post(
      "/payment/create-checkout-session",
      {
        mode,
        cart,
        productId,
        qty,
        couponCode
      }
    )

    return data
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Payment failed"
    )
  }
}
