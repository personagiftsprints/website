import axios from "axios"

const API = process.env.NEXT_PUBLIC_API_URL

export const checkEmail = async (email) => {
  const res = await axios.post(`${API}/auth/email/check`, { email })
  return res.data
}

export const emailAuth = async (payload) => {
  const res = await axios.post(`${API}/auth/email/auth`, payload)
  return res.data
}

export const resetPassword = async (email, newPassword) => {
  const res = await axios.post(`${API}/auth/password/reset`, {
    email,
    newPassword,
  })
  return res.data
}


export const googleAuth = async (token) => {
  const res = await axios.post(`${API}/auth/google`, { token })
  return res.data
}


export const sendResetLink = async (email) => {
  const res = await axios.post(`${API}/auth/password/request-reset`, { email })
  return res.data
}
