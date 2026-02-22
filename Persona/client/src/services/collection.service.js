import api from "./axios"

export const createCollection = async (payload) => {
  return await api.post("/collections", payload)
}

export const getAllCollections = async (page = 1, limit = 10) => {
  return await api.get("/collections", {
    params: { page, limit }
  })
}

export const getActiveCollections = async () => {
  return await api.get("/collections/active")
}

export const getCollectionById = async (id) => {
  return await api.get(`/collections/${id}`)
}

export const updateCollection = async (id, payload) => {
  return await api.put(`/collections/${id}`, payload)
}

export const deleteCollection = async (id) => {
  return await api.delete(`/collections/${id}`)
}