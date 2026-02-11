"use client"

import { useState } from "react"
import { Mail, Lock, User } from "lucide-react"
import { checkEmail, emailAuth, resetPassword } from "@/services/auth.service"
import { saveSession } from "@/lib/auth-storage"
import { useAuth } from "@/context/AuthContext"

export default function AuthDrawer({ open, onClose }) {
  const [step, setStep] = useState("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [loading, setLoading] = useState(false)
  const [isExistingUser, setIsExistingUser] = useState(false)
  const { setUser } = useAuth()

  const handleEmailSubmit = async () => {
    if (!email) return
    setLoading(true)
    const res = await checkEmail(email)
    setIsExistingUser(res.exists)
    setStep("details")
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!password) return
    setLoading(true)

    const payload = {
      email,
      password,
      ...(isExistingUser ? {} : { firstName, lastName }),
    }

    const res = await emailAuth(payload)

    if (res.token) {
      saveSession({ token: res.token, user: res.user })
      setUser(res.user)
      onClose()
    }

    setLoading(false)
  }

  const handleResetPassword = async () => {
    if (!newPassword) return
    setLoading(true)

    const res = await resetPassword(email, newPassword)
    if (res.status === "success") {
      setPassword("")
      setNewPassword("")
      setStep("details")
    }

    setLoading(false)
  }

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
    
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black ${open ? "opacity-40" : "opacity-0"}`}
      />

      <div className={`absolute right-0 top-0 h-full w-full max-w-lg bg-white ${open ? "translate-x-0" : "translate-x-full"} transition-transform`}>
        <div className="p-6 space-y-5">
          <h3 className="text-2xl font-semibold text-center">
            {step === "email"
              ? "Continue with Email"
              : step === "forgot"
              ? "Reset Password"
              : isExistingUser
              ? "Welcome Back"
              : "Create Your Account"}
          </h3>

          {step === "email" && (
            <>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg"
                />
              </div>

              <button
                disabled={loading}
                onClick={handleEmailSubmit}
                className="w-full py-3 bg-orange-600 text-white rounded-lg"
              >
                Continue
              </button>
            </>
          )}

          {step === "details" && isExistingUser && (
            <>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  type="password"
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg"
                />
              </div>

              <button
                disabled={loading}
                onClick={handleSubmit}
                className="w-full py-3 bg-orange-600 text-white rounded-lg"
              >
                Login
              </button>

              <button
                onClick={() => setStep("forgot")}
                className="w-full text-sm text-orange-600 mt-2"
              >
                Forgot password?
              </button>
            </>
          )}

          {step === "forgot" && (
            <>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  type="password"
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg"
                />
              </div>

              <button
                disabled={loading}
                onClick={handleResetPassword}
                className="w-full py-3 bg-orange-600 text-white rounded-lg"
              >
                Reset Password
              </button>

              <button
                onClick={() => setStep("details")}
                className="w-full text-sm text-gray-500"
              >
                Back to login
              </button>
            </>
          )}

          {step === "details" && !isExistingUser && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  type="text"
                  placeholder="First name"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg"
                />
              </div>

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  type="text"
                  placeholder="Last name (optional)"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  type="password"
                  placeholder="Create a password"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg"
                />
              </div>

              <button
                disabled={loading}
                onClick={handleSubmit}
                className="w-full py-3 bg-orange-600 text-white rounded-lg"
              >
                Create Account
              </button>
            </>
          )}

          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="w-full justify-center items-center flex   ">
              <button
            className=" py-3 border border-gray-200 p-2 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-gray-50"
            onClick={() => console.log("Google login")}
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="w-5 h-5"
            />
           
          </button>

          </div>
        
        </div>
      </div>
    </div>
  )
}
