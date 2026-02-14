"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, Eye, FileText } from "lucide-react";

import { getOrderAdminById, updateOrderStatus } from "@/services/admin.service";

const STATUSES = [
  "paid",
  "processing",
  "printing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function AdminOrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await getOrderAdminById(orderId);
        setOrder(res.order);
        setStatus(res.order.orderStatus);
      } catch (err) {
        console.error("Failed to load order:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const DownloadButton = ({ url, filename = "image.png" }) => {
    const handleDownload = async () => {
      if (!url) return;

      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error("Download failed:", err);
      }
    };

    return (
      <button
        onClick={handleDownload}
        className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-md hover:shadow-lg transition-all opacity-80 hover:opacity-100"
        title="Download image"
      >
        <Download size={18} />
      </button>
    );
  };

  const ViewButton = ({ url }) => {
    if (!url) return null;

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-md hover:shadow-lg transition-all opacity-80 hover:opacity-100"
        title="View image in new tab"
      >
        <Eye size={18} />
      </a>
    );
  };

  const updateStatus = async () => {
    try {
      const res = await updateOrderStatus(orderId, status);
      setOrder(res.order);
      alert("Order status updated successfully");
    } catch (err) {
      alert("Failed to update status: " + (err.message || "Unknown error"));
    }
  };

  if (loading)
    return <div className="p-10 text-center">Loading order details...</div>;
  if (!order)
    return <div className="p-10 text-center text-red-600">Order not found</div>;

  return (
    <div className="max-w-8xl mx-auto px-6 py-2 space-y-10 bg-gray-white h-screen">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-6 border-b pb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Order #{order.orderNumber}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 bg-white"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          {/* Invoice Button */}

          <button
            onClick={updateStatus}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Update Status
          </button>
          <button
            onClick={() => console.log("Generate invoice")}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg bg-white hover:bg-gray-50 transition"
            title="Generate Invoice"
          >
            <FileText size={18} />
            <span className="hidden md:inline">Invoice</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* LEFT: Items with both previews */}
        <div className="lg:col-span-2 space-y-8">
          {order.items.map((item, index) => {
            const isTshirt =
              item.productSnapshot?.productType === "tshirt" ||
              item.customization?.type === "tshirt" ||
              item.designData;

            const printAreas =
              item.customization?.data?.tshirt?.print_areas ||
              item.designData?.print_areas ||
              {};

            const previewUrls =
              item.customization?.data?.tshirt?.preview_urls ||
              item.designData?.preview_urls ||
              {};

            const mainPreview =
              item.customization?.data?.tshirt?.preview_image_url ||
              item.designData?.preview_url;

            return (
              <div key={index} className="bg-white  overflow-hidden">
                {/* Product Header */}
                <div className="p-6 flex gap-6 border-b bg-gray-50">
                  <div className="w-32 h-32 shrink-0 overflow-hidden rounded-lg border">
                    <img
                      src={item.productSnapshot?.image || "/placeholder.png"}
                      alt={item.productSnapshot?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">
                      {item.productSnapshot?.name || "Custom Product"}
                    </h3>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                      <span>Qty: {item.quantity}</span>
                      <span>
                        Type: {item.productSnapshot?.productType || "Unknown"}
                      </span>
                      <span>
                        £{item.productSnapshot?.finalPrice?.toFixed(2) || "—"}
                      </span>
                    </div>

                    {item.variant && Object.keys(item.variant).length > 0 && (
                      <div className="flex gap-4 text-sm">
                        {item.variant.size && (
                          <span className="bg-gray-100 px-3 py-1 rounded">
                            Size: {item.variant.size}
                          </span>
                        )}
                        {item.variant.color && (
                          <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded">
                            Color:
                            <span
                              className="w-5 h-5 rounded-full border"
                              style={{ backgroundColor: item.variant.color }}
                            ></span>
                            {item.variant.color_label || item.variant.color}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* T-Shirt Customization Section */}
                {isTshirt && (
                  <div className="p-6 space-y-8 bg-gray-50 border-t">
                    <h4 className="text-xl font-semibold text-indigo-700 mb-6">
                      Custom T-Shirt Design
                    </h4>

                    {/* Both Side Previews */}
                    {/* Both Side Previews */}
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                      {["front", "back"].map((side) => {
                        const previewUrl =
                          previewUrls[side] ||
                          (side === "front" ? mainPreview : null);
                        const fileName = `order-${order.orderNumber}-${side}-preview.png`;

                        return (
                          <div
                            key={side}
                            className="border rounded-xl overflow-hidden bg-white shadow-sm relative"
                          >
                            <div className="bg-indigo-600 text-white px-5 py-3 font-medium capitalize text-center">
                              {side.charAt(0).toUpperCase() + side.slice(1)}{" "}
                              View Preview
                            </div>

                            {previewUrl ? (
                              <div className="p-4 bg-gray-50 relative group">
                                <img
                                  src={previewUrl}
                                  alt={`${side} preview`}
                                  className="w-full h-80 object-contain mx-auto"
                                />

                                {/* Download Button Overlay */}
                                <div className="absolute bottom-3 right-3 flex gap-2 z-10">
                                  <ViewButton url={previewUrl} />
                                  <DownloadButton
                                    url={previewUrl}
                                    filename={`order-${order.orderNumber}-${side}-preview.png`}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="h-80 flex items-center justify-center text-gray-400 bg-gray-100">
                                No {side} preview available
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!isTshirt && (
                  <div className="p-6 text-center text-gray-500 border-t">
                    No customization details for this product
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT: Summary + Address + Status */}
        <div className="space-y-2">
          {/* Order Summary */}
          <div className="bg-white border border-gray-300 rounded-xl p-2  space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>£{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery</span>
                <span>£{order.deliveryCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-3">
                <span>Total</span>
                <span className="text-green-700">
                  £{order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4 border-gray-300 ">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Delivery Address
            </h2>

            <div className="text-xs text-gray-600 space-y-1 leading-relaxed">
              <div className="font-medium text-gray-800">
                {order.deliveryAddress.fullName || "—"}
              </div>

              <div>{order.deliveryAddress.addressLine1 || "—"}</div>

              <div>
                {order.deliveryAddress.city || "—"},{" "}
                {order.deliveryAddress.state || "—"}{" "}
                {order.deliveryAddress.postalCode || ""}
              </div>

              <div className="pt-1">
                📞 {order.deliveryAddress.phone || "—"}
              </div>

              <div>✉ {order.deliveryAddress.email || "—"}</div>

              <div>🌍 {order.deliveryAddress.country || "—"}</div>
            </div>
          </div>

          <div>
            {order.items.map((item, index) => {
              const printAreas =
                item.customization?.data?.tshirt?.print_areas ||
                item.designData?.print_areas ||
                {};

              return (
                <div key={index} className="bg-white  overflow-hidden">
                  <div className="p-0 space-y-2 ">
                    {Object.keys(printAreas).length > 0 && (
                      <div>
                        <h5 className="text-lg font-semibold text-gray-800 ">
                          Print Areas & Designs
                        </h5>
                        <div className="grid md:grid-cols-2 gap-6">
                          {Object.entries(printAreas).map(([viewKey, area]) => (
                            <div
                              key={viewKey}
                              className="bg-white rounded-lg p-2 shadow-sm"
                            >
                              <h6 className="font-semibold capitalize mb-1 text-indigo-600">
                                {viewKey} –{" "}
                                {area.area?.replace(/_/g, " ") || "Custom Area"}
                              </h6>

                              {area.image?.url && (
                                <div className="mb-2 relative group">
                                
                                  <div className="relative overflow-hidden rounded ">
                                    <img
                                      src={area.image.url}
                                      alt="Placed design"
                                      className=" h-56 object-contain"
                                    />

                                    <div className="absolute bottom-3 right-3 flex gap-2 z-10">
                                      <ViewButton url={area.image.url} />
                                      <DownloadButton
                                        url={area.image.url}
                                        filename={`design-${viewKey}-${area.area || "custom"}.png`}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {area.image?.position && (
                                <div className="text-sm text-gray-600 space-y-2">
                                  <p>
                                    Scale:{" "}
                                    {Math.round(
                                      (area.image.position.scale || 0.5) * 100,
                                    )}
                                    %
                                  </p>
                                  <p>
                                    Position: X {area.image.position.x || 0}px,
                                    Y {area.image.position.y || 0}px
                                  </p>
                                  {area.image.position.rotate !== 0 && (
                                    <p>
                                      Rotation: {area.image.position.rotate}°
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
