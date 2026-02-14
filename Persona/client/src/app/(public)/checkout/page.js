"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { applyCoupon } from "@/services/checkout.service";
import { createCheckoutSession } from "@/services/payment.service";
import { getProductById } from "@/services/product.service"; // ✅ Import price fetching service
import LottieAnimation from "@/components/ui/LottieAnimation";
import appliedAnimation from "@/assets/applied.json";
import { useAuth } from "@/context/AuthContext";
import { getMyAccount } from "@/services/account.service";

// 🎯 T-shirt design preview component
function TshirtDesignPreview({ designData }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!designData) return null;
  
  const printAreas = designData.print_areas || {};
  const previewImage = designData.previewImage;
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
      
      {/* Expanded Details */}
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
          
          {/* Variant Info */}
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
  const [productPrices, setProductPrices] = useState({}); // ✅ Add product prices state
  const [loadingPrices, setLoadingPrices] = useState(true); // ✅ Add loading state
  const [address, setAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    email: "",
    postcode: ""
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

  const DELIVERY_THRESHOLD = 100;
  const DELIVERY_CHARGE = 20;

  /* ---------------- LOAD DATA ---------------- */

  // ✅ Load cart and fetch product prices
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setItems(cart);
    
    if (cart.length > 0) {
      fetchProductPrices(cart);
    } else {
      setLoadingPrices(false);
    }
  }, []);

  // ✅ Function to fetch product prices (same as CartClient)
  const fetchProductPrices = async (cartItems) => {
    try {
      setLoadingPrices(true);
      const priceMap = {};
      
      // Get unique product IDs
      const productIds = [...new Set(cartItems.map(item => item.productId))];
      
      // Fetch prices for each product
      await Promise.all(productIds.map(async (id) => {
        try {
          const response = await getProductById(id);
          if (response?.data) {
            priceMap[id] = {
              price: response.data.pricing?.price || 0,
              specialPrice: response.data.pricing?.specialPrice || response.data.pricing?.price || 0,
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

  // ✅ Function to get the current price for an item (same as CartClient)
  const getItemPrice = (item) => {
    const productPrice = productPrices[item.productId];
    const price = productPrice?.specialPrice || productPrice?.price || item.unitPrice || item.price || 0;
    
    return {
      amount: price,
      formatted: `£${price.toFixed(2)}`,
      currency: 'GBP'
    };
  };

  useEffect(() => {
    const loadAddress = async () => {
      if (user) {
        setLoadingAddresses(true);
        try {
          const res = await getMyAccount();
          const addresses = res.user?.addresses || [];
          setUserAddresses(addresses);
          if (addresses.length > 0) {
            setAddress(addresses[0]);
          }
        } catch (err) {
          console.error("Failed to load user addresses", err);
        } finally {
          setLoadingAddresses(false);
        }
      } else {
        setAddress(
          JSON.parse(localStorage.getItem("delivery_address") || "null")
        );
      }
    };

    loadAddress();
  }, [user]);

  /* ---------------- PRICE CALC ---------------- */

  // ✅ Calculate subtotal using fetched prices
  const subtotal = useMemo(
    () => items.reduce((sum, i) => {
      const price = productPrices[i.productId]?.specialPrice || 
                   productPrices[i.productId]?.price || 
                   i.unitPrice || 
                   i.price || 
                   0;
      return sum + (price * (i.quantity || 1));
    }, 0),
    [items, productPrices]
  );

  const deliveryCharge =
    subtotal === 0 ? 0 : subtotal >= DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;

  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount + deliveryCharge;

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
    
    // ✅ Update product prices after removal
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
    try {
      setLoadingPayment(true);
      
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");

      // ✅ Prepare cart items with latest prices
      const cartWithPrices = cart.map(item => ({
        ...item,
        price: getItemPrice(item).amount // Use the fetched price
      }));

      // Validate address
      if (!address) {
        alert("Please add a delivery address");
        return;
      }

      const data = await createCheckoutSession({
        mode: "cart",
        cart: cartWithPrices, // ✅ Send cart with updated prices
        couponCode: coupon || null,
        address,
        email: address?.email || user?.email || null
      });

      if (typeof data === "string") {
        window.open(data, "_self");
        return;
      }

      if (!data?.url) {
        throw new Error("Stripe URL missing");
      }

      window.open(data.url, "_self");
    } catch (err) {
      console.error("PLACE ORDER ERROR ❌", err);
      alert(err.message);
    } finally {
      setLoadingPayment(false);
    }
  };

  // Get product type for an item
  const getProductType = (item) => {
    return item.product?.type || item.type || "other";
  };

  // Get display image for cart item
  const getItemImage = (item) => {
    if (getProductType(item) === "tshirt" && item.designData?.previewImage) {
      return item.designData.previewImage;
    }
    return item.image || item.productSnapshot?.image;
  };

  // ✅ Show loading state while fetching prices
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
        {/* DELIVERY ADDRESS */}
        <div className="bg-white border border-gray-100 p-4 space-y-4">
          <div className="flex justify-between items-start">
            {user && (
              <div className="space-y-3 w-full">
                <p className="text-sm font-medium">Select Delivery Address</p>

                {loadingAddresses ? (
                  <p className="text-sm text-gray-500">Loading addresses…</p>
                ) : userAddresses.length === 0 ? (
                  <Link
                    href="/account/address"
                    className="text-sm text-orange-600 underline"
                  >
                    Add an address
                  </Link>
                ) : (
                  <div className="space-y-2">
                    {userAddresses.map(addr => (
                      <button
                        key={addr._id}
                        onClick={() => setAddress(addr)}
                        className={`w-full text-left p-3 rounded border ${
                          address?._id === addr._id
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-medium">{addr.fullName}</p>
                        <p className="text-xs text-gray-600">
                          {addr.street}, {addr.city}, {addr.postcode}
                        </p>
                        <p className="text-xs text-gray-600">{addr.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {user ? (
              <Link
                href="/account/address"
                className="text-sm font-medium text-orange-600 hover:underline whitespace-nowrap ml-4"
              >
                {address ? "Change" : "Add Address"}
              </Link>
            ) : (
              <button
                onClick={() => setShowAddressForm(v => !v)}
                className="text-sm font-medium text-orange-600 hover:underline whitespace-nowrap"
              >
                {showAddressForm ? "Cancel" : "Add Address"}
              </button>
            )}
          </div>

          {/* INLINE ADDRESS FORM (GUEST) */}
          {!user && showAddressForm && (
            <div className="grid gap-3 border-t pt-4">
              <input
                placeholder="Full Name"
                value={addressForm.name}
                onChange={e => setAddressForm({ ...addressForm, name: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />
              <input
                placeholder="Email Address"
                type="email"
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
                inputMode="tel"
              />

              <input
                placeholder="House number & Street"
                value={addressForm.line1}
                onChange={e => setAddressForm({ ...addressForm, line1: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />

              <input
                placeholder="City / Town"
                value={addressForm.city}
                onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />

              <input
                placeholder="State / County"
                value={addressForm.state}
                onChange={e => setAddressForm({ ...addressForm, state: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />

              <input
                placeholder="Postcode / ZIP"
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
                  !addressForm.name ||
                  !addressForm.phone ||
                  !addressForm.line1 ||
                  !addressForm.city ||
                  !addressForm.postcode ||
                  !addressForm.email
                }
                onClick={() => {
                  const newAddress = {
                    ...addressForm,
                    country: "US"
                  };
                  localStorage.setItem("delivery_address", JSON.stringify(newAddress));
                  setAddress(newAddress);
                  setShowAddressForm(false);
                }}
                className="bg-orange-500 text-white py-2 rounded font-medium disabled:opacity-50"
              >
                Save Address
              </button>
            </div>
          )}
        </div>

        {/* CART ITEMS */}
        {items.map((item) => {
          const productType = getProductType(item);
          const itemImage = getItemImage(item);
          const priceInfo = getItemPrice(item); // ✅ Get price from fetched data
          const itemTotal = priceInfo.amount * (item.quantity || 1);
          
          return (
            <div key={item.id} className="bg-white p-4 flex gap-4 border rounded-lg hover:shadow-md transition">
              {/* Product Image */}
              <Link href={`/products/${item.slug}`} className="w-28 h-28 relative flex-shrink-0">
                <Image 
                  src={itemImage} 
                  alt="product image" 
                  fill 
                  className="object-cover rounded"
                  unoptimized={itemImage?.startsWith('data:') || itemImage?.includes('cloudinary')}
                />
                
                {/* Custom Product Badge */}
                {productType === "tshirt" && item.designData && (
                  <span className="absolute top-1 right-1 bg-black text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    🎨
                  </span>
                )}
              </Link>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex justify-between">
                  <Link href={`/products/${item.slug}`} className="font-medium hover:underline truncate">
                    {item.name}
                  </Link>
                  <p className="font-semibold text-lg ml-4">
                    £{itemTotal.toFixed(2)}
                  </p>
                </div>

                {/* Variant Display */}
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

                {/* ✅ Price Display - Shows if special price is applied */}
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

                {/* 🎯 T-SHIRT DESIGN PREVIEW */}
                {productType === "tshirt" && item.designData && (
                  <TshirtDesignPreview designData={item.designData} />
                )}

                {/* Quantity Controls */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2 py-1 hover:bg-gray-100 text-gray-600"
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
                      className="w-12 text-center border-x px-1 py-1 focus:outline-none"
                    />
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2 py-1 hover:bg-gray-100 text-gray-600"
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

        {deliveryCharge > 0 && (
          <p className="text-xs text-gray-500">
            Add £{(DELIVERY_THRESHOLD - subtotal).toFixed(2)} more for FREE delivery
          </p>
        )}
      </div>

      {/* RIGHT SIDE - Summary */}
      <div className="bg-white border-l border-l-gray-200 p-5 space-y-4 sticky top-24 h-fit relative">
        <h3 className="font-semibold text-lg">Price Details</h3>

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

          <div className="flex justify-between">
            <span>Delivery Charges</span>
            {deliveryCharge === 0 ? (
              <span className="text-green-600">FREE</span>
            ) : (
              <span>£{deliveryCharge.toFixed(2)}</span>
            )}
          </div>

          <div className="flex justify-between font-semibold border-t pt-3 text-lg">
            <span>Total</span>
            <span>£{total.toFixed(2)}</span>
          </div>
          
          <p className="text-xs text-gray-500">
            Inclusive of all taxes
          </p>
        </div>

        <div className="border rounded p-3 space-y-2">
          <p className="text-sm font-medium">Apply Coupon</p>
          <div className="flex gap-2">
            <input
              value={coupon}
              onChange={e => setCoupon(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="flex-1 border rounded px-3 py-2 text-sm"
              disabled={applied}
            />
            <button 
              onClick={handleApplyCoupon} 
              disabled={applied} 
              className="px-4 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-50"
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
          onClick={handlePlaceOrder}
          disabled={loadingPayment || !address || items.length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded font-semibold disabled:opacity-60 transition active:scale-[0.98]"
        >
          {loadingPayment ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            "PLACE ORDER"
          )}
        </button>

        <div className="text-xs text-center text-gray-500">
          🔒 Secure payments powered by <span className="font-medium">Stripe</span>
        </div>
      </div>
    </div>
  );
}