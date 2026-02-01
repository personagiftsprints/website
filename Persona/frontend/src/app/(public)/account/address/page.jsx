"use client"

import { useEffect, useState } from "react"
import { getMyAccount, addAddress, removeAddress } from "@/services/account.service"
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
  Edit2,
  Mail
} from "lucide-react"

export default function AddressPage() {
  const [addresses, setAddresses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    street: "",
    city: "",
    postcode: "",
    phone: ""
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    getMyAccount().then(res => {
      setAddresses(res.user.addresses || [])
      setLoading(false)
    })
  }, [])

  /* ---------------- REMOVE ADDRESS ---------------- */
  const handleRemoveAddress = async (addressId) => {
    if (!confirm("Remove this address?")) return

    setDeletingId(addressId)

    try {
      const res = await removeAddress(addressId)
      setAddresses(res.addresses)
    } catch (err) {
      console.error("Failed to remove address", err)
    } finally {
      setDeletingId(null)
    }
  }




  /* ---------------- VALIDATION ---------------- */
  const validateForm = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = "Full name required"
    if (!form.street.trim()) e.street = "Street required"
    if (!form.city.trim()) e.city = "City required"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required"
    return e
  }

  const submit = async () => {
    const v = validateForm()
    if (Object.keys(v).length) {
      setErrors(v)
      return
    }

    setSubmitting(true)
    try {
      const res = await addAddress(form)
      setAddresses(res.addresses)
      setShowForm(false)
      setForm({
        fullName: "",
        email: "",
        street: "",
        city: "",
        postcode: "",
        phone: ""
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-white border rounded-xl p-6 flex justify-between">
        <div className="flex gap-3 items-center">
          <MapPin />
          <h2 className="text-xl font-semibold">Addresses</h2>
        </div>

        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-black text-white px-4 py-2 rounded-lg flex gap-2"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "Add Address"}
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <input
            placeholder="Full Name"
            value={form.fullName}
            onChange={e => setForm({ ...form, fullName: e.target.value })}
            className="w-full border px-4 py-2 rounded"
          />

          <input
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full border px-4 py-2 rounded"
          />

          <input
            placeholder="Street"
            value={form.street}
            onChange={e => setForm({ ...form, street: e.target.value })}
            className="w-full border px-4 py-2 rounded"
          />

          <input
            placeholder="City"
            value={form.city}
            onChange={e => setForm({ ...form, city: e.target.value })}
            className="w-full border px-4 py-2 rounded"
          />

          <button
            onClick={submit}
            disabled={submitting}
            className="bg-black text-white px-6 py-3 rounded"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      )}

      {/* ADDRESS LIST */}
      <div className="bg-white border rounded-xl p-6">
        {loading ? (
          <Loader2 className="animate-spin mx-auto" />
        ) : addresses.length === 0 ? (
          <p className="text-center text-gray-500">No addresses</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {addresses.map(address => (
              <div
                key={address._id}
                className="border rounded-lg p-5 group relative"
              >
                <p className="font-semibold">{address.fullName}</p>
                <p className="text-sm">{address.email}</p>
                <p className="text-sm">{address.street}</p>
                <p className="text-sm">{address.city} {address.postcode}</p>

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleRemoveAddress(address._id)}
                    disabled={deletingId === address._id}
                    className="p-2 hover:bg-red-50 rounded"
                  >
                    {deletingId === address._id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <button
  onClick={() => handleRemoveAddress(address._id)}
  className="p-1.5 hover:bg-red-100 rounded"
>
  <Trash2 size={16} className="text-red-600" />
</button>

                    )}
                  </button>
                </div>
              </div>
            ))}
 a         </div>
        )}
      </div>
    </div>
  )
}
