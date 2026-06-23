import api from './axios'

export const getSettings = async () => {
  try {
    return await api.get('/settings')
  } catch (err) {
    console.error('Fetch settings error:', err)
    throw err
  }
}

export const updateSettings = async (data) => {
  try {
    return await api.put('/settings', data)
  } catch (err) {
    console.error('Update settings error:', err)
    throw err
  }
}

export const getPublicSettings = async () => {
  try {
    return await api.get('/settings/public')
  } catch (err) {
    console.error('Fetch public settings error:', err)
    throw err
  }
}

export const getMaintenanceStatus = async () => {
  try {
    const res = await api.get('/settings/public')
    return { data: res.data?.data?.maintenanceMode || { isActive: false } }
  } catch (err) {
    console.error('Fetch maintenance status error:', err)
    throw err
  }
}

export const testEmailService = async (email) => {
  try {
    return await api.post('/settings/test-email', { email })
  } catch (err) {
    console.error('Test email service error:', err)
    throw err
  }
}

