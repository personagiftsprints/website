import api from "./axios"

/**
 * CREATE PRODUCT
 */
export const createProduct = (payload, images = []) => {
  const formData = new FormData()

  formData.append("data", JSON.stringify(payload))

  images.forEach((file) => {
    formData.append("images", file)
  })

  return api.post("/products", formData)
}

/**
 * UPDATE PRODUCT
 */
export const updateProduct = (id, payload, newImages = []) => {
  const formData = new FormData()

  formData.append("data", JSON.stringify(payload))

  newImages.forEach((file) => {
    formData.append("images", file)
  })

  return api.put(`/products/${id}`, formData)
}

/**
 * GET ALL PRODUCTS (pagination supported)
 */
export const getAllProducts = (params = {}) => {
  return api.get("/products", { params })
}

/**
 * GET PRODUCT BY ID
 */
export const getProductById = (id) => {
  return api.get(`/products/${id}`)
}

/**
 * DEACTIVATE PRODUCT
 */
export const deactivateProduct = (id) => {
  return api.patch(`/products/${id}/deactivate`)
}


export const getProductsByIds = (productIds = []) => {
  return api.post("/products/bulk", { productIds })
}