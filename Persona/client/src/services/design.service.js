import api from './axios'

export const getDesignsByProductType = async (type) => {
  return await api.get(`/design-library/type/${type}`)
}

export const getAllDesigns = async (params = {}) => {
  return await api.get('/design-library', { params })
}

export const createDesign = async (data) => {
  return await api.post('/design-library', data)
}

export const getDesignById = async (id) => {
  return await api.get(`/design-library/${id}`)
}

export const updateDesign = async (id, data) => {
  return await api.put(`/design-library/${id}`, data)
}

export const deleteDesign = async (id) => {
  return await api.delete(`/design-library/${id}`)
}
