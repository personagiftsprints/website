"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getSession, clearSession } from "@/lib/auth-storage"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const session = getSession()
    if (session) setUser(session.user)
  }, [])

  const logout = () => {
    clearSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
