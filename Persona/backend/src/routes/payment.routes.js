import express from "express";
import Stripe from "stripe";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";
import Settings from "../models/Settings.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";
import { sendMail } from "../utils/mailer.js";
import { orderPlacedTemplate } from "../utils/emailTemplates.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const HAMPERS = {
  basic: 4,
  premium: 9,
  luxury: 14,
};

router.post("/create-checkout-session", optionalAuth, async (req, res) => {
  try {
    const { cart, address, email, couponCode, hamper, giftWrap, orderType = "delivery" } = req.body;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ message: "Invalid or empty cart" });
    }

    // Calculate subtotal
    const subtotal = cart.reduce((s, i) => {
      const price =
        i.price ||
        i.productSnapshot?.specialPrice ||
        i.productSnapshot?.basePrice ||
        0;
      return s + price * (i.quantity || 1);
    }, 0);

    // Coupon logic
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

    // Fetch dynamic shipping settings
    const settings = await Settings.findOne();
    const threshold = settings?.shipping?.threshold ?? 100;
    const charge = settings?.shipping?.deliveryCharge ?? 5;

    let deliveryCharge =
      discountedSubtotal === 0
        ? 0
        : discountedSubtotal >= threshold
          ? 0
          : charge;

    if (orderType === "collect") {
      deliveryCharge = 0;
    }

    const hamperCharge = hamper && HAMPERS[hamper] ? HAMPERS[hamper] : 0;
    const giftWrapCharge = giftWrap ? 5 : 0;
    
    const totalAmount = discountedSubtotal + deliveryCharge + hamperCharge + giftWrapCharge;

    const itemsPayload = cart.map((item) => {
      const productType = item.productSnapshot?.type || item.type || "other";
      const isPrintConfig = ["tshirt", "mug", "hoodie", "mobileCase"].includes(productType);
      const isCustomFields = item.designData?.type === 'custom_fields';
      const hasCustomization = !!(item.designData && (isPrintConfig || isCustomFields));

      return {
        productId: item.productId ? new mongoose.Types.ObjectId(item.productId) : null,
        productSnapshot: {
          name: item.name || item.productSnapshot?.name || "Custom Product",
          slug: item.productSlug || item.productSnapshot?.slug || null,
          productType: productType,
          image: item.image || item.productSnapshot?.image || null,
          finalPrice: Number(item.price || item.productSnapshot?.specialPrice || 0),
        },
        variant: item.variant || {},
        quantity: Number(item.quantity) || 1,
        customization: {
          enabled: hasCustomization,
          type: productType,
          customizationType: isPrintConfig ? 'print_config' : (isCustomFields ? 'custom_fields' : 'none'),
          data: hasCustomization ? {
            productType,
            ...(productType === "tshirt" && {
              tshirt: {
                color: item.variant?.color,
                size: item.variant?.size,
                view_configuration: item.designData.metadata?.view_configuration || {},
                print_areas: item.designData.print_areas || {},
                cloudinary_urls: item.designData.cloudinary_urls || {},
                preview_image_url: item.designData.preview_url || item.designData.previewImage || null,
                preview_urls: item.designData?.preview_urls || { front: item.designData?.preview_url || null, back: null },
                text_layers: item.designData.text_layers || {},
                text_positions: item.designData.text_positions || {},
                text_content: item.designData.text_content || {},
                uploaded_images: Object.entries(item.designData.cloudinary_urls || {}).map(([areaId, url]) => ({
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
                metadata: {
                  design_timestamp: item.designData.metadata?.design_timestamp || new Date(),
                  image_positions: item.designData.metadata?.image_positions || {},
                  text_positions: item.designData.text_positions || {},
                  text_summary: item.designData.metadata?.text_summary || [],
                },
              },
            }),
            ...(productType === "mug" && {
              mug: {
                print_areas: item.designData.print_areas || {},
                cloudinary_urls: item.designData.cloudinary_urls || {},
                preview_urls: item.designData.preview_urls || {},
                preview_image_url: item.designData.preview_url || item.designData.preview_urls?.front || null,
                positions: item.designData.positions || {},
              },
            }),
            ...(isCustomFields && {
              custom_fields: {
                fields: item.designData.fields || [],
                data: item.designData.data || {},
                uploaded_images: item.designData.uploaded_images || {},
                field_count: item.designData.field_count || {}
              }
            })
          } : null,
        },
        designData: item.designData || null,
      };
    });

    const order = await Order.create({
      user: req.user ? req.user._id : null,
      userType: req.user ? "user" : "guest",
      orderType: orderType,
      items: itemsPayload,
      subtotal,
      discount: {
        code: appliedCoupon?.code || null,
        percent: discountPercent,
        amount: discountAmount,
      },
      deliveryCharge,
      packaging: {
        hamper: hamper || null,
        hamperCharge: hamperCharge,
        giftWrap: giftWrap || false,
        giftWrapCharge: giftWrapCharge,
      },
      totalAmount,
      deliveryAddress: {
        fullName: address?.fullName || address?.name || "",
        phone: address?.phone || "",
        email: email || address?.email || "",
        addressLine1: address?.addressLine1 || address?.line1 || "",
        addressLine2: address?.addressLine2 || "",
        town: address?.town || address?.city || "",
        county: address?.county || address?.state || "",
        postcode: address?.postcode || address?.postalCode || "",
        countryCode: "GB",
      },
      orderStatus: "created",
      payment: {
        provider: "stripe",
        status: "pending",
      },
    });

    const lineItems = cart.map((item) => {
      const itemPrice = Number(item.price || item.productSnapshot?.specialPrice || item.productSnapshot?.basePrice || 0);
      const discountedPrice = itemPrice * (1 - discountPercent / 100);

      return {
        price_data: {
          currency: "gbp",
          product_data: {
            name: item.name || item.productSnapshot?.name || "Custom Product",
            images: [item.image || item.productSnapshot?.image || null].filter(Boolean),
            metadata: {
              productId: item.productId,
              productSlug: item.productSlug || item.productSnapshot?.slug,
              productType: item.productSnapshot?.type || "other",
            },
          },
          unit_amount: Math.round(discountedPrice * 100),
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

    if (hamperCharge > 0) {
      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: { name: `Hamper Packaging (${hamper})` },
          unit_amount: hamperCharge * 100,
        },
        quantity: 1,
      });
    }

    if (giftWrapCharge > 0) {
      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: { name: "Gift Wrap" },
          unit_amount: giftWrapCharge * 100,
        },
        quantity: 1,
      });
    }

    const clientUrl = (process.env.CLIENT_BASE_URL || process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

    const sessionConfig = {
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${clientUrl}/order/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
      cancel_url: `${clientUrl}/cart`,
      customer_email: email || address?.email || req.user?.email,
      metadata: {
        orderId: order._id.toString(),
      },
    };

    if (orderType !== "collect") {
      sessionConfig.shipping_address_collection = {
        allowed_countries: ["GB"],
      };
    }

    console.log("Creating checkout session for cart:", JSON.stringify(cart, null, 2));
    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log("Stripe session created:", session.id);

    order.checkoutSessionId = session.id;
    await order.save();
    console.log("Order updated with checkoutSessionId:", order._id);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      orderId: order._id,
    });
  } catch (err) {
    console.error("Checkout route error DETAILED:", {
      message: err.message,
      stack: err.stack,
      body: req.body
    });
    res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
});

router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).send("Webhook Error");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    
    if (orderId) {
      try {
        const order = await Order.findById(orderId).populate("user");
        if (order && order.payment.status !== "paid") {
          order.orderStatus = "paid";
          order.payment.status = "paid";
          order.payment.paymentId = session.payment_intent;
          order.payment.paidAt = new Date();
          await order.save();

          if (order.discount?.code) {
            await Coupon.updateOne({ code: order.discount.code }, { $inc: { usedCount: 1 } });
          }

          // Use various sources for customer email
          const customerEmail = session.customer_details?.email || session.customer_email || order.deliveryAddress?.email || order.user?.email;
          
          if (customerEmail && customerEmail.includes('@')) {
            const clientUrl = (process.env.CLIENT_BASE_URL || process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
            const orderLink = `${clientUrl}/order/${order._id}`;
            
            const emailData = orderPlacedTemplate({
              name: order.deliveryAddress?.fullName || order.user?.firstName || "Customer",
              orderId: order.orderNumber,
              total: (order.totalAmount || 0).toFixed(2),
              orderLink,
            });
            
            console.log(`Sending confirmation email to: ${customerEmail} for order: ${order.orderNumber}`);
            await sendMail({ to: customerEmail, ...emailData });
          } else {
            console.warn(`No valid customer email found for order ${orderId}. Session: ${session.id}`);
          }
        }
      } catch (saveError) {
        console.error("Error processing order completion webhook:", saveError);
      }
    }
  }
  res.json({ received: true });
});

export default router;
