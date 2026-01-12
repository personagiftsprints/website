import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true
})

api.interceptors.request.use((config) => {
  console.log("API CALL →", config.method?.toUpperCase(), config.url)
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err)
)

export default api
