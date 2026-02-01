// React example: src/pages/OrderSuccess.jsx
import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react' // or any icon library

export default function OrderSuccess() {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [orderDetails, setOrderDetails] = useState(null)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (sessionId) {
      // Fetch order details from your backend
      fetch(`/api/orders/session/${sessionId}`)
        .then(res => res.json())
        .then(data => {
          setOrderDetails(data)
          setLoading(false)
        })
        .catch(err => {
          console.error(err)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-gray-600">
              Thank you for your purchase. We've sent a confirmation email to your inbox.
            </p>
          </div>

          {orderDetails && (
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Details
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium">{orderDetails.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">${orderDetails.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">{orderDetails.orderStatus}</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              to="/"
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md text-center font-medium hover:bg-blue-700 transition"
            >
              Continue Shopping
            </Link>
            <Link
              to="/orders"
              className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-md text-center font-medium hover:bg-gray-50 transition"
            >
              View All Orders
            </Link>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Need help? <a href="mailto:support@persona.com" className="text-blue-600 hover:underline">Contact our support team</a></p>
          </div>
        </div>
      </div>
    </div>
  )
}