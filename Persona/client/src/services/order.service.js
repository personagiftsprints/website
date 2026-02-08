import api from "./axios"

/* =====================================================
   GET ORDER BY ORDER ID (GUEST + USER)
===================================================== */
export const getOrderById = async (orderId) => {
  try {
    const res = await api.get(`/orders/${orderId}`)
    return res
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Failed to fetch order"
    )
  }
}

/* =====================================================
   GET ORDER BY STRIPE SESSION ID (SUCCESS PAGE)
===================================================== */
export const getOrderBySessionId = async (sessionId) => {
  try {
    const res = await api.get(`/orders/session/${sessionId}`)
    return res
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Order not found"
    )
  }
}

/* =====================================================
   (OPTIONAL) GET LOGGED-IN USER ORDERS
   ⚠️ Requires token (for account orders page)
===================================================== */
export const getMyOrders = async () => {
  try {
    const res = await api.get("/orders/my-orders")
    return res
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Failed to fetch orders"
    )
  }
}
