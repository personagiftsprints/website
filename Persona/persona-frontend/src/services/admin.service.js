import axios from "axios"
import { getSession } from "@/lib/auth-storage"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"

const api = axios.create({
  baseURL: API_BASE,
})

/* ================= AUTH HEADER ================= */
api.interceptors.request.use(config => {
  const session = getSession()
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`
  }
  return config
})

export const getAdmins = async () => {
  const { data } = await api.get("/admin/admins")
  return data
}

/* =================================================
   GRANT ADMIN ACCESS (EMAIL + ROLE)
================================================= */
export const grantAdminAccess = async ({ email, role }) => {
  const { data } = await api.post("/admin/admins", {
    email,
    role
  })
  return data
}
/* =================================================
   GET ALL ORDERS (ADMIN)
================================================= */
export const getAllOrdersAdmin = async () => {
  const { data } = await api.get("/admin/orders")
  return data
}

/* =================================================
   GET SINGLE ORDER BY ID (ADMIN)
================================================= */
export const getOrderAdminById = async orderId => {
  const { data } = await api.get(`/admin/orders/${orderId}`)
  return data
}

/* =================================================
   UPDATE ORDER STATUS (ADMIN)
================================================= */
export const updateOrderStatus = async (orderId, status) => {
  const { data } = await api.patch(
    `/admin/orders/${orderId}/status`,
    { status }
  )
  return data
}
