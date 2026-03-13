"use client"

import { useState, useEffect } from "react"
import { getMaintenanceStatus } from "@/services/settings.service"
import { usePathname } from "next/navigation"

export default function MaintenanceOverlay() {
  const [maintenance, setMaintenance] = useState({ isActive: false })
  const pathname = usePathname()

  useEffect(() => {
    // We don't want to block admin pages
    if (pathname?.startsWith('/admin')) return

    const checkStatus = async () => {
      try {
        const res = await getMaintenanceStatus()
        setMaintenance(res.data)
      } catch (err) {
        console.error("Maintenance check failed:", err)
      }
    }

    checkStatus()
    // Check every 5 minutes
    const interval = setInterval(checkStatus, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [pathname])

  if (!maintenance.isActive) return null

  const timeLeft = maintenance.expectedEndTime ? new Date(maintenance.expectedEndTime) : null

  return (
    <div className="fixed inset-0 z-[100000] bg-white flex items-center justify-center p-6 text-center">
      <div className="max-w-2xl space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-8xl animate-bounce">🚧</div>
        
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
          Under Maintenance
        </h1>
        
        <p className="text-xl text-gray-600 leading-relaxed max-w-lg mx-auto">
          {maintenance.message || "We're currently performing some scheduled maintenance to improve your experience. We'll be back shortly!"}
        </p>

        {timeLeft && (
          <div className="inline-block bg-orange-50 border border-orange-200 rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-bold text-orange-800 uppercase tracking-widest mb-2">Estimated Uptime</p>
            <p className="text-3xl font-black text-orange-900">
              {timeLeft.toLocaleDateString()} {timeLeft.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}

        <div className="pt-8 flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
          </div>
          <p className="text-sm text-gray-400 font-medium">Thank you for your patience</p>
        </div>
      </div>
      
      {/* Premium background accents */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-red-500 to-purple-600"></div>
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-orange-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
    </div>
  )
}
