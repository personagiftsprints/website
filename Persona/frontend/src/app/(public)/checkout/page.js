"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { applyCoupon } from "@/services/checkout.service";
import { createCheckoutSession } from "@/services/payment.service";
import LottieAnimation from "@/components/ui/LottieAnimation";
import appliedAnimation from "@/assets/applied.json";
import { useAuth } from "@/context/AuthContext";
import { getMyAccount } from "@/services/account.service"


export default function CheckoutClient() {
  const { user } = useAuth();
  console.log("Email:", user?.email)

  const [items, setItems] = useState([]);
  const [address, setAddress] = useState(null);

  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    postcode: ""
  });

  const [showAddressForm, setShowAddressForm] = useState(false);

  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [userAddresses, setUserAddresses] = useState([])
const [loadingAddresses, setLoadingAddresses] = useState(false)


  const DELIVERY_THRESHOLD = 100;
  const DELIVERY_CHARGE = 40;

  /* ---------------- LOAD DATA ---------------- */

useEffect(() => {
  setItems(JSON.parse(localStorage.getItem("cart") || "[]"))

  const loadAddress = async () => {
    if (user) {
      setLoadingAddresses(true)
      try {
        const res = await getMyAccount()

        const addresses = res.user?.addresses || []
        setUserAddresses(addresses)

        if (addresses.length > 0) {
          setAddress(addresses[0]) // default selection
        }
      } catch (err) {
        console.error("Failed to load user addresses", err)
      } finally {
        setLoadingAddresses(false)
      }
    } else {
      setAddress(
        JSON.parse(localStorage.getItem("delivery_address") || "null")
      )
    }
  }

  loadAddress()
}, [user])



  /* ---------------- PRICE CALC ---------------- */

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
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

  const updateQuantity = (index, qty) => {
    if (qty < 1) return;
    const updated = [...items];
    updated[index].quantity = qty;
    setItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const removeItem = index => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  /* ---------------- PLACE ORDER ---------------- */

  const handlePlaceOrder = async () => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]")

      const data = await createCheckoutSession({
        mode: "cart",
        cart,
        couponCode: coupon || null,
        address,
        email: user?.email || null
      })

      console.log("CHECKOUT RESPONSE:", data)

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
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-[1fr_380px] gap-6">

      {/* LEFT SIDE */}
      <div className="space-y-4">

        {/* DELIVERY ADDRESS */}
        <div className="bg-white border rounded-lg p-4 space-y-4">

          <div className="flex justify-between items-start">
            {user && (
  <div className="space-y-3">
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
                : "border-gray-200"
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
                className="text-sm font-medium text-orange-600 hover:underline"
              >
                {address ? "Change" : "Add Address"}
              </Link>
            ) : (
              <button
                onClick={() => setShowAddressForm(v => !v)}
                className="text-sm font-medium text-orange-600 hover:underline"
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
                  !addressForm.postcode
                }
                onClick={() => {
                  const newAddress = {
                    ...addressForm,
                    country: "US"   // ← changed from UK
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
        {items.map((item, index) => (
          <div key={index} className="bg-white border rounded-lg p-4 flex gap-4">
            <Link href={`/products/${item.slug}`} className="w-28 h-28 relative">
              <Image src={item.image} alt={item.name} fill className="object-cover rounded" />
            </Link>

            <div className="flex-1 space-y-2">
              <Link href={`/products/${item.slug}`} className="font-medium hover:underline">
                {item.name}
              </Link>

              <p className="font-semibold">£{item.price}</p>

              <div className="flex items-center gap-3">
                <button onClick={() => updateQuantity(index, item.quantity - 1)} className="w-8 h-8 border rounded">−</button>
                <span className="w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(index, item.quantity + 1)} className="w-8 h-8 border rounded">+</button>
              </div>

              <button
                onClick={() => removeItem(index)}
                className="text-xs text-red-600 border px-2 py-1 rounded"
              >
                REMOVE
              </button>
            </div>

            <div className="font-semibold">£{(item.price * item.quantity).toFixed(0)}</div>
          </div>
        ))}

        {deliveryCharge > 0 && (
          <p className="text-xs text-gray-500">
            Add £{DELIVERY_THRESHOLD - subtotal} more for FREE delivery
          </p>
        )}
      </div>

      {/* RIGHT SIDE - Summary */}
      <div className="bg-white border rounded-lg p-5 space-y-4 sticky top-24 h-fit relative">

        <h3 className="font-semibold text-lg">Price Details</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal}</span>
          </div>

          {applied && (
            <div className="flex justify-between text-green-600">
              <span>Coupon Discount</span>
              <span>-£{discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Delivery Charges</span>
            {deliveryCharge === 0 ? (
              <span className="text-green-600">FREE</span>
            ) : (
              <span>£{deliveryCharge}</span>
            )}
          </div>

          <div className="flex justify-between font-semibold border-t pt-3">
            <span>Total</span>
            <span>£{total.toFixed(0)}</span>
          </div>
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
            <button onClick={handleApplyCoupon} disabled={applied} className="px-4 py-2 border rounded text-sm">
              Apply
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
          disabled={loadingPayment || !address}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded font-semibold disabled:opacity-60"
        >
          {loadingPayment ? "Redirecting..." : "PLACE ORDER"}
        </button>

        <div className="text-xs text-center text-gray-500">
          🔒 Secure payments powered by <span className="font-medium">Stripe</span>
        </div>
      </div>
    </div>
  );
}