"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import axios from "axios"
import { Lock } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL

export default function ResetPasswordClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      router.push("/")
    }
  }, [token, router])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!password || !confirmPassword)
      return setError("Please fill all fields")

    if (password !== confirmPassword)
      return setError("Passwords do not match")

    if (password.length < 6)
      return setError("Password must be at least 6 characters")

    try {
      setLoading(true)
      setError("")

      const res = await axios.post(`${API}/auth/password/reset`, {
        token,
        newPassword: password
      })

      if (res.data.status === "success") {
        setSuccess(true)
        setTimeout(() => router.push("/login"), 2000)
      }

    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired link")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">

        <h2 className="text-2xl font-semibold text-center mb-6">
          Set New Password
        </h2>

        {success ? (
          <div className="text-center text-green-600">
            Password reset successful.<br />
            Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg"
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 text-center">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full py-3 bg-orange-600 text-white rounded-lg"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>

          </form>
        )}

      </div>
    </div>
  )
}
