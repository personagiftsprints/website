"use client"

import { useEffect, useState } from "react"
import api from "@/services/axios"



export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [cursor, setCursor] = useState("")
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchTransactions = async (isInitial = false) => {
    if (loading || (!isInitial && !hasMore)) return

    try {
      setLoading(true)
      if (isInitial) setInitialLoading(true)

      const params = cursor && !isInitial ? { starting_after: cursor } : {}
      const res = await api.get("/admin/transactions", { params })

      setTransactions(prev => isInitial ? res.data : [...prev, ...res.data])
      setCursor(res.nextCursor ?? null)
      setHasMore(!!res.hasMore)
      setError("")
    } catch (err) {
      setError(err.message || "Failed to load transactions")
    } finally {
      setLoading(false)
      if (isInitial) setInitialLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions(true)
  }, [])

  const getStatusStyle = (status) => {
    switch (status) {
      case "paid":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200"
      case "pending":
        return "bg-amber-100 text-amber-700 border border-amber-200"
      case "failed":
        return "bg-rose-100 text-rose-700 border border-rose-200"
      case "refunded":
        return "bg-purple-100 text-purple-700 border border-purple-200"
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header + Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Transactions
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Overview of all payment sessions and their status
            </p>
          </div>

          {/* Quick stats – replace with real aggregates if you have them */}
          <div className="flex flex-wrap gap-3">
            <div className="bg-white shadow-sm rounded-lg px-4 py-3 border border-gray-200 min-w-[140px]">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-xl font-semibold text-gray-900 mt-0.5">184</p>
            </div>
            <div className="bg-white shadow-sm rounded-lg px-4 py-3 border border-gray-200 min-w-[140px]">
              <p className="text-xs text-gray-500 uppercase tracking-wide">This Month</p>
              <p className="text-xl font-semibold text-emerald-600 mt-0.5">+47</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Table Card */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Session ID
                  </th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Payment Intent
                  </th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Coupon
                  </th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {initialLoading ? (
                  // Skeleton rows
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-5"><div className="h-4 bg-gray-200 rounded w-40"></div></td>
                      <td className="px-5 py-5"><div className="h-4 bg-gray-200 rounded w-40"></div></td>
                      <td className="px-5 py-5"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-5 py-5"><div className="h-5 bg-gray-200 rounded w-16"></div></td>
                      <td className="px-5 py-5"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td className="px-5 py-5"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                      <div className="text-xl font-medium text-gray-400 mb-2">No transactions yet</div>
                      <div className="text-sm">Completed payments will appear here</div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                  <tr
  key={tx.checkoutSessionId}
  onClick={() =>
    window.open(
      `/admin/transactions/${tx.checkoutSessionId}`,
      "_blank"
    )
  }
  className="cursor-pointer hover:bg-indigo-50 transition-colors duration-150"
>

                      <td className="px-5 py-4 font-mono text-xs text-gray-600">
                        {tx.checkoutSessionId.slice(0, 18)}…
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-gray-600">
                        {tx.paymentIntentId ? tx.paymentIntentId.slice(0, 18) + "…" : "—"}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-gray-900">
                        { "$"} {tx.amount }
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(tx.status)}`}
                        >
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {tx.coupon !== "NONE" ? tx.coupon : "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="px-6 py-5 flex justify-center border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => fetchTransactions()}
                disabled={loading}
                className={`
                  inline-flex items-center px-6 py-2.5 border border-gray-300 
                  text-sm font-medium rounded-lg text-gray-700 bg-white 
                  hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                  disabled:opacity-50 disabled:cursor-not-allowed transition
                `}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                    </svg>
                    Loading...
                  </>
                ) : (
                  "Load more transactions"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}