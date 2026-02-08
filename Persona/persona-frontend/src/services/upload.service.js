import axios from './axios'
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
})
export async function uploadImagesToCloudinary(files) {
  if (!files || !files.length) return []

  const formData = new FormData()

  files.forEach(file => {
    formData.append('images', file)
  })

  const response = await api.post('/uploads/images', formData, {
    headers: {      'Content-Type': 'multipart/form-data'
    }
  })

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Image upload failed')
  }

  return response.data.data
}
