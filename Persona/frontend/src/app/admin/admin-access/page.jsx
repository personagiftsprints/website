"use client"

import { useState } from "react"

export default function AdminAccessPage() {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("admin")

  function handleSubmit(e) {
    e.preventDefault()

    const payload = {
      email,
      role,
    }

    console.log("Create admin:", payload)

    // TODO:
    // POST /api/admin/create-admin
    // setEmail("")
  }

  return (
    <div className="max-w-xl bg-white p-6 ">
      <h1 className="text-xl font-bold mb-2">Admin Access</h1>
      <p className="text-sm text-gray-600 mb-6">
        Add new admin users and assign roles
      </p>
 
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Admin Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className="w-full h-10 rounded border px-3 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full h-10 rounded border px-3 text-sm"
          >
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
            <option value="manager">Manager</option>
          </select>
        </div>

        <button
          type="submit"
          className="px-5 py-2 rounded bg-black text-white text-sm hover:opacity-90"
        >
          Add Admin
        </button>
      </form>
    </div>
  )
}
