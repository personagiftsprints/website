import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  withCredentials: true
})

/* ================= REQUEST INTERCEPTOR ================= */
api.interceptors.request.use(
  config => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("auth")
      if (raw) {
        const { token } = JSON.parse(raw)
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
    }
    return config
  },
  error => Promise.reject(error)
)

/* ================= RESPONSE INTERCEPTOR ================= */
api.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err)
)

export default api
