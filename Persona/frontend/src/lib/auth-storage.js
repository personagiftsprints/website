const SESSION_DURATION = 30 * 60 * 1000

export const saveSession = ({ token, user }) => {
  const expiresAt = Date.now() + SESSION_DURATION
  localStorage.setItem(
    "auth",
    JSON.stringify({ token, user, expiresAt })
  )
}

export const getSession = () => {
  const raw = localStorage.getItem("auth")
  if (!raw) return null

  const session = JSON.parse(raw)
  if (Date.now() > session.expiresAt) {
    clearSession()
    return null
  }

  return session
}

export const clearSession = () => {
  localStorage.removeItem("auth")
}
