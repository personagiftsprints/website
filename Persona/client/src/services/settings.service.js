import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export const getSettings = async () => {
  try {
    const res = await axios.get(`${API_URL}/settings`)
    return res.data
  } catch (err) {
    console.error('Fetch settings error:', err)
    throw err
  }
}

export const updateSettings = async (data) => {
  try {
    const res = await axios.put(`${API_URL}/settings`, data)
    return res.data
  } catch (err) {
    console.error('Update settings error:', err)
    throw err
  }
}

export const getMaintenanceStatus = async () => {
  try {
    const res = await axios.get(`${API_URL}/settings/maintenance-status`)
    return res.data
  } catch (err) {
    console.error('Fetch maintenance status error:', err)
    throw err
  }
}
