"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Download, Eye, Smartphone, FileText, Image as ImageIcon, Truck, Store } from "lucide-react";
import { getOrderById } from "@/services/order.service";

const STATUS_STYLE = {
  paid: "bg-emerald-100 text-emerald-700",
  processing: "bg-yellow-100 text-yellow-700",
  printing: "bg-purple-100 text-purple-700",
  out_for_delivery: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700"
};

const STATUS_FLOW = ["paid", "processing", "printing", "out_for_delivery"];

const HAMPER_NAMES = {
  basic: "Silver Level",
  premium: "Gold Level",
  luxury: "Platinum Level",
};

// Download Button Component
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
      className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-md hover:shadow-lg transition-all"
      title="Download image"
    >
      <Download size={16} />
    </button>
  );
};

// View Button Component
const ViewButton = ({ url }) => {
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-md hover:shadow-lg transition-all"
      title="View full size"
    >
      <Eye size={16} />
    </a>
  );
};

// ✅ NEW: Custom Fields Design Preview Component
const CustomFieldsDesignPreview = ({ item, orderNumber }) => {
  const [expanded, setExpanded] = useState(false);
  
  const customization = item.customization?.data?.custom_fields || item.designData;
  const fields = customization?.fields || [];
  const uploadedImages = customization?.uploaded_images || {};
  const formData = customization?.data || {};
  const fieldCount = customization?.field_count || { images: 0, texts: 0 };
  
  if (!fields.length && Object.keys(uploadedImages).length === 0) return null;

  // Separate image and text fields
  const imageFields = fields.filter(f => f.type === 'image');
  const textFields = fields.filter(f => f.type === 'text');

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
            📦 Custom Product
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-teal-600 hover:text-teal-800 underline"
          >
            {expanded ? "Hide details" : "View customization"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-6">
          {/* Uploaded Images Section */}
          {Object.keys(uploadedImages).length > 0 && (
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                <ImageIcon size={16} className="text-teal-600" />
                Uploaded Images ({Object.keys(uploadedImages).length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(uploadedImages).map(([fieldName, url]) => {
                  // Find the field label
                  const field = imageFields.find(f => f.name === fieldName);
                  const label = field?.label || fieldName.replace(/_/g, ' ');
                  
                  return (
                    <div key={fieldName} className="border rounded-lg overflow-hidden bg-gray-50">
                      <div className="bg-teal-500 text-white px-3 py-1.5 text-xs font-medium">
                        {label}
                      </div>
                      <div className="p-3 relative group">
                        <img
                          src={url}
                          alt={label}
                          className="w-full h-32 object-contain"
                        />
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ViewButton url={url} />
                          <DownloadButton
                            url={url}
                            filename={`order-${orderNumber}-${fieldName}.${url.split('.').pop()}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Text Fields Section */}
          {textFields.length > 0 && (
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                <FileText size={16} className="text-teal-600" />
                Text Inputs ({textFields.length})
              </h4>
              <div className="space-y-3">
                {textFields.map((field) => {
                  const value = formData[field.name] || '';
                  
                  return (
                    <div key={field.name} className="bg-gray-50 p-3 rounded-lg border">
                      <p className="text-xs font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      <p className="text-sm bg-white p-2 rounded border">
                        {value || <span className="text-gray-400 italic">No input provided</span>}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Field Summary */}
          {(fieldCount.images > 0 || fieldCount.texts > 0) && (
            <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
              <p>This product includes:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {fieldCount.images > 0 && (
                  <li>{fieldCount.images} image upload{fieldCount.images > 1 ? 's' : ''}</li>
                )}
                {fieldCount.texts > 0 && (
                  <li>{fieldCount.texts} text input{fieldCount.texts > 1 ? 's' : ''}</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Mobile Case Design Preview Component
const MobileCaseDesignPreview = ({ item, orderNumber }) => {
  const [expanded, setExpanded] = useState(false);

  const designData = item.designData || {};
  const modelInfo = designData.model || {};
  const printAreas = designData.print_areas || {};
  const previewUrl = designData.preview_url;
  const cloudinaryUrls = designData.cloudinary_urls || {};

  if (!previewUrl && Object.keys(cloudinaryUrls).length === 0) return null;

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            📱 Custom Phone Case
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-amber-600 hover:text-amber-800 underline"
          >
            {expanded ? "Hide details" : "View details"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Model Information */}
          {modelInfo.name && (
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  {modelInfo.name} ({modelInfo.year})
                </span>
              </div>
              {modelInfo.displaySize && (
                <p className="text-xs text-amber-600 mt-1">
                  Display: {modelInfo.displaySize}
                </p>
              )}
            </div>
          )}

          {/* Main Preview */}
          {previewUrl && (
            <div className="border rounded-lg overflow-hidden bg-gray-50">
              <div className="bg-amber-600 text-white px-4 py-2 text-sm font-medium">
                Design Preview
              </div>
              <div className="p-4 relative group">
                <img
                  src={previewUrl}
                  alt="Case preview"
                  className="w-full max-h-64 object-contain mx-auto"
                />
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ViewButton url={previewUrl} />
                  <DownloadButton
                    url={previewUrl}
                    filename={`order-${orderNumber}-case-preview.png`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Mug Design Preview Component
const MugDesignPreview = ({ item, orderNumber }) => {
  const [expanded, setExpanded] = useState(false);
  
  const mugData = item.customization?.data?.mug || {};
  const printAreas = mugData.print_areas || {};
  const previewUrls = mugData.preview_urls || {};
  const cloudinaryUrls = mugData.cloudinary_urls || {};
  
  // Check if it's a wrap design
  const isWrapDesign = previewUrls.full_wrap || 
    Object.keys(cloudinaryUrls).some(key => key.includes('full_wrap'));
  
  if (!isWrapDesign && Object.keys(printAreas).length === 0) return null;

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
            ☕ Custom Mug Design
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-purple-600 hover:text-purple-800 underline"
          >
            {expanded ? "Hide details" : "View details"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-6">
          {isWrapDesign ? (
            // Full Wrap Design
            <>
              {/* Full Wrap Preview */}
              {previewUrls.full_wrap && (
                <div className="border rounded-lg overflow-hidden bg-gray-50">
                  <div className="bg-purple-600 text-white px-4 py-2 text-sm font-medium">
                    Full Wrap Design
                  </div>
                  <div className="p-4 relative group">
                    <img
                      src={previewUrls.full_wrap}
                      alt="Full wrap preview"
                      className="w-full max-h-64 object-contain mx-auto"
                    />
                    <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ViewButton url={previewUrls.full_wrap} />
                      <DownloadButton
                        url={previewUrls.full_wrap}
                        filename={`order-${orderNumber}-full-wrap.png`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3-Panel Grid */}
              <div className="grid grid-cols-3 gap-3">
                {["front", "center", "back"].map((slot, index) => {
                  const slotKey = Object.keys(cloudinaryUrls).find(key => 
                    key.includes(slot)
                  );
                  const imageUrl = slotKey ? cloudinaryUrls[slotKey] : null;
                  
                  if (!imageUrl) return null;

                  const slotLabels = {
                    front: "Front (Left)",
                    center: "Center",
                    back: "Back (Right)"
                  };

                  return (
                    <div key={slot} className="border rounded-lg overflow-hidden bg-gray-50">
                      <div className="bg-purple-500 text-white px-2 py-1 text-xs font-medium text-center">
                        {slotLabels[slot]}
                      </div>
                      <div className="p-2 relative group">
                        <img
                          src={imageUrl}
                          alt={`${slot} design`}
                          className="w-full h-24 object-contain"
                        />
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ViewButton url={imageUrl} />
                          <DownloadButton
                            url={imageUrl}
                            filename={`order-${orderNumber}-wrap-${slot}.png`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            // Single Side Designs (Front/Back)
            <div className="grid grid-cols-2 gap-4">
              {["front", "back"].map((side) => {
                const previewUrl = previewUrls[side];
                const areaData = printAreas[side];
                const imageUrl = areaData?.image?.url;

                if (!previewUrl && !imageUrl) return null;

                return (
                  <div key={side} className="border rounded-lg overflow-hidden bg-gray-50">
                    <div className="bg-purple-600 text-white px-3 py-2 text-sm font-medium capitalize text-center">
                      {side} View
                    </div>
                    <div className="p-3 relative group">
                      <img
                        src={previewUrl || imageUrl}
                        alt={`${side} design`}
                        className="w-full h-32 object-contain"
                      />
                      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ViewButton url={previewUrl || imageUrl} />
                        <DownloadButton
                          url={previewUrl || imageUrl}
                          filename={`order-${orderNumber}-mug-${side}.png`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// T-Shirt Design Preview Component
const TshirtDesignPreview = ({ item, orderNumber }) => {
  const [expanded, setExpanded] = useState(false);
  
  const tshirtData = item.customization?.data?.tshirt || {};
  const printAreas = tshirtData.print_areas || item.designData?.print_areas || {};
  const previewUrls = tshirtData.preview_urls || item.designData?.preview_urls || {};
  const mainPreview = tshirtData.preview_image_url || item.designData?.preview_url || item.designData?.previewImage;
  
  const printAreaKeys = Object.keys(printAreas || {});
  if (printAreaKeys.length === 0 && !mainPreview) return null;

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
            👕 Custom T-Shirt Design
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-indigo-600 hover:text-indigo-800 underline"
          >
            {expanded ? "Hide details" : "View details"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Side Previews */}
          <div className="grid grid-cols-2 gap-4">
            {["front", "back"].map((side) => {
              const previewUrl = previewUrls[side] || (side === "front" ? mainPreview : null);
              
              if (!previewUrl) return null;

              return (
                <div key={side} className="border rounded-lg overflow-hidden bg-gray-50">
                  <div className="bg-indigo-600 text-white px-3 py-2 text-sm font-medium capitalize text-center">
                    {side} View
                  </div>
                  <div className="p-3 relative group">
                    <img
                      src={previewUrl}
                      alt={`${side} preview`}
                      className="w-full h-32 object-contain"
                    />
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ViewButton url={previewUrl} />
                      <DownloadButton
                        url={previewUrl}
                        filename={`order-${orderNumber}-tshirt-${side}.png`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Print Areas */}
          {printAreaKeys.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Print Areas:</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(printAreas).map(([view, area]) => (
                  <div key={view} className="bg-gray-50 p-2 rounded border text-xs">
                    <p className="font-medium capitalize">{view}</p>
                    <p className="text-gray-600">{area?.area?.replace(/_/g, ' ')}</p>
                    {area?.image?.position?.scale != null && (
                      <p className="text-gray-400 mt-1">
                        Size: {Math.round((area.image.position.scale || 0.5) * 100)}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    getOrderById(orderId)
      .then(res => setOrder(res.order || res))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Loading order…
      </div>
    );
  }

  if (!order || error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2">
        <p className="text-slate-600">Order not found</p>
        <Link href="/" className="underline text-sm">
          Go home
        </Link>
      </div>
    );
  }

  const currentStatus = order.orderStatus;
  const currentIndex = STATUS_FLOW.indexOf(currentStatus);

  const addr = order.deliveryAddress || {};

  const normalizedAddress = {
    fullName: addr.fullName || "",
    addressLine1: addr.addressLine1 || "",
    addressLine2: addr.addressLine2 || "",
    town: addr.town || addr.city || "",
    county: addr.county || addr.state || "",
    postcode: addr.postcode || addr.postalCode || "",
    country:
      addr.countryCode === "GB" ? "United Kingdom" : addr.country || "",
    phone: addr.phone || "",
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Order #{order.orderNumber}</h1>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-slate-500">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>

            <span
              className={`px-3 py-1 text-xs rounded-full font-medium capitalize ${
                STATUS_STYLE[currentStatus]
              }`}
            >
              {currentStatus.replace(/_/g, " ")}
            </span>

            {/* Order Type Badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
              {order.orderType === "collect" ? (
                <>
                  <Store size={14} className="text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">Shop Pick up</span>
                </>
              ) : (
                <>
                  <Truck size={14} className="text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">Home Delivery</span>
                </>
              )}
            </div>
          </div>

          {currentStatus === "cancelled" && (
            <p className="text-sm text-red-600 mt-2">This order has been cancelled.</p>
          )}
        </div>

        {/* Items with Design Previews */}
        <div className="space-y-8">
          {order.items.map((item, i) => {
            const productType = item.productSnapshot?.productType || 
                               item.customization?.type || 
                               "other";
            
            // Check if this is a custom fields product
            const isCustomFields = item.customization?.customizationType === 'custom_fields' ||
                                  item.designData?.type === 'custom_fields';

            return (
              <div key={i} className="border-b pb-6">
                {/* Main Item Row */}
                <div className="flex gap-4">
                  <img
                    src={item.productSnapshot.image}
                    className="w-20 h-20 object-cover rounded"
                    alt=""
                  />

                  <div className="flex-1">
                    <p className="font-medium">{item.productSnapshot.name}</p>

                    {/* Product Type Badge */}
                    <div className="flex gap-2 mt-1">
                      {productType === "tshirt" && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full inline-block">
                          👕 Custom T-Shirt
                        </span>
                      )}
                      {productType === "mug" && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full inline-block">
                          ☕ Custom Mug
                        </span>
                      )}
                      {productType === "mobileCase" && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full inline-block">
                          📱 Custom Phone Case
                        </span>
                      )}
                      {isCustomFields && (
                        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full inline-block">
                          📦 Custom Product
                        </span>
                      )}
                    </div>

                    {/* Model Info for Mobile Case */}
                    {productType === "mobileCase" && item.designData?.model && (
                      <p className="text-xs text-amber-600 mt-1">
                        Model: {item.designData.model.name} ({item.designData.model.year})
                      </p>
                    )}

                    {item.variant && (
                      <p className="text-xs text-slate-500 mt-1">
                        {item.variant.size && `Size: ${item.variant.size}`}
                        {item.variant.color_label && ` · ${item.variant.color_label}`}
                      </p>
                    )}
                  </div>

                  <div className="text-right text-sm">
                    <p className="font-medium">
                      £{(item.productSnapshot.finalPrice * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-slate-500">
                      £{item.productSnapshot.finalPrice} × {item.quantity}
                    </p>
                  </div>
                </div>

                {/* Design Previews */}
                {productType === "tshirt" && (
                  <TshirtDesignPreview item={item} orderNumber={order.orderNumber} />
                )}

                {productType === "mug" && (
                  <MugDesignPreview item={item} orderNumber={order.orderNumber} />
                )}

                {productType === "mobileCase" && (
                  <MobileCaseDesignPreview item={item} orderNumber={order.orderNumber} />
                )}

                {/* ✅ NEW: Custom Fields Preview */}
                {isCustomFields && (
                  <CustomFieldsDesignPreview item={item} orderNumber={order.orderNumber} />
                )}
              </div>
            );
          })}
        </div>

        {/* Address & Summary */}
        <div className="grid sm:grid-cols-2 gap-10 text-sm">
          <div className="space-y-1">
            <p className="font-medium">
              {order.orderType === "collect" ? "Shop Collection Details" : "Delivery address"}
            </p>

            {order.orderType === "collect" ? (
              <div className="bg-indigo-50/60 border border-indigo-100 p-3 rounded-lg space-y-1 text-xs text-indigo-950 mt-1">
                <p className="font-bold text-sm text-indigo-900">🏪 Pickup in Store</p>
                <p className="font-medium">Customer: {normalizedAddress.fullName}</p>
                {normalizedAddress.phone && <p>Phone: {normalizedAddress.phone}</p>}
                <p className="text-slate-500 text-[11px] mt-1 pt-1 border-t border-indigo-100">
                  Please show your order number when picking up at the shop.
                </p>
              </div>
            ) : (
              <>
                <p>{normalizedAddress.fullName}</p>
                <p>{normalizedAddress.addressLine1}</p>

                {normalizedAddress.addressLine2 && <p>{normalizedAddress.addressLine2}</p>}

                <p>
                  {normalizedAddress.town}
                  {normalizedAddress.county && `, ${normalizedAddress.county}`}
                </p>

                <p className="font-medium">{normalizedAddress.postcode}</p>

                <p>{normalizedAddress.country}</p>

                <p className="text-slate-500 mt-1">{normalizedAddress.phone}</p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>£{order.subtotal.toFixed(2)}</span>
            </div>

            {order.discount?.amount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Coupon applied {order.discount.code && <span className="text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 ml-1 uppercase font-bold">{order.discount.code}</span>}</span>
                <span>-£{order.discount.amount.toFixed(2)}</span>
              </div>
            )}

            {order.packaging?.giftWrap && (
              <div className="flex justify-between">
                <span className="text-slate-500">Gift Wrap</span>
                <span>£{order.packaging.giftWrapCharge.toFixed(2)}</span>
              </div>
            )}

            {order.packaging?.hamper && (
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {HAMPER_NAMES[order.packaging.hamper] ||
                    order.packaging.hamper.charAt(0).toUpperCase() +
                      order.packaging.hamper.slice(1)}{" "}
                  Hamper
                </span>
                <span>£{order.packaging.hamperCharge.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-slate-500">Delivery</span>
              <span>£{order.deliveryCharge.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>£{order.totalAmount.toFixed(2)}</span>
            </div>

            <p className="text-xs text-slate-500">Paid via {order.payment?.provider}</p>
            {order.checkoutSessionId?.includes('test') || order.payment?.paymentId?.includes('test') ? (
              <p className="text-xs font-bold text-rose-600">Test Payment</p>
            ) : (
              <p className="text-xs font-bold text-emerald-600">Payment Status: OK</p>
            )}
          </div>
        </div>

        <div className="flex gap-6 text-sm">
          <Link href="/" className="underline">
            Continue shopping
          </Link>

          <Link href="/order" className="underline">
            View all orders
          </Link>
        </div>
      </div>
    </div>
  );
}