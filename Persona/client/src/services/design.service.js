import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export const getDesignsByProductType = async (type) => {
  try {
    const res = await axios.get(`${API_URL}/design-library/type/${type}`)
    return res.data
  } catch (err) {
    console.error('Fetch designs error:', err)
    throw err
  }
}

export const getAllDesigns = async (params = {}) => {
  try {
    const res = await axios.get(`${API_URL}/design-library`, { params })
    return res.data
  } catch (err) {
    console.error('Fetch all designs error:', err)
    throw err
  }
}

export const createDesign = async (data) => {
  try {
    const res = await axios.post(`${API_URL}/design-library`, data)
    return res.data
  } catch (err) {
    console.error('Create design error:', err)
    throw err
  }
}

export const deleteDesign = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/design-library/${id}`)
    return res.data
  } catch (err) {
    console.error('Delete design error:', err)
    throw err
  }
}
