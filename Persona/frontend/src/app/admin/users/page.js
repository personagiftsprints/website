"use client"

import { useEffect, useState } from "react"
import { getUsers } from "@/services/account.service"
import {
  Users,
  Search,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Mail,
  Key,
  ShieldCheck,
  ShieldOff,
  Loader2,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from "lucide-react"

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)
  const [query, setQuery] = useState("")
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState(null)
  const [viewMode, setViewMode] = useState("table") // "table" or "grid"

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(query), 400)
    return () => clearTimeout(t)
  }, [query])

  // Fetch users
  useEffect(() => {
    setLoading(true)
    getUsers(page, search).then(res => {
      setUsers(res.users)
      setTotalPages(res.pagination.totalPages)
      setTotalUsers(res.pagination.total)
      setLoading(false)
    })
  }, [page, search])

  const copyId = async id => {
    await navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'superadmin':
        return <ShieldCheck className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin':
        return "bg-purple-100 text-purple-800 border-purple-200"
      case 'superadmin':
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  const getStatusIcon = (isActive) => {
    return isActive ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />
  }

  const getProviderIcon = (provider) => {
    switch(provider) {
      case 'google':
        return <span className="text-xs">🔵</span>
      case 'github':
        return <span className="text-xs">⚫</span>
      default:
        return <Key className="h-3 w-3" />
    }
  }

  const filteredUsers = users.filter(user => {
    if (roleFilter !== "all" && user.role !== roleFilter) return false
    if (statusFilter !== "all") {
      if (statusFilter === "active" && !user.isActive) return false
      if (statusFilter === "inactive" && user.isActive) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white  p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-black flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">User Management</h1>
              <p className="text-sm text-gray-500">
                {totalUsers} total users • Page {page} of {totalPages}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                placeholder="Search by ID, name or email..."
                value={query}
                onChange={e => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            
         
          </div>
        </div>
      </div>

  

      {/* Loading State */}
      {loading ? (
        <div className="bg-white border rounded-xl p-12 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-gray-500">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-medium text-gray-700 mb-2">No users found</h3>
          <p className="text-gray-500 text-sm">
            {search || roleFilter !== "all" || statusFilter !== "all" 
              ? "Try changing your search or filters" 
              : "No users in the system"}
          </p>
        </div>
      ) : viewMode === "table" ? (
        // Table View
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
                          {user.firstName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getProviderIcon(user.provider)}
                        <span className="text-sm capitalize">{user.provider}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(user.isActive)}
                        <span className={`text-sm font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyId(user._id)}
                          className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 transition-colors"
                          title="Copy User ID"
                        >
                          {copiedId === user._id ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>ID</span>
                        </button>
                        
                       
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(user => (
            <div key={user._id} className="bg-white border rounded-xl p-5 space-y-4 hover:border-gray-400 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-black text-white flex items-center justify-center text-lg font-semibold">
                    {user.firstName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 truncate max-w-45">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(selectedUser === user._id ? null : user._id)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.role)}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(user.isActive)}
                    <span className={`text-xs font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {getProviderIcon(user.provider)}
                  <span>Via {user.provider}</span>
                  <span className="text-gray-300">•</span>
                  <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyId(user._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    {copiedId === user._id ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy ID
                      </>
                    )}
                  </button>
                  <button className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {selectedUser === user._id && (
                <div className="absolute right-5 mt-1 w-48 bg-white border rounded-lg shadow-lg z-10">
                  <button className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50">
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                  <button className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50">
                    <Edit className="h-4 w-4" />
                    Edit User
                  </button>
                  <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                    Delete User
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredUsers.length > 0 && (
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-9 w-9 rounded-lg border flex items-center justify-center text-sm ${
                      page === pageNum
                        ? "bg-black text-white border-black"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              
              {totalPages > 5 && (
                <span className="px-2 text-gray-500">...</span>
              )}
            </div>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="text-center mt-4 text-sm text-gray-500">
            Showing {filteredUsers.length} of {users.length} users on this page
          </div>
        </div>
      )}
    </div>
  )
}