"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { applyCoupon } from "@/services/checkout.service";
import { createCheckoutSession } from "@/services/payment.service";
import { getProductById } from "@/services/product.service";
import LottieAnimation from "@/components/ui/LottieAnimation";
import appliedAnimation from "@/assets/applied.json";
import { useAuth } from "@/context/AuthContext";
import { getMyAccount } from "@/services/account.service";
import { ShieldCheck, SquareRoundCorner, Truck } from "lucide-react";
import HamperSelectionModal from "@/components/hamper/HamperSelectionModal"
import { getPublicSettings } from "@/services/settings.service"


function MugDesignPreview({ designData }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!designData) return null;
  
  const printAreas = designData.print_areas || {};
  const hasDesigns = Object.keys(printAreas).length > 0;
  
  const isWrapDesign = printAreas.full_wrap?.type === "multi";
  const wrapImages = isWrapDesign ? printAreas.full_wrap?.images : null;
  
  if (!hasDesigns) return null;
  
  return (
    <div className="mt-3 border-t pt-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
          ☕ Custom Mug
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-purple-600 hover:text-purple-800"
        >
          {expanded ? "Hide details" : "View design details"}
        </button>
      </div>
      
      {expanded && (
        <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
          {isWrapDesign ? (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Full Wrap Design (Left to Right):</p>
              <div className="grid grid-cols-3 gap-2">
                {wrapImages && Object.entries(wrapImages)
                  .sort((a, b) => (a[1].slot_order || 0) - (b[1].slot_order || 0))
                  .map(([slot, data]) => (
                    <div key={slot} className="bg-white p-2 rounded border">
                      <div className="flex flex-col items-center">
                        {data.url && (
                          <div className="relative w-16 h-16 bg-gray-200 rounded overflow-hidden mb-1">
                            <Image
                              src={data.url}
                              alt={slot}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <p className="text-xs font-medium capitalize">
                          {slot === "front" ? "Front (Left)" : 
                           slot === "center" ? "Center" : "Back (Right)"}
                        </p>
                        {data.position && (
                          <p className="text-[10px] text-gray-400 mt-1">
                            Size: {Math.round((data.position.scale || 0.5) * 100)}%
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Print Areas:</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(printAreas).map(([view, area]) => (
                  <div key={view} className="bg-white p-2 rounded border">
                    <div className="flex items-center gap-2">
                      {area.image?.url && (
                        <div className="relative w-8 h-8 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={area.image.url}
                            alt={area.area}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium capitalize">
                          {view} View
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {area.area?.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    {area.image?.position && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        Size: {Math.round((area.image.position.scale || 0.5) * 100)}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {designData.preview_urls && (
            <div className="text-xs text-gray-600 mt-2 pt-2 border-t">
              <p className="font-medium mb-1">Previews:</p>
              <div className="flex gap-2">
                {designData.preview_urls.front && (
                  <span className="bg-gray-200 px-2 py-0.5 rounded text-[10px]">
                    Front ✓
                  </span>
                )}
                {designData.preview_urls.back && (
                  <span className="bg-gray-200 px-2 py-0.5 rounded text-[10px]">
                    Back ✓
                  </span>
                )}
                {designData.preview_urls.full_wrap && (
                  <span className="bg-gray-200 px-2 py-0.5 rounded text-[10px]">
                    Wrap ✓
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TshirtDesignPreview({ designData }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!designData) return null;
  
  const printAreas = designData.print_areas || {};
  const hasDesigns = Object.keys(printAreas).length > 0;
  
  return (
    <div className="mt-3 border-t pt-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
          🎨 Custom Printed
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {expanded ? "Hide details" : "View design details"}
        </button>
      </div>
      
      {expanded && hasDesigns && (
        <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
          <p className="text-xs font-medium text-gray-700">Print Areas:</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(printAreas).map(([view, area]) => (
              <div key={view} className="bg-white p-2 rounded border">
                <div className="flex items-center gap-2">
                  {area.image?.url && (
                    <div className="relative w-8 h-8 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={area.image.url}
                        alt={area.area}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium capitalize">
                      {area.area?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] text-gray-500 capitalize">
                      {area.view} view
                    </p>
                  </div>
                </div>
                {area.image?.position && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Size: {Math.round((area.image.position.scale || 0.5) * 100)}%
                  </p>
                )}
              </div>
            ))}
          </div>
          
          {designData.metadata?.view_configuration && (
            <div className="text-xs text-gray-600 mt-2 pt-2 border-t">
              {designData.metadata.view_configuration.show_center_chest && (
                <span className="inline-block bg-gray-200 px-2 py-0.5 rounded mr-1">
                  Center Chest
                </span>
              )}
              {designData.metadata.view_configuration.show_left_chest && (
                <span className="inline-block bg-gray-200 px-2 py-0.5 rounded">
                  Left Chest
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CheckoutClient() {
  const { user } = useAuth();
  

  const [items, setItems] = useState([]);
  const [productPrices, setProductPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(true);

  const [address, setAddress] = useState(null);
  const [hamperModalOpen, setHamperModalOpen] = useState(false)
const [selectedHamper, setSelectedHamper] = useState(null)
  const [giftWrap, setGiftWrap] = useState(false)

const HAMPERS = [
  { id: "basic", name: "Silver Level", price: 4 },
  { id: "premium", name: "Gold Level", price: 9 },
  { id: "luxury", name: "Platinum Level", price: 14 }
]
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    town: "",
    county: "",
    postcode: "",
    countryCode: "GB"
  });

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const hasAddress = Boolean(address)

  const [contactForm, setContactForm] = useState({
    fullName: "",
    email: "",
    phone: ""
  });

  useEffect(() => {
    if (user) {
      setContactForm(prev => ({
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }));
    }
  }, [user]);

  const hasContactDetails = Boolean(contactForm.fullName && contactForm.email && contactForm.phone);

  const [shippingConfig, setShippingConfig] = useState({ deliveryCharge: 5, threshold: 100 });

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setItems(cart);
    
    if (cart.length > 0) {
      fetchProductPrices(cart);
    } else {
      setLoadingPrices(false);
    }
    
    fetchShippingSettings();
  }, []);

  const fetchShippingSettings = async () => {
    try {
      const res = await getPublicSettings();
      if (res.data?.shipping) {
        setShippingConfig(res.data.shipping);
      }
    } catch (err) {
      console.error("Failed to load shipping settings:", err);
    }
  };


  useEffect(() => {
    const loadAddress = async () => {
      if (user) {
        setLoadingAddresses(true)

        try {
          const res = await getMyAccount()
          const addresses = res.user?.addresses || []
          setUserAddresses(addresses)

          if (addresses.length > 0) {
            setAddress(addresses[0])
          } else {
            setShowAddressForm(true)
          }
        } catch (err) {
          console.error("Failed to load user addresses", err)
        } finally {
          setLoadingAddresses(false)
        }

      } else {
        const savedAddress = JSON.parse(
          localStorage.getItem("delivery_address") || "null"
        )

        if (savedAddress) {
          setAddress(savedAddress)
        } else {
          setShowAddressForm(true)
        }
      }
    }

    loadAddress()
  }, [user])



  const fetchProductPrices = async (cartItems) => {
    try {
      setLoadingPrices(true);
      const priceMap = {};
      
      const productIds = [...new Set(cartItems.map(item => item.productId))];
      
      await Promise.all(productIds.map(async (id) => {
        try {
          const response = await getProductById(id);
          if (response?.data) {
            priceMap[id] = {
              price: response.data.pricing?.basePrice || 0,
              specialPrice: response.data.pricing?.specialPrice || response.data.pricing?.basePrice || 0,
              currency: 'GBP'
            };
          }
        } catch (error) {
          console.error(`Failed to fetch product ${id}:`, error);
        }
      }));
      
      setProductPrices(priceMap);
    } catch (error) {
      console.error("Error fetching product prices:", error);
    } finally {
      setLoadingPrices(false);
    }
  };

  const getItemPrice = (item) => {
    const productPrice = productPrices[item.productId];
    const price = productPrice?.specialPrice || productPrice?.price || item.unitPrice || item.price || 0;
    
    return {
      amount: price,
      formatted: `£${price.toFixed(2)}`,
      currency: 'GBP'
    };
  };


  /* ---------------- PRICE CALC ---------------- */

  const subtotal = useMemo(
    () => items.reduce((sum, i) => {
      const price = productPrices[i.productId]?.specialPrice || 
                   productPrices[i.productId]?.price || 
                   i.price || 
                   i.unitPrice || 
                   0;
      return sum + (price * (i.quantity || 1));
    }, 0),
    [items, productPrices]
  );


  
  const discountAmount = (subtotal * discount) / 100;
  const deliveryCharge =
    (subtotal - discountAmount) <= 0 ? 0 : (subtotal - discountAmount) >= shippingConfig.threshold ? 0 : shippingConfig.deliveryCharge;
  const totalQuantity = items.reduce(
  (sum, i) => sum + (i.quantity || 1),
  0
)

const uniqueProducts = new Set(
  items.map(i => i.productId)
).size

const isSingleProduct = uniqueProducts === 1

const shouldShowGiftWrap =
  isSingleProduct && totalQuantity === 1

const shouldShowHamper =
  (!isSingleProduct && totalQuantity > 1) ||
  (isSingleProduct && totalQuantity >= 5)

  const selectedHamperData = HAMPERS.find(
  h => h.id === selectedHamper
)

const hamperCharge = selectedHamperData
  ? selectedHamperData.price
  : 0

const giftWrapCharge = giftWrap ? 5 : 0

  const [orderType, setOrderType] = useState("delivery"); // "delivery" or "collect"

  const total =
  subtotal -
  discountAmount +
  (orderType === "collect" ? 0 : deliveryCharge) +
  hamperCharge +
  giftWrapCharge;

  /* ---------------- COUPON ---------------- */

  const handleApplyCoupon = async () => {
    if (applied) return;

    try {
      const res = await applyCoupon(coupon);

      if (!res.valid) {
        setError(res.message || "Invalid coupon");
        setDiscount(0);
        setApplied(false);
      } else {
        setDiscount(res.discount);
        setApplied(true);
        setError("");
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    } catch {
      setError("Coupon validation failed");
    }
  };

  /* ---------------- CART ---------------- */

  const updateQuantity = (id, qty) => {
    if (qty < 1) return;
    const updated = items.map(item => 
      item.id === id ? { ...item, quantity: qty } : item
    );
    setItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const removeItem = (id) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    
    const remainingProductIds = [...new Set(updated.map(i => i.productId))];
    setProductPrices(prev => {
      const newPrices = { ...prev };
      Object.keys(newPrices).forEach(id => {
        if (!remainingProductIds.includes(id)) {
          delete newPrices[id];
        }
      });
      return newPrices;
    });
  };

  /* ---------------- PLACE ORDER ---------------- */

const handlePlaceOrder = async () => {
  if (orderType === "delivery" && !address) {
    alert("Please add a delivery address before placing the order.")
    return
  }
  if (orderType === "collect" && !hasContactDetails) {
    alert("Please provide your contact details before placing the order.")
    return
  }

  try {
    setLoadingPayment(true)

    const cart = JSON.parse(localStorage.getItem("cart") || "[]")

    const cartWithPrices = cart.map(item => ({
      ...item,
      price: getItemPrice(item).amount
    }))

    const finalAddress = orderType === "collect"
      ? {
          fullName: contactForm.fullName || user?.name || "Shop Collection Customer",
          phone: contactForm.phone || user?.phone || "0000000000",
          email: contactForm.email || user?.email || "",
          addressLine1: "Shop Collection",
          town: "Shop",
          postcode: "000000",
          countryCode: "GB"
        }
      : address;

    const data = await createCheckoutSession({
      mode: "cart",
      cart: cartWithPrices,
      couponCode: coupon || null,
      address: finalAddress,
      email: finalAddress?.email || user?.email || null,
      giftWrap,
      hamper: selectedHamper,
      orderType
    })

    if (typeof data === "string") {
      window.open(data, "_self")
      return
    }

    if (!data?.url) {
      throw new Error("Stripe URL missing")
    }

    window.open(data.url, "_self")

  } catch (err) {
    console.error("PLACE ORDER ERROR ❌", err)
    alert(err.message)
  } finally {
    setLoadingPayment(false)
  }
}

  const getProductType = (item) => {
    return item.productSnapshot?.type || item.type || "other";
  };

  const getItemImage = (item) => {
    const productType = item.productSnapshot?.type || item.type || "other";
    
    if (productType === "tshirt" && item.designData?.previewImage) {
      return item.designData.previewImage;
    }
    
    if (productType === "mug" && item.designData?.preview_urls) {
      return item.designData.preview_urls.front || 
             item.designData.preview_urls.back || 
             item.designData.preview_urls.full_wrap ||
             item.image ||
             item.productSnapshot?.image;
    }
    
    return item.image || item.productSnapshot?.image;
  };

  // Format address for display
  const formatAddress = (addr) => {
    if (!addr) return "";
    const parts = [
      addr.fullName,
      addr.addressLine1,
      addr.addressLine2,
      addr.town,
      addr.county,
      addr.postcode
    ].filter(Boolean);
    return parts.join(", ");
  };

  if (loadingPrices) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-[1fr_380px] gap-6">
      {/* LEFT SIDE */}
      <div className="space-y-4">
        {/* ORDER TYPE SELECTION */}
        <div className="bg-white border border-gray-100 p-4 space-y-4 rounded-lg shadow-sm">
          <p className="text-sm font-semibold text-gray-900 mb-2">Order Type</p>
          <div className="flex gap-4">
            <button
              onClick={() => setOrderType("delivery")}
              className={`flex-1 flex flex-col items-center p-3 border rounded-lg transition-all ${
                orderType === "delivery"
                  ? "bg-orange-50 border-orange-500 text-orange-700 shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <Truck className={`w-5 h-5 mb-1 ${orderType === "delivery" ? "text-orange-500" : "text-gray-400"}`} />
              <span className="text-sm font-medium">Delivery</span>
              <span className="text-[10px] opacity-70">To your address</span>
            </button>
            <button
              onClick={() => setOrderType("collect")}
              className={`flex-1 flex flex-col items-center p-3 border rounded-lg transition-all ${
                orderType === "collect"
                  ? "bg-orange-50 border-orange-500 text-orange-700 shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <div className="w-5 h-5 mb-1 flex items-center justify-center font-bold text-lg">🏪</div>
              <span className="text-sm font-medium">Collect from Shop</span>
              <span className="text-[10px] opacity-70">No delivery charge</span>
            </button>
          </div>
        </div>

        {orderType === "collect" ? (
          <div className="bg-white border border-gray-100 p-4 space-y-4 rounded-lg shadow-sm">
            <p className="text-sm font-semibold text-gray-900 mb-2">Contact Details</p>
            <div className="grid gap-3">
              <input
                placeholder="Full Name"
                value={contactForm.fullName}
                onChange={e => setContactForm({ ...contactForm, fullName: e.target.value })}
                className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <input
                placeholder="Email Address"
                value={contactForm.email}
                onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <input
                placeholder="Mobile Number"
                value={contactForm.phone}
                onChange={e => setContactForm({ ...contactForm, phone: e.target.value.replace(/[^0-9+ ]/g, "") })}
                className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
        ) : (
        <div className="bg-white border border-gray-100 p-4 space-y-4">
          {/* DELIVERY ADDRESS */}
          <div className="flex justify-between items-start">
            <div className="space-y-3 w-full">
              <p className="text-sm font-medium">Delivery Address</p>

              {loadingAddresses ? (
                <p className="text-sm text-gray-500">Loading addresses…</p>
              ) : address ? (
                /* ✅ SHOW ADDRESS DETAILS IN SMALL LETTER FORMAT */
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium">{address.fullName}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {address.addressLine1}
                    {address.addressLine2 && `, ${address.addressLine2}`}
                  </p>
                  <p className="text-xs text-gray-600">
                    {address.town}
                    {address.county && `, ${address.county}`} {address.postcode}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{address.phone}</p>
                  {address.email && (
                    <p className="text-xs text-gray-600">{address.email}</p>
                  )}
                </div>
              ) : user ? (
                /* NO ADDRESS FOR LOGGED IN USER */
                <div>
                  <p className="text-sm text-gray-500 mb-2">No address saved yet</p>
                  <Link
                    href="/account/address"
                    className="text-sm text-orange-600 underline inline-block"
                  >
                    Add an address
                  </Link>
                </div>
              ) : (
                /* NO ADDRESS FOR GUEST */
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="text-sm text-orange-600 underline"
                >
                  Add delivery address
                </button>
              )}
            </div>

            {/* CHANGE ADDRESS LINK - Only show if address exists */}
            {address && (
              <div className="ml-4">
                {user ? (
                  <Link
                    href="/account/address"
                    className="text-sm font-medium text-orange-600 hover:underline whitespace-nowrap"
                  >
                    Change
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setShowAddressForm(true);
                      setAddress(null);
                      localStorage.removeItem("delivery_address");
                    }}
                    className="text-sm font-medium text-orange-600 hover:underline whitespace-nowrap"
                  >
                    Change
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ADDRESS FORM - Only show when no address and form is toggled */}
          {!user && !address && showAddressForm && (
            <div className="grid gap-3 border-t pt-4">
              <input
                placeholder="Full Name"
                value={addressForm.fullName}
                onChange={e =>
                  setAddressForm({ ...addressForm, fullName: e.target.value })
                }
                className="border rounded px-3 py-2 text-sm"
              />

              <input
                placeholder="Email Address"
                value={addressForm.email}
                onChange={e =>
                  setAddressForm({ ...addressForm, email: e.target.value })
                }
                className="border rounded px-3 py-2 text-sm"
              />

              <input
                placeholder="Mobile Number"
                value={addressForm.phone}
                onChange={e =>
                  setAddressForm({
                    ...addressForm,
                    phone: e.target.value.replace(/[^0-9+ ]/g, "")
                  })
                }
                className="border rounded px-3 py-2 text-sm"
              />

              <input
                placeholder="House number & Street"
                value={addressForm.addressLine1}
                onChange={e =>
                  setAddressForm({ ...addressForm, addressLine1: e.target.value })
                }
                className="border rounded px-3 py-2 text-sm"
              />

              <input
                placeholder="Address Line 2 (Optional)"
                value={addressForm.addressLine2}
                onChange={e =>
                  setAddressForm({ ...addressForm, addressLine2: e.target.value })
                }
                className="border rounded px-3 py-2 text-sm"
              />

              <input
                placeholder="Town / City"
                value={addressForm.town}
                onChange={e =>
                  setAddressForm({ ...addressForm, town: e.target.value })
                }
                className="border rounded px-3 py-2 text-sm"
              />

              <input
                placeholder="County (Optional)"
                value={addressForm.county}
                onChange={e =>
                  setAddressForm({ ...addressForm, county: e.target.value })
                }
                className="border rounded px-3 py-2 text-sm"
              />

              <input
                placeholder="Postcode"
                value={addressForm.postcode}
                onChange={e =>
                  setAddressForm({
                    ...addressForm,
                    postcode: e.target.value.toUpperCase()
                  })
                }
                className="border rounded px-3 py-2 text-sm uppercase"
              />

              <button
                disabled={
                  !addressForm.fullName ||
                  !addressForm.phone ||
                  !addressForm.addressLine1 ||
                  !addressForm.town ||
                  !addressForm.postcode ||
                  !addressForm.email
                }
                onClick={() => {
                  const newAddress = {
                    ...addressForm,
                    countryCode: "GB"
                  };
                  localStorage.setItem("delivery_address", JSON.stringify(newAddress));
                  setAddress(newAddress);
                  setShowAddressForm(false);
                }}
                className="bg-orange-500 text-white py-2 rounded font-medium disabled:opacity-50"
              >
                Save Address
              </button>
              
              <button
                onClick={() => setShowAddressForm(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        )}

        {/* CART ITEMS */}
        {items.map((item) => {
          const productType = item.productSnapshot?.type || item.type || "other";
          const itemImage = getItemImage(item);
          const priceInfo = getItemPrice(item);
          const itemTotal = priceInfo.amount * (item.quantity || 1);
          
          return (
            <div key={item.id} className="bg-white p-4 flex gap-4 border border-gray-200 rounded-lg hover:shadow-md transition">
              {/* Product Image */}
              <Link href={`/products/${item.productSlug || item.slug}`} className="w-28 h-28 relative flex-shrink-0">
                <Image 
                  src={itemImage} 
                  alt="product image" 
                  fill 
                  className="object-cover rounded"
                  unoptimized={itemImage?.startsWith('data:') || itemImage?.includes('cloudinary')}
                />
                
                {productType === "tshirt" && item.designData && (
                  <span className="absolute top-1 right-1 bg-black text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    👕
                  </span>
                )}
                {productType === "mug" && item.designData && (
                  <span className="absolute top-1 right-1 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    ☕
                  </span>
                )}
              </Link>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex justify-between">
                  <Link href={`/products/${item.productSlug || item.slug}`} className="font-medium hover:underline truncate">
                    {item.name}
                  </Link>
                  <p className="font-semibold text-lg ml-4">
                    £{itemTotal.toFixed(2)}
                  </p>
                </div>

                {item.variant && (
                  <div className="flex gap-2 text-sm text-gray-600">
                    {item.variant.size && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded">
                        Size: {item.variant.size}
                      </span>
                    )}
                    {item.variant.color_label && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded">
                        Color: {item.variant.color_label}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-black">
                    £{priceInfo.amount.toFixed(2)} each
                  </p>
                  {productPrices[item.productId]?.specialPrice && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      Special price
                    </span>
                  )}
                </div>

                {productType === "tshirt" && item.designData && (
                  <TshirtDesignPreview designData={item.designData} />
                )}

                {productType === "mug" && item.designData && (
                  <MugDesignPreview designData={item.designData} />
                )}

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center border border-gray-500 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2 py-1 hover:bg-gray-100 cursor-pointer  text-gray-600"
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          updateQuantity(item.id, val);
                        }
                      }}
                      className="w-12 text-center border-x border-gray-500 px-1 py-1 focus:outline-none"
                    />
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2 py-1 hover:bg-gray-100 cursor-pointer   text-gray-600"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {orderType !== "collect" && deliveryCharge > 0 && (
          <p className="text-xs text-gray-500">
            Add £{(shippingConfig.threshold - subtotal).toFixed(2)} more for FREE delivery
          </p>
        )}
      </div>

      {/* RIGHT SIDE - Summary */}
      <div className="bg-white border-l border-l-gray-200 p-5 space-y-4 sticky top-24 h-fit relative">
        <h3 className="font-semibold text-lg">Price Details</h3>
            {shouldShowGiftWrap && (
  <div className="border rounded p-3 space-y-2">
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={giftWrap}
        onChange={(e) => setGiftWrap(e.target.checked)}
      />
      Gift wrap this product (+£5)
    </label>
  </div>
)}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
            <span className="font-medium">£{subtotal.toFixed(2)}</span>
          </div>

          {applied && (
            <div className="flex justify-between text-green-600">
              <span>Coupon Discount ({discount}%)</span>
              <span>-£{discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-gray-500">
            <span>Delivery Charges</span>
            {orderType === "collect" || deliveryCharge === 0 ? (
              <span className="text-green-600">FREE</span>
            ) : (
              <span>£{deliveryCharge.toFixed(2)}</span>
            )}
          </div>

          {giftWrapCharge > 0 && (
  <div className="flex justify-between text-sm">
    <span>Gift Wrap</span>
    <span>£{giftWrapCharge.toFixed(2)}</span>
  </div>
)}

{hamperCharge > 0 && (
  <div className="flex justify-between text-sm">
    <span>{selectedHamperData?.name}</span>
    <span>£{hamperCharge.toFixed(2)}</span>
  </div>
)}

          <div className="flex justify-between font-semibold border-t pt-3 text-lg">
            <span>Total</span>
            <span>£{total.toFixed(2)}</span>
          </div>
          
          <p className="text-xs text-gray-500">
            Inclusive of all taxes
          </p>
        </div>

    
        
       {shouldShowHamper && (
  <div className="border rounded p-3 space-y-2">
    <p className="text-sm font-medium">Hamper Packaging</p>
            {selectedHamper ? (
              <div className="flex justify-between items-center bg-gray-100 p-3 rounded">
                <span className="text-sm font-medium">{selectedHamperData?.name} Hamper Packaging</span>
                <button
                  onClick={() => setHamperModalOpen(true)}
                  className="text-indigo-600 text-sm hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                onClick={() => setHamperModalOpen(true)}
                className="w-full bg-indigo-600 text-white py-2 rounded"
              >
                Select Hamper
              </button>
            )}
          </div>
        )}
        <div className="border border-gray-200 rounded p-3 space-y-2">
          <p className="text-sm font-medium">Apply Coupon</p>
          <div className="flex gap-2">
            <input
              value={coupon}
              onChange={e => setCoupon(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm"
              disabled={applied}
            />
            <button 
              onClick={handleApplyCoupon} 
              disabled={applied} 
              className="px-4 py-2 border rounded border-gray-300 cursor-pointer  text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {applied ? "Applied" : "Apply"}
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        {showCelebration && (
          <div className="absolute -top-20 right-0 w-40 pointer-events-none">
            <LottieAnimation animationData={appliedAnimation} loop={false} autoplay />
          </div>
        )}

      <button
  onClick={() => {
    if (orderType === "delivery" && !hasAddress) {
      if (user) {
        window.location.href = "/account/address"
      } else {
        setShowAddressForm(true)
      }
      return
    }
    if (orderType === "collect" && !hasContactDetails) {
      alert("Please provide your contact details.");
      return;
    }

    handlePlaceOrder()
  }}
  disabled={loadingPayment || items.length === 0}
  className={`w-full py-3 cursor-pointer rounded font-semibold transition active:scale-[0.98] ${
    (orderType === "collect" ? hasContactDetails : hasAddress)
      ? "bg-orange-500 hover:bg-orange-600 text-white"
      : "bg-gray-400 hover:bg-gray-500 text-white"
  } disabled:opacity-60`}
>
  {loadingPayment ? (
    <span className="flex items-center justify-center gap-2">
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      Processing...
    </span>
  ) : (orderType === "collect" ? hasContactDetails : hasAddress) ? (
    "PLACE ORDER"
  ) : (
    orderType === "collect" ? "ADD CONTACT DETAILS" : "ADD ADDRESS"
  )}
</button>

       <div className="flex items-center justify-center select-none gap-2 text-xs text-gray-500">
  <ShieldCheck className="w-4 h-4 text-green-600" />
  <span>
    Secure payments powered by <span className="font-medium">Stripe</span>
  </span>
</div>
      </div>

      <HamperSelectionModal
        open={hamperModalOpen}
        onClose={() => setHamperModalOpen(false)}
        onSelect={(hamperId) => setSelectedHamper(hamperId)}
        selectedHamper={selectedHamper}
      />

  
    </div>
  );
}