const SESSION_DURATION = 24 * 60 * 60 * 1000 // 1 day

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
    localStorage.removeItem("auth")
    return null
  }

  return session
}
