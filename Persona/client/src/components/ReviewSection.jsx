"use client";

import { useState, useEffect } from "react";
import { getProductReviews, checkReviewEligibility, addReview } from "@/services/review.service";
import { useAuth } from "@/context/AuthContext";

export default function ReviewSection({ productId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Submit state
  const [eligible, setEligible] = useState(false);
  const [eligibilityMessage, setEligibilityMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchReviews();
      if (user) {
        checkEligibility();
      }
    }
  }, [productId, user]);

  const fetchReviews = async () => {
    try {
      const res = await getProductReviews(productId);
      if (res.success) {
        setReviews(res.data);
        setAvgRating(res.averageRating);
        setTotalCount(res.count);
      }
    } catch (err) {
      console.error("Error fetching reviews", err);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    try {
      const res = await checkReviewEligibility(productId);
      setEligible(res.eligible);
      if (!res.eligible) {
        setEligibilityMessage(res.message);
      }
    } catch (err) {
      console.error("Error checking eligibility", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !comment.trim()) {
      alert("Please provide a rating and a comment.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await addReview(productId, { rating, comment });
      if (res.success) {
        setComment("");
        setRating(5);
        fetchReviews(); // Refresh
        checkEligibility(); // Re-check
        alert(res.message || "Review submitted successfully!");
      }
    } catch (err) {
      alert(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (ratingValue) => {
    return (
      <div className="flex text-[#F9A51B]">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`text-xl ${star <= ratingValue ? "text-[#F9A51B]" : "text-gray-300"}`}>
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) return <div className="mt-10 mb-10 py-8 border-t text-center">Loading reviews...</div>;

  return (
    <div className="mt-16 pt-10 border-t border-gray-200">
      <h2 className="text-2xl font-bold mb-8">Customer Reviews</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Summary & Form */}
        <div className="lg:col-span-1 space-y-8">
          {/* Summary */}
          <div className="bg-gray-50 p-6 rounded-xl">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-4xl font-bold">{avgRating}</span>
              <div>
                {renderStars(Math.round(avgRating))}
                <span className="text-gray-500 text-sm">{totalCount} {totalCount === 1 ? 'review' : 'reviews'}</span>
              </div>
            </div>
          </div>

          {/* Form */}
          {user ? (
            eligible ? (
              <form onSubmit={handleSubmit} className="bg-white p-6 border rounded-xl shadow-sm space-y-4">
                <h3 className="font-semibold text-lg">Write a Review</h3>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Rating</label>
                  <div className="flex text-2xl cursor-pointer">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        onClick={() => setRating(star)}
                        className={`${star <= rating ? "text-[#F9A51B]" : "text-gray-300"} hover:scale-110 transition`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Your Review</label>
                  <textarea
                    rows="4"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Tell others what you think about this product..."
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:bg-gray-400"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            ) : (
              <div className="bg-gray-50 p-6 rounded-xl text-center text-gray-600">
                <p>⚠️ {eligibilityMessage}</p>
              </div>
            )
          ) : (
            <div className="bg-gray-50 p-6 rounded-xl text-center">
              <p className="text-gray-600 mb-4">You must be logged in to write a review.</p>
              <a href="/login" className="inline-block py-2 px-6 bg-black text-white rounded-lg font-medium hover:bg-gray-800">
                Log In
              </a>
            </div>
          )}
        </div>

        {/* Right Column: Reviews List */}
        <div className="lg:col-span-2 space-y-6">
          {reviews.length > 0 ? (
            reviews.map((rev) => (
              <div key={rev._id} className="border-b pb-6 last:border-b-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
                      {rev.user?.firstName ? rev.user.firstName[0].toUpperCase() : "U"}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {rev.user?.firstName} {rev.user?.lastName}
                      </h4>
                      {rev.isVerifiedPurchase && (
                        <span className="text-xs text-green-600 font-medium tracking-wide">✓ Verified Purchase</span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="pl-13">
                  {renderStars(rev.rating)}
                  <p className="mt-2 text-gray-700">{rev.comment}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-lg">No reviews yet. Be the first to review!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
