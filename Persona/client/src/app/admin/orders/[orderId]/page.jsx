"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, Eye, FileText, Smartphone } from "lucide-react";
import GrayLogo from "@/assets/icons/gray.png"

import { getOrderAdminById, updateOrderStatus } from "@/services/admin.service";
import Image from "next/image";

const STATUS_FLOW = {
  paid: ["processing"],
  processing: ["printing", "cancelled"],
  printing: ["out_for_delivery"],
  cancelled: [],
  out_for_delivery: [],
};

// Reusable Download Button Component
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

// Reusable View Button Component
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

// Mobile Case Design Display Component
const MobileCaseDesignDisplay = ({ item, orderNumber }) => {
  const designData = item.designData || {};
  const modelInfo = designData.model || {};
  const printAreas = designData.print_areas || {};
  const previewUrl = designData.preview_url;
  const cloudinaryUrls = designData.cloudinary_urls || {};
  const positions = designData.positions || {};

  if (!previewUrl && Object.keys(cloudinaryUrls).length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Model Information */}
      {modelInfo.name && (
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone size={20} className="text-amber-600" />
            <h4 className="text-lg font-semibold text-amber-800">
              {modelInfo.name}
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {modelInfo.year && (
              <div>
                <span className="text-gray-500">Year:</span>
                <span className="ml-2 font-medium">{modelInfo.year}</span>
              </div>
            )}
            {modelInfo.displaySize && (
              <div>
                <span className="text-gray-500">Display:</span>
                <span className="ml-2 font-medium">{modelInfo.displaySize}</span>
              </div>
            )}
            {modelInfo.code && (
              <div className="col-span-2">
                <span className="text-gray-500">Model Code:</span>
                <span className="ml-2 font-medium">{modelInfo.code}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Preview Image */}
      {previewUrl && (
        <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="bg-amber-600 text-white px-5 py-3 font-medium text-center">
            Design Preview
          </div>
          <div className="p-4 bg-gray-50 relative group">
            <img
              src={previewUrl}
              alt="Case preview"
              className="w-full h-80 object-contain mx-auto"
            />
            <div className="absolute bottom-3 right-3 flex gap-2 z-10">
              <ViewButton url={previewUrl} />
              <DownloadButton
                url={previewUrl}
                filename={`order-${orderNumber}-case-preview.png`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Design Images */}
      {Object.keys(cloudinaryUrls).length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-amber-700 mb-4">Uploaded Design</h4>
          <div className="grid md:grid-cols-1 gap-4">
            {Object.entries(cloudinaryUrls).map(([areaId, url]) => {
              const area = printAreas.back;
              const position = positions[areaId] || area?.image?.position || {};

              return (
                <div key={areaId} className="border rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="bg-amber-500 text-white px-4 py-2 font-medium text-sm">
                    Back Design
                  </div>
                  <div className="p-4 bg-gray-50 relative group">
                    <img
                      src={url}
                      alt="Uploaded design"
                      className="w-full h-48 object-contain mx-auto"
                    />
                    <div className="absolute bottom-3 right-3 flex gap-2 z-10">
                      <ViewButton url={url} />
                      <DownloadButton
                        url={url}
                        filename={`order-${orderNumber}-case-design.png`}
                      />
                    </div>
                  </div>
                  {position.scale && (
                    <div className="px-4 py-2 text-sm text-gray-600 border-t bg-gray-50">
                      <div className="grid grid-cols-3 gap-2">
                        <div>Size: {Math.round((position.scale || 0.5) * 100)}%</div>
                        <div>X: {position.x || 0}px</div>
                        <div>Y: {position.y || 0}px</div>
                        {position.rotate !== 0 && (
                          <div>Rotate: {position.rotate}°</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Print Area Details */}
      {Object.keys(printAreas).length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h5 className="font-semibold text-gray-800 mb-3">Print Area Details</h5>
          {Object.entries(printAreas).map(([view, area]) => (
            <div key={view} className="text-sm space-y-1">
              <p><span className="text-gray-500">View:</span> <span className="capitalize font-medium">{view}</span></p>
              <p><span className="text-gray-500">Area:</span> <span className="font-medium">{area.area?.replace(/_/g, ' ')}</span></p>
              {area.model && (
                <p><span className="text-gray-500">Model:</span> <span className="font-medium">{area.model}</span></p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Mug Design Display Component
const MugDesignDisplay = ({ item, orderNumber }) => {
  const mugData = item.customization?.data?.mug || {};
  const printAreas = mugData.print_areas || {};
  const previewUrls = mugData.preview_urls || {};
  const cloudinaryUrls = mugData.cloudinary_urls || {};
  const positions = mugData.positions || {};

  // Check if it's a wrap design (has full_wrap preview)
  const isWrapDesign = previewUrls.full_wrap || Object.keys(cloudinaryUrls).some(key => key.includes('full_wrap'));

  if (isWrapDesign) {
    // Full Wrap Design - Show 3-panel grid
    const slotOrder = ["front", "center", "back"];
    const slotLabels = {
      front: "Front (Left)",
      center: "Center",
      back: "Back (Right)"
    };

    return (
      <div className="space-y-8">
        {/* Full Wrap Preview Image */}
        {previewUrls.full_wrap && (
          <div className="border rounded-xl overflow-hidden bg-white shadow-sm relative">
            <div className="bg-purple-600 text-white px-5 py-3 font-medium text-center">
              Full Wrap Preview
            </div>
            <div className="p-4 bg-gray-50 relative group">
              <img
                src={previewUrls.full_wrap}
                alt="Full wrap preview"
                className="w-full h-80 object-contain mx-auto"
              />
              <div className="absolute bottom-3 right-3 flex gap-2 z-10">
                <ViewButton url={previewUrls.full_wrap} />
                <DownloadButton
                  url={previewUrls.full_wrap}
                  filename={`order-${orderNumber}-full-wrap-preview.png`}
                />
              </div>
            </div>
          </div>
        )}

        {/* 3-Panel Individual Images */}
        <div>
          <h4 className="text-lg font-semibold text-purple-700 mb-4">3-Panel Wrap Design</h4>
          <div className="grid md:grid-cols-3 gap-4">
            {slotOrder.map((slot) => {
              const slotKey = Object.keys(cloudinaryUrls).find(key => key.includes(slot));
              const imageUrl = slotKey ? cloudinaryUrls[slotKey] : null;
              const position = positions[slotKey] || {};

              if (!imageUrl) return null;

              return (
                <div key={slot} className="border rounded-xl overflow-hidden bg-white shadow-sm relative">
                  <div className="bg-purple-500 text-white px-3 py-2 font-medium text-center text-sm">
                    {slotLabels[slot]}
                  </div>
                  <div className="p-3 bg-gray-50 relative group">
                    <img
                      src={imageUrl}
                      alt={`${slot} panel`}
                      className="w-full h-40 object-contain mx-auto"
                    />
                    <div className="absolute bottom-2 right-2 flex gap-2 z-10">
                      <ViewButton url={imageUrl} />
                      <DownloadButton
                        url={imageUrl}
                        filename={`order-${orderNumber}-wrap-${slot}.png`}
                      />
                    </div>
                  </div>
                  {position.scale && (
                    <div className="px-3 py-2 text-xs text-gray-600 border-t">
                      Size: {Math.round((position.scale || 0.5) * 100)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Single View Design (front/back) - Show both sides if available
  const hasFront = previewUrls.front || printAreas.front;
  const hasBack = previewUrls.back || printAreas.back;

  if (!hasFront && !hasBack) return null;

  return (
    <div>
      <h4 className="text-lg font-semibold text-purple-700 mb-4">Mug Design</h4>
      <div className="grid md:grid-cols-2 gap-8">
        {["front", "back"].map((side) => {
          const previewUrl = previewUrls[side];
          const areaData = printAreas[side];
          const imageUrl = areaData?.image?.url;
          const position = areaData?.image?.position;

          if (!previewUrl && !imageUrl) return null;

          return (
            <div key={side} className="border rounded-xl overflow-hidden bg-white shadow-sm relative">
              <div className="bg-purple-600 text-white px-5 py-3 font-medium capitalize text-center">
                {side.charAt(0).toUpperCase() + side.slice(1)} View
              </div>
              <div className="p-4 bg-gray-50 relative group">
                {/* Show preview if available, otherwise show the placed image */}
                <img
                  src={previewUrl || imageUrl}
                  alt={`${side} preview`}
                  className="w-full h-64 object-contain mx-auto"
                />
                <div className="absolute bottom-3 right-3 flex gap-2 z-10">
                  <ViewButton url={previewUrl || imageUrl} />
                  <DownloadButton
                    url={previewUrl || imageUrl}
                    filename={`order-${orderNumber}-${side}-mug.png`}
                  />
                </div>
              </div>
              {position && (
                <div className="px-4 py-2 text-xs text-gray-600 border-t">
                  Size: {Math.round((position.scale || 0.5) * 100)}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// T-Shirt Design Display Component
const TshirtDesignDisplay = ({ item, orderNumber }) => {
  const tshirtData = item.customization?.data?.tshirt || {};
  const printAreas = tshirtData.print_areas || {};
  const previewUrls = tshirtData.preview_urls || item.designData?.preview_urls || {};
  const mainPreview = tshirtData.preview_image_url || item.designData?.preview_url;

  return (
    <div className="space-y-8">
      {/* Both Side Previews */}
      <div className="grid md:grid-cols-2 gap-8">
        {["front", "back"].map((side) => {
          const previewUrl = previewUrls[side] || (side === "front" ? mainPreview : null);
          const fileName = `order-${orderNumber}-${side}-tshirt.png`;

          return (
            <div key={side} className="border rounded-xl overflow-hidden bg-white shadow-sm relative">
              <div className="bg-indigo-600 text-white px-5 py-3 font-medium capitalize text-center">
                {side.charAt(0).toUpperCase() + side.slice(1)} View
              </div>
              {previewUrl ? (
                <div className="p-4 bg-gray-50 relative group">
                  <img
                    src={previewUrl}
                    alt={`${side} preview`}
                    className="w-full h-80 object-contain mx-auto"
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2 z-10">
                    <ViewButton url={previewUrl} />
                    <DownloadButton url={previewUrl} filename={fileName} />
                  </div>
                </div>
              ) : (
                <div className="h-80  items-center justify-center flex flex-col  text-gray-400 bg-gray-100">
                  <Image src={GrayLogo} alt="no preview" className="w-32 "/>
                  <p>  No {side} preview available</p>
                
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Print Areas Details */}
      {Object.keys(printAreas).length > 0 && (
        <div>
          <h5 className="text-lg font-semibold text-gray-800 mb-4">Print Areas & Designs</h5>
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(printAreas).map(([viewKey, area]) => (
              <div key={viewKey} className="bg-white rounded-lg p-4 shadow-sm border">
                <h6 className="font-semibold capitalize mb-2 text-indigo-600">
                  {viewKey} – {area.area?.replace(/_/g, " ") || "Custom Area"}
                </h6>

                {area.image?.url && (
                  <div className="mb-3 relative group">
                    <div className="relative overflow-hidden rounded">
                      <img
                        src={area.image.url}
                        alt="Placed design"
                        className="h-48 w-full object-contain"
                      />
                      <div className="absolute bottom-2 right-2 flex gap-2 z-10">
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
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Scale: {Math.round((area.image.position.scale || 0.5) * 100)}%</p>
                    <p>Position: X {area.image.position.x || 0}px, Y {area.image.position.y || 0}px</p>
                    {area.image.position.rotate !== 0 && (
                      <p>Rotation: {area.image.position.rotate}°</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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

  const updateStatusHandler = async () => {
    try {
      const res = await updateOrderStatus(orderId, status);
      setOrder(res.order);
      alert("Order status updated");
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading order details...</div>;
  if (!order) return <div className="p-10 text-center text-red-600">Order not found</div>;

  const allowedStatuses = [
    order.orderStatus,
    ...(STATUS_FLOW[order.orderStatus] || []),
  ];

  return (
    <div className="max-w-8xl mx-auto px-6 py-2 space-y-10 bg-gray-white h-screen overflow-y-auto">
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

        <div className="flex items-center gap-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border px-4 py-2 rounded"
          >
            {allowedStatuses.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </option>
            ))}
          </select>

          <button
            onClick={updateStatusHandler}
            disabled={status === order.orderStatus}
            className="bg-indigo-600 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            Update Status
          </button>
        </div>
        <div>
          <p className="text-sm text-gray-600">
            Current Status: <strong className="capitalize">{order.orderStatus.replace(/_/g, ' ')}</strong>
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* LEFT: Items with product-specific displays */}
        <div className="lg:col-span-2 space-y-8">
          {order.items.map((item, index) => {
            const productType = item.productSnapshot?.productType || 
                               item.customization?.type || 
                               "other";

            return (
              <div key={index} className="bg-white overflow-hidden border rounded-xl">
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
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
  <span className="bg-gray-900 text-white text-sm w-8 h-8 flex items-center justify-center rounded-full">
    {index + 1}
  </span>
  {item.productSnapshot?.name || "Custom Product"}
</h3>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                      <span>Qty: {item.quantity}</span>
                      <span className="capitalize">
                        Type: {productType}
                      </span>
                      <span>
                        £{item.productSnapshot?.finalPrice?.toFixed(2) || "—"}
                      </span>
                    </div>

                    {/* Product Type Badge */}
                    <div className="flex gap-2">
                      {productType === "tshirt" && (
                        <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs">
                          👕 Custom T-Shirt
                        </span>
                      )}
                      {productType === "mug" && (
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs">
                          ☕ Custom Mug
                        </span>
                      )}
                      {productType === "mobileCase" && (
                        <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs">
                          📱 Custom Phone Case
                        </span>
                      )}
                    </div>

                    {/* Model Info for Mobile Case */}
                    {productType === "mobileCase" && item.designData?.model && (
                      <div className="flex items-center gap-2 text-sm text-amber-700">
                        <Smartphone size={16} />
                        <span className="font-medium">{item.designData.model.name}</span>
                        <span className="text-xs text-gray-500">({item.designData.model.year})</span>
                      </div>
                    )}

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

                {/* Product-Specific Customization Section */}
                <div className="p-6 bg-gray-50 border-t">
                  {productType === "tshirt" && (
                    <TshirtDesignDisplay item={item} orderNumber={order.orderNumber} />
                  )}

                  {productType === "mug" && (
                    <MugDesignDisplay item={item} orderNumber={order.orderNumber} />
                  )}

                  {productType === "mobileCase" && (
                    <MobileCaseDesignDisplay item={item} orderNumber={order.orderNumber} />
                  )}

                  {!["tshirt", "mug", "mobileCase"].includes(productType) && (
                    <div className="text-center text-gray-500 py-8">
                      No customization details for this product
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT: Summary + Address */}
        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-white border border-gray-300 rounded-xl p-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
           

           <div className="space-y-3 text-sm">
  <div className="flex justify-between">
    <span className="text-gray-600">Subtotal</span>
    <span>£{order.subtotal.toFixed(2)}</span>
  </div>

  {order.discount?.amount > 0 && (
    <div className="flex justify-between text-green-600">
      <span>Discount ({order.discount.percent}%)</span>
      <span>-£{order.discount.amount.toFixed(2)}</span>
    </div>
  )}

  <div className="flex justify-between">
    <span className="text-gray-600">Delivery</span>
    <span>£{order.deliveryCharge.toFixed(2)}</span>
  </div>

  {/* 🔹 PACKAGING SECTION */}
  {order.packaging?.giftWrapCharge > 0 && (
    <div className="flex justify-between">
      <span className="text-gray-600">Gift Wrap</span>
      <span>£{order.packaging.giftWrapCharge.toFixed(2)}</span>
    </div>
  )}

  {order.packaging?.hamperCharge > 0 && (
    <div className="flex justify-between">
      <span className="text-gray-600 capitalize">
        {order.packaging.hamper} Hamper
      </span>
      <span>£{order.packaging.hamperCharge.toFixed(2)}</span>
    </div>
  )}

  <div className="flex justify-between font-semibold text-lg border-t pt-3">
    <span>Total</span>
    <span className="text-green-700">
      £{order.totalAmount.toFixed(2)}
    </span>
  </div>
</div>
          </div>

          {/* Delivery Address */}
         <div className="bg-white border border-gray-300 rounded-lg p-4">
  <h2 className="text-base font-semibold text-gray-900 mb-4">
    Delivery Address
  </h2>

  <div className="text-sm text-gray-700 space-y-1 leading-relaxed">

    <div className="font-semibold text-gray-900">
      {order.deliveryAddress.fullName || "—"}
    </div>

    <div>{order.deliveryAddress.addressLine1 || "—"}</div>

    {order.deliveryAddress.addressLine2 && (
      <div>{order.deliveryAddress.addressLine2}</div>
    )}

    <div className="uppercase">
      {order.deliveryAddress.town || "—"}
    </div>

    {order.deliveryAddress.county && (
      <div>{order.deliveryAddress.county}</div>
    )}

    <div className="font-semibold uppercase tracking-wide">
      {order.deliveryAddress.postcode || "—"}
    </div>

    <div>United Kingdom</div>

    <div className="pt-2 text-xs text-gray-600">
      Phone: {order.deliveryAddress.phone || "—"}
    </div>

    {order.deliveryAddress.email && (
      <div className="text-xs text-gray-600">
        Email: {order.deliveryAddress.email}
      </div>
    )}

  </div>
</div>

        </div>
      </div>
    </div>
  );
}