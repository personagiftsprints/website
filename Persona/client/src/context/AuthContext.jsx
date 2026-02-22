"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getSession } from "@/lib/auth-storage"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = getSession()

    if (session?.user) {
      setUser(session.user)
    }

    setLoading(false)
  }, [])

  const logout = () => {
    localStorage.removeItem("auth")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)