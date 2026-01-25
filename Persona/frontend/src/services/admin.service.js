import axios from "axios"
import { getSession } from "@/lib/auth-storage"

const API_BASE = process.env.NEXT_PUBLIC_API_URL

const api = axios.create({
  baseURL: API_BASE,
})

api.interceptors.request.use(config => {
  const session = getSession()
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`
  }
  return config
})


export const grantAdminAccess = async email => {
  const { data } = await api.post("/admin/grant-admin", { email })
  return data
}

export const getAdmins = async () => {
  const { data } = await api.get("/admin/admins")
  return data
}