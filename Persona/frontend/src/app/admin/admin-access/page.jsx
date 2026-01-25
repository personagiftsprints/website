"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { grantAdminAccess, getAdmins } from "@/services/admin.service"
import {
  Shield, ShieldPlus, ShieldCheck, Mail, Key, Users, Calendar, Copy, Check,
  Loader2, RefreshCw, AlertCircle, CheckCircle, UserCog, Crown, XCircle,
  MoreVertical, Trash2, Edit
} from "lucide-react"



export default function AdminAccessPage() {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("admin")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [admins, setAdmins] = useState([])
  const [refreshing, setRefreshing] = useState(true)
  const [selectedAdmin, setSelectedAdmin] = useState("")
  const [copiedId, setCopiedId] = useState("")

  const loadAdmins = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await getAdmins()
      setAdmins(res.admins)
    } catch (error) {
      setMessage({ text: "Failed to load admins", type: "error" })
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadAdmins()
  }, [loadAdmins])

  const copyAdminId = useCallback(async (id) => {
    await navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const res = await grantAdminAccess({ email, role })
      setMessage({ text: `Admin access granted to ${res.user.email}`, type: "success" })
      setEmail("")
      await loadAdmins()
    } catch (error) {
      setMessage({ text: error.message || "Failed to grant admin access", type: "error" })
    } finally {
      setLoading(false)
    }
  }, [email, role, loadAdmins])

  const getRoleIcon = useCallback((role) => {
    switch(role) {
      case 'superadmin': return <Crown className="h-4 w-4" />
      case 'admin': return <ShieldCheck className="h-4 w-4" />
      default: return <UserCog className="h-4 w-4" />
    }
  }, [])

  const getRoleColor = useCallback((role) => {
    switch(role) {
      case 'superadmin': return "bg-red-100 text-red-800 border-red-200"
      case 'admin': return "bg-purple-100 text-purple-800 border-purple-200"
      default: return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }, [])

  // Memoized derived data
  const adminStats = useMemo(() => ({
    total: admins.length,
    admins: admins.filter(a => a.role === 'admin').length,
    superadmins: admins.filter(a => a.role === 'superadmin').length,
  }), [admins])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-black flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Access Management</h1>
              <p className="text-sm text-gray-500">Grant and manage administrator privileges</p>
            </div>
          </div>
          <button
            onClick={loadAdmins}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh List'}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Grant Admin Card */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-black/10 flex items-center justify-center">
                <ShieldPlus className="h-5 w-5 text-black" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Grant Admin Access</h2>
                <p className="text-sm text-gray-500">Add new administrators using their email address</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form fields remain the same */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Enter Gmail address (e.g., admin@company.com)"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <UserCog className="h-4 w-4 text-gray-500" />
                    Admin Role
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm appearance-none bg-white"
                    >
                      <option value="admin">Administrator</option>
                      <option value="superadmin">Super Administrator</option>
                      <option value="moderator">Moderator</option>
                    </select>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <ul className="space-y-1">
                      <li className="flex items-center gap-2">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Administrator: Full system access</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Crown className="h-3 w-3" />
                        <span>Super Admin: Can manage other admins</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Granting Access...
                    </>
                  ) : (
                    <>
                      <ShieldPlus className="h-4 w-4" />
                      Grant Admin Access
                    </>
                  )}
                </button>
                {message && (
                  <div className={`p-4 rounded-lg border ${
                    message.type === 'success'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-start gap-3">
                      {message.type === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">
                          {message.type === 'success' ? 'Success' : 'Error'}
                        </p>
                        <p className="text-sm mt-1">{message.text}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Stats Card */}
        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Admin Statistics
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Admins</p>
                  <p className="text-2xl font-bold">{adminStats.total}</p>
                </div>
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 font-medium">Administrators</p>
                  <p className="text-lg font-bold">{adminStats.admins}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-600 font-medium">Super Admins</p>
                  <p className="text-lg font-bold">{adminStats.superadmins}</p>
                </div>
              </div>
            </div>
          </div>
          {/* Important Notes remain the same */}
        </div>
      </div>

      {/* Existing Admins Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5" />
              <div>
                <h2 className="text-lg font-semibold">Existing Administrators</h2>
                <p className="text-sm text-gray-500">Manage system administrators and their permissions</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {refreshing ? (
            <div className="p-12 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Loading administrators...</p>
              </div>
            </div>
          ) : admins.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-700 mb-2">No administrators found</h3>
              <p className="text-gray-500 text-sm">Start by granting admin access to team members above</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Administrator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role & Permissions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map(admin => (
                  <tr key={admin._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
                          {admin.email[0].toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">{admin.email}</div>
                          <div className="text-sm text-gray-500">ID: {admin._id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(admin.role)}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(admin.role)}`}>
                            {admin.role}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">Provider: {admin.provider || 'credentials'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Added {new Date(admin.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {admin.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className={admin.isActive ? 'text-green-600' : 'text-red-600'}>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyAdminId(admin._id)}
                          className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 transition-colors"
                          title="Copy Admin ID"
                        >
                          {copiedId === admin._id ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>ID</span>
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setSelectedAdmin(selectedAdmin === admin._id ? null : admin._id)}
                            className="p-1.5 border rounded-lg hover:bg-gray-50"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {selectedAdmin === admin._id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-10">
                              <button className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50">
                                <Edit className="h-4 w-4" />
                                Edit Role
                              </button>
                              <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                                Revoke Access
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
