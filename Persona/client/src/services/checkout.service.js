import api from "./axios"

export const applyCoupon = async (code) => {
  const data = await api.post("/coupon/apply", { code })
  return data
}
