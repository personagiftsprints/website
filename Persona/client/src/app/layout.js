"use client"

import { useEffect, useState } from "react"
import { AuthProvider } from "@/context/AuthContext"
import AuthDrawer from "@/components/AuthDrawer"
import "./globals.css"

export default function RootLayout({ children }) {
  const [authOpen, setAuthOpen] = useState(false)

  useEffect(() => {
    const handler = () => setAuthOpen(true)
    window.addEventListener("open-auth", handler)
    return () => window.removeEventListener("open-auth", handler)
  }, [])

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}

          <AuthDrawer
            open={authOpen}
            onClose={() => setAuthOpen(false)}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
