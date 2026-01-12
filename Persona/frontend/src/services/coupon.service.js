import api from "./axios"


export const generateCouponCode = async () => {
  const data = await api.get("/coupon/generate")
  return data.code
}

export const createCoupon = async (payload) => {
  const res = await api.post("/coupon", payload)
  return res.data
}

export const toggleCouponStatus = async (code) => {
  const res = await api.patch(`/coupon/${code}/coupon-status`)
  return res.data
}

export const deleteCoupon = async (code) => {
  const res = await api.delete(`/coupon/${code}`)
  return res.data
}

export const getAllCoupons = async () => {
  const res = await api.get("/coupon")
  return res
}
