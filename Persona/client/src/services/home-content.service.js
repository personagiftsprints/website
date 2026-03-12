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

export const addHomeBanner = (formData) =>
  api.post("/home-content/home-banners", formData)

export const deleteHomeBanner = (id) =>
  api.delete(`/home-content/home-banners/${id}`)
