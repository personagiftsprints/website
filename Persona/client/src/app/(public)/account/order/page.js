"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyOrders } from "@/services/order.service";

const STATUS_STYLES = {
  paid:       { bg: "bg-emerald-100", text: "text-emerald-800", label: "Paid" },
  processing: { bg: "bg-amber-100",   text: "text-amber-800",   label: "Processing" },
  printing:   { bg: "bg-purple-100",  text: "text-purple-800",  label: "Printing" },
  shipped:    { bg: "bg-blue-100",    text: "text-blue-800",    label: "Shipped" },
  delivered:  { bg: "bg-green-100",   text: "text-green-800",   label: "Delivered" },
  cancelled:  { bg: "bg-red-100",     text: "text-red-800",     label: "Cancelled" },
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();

  useEffect(() => {
    let mounted = true;

    const fetchOrders = async () => {
      try {
        const res = await getMyOrders();
        if (mounted) {
          setOrders(res.orders || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to load orders");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      mounted = false;
    };
  }, []);

  // ────────────────────────────────────────────────
  // Loading state
  // ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 animate-pulse">Loading your orders...</p>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  // Error / Not logged in state
  // ────────────────────────────────────────────────
  if (error) {
    const isAuthError = error.toLowerCase().includes("login") || error.toLowerCase().includes("auth");

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {isAuthError ? "Please sign in" : "Something went wrong"}
            </h2>
            <p className="mt-3 text-slate-600">
              {isAuthError
                ? "You need to be logged in to view your orders."
                : error}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.dispatchEvent(new Event("open-auth"))}
              className="px-8 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              Sign In
            </button>

            <Link
              href="/products"
              className="px-8 py-3 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  // No orders
  // ────────────────────────────────────────────────
  if (orders.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">No orders yet</h2>
            <p className="mt-3 text-slate-600">
              When you place your first order, it will appear here.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-block px-8 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  // Orders list
  // ────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-12">
      <h1 className="text-2xl md:text-3xl font-bold mb-8 text-slate-900">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const status = STATUS_STYLES[order.orderStatus] || {
            bg: "bg-gray-100",
            text: "text-gray-800",
            label: order.orderStatus,
          };

          const firstItem = order.items?.[0]?.productSnapshot;
          const itemCount = order.items?.length || 0;
          const summary =
            itemCount === 0
              ? "No items"
              : itemCount === 1
              ? firstItem?.name || "Item"
              : `${firstItem?.name || "Item"} + ${itemCount - 1} more`;

          return (
            <div
              key={order._id}
              className="bg-white border rounded-xl shadow-sm hover:shadow transition-shadow duration-200 overflow-hidden"
            >
              <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                {/* Left – main info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-slate-900 text-lg">
                      Order #{order.orderNumber}
                    </h3>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 line-clamp-1">{summary}</p>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                    <span>
                      {new Date(order.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                {/* Right – price & action */}
                <div className="flex items-center gap-6 sm:gap-8">
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      £{Number(order.totalAmount).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Total</p>
                  </div>

                  <Link
                    href={`/order/${order._id}`}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/products"
          className="text-slate-600 hover:text-slate-900 text-sm underline"
        >
          Continue shopping →
        </Link>
      </div>
    </div>
  );
}