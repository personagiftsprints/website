import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  withCredentials: true
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err)
)

export default api
