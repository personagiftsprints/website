"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import api from "@/services/axios"
import { Printer, CreditCard, Truck, ShoppingBag, CheckCircle, AlertCircle, XCircle, Clock, Tag, MapPin, FileText, Download } from "lucide-react"
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf } from "@react-pdf/renderer"

// Define PDF styles
const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 30,
    borderBottom: 1,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    borderBottom: 1,
    paddingBottom: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  label: {
    fontWeight: "bold",
    width: "30%",
  },
  value: {
    width: "70%",
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#e5e7eb",
    padding: 8,
  },
  colProduct: {
    width: "50%",
  },
  colQty: {
    width: "15%",
  },
  colUnitPrice: {
    width: "15%",
    textAlign: "right",
  },
  colTotalPrice: {
    width: "20%",
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 10,
    borderTop: 2,
    borderColor: "#000",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 10,
    color: "#666",
  },
})

// Helper function to get product price
const getProductPrice = (product) => {
  if (!product) return 0
  // Use specialPrice if available, otherwise use basePrice
  return product.pricing?.specialPrice || product.pricing?.basePrice || 0
}

// Helper function to calculate item total
const calculateItemTotal = (item) => {
  const price = getProductPrice(item.product)
  return price * item.quantity
}

// PDF Document Component
const InvoicePDF = ({ order }) => {
  // Calculate subtotal
  const subtotal = order.items.reduce((sum, item) => {
    return sum + calculateItemTotal(item)
  }, 0)

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>INVOICE</Text>
          <Text style={pdfStyles.subtitle}>Invoice #: {order.checkoutSessionId?.slice(0, 20)}...</Text>
          <Text style={pdfStyles.subtitle}>
            Date: {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
          <Text style={pdfStyles.subtitle}>
            Status: {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1) || "Unknown"}
          </Text>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Customer Information</Text>
          {order.address && (
            <>
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.label}>Name:</Text>
                <Text style={pdfStyles.value}>{order.address.name || "—"}</Text>
              </View>
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.label}>Phone:</Text>
                <Text style={pdfStyles.value}>{order.address.phone || "—"}</Text>
              </View>
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.label}>Address:</Text>
                <Text style={pdfStyles.value}>
                  {order.address.line1 || "—"}
                  {"\n"}
                  {order.address.city || "—"}, {order.address.state || "—"} {order.address.postcode || "—"}
                  {"\n"}
                  {order.address.country || "—"}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Payment Information</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Payment Intent:</Text>
            <Text style={pdfStyles.value}>{order.paymentIntentId || "—"}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Coupon Code:</Text>
            <Text style={pdfStyles.value}>{order.coupon || "—"}</Text>
          </View>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Order Items</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={pdfStyles.colProduct}>Product</Text>
              <Text style={pdfStyles.colQty}>Qty</Text>
              <Text style={pdfStyles.colUnitPrice}>Unit Price</Text>
              <Text style={pdfStyles.colTotalPrice}>Total</Text>
            </View>
            {order.items?.map((item, index) => {
              const unitPrice = getProductPrice(item.product)
              const itemTotal = calculateItemTotal(item)
              
              return (
                <View key={index} style={pdfStyles.tableRow}>
                  <Text style={pdfStyles.colProduct}>{item.product?.name || "Product"}</Text>
                  <Text style={pdfStyles.colQty}>{item.quantity || 0}</Text>
                  <Text style={pdfStyles.colUnitPrice}>${unitPrice.toFixed(2)}</Text>
                  <Text style={pdfStyles.colTotalPrice}>${itemTotal.toFixed(2)}</Text>
                </View>
              )
            })}
          </View>
        </View>

        <View style={pdfStyles.totalRow}>
          <View>
            {order.coupon && (
              <Text style={{ fontSize: 10, marginBottom: 5 }}>
                Coupon Applied: {order.coupon}
              </Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ marginBottom: 5 }}>Subtotal: ${subtotal.toFixed(2)}</Text>
            {order.coupon && (
              <Text style={{ marginBottom: 5, fontSize: 10, color: "#666" }}>
                (Discount applied in total)
              </Text>
            )}
            <Text style={{ fontWeight: "bold", fontSize: 14 }}>
              Total: ${order.total?.toFixed(2) || "0.00"}
            </Text>
          </View>
        </View>

        <View style={pdfStyles.footer}>
          <Text>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  )
}

export default function TransactionDetailPage() {
  const { sessionId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/admin/transactions/${sessionId}`)
        console.log("Order data received:", res) // Debug log
        setOrder(res.data || res) // Handle both res.data and direct response
      } catch (err) {
        console.error("Error fetching order:", err)
        setError(err.message || "Failed to load transaction details")
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) fetchOrder()
  }, [sessionId])

  const getStatusBadge = (status) => {
    const styles =
      {
        paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
        pending: "bg-amber-100 text-amber-800 border-amber-200",
        failed: "bg-rose-100 text-rose-800 border-rose-200",
        refunded: "bg-purple-100 text-purple-800 border-purple-200",
      }[status?.toLowerCase()] ||
      "bg-gray-100 text-gray-800 border-gray-200"

    const icons = {
      paid: <CheckCircle className="w-4 h-4" />,
      pending: <Clock className="w-4 h-4" />,
      failed: <XCircle className="w-4 h-4" />,
      refunded: <AlertCircle className="w-4 h-4" />,
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles}`}
      >
        {icons[status?.toLowerCase()] || <FileText className="w-4 h-4" />}
        {status
          ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
          : "Unknown"}
      </span>
    )
  }

  // Helper to get display price for an item
  const getDisplayPrice = (product) => {
    if (!product?.pricing) return "0.00"
    const price = product.pricing.specialPrice || product.pricing.basePrice
    return price?.toFixed(2) || "0.00"
  }

  const handleDownloadPdf = async () => {
    if (!order) return
    
    setIsGeneratingPdf(true)
    try {
      const blob = await pdf(<InvoicePDF order={order} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${order.checkoutSessionId || order._id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error generating PDF:", error)
      setError("Failed to generate PDF")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-64 bg-gray-200 rounded"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border rounded-xl p-6 h-64"></div>
            <div className="bg-white border rounded-xl p-6 h-64"></div>
          </div>
          <div className="bg-white border rounded-xl p-6 h-80"></div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
          <h2 className="text-lg font-medium text-rose-800 mb-2">Error</h2>
          <p className="text-rose-700">{error || "Transaction not found"}</p>
        </div>
      </div>
    )
  }

  console.log("Rendering order:", order) // Debug log

  return (
    <div className="min-h-screen bg-gray-50/40">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Transaction Details
            </h1>
            <p className="mt-1 text-sm text-gray-600 font-mono">
              {order.checkoutSessionId}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {getStatusBadge(order.paymentStatus)}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Invoice
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Payment Info */}
          <div className="bg-white border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Payment Information</h2>
            </div>

            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-3 text-sm">
              <dt className="text-gray-500 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Status
              </dt>
              <dd>{getStatusBadge(order.paymentStatus)}</dd>

              <dt className="text-gray-500 flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Payment Intent
              </dt>
              <dd className="font-mono text-xs">
                {order.paymentIntentId || "—"}
              </dd>

              <dt className="text-gray-500 flex items-center gap-1.5">
                <Tag className="w-4 h-4" /> Total
              </dt>
              <dd className="font-semibold">${order.total?.toFixed(2) || "0.00"}</dd>

              <dt className="text-gray-500 flex items-center gap-1.5">
                <Tag className="w-4 h-4" /> Coupon
              </dt>
              <dd>{order.coupon || "—"}</dd>

              <dt className="text-gray-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Created
              </dt>
              <dd>
                {new Date(order.createdAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </dd>
            </dl>
          </div>

          {/* Address */}
          {order.address ? (
            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Shipping Address</h2>
              </div>
              <p className="font-medium">{order.address.name || "—"}</p>
              <p className="text-gray-600">{order.address.phone || "—"}</p>
              <p className="text-gray-600 whitespace-pre-line">
                {order.address.line1 || "—"}
                <br />
                {order.address.city || "—"}, {order.address.state || "—"} {order.address.postcode || "—"}
                <br />
                {order.address.country || "—"}
              </p>
            </div>
          ) : (
            <div className="bg-white border rounded-xl p-6 flex items-center justify-center text-gray-500">
              <div className="flex flex-col items-center gap-2">
                <MapPin className="w-6 h-6 text-gray-300" />
                <p>No shipping address recorded</p>
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">
              Ordered Items ({order.items?.length || 0})
            </h2>
          </div>

          {!order.items || order.items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No items found
            </p>
          ) : (
            <div className="space-y-5 divide-y">
              {order.items.map((item, index) => {
                const unitPrice = getProductPrice(item.product)
                const itemTotal = calculateItemTotal(item)
                
                return (
                  <div key={index} className="pt-4 first:pt-0">
                    <div className="flex justify-between items-start">
                      <div>
                        {item.product?.slug ? (
                          <Link
                            href={`/products/${item.product.slug}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {item.product.name}
                          </Link>
                        ) : (
                          <p className="font-medium text-gray-500">
                            {item.product?.name || "Product (deleted)"}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          Quantity: {item.quantity}
                        </p>
                        <div className="mt-2 text-sm">
                          <span className="text-gray-500">Unit Price: </span>
                          <span className="font-medium">
                            ${unitPrice.toFixed(2)}
                          </span>
                          {item.product?.pricing?.specialPrice && (
                            <span className="ml-2 text-xs text-gray-400 line-through">
                              ${item.product.pricing.basePrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-sm">
                          <span className="text-gray-500">Item Total: </span>
                          <span className="font-semibold">
                            ${itemTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      {item.product?.thumbnail && (
                        <img
                          src={item.product.thumbnail}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                      )}
                    </div>

                    {item.configuration &&
                      Object.keys(item.configuration).length > 0 && (
                        <pre className="mt-3 text-xs bg-gray-50 p-3 rounded border">
                          {JSON.stringify(item.configuration, null, 2)}
                        </pre>
                      )}
                  </div>
                )
              })}
              
              {/* Order Summary */}
              <div className="pt-6 border-t-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Subtotal</p>
                    {order.coupon && (
                      <p className="text-sm text-gray-600">Coupon: <span className="font-medium">{order.coupon}</span></p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 line-through">
                      ${order.items.reduce((sum, item) => {
                        const basePrice = item.product?.pricing?.basePrice || 0
                        return sum + (basePrice * item.quantity)
                      }, 0).toFixed(2)}
                    </p>
                    <p className="text-lg font-bold">
                      Total: ${order.total?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}