import express from "express";
import { verifyAuth } from "../middlewares/auth.middleware.js";
import Review from "../models/Review.js";
import Order from "../models/Order.js";

const router = express.Router();

// Get reviews for a product
router.get("/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "firstName lastName")
      .sort({ createdAt: -1 });
    
    // Calculate average rating
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? (reviews.reduce((acc, item) => item.rating + acc, 0) / totalReviews).toFixed(1)
      : 0;

    res.json({ success: true, count: totalReviews, averageRating, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check if user is eligible to review
router.get("/eligibility/:productId", verifyAuth, async (req, res) => {
  try {
    // Check if user has bought this product
    const order = await Order.findOne({
      user: req.user._id,
      "items.productId": req.params.productId,
      orderStatus: { $in: ["delivered", "collected", "out_for_delivery", "processing", "printing", "paid"] } 
    });

    if (!order) {
      return res.json({ success: true, eligible: false, message: "You must purchase this product first." });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({
      product: req.params.productId,
      user: req.user._id
    });

    if (existingReview) {
      return res.json({ success: true, eligible: false, message: "You have already reviewed this product.", review: existingReview });
    }

    res.json({ success: true, eligible: true });
  } catch (error) {
     res.status(500).json({ success: false, message: error.message });
  }
});

// Add a review
router.post("/:productId", verifyAuth, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: "Rating and comment are required." });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({
      product: req.params.productId,
      user: req.user._id
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: "You have already reviewed this product." });
    }

    // Check if user has bought this product
    const order = await Order.findOne({
      user: req.user._id,
      "items.productId": req.params.productId,
      orderStatus: { $in: ["delivered", "collected", "out_for_delivery", "processing", "printing", "paid"] } 
    });

    if (!order) {
      return res.status(400).json({ success: false, message: "You must purchase this product to review it." });
    }

    const review = await Review.create({
      product: req.params.productId,
      user: req.user._id,
      rating: Number(rating),
      comment,
      isVerifiedPurchase: !!order
    });

    // Populate user before sending back
    await review.populate("user", "firstName lastName");

    res.status(201).json({ success: true, data: review, message: "Review submitted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
