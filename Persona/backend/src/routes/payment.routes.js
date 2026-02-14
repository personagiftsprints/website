import express from "express";
import Stripe from "stripe";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";
import { sendMail } from "../utils/mailer.js";
import { orderPlacedTemplate } from "../utils/emailTemplates.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const DELIVERY_THRESHOLD = 100;
const DELIVERY_CHARGE = 20;

router.post("/create-checkout-session", optionalAuth, async (req, res) => {
  try {
    const { cart, address, email, couponCode } = req.body;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ message: "Invalid or empty cart" });
    }

    // Log incoming cart for debugging (remove in production if you want)
    console.log("Received cart:", JSON.stringify(cart, null, 2));

    // Calculate subtotal using safe price access
    const subtotal = cart.reduce((s, i) => {
      const price =
        i.price ||
        i.productSnapshot?.specialPrice ||
        i.productSnapshot?.basePrice ||
        0;
      return s + price * (i.quantity || 1);
    }, 0);

    // Coupon logic (unchanged)
    let discountPercent = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode,
        isActive: true,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } },
        ],
      });

      if (coupon) {
        discountPercent = coupon.discount;
        appliedCoupon = coupon;
      }
    }

    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const discountedSubtotal = subtotal - discountAmount;

    const deliveryCharge =
      discountedSubtotal === 0
        ? 0
        : discountedSubtotal >= DELIVERY_THRESHOLD
          ? 0
          : DELIVERY_CHARGE;

    const totalAmount = discountedSubtotal + deliveryCharge;

    // Inside router.post("/create-checkout-session")
    const itemsPayload = cart.map((item) => {
      const productType = item.productSnapshot?.type || item.type || "other";

      const baseItem = {
        productId: item.productId
          ? new mongoose.Types.ObjectId(item.productId)
          : null,

        productSnapshot: {
          name: item.name || item.productSnapshot?.name || "Custom Product",
          slug: item.productSlug || item.productSnapshot?.slug || null,
          productType: productType,
          image: item.image || item.productSnapshot?.image || null,
          finalPrice: Number(
            item.price || item.productSnapshot?.specialPrice || 0,
          ),
        },

        variant: item.variant || {},

        quantity: Number(item.quantity) || 1,

        // === ENHANCED & CLEAN CUSTOMIZATION ===
        customization: {
          enabled: productType === "tshirt" && !!item.designData,
          type: productType === "tshirt" ? "tshirt" : "none",
          data:
            productType === "tshirt" && item.designData
              ? {
                  productType: "tshirt",
                  tshirt: {
                    // Basic info
                    color: item.variant?.color,
                    size: item.variant?.size,

                    // View settings
                    view_configuration:
                      item.designData.metadata?.view_configuration || {},

                    // Where designs are placed
                    print_areas: item.designData.print_areas || {},

                    // All original uploaded images (very important)
                    cloudinary_urls: item.designData.cloudinary_urls || {},

                    // The final full mockup preview (most important for customer)
                    preview_image_url:
                      item.designData.preview_url ||
                      item.designData.previewImage ||
                      null,

                    // Per-view previews (future-proof)
                    // In itemsPayload → tshirt object
                    preview_urls: item.designData?.preview_urls || {
                      front: item.designData?.preview_url || null,
                      back: null,
                    },
                    // Detailed list of what user uploaded
                    uploaded_images: Object.entries(
                      item.designData.cloudinary_urls || {},
                    ).map(([areaId, url]) => ({
                      area_id: areaId,
                      area_name:
                        item.designData.print_areas?.front?.area === areaId
                          ? "Center Chest"
                          : item.designData.print_areas?.back?.area === areaId
                            ? "Full Back"
                            : areaId,
                      view:
                        item.designData.print_areas?.front?.area === areaId
                          ? "front"
                          : "back",
                      cloudinary_url: url,
                      position: item.designData.positions?.[areaId] || {},
                    })),

                    // Extra metadata
                    metadata: {
                      design_timestamp:
                        item.designData.metadata?.design_timestamp ||
                        new Date(),
                      image_positions:
                        item.designData.metadata?.image_positions || {},
                    },
                  },
                }
              : null,
        },

        // Keep for backward compatibility (safe)
        designData: item.designData || null,
      };

      return baseItem;
    });
    // Create order
    const order = await Order.create({
      user: req.user ? req.user._id : null,
      userType: req.user ? "user" : "guest",
      items: itemsPayload,
      subtotal,
      discount: {
        code: appliedCoupon?.code || null,
        percent: discountPercent,
        amount: discountAmount,
      },
      deliveryCharge,
      totalAmount,
      deliveryAddress: {
        fullName: address?.name || "",
        phone: address?.phone || "",
        email: email || address?.email || "",
        addressLine1: address?.line1 || "",
        city: address?.city || "",
        state: address?.state || "",
        postalCode: address?.postcode || "",
        country: address?.country || "US",
      },
      payment: {
        provider: "stripe",
        status: "pending",
      },
    });

    // Stripe line items - use consistent price source
    const lineItems = cart.map((item) => {
      const itemPrice = Number(
        item.price ||
          item.productSnapshot?.specialPrice ||
          item.productSnapshot?.basePrice ||
          0,
      );

      const discountedPrice = itemPrice * (1 - discountPercent / 100);

      const productData = {
        name: item.name || item.productSnapshot?.name || "Custom Product",
        images: [item.image || item.productSnapshot?.image || null].filter(
          Boolean,
        ),
        metadata: {
          productId: item.productId,
          productSlug: item.productSlug || item.productSnapshot?.slug,
          productType: item.productSnapshot?.type || "other",
        },
      };

      if (item.designData?.preview_url || item.designData?.previewImage) {
        productData.metadata.hasCustomization = "true";
        productData.metadata.previewImage =
          item.designData.preview_url || item.designData.previewImage;
      }

      return {
        price_data: {
          currency: "gbp",
          product_data: productData,
          unit_amount: Math.round(discountedPrice * 100), // pence
        },
        quantity: item.quantity || 1,
      };
    });

    if (deliveryCharge > 0) {
      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: { name: "Delivery Charge" },
          unit_amount: deliveryCharge * 100,
        },
        quantity: 1,
      });
    }

    const clientUrl = (
      process.env.CLIENT_URL || "http://localhost:5173"
    ).replace(/\/$/, "");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${clientUrl}/order/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
      cancel_url: `${clientUrl}/cart`,
      customer_email: email || address?.email || req.user?.email,
      metadata: {
        orderId: order._id.toString(),
        hasCustomItems: cart.some((item) => item.designData) ? "true" : "false",
      },
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB"],
      },
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      orderId: order._id,
    });
  } catch (err) {
    console.error("Checkout route error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
});

router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return res.status(400).send("Webhook Error");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (!orderId) return res.json({ received: true });

    const order = await Order.findById(orderId);
    if (!order || order.payment?.status === "paid") {
      return res.json({ received: true });
    }

    order.orderStatus = "paid";
    order.payment = {
      provider: "stripe",
      paymentId: session.payment_intent,
      status: "paid",
      paidAt: new Date(),
    };

    await order.save();

    if (order.discount?.code) {
      await Coupon.updateOne(
        { code: order.discount.code },
        { $inc: { usedCount: 1 } },
      );
    }

    const customerEmail =
      session.customer_email || order.deliveryAddress?.email;

    if (customerEmail) {
      console.log("📧 Sending order email to:", customerEmail);

      const orderLink = `${process.env.CLIENT_URL}/order/${order._id}`;
      const emailData = orderPlacedTemplate({
        name: order.deliveryAddress?.fullName || "Customer",
        orderId: order.orderNumber,
        total: order.totalAmount.toFixed(2),
        orderLink,
      });

      await sendMail({
        to: customerEmail,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
      });
    }
  }

  res.json({ received: true });
});

export default router;
