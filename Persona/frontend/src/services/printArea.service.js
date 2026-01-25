import axios from "axios"

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"

export const getAvailablePrintConfigs = async () => {
  const res = await axios.get(`${API}/print-model/models`)
  return res.data?.data || []
}

export const getPrintConfigBySlug = async (slug) => {
  if (!slug) return null
  const res = await axios.get(`${API}/print-model/models/${slug}`)
  return res.data?.data || null
}

export const updatePrintConfig = async (slug, configId, payload) => {
  const res = await axios.put(
    `${API}/print-model/models/${slug}/${configId}`,
    payload
  )
  return res.data?.data
}
