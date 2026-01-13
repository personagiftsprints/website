// components/ErrorState.jsx
import React from "react"
import { useRouter } from "next/navigation"

export default function ErrorState({ error, onBack }) {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={onBack || (() => router.push("/admin/print-config"))} className="text-blue-600 hover:underline">
          Back to configurations
        </button>
      </div>
    </div>
  )
}