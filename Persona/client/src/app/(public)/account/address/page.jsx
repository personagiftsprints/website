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
  phone: "",
  addressLine1: "",
  addressLine2: "",
  town: "",
  county: "",
  postcode: "",
  country: "United Kingdom"
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
  if (!form.addressLine1.trim()) e.addressLine1 = "Address required"
  if (!form.town.trim()) e.town = "Town required"

  const ukPostcodeRegex =
    /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i

  if (!form.postcode.trim())
    e.postcode = "Postcode required"
  else if (!ukPostcodeRegex.test(form.postcode))
    e.postcode = "Invalid UK postcode"

  if (!/^\+?[0-9]{10,15}$/.test(form.phone))
    e.phone = "Valid phone required"

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    e.email = "Valid email required"

  return e
}


const submit = async () => {
  setSubmitting(true)

  try {
    const res = await addAddress(form)
    setAddresses(res.addresses)
    setShowForm(false)

    setForm({
      fullName: "",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      town: "",
      county: "",
      postcode: "",
      country: "United Kingdom"
    })
  } catch (err) {
    console.error("Failed to save address", err)
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
    placeholder="Email Address"
    value={form.email}
    onChange={e => setForm({ ...form, email: e.target.value })}
    className="w-full border px-4 py-2 rounded"
  />

  <input
    placeholder="Phone Number"
    value={form.phone}
    onChange={e => setForm({ ...form, phone: e.target.value })}
    className="w-full border px-4 py-2 rounded"
  />

  <input
    placeholder="Address Line 1 (House number & Street)"
    value={form.addressLine1}
    onChange={e => setForm({ ...form, addressLine1: e.target.value })}
    className="w-full border px-4 py-2 rounded"
  />

  <input
    placeholder="Address Line 2 (Flat, Building - Optional)"
    value={form.addressLine2}
    onChange={e => setForm({ ...form, addressLine2: e.target.value })}
    className="w-full border px-4 py-2 rounded"
  />

  <div className="grid sm:grid-cols-2 gap-4">
    <input
      placeholder="Town / City"
      value={form.town}
      onChange={e => setForm({ ...form, town: e.target.value })}
      className="border px-4 py-2 rounded"
    />

    <input
      placeholder="County (Optional)"
      value={form.county}
      onChange={e => setForm({ ...form, county: e.target.value })}
      className="border px-4 py-2 rounded"
    />
  </div>

  <div className="grid sm:grid-cols-2 gap-4">
    <input
      placeholder="Postcode"
      value={form.postcode}
      onChange={e =>
        setForm({ ...form, postcode: e.target.value.toUpperCase() })
      }
      className="border px-4 py-2 rounded uppercase"
    />

    <input
      value="United Kingdom"
      disabled
      className="border px-4 py-2 rounded bg-gray-100 text-gray-600"
    />
  </div>

  <button
    onClick={submit}
    disabled={submitting}
    className="bg-black text-white px-6 py-3 rounded"
  >
    {submitting ? "Saving..." : "Save Address"}
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
               <p className="text-sm">{address.addressLine1}</p>
{address.addressLine2 && (
  <p className="text-sm">{address.addressLine2}</p>
)}
<p className="text-sm">{address.town}</p>
{address.county && (
  <p className="text-sm">{address.county}</p>
)}
<p className="text-sm font-medium">{address.postcode}</p>
<p className="text-sm">{address.phone}</p>


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
