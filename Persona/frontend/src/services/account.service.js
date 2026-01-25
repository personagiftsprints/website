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

export const getMyAccount = async () => {
  const { data } = await api.get("/user/me")
  return data
}

export const addAddress = async payload => {
  const { data } = await api.post("/user/address", payload)
  return data
}

export const updateMyName = async payload => {
  const { data } = await api.put("/user/me", payload)
  return data
}


export const getUsers = async (page, q = "") => {
  const { data } = await api.get(
    `/admin/users?page=${page}&q=${encodeURIComponent(q)}`
  )
  return data
}