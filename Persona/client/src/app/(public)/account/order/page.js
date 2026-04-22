"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyOrders } from "@/services/order.service";
import { addReview, getProductReviews } from "@/services/review.service";

const STATUS_STYLES = {
  paid:             { bg: "bg-emerald-100", text: "text-emerald-800", label: "Paid" },
  processing:       { bg: "bg-amber-100",   text: "text-amber-800",   label: "Processing" },
  printing:         { bg: "bg-purple-100",  text: "text-purple-800",  label: "Printing" },
  shipped:          { bg: "bg-blue-100",    text: "text-blue-800",    label: "Shipped" },
  delivered:        { bg: "bg-green-100",   text: "text-green-800",   label: "Delivered" },
  out_for_delivery: { bg: "bg-sky-100",     text: "text-sky-800",     label: "Out for Delivery" },
  cancelled:        { bg: "bg-red-100",     text: "text-red-800",     label: "Cancelled" },
};

const REVIEW_ELIGIBLE_STATUSES = ["out_for_delivery", "delivered"];

// Star selector component
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`text-3xl transition-transform hover:scale-110 ${
            star <= (hover || value) ? "text-[#F9A51B]" : "text-gray-300"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// Review Modal
function ReviewModal({ item, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!comment.trim()) {
      setError("Please write a comment.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await addReview(item.productId, { rating, comment });
      if (res.success) {
        onSuccess(item.productId);
      }
    } catch (err) {
      setError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-slate-900 mb-1">Rate & Review</h2>
        <p className="text-sm text-slate-500 mb-5 line-clamp-1">
          {item.productSnapshot?.name}
        </p>

        {/* Product thumbnail */}
        {item.productSnapshot?.image && (
          <div className="flex items-center gap-4 mb-5 p-3 bg-gray-50 rounded-xl">
            <img
              src={item.productSnapshot.image}
              alt={item.productSnapshot.name}
              className="w-14 h-14 object-contain rounded-lg"
            />
            <span className="text-sm font-medium text-slate-700 line-clamp-2">
              {item.productSnapshot.name}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating
            </label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Review
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others what you think about this product..."
              className="w-full p-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-black text-sm"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();

  // reviewedProducts: set of productIds already reviewed by user
  const [reviewedProducts, setReviewedProducts] = useState(new Set());

  // modal state: { item } or null
  const [reviewModal, setReviewModal] = useState(null);

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
    return () => { mounted = false; };
  }, []);

  const handleReviewSuccess = (productId) => {
    setReviewedProducts((prev) => new Set([...prev, productId]));
    setReviewModal(null);
    alert("✅ Your review has been submitted. Thank you!");
  };

  const canReview = (order) =>
    REVIEW_ELIGIBLE_STATUSES.includes(order.orderStatus);

  // ─── Loading ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-slate-500 animate-pulse">Loading your orders...</p>
      </div>
    );
  }

  // ─── Error ───────────────────────────────────────────
  if (error) {
    const isAuthError =
      error.toLowerCase().includes("login") ||
      error.toLowerCase().includes("auth");
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {isAuthError ? "Please sign in" : "Something went wrong"}
            </h2>
            <p className="mt-3 text-slate-600">
              {isAuthError ? "You need to be logged in to view your orders." : error}
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

  // ─── Empty ───────────────────────────────────────────
  if (orders.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <h2 className="text-2xl font-bold text-slate-800">No orders yet</h2>
          <p className="mt-3 text-slate-600">
            When you place your first order, it will appear here.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ─── Orders list ─────────────────────────────────────
  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold mb-8 text-slate-900">My Orders</h1>

        <div className="space-y-6">
          {orders.map((order) => {
            const status = STATUS_STYLES[order.orderStatus] || {
              bg: "bg-gray-100",
              text: "text-gray-800",
              label: order.orderStatus,
            };

            const itemCount = order.items?.length || 0;
            const firstItem = order.items?.[0]?.productSnapshot;
            const summary =
              itemCount === 0
                ? "No items"
                : itemCount === 1
                ? firstItem?.name || "Item"
                : `${firstItem?.name || "Item"} + ${itemCount - 1} more`;

            const eligible = canReview(order);

            return (
              <div
                key={order._id}
                className="bg-white border rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Order Header */}
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100">
                  <div className="flex-1 min-w-0 space-y-1">
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
                    <p className="text-sm text-slate-600 line-clamp-1">{summary}</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
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

                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        £{Number(order.totalAmount).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">Total</p>
                    </div>
                    <Link
                      href={`/order/${order._id}`}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap"
                    >
                      View Details
                    </Link>
                  </div>
                </div>

                {/* Product Items (with review button for eligible orders) */}
                {eligible && (
                  <div className="px-5 sm:px-6 py-4 space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Rate your items
                    </p>
                    {order.items.map((item, idx) => {
                      const alreadyReviewed = reviewedProducts.has(item.productId);
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          {/* Product image */}
                          {item.productSnapshot?.image && (
                            <img
                              src={item.productSnapshot.image}
                              alt={item.productSnapshot?.name}
                              className="w-12 h-12 object-contain rounded-lg shrink-0"
                            />
                          )}

                          {/* Product name */}
                          <p className="flex-1 text-sm font-medium text-slate-800 line-clamp-2">
                            {item.productSnapshot?.name || "Product"}
                          </p>

                          {/* Review button */}
                          {alreadyReviewed ? (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1 whitespace-nowrap">
                              ✓ Reviewed
                            </span>
                          ) : (
                            <button
                              onClick={() => setReviewModal({ item })}
                              className="shrink-0 px-4 py-2 bg-[#F9A51B] hover:bg-[#e6951a] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                            >
                              ★ Add Review
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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

      {/* Review Modal */}
      {reviewModal && (
        <ReviewModal
          item={reviewModal.item}
          onClose={() => setReviewModal(null)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </>
  );
}