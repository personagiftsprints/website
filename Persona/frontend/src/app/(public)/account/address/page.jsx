"use client"

import { useEffect, useState } from "react"
import { getMyAccount, addAddress } from "@/services/account.service"
import { 
  MapPin, 
  Plus, 
  X, 
  Check, 
  Home, 
  Phone, 
  Map, 
  Building, 
  Hash,
  Loader2,
  Trash2,
  Edit2
} from "lucide-react"

export default function AddressPage() {
  const [addresses, setAddresses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    fullName: "",
    street: "",
    city: "",
    postcode: "",
    phone: "",
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    getMyAccount().then(res => {
      setAddresses(res.user.addresses || [])
      setLoading(false)
    })
  }, [])

const validateForm = () => {
  const newErrors = {}

  if (!form.fullName.trim()) {
    newErrors.fullName = "Full name is required"
  } else if (form.fullName.trim().length < 3) {
    newErrors.fullName = "Full name must be at least 3 characters"
  }

  if (!form.street.trim()) {
    newErrors.street = "Street address is required"
  } else if (form.street.trim().length < 5) {
    newErrors.street = "Street address must be at least 5 characters"
  }

  if (!form.city.trim()) {
    newErrors.city = "City is required"
  } else if (form.city.trim().length < 2) {
    newErrors.city = "City must be at least 2 characters"
  }

  return newErrors
}


  const submit = async () => {
    const validationErrors = validateForm()
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    
    setSubmitting(true)
    setErrors({})
    
    try {
      const res = await addAddress(form)
      setAddresses(res.addresses)
      resetForm()
    } catch (error) {
      console.error("Failed to add address:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setForm({ 
      fullName: "", 
      street: "", 
      city: "", 
      postcode: "", 
      phone: "" 
    })
    setErrors({})
    setShowForm(false)
  }

  const inputFields = [
    {
      key: "fullName",
      placeholder: "Full Name",
      icon: Home,
      type: "text",
      minLength: 3,
      maxLength: 100
    },
    {
      key: "street",
      placeholder: "Street Address",
      icon: Map,
      type: "text",
      minLength: 5,
      maxLength: 200
    },
    {
      key: "city",
      placeholder: "City",
      icon: Building,
      type: "text",
      minLength: 2,
      maxLength: 50
    },
    {
      key: "postcode",
      placeholder: "Postcode (e.g., SW1A 1AA)",
      icon: Hash,
      type: "text",
      pattern: "^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$",
      maxLength: 8
    },
    {
      key: "phone",
      placeholder: "Phone Number",
      icon: Phone,
      type: "tel",
      pattern: "^[\\+]?[1-9][\\d]{0,15}$",
      minLength: 10,
      maxLength: 15
    }
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6" />
          <h2 className="text-xl font-semibold">Addresses</h2>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
        >
          {showForm ? (
            <>
              <X size={16} />
              Cancel
            </>
          ) : (
            <>
              <Plus size={16} />
              Add Address
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Plus size={18} />
            Add New Address
          </h3>
          
          <div className="space-y-4">
            {inputFields.map(({ key, placeholder, icon: Icon, type, minLength, maxLength, pattern }) => (
              <div key={key}>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Icon size={18} />
                  </div>
                  <input
                    type={type}
                    className={`w-full border rounded-lg px-12 py-3 text-sm transition-colors ${
                      errors[key] 
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                        : "border-gray-300 focus:border-black focus:ring-black"
                    }`}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={e => {
                      setForm({ ...form, [key]: e.target.value })
                      if (errors[key]) setErrors({ ...errors, [key]: "" })
                    }}
                    minLength={minLength}
                    maxLength={maxLength}
                    pattern={pattern}
                  />
                </div>
                {errors[key] && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <X size={14} />
                    {errors[key]}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={submit}
              disabled={submitting}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Save Address
                </>
              )}
            </button>
            <button
              onClick={resetForm}
              disabled={submitting}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold flex items-center gap-2">
            <Home size={18} />
            Saved Addresses
          </h3>
          <span className="text-sm text-gray-500">
            {addresses.length} address{addresses.length !== 1 ? 'es' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No addresses added yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
            >
              <Plus size={16} />
              Add Your First Address
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((address, index) => (
              <div 
                key={index} 
                className="border rounded-lg p-5 hover:border-gray-400 transition-colors relative group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        <Home size={16} className="text-gray-500" />
                        {address.fullName}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 break-words">
                        {address.street}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.city}, {address.postcode}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                        <Phone size={14} />
                        {address.phone}
                      </p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-gray-100 rounded">
                        <Edit2 size={16} className="text-gray-600" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded">
                        <Trash2 size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <button className="text-sm text-black font-medium hover:text-gray-700">
                      Use this address
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}