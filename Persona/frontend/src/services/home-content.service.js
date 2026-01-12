import api from "./axios"

export const getBanner = async () => {
  const response = await api.get("/home-content")
  return response
}


export const getHomeContent = () => api.get("/home-content")

export const updateHomeBanner = (formData) =>
  api.put("/home-content/home-banner", formData)

export const updateDiscountBanner = (payload) =>
  api.put("/home-content/discount-banner", payload)
