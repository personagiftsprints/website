"use client"

import { useEffect, useState } from "react"
import { getMyAccount, updateMyName } from "@/services/account.service"
import { User, Mail, Edit2, Check, X, Loader2 } from "lucide-react"

export default function MyAccountPage() {
  const [user, setUser] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ firstName: "", lastName: "" })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyAccount().then(res => {
      setUser(res.user)
      setForm({
        firstName: res.user.firstName || "",
        lastName: res.user.lastName || "",
      })
      setLoading(false)
    })
  }, [])

  const validateForm = () => {
    const newErrors = {}
    
    if (!form.firstName.trim()) {
      newErrors.firstName = "First name is required"
    } else if (form.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters"
    } else if (form.firstName.trim().length > 50) {
      newErrors.firstName = "First name must be less than 50 characters"
    }
    
    if (!form.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    } else if (form.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters"
    } else if (form.lastName.trim().length > 50) {
      newErrors.lastName = "Last name must be less than 50 characters"
    }
    
    return newErrors
  }

  const save = async () => {
    const validationErrors = validateForm()
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    
    setSaving(true)
    setErrors({})
    
    try {
      const res = await updateMyName(form)
      setUser(res.user)
      setEditing(false)
    } catch (error) {
      console.error("Failed to update name:", error)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    })
    setErrors({})
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="bg-white border rounded-xl p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="h-6 w-6" />
          <h2 className="text-xl font-semibold">My Account</h2>
        </div>
        
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
          >
            <Edit2 size={16} />
            Edit Name
          </button>
          
        )}

        
      </div>

      {!editing ? (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="font-medium">
                  {user.firstName} {user.lastName}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Email Address</p>
                <p className="font-medium break-all">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
        <div className="space-y-4">
  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
    <User className="h-5 w-5 text-gray-500 mt-0.5" />
    <div>
      <p className="text-sm text-gray-600">Full Name</p>
      <p className="font-medium">
        {user.firstName} {user.lastName}
      </p>
    </div>
  </div>

  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
    <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
    <div>
      <p className="text-sm text-gray-600">Email Address</p>
      <p className="font-medium break-all">{user.email}</p>
    </div>
  </div>


</div>




          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Save Changes
                </>
              )}
            </button>
            <button
              onClick={resetForm}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <X size={16} />
              Cancel
            </button>
          </div>

          
        </div>
        
      )}
        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
    <User className="h-5 w-5 text-gray-500 mt-0.5" />
    <div>
      <p className="text-sm text-gray-600">Sign-in Method</p>
      <p className="font-medium capitalize">
        {user.provider === "google"
          ? "Google"
          : user.provider === "email"
          ? "Email & Password"
          : "Unknown"}
      </p>
    </div>
  </div>
    </div>
  )
}